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
    const { 
        company_name, company_address, company_logo, gst_number, 
        phone, email, website, currency, timezone, 
        date_format, language, invoice_prefix, invoice_footer, settings_json 
    } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE company_settings 
             SET company_name = COALESCE($1, company_name), 
                 company_address = COALESCE($2, company_address),
                 company_logo = COALESCE($3, company_logo),
                 gst_number = COALESCE($4, gst_number),
                 phone = COALESCE($5, phone),
                 email = COALESCE($6, email),
                 website = COALESCE($7, website),
                 currency = COALESCE($8, currency),
                 timezone = COALESCE($9, timezone),
                 date_format = COALESCE($10, date_format),
                 language = COALESCE($11, language),
                 invoice_prefix = COALESCE($12, invoice_prefix),
                 invoice_footer = COALESCE($13, invoice_footer),
                 settings_json = COALESCE($14, settings_json)
             WHERE id = 1 RETURNING *`,
            [
                company_name, company_address, company_logo, gst_number, 
                phone, email, website, currency, timezone, 
                date_format, language, invoice_prefix, invoice_footer, 
                settings_json ? JSON.stringify(settings_json) : null
            ]
        );
        
        // Log the activity internally
        if (req.user && req.user.id) {
            await pool.query(
                'INSERT INTO activity_log (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
                [req.user.id, 'Updated System Settings', JSON.stringify({ updated_fields: Object.keys(req.body) }), req.ip || '0.0.0.0']
            );
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const getActivityLogs = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, u.full_name, u.email 
            FROM activity_log a 
            LEFT JOIN users u ON a.user_id = u.id 
            ORDER BY a.created_at DESC 
            LIMIT 100
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getSettings, updateSettings, getActivityLogs };
