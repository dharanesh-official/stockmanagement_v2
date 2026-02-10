import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  async create(createProductDto: CreateProductDto) {
    // Verify brand exists
    const brand = await this.prisma.brand.findUnique({
      where: { id: createProductDto.brandId },
    });

    if (!brand) {
      throw new BadRequestException('Brand not found');
    }

    try {
      return await this.prisma.product.create({
        data: createProductDto,
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
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Product with this SKU already exists for this brand');
      }
      throw error;
    }
  }

  async findAll(brandId?: string) {
    const where = brandId ? { brandId } : {};

    return await this.prisma.product.findMany({
      where,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            stocks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        stocks: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
      },
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
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Product with this SKU already exists for this brand');
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

  // Get total stock across all warehouses for a product
  async getProductStock(id: string) {
    const product = await this.findOne(id);

    const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);

    return {
      productId: id,
      productName: product.name,
      sku: product.sku,
      totalStock,
      stockByWarehouse: product.stocks.map(stock => ({
        warehouseId: stock.warehouse.id,
        warehouseName: stock.warehouse.name,
        quantity: stock.quantity,
        batchNumber: stock.batchNumber,
        expiryDate: stock.expiryDate,
      })),
    };
  }
}
