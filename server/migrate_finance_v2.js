const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./db');

const migrate = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Add credit_limit to customers
        await client.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10, 2) DEFAULT 0.00;');

        // 2. Add new columns to transactions
        await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;');
        await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);');
        await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS applied_invoice_id UUID REFERENCES transactions(id);');
        
        // 3. Update transaction type check to include 'credit_note' explicitly if not there (it is there, but just being safe)
        // Table created with: CHECK (type IN ('order', 'sale', 'credit_note', 'payment'))

        await client.query('COMMIT');
        console.log('Finance V2 migration successful!');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Finance V2 migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
    }
};

migrate();
