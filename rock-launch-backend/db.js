const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
const dbPath = path.resolve(__dirname, 'rocklaunch.db');

const translateQuery = (sql) => {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
};

const normalizeNumericStrings = (row) => {
    if (!row) return row;
    Object.keys(row).forEach((key) => {
        if (typeof row[key] === 'string' && /^-?\d+\.?\d*$/.test(row[key])) {
            const num = Number(row[key]);
            if (!Number.isNaN(num)) row[key] = num;
        }
    });
    return row;
};

const initSQLite = () => {
    const sqliteLibrary = require('sqlite3').verbose();
    console.log('Initializing SQLite...');
    const rawDb = new sqliteLibrary.Database(dbPath, (err) => {
        if (err) console.error('Error opening SQLite database:', err.message);
        else console.log('Connected to SQLite.');
    });

    rawDb.serialize(() => {
        rawDb.run('PRAGMA foreign_keys = ON');
        rawDb.run(`CREATE TABLE IF NOT EXISTS departamentos (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, display_order INTEGER DEFAULT 0)`);
        rawDb.run(`CREATE TABLE IF NOT EXISTS registro_personas (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, porcentaje REAL DEFAULT 30, current_dept_index INTEGER DEFAULT 0, token TEXT UNIQUE, has_voted INTEGER DEFAULT 0)`);
        rawDb.run(`CREATE TABLE IF NOT EXISTS jurados (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, porcentaje REAL DEFAULT 70, current_dept_index INTEGER DEFAULT 0, token TEXT UNIQUE, has_voted INTEGER DEFAULT 0)`);
        rawDb.run(`CREATE TABLE IF NOT EXISTS presentadores (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, department_id INTEGER NOT NULL, photo_url TEXT, FOREIGN KEY (department_id) REFERENCES departamentos(id) ON DELETE CASCADE)`);
        rawDb.run(`CREATE TABLE IF NOT EXISTS resultados_votaciones (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, user_type TEXT CHECK(user_type IN ('PUBLIC', 'JURY')) NOT NULL, department_id INTEGER NOT NULL, criteria_scores TEXT NOT NULL, presenter_scores TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (department_id) REFERENCES departamentos(id) ON DELETE CASCADE)`);
        rawDb.run(`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT)`);
    });

    return {
        get: (sql, params, cb) => rawDb.get(sql, params || [], cb),
        all: (sql, params, cb) => rawDb.all(sql, params || [], cb),
        run: (sql, params, cb) => rawDb.run(sql, params || [], function (err) { if (cb) cb.call(this, err); }),
        prepare: (sql) => {
            const stmt = rawDb.prepare(sql);
            return {
                run: function (...args) {
                    const callback = args.length > 0 && typeof args[args.length - 1] === 'function' ? args.pop() : null;
                    stmt.run(...args, function (err) { if (callback) callback.call(this, err); });
                },
                finalize: () => stmt.finalize()
            };
        },
        serialize: (cb) => rawDb.serialize(cb),
        raw: rawDb
    };
};

const initPostgres = () => {
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
    });

    pool.query('SELECT 1')
        .then(() => console.log('Connected to Postgres.'))
        .catch((err) => console.error('Postgres connectivity check failed:', err.message));

    const pgWrapper = {
        get: (sql, params, cb) => {
            const pgSql = translateQuery(sql);
            pool.query(pgSql, params || [])
                .then((result) => cb(null, normalizeNumericStrings(result.rows[0])))
                .catch((err) => cb(err));
        },
        all: (sql, params, cb) => {
            const pgSql = translateQuery(sql);
            pool.query(pgSql, params || [])
                .then((result) => cb(null, result.rows.map(normalizeNumericStrings)))
                .catch((err) => cb(err));
        },
        run: (sql, params, cb) => {
            let pgSql = translateQuery(sql);
            if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
                if (!pgSql.includes('app_settings')) pgSql += ' RETURNING id';
            }
            pool.query(pgSql, params || [])
                .then((result) => {
                    const lastID = result.rows[0]?.id || null;
                    const resObj = { lastID, changes: result.rowCount };
                    if (cb) cb.call(resObj, null);
                })
                .catch((err) => { if (cb) cb(err); });
        },
        prepare: (sql) => ({
            run: function (...args) {
                const callback = args.length > 0 && typeof args[args.length - 1] === 'function' ? args.pop() : null;
                pgWrapper.run(sql, args, function (err) { if (callback) callback.call(this, err); });
            },
            finalize: () => { }
        }),
        serialize: (cb) => cb(),
        pool
    };

    return pgWrapper;
};

let currentDb;
if (DATABASE_URL) {
    currentDb = initPostgres();
} else {
    currentDb = initSQLite();
}

module.exports = {
    get: (sql, params, cb) => currentDb.get(sql, params, cb),
    all: (sql, params, cb) => currentDb.all(sql, params, cb),
    run: (sql, params, cb) => currentDb.run(sql, params, cb),
    prepare: (sql) => currentDb.prepare(sql),
    serialize: (cb) => currentDb.serialize(cb),
    raw: () => currentDb.raw || currentDb.pool
};
