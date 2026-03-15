const pool = require('../db');

const getDashboardStats = async (req, res) => {
    try {
        const { role, id } = req.user;
        const { period } = req.query; // today, 7d, 30d, 90d

        let dateFilter = '';
        let custDateFilter = '';
        if (period === 'today') {
            dateFilter = " AND transaction_date >= CURRENT_DATE";
            custDateFilter = " AND created_at >= CURRENT_DATE";
        } else if (period === '7d') {
            dateFilter = " AND transaction_date >= CURRENT_DATE - INTERVAL '7 days'";
            custDateFilter = " AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
        } else if (period === '30d') {
            dateFilter = " AND transaction_date >= CURRENT_DATE - INTERVAL '30 days'";
            custDateFilter = " AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
        } else if (period === '90d') {
            dateFilter = " AND transaction_date >= CURRENT_DATE - INTERVAL '90 days'";
            custDateFilter = " AND created_at >= CURRENT_DATE - INTERVAL '90 days'";
        }

        // Base queries
        let salesQuery = "SELECT SUM(COALESCE(total_amount, 0) + COALESCE(shipping_charge, 0) - COALESCE(discount_amount, 0)) as total FROM transactions WHERE type IN ('sale', 'order')";
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

        if (dateFilter) {
            salesQuery += dateFilter;
            // For recent transactions, we might NOT want to filter by date to always show SOMETHING, 
            // or we filter, let's filter as requested by "dashboard analytics"
            if (role === 'salesman') {
                recentTransactionsQuery += dateFilter.replace('AND', 'AND');
            } else {
                recentTransactionsQuery += ' WHERE ' + dateFilter.trim().substring(4);
            }
        }

        recentTransactionsQuery += " ORDER BY t.transaction_date DESC LIMIT 5";

        const topSellingQuery = `
            SELECT s.item_name, SUM(ti.quantity) as sold 
            FROM transaction_items ti 
            JOIN stock s ON ti.stock_id = s.id 
            JOIN transactions t ON ti.transaction_id = t.id 
            WHERE t.type IN ('sale', 'order') ${dateFilter} ${role === 'salesman' ? 'AND t.user_id = $1' : ''}
            GROUP BY s.item_name 
            ORDER BY sold DESC 
            LIMIT 5
        `;

        const [
            salesResult,
            customersResult,
            stockResult,
            lowStockResult,
            recentTransactionsResult,
            monthlySalesResult,
            stockHealthResult,
            topSellingResult,
            lowStockPreviewResult
        ] = await Promise.all([
            pool.query(salesQuery, params),
            pool.query(`SELECT COUNT(*) FROM customers WHERE 1=1 ${custDateFilter} ${role === 'salesman' ? 'AND salesman_id = $1' : ''}`, role === 'salesman' ? [id] : []),
            pool.query("SELECT SUM(quantity) as total_qty, SUM(quantity * price) as total_value FROM stock"),
            pool.query("SELECT COUNT(*) FROM stock WHERE quantity < 10"),
            pool.query(recentTransactionsQuery, params),
            pool.query(`
                SELECT SUM(COALESCE(total_amount, 0) + COALESCE(shipping_charge, 0) - COALESCE(discount_amount, 0)) as total 
                FROM transactions 
                WHERE type IN ('sale', 'order') 
                AND transaction_date >= date_trunc('month', CURRENT_DATE)
                ${role === 'salesman' ? 'AND user_id = $1' : ''}
            `, params),
            pool.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE quantity >= 10) as healthy,
                    COUNT(*) FILTER (WHERE quantity > 0 AND quantity < 10) as low,
                    COUNT(*) FILTER (WHERE quantity <= 0) as out_of_stock
                FROM stock
            `),
            pool.query(topSellingQuery, role === 'salesman' ? params : []),
            pool.query("SELECT item_name, quantity FROM stock WHERE quantity < 10 ORDER BY quantity ASC LIMIT 3")
        ]);

        res.json({
            totalSales: parseFloat(salesResult.rows[0].total || 0),
            totalCustomers: parseInt(customersResult.rows[0].count),
            totalStockItems: parseInt(stockResult.rows[0].total_qty || 0),
            totalStockValue: parseFloat(stockResult.rows[0].total_value || 0),
            lowStockCount: parseInt(lowStockResult.rows[0].count),
            recentTransactions: recentTransactionsResult.rows,
            monthlySales: parseFloat(monthlySalesResult.rows[0].total || 0),
            stockHealth: {
                healthy: parseInt(stockHealthResult.rows[0].healthy),
                low: parseInt(stockHealthResult.rows[0].low),
                out: parseInt(stockHealthResult.rows[0].out_of_stock)
            },
            topSelling: topSellingResult.rows,
            lowStockPreview: lowStockPreviewResult.rows
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const globalSearch = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 2) return res.json({ stocks: [], shops: [], customers: [] });

        const { role, id } = req.user;
        const searchTerm = `%${query}%`;

        // Search Queries Preparation

        const stocksPromise = pool.query(
            "SELECT id, item_name as name, 'product' as type, sku FROM stock WHERE item_name ILIKE $1 OR sku ILIKE $1 LIMIT 5",
            [searchTerm]
        );

        let shopsQuery = "SELECT id, name, 'shop' as type, shop_code FROM shops WHERE (name ILIKE $1 OR shop_code ILIKE $1)";
        let shopParams = [searchTerm];
        if (role === 'salesman') {
            shopsQuery += " AND salesman_id = $2";
            shopParams.push(id);
        }
        shopsQuery += " LIMIT 5";
        const shopsPromise = pool.query(shopsQuery, shopParams);

        let custQuery = "SELECT id, full_name as name, 'customer' as type, phone FROM customers WHERE (full_name ILIKE $1 OR phone ILIKE $1)";
        let custParams = [searchTerm];
        if (role === 'salesman') {
            custQuery += " AND salesman_id = $2";
            custParams.push(id);
        }
        custQuery += " LIMIT 5";
        const customersPromise = pool.query(custQuery, custParams);

        // Execute in parallel for speed
        const [stocks, shops, customers] = await Promise.all([
            stocksPromise,
            shopsPromise,
            customersPromise
        ]);

        res.json({
            stocks: stocks.rows,
            shops: shops.rows,
            customers: customers.rows
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getDashboardStats, globalSearch };
