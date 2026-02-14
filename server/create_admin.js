const pool = require('./db');
const bcrypt = require('bcrypt');

async function createAdmin() {
    try {
        const email = 'admin@company.com';
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);

        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            console.log('User already exists. Updating password...');
            await pool.query('UPDATE users SET password_hash = $1, role = \'admin\' WHERE email = $2', [hash, email]);
        } else {
            console.log('Creating new Admin user...');
            await pool.query(
                'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                ['Super Admin', email, hash, 'admin']
            );
        }
        console.log('Admin user setup complete.');
        process.exit(0);
    } catch (error) {
        if (error.code === '42P01') { // undefined_table
            console.error('ERROR: Tables do not exist! Please run the schema.sql in Supabase first.');
        } else {
            console.error('Error creating admin:', error);
        }
        process.exit(1);
    }
}

createAdmin();
