-- 1. Tabla de Departamentos
CREATE TABLE IF NOT EXISTS departamentos (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0
);

-- 2. Tabla de Registro de Personas (Público)
CREATE TABLE IF NOT EXISTS registro_personas (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    porcentaje NUMERIC DEFAULT 30,
    current_dept_index INTEGER DEFAULT 0
);

-- 3. Tabla para los Jurados
CREATE TABLE IF NOT EXISTS jurados (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    porcentaje NUMERIC DEFAULT 70,
    current_dept_index INTEGER DEFAULT 0
);

-- 4. Tabla de Presentadores
CREATE TABLE IF NOT EXISTS presentadores (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    department_id INTEGER NOT NULL REFERENCES departamentos(id) ON DELETE CASCADE,
    photo_url TEXT
);

-- 5. Tabla de Resultados de las Votaciones
CREATE TABLE IF NOT EXISTS resultados_votaciones (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_type TEXT CHECK (user_type IN ('PUBLIC', 'JURY')) NOT NULL,
    department_id INTEGER NOT NULL REFERENCES departamentos(id),
    criteria_scores JSONB NOT NULL,
    presenter_scores JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, user_type, department_id)
);
