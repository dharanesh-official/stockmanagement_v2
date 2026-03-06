const pool = require('./db');

const migrateReturns = async () => {
    try {
        console.log("Starting migration: Returns and Refunds...");

        // 1. Create Returns table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS returns (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
                shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
                return_number VARCHAR(100) UNIQUE NOT NULL,
                total_refund_amount DECIMAL(15, 2) DEFAULT 0.00,
                reason TEXT,
                status VARCHAR(50) DEFAULT 'Completed',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("- returns table created.");

        // 2. Create Return Items table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS return_items (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
                stock_id UUID REFERENCES stock(id) ON DELETE SET NULL,
                quantity INTEGER NOT NULL CHECK (quantity > 0),
                refund_price DECIMAL(15, 2) NOT NULL,
                total_refund_price DECIMAL(15, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("- return_items table created.");

        // 3. Add index for performance
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_returns_transaction ON returns(transaction_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_returns_customer ON returns(customer_id);`);

        console.log("Returns migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrateReturns();
