import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { InvoicesService } from '../invoices/invoices.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private invoicesService: InvoicesService
  ) { }

  async create(createOrderDto: CreateOrderDto) {
    if (!createOrderDto.brandId) throw new BadRequestException('Brand ID is required');
    if (!createOrderDto.customerId) throw new BadRequestException('Customer ID is required');
    if (!createOrderDto.salesPersonId) throw new BadRequestException('Salesperson ID is required');

    // Verify brand, customer, and salesperson exist
    const [brand, customer, salesPerson] = await Promise.all([
      this.prisma.brand.findUnique({ where: { id: createOrderDto.brandId } }),
      this.prisma.customer.findUnique({ where: { id: createOrderDto.customerId } }),
      this.prisma.user.findUnique({ where: { id: createOrderDto.salesPersonId } }),
    ]);

    if (!brand) throw new BadRequestException('Brand not found');
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
    let taxAmount = 0;

    const orderItems = createOrderDto.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = itemTotal * (Number(product.taxRate) / 100);

      totalAmount += itemTotal;
      taxAmount += itemTax;

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
    const finalTotal = totalAmount + taxAmount - discountAmount;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order with items
    return await this.prisma.order.create({
      data: {
        orderNumber,
        brandId: createOrderDto.brandId,
        customerId: createOrderDto.customerId!,
        salesPersonId: createOrderDto.salesPersonId!,
        totalAmount: finalTotal,
        taxAmount,
        discountAmount,
        status: OrderStatus.PENDING,
        items: {
          create: orderItems,
        },
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
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
            email: true,
          },
        },
        items: true,
      },
    });
  }

  async findAll(brandId?: string, salesPersonId?: string, status?: OrderStatus) {
    const where: any = {};
    if (brandId) where.brandId = brandId;
    if (salesPersonId) where.salesPersonId = salesPersonId;
    if (status) where.status = status;

    return await this.prisma.order.findMany({
      where,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
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
        brand: true,
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
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    try {
      // Extract only updatable fields (exclude items array which requires separate handling)
      const { items, ...updateData } = updateOrderDto;

      return await this.prisma.order.update({
        where: { id },
        data: updateData as any,
        include: {
          brand: true,
          customer: true,
          salesPerson: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          items: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.update(id, { status });

    if (status === OrderStatus.CONFIRMED) {
      await this.invoicesService.generateInvoice(id);
    }

    return order;
  }

  async remove(id: string) {
    try {
      // Delete order items first, then order
      await this.prisma.orderItem.deleteMany({
        where: { orderId: id },
      });

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

  // Get order statistics
  async getOrderStats(brandId?: string) {
    const where = brandId ? { brandId } : {};

    const [total, pending, confirmed, delivered, cancelled] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.CONFIRMED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }),
    ]);

    const totalRevenue = await this.prisma.order.aggregate({
      where: { ...where, status: { not: OrderStatus.CANCELLED } },
      _sum: {
        totalAmount: true,
      },
    });

    return {
      total,
      pending,
      confirmed,
      delivered,
      cancelled,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    };
  }
}
