const pool = require('./db');

const fixSettingsLogoType = async () => {
    try {
        await pool.query('ALTER TABLE company_settings ALTER COLUMN company_logo TYPE TEXT');
        console.log("company_logo column type changed to TEXT successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

fixSettingsLogoType();
