const pool = require('../db');

const getAllStocks = async (req, res) => {
    try {
        // JOIN with categories to get the current name automatically
        const result = await pool.query(`
            SELECT s.*, c.name as category_name 
            FROM stock s
            LEFT JOIN categories c ON s.category_id = c.id
            ORDER BY s.item_name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const getStockById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT s.*, c.name as category_name 
            FROM stock s
            LEFT JOIN categories c ON s.category_id = c.id
            WHERE s.id = $1
        `, [id]);
        if (result.rows.length === 0) return res.status(404).send('Stock not found');
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const addStock = async (req, res) => {
    try {
        const { item_name, sku, quantity, price, description, category_id } = req.body;
        const newStock = await pool.query(
            'INSERT INTO stock (item_name, sku, quantity, price, description, category_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [item_name, sku, quantity, price, description, category_id]
        );
        res.json(newStock.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { item_name, sku, quantity, price, description, category_id } = req.body;
        const result = await pool.query(
            'UPDATE stock SET item_name = $1, sku = $2, quantity = $3, price = $4, description = $5, category_id = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
            [item_name, sku, quantity, price, description, category_id, id]
        );
        if (result.rows.length === 0) return res.status(404).send('Stock not found');
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const increaseStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const updatedStock = await pool.query(
            'UPDATE stock SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [quantity, id]
        );
        if (updatedStock.rows.length === 0) return res.status(404).send('Stock not found');
        res.json(updatedStock.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const reduceStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const updatedStock = await pool.query(
            'UPDATE stock SET quantity = GREATEST(quantity - $1, 0), updated_at = NOW() WHERE id = $2 RETURNING *',
            [quantity, id]
        );
        if (updatedStock.rows.length === 0) return res.status(404).send('Stock not found');
        res.json(updatedStock.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const deleteStock = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM stock WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).send('Product not found');
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error.message);
        if (error.code === '23503') {
            return res.status(400).send('Cannot delete product because it has associated sales history. Consider setting stock to 0 instead.');
        }
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getAllStocks,
    getStockById,
    addStock,
    updateStock,
    increaseStock,
    reduceStock,
    deleteStock,
};
