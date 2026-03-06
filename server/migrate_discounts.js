const pool = require('./db');

const migrateDiscounts = async () => {
    try {
        console.log("Starting migration: Discount and Pricing Rules...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS pricing_rules (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL, -- 'Category', 'Customer', 'Global', 'Flash'
                target_id UUID, -- Category ID or Customer ID (null if Global)
                discount_type VARCHAR(20) NOT NULL, -- 'Percentage', 'Fixed'
                discount_value DECIMAL(10, 2) NOT NULL,
                min_order_amount DECIMAL(15, 2) DEFAULT 0.00,
                start_date TIMESTAMP,
                end_date TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("- pricing_rules table created.");

        console.log("Discounts migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrateDiscounts();
