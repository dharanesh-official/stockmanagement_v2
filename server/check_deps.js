const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function findDependencies() {
    try {
        const userRes = await pool.query("SELECT id, email FROM users WHERE email = 'test@c.com'");
        if (userRes.rows.length === 0) {
            console.log('User test@c.com not found.');
            return;
        }
        const userId = userRes.rows[0].id;
        console.log(`User ID for test@c.com: ${userId}`);

        const transRes = await pool.query('SELECT COUNT(*) FROM transactions WHERE user_id = $1', [userId]);
        console.log(`Transactions linked: ${transRes.rows[0].count}`);

        const shopsRes = await pool.query('SELECT COUNT(*) FROM shops WHERE salesman_id = $1', [userId]);
        console.log(`Shops linked: ${shopsRes.rows[0].count}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

findDependencies();
