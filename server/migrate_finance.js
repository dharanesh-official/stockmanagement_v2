const pool = require('./db');

const migrate = async () => {
    try {
        await pool.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0.00;');
        console.log('Migration successful: added paid_amount column');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
