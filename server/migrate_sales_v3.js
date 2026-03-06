const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./db');

const migrate = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Add new columns to transactions
        await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50) UNIQUE;');
        await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) DEFAULT \'Direct Sale\';');
        await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0.00;');
        await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0.00;');
        await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS shipping_charge DECIMAL(10, 2) DEFAULT 0.00;');
        await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES transactions(id) ON DELETE CASCADE;');
        
        // 2. Add last_purchase_date to customers if not exists (for Table 4)
        await client.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP;');
        
        // 3. Update status constraint if needed
        // Note: PostgreSQL doesn't easily allow updating CHECK constraints on the fly without dropping them.
        // We'll just rely on application logic for now or drop/recreate if it were a production app with strict needs.
        // But let's try to update it gracefully.
        try {
            await client.query('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check');
            await client.query("ALTER TABLE transactions ADD CONSTRAINT transactions_status_check CHECK (status IN ('Draft', 'Ordered', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled', 'Returned', 'completed', 'pending'))");
        } catch (e) {
            console.log('Status check constraint already handled or failed to update:', e.message);
        }

        await client.query('COMMIT');
        console.log('Sales V3 migration successful!');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Sales V3 migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
    }
};

migrate();
