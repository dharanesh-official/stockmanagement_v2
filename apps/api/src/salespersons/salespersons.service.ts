import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class SalespersonsService {
  constructor(
    private prisma: PrismaService,
    private invoicesService: InvoicesService
  ) { }

  async getAssignedShops(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedShops: {
          include: {
            _count: { select: { brands: true } }
          }
        }
      }
    });
    return user?.assignedShops || [];
  }

  async getShopBrands(userId: string, shopId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { assignedBrands: true, assignedShops: { where: { id: shopId } } }
    });

    if (!user || user.assignedShops.length === 0) {
      throw new BadRequestException('Shop not assigned to user');
    }

    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: { brands: true }
    });

    if (!shop) throw new NotFoundException('Shop not found');

    const assignedBrandIds = new Set(user.assignedBrands.map(b => b.id));
    return shop.brands.filter(b => assignedBrandIds.has(b.id));
  }

  async getBrandProducts(brandId: string) {
    return this.prisma.product.findMany({
      where: { brandId },
      include: {
        stocks: true // Optional: show stock info?
      }
    });
  }

  async placeOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { shopId, brandId, items, customerId } = createOrderDto;

    if (!shopId) throw new BadRequestException('Shop ID is required');

    // Verify User Assignment
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedBrands: { where: { id: brandId } },
        assignedShops: { where: { id: shopId } },
        assignedWarehouses: { where: { brandId } } // Find warehouse for this brand assigned to user
      }
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.assignedBrands.length === 0) throw new BadRequestException('Brand not assigned to user');
    if (user.assignedShops.length === 0) throw new BadRequestException('Shop not assigned to user');

    const warehouse = user.assignedWarehouses[0];
    if (!warehouse) throw new BadRequestException('No warehouse assigned for this brand');

    // Check Stock & Prepare Transaction
    const order = await this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let taxAmount = 0;
      const orderItems: any[] = [];

      // Fetch products
      const productIds = items.map(i => i.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });

      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) throw new BadRequestException(`Product ${item.productId} not found`);

        // Stock Logic
        const stocks = await tx.stock.findMany({
          where: { warehouseId: warehouse.id, productId: item.productId, quantity: { gt: 0 } },
          orderBy: { expiryDate: 'asc' }
        });

        const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);
        if (totalStock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${product.name}. Available: ${totalStock}, Requested: ${item.quantity}`);
        }

        let remaining = item.quantity;
        for (const stock of stocks) {
          if (remaining <= 0) break;
          const deduction = Math.min(stock.quantity, remaining);
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: { decrement: deduction } }
          });
          remaining -= deduction;
        }

        // Calculate Costs
        const itemTotal = Number(item.unitPrice) * item.quantity;
        const itemTax = itemTotal * (Number(product.taxRate) / 100);

        totalAmount += itemTotal;
        taxAmount += itemTax;

        orderItems.push({
          productId: item.productId,
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: itemTotal
        });
      }

      const discountAmount = createOrderDto.discountAmount || 0;

      // Handle Customer Requirement
      // If CreateOrderDto has customerId, use it.
      // If not, and schema requires it, we must find one or fail.
      // Assuming we must have customerId for now as per schema.
      // The frontend should pick a customer linked to the shop? Or creating refined flow.
      // For now, if no customerId, check if Shop has a manager or something?
      // If customerId is missing and schema requires it, this will fail.

      let finalCustomerId = customerId;

      if (!finalCustomerId) {
        // Find or create default "Walk-in Customer" for this brand
        let defaultCustomer = await tx.customer.findFirst({
          where: {
            brandId,
            fullName: 'Walk-in Customer'
          }
        });

        if (!defaultCustomer) {
          defaultCustomer = await tx.customer.create({
            data: {
              fullName: 'Walk-in Customer',
              email: `walkin-${brandId.substring(0, 8)}@example.com`,
              phoneNumber: '0000000000',
              brandId,
              address: 'Shop Counter'
            }
          });
        }
        finalCustomerId = defaultCustomer.id;
      }

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      return await tx.order.create({
        data: {
          orderNumber,
          brandId,
          shopId,
          warehouseId: warehouse.id,
          salesPersonId: userId,
          customerId: finalCustomerId,
          status: OrderStatus.PENDING,
          totalAmount: totalAmount + taxAmount - Number(discountAmount),
          taxAmount,
          discountAmount: discountAmount,
          items: {
            create: orderItems
          }
        }
      });
    });

    // Auto-generate invoice
    try {
      await this.invoicesService.generateInvoice(order.id);
    } catch (e) {
      console.error(`Failed to generate invoice for order ${order.id}`, e);
    }

    return order;
  }
}
