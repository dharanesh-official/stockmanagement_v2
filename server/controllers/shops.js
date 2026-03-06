const pool = require('../db');

const getShops = async (req, res) => {
    try {
        let query = `
            SELECT s.*, c.full_name as customer_name, u.full_name as salesman_name, a.name as area_name
            FROM shops s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON s.salesman_id = u.id
            LEFT JOIN areas a ON s.area_id = a.id
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
        const { name, address, phone, email, customer_id, salesman_id, location, area_id } = req.body;

        if (!area_id) {
            return res.status(400).send('Area selection is mandatory');
        }

        // Determine the effective salesman_id
        let assignedSalesmanId = null;
        if (req.user.role === 'admin') {
            assignedSalesmanId = salesman_id || req.user.id; // Assign to self if not specified, or leave null? Requirement implies assigning.
        } else {
            assignedSalesmanId = req.user.id; // Salesman always assigns to self
        }

        const result = await pool.query(
            'INSERT INTO shops (name, address, phone, email, customer_id, salesman_id, location, area_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [name, address, phone, email, customer_id, assignedSalesmanId, location, area_id || null]
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
        const { name, address, phone, email, customer_id, salesman_id, location, area_id } = req.body;

        if (!area_id) {
            return res.status(400).send('Area selection is mandatory');
        }

        let query = 'UPDATE shops SET name = $1, address = $2, phone = $3, email = $4, customer_id = $5, location = $6, area_id = $7, updated_at = NOW()';
        const params = [name, address, phone, email, customer_id, location, area_id || null, id];

        if (req.user.role === 'admin') {
            const assignedSalesmanId = salesman_id || req.user.id;
            query = 'UPDATE shops SET name = $1, address = $2, phone = $3, email = $4, customer_id = $5, location = $6, area_id = $7, salesman_id = $9, updated_at = NOW() WHERE id = $8 RETURNING *';
            params.push(assignedSalesmanId);
        } else {
            // Salesman can only update their own shop
            query += ' WHERE id = $8 AND salesman_id = $9 RETURNING *';
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

const getShopFinance = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        let query = `
            SELECT t.*, u.full_name as salesman_name, c.full_name as customer_name, s.name as shop_name
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            JOIN customers c ON t.customer_id = c.id
            JOIN shops s ON t.shop_id = s.id
            WHERE t.shop_id = $1
        `;
        const params = [id];

        if (startDate && endDate) {
            query += ' AND t.transaction_date BETWEEN $2 AND $3';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY t.transaction_date DESC';

        const result = await pool.query(query, params);

        // Also get totals
        const totalsQuery = `
            SELECT 
                SUM(CASE WHEN type IN ('order', 'sale') THEN total_amount ELSE 0 END) as total_sales,
                SUM(CASE WHEN type = 'payment' THEN total_amount ELSE 0 END) as total_payments,
                SUM(CASE WHEN type = 'credit_note' THEN total_amount ELSE 0 END) as total_credits
            FROM transactions
            WHERE shop_id = $1
        `;
        const totalsParams = [id];
        if (startDate && endDate) {
            totalsQuery.replace('WHERE shop_id = $1', 'WHERE shop_id = $1 AND transaction_date BETWEEN $2 AND $3'); // Oops, simpler just re-write or use a wrapper
        }
        
        // Better totals query with proper clause
        let finalTotalsQuery = `
            SELECT 
                SUM(CASE WHEN type IN ('order', 'sale') THEN total_amount ELSE 0 END) as total_sales,
                SUM(CASE WHEN type = 'payment' THEN total_amount ELSE 0 END) as total_payments,
                SUM(CASE WHEN type = 'credit_note' THEN total_amount ELSE 0 END) as total_credits
            FROM transactions
            WHERE shop_id = $1
        `;
        const totalParams = [id];
        if (startDate && endDate) {
            finalTotalsQuery += ' AND transaction_date BETWEEN $2 AND $3';
            totalParams.push(startDate, endDate);
        }

        const totalsResult = await pool.query(finalTotalsQuery, totalParams);

        res.json({
            history: result.rows,
            summary: totalsResult.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getShops, createShop, updateShop, deleteShop, getShopFinance };

