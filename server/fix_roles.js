const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function fixConstraint() {
    try {
        console.log('Dropping old constraint...');
        await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
        console.log('Adding new constraint including custom role...');
        await pool.query("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'salesman', 'manager', 'employee', 'custom'))");
        console.log('Constraint updated successfully!');
    } catch (err) {
        console.error('Error updating constraint:', err);
    } finally {
        await pool.end();
    }
}

fixConstraint();
