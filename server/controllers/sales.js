const pool = require('../db');

const getSales = async (req, res) => {
    try {
        const { role, id } = req.user;
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;

        let query = `
      SELECT t.*, u.full_name as salesman_name, c.full_name as customer_name, s.name as shop_name, s.location as shop_location,
             (t.total_amount + t.gst_amount + t.shipping_charge - t.discount_amount - t.paid_amount) as due_amount,
             EXTRACT(DAY FROM (NOW() - t.due_date)) as days_overdue
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN customers c ON t.customer_id = c.id
      LEFT JOIN shops s ON t.shop_id = s.id
    `;
        const params = [];

        if (role !== 'admin') {
            query += ' WHERE (t.user_id = $1 OR s.salesman_id = $1 OR c.salesman_id = $1)';
            params.push(id);
        }

        query += ' ORDER BY t.transaction_date DESC LIMIT $' + (params.length + 1);
        params.push(limit);

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, id: userId } = req.user;
        let query = `
      SELECT t.*, u.full_name as salesman_name, c.full_name as customer_name, c.phone as customer_phone, c.address as customer_address, 
             s.name as shop_name, s.address as shop_address, s.phone as shop_phone, s.salesman_id as shop_salesman_id, s.location as shop_location
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN customers c ON t.customer_id = c.id
      LEFT JOIN shops s ON t.shop_id = s.id
      WHERE t.id = $1
    `;
        const params = [id];

        if (role !== 'admin') {
            query += ' AND (t.user_id = $2 OR s.salesman_id = $2 OR c.salesman_id = $2)';
            params.push(userId);
        }

        const result = await pool.query(query, params);
        if (result.rows.length === 0) return res.status(404).send('Transaction not found or access denied');
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const generateInvoiceNumber = async (client) => {
    const year = new Date().getFullYear();
    const result = await client.query(
        "SELECT COUNT(*) FROM transactions WHERE type IN ('order', 'sale') AND invoice_number LIKE $1",
        [`ORD-${year}-%`]
    );
    const count = parseInt(result.rows[0].count) + 1;
    return `ORD-${year}-${count.toString().padStart(4, '0')}`;
};

const createSale = async (req, res) => {
    const client = await pool.connect();
    try {
        const { 
            customer_id, shop_id, type, items, notes, due_date, 
            payment_method, applied_invoice_id, order_type, 
            gst_amount = 0, discount_amount = 0, shipping_charge = 0 
        } = req.body;
        const user_id = req.user.id;

        await client.query('BEGIN');

        const invoice_number = await generateInvoiceNumber(client);

        // Fetch Customer Info
        const custRes = await client.query('SELECT balance, credit_limit FROM customers WHERE id = $1', [customer_id]);
        if (custRes.rows.length === 0) throw new Error('Customer not found');
        const customer = custRes.rows[0];

        let subtotal = req.body.amount || 0;
        if (items && items.length > 0) {
            subtotal = 0;
            for (const item of items) {
                subtotal += item.quantity * item.price;
            }
        }

        const total_payable = Number(subtotal) + Number(gst_amount) + Number(shipping_charge) - Number(discount_amount);
        const paid_amount = Number(req.body.paid_amount) || 0;

        // Credit Limit Check
        if (type === 'order' || type === 'sale') {
            const netAdjustment = total_payable - paid_amount;
            const projectedBalance = Number(customer.balance) + netAdjustment;
            const limit = Number(customer.credit_limit);

            if (limit > 0 && projectedBalance > limit) {
                throw new Error(`Credit limit exceeded. New Balance: ₹${projectedBalance.toFixed(2)}, Limit: ₹${limit}`);
            }
        }

        let status = type === 'order' ? 'Ordered' : 'completed';

        const transactionRes = await client.query(
            `INSERT INTO transactions (
                user_id, customer_id, shop_id, type, total_amount, notes, status, 
                paid_amount, due_date, payment_method, applied_invoice_id, 
                invoice_number, order_type, gst_amount, discount_amount, shipping_charge
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
            RETURNING id`,
            [
                user_id, customer_id, shop_id, type, subtotal, notes, status, 
                paid_amount, due_date || null, payment_method, applied_invoice_id, 
                invoice_number, order_type || 'Direct Sale', gst_amount, discount_amount, shipping_charge
            ]
        );
        const transaction_id = transactionRes.rows[0].id;

        // Transaction Items & Stock
        if (items && items.length > 0) {
            for (const item of items) {
                await client.query(
                    'INSERT INTO transaction_items (transaction_id, stock_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)',
                    [transaction_id, item.stock_id, item.quantity, item.price, item.quantity * item.price]
                );

                if (type === 'sale' || type === 'order') {
                    await client.query(
                        'UPDATE stock SET quantity = quantity - $1 WHERE id = $2',
                        [item.quantity, item.stock_id]
                    );
                }
            }
        }

        // Parent-Child Payment Logic
        if (paid_amount > 0) {
            await client.query(
                `INSERT INTO transactions (
                    user_id, customer_id, shop_id, type, total_amount, notes, status, 
                    paid_amount, payment_method, parent_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    user_id, customer_id, shop_id, 'payment', paid_amount, 
                    `Initial payment for Order ${invoice_number}`, 'completed', 
                    paid_amount, payment_method || 'Cash', transaction_id
                ]
            );
        }

        // Update Customer
        const balanceAdjustment = (type === 'sale' || type === 'order') ? (total_payable - paid_amount) : 0;
        await client.query(
            'UPDATE customers SET balance = balance + $1, last_purchase_date = NOW() WHERE id = $2',
            [balanceAdjustment, customer_id]
        );

        await client.query('COMMIT');
        res.json({ message: 'Transaction created successfully', transaction_id, invoice_number });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error.message);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

const deleteSale = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, id: userId } = req.user;

        let query = 'DELETE FROM transactions t';
        const params = [id];

        if (role !== 'admin') {
            // Using a subquery for delete isolation
            query += ' WHERE t.id = $1 AND (t.user_id = $2 OR EXISTS (SELECT 1 FROM shops s WHERE s.id = t.shop_id AND s.salesman_id = $2) OR EXISTS (SELECT 1 FROM customers c WHERE c.id = t.customer_id AND c.salesman_id = $2))';
            params.push(userId);
        } else {
            query += ' WHERE t.id = $1';
        }

        const result = await pool.query(query, params);
        if (result.rowCount === 0) return res.status(404).send('Transaction not found or access denied');
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const updateSale = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes, status } = req.body;
        const { role, id: userId } = req.user;

        let query = 'UPDATE transactions t SET notes = $1, status = $2';
        const params = [notes, status, id];

        if (role !== 'admin') {
            query += ' FROM customers c LEFT JOIN shops s ON t.shop_id = s.id WHERE t.customer_id = c.id AND t.id = $3 AND (t.user_id = $4 OR s.salesman_id = $4 OR c.salesman_id = $4)';
            params.push(userId);
        } else {
            query += ' WHERE t.id = $3';
        }

        query += ' RETURNING t.*';

        const result = await pool.query(query, params);
        if (result.rows.length === 0) return res.status(404).send('Transaction not found or access denied');
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const getSaleItems = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT ti.stock_id, s.item_name as name, ti.quantity, ti.unit_price as price 
             FROM transaction_items ti 
             JOIN stock s ON ti.stock_id = s.id 
             WHERE ti.transaction_id = $1`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const updateOrderPayment = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { amountPaid } = req.body;

        await client.query('BEGIN');

        const transRes = await client.query('SELECT total_amount, paid_amount, customer_id, status FROM transactions WHERE id = $1', [id]);
        if (transRes.rows.length === 0) throw new Error('Order not found');

        const trans = transRes.rows[0];
        const newPaidAmount = Number(trans.paid_amount) + Number(amountPaid);
        const total = Number(trans.total_amount);

        await client.query(
            'UPDATE transactions SET paid_amount = $1 WHERE id = $2',
            [newPaidAmount, id]
        );

        await client.query(
            'UPDATE customers SET balance = balance - $1 WHERE id = $2',
            [amountPaid, trans.customer_id]
        );

        // Record a dedicated payment entry for the history/audit trail
        await client.query(
            'INSERT INTO transactions (user_id, customer_id, type, total_amount, notes, status, paid_amount) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [req.user.id, trans.customer_id, 'payment', amountPaid, `Installment for Order #${id.slice(0, 8).toUpperCase()}`, 'completed', amountPaid]
        );

        await client.query('COMMIT');
        res.json({ message: 'Payment updated successfully', status: trans.status, paid_amount: newPaidAmount });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
};

const getOrderPayments = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT * FROM transactions 
             WHERE type = 'payment' AND notes LIKE $1 
             ORDER BY transaction_date DESC`,
            [`%${id.slice(0, 8).toUpperCase()}%`]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const getSalesAnalytics = async (req, res) => {
    try {
        const { role, id } = req.user;
        let baseQuery = "FROM transactions WHERE type IN ('sale', 'order')";
        const params = [];

        if (role !== 'admin') {
            baseQuery += " AND user_id = $1";
            params.push(id);
        }

        const metricsQuery = `
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount + gst_amount + shipping_charge - discount_amount) as total_revenue,
                SUM(paid_amount) as total_collected,
                SUM(total_amount + gst_amount + shipping_charge - discount_amount - paid_amount) as total_pending
            ${baseQuery}
        `;

        const typeQuery = `
            SELECT order_type, COUNT(*) as count 
            ${baseQuery}
            GROUP BY order_type
        `;

        const statusQuery = `
            SELECT status, COUNT(*) as count 
            ${baseQuery}
            GROUP BY status
        `;

        const [metrics, types, statuses] = await Promise.all([
            pool.query(metricsQuery, params),
            pool.query(typeQuery, params),
            pool.query(statusQuery, params)
        ]);

        res.json({
            metrics: metrics.rows[0],
            types: types.rows,
            statuses: statuses.rows
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { 
    getSales, createSale, updateSale, deleteSale, 
    getSaleItems, getSaleById, updateOrderPayment, 
    getOrderPayments, getSalesAnalytics 
};
