const pool = require('./db');

const migrate = async () => {
    try {
        await pool.query('ALTER TABLE shops ADD COLUMN IF NOT EXISTS location TEXT');
        console.log('Migration successful: location column added to shops table');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        pool.end();
    }
};

migrate();
