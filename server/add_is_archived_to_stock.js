const pool = require('./db');

const migrate = async () => {
    try {
        await pool.query('ALTER TABLE stock ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE');
        console.log('Migration successful: is_archived column added to stock table');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        pool.end();
    }
};

migrate();
