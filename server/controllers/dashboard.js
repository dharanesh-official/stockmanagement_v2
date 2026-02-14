const pool = require('../db');

const getDashboardStats = async (req, res) => {
    try {
        const { role, id } = req.user;

        // Base queries
        let salesQuery = "SELECT SUM(total_amount) as total FROM transactions WHERE type = 'sale'";
        let recentTransactionsQuery = `
            SELECT t.*, u.full_name as salesman_name, c.full_name as customer_name 
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            JOIN customers c ON t.customer_id = c.id
        `;
        let params = [];

        if (role === 'salesman') {
            salesQuery += " AND user_id = $1";
            recentTransactionsQuery += " WHERE t.user_id = $1";
            params.push(id);
        }

        recentTransactionsQuery += " ORDER BY t.transaction_date DESC LIMIT 5";

        const [
            salesResult,
            customersResult,
            stockResult,
            lowStockResult,
            recentTransactionsResult,
            monthlySalesResult
        ] = await Promise.all([
            pool.query(salesQuery, params),
            pool.query("SELECT COUNT(*) FROM customers"),
            pool.query("SELECT SUM(quantity) as total_qty, SUM(quantity * price) as total_value FROM stock"),
            pool.query("SELECT COUNT(*) FROM stock WHERE quantity < 10"),
            pool.query(recentTransactionsQuery, params),
            pool.query(`
                SELECT SUM(total_amount) as total 
                FROM transactions 
                WHERE type = 'sale' 
                AND transaction_date >= date_trunc('month', CURRENT_DATE)
                ${role === 'salesman' ? 'AND user_id = $1' : ''}
            `, params)
        ]);

        res.json({
            totalSales: parseFloat(salesResult.rows[0].total || 0),
            totalCustomers: parseInt(customersResult.rows[0].count),
            totalStockItems: parseInt(stockResult.rows[0].total_qty || 0),
            totalStockValue: parseFloat(stockResult.rows[0].total_value || 0),
            lowStockCount: parseInt(lowStockResult.rows[0].count),
            recentTransactions: recentTransactionsResult.rows,
            monthlySales: parseFloat(monthlySalesResult.rows[0].total || 0)
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getDashboardStats };
