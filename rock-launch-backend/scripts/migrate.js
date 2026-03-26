const { Pool } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const oldDbUrl = process.env.DATABASE_URL || "postgresql://postgres:1234@localhost:5432/rock_launch_db";

rl.question('Ingresa el password del nuevo servidor PostgreSQL (192.168.110.201): ', async (password) => {
    const newDbUrl = `postgresql://postgres:${encodeURIComponent(password)}@192.168.110.201:15432/rock_launch_db`;

    const oldPool = new Pool({ connectionString: oldDbUrl });
    const newPool = new Pool({ connectionString: newDbUrl });

    try {
        console.log("\nConectando y creando tablas en el nuevo servidor...");
        // Creamos el esquema
        await newPool.query(`
            CREATE TABLE IF NOT EXISTS departamentos (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, display_order INTEGER DEFAULT 0);
            CREATE TABLE IF NOT EXISTS registro_personas (id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, porcentaje NUMERIC DEFAULT 30, current_dept_index INTEGER DEFAULT 0, token TEXT UNIQUE, has_voted INTEGER DEFAULT 0);
            CREATE TABLE IF NOT EXISTS jurados (id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, porcentaje NUMERIC DEFAULT 70, current_dept_index INTEGER DEFAULT 0, token TEXT UNIQUE, has_voted INTEGER DEFAULT 0);
            CREATE TABLE IF NOT EXISTS presentadores (id SERIAL PRIMARY KEY, name TEXT NOT NULL, department_id INTEGER NOT NULL REFERENCES departamentos(id) ON DELETE CASCADE, photo_url TEXT);
            CREATE TABLE IF NOT EXISTS resultados_votaciones (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, user_type TEXT CHECK (user_type IN ('PUBLIC','JURY')) NOT NULL, department_id INTEGER NOT NULL REFERENCES departamentos(id) ON DELETE CASCADE, criteria_scores JSONB NOT NULL, presenter_scores JSONB NOT NULL, timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
            CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT);
        `);

        console.log("Obteniendo configuraciones (app_settings) de la base de datos local...");
        const res = await oldPool.query('SELECT * FROM app_settings;');
        const settings = res.rows;

        console.log(`Se encontraron ${settings.length} configuraciones. Migrando al nuevo servidor...`);

        for (const setting of settings) {
            await newPool.query(
                'INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;',
                [setting.key, setting.value]
            );
        }

        console.log("✅ ¡Migración de tablas y configuraciones completada con éxito!");

        console.log("\n⚠️ IMPORTANTE: Actualiza tu archivo backend/.env con la nueva URL:");
        console.log(`DATABASE_URL="${newDbUrl}"`);

    } catch (e) {
        console.error("❌ Error durante la migración:", e);
    } finally {
        await oldPool.end();
        await newPool.end();
        rl.close();
    }
});
