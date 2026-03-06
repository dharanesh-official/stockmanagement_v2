const pool = require('./db');

const migrateEmployeesV2 = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Starting Employee Management migration...');

        // 1. Add new columns to users table
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50) UNIQUE,
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'On Leave', 'Disabled')),
            ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
            ADD COLUMN IF NOT EXISTS assigned_areas INTEGER[] DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
        `);
        console.log('Added new columns to users table.');

        // 2. Update role constraint
        // First, drop existing constraint if it exists. 
        // We need to find the name of the constraint. 
        // Based on schema.sql, it's an inline check, but we can drop it by name if we know it or recreate the column.
        // Usually, it's named "users_role_check".
        try {
            await client.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            await client.query(`
                ALTER TABLE users 
                ADD CONSTRAINT users_role_check 
                CHECK (role IN ('super_admin', 'admin', 'manager', 'salesman', 'warehouse_staff', 'custom'));
            `);
            console.log('Updated role constraints.');
        } catch (e) {
            console.error('Failed to update role constraint (might be named differently):', e.message);
        }

        // 3. Initialize employee_id for existing users
        const users = await client.query('SELECT id FROM users WHERE employee_id IS NULL');
        for (let i = 0; i < users.rows.length; i++) {
            const empId = 'EMP' + (1000 + i);
            await client.query('UPDATE users SET employee_id = $1 WHERE id = $2', [empId, users.rows[i].id]);
        }
        console.log(`Initialized employee_id for ${users.rows.length} users.`);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
    }
};

migrateEmployeesV2();
