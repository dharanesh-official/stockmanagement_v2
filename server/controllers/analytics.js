const pool = require('../db');

const getSalesmanPerformance = async (req, res) => {
    try {
        const { salesmanId } = req.params;
        const { startDate, endDate } = req.query;
        
        if (req.user.role !== 'admin' && req.user.id != salesmanId) {
            return res.status(403).json({ message: 'Access denied: You can only view your own performance metrics.' });
        }
        
        const params = [salesmanId];
        let dateClause = '';
        if (startDate && endDate) {
            dateClause = ' AND transaction_date BETWEEN $2 AND $3';
            params.push(startDate, endDate);
        }

        // 1. Total Sales and Collections
        const totalsQuery = `
            SELECT 
                COUNT(id) as total_orders,
                SUM(CASE WHEN type IN ('sale', 'order') THEN (COALESCE(total_amount, 0) + COALESCE(gst_amount, 0) + COALESCE(shipping_charge, 0) - COALESCE(discount_amount, 0)) ELSE 0 END) as total_sales_value,
                SUM(CASE WHEN type = 'payment' THEN paid_amount ELSE 0 END) as total_collections
            FROM transactions
            WHERE user_id = $1 ${dateClause}
        `;
        
        // 2. New Customers Acquired
        const customersQuery = `
            SELECT COUNT(id) as new_customers
            FROM customers
            WHERE salesman_id = $1 ${startDate && endDate ? ' AND created_at BETWEEN $2 AND $3' : ''}
        `;

        // 3. Area-wise performance
        const areaQuery = `
            SELECT a.name as area_name, COUNT(s.id) as total_shops, 
                   SUM(CASE WHEN t.type IN ('sale', 'order') THEN (COALESCE(t.total_amount, 0) + COALESCE(t.gst_amount, 0) + COALESCE(t.shipping_charge, 0) - COALESCE(t.discount_amount, 0)) ELSE 0 END) as area_sales
            FROM areas a
            JOIN shops s ON a.id = s.area_id
            LEFT JOIN transactions t ON s.id = t.shop_id AND t.user_id = $1 ${dateClause}
            GROUP BY a.name
        `;

        const [totals, customers, areas] = await Promise.all([
            pool.query(totalsQuery, params),
            pool.query(customersQuery, [salesmanId, ...(startDate && endDate ? [startDate, endDate] : [])]),
            pool.query(areaQuery, params)
        ]);

        res.json({
            performance: totals.rows[0],
            acquisitions: customers.rows[0],
            area_breakdown: areas.rows
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const getGlobalLeaderboard = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const params = [];
        let dateClause = '';
        if (startDate && endDate) {
            dateClause = ' WHERE transaction_date BETWEEN $1 AND $2';
            params.push(startDate, endDate);
        }

        const query = `
            SELECT u.full_name, u.email, 
                   SUM(CASE WHEN t.type IN ('sale', 'order') THEN (COALESCE(t.total_amount, 0) + COALESCE(t.gst_amount, 0) + COALESCE(t.shipping_charge, 0) - COALESCE(t.discount_amount, 0)) ELSE 0 END) as total_sales,
                   COUNT(t.id) FILTER (WHERE t.type IN ('sale', 'order')) as order_count
            FROM users u
            LEFT JOIN transactions t ON u.id = t.user_id ${dateClause}
            WHERE u.role = 'salesman'
            GROUP BY u.id, u.full_name, u.email
            ORDER BY total_sales DESC
        `;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getSalesmanPerformance, getGlobalLeaderboard };
