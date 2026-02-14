const pool = require('../db');
const bcrypt = require('bcryptjs');

const getEmployees = async (req, res) => {
    try {
        const result = await pool.query("SELECT id, full_name, email, phone, role, permissions, created_at FROM users WHERE role != 'admin' ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const createEmployee = async (req, res) => {
    const { full_name, email, password, role, permissions, phone } = req.body;
    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) return res.status(400).send('User already exists');

        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            "INSERT INTO users (full_name, email, password_hash, role, permissions, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, full_name, email, phone, role, permissions",
            [full_name, email, hash, role || 'salesman', permissions || '{}', phone]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const updateEmployee = async (req, res) => {
    const { id } = req.params;
    const { full_name, email, role, permissions, phone } = req.body;
    try {
        console.log(`Updating user ${id} with:`, { full_name, email, role, phone });
        const result = await pool.query(
            "UPDATE users SET full_name = $1, email = $2, role = $3, permissions = $4, phone = $5 WHERE id = $6 RETURNING id, full_name, email, phone, role, permissions",
            [full_name, email, role, permissions, phone, id]
        );
        if (result.rows.length === 0) return res.status(404).send('User not found');
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update User Error:', error.message);
        res.status(500).send('Server Error');
    }
};

const deleteUser = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // 1. Check for transaction history (hard dependency)
        const transCheck = await client.query('SELECT COUNT(*) FROM transactions WHERE user_id = $1', [id]);
        if (parseInt(transCheck.rows[0].count) > 0) {
            await client.query('ROLLBACK');
            return res.status(400).send('Cannot delete employee: They have transaction history. Consider locking their account instead.');
        }

        // 2. Unassign from shops (soft dependency)
        await client.query('UPDATE shops SET salesman_id = NULL WHERE salesman_id = $1', [id]);

        // 3. Delete the user
        const result = await client.query('DELETE FROM users WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send('User not found');
        }

        await client.query('COMMIT');
        console.log(`Successfully deleted user: ${id}`);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete User Error:', error.message);
        res.status(500).send('Server Error: ' + error.message);
    } finally {
        client.release();
    }
}

const getEmployeeDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Basic Info
        const userRes = await pool.query("SELECT id, full_name, email, phone, role, permissions, created_at FROM users WHERE id = $1", [id]);
        if (userRes.rows.length === 0) return res.status(404).send('User not found');
        const user = userRes.rows[0];

        // 2. Assigned Shops
        const shopsRes = await pool.query("SELECT id, name, address, phone FROM shops WHERE salesman_id = $1", [id]);

        // 3. Sales Performance
        const statsRes = await pool.query(`
            SELECT 
                COUNT(CASE WHEN type = 'order' THEN 1 END) as total_orders,
                COUNT(CASE WHEN type = 'sale' THEN 1 END) as total_sales,
                SUM(CASE WHEN type IN ('sale', 'order') THEN total_amount ELSE 0 END) as total_revenue,
                (SELECT COUNT(DISTINCT customer_id) FROM shops WHERE salesman_id = $1) as total_customers
            FROM transactions 
            WHERE user_id = $1 OR shop_id IN (SELECT id FROM shops WHERE salesman_id = $1)
        `, [id]);

        res.json({
            ...user,
            shops: shopsRes.rows,
            performance: statsRes.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const updateShops = async (req, res) => {
    const { id } = req.params; // Salesman ID
    const { shopIds } = req.body; // Array of Shop IDs to assign

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Unassign all current shops first
        await client.query('UPDATE shops SET salesman_id = NULL WHERE salesman_id = $1', [id]);

        // Assign new ones
        if (shopIds && shopIds.length > 0) {
            await client.query('UPDATE shops SET salesman_id = $1 WHERE id = ANY($2)', [id, shopIds]);
        }

        await client.query('COMMIT');
        res.json({ message: 'Shop assignments updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
};

module.exports = { getEmployees, createEmployee, updateEmployee, deleteUser, getEmployeeDetails, updateShops };
