const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkUsers() {
    try {
        const res = await pool.query('SELECT id, full_name, email, role FROM users');
        console.log('Current Users:');
        console.table(res.rows);
    } catch (err) {
        console.error('Error checking users:', err);
    } finally {
        await pool.end();
    }
}

checkUsers();
