const pool = require('../db');

const getCustomers = async (req, res) => {
    try {
        const { role, id } = req.user;
        let query = 'SELECT * FROM customers';
        const params = [];

        if (role !== 'admin') {
            query += ' WHERE salesman_id = $1';
            params.push(id);
        }
        query += ' ORDER BY full_name';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const addCustomer = async (req, res) => {
    const { full_name, email, phone, address } = req.body;
    const salesman_id = req.user.id;
    try {
        const newCustomer = await pool.query(
            'INSERT INTO customers (full_name, email, phone, address, salesman_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [full_name, email, phone, address, salesman_id]
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
    const { full_name, email, phone, address } = req.body;
    const { role, id: userId } = req.user;
    try {
        let query = 'UPDATE customers SET full_name = $1, email = $2, phone = $3, address = $4 WHERE id = $5';
        const params = [full_name, email, phone, address, id];

        if (role !== 'admin') {
            query += ' AND salesman_id = $6';
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
    addCustomer,
    updateCustomer,
    deleteCustomer,
    lockCustomer,
};
