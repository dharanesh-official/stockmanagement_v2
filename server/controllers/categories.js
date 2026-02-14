const pool = require('../db');

const getCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const addCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        if (error.code === '23505') {
            return res.status(400).send('Category already exists');
        }
        res.status(500).send('Server Error');
    }
};

const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        const result = await pool.query(
            'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
            [name, description, id]
        );
        if (result.rows.length === 0) return res.status(404).send('Category not found');
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        // Check if category is being used by any products
        const productsCount = await pool.query('SELECT COUNT(*) FROM products WHERE category_id = $1', [id]);
        if (parseInt(productsCount.rows[0].count) > 0) {
            return res.status(400).send('Cannot delete category as it is associated with existing products');
        }

        const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).send('Category not found');
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getCategories, addCategory, updateCategory, deleteCategory };
