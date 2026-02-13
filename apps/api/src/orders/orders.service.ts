import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  async create(createOrderDto: CreateOrderDto) {
    if (!createOrderDto.customerId) throw new BadRequestException('Customer ID is required');
    if (!createOrderDto.salesPersonId) throw new BadRequestException('Salesperson ID is required');

    // Verify customer and salesperson exist
    const [customer, salesPerson] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: createOrderDto.customerId } }),
      this.prisma.user.findUnique({ where: { id: createOrderDto.salesPersonId } }),
    ]);

    if (!customer) throw new BadRequestException('Customer not found');
    if (!salesPerson) throw new BadRequestException('Salesperson not found');

    // Get product details for all items
    const productIds = createOrderDto.items.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    // Calculate totals
    let totalAmount = 0;

    const orderItems = createOrderDto.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      const itemTotal = item.quantity * item.unitPrice;
      totalAmount += itemTotal;

      return {
        productId: item.productId,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
      };
    });

    const discountAmount = createOrderDto.discountAmount || 0;
    const finalTotal = totalAmount - discountAmount;

    // Generate prefix based on type
    const type = createOrderDto.type || OrderStatus.ORDER;
    const prefix = type === OrderStatus.SALES ? 'SAL' : (type === OrderStatus.CREDIT_NOTE ? 'CRN' : 'ORD');
    const orderNumber = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId: createOrderDto.customerId,
        salesPersonId: createOrderDto.salesPersonId,
        totalAmount: finalTotal,
        discountAmount,
        type: type,
        items: {
          create: orderItems,
        },
      },
      include: {
        customer: true,
        salesPerson: true,
        items: true,
      },
    });

    // If it's a SALE, auto-generate an invoice and reduce stock
    if (type === OrderStatus.SALES) {
      await this.prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${order.orderNumber.split('-').slice(1).join('-')}`,
          orderId: order.id,
          amount: finalTotal,
          status: 'UNPAID',
        },
      });

      // Reduce stock
      for (const item of createOrderDto.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } }
        });
      }
    }

    return order;
  }

  async findAll(type?: OrderStatus, salesPersonId?: string) {
    const where: any = {};
    if (type) where.type = type;
    if (salesPersonId) where.salesPersonId = salesPersonId;

    return await this.prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
        salesPerson: {
          select: {
            id: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
        invoice: true
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        salesPerson: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        items: true,
        invoice: true
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    try {
      const { items, ...updateData } = updateOrderDto;

      return await this.prisma.order.update({
        where: { id },
        data: updateData as any,
        include: {
          customer: true,
          salesPerson: true,
          items: true,
          invoice: true
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // Delete order items first, then invoice, then order
      await this.prisma.orderItem.deleteMany({ where: { orderId: id } });
      await this.prisma.invoice.deleteMany({ where: { orderId: id } });

      return await this.prisma.order.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      throw error;
    }
  }

  async getOrderStats() {
    const [total, orders, sales, credits] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { type: OrderStatus.ORDER } }),
      this.prisma.order.count({ where: { type: OrderStatus.SALES } }),
      this.prisma.order.count({ where: { type: OrderStatus.CREDIT_NOTE } }),
    ]);

    const totalRevenue = await this.prisma.order.aggregate({
      where: { type: OrderStatus.SALES },
      _sum: {
        totalAmount: true,
      },
    });

    return {
      total,
      orders,
      sales,
      credits,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    };
  }
}
