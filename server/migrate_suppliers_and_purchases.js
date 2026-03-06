const pool = require('./db');

const migrateSuppliersAndPurchases = async () => {
    try {
        console.log("Starting migration: Suppliers and Purchase Management...");

        // 1. Create Suppliers table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                contact_person VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                address TEXT,
                gst_number VARCHAR(100),
                payment_terms VARCHAR(255),
                outstanding_balance DECIMAL(15, 2) DEFAULT 0.00,
                status VARCHAR(50) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("- suppliers table created.");

        // 2. Create Purchases table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchases (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                reference_number VARCHAR(100),
                status VARCHAR(50) DEFAULT 'Received',
                total_amount DECIMAL(15, 2) DEFAULT 0.00,
                paid_amount DECIMAL(15, 2) DEFAULT 0.00,
                payment_status VARCHAR(50) DEFAULT 'Unpaid',
                payment_method VARCHAR(50),
                purchase_date TIMESTAMP DEFAULT NOW(),
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("- purchases table created.");

        // 3. Create Purchase Items table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchase_items (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
                stock_id UUID REFERENCES stock(id) ON DELETE SET NULL,
                quantity INTEGER NOT NULL CHECK (quantity > 0),
                unit_cost DECIMAL(15, 2) NOT NULL,
                total_cost DECIMAL(15, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("- purchase_items table created.");

        // 4. Create Inventory Transfers table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory_transfers (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                from_shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
                to_shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                status VARCHAR(50) DEFAULT 'Completed',
                notes TEXT,
                transfer_date TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("- inventory_transfers table created.");

        // 5. Create Transfer Items table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory_transfer_items (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                transfer_id UUID REFERENCES inventory_transfers(id) ON DELETE CASCADE,
                stock_id UUID REFERENCES stock(id) ON DELETE CASCADE,
                quantity INTEGER NOT NULL CHECK (quantity > 0),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("- inventory_transfer_items table created.");

        // 6. Update Stock table to include supplier info (optional but useful)
        await pool.query(`
            ALTER TABLE stock 
            ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 10,
            ADD COLUMN IF NOT EXISTS last_purchase_price DECIMAL(15, 2) DEFAULT 0.00,
            ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP;
        `);
        console.log("- stock table updated with supplier fields.");

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrateSuppliersAndPurchases();
