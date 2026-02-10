import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) { }

  async create(createWarehouseDto: CreateWarehouseDto) {
    // Verify brand exists
    const brand = await this.prisma.brand.findUnique({
      where: { id: createWarehouseDto.brandId },
    });

    if (!brand) {
      throw new BadRequestException('Brand not found');
    }

    return await this.prisma.warehouse.create({
      data: createWarehouseDto,
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

    return await this.prisma.warehouse.findMany({
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
            managers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        brand: true,
        managers: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
        stocks: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                basePrice: true,
              },
            },
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto) {
    try {
      return await this.prisma.warehouse.update({
        where: { id },
        data: updateWarehouseDto,
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
        throw new NotFoundException(`Warehouse with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.warehouse.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Warehouse with ID ${id} not found`);
      }
      throw error;
    }
  }

  // Get warehouse stock summary
  async getWarehouseStock(id: string) {
    const warehouse = await this.findOne(id);

    const totalItems = warehouse.stocks.length;
    const totalQuantity = warehouse.stocks.reduce((sum, stock) => sum + stock.quantity, 0);

    return {
      warehouseId: id,
      warehouseName: warehouse.name,
      location: warehouse.location,
      totalItems,
      totalQuantity,
      stocks: warehouse.stocks.map(stock => ({
        productId: stock.product.id,
        productName: stock.product.name,
        sku: stock.product.sku,
        quantity: stock.quantity,
        batchNumber: stock.batchNumber,
        expiryDate: stock.expiryDate,
      })),
    };
  }
}
