import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  async create(createProductDto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: createProductDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Product with this SKU already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      return await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Product with this SKU already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      throw error;
    }
  }

  // Stock Maintenance (Increase / Reduce)
  async adjustStock(id: string, adjustment: number) {
    const product = await this.findOne(id);
    const newQuantity = product.quantity + adjustment;

    if (newQuantity < 0) {
      throw new ConflictException('Insufficient stock');
    }

    return await this.prisma.product.update({
      where: { id },
      data: { quantity: newQuantity },
    });
  }
}
