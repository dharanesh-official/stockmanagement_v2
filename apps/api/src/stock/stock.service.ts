import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) { }

  // Stock List (Get all products with their stock levels)
  async findAll() {
    return await this.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        quantity: true,
        minStockLevel: true,
        basePrice: true,
        unit: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  // Stock Increase / Reduce (Manual Adjustment)
  async adjustStock(productId: string, quantity: number, type: 'INCREASE' | 'REDUCE') {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const adjustment = type === 'INCREASE' ? quantity : -quantity;
    const newQuantity = product.quantity + adjustment;

    if (newQuantity < 0) {
      throw new BadRequestException(
        `Adjustment would result in negative stock. Current: ${product.quantity}, Reduction: ${quantity}`
      );
    }

    return await this.prisma.product.update({
      where: { id: productId },
      data: {
        quantity: newQuantity,
      },
    });
  }

  // Get low stock items
  async getLowStock() {
    const products = await this.prisma.product.findMany({
      where: {
        quantity: {
          lte: this.prisma.product.fields.minStockLevel
        }
      }
    });

    return products;
  }
}
