import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class SalespersonsService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.user.findMany({
      where: { role: UserRole.SALES_PERSON },
      include: {
        _count: {
          select: { salesOrders: true }
        }
      }
    });
  }

  async getPerformance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        salesOrders: {
          include: {
            customer: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) throw new NotFoundException('Salesperson not found');

    const totalSales = user.salesOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    return {
      userId,
      fullName: user.fullName,
      email: user.email,
      totalOrders: user.salesOrders.length,
      totalSales,
      orders: user.salesOrders
    };
  }
}
