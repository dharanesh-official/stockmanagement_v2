const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./db');

const migrate = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Add min_stock_level and supplier to stock table
        await client.query('ALTER TABLE stock ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 10;');
        await client.query('ALTER TABLE stock ADD COLUMN IF NOT EXISTS supplier VARCHAR(255);');

        // 2. Create stock_history table for adjustment tracking
        await client.query(`
            CREATE TABLE IF NOT EXISTS stock_history (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                stock_id UUID REFERENCES stock(id) ON DELETE CASCADE,
                change_amount INTEGER NOT NULL,
                reason VARCHAR(255) NOT NULL,
                user_id UUID REFERENCES users(id),
                transaction_date TIMESTAMP DEFAULT NOW()
            );
        `);

        // 3. Add index for stock_history
        await client.query('CREATE INDEX IF NOT EXISTS idx_stock_history_stock ON stock_history(stock_id);');

        await client.query('COMMIT');
        console.log('Product Management V2 migration successful!');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Product Management V2 migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
    }
};

migrate();
