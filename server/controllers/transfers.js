const pool = require('../db');
const { logActivity } = require('../utils/logger');

const getTransfers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT it.*, u.full_name as processed_by 
            FROM inventory_transfers it
            JOIN users u ON it.user_id = u.id
            ORDER BY it.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const createTransfer = async (req, res) => {
    const client = await pool.connect();
    try {
        const { from_location, to_location, notes, items } = req.body;
        const user_id = req.user.id;

        await client.query('BEGIN');

        // Generate transfer number
        const date = new Date();
        const year = date.getFullYear();
        const resCount = await client.query("SELECT COUNT(*) FROM inventory_transfers WHERE transfer_number LIKE $1", [`TRF-${year}-%`]);
        const count = parseInt(resCount.rows[0].count) + 1;
        const transfer_number = `TRF-${year}-${count.toString().padStart(4, '0')}`;

        const transferRes = await client.query(
            `INSERT INTO inventory_transfers (transfer_number, from_location, to_location, notes, user_id) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [transfer_number, from_location, to_location, notes, user_id]
        );
        const transfer_id = transferRes.rows[0].id;

        for (const item of items) {
            await client.query(
                `INSERT INTO inventory_transfer_items (transfer_id, stock_id, quantity) 
                 VALUES ($1, $2, $3)`,
                [transfer_id, item.stock_id, item.quantity]
            );

            // Here we assume locations are notes or properties of stock
            // In a simple system, we just log the movement.
            // If locations were separate warehouses, we'd adjust separate warehouse_stock tables.
            // For now, we just mark it as "Transferred" which reduces global stock if from_location is 'Main' and to_location is 'In-Transit'
        }

        await client.query('COMMIT');
        await logActivity(user_id, 'Inventory Transfer', { transfer_number, from: from_location, to: to_location }, req.ip);
        res.status(201).json({ message: 'Transfer recorded', transfer_id, transfer_number });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
};

module.exports = { getTransfers, createTransfer };
