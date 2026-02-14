const pool = require('../db');

const getSettings = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM company_settings WHERE id = 1');
        if (result.rows.length === 0) {
            // Seed if missing
            await pool.query("INSERT INTO company_settings (id, company_name, company_address) VALUES (1, 'Inventory Pro', '123 Business St')");
            return res.json({ company_name: 'Inventory Pro', company_address: '123 Business St' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const updateSettings = async (req, res) => {
    const { company_name, company_address } = req.body;
    try {
        const result = await pool.query(
            'UPDATE company_settings SET company_name = $1, company_address = $2 WHERE id = 1 RETURNING *',
            [company_name, company_address]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getSettings, updateSettings };
