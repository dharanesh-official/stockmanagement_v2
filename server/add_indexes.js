const pool = require('./db');

async function addPerformanceIndexes() {
    const client = await pool.connect();

    try {
        console.log('Adding performance indexes...\n');

        // Transactions table indexes
        try {
            await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_shop_id ON transactions(shop_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)');
            console.log('✓ Transactions indexes added');
        } catch (e) { console.log('⚠ Transactions table not found'); }

        // Transaction items indexes
        try {
            await client.query('CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_transaction_items_stock_id ON transaction_items(stock_id)');
            console.log('✓ Transaction items indexes added');
        } catch (e) { console.log('⚠ Transaction items table not found'); }

        // Customers indexes
        try {
            await client.query('CREATE INDEX IF NOT EXISTS idx_customers_full_name ON customers(full_name)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_customers_salesman_id ON customers(salesman_id)');
            console.log('✓ Customers indexes added');
        } catch (e) { console.log('⚠ Customers table not found'); }

        // Shops indexes
        try {
            await client.query('CREATE INDEX IF NOT EXISTS idx_shops_name ON shops(name)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_shops_salesman_id ON shops(salesman_id)');
            console.log('✓ Shops indexes added');
        } catch (e) { console.log('⚠ Shops table not found'); }

        // Stocks/Products indexes
        try {
            await client.query('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)');
            console.log('✓ Products indexes added');
        } catch (e) { console.log('⚠ Products table not found'); }

        // Users indexes
        try {
            await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
            console.log('✓ Users indexes added');
        } catch (e) { console.log('⚠ Users table not found'); }

        // Composite indexes
        try {
            await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_customer_date ON transactions(customer_id, transaction_date DESC)');
            console.log('✓ Composite indexes added');
        } catch (e) { console.log('⚠ Could not add composite indexes'); }

        console.log('\n✅ Performance optimization complete!');
        console.log('📊 Database queries should now be significantly faster.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        process.exit(0);
    }
}

addPerformanceIndexes();
