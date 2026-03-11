const pool = require('../db');
const { logActivity } = require('../utils/logger');
const { sendNotification } = require('../utils/notifications');

const getReturns = async (req, res) => {
    try {
        const { role, id } = req.user;
        let query = `
            SELECT r.*, t.invoice_number as original_invoice, c.full_name as customer_name, s.name as shop_name, u.full_name as processed_by
            FROM returns r
            LEFT JOIN transactions t ON r.transaction_id = t.id
            LEFT JOIN customers c ON r.customer_id = c.id
            LEFT JOIN shops s ON r.shop_id = s.id
            LEFT JOIN users u ON r.user_id = u.id
        `;
        const params = [];

        if (role !== 'admin') {
            query += ' WHERE r.user_id = $1 OR s.salesman_id = $1';
            params.push(id);
        }

        query += ' ORDER BY r.created_at DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const createReturn = async (req, res) => {
    const client = await pool.connect();
    try {
        const { transaction_id, customer_id, shop_id, reason, items } = req.body;
        const user_id = req.user.id;

        await client.query('BEGIN');

        // Generate return number
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const countRes = await client.query("SELECT nextval('return_num_seq')");
        const count = countRes.rows[0].nextval;
        const return_number = `RET-${year}${month}-${count.toString().padStart(4, '0')}`;

        let total_refund_amount = 0;
        for (const item of items) {
            total_refund_amount += item.quantity * item.refund_price;
        }

        const returnRes = await client.query(
            `INSERT INTO returns (transaction_id, user_id, customer_id, shop_id, return_number, total_refund_amount, reason) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [transaction_id, user_id, customer_id, shop_id, return_number, total_refund_amount, reason]
        );
        const return_id = returnRes.rows[0].id;

        for (const item of items) {
            const total_refund_price = item.quantity * item.refund_price;
            await client.query(
                `INSERT INTO return_items (return_id, stock_id, quantity, refund_price, total_refund_price) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [return_id, item.stock_id, item.quantity, item.refund_price, total_refund_price]
            );

            // Update Stock (Returned items go back to stock)
            await client.query(
                'UPDATE stock SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2',
                [item.quantity, item.stock_id]
            );
        }

        // Update Customer Balance (Deduct from balance)
        if (customer_id) {
            await client.query(
                'UPDATE customers SET balance = balance - $1 WHERE id = $2',
                [total_refund_amount, customer_id]
            );
        }

        await client.query('COMMIT');

        await logActivity(user_id, 'Processed Return', { returnId: return_id, return_number, total: total_refund_amount }, req.ip);
        
        if (total_refund_amount > 10000) {
            await sendNotification(null, 'High Value Return', `Return ${return_number} for ₹${total_refund_amount.toLocaleString()} was processed.`, 'info');
        }

        res.status(201).json({ message: 'Return processed successfully', return_id, return_number });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error.message);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

const getReturnItems = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT ri.*, s.item_name as product_name 
             FROM return_items ri 
             JOIN stock s ON ri.stock_id = s.id 
             WHERE ri.return_id = $1`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getReturns, createReturn, getReturnItems };
