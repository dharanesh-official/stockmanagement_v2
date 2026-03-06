const pool = require('../db');
const { logActivity } = require('../utils/logger');

const getPurchases = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, s.name as supplier_name, u.full_name as user_name
            FROM purchases p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            LEFT JOIN users u ON p.user_id = u.id
            ORDER BY p.purchase_date DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const createPurchase = async (req, res) => {
    const client = await pool.connect();
    try {
        const { supplier_id, reference_number, purchase_date, items, notes, paid_amount, payment_method } = req.body;
        const user_id = req.user.id;

        await client.query('BEGIN');

        let total_amount = 0;
        for (const item of items) {
            total_amount += item.quantity * item.unit_cost;
        }

        const payment_status = paid_amount >= total_amount ? 'Paid' : (paid_amount > 0 ? 'Partial' : 'Unpaid');

        const purchaseRes = await client.query(
            `INSERT INTO purchases (supplier_id, user_id, reference_number, total_amount, paid_amount, payment_status, payment_method, purchase_date, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [supplier_id, user_id, reference_number, total_amount, paid_amount || 0, payment_status, payment_method, purchase_date, notes]
        );
        const purchase = purchaseRes.rows[0];

        for (const item of items) {
            const total_cost = item.quantity * item.unit_cost;
            await client.query(
                `INSERT INTO purchase_items (purchase_id, stock_id, quantity, unit_cost, total_cost) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [purchase.id, item.stock_id, item.quantity, item.unit_cost, total_cost]
            );

            // Update Stock
            await client.query(
                `UPDATE stock 
                 SET quantity = quantity + $1, 
                     last_purchase_price = $2, 
                     last_purchase_date = NOW(),
                     supplier_id = COALESCE($3, supplier_id)
                 WHERE id = $4`,
                [item.quantity, item.unit_cost, supplier_id, item.stock_id]
            );
        }

        // Update Supplier Balance
        const balanceImpact = total_amount - (paid_amount || 0);
        if (balanceImpact !== 0) {
            await client.query(
                'UPDATE suppliers SET outstanding_balance = outstanding_balance + $1 WHERE id = $2',
                [balanceImpact, supplier_id]
            );
        }

        await client.query('COMMIT');
        
        await logActivity(req.user.id, 'Ordered Stock (Purchase)', { purchaseId: purchase.id, total_amount }, req.ip);
        
        res.status(201).json(purchase);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
};

const getPurchaseItems = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT pi.*, s.item_name as product_name
            FROM purchase_items pi
            JOIN stock s ON pi.stock_id = s.id
            WHERE pi.purchase_id = $1
        `, [id]);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getPurchases, createPurchase, getPurchaseItems };
