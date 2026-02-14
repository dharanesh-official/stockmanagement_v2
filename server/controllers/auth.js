const pool = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const secret = process.env.JWT_SECRET || 'secret';

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).send('Email address not found');

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).send('Incorrect password');

        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, secret, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                full_name: user.full_name,
                permissions: user.permissions || {}
            }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const register = async (req, res) => {
    const { full_name, email, password, role } = req.body;
    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) return res.status(400).send('User already exists');

        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role, permissions',
            [full_name, email, hash, role || 'salesman']
        );

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, secret, { expiresIn: '24h' });
        res.json({ token, user: { ...user, permissions: user.permissions || {} } });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const updateProfile = async (req, res) => {
    const { id } = req.user;
    const { full_name, password } = req.body;

    try {
        let query = 'UPDATE users SET full_name = $1 WHERE id = $2 RETURNING id, full_name, email, role, permissions';
        let values = [full_name, id];

        if (password) {
            const hash = await bcrypt.hash(password, 10);
            query = 'UPDATE users SET full_name = $1, password_hash = $2 WHERE id = $3 RETURNING id, full_name, email, role, permissions';
            values = [full_name, hash, id];
        }

        const result = await pool.query(query, values);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { login, register, updateProfile };
