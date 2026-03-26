require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
});

async function clearVotingData() {
    try {
        console.log('Clearing voting and registration data from PostgreSQL...');
        await pool.query('TRUNCATE TABLE resultados_votaciones, registro_personas, jurados CASCADE;');
        console.log('Data cleared successfully. Configuration (departamentos, presentadores) kept intact.');
    } catch (e) {
        console.error('Error clearing data in PostgreSQL:', e);
    } finally {
        await pool.end();
    }
}

clearVotingData();
