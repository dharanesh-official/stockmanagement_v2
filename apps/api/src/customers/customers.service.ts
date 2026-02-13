import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) { }

  async create(createCustomerDto: CreateCustomerDto) {
    return await this.prisma.customer.create({
      data: createCustomerDto,
    });
  }

  async findAll() {
    return await this.prisma.customer.findMany({
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            salesPerson: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Last 10 orders
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    try {
      return await this.prisma.customer.update({
        where: { id },
        data: updateCustomerDto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.customer.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }
      throw error;
    }
  }

  // Lock / Unlock Customer
  async toggleLock(id: string, isLocked: boolean) {
    return await this.prisma.customer.update({
      where: { id },
      data: { isLocked },
    });
  }

  // Get customer purchase history
  async getPurchaseHistory(id: string) {
    const customer = await this.findOne(id);

    const totalOrders = customer.orders.length;
    const totalSpent = customer.orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    return {
      customerId: id,
      customerName: customer.fullName,
      totalOrders,
      totalSpent,
      orders: customer.orders.map(order => ({
        orderId: order.id,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        amount: order.totalAmount,
        type: order.type,
        salesPerson: order.salesPerson.fullName,
      })),
    };
  }
}
