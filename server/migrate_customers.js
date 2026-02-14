const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    try {
        console.log('Adding salesman_id to customers table...');
        await pool.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS salesman_id UUID REFERENCES users(id)');
        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
