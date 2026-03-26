const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../rocklaunch.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Starting total database reset...');

    // Drop tables
    db.run('DROP TABLE IF EXISTS resultados_votaciones');
    db.run('DROP TABLE IF EXISTS registro_personas');
    db.run('DROP TABLE IF EXISTS jurados');

    console.log('Existing data tables dropped.');

    // Recreate tables with new schema (removed UNIQUE on resultados_votaciones)
    db.run(`CREATE TABLE registro_personas (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT NOT NULL, 
        phone TEXT NOT NULL UNIQUE, 
        porcentaje REAL DEFAULT 30, 
        current_dept_index INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE jurados (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT NOT NULL, 
        phone TEXT NOT NULL UNIQUE, 
        porcentaje REAL DEFAULT 70, 
        current_dept_index INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE resultados_votaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        user_id INTEGER NOT NULL, 
        user_type TEXT CHECK(user_type IN ('PUBLIC', 'JURY')) NOT NULL, 
        department_id INTEGER NOT NULL, 
        criteria_scores TEXT NOT NULL, 
        presenter_score INTEGER NOT NULL, 
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, 
        FOREIGN KEY (department_id) REFERENCES departamentos(id)
    )`);

    console.log('Tables recreated successfully without unique constraint on votes.');
});

db.close((err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Database connection closed.');
});
