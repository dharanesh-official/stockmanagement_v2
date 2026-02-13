import { PrismaClient, OrderStatus, InvoiceStatus, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding simplified database...');

    const password = 'StockPro@123';
    const passwordHash = await argon2.hash(password);

    // --- 1. Users ---
    const admin = await prisma.user.upsert({
        where: { email: 'admin@stockpro.com' },
        update: { passwordHash },
        create: {
            email: 'admin@stockpro.com',
            fullName: 'Main Administrator',
            passwordHash,
            role: UserRole.ADMIN,
            isActive: true,
        },
    });

    const salesperson = await prisma.user.upsert({
        where: { email: 'sales@stockpro.com' },
        update: { passwordHash },
        create: {
            email: 'sales@stockpro.com',
            fullName: 'Alex Sales',
            passwordHash,
            role: UserRole.SALES_PERSON,
            isActive: true,
        },
    });

    console.log(`✅ Users created: ${admin.email}, ${salesperson.email}`);

    // --- 2. Products ---
    const products = [
        { id: 'prod-iphone15', name: 'iPhone 15', sku: 'IP15-128', basePrice: 799, quantity: 50 },
        { id: 'prod-macbook', name: 'MacBook Pro M3', sku: 'MBP-M3-14', basePrice: 1599, quantity: 20 },
        { id: 'prod-shirt', name: 'Cotton T-Shirt', sku: 'TS-WHT-L', basePrice: 25, quantity: 100 },
        { id: 'prod-jeans', name: 'Denim Jeans', sku: 'DJ-BLU-32', basePrice: 60, quantity: 80 },
    ];

    for (const p of products) {
        await prisma.product.upsert({
            where: { id: p.id },
            update: { quantity: p.quantity },
            create: {
                id: p.id,
                name: p.name,
                sku: p.sku,
                basePrice: p.basePrice,
                quantity: p.quantity,
                minStockLevel: 5,
                unit: 'pcs',
            },
        });
    }
    console.log(`✅ Products created: ${products.length}`);

    // --- 3. Customers ---
    const customer = await prisma.customer.upsert({
        where: { email: 'john@example.com' },
        update: {},
        create: {
            fullName: 'John Doe',
            email: 'john@example.com',
            phoneNumber: '555-0101',
            address: '123 Main St, New York',
        },
    });
    console.log(`✅ Customer created: ${customer.fullName}`);

    // --- 4. Orders & Invoices ---
    const order = await prisma.order.create({
        data: {
            orderNumber: 'ORD-2024-001',
            type: OrderStatus.SALES,
            customerId: customer.id,
            salesPersonId: salesperson.id,
            totalAmount: 1598,
            discountAmount: 0,
            items: {
                create: [
                    {
                        productId: 'prod-iphone15',
                        productName: 'iPhone 15',
                        sku: 'IP15-128',
                        quantity: 2,
                        unitPrice: 799,
                        totalPrice: 1598,
                    }
                ]
            },
            invoice: {
                create: {
                    invoiceNumber: 'INV-2024-001',
                    amount: 1598,
                    paidAmount: 0,
                    status: InvoiceStatus.UNPAID,
                }
            }
        }
    });
    console.log(`✅ Order & Invoice created: ${order.orderNumber}`);

    console.log('------------------------------------------------');
    console.log(`🔐 Password for all users: ${password}`);
    console.log(`1️⃣  Admin:          admin@stockpro.com`);
    console.log(`2️⃣  Sales Person:    sales@stockpro.com`);
    console.log('------------------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
