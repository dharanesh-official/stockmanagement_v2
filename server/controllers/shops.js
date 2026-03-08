const pool = require('../db');
const { logActivity } = require('../utils/logger');

const getShops = async (req, res) => {
    try {
        let query = `
            SELECT s.*, 
                   c.full_name as customer_name, 
                   u.full_name as salesman_name, 
                   a.name as area_name,
                   (SELECT COUNT(*) FROM transactions t WHERE t.shop_id = s.id AND t.type IN ('order', 'sale')) as total_orders,
                   (SELECT MAX(transaction_date) FROM transactions t WHERE t.shop_id = s.id AND t.type IN ('order', 'sale')) as last_order_date,
                   COALESCE((SELECT SUM(CASE WHEN t.type IN ('order', 'sale') THEN t.total_amount ELSE 0 END) - SUM(CASE WHEN t.type IN ('payment', 'credit_note') THEN t.total_amount ELSE 0 END) FROM transactions t WHERE t.shop_id = s.id), 0) as outstanding_balance
            FROM shops s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON s.salesman_id = u.id
            LEFT JOIN areas a ON s.area_id = a.id
        `;
        const params = [];

        if (req.user.role !== 'admin') {
            query += ` 
                WHERE s.salesman_id = $1 
                AND s.area_id IN (SELECT unnest(assigned_areas) FROM users WHERE id = $1)
            `;
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
        const { 
            name, address, phone, email, customer_id, salesman_id, location, area_id,
            shop_code, shop_type, city, state, pincode, credit_limit, notes, status
        } = req.body;

        if (!name || !address || !phone || !email || !area_id || !city || !state || !pincode || !customer_id || !shop_code) {
            return res.status(400).send('All fields are mandatory (Name, Address, Phone, Email, Area, City, State, Pincode, Owner, Shop Code)');
        }

        let assignedSalesmanId = req.user.role === 'admin' ? (salesman_id || req.user.id) : req.user.id;

        const result = await pool.query(
            `INSERT INTO shops (
                name, address, phone, email, customer_id, salesman_id, location, area_id,
                shop_code, shop_type, city, state, pincode, credit_limit, notes, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
            [
                name, address, phone, email, customer_id, assignedSalesmanId, location, area_id || null,
                shop_code, shop_type || 'Retail', city, state, pincode, credit_limit || 0, notes, status || 'Active'
            ]
        );
        
        await logActivity(req.user.id, 'Created Shop', { shopId: result.rows[0].id, name }, req.ip);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const updateShop = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, address, phone, email, customer_id, salesman_id, location, area_id,
            shop_code, shop_type, city, state, pincode, credit_limit, notes, status
        } = req.body;

        if (!name || !address || !phone || !email || !area_id || !city || !state || !pincode || !customer_id || !shop_code) {
            return res.status(400).send('All fields are mandatory (Name, Address, Phone, Email, Area, City, State, Pincode, Owner, Shop Code)');
        }

        let query = `
            UPDATE shops 
            SET name = $1, address = $2, phone = $3, email = $4, customer_id = $5, location = $6, area_id = $7,
                shop_code = $8, shop_type = $9, city = $10, state = $11, pincode = $12, 
                credit_limit = $13, notes = $14, status = $15, updated_at = NOW()
        `;
        const params = [
            name, address, phone, email, customer_id, location, area_id || null,
            shop_code, shop_type, city, state, pincode, credit_limit, notes, status
        ];

        let paramCount = params.length;

        if (req.user.role === 'admin') {
            const assignedSalesmanId = salesman_id || req.user.id;
            query += ` , salesman_id = $${paramCount + 1} WHERE id = $${paramCount + 2} RETURNING *`;
            params.push(assignedSalesmanId, id);
        } else {
            query += ` WHERE id = $${paramCount + 1} AND salesman_id = $${paramCount + 2} RETURNING *`;
            params.push(id, req.user.id);
        }

        const result = await pool.query(query, params);
        if (result.rows.length === 0) return res.status(404).send('Shop not found or access denied');
        
        await logActivity(req.user.id, 'Updated Shop', { shopId: id, name }, req.ip);
        
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

        await logActivity(req.user.id, 'Deleted Shop', { shopId: id }, req.ip);
        
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

