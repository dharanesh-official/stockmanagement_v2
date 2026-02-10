import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
    constructor(private prisma: PrismaService) { }

    async findAll(salesPersonId?: string) {
        return this.prisma.invoice.findMany({
            where: salesPersonId ? {
                order: {
                    salesPersonId
                }
            } : {},
            include: {
                order: {
                    include: {
                        brand: true,
                        customer: true,
                        salesPerson: true,
                        shop: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string) {
        return this.prisma.invoice.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        items: true,
                        brand: true,
                        customer: true,
                        salesPerson: true,
                        shop: true,
                    }
                }
            }
        });
    }

    async generateInvoice(orderId: string) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new Error('Order not found');

        // Check if invoice already exists
        const existing = await this.prisma.invoice.findUnique({ where: { orderId } });
        if (existing) return existing;

        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        return this.prisma.invoice.create({
            data: {
                orderId,
                invoiceNumber,
                amount: order.totalAmount,
                status: InvoiceStatus.UNPAID,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
            }
        });
    }
}
