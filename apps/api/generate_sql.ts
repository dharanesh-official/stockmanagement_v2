
import * as argon2 from 'argon2';

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function generate() {
    const password = 'StockPro@123';
    try {
        const hash = await argon2.hash(password);

        // Hardcoded IDs for relationship consistency in the SQL
        // Using valid UUID format
        const brandId = 'b0000000-0000-0000-0000-000000000001';
        const warehouseId = 'w0000000-0000-0000-0000-000000000001';

        console.log(`-- BRAND`);
        console.log(`INSERT INTO "Brand" ("id", "name", "slug", "status", "updatedAt", "createdAt") VALUES ('${brandId}', 'StockPro Global', 'stockpro-global', 'ACTIVE', NOW(), NOW()) ON CONFLICT ("slug") DO NOTHING;`);

        console.log(`\n-- WAREHOUSE`);
        console.log(`INSERT INTO "Warehouse" ("id", "name", "location", "brandId", "updatedAt", "createdAt") VALUES ('${warehouseId}', 'Main Distribution Center', 'New York, USA', '${brandId}', NOW(), NOW());`);

        console.log(`\n-- USERS (Password: ${password})`);

        const users = [
            { email: 'admin@stockpro.com', name: 'Super Admin', role: 'SUPER_ADMIN', brandId: null, warehouseId: null },
            { email: 'brand@stockpro.com', name: 'Brand Admin', role: 'BRAND_ADMIN', brandId: brandId, warehouseId: null },
            { email: 'manager@stockpro.com', name: 'Warehouse Manager', role: 'WAREHOUSE_MANAGER', brandId: brandId, warehouseId: warehouseId },
            { email: 'finance@stockpro.com', name: 'Priya Das', role: 'FINANCE_MANAGER', brandId: brandId, warehouseId: null },
            { email: 'sales@stockpro.com', name: 'Amit Singhania', role: 'SALES_PERSON', brandId: brandId, warehouseId: null },
        ];

        for (const u of users) {
            const id = uuidv4();
            const brandVal = u.brandId ? `'${u.brandId}'` : 'NULL';
            const warehouseVal = u.warehouseId ? `'${u.warehouseId}'` : 'NULL';
            console.log(`INSERT INTO "User" ("id", "email", "passwordHash", "fullName", "role", "isActive", "brandId", "assignedWarehouseId", "updatedAt", "createdAt") VALUES ('${id}', '${u.email}', '${hash}', '${u.name}', '${u.role}', true, ${brandVal}, ${warehouseVal}, NOW(), NOW()) ON CONFLICT ("email") DO NOTHING;`);
        }
    } catch (e) {
        console.error(e);
    }
}

generate();
