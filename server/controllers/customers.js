const pool = require('../db');

const getCustomers = async (req, res) => {
    try {
        const { role, id } = req.user;
        let query = `
            SELECT 
                c.*,
                COALESCE(sub.total_orders, 0) as total_orders,
                sub.last_purchase_date
            FROM customers c
            LEFT JOIN (
                SELECT 
                    customer_id, 
                    COUNT(*) FILTER (WHERE type IN ('order', 'sale')) as total_orders,
                    MAX(transaction_date) FILTER (WHERE type IN ('order', 'sale')) as last_purchase_date
                FROM transactions
                GROUP BY customer_id
            ) sub ON c.id = sub.customer_id
        `;
        const params = [];

        if (role !== 'admin') {
            query += ' WHERE c.salesman_id = $1';
            params.push(id);
        }
        query += ' ORDER BY c.full_name';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
        if (customerResult.rows.length === 0) return res.status(404).send('Customer not found');
        
        const customer = customerResult.rows[0];
        
        // Get Transaction History
        const transactions = await pool.query(
            'SELECT * FROM transactions WHERE customer_id = $1 ORDER BY transaction_date DESC',
            [id]
        );
        
        // Basic analytics
        const analytics = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN type IN ('order', 'sale') THEN total_amount ELSE 0 END), 0) as total_purchases,
                COALESCE(SUM(CASE WHEN type = 'payment' THEN total_amount ELSE 0 END), 0) as total_paid,
                COUNT(CASE WHEN type IN ('order', 'sale') THEN 1 END) as order_count
            FROM transactions
            WHERE customer_id = $1
        `, [id]);

        res.json({
            ...customer,
            transactions: transactions.rows,
            analytics: analytics.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const addCustomer = async (req, res) => {
    const { 
        full_name, email, phone, address, 
        customer_type, gst_number, company_name, 
        city, state, pincode, credit_limit, notes, tags 
    } = req.body;
    const salesman_id = req.user.id;
    try {
        const newCustomer = await pool.query(
            `INSERT INTO customers (
                full_name, email, phone, address, salesman_id,
                customer_type, gst_number, company_name,
                city, state, pincode, credit_limit, notes, tags
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
            [
                full_name, email || null, phone, address, salesman_id,
                customer_type || 'Retail', gst_number || null, company_name || null,
                city || null, state || null, pincode || null, credit_limit || 0, notes || null, tags || []
            ]
        );
        res.json(newCustomer.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).send('Customer with this email already exists');
        }
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const updateCustomer = async (req, res) => {
    const { id } = req.params;
    const { 
        full_name, email, phone, address, 
        customer_type, gst_number, company_name, 
        city, state, pincode, credit_limit, notes, status, tags 
    } = req.body;
    const { role, id: userId } = req.user;
    try {
        let query = `
            UPDATE customers SET 
                full_name = $1, email = $2, phone = $3, address = $4,
                customer_type = $5, gst_number = $6, company_name = $7,
                city = $8, state = $9, pincode = $10, credit_limit = $11, 
                notes = $12, status = $13, tags = $14
            WHERE id = $15`;
        const params = [
            full_name, email || null, phone, address, 
            customer_type, gst_number, company_name,
            city, state, pincode, credit_limit, 
            notes, status, tags, id
        ];

        if (role !== 'admin') {
            query += ' AND salesman_id = $16';
            params.push(userId);
        }
        query += ' RETURNING *';

        const result = await pool.query(query, params);
        if (result.rows.length === 0) return res.status(404).send('Customer not found or access denied');
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const deleteCustomer = async (req, res) => {
    const { id } = req.params;
    const { role, id: userId } = req.user;
    try {
        let query = 'DELETE FROM customers WHERE id = $1';
        const params = [id];

        if (role !== 'admin') {
            query += ' AND salesman_id = $2';
            params.push(userId);
        }

        const result = await pool.query(query, params);
        if (result.rowCount === 0) return res.status(404).send('Customer not found or access denied');
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const lockCustomer = async (req, res) => {
    const { id } = req.params;
    const { is_locked } = req.body; // Expecting boolean
    try {
        const result = await pool.query(
            'UPDATE customers SET is_locked = $1 WHERE id = $2 RETURNING *',
            [is_locked, id]
        );
        if (result.rows.length === 0) return res.status(404).send('Customer not found');
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getCustomers,
    getCustomerById,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    lockCustomer,
};
