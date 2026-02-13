import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    // Record a payment from a customer
    async recordPayment(createPaymentDto: CreatePaymentDto) {
        const { orderId, amount, paymentMethod, reference, collectedById } = createPaymentDto;

        // Verify order exists
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { invoice: true }
        });

        if (!order) throw new NotFoundException('Order not found');
        if (!order.invoice) throw new BadRequestException('No invoice found for this order');

        const paymentNumber = `PAY-${Date.now()}`;

        // Create payment record
        const payment = await this.prisma.payment.create({
            data: {
                paymentNumber,
                amount,
                paymentMethod,
                reference,
                order: orderId ? { connect: { id: orderId } } : undefined,
                customer: { connect: { id: order.customerId } },
                collectedBy: { connect: { id: collectedById } },
            }
        });

        // Update invoice paid amount
        const paidAmount = Number(order.invoice.paidAmount) + amount;
        const invoiceStatus = paidAmount >= Number(order.invoice.amount) ? 'PAID' : 'PARTIALLY_PAID';

        await this.prisma.invoice.update({
            where: { id: order.invoice.id },
            data: {
                paidAmount,
                status: invoiceStatus as any
            }
        });

        return payment;
    }

    // Get all payments
    async findAllPayments() {
        return await this.prisma.payment.findMany({
            include: {
                customer: { select: { fullName: true } },
                collectedBy: { select: { fullName: true } },
                order: { select: { orderNumber: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Get Bill Dues (Customers with unpaid/partially paid invoices)
    async getBillDues() {
        const invoices = await this.prisma.invoice.findMany({
            where: {
                status: { in: ['UNPAID', 'PARTIALLY_PAID'] as any }
            },
            include: {
                order: {
                    include: {
                        customer: {
                            select: {
                                id: true,
                                fullName: true,
                                phoneNumber: true,
                                address: true
                            }
                        }
                    }
                }
            }
        });

        // Group by customer
        const duesByCustomer = new Map();

        for (const inv of invoices) {
            if (!inv.order?.customer) continue;
            const customerId = inv.order.customer.id;
            const dueAmount = Number(inv.amount) - Number(inv.paidAmount || 0);

            if (!duesByCustomer.has(customerId)) {
                duesByCustomer.set(customerId, {
                    customer: inv.order.customer,
                    totalDue: 0,
                    invoicesCount: 0
                });
            }

            const entry = duesByCustomer.get(customerId);
            entry.totalDue += dueAmount;
            entry.invoicesCount += 1;
        }

        return Array.from(duesByCustomer.values());
    }
}
