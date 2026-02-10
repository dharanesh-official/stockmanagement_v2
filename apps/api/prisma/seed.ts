import { PrismaClient, OrderStatus, InvoiceStatus, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database with dummy data...');

    // Common Password
    const password = 'StockPro@123';
    const passwordHash = await argon2.hash(password);

    // --- 1. Brands ---
    const brand1 = await prisma.brand.upsert({
        where: { slug: 'tech-world' },
        update: {},
        create: {
            name: 'TechWorld',
            slug: 'tech-world',
            status: 'ACTIVE',
        },
    });

    const brand2 = await prisma.brand.upsert({
        where: { slug: 'fashion-hub' },
        update: {},
        create: {
            name: 'FashionHub',
            slug: 'fashion-hub',
            status: 'ACTIVE',
        },
    });

    console.log(`✅ Brands created: ${brand1.name}, ${brand2.name}`);

    // --- 2. Warehouses ---
    const wh1 = await prisma.warehouse.upsert({
        where: { id: 'wh-tech-main' }, // Using fixed IDs for idempotency if possible, or just create
        update: {},
        create: {
            id: 'wh-tech-main',
            name: 'Tech Main Hub',
            location: 'San Francisco, CA',
            brandId: brand1.id,
        },
    });

    const wh2 = await prisma.warehouse.upsert({
        where: { id: 'wh-fashion-east' },
        update: {},
        create: {
            id: 'wh-fashion-east',
            name: 'Fashion East Center',
            location: 'New York, NY',
            brandId: brand2.id,
        },
    });

    console.log(`✅ Warehouses created: ${wh1.name}, ${wh2.name}`);

    // --- 3. Shops ---
    const shop1 = await prisma.shop.upsert({
        where: { id: 'shop-tech-downtown' },
        update: {},
        create: {
            id: 'shop-tech-downtown',
            name: 'Tech Downtown',
            address: '123 Market St, SF',
            brands: { connect: [{ id: brand1.id }] },
        },
    });

    const shop2 = await prisma.shop.upsert({
        where: { id: 'shop-fashion-mall' },
        update: {},
        create: {
            id: 'shop-fashion-mall',
            name: 'Fashion Mall Outlet',
            address: '456 5th Ave, NY',
            brands: { connect: [{ id: brand2.id }] },
        },
    });

    console.log(`✅ Shops created: ${shop1.name}, ${shop2.name}`);

    // --- 4. Users ---
    // Super Admin
    await prisma.user.upsert({
        where: { email: 'admin@stockpro.com' },
        update: { passwordHash },
        create: {
            email: 'admin@stockpro.com',
            fullName: 'Super Admin',
            passwordHash,
            role: 'SUPER_ADMIN',
            isActive: true,
        },
    });

    // Tech Admin
    await prisma.user.upsert({
        where: { email: 'tech_admin@stockpro.com' },
        update: { passwordHash, brandId: brand1.id },
        create: {
            email: 'tech_admin@stockpro.com',
            fullName: 'Tech Admin',
            passwordHash,
            role: 'BRAND_ADMIN',
            brandId: brand1.id,
            isActive: true,
        },
    });

    // Salesperson (Assigned to TechWorld & Shop 1)
    const salesPerson = await prisma.user.upsert({
        where: { email: 'sales@stockpro.com' },
        update: {
            passwordHash,
            brandId: brand1.id, // Primary brand
            assignedShops: { connect: [{ id: shop1.id }] },
            assignedBrands: { connect: [{ id: brand1.id }] },
            assignedWarehouses: { connect: [{ id: wh1.id }] },
            assignedWarehouseId: wh1.id, // Default warehouse for stock deduction
        },
        create: {
            email: 'sales@stockpro.com',
            fullName: 'Alex Sales',
            passwordHash,
            role: 'SALES_PERSON',
            brandId: brand1.id,
            isActive: true,
            assignedShops: { connect: [{ id: shop1.id }] },
            assignedBrands: { connect: [{ id: brand1.id }] },
            assignedWarehouses: { connect: [{ id: wh1.id }] },
            assignedWarehouseId: wh1.id,
        },
    });

    console.log(`✅ Users created`);

    // --- 5. Products ---
    const productsData = [
        { id: 'prod-iphone15', name: 'iPhone 15', sku: 'IP15-128', basePrice: 799, brandId: brand1.id },
        { id: 'prod-macbook', name: 'MacBook Pro M3', sku: 'MBP-M3-14', basePrice: 1599, brandId: brand1.id },
        { id: 'prod-shirt', name: 'Cotton T-Shirt', sku: 'TS-WHT-L', basePrice: 25, brandId: brand2.id },
        { id: 'prod-jeans', name: 'Denim Jeans', sku: 'DJ-BLU-32', basePrice: 60, brandId: brand2.id },
    ];

    for (const p of productsData) {
        await prisma.product.upsert({
            where: { id: p.id },
            update: {},
            create: {
                id: p.id,
                name: p.name,
                sku: p.sku,
                basePrice: p.basePrice,
                brandId: p.brandId,
                taxRate: 10,
                minStockLevel: 10,
                unit: 'pcs',
                imageUrl: p.brandId === brand1.id
                    ? 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-black-titanium-select?wid=940&hei=1112&fmt=png-alpha'
                    : 'https://im.uniqlo.com/global-cms/spa/res22c1f4e5d6d396eb1132644265481df8fr.jpg',
            },
        });
    }

    console.log(`✅ Products created`);

    // --- 6. Stock ---
    // Add stock to Tech Warehouse
    await prisma.stock.createMany({
        data: [
            { productId: 'prod-iphone15', warehouseId: wh1.id, quantity: 100, batchNumber: 'BATCH-001' },
            { productId: 'prod-macbook', warehouseId: wh1.id, quantity: 50, batchNumber: 'BATCH-001' },
        ],
        skipDuplicates: true,
    });

    // Add stock to Fashion Warehouse
    await prisma.stock.createMany({
        data: [
            { productId: 'prod-shirt', warehouseId: wh2.id, quantity: 500, batchNumber: 'BATCH-F01' },
            { productId: 'prod-jeans', warehouseId: wh2.id, quantity: 200, batchNumber: 'BATCH-F01' },
        ],
        skipDuplicates: true,
    });

    console.log(`✅ Stock added`);

    // --- 7. Customers ---
    const customer1 = await prisma.customer.upsert({
        where: { id: 'cust-john' },
        update: {},
        create: {
            id: 'cust-john',
            fullName: 'John Doe',
            email: 'john@example.com',
            phoneNumber: '555-0101',
            brandId: brand1.id,
        },
    });

    console.log(`✅ Customers created`);

    // --- 8. Orders & Invoices ---
    // Order 1: Confirmed & Invoiced
    const order1Id = 'order-001';
    const order1 = await prisma.order.upsert({
        where: { id: order1Id },
        update: {},
        create: {
            id: order1Id,
            orderNumber: 'ORD-2024-001',
            brandId: brand1.id,
            customerId: customer1.id,
            salesPersonId: salesPerson.id,
            shopId: shop1.id,
            warehouseId: wh1.id,
            status: OrderStatus.CONFIRMED,
            totalAmount: 799 * 2, // 2 iPhones
            taxAmount: (799 * 2) * 0.1,
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
            }
        },
    });

    // Invoice for Order 1
    await prisma.invoice.upsert({
        where: { orderId: order1.id },
        update: {},
        create: {
            invoiceNumber: 'INV-2024-001',
            orderId: order1.id,
            amount: order1.totalAmount,
            status: InvoiceStatus.UNPAID,
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        },
    });

    // Order 2: Pending
    const order2Id = 'order-002';
    await prisma.order.upsert({
        where: { id: order2Id },
        update: {},
        create: {
            id: order2Id,
            orderNumber: 'ORD-2024-002',
            brandId: brand1.id,
            customerId: customer1.id,
            salesPersonId: salesPerson.id,
            shopId: shop1.id,
            warehouseId: wh1.id,
            status: OrderStatus.PENDING,
            totalAmount: 1599, // 1 MacBook
            taxAmount: 159.9,
            discountAmount: 0,
            items: {
                create: [
                    {
                        productId: 'prod-macbook',
                        productName: 'MacBook Pro M3',
                        sku: 'MBP-M3-14',
                        quantity: 1,
                        unitPrice: 1599,
                        totalPrice: 1599,
                    }
                ]
            }
        },
    });

    console.log(`✅ Orders & Invoices created`);

    console.log('------------------------------------------------');
    console.log(`🔐 Password for all users: ${password}`);
    console.log(`1️⃣  Super Admin:      admin@stockpro.com`);
    console.log(`2️⃣  Tech Admin:       tech_admin@stockpro.com`);
    console.log(`3️⃣  Sales Person:     sales@stockpro.com`);
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
