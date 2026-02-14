const pool = require('../db');

const getShops = async (req, res) => {
    try {
        let query = `
            SELECT s.*, c.full_name as customer_name, u.full_name as salesman_name
            FROM shops s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON s.salesman_id = u.id
        `;
        const params = [];

        if (req.user.role !== 'admin') {
            query += ' WHERE s.salesman_id = $1';
            params.push(req.user.id);
        }

        query += ' ORDER BY s.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const createShop = async (req, res) => {
    try {
        const { name, address, phone, email, customer_id, salesman_id } = req.body;

        // Determine the effective salesman_id
        let assignedSalesmanId = null;
        if (req.user.role === 'admin') {
            assignedSalesmanId = salesman_id || req.user.id; // Assign to self if not specified, or leave null? Requirement implies assigning.
        } else {
            assignedSalesmanId = req.user.id; // Salesman always assigns to self
        }

        const result = await pool.query(
            'INSERT INTO shops (name, address, phone, email, customer_id, salesman_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, address, phone, email, customer_id, assignedSalesmanId]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const updateShop = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, phone, email, customer_id, salesman_id } = req.body;

        let query = 'UPDATE shops SET name = $1, address = $2, phone = $3, email = $4, customer_id = $5, updated_at = NOW()';
        const params = [name, address, phone, email, customer_id, id];

        if (req.user.role === 'admin') {
            const assignedSalesmanId = salesman_id || req.user.id;
            query = 'UPDATE shops SET name = $1, address = $2, phone = $3, email = $4, customer_id = $5, salesman_id = $7, updated_at = NOW() WHERE id = $6 RETURNING *';
            params.push(assignedSalesmanId);
        } else {
            // Salesman can only update their own shop
            query += ' WHERE id = $6 AND salesman_id = $7 RETURNING *';
            params.push(req.user.id);
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) return res.status(404).send('Shop not found or access denied');
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const deleteShop = async (req, res) => {
    try {
        const { id } = req.params;
        let query = 'DELETE FROM shops WHERE id = $1';
        const params = [id];

        if (req.user.role !== 'admin') {
            query += ' AND salesman_id = $2';
            params.push(req.user.id);
        }

        const result = await pool.query(query, params);
        if (result.rowCount === 0) return res.status(404).send('Shop not found or access denied');

        res.json({ message: 'Shop deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getShops, createShop, updateShop, deleteShop };
