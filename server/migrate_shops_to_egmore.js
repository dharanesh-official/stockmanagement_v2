const pool = require('./db');

const migrateToEgmore = async () => {
    try {
        console.log('Finding or creating Egmore area...');

        // Find egmore area (case insensitive)
        let areaRes = await pool.query("SELECT * FROM areas WHERE LOWER(name) = 'egmore'");
        let egmoreId;

        if (areaRes.rows.length > 0) {
            egmoreId = areaRes.rows[0].id;
            console.log(`Found Egmore with ID: ${egmoreId}`);
        } else {
            // Create if it doesn't exist just in case
            console.log('Egmore area not found. Creating it...');
            const insertRes = await pool.query(
                "INSERT INTO areas (name) VALUES ('Egmore') RETURNING id"
            );
            egmoreId = insertRes.rows[0].id;
            console.log(`Created Egmore with ID: ${egmoreId}`);
        }

        // Update all shops
        console.log(`Updating all shops to have area_id = ${egmoreId}...`);
        const updateRes = await pool.query(
            "UPDATE shops SET area_id = $1",
            [egmoreId]
        );

        console.log(`Updated ${updateRes.rowCount} shops successfully.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrateToEgmore();
