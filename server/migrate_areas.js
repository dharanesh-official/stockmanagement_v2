const pool = require('./db');

const migrateAreas = async () => {
    try {
        console.log('Starting migration for areas...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS areas (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('areas table created or already exists');

        // Add area_id to shops if it doesn't exist
        const query = `
            ALTER TABLE shops 
            ADD COLUMN IF NOT EXISTS area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL;
        `;
        await pool.query(query);
        console.log('Added area_id column to shops table');

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrateAreas();
