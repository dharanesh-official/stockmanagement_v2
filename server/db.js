require('dotenv').config();
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString ? connectionString : undefined,
    ssl: connectionString ? { rejectUnauthorized: false } : false, // Required for Supabase
    // Fallback if DATABASE_URL is not set
    user: connectionString ? undefined : process.env.DB_USER,
    host: connectionString ? undefined : process.env.DB_HOST,
    database: connectionString ? undefined : process.env.DB_NAME,
    password: connectionString ? undefined : process.env.DB_PASSWORD,
    port: connectionString ? undefined : process.env.DB_PORT,
});

module.exports = pool;
