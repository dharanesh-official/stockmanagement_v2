const pool = require('./db');

const migrate = async () => {
    try {
        await pool.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT');
        console.log('Migration successful: description column added to categories table');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        pool.end();
    }
};

migrate();
