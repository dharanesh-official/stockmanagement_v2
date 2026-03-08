const pool = require('../db');

const getAreas = async (req, res) => {
    try {
        const { role, id } = req.user;
        let query;
        let params = [id];

        if (role !== 'admin') {
            // Salesperson view: Only show areas in their 'assigned_areas' list
            query = `
                SELECT 
                    a.id, a.name, a.created_at,
                    COUNT(DISTINCT s.id) as total_shops,
                    COALESCE(SUM(CASE WHEN t.type IN ('order', 'sale') THEN t.total_amount ELSE 0 END), 0) as total_sales,
                    COALESCE(SUM(CASE WHEN t.type IN ('order', 'sale') THEN t.total_amount ELSE 0 END) - SUM(CASE WHEN t.type IN ('payment', 'credit_note') THEN t.total_amount ELSE 0 END), 0) as pending_payments,
                    0 as low_stock_shops
                FROM areas a
                CROSS JOIN users u
                LEFT JOIN shops s ON a.id = s.area_id AND s.salesman_id = u.id
                LEFT JOIN transactions t ON s.id = t.shop_id
                WHERE u.id = $1 
                  AND a.id = ANY(u.assigned_areas)
                GROUP BY a.id, a.name, a.created_at
                ORDER BY a.name ASC
            `;
        } else {
            // Admin view: Show all areas
            query = `
                SELECT 
                    a.id, a.name, a.created_at,
                    COUNT(DISTINCT s.id) as total_shops,
                    COALESCE(SUM(CASE WHEN t.type IN ('order', 'sale') THEN t.total_amount ELSE 0 END), 0) as total_sales,
                    COALESCE(SUM(CASE WHEN t.type IN ('order', 'sale') THEN t.total_amount ELSE 0 END) - SUM(CASE WHEN t.type IN ('payment', 'credit_note') THEN t.total_amount ELSE 0 END), 0) as pending_payments,
                    0 as low_stock_shops
                FROM areas a
                LEFT JOIN shops s ON a.id = s.area_id
                LEFT JOIN transactions t ON s.id = t.shop_id
                GROUP BY a.id, a.name, a.created_at
                ORDER BY a.name ASC
            `;
            params = [];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const createArea = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).send('Area name is required');

        const result = await pool.query(
            'INSERT INTO areas (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        if (error.code === '23505') { // unique violation
            return res.status(400).send('Area name already exists');
        }
        res.status(500).send('Server Error');
    }
};

const updateArea = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).send('Area name is required');

        const result = await pool.query(
            'UPDATE areas SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );

        if (result.rows.length === 0) return res.status(404).send('Area not found');
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        if (error.code === '23505') { // unique violation
            return res.status(400).send('Area name already exists');
        }
        res.status(500).send('Server Error');
    }
};

const deleteArea = async (req, res) => {
    try {
        const { id } = req.params;

        // Ensure no shops are still attached before deleting, though SET NULL handles it,
        // wait, the foreign key says ON DELETE SET NULL. So we can just delete.
        // Or if we want to be strict, we can check. The requirement just says "deleted with confirmation".
        // Let's just delete the area directly (shops will be set to area_id=null).

        const result = await pool.query('DELETE FROM areas WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).send('Area not found');

        res.json({ message: 'Area deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getAreas, createArea, updateArea, deleteArea };
