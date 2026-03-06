const pool = require('./db');

const alterSettingsTable = async () => {
    try {
        await pool.query(`
            ALTER TABLE company_settings 
            ADD COLUMN IF NOT EXISTS company_logo VARCHAR(255),
            ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100),
            ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
            ADD COLUMN IF NOT EXISTS email VARCHAR(100),
            ADD COLUMN IF NOT EXISTS website VARCHAR(255),
            ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT '₹',
            ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
            ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
            ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'English',
            ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(20) DEFAULT 'INV-',
            ADD COLUMN IF NOT EXISTS invoice_footer TEXT,
            ADD COLUMN IF NOT EXISTS settings_json JSONB DEFAULT '{}'::jsonb;
        `);
        console.log("company_settings table altered successfully.");

        // Create activity_log table for tracking admin actions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(255) NOT NULL,
                details JSONB,
                ip_address VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("activity_log table created successfully.");

        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

alterSettingsTable();
