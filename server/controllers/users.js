const pool = require('../db');
const bcrypt = require('bcryptjs');

const getEmployees = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id, u.full_name, u.email, u.phone, u.role, u.permissions, u.created_at,
                u.employee_id, u.status, u.last_login, u.assigned_areas,
                (SELECT COUNT(*) FROM shops WHERE salesman_id = u.id) as assigned_shops_count
            FROM users u 
            WHERE u.role != 'super_admin' 
            ORDER BY u.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const createEmployee = async (req, res) => {
    const { full_name, email, password, role, permissions, phone, employee_id, status, assigned_areas } = req.body;
    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) return res.status(400).send('User already exists');

        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            "INSERT INTO users (full_name, email, password_hash, role, permissions, phone, employee_id, status, assigned_areas) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
            [full_name, email, hash, role || 'salesman', permissions || '{}', phone, employee_id, status || 'Active', assigned_areas || []]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const updateEmployee = async (req, res) => {
    const { id } = req.params;
    const { full_name, email, role, permissions, phone, status, employee_id, assigned_areas } = req.body;
    try {
        const result = await pool.query(
            "UPDATE users SET full_name = $1, email = $2, role = $3, permissions = $4, phone = $5, status = $6, employee_id = $7, assigned_areas = $8 WHERE id = $9 RETURNING *",
            [full_name, email, role, permissions, phone, status, employee_id, assigned_areas, id]
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
        const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (userRes.rows.length === 0) return res.status(404).send('User not found');
        const user = userRes.rows[0];

        // 2. Assigned Shops
        const shopsRes = await pool.query("SELECT id, name, address, phone FROM shops WHERE salesman_id = $1", [id]);

        // 3. Assigned Areas (names)
        let areas = [];
        if (user.assigned_areas && user.assigned_areas.length > 0) {
            const areasRes = await pool.query("SELECT id, name FROM areas WHERE id = ANY($1)", [user.assigned_areas]);
            areas = areasRes.rows;
        }

        // 4. Sales Performance
        const statsRes = await pool.query(`
            SELECT 
                COUNT(CASE WHEN type IN ('order', 'sale') THEN 1 END) as total_orders,
                SUM(CASE WHEN type IN ('sale', 'order') THEN total_amount ELSE 0 END) as total_sales_volume,
                SUM(CASE WHEN type = 'payment' THEN total_amount ELSE 0 END) as total_collections,
                (SELECT COUNT(DISTINCT customer_id) FROM shops WHERE salesman_id = $1) as total_customers
            FROM transactions 
            WHERE user_id = $1 OR shop_id IN (SELECT id FROM shops WHERE salesman_id = $1)
        `, [id]);

        res.json({
            ...user,
            shops: shopsRes.rows,
            areas: areas,
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

const changePassword = async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Security Check: Only allow self or admin
    // Note: req.user.id is from token.
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
        return res.status(403).send('Access Denied');
    }

    try {
        const userRes = await pool.query('SELECT password_hash FROM users WHERE id = $1', [id]);
        if (userRes.rows.length === 0) return res.status(404).send('User not found');

        const user = userRes.rows[0];

        // If currentPassword provided, verify it.
        // If user is admin resetting someone else's, maybe skip current check?
        // But let's enforce current password for self-change.
        if (req.user.role !== 'admin' || (req.user.id === parseInt(id))) {
            if (!currentPassword) return res.status(400).send('Current password is required');
            const validPass = await bcrypt.compare(currentPassword, user.password_hash);
            if (!validPass) return res.status(401).send('Incorrect current password');
        }

        const hash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, id]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getEmployees, createEmployee, updateEmployee, deleteUser, getEmployeeDetails, updateShops, changePassword };
