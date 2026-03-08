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

        if (role !== 'admin' && role !== 'super_admin') {
            query += ` 
                WHERE c.salesman_id = $1 
                OR EXISTS (SELECT 1 FROM shops s WHERE s.customer_id = c.id AND (s.salesman_id = $1 OR s.area_id IN (SELECT unnest(assigned_areas) FROM users WHERE id = $1)))
            `;
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
        const { role, id: userId } = req.user;

        // Existing access control for customer profiles
        // This ensures salespeople can only access their own assigned customer profiles.
        const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
        if (customerResult.rows.length === 0) return res.status(404).send('Customer not found');
        
        const customer = customerResult.rows[0];

        // Access Control
        if (role !== 'admin' && role !== 'super_admin' && customer.salesman_id !== userId) {
            // Check if they have a shop for this customer
            const shopCheck = await pool.query('SELECT 1 FROM shops WHERE customer_id = $1 AND (salesman_id = $2 OR area_id IN (SELECT unnest(assigned_areas) FROM users WHERE id = $2))', [id, userId]);
            if (shopCheck.rows.length === 0) {
                return res.status(403).send('Access denied: This customer is not assigned to you.');
            }
        }
        
        // Get Transaction History
        const transactions = await pool.query(
            `SELECT * FROM transactions WHERE customer_id = $1 
             ${(role !== 'admin' && role !== 'super_admin') ? 'AND (user_id = $2 OR EXISTS (SELECT 1 FROM shops s WHERE s.id = transactions.shop_id AND (s.salesman_id = $2 OR s.area_id IN (SELECT unnest(assigned_areas) FROM users WHERE id = $2))))' : ''}
             ORDER BY transaction_date DESC`,
            (role === 'admin' || role === 'super_admin') ? [id] : [id, userId]
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
        customer_type, company_name, 
        city, state, pincode, notes, tags 
    } = req.body;

    if (!full_name || !email || !phone || !address || !city || !state || !pincode || !company_name) {
        return res.status(400).send('All fields are mandatory (Name, Email, Phone, Address, City, State, Pincode, Company Name)');
    }
    const salesman_id = req.user.id;
    try {
        const newCustomer = await pool.query(
            `INSERT INTO customers (
                full_name, email, phone, address, salesman_id,
                customer_type, company_name,
                city, state, pincode, notes, tags
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [
                full_name, email, phone, address, salesman_id,
                customer_type || 'Retail', company_name || null,
                city, state, pincode, notes || null, tags || []
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
        customer_type, company_name, 
        city, state, pincode, notes, status, tags 
    } = req.body;

    if (!full_name || !email || !phone || !address || !city || !state || !pincode || !company_name) {
        return res.status(400).send('All fields are mandatory');
    }
    const { role, id: userId } = req.user;
    try {
        let query = `
            UPDATE customers SET 
                full_name = $1, email = $2, phone = $3, address = $4,
                customer_type = $5, company_name = $6,
                city = $7, state = $8, pincode = $9, 
                notes = $10, status = $11, tags = $12
            WHERE id = $13`;
        const params = [
            full_name, email, phone, address, 
            customer_type, company_name,
            city, state, pincode, 
            notes, status, tags, id
        ];

        if (role !== 'admin' && role !== 'super_admin') {
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

        if (role !== 'admin' && role !== 'super_admin') {
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
