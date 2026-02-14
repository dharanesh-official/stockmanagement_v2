const pool = require('./db');
const fs = require('fs');
const path = require('path');

const migrate = async () => {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'add_phone_to_users.sql'), 'utf8');
        console.log('Running migration...');
        await pool.query(sql);
        console.log('Migration successful: Phone column added.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        pool.end();
    }
};

migrate();
