require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
});

async function clearData() {
    try {
        await pool.query('TRUNCATE TABLE resultados_votaciones, presentadores, jurados, registro_personas, departamentos CASCADE;');
        console.log('Data cleared successfully (excluding app_settings).');
    } catch (e) {
        console.error('Error clearing data in PostgreSQL:', e);
    } finally {
        await pool.end();
    }
}

clearData();
