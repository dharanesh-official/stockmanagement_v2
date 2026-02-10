import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) { }

  async create(createCustomerDto: CreateCustomerDto) {
    // Verify brand exists
    const brand = await this.prisma.brand.findUnique({
      where: { id: createCustomerDto.brandId },
    });

    if (!brand) {
      throw new BadRequestException('Brand not found');
    }

    return await this.prisma.customer.create({
      data: createCustomerDto,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async findAll(brandId?: string) {
    const where = brandId ? { brandId } : {};

    return await this.prisma.customer.findMany({
      where,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
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
        brand: true,
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
        include: {
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
        },
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
        status: order.status,
        salesPerson: order.salesPerson.fullName,
      })),
    };
  }
}
