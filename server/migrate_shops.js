const pool = require('./db');

const migrate = async () => {
    try {
        await pool.query('ALTER TABLE shops ADD COLUMN IF NOT EXISTS salesman_id UUID REFERENCES users(id)');
        console.log('Migration successful: salesman_id column added to shops table');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        pool.end();
    }
};

migrate();
