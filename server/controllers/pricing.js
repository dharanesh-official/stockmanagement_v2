const pool = require('../db');
const { logActivity } = require('../utils/logger');

const getPricingRules = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pricing_rules ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const createPricingRule = async (req, res) => {
    try {
        const { name, type, target_id, discount_type, discount_value, min_order_amount, start_date, end_date } = req.body;
        const result = await pool.query(
            `INSERT INTO pricing_rules (name, type, target_id, discount_type, discount_value, min_order_amount, start_date, end_date) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [name, type, target_id, discount_type, discount_value, min_order_amount, start_date, end_date]
        );
        await logActivity(req.user.id, 'Created Pricing Rule', { ruleName: name, type, discount_value }, req.ip);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const updatePricingRule = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, target_id, discount_type, discount_value, min_order_amount, start_date, end_date, is_active } = req.body;
        const result = await pool.query(
            `UPDATE pricing_rules 
             SET name = $1, type = $2, target_id = $3, discount_type = $4, discount_value = $5, min_order_amount = $6, start_date = $7, end_date = $8, is_active = $9, updated_at = NOW() 
             WHERE id = $10 RETURNING *`,
            [name, type, target_id, discount_type, discount_value, min_order_amount, start_date, end_date, is_active, id]
        );
        if (result.rows.length === 0) return res.status(404).send('Pricing rule not found');
        await logActivity(req.user.id, 'Updated Pricing Rule', { ruleId: id, name }, req.ip);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const deletePricingRule = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM pricing_rules WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).send('Pricing rule not found');
        await logActivity(req.user.id, 'Deleted Pricing Rule', { ruleId: id, name: result.rows[0].name }, req.ip);
        res.json({ message: 'Pricing rule deleted' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getPricingRules, createPricingRule, updatePricingRule, deletePricingRule };
