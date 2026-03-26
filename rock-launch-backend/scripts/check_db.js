
const { Pool } = require('pg');
require('dotenv').config();

async function checkDB() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
  });

  try {
    const tables = ['departamentos', 'registro_personas', 'jurados', 'presentadores', 'resultados_votaciones'];
    for (const table of tables) {
      const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`Table ${table}: ${res.rows[0].count} rows`);
    }
    
    if (parseInt((await pool.query('SELECT COUNT(*) FROM departamentos')).rows[0].count) > 0) {
        const depts = await pool.query('SELECT * FROM departamentos');
        console.log('Departments:', depts.rows);
    }
  } catch (err) {
    console.error('Error checking DB:', err.message);
  } finally {
    await pool.end();
  }
}

checkDB();
