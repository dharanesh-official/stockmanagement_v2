const pool = require('./db');

const alterShopsTable = async () => {
    try {
        await pool.query(`
            ALTER TABLE shops 
            ADD COLUMN IF NOT EXISTS shop_code VARCHAR(50),
            ADD COLUMN IF NOT EXISTS shop_type VARCHAR(50) DEFAULT 'Retail',
            ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50),
            ADD COLUMN IF NOT EXISTS city VARCHAR(100),
            ADD COLUMN IF NOT EXISTS state VARCHAR(100),
            ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
            ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS notes TEXT,
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';
        `);
        console.log("shops table altered successfully.");

        // We will also use this opportunity to seed shop_type and status for existing rows if null
        await pool.query(`UPDATE shops SET shop_type = 'Retail' WHERE shop_type IS NULL`);
        await pool.query(`UPDATE shops SET status = 'Active' WHERE status IS NULL`);
        await pool.query(`UPDATE shops SET credit_limit = 0 WHERE credit_limit IS NULL`);

        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

alterShopsTable();
