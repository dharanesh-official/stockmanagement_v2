const pool = require('../db');

const getAllStocks = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.*, c.name as category_name 
            FROM stock s
            LEFT JOIN categories c ON s.category_id = c.id
            WHERE s.is_archived IS NOT TRUE
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
        const { item_name, sku, quantity, price, description, category_id, min_stock_level, supplier } = req.body;
        const newStock = await pool.query(
            'INSERT INTO stock (item_name, sku, quantity, price, description, category_id, min_stock_level, supplier) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [item_name, sku, quantity, price, description, category_id, min_stock_level || 10, supplier || 'Unknown']
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
        const { item_name, sku, quantity, price, description, category_id, min_stock_level, supplier } = req.body;
        const result = await pool.query(
            'UPDATE stock SET item_name = $1, sku = $2, quantity = $3, price = $4, description = $5, category_id = $6, min_stock_level = $7, supplier = $8, updated_at = NOW() WHERE id = $9 RETURNING *',
            [item_name, sku, quantity, price, description, category_id, min_stock_level, supplier, id]
        );
        if (result.rows.length === 0) return res.status(404).send('Stock not found');
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const adjustStock = async (req, res) => {
    const { id } = req.params;
    const { adjustment, reason } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Update stock
        const result = await client.query(
            'UPDATE stock SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [adjustment, id]
        );
        
        if (result.rows.length === 0) throw new Error('Stock not found');

        // 2. Record history
        await client.query(
            'INSERT INTO stock_history (stock_id, change_amount, reason, user_id) VALUES ($1, $2, $3, $4)',
            [id, adjustment, reason || 'Manual Adjustment', req.user?.id]
        );

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).send(error.message || 'Server Error');
    } finally {
        client.release();
    }
};

const getStockHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT sh.*, u.full_name as user_name 
            FROM stock_history sh
            LEFT JOIN users u ON sh.user_id = u.id
            WHERE sh.stock_id = $1
            ORDER BY sh.transaction_date DESC
        `, [id]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
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
            try {
                await pool.query(
                    `UPDATE stock 
                     SET is_archived = TRUE, 
                         sku = sku || '_ARCHIVED_' || EXTRACT(EPOCH FROM NOW()) 
                     WHERE id = $1`,
                    [req.params.id]
                );
                return res.json({ message: 'Product archived successfully (sales history preserved)' });
            } catch (archiveError) {
                console.error(archiveError);
                return res.status(500).send('Failed to archive product');
            }
        }
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getAllStocks,
    getStockById,
    addStock,
    updateStock,
    adjustStock,
    getStockHistory,
    increaseStock,
    reduceStock,
    deleteStock,
};
