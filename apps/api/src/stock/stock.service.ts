import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReceiveStockDto, TransferStockDto, AdjustStockDto } from './dto/stock-operations.dto';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) { }

  // Receive stock (add new stock to warehouse)
  async receiveStock(receiveStockDto: ReceiveStockDto) {
    // Verify product and warehouse exist
    const [product, warehouse] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: receiveStockDto.productId } }),
      this.prisma.warehouse.findUnique({ where: { id: receiveStockDto.warehouseId } }),
    ]);

    if (!product) throw new NotFoundException('Product not found');
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    // Check if stock record exists for this product/warehouse/batch combination
    const existingStock = await this.prisma.stock.findFirst({
      where: {
        productId: receiveStockDto.productId,
        warehouseId: receiveStockDto.warehouseId,
        batchNumber: receiveStockDto.batchNumber || null,
      },
    });

    if (existingStock) {
      // Update existing stock
      return await this.prisma.stock.update({
        where: { id: existingStock.id },
        data: {
          quantity: existingStock.quantity + receiveStockDto.quantity,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } else {
      // Create new stock record
      return await this.prisma.stock.create({
        data: receiveStockDto,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }
  }

  // Transfer stock between warehouses
  async transferStock(transferStockDto: TransferStockDto) {
    const { productId, fromWarehouseId, toWarehouseId, quantity, batchNumber } = transferStockDto;

    // Verify warehouses exist
    const [fromWarehouse, toWarehouse] = await Promise.all([
      this.prisma.warehouse.findUnique({ where: { id: fromWarehouseId } }),
      this.prisma.warehouse.findUnique({ where: { id: toWarehouseId } }),
    ]);

    if (!fromWarehouse) throw new NotFoundException('Source warehouse not found');
    if (!toWarehouse) throw new NotFoundException('Destination warehouse not found');

    // Check source stock availability
    const sourceStock = await this.prisma.stock.findFirst({
      where: {
        productId,
        warehouseId: fromWarehouseId,
        batchNumber: batchNumber || null,
      },
    });

    if (!sourceStock) {
      throw new BadRequestException('Stock not found in source warehouse');
    }

    if (sourceStock.quantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${sourceStock.quantity}, Requested: ${quantity}`
      );
    }

    // Perform transfer in a transaction
    return await this.prisma.$transaction(async (tx) => {
      // Reduce from source
      await tx.stock.update({
        where: { id: sourceStock.id },
        data: {
          quantity: sourceStock.quantity - quantity,
        },
      });

      // Add to destination
      const destStock = await tx.stock.findFirst({
        where: {
          productId,
          warehouseId: toWarehouseId,
          batchNumber: batchNumber || null,
        },
      });

      if (destStock) {
        await tx.stock.update({
          where: { id: destStock.id },
          data: {
            quantity: destStock.quantity + quantity,
          },
        });
      } else {
        await tx.stock.create({
          data: {
            productId,
            warehouseId: toWarehouseId,
            quantity,
            batchNumber,
            expiryDate: sourceStock.expiryDate,
          },
        });
      }

      return {
        message: 'Stock transferred successfully',
        from: fromWarehouse.name,
        to: toWarehouse.name,
        quantity,
      };
    });
  }

  // Adjust stock (manual adjustment with reason)
  async adjustStock(adjustStockDto: AdjustStockDto) {
    const { productId, warehouseId, quantity, batchNumber } = adjustStockDto;

    // Find existing stock
    const stock = await this.prisma.stock.findFirst({
      where: {
        productId,
        warehouseId,
        batchNumber: batchNumber || null,
      },
    });

    if (!stock) {
      throw new NotFoundException('Stock record not found');
    }

    const newQuantity = stock.quantity + quantity;

    if (newQuantity < 0) {
      throw new BadRequestException(
        `Adjustment would result in negative stock. Current: ${stock.quantity}, Adjustment: ${quantity}`
      );
    }

    return await this.prisma.stock.update({
      where: { id: stock.id },
      data: {
        quantity: newQuantity,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // Get all stock records
  async findAll(productId?: string, warehouseId?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    if (warehouseId) where.warehouseId = warehouseId;

    return await this.prisma.stock.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            basePrice: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  // Get low stock items
  async getLowStock(brandId?: string) {
    const products = await this.prisma.product.findMany({
      where: brandId ? { brandId } : {},
      include: {
        stocks: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const lowStockItems = products
      .map(product => {
        const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);
        return {
          product,
          totalStock,
          isLow: totalStock <= product.minStockLevel,
        };
      })
      .filter(item => item.isLow)
      .map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        currentStock: item.totalStock,
        minStockLevel: item.product.minStockLevel,
        stockByWarehouse: item.product.stocks.map(stock => ({
          warehouseId: stock.warehouse.id,
          warehouseName: stock.warehouse.name,
          quantity: stock.quantity,
        })),
      }));

    return lowStockItems;
  }
}
