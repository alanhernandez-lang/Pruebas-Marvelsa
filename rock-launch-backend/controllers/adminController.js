// Version Debug 2.0
const db = require('../db');
const XLSX = require('xlsx');
const { randomUUID } = require('crypto');

const generateShortToken = () => randomUUID().split('-')[0].toUpperCase();

const handleSQLError = (res, err) => {
    console.error('SQL Error:', err);
    res.status(500).json({ error: err.message || 'Database error' });
};

// Departments
exports.addDepartment = (req, res) => {
    const { name, display_order } = req.body;
    const order = parseInt(display_order) || 0;
    db.run('INSERT INTO departamentos (name, display_order) VALUES (?, ?)', [name, order], function (err) {
        if (err) return handleSQLError(res, err);
        res.json({ id: this.lastID, name, display_order: order });
    });
};

exports.deleteDepartment = (req, res) => {
    db.run('DELETE FROM departamentos WHERE id = ?', [req.params.id], (err) => {
        if (err) return handleSQLError(res, err);
        res.json({ message: 'Department deleted' });
    });
};

exports.updateDepartment = (req, res) => {
    const { name, display_order } = req.body;
    const order = parseInt(display_order) || 0;
    db.run('UPDATE departamentos SET name = ?, display_order = ? WHERE id = ?', [name, order, req.params.id], function (err) {
        if (err) return handleSQLError(res, err);
        res.json({ message: 'Department updated' });
    });
};

// Presenters
exports.getPresenters = (req, res) => {
    db.all(`
        SELECT p.*, d.name as department_name 
        FROM presentadores p 
        LEFT JOIN departamentos d ON p.department_id = d.id
    `, [], (err, rows) => {
        if (err) return handleSQLError(res, err);
        res.json(rows);
    });
};

exports.addPresenter = (req, res) => {
    const { name, department_id } = req.body;
    let photo_url = null;

    if (req.file) {
        const base64 = req.file.buffer.toString('base64');
        photo_url = `data:${req.file.mimetype};base64,${base64}`;
    }

    db.run('INSERT INTO presentadores (name, department_id, photo_url) VALUES (?, ?, ?)',
        [name, department_id, photo_url], function (err) {
            if (err) return handleSQLError(res, err);
            res.json({ id: this.lastID, name, department_id, photo_url: 'Base64 data saved' });
        });
};

exports.deletePresenter = (req, res) => {
    db.run('DELETE FROM presentadores WHERE id = ?', [req.params.id], (err) => {
        if (err) return handleSQLError(res, err);
        res.json({ message: 'Presenter deleted' });
    });
};

exports.updatePresenter = (req, res) => {
    const { name, department_id } = req.body;
    let photo_url = null;

    if (req.file) {
        const base64 = req.file.buffer.toString('base64');
        photo_url = `data:${req.file.mimetype};base64,${base64}`;
    }

    let query = 'UPDATE presentadores SET name = ?, department_id = ?';
    let params = [name, department_id];

    if (photo_url) {
        query += ', photo_url = ?';
        params.push(photo_url);
    }
    query += ' WHERE id = ?';
    params.push(req.params.id);

    db.run(query, params, function (err) {
        if (err) return handleSQLError(res, err);
        res.json({ message: 'Presenter updated', photo_url: photo_url ? 'Base64 data updated' : null });
    });
};

// People
exports.getPeople = (req, res) => {
    const query = `
    SELECT id, name, phone, porcentaje, token, has_voted, 'PUBLIC' as type FROM registro_personas
    UNION ALL
    SELECT id, name, phone, porcentaje, token, has_voted, 'JURY' as type FROM jurados
    ORDER BY name ASC
  `;
    db.all(query, [], (err, rows) => {
        if (err) return handleSQLError(res, err);
        res.json(rows);
    });
};

exports.addPerson = (req, res) => {
    const { name, phone, isJury } = req.body;

    // Regex Validation
    const phoneRegex = /^\d{10,15}$/;
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    if (!nameRegex.test(name)) {
        return res.status(400).json({ error: 'El nombre solo debe contener letras.' });
    }

    if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'El teléfono debe tener entre 10 y 15 números.' });
    }

    const targetTable = isJury ? 'jurados' : 'registro_personas';
    const percentage = isJury ? 70 : 30;
    const token = generateShortToken(); // Short unique token

    db.run(`INSERT INTO ${targetTable} (name, phone, porcentaje, token) VALUES (?, ?, ?, ?)`,
        [name, phone, percentage, token], function (err) {
            if (err) return handleSQLError(res, err);
            res.json({ id: this.lastID, name, phone, type: isJury ? 'JURY' : 'PUBLIC', porcentaje: percentage, token });
        });
};

exports.deletePerson = (req, res) => {
    const { type, id } = req.params;
    const targetTable = type === 'JURY' ? 'jurados' : 'registro_personas';
    db.run(`DELETE FROM ${targetTable} WHERE id = ?`, [id], (err) => {
        if (err) return handleSQLError(res, err);
        res.json({ message: 'Person deleted' });
    });
};

exports.updatePerson = (req, res) => {
    const { type, id } = req.params;
    const { name, phone, isJury } = req.body;

    // Regex Validation
    const phoneRegex = /^\d{10,15}$/;
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    if (!nameRegex.test(name)) {
        return res.status(400).json({ error: 'El nombre solo debe contener letras.' });
    }

    if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'El teléfono debe tener entre 10 y 15 números.' });
    }

    const oldTable = type === 'JURY' ? 'jurados' : 'registro_personas';
    const newTable = isJury ? 'jurados' : 'registro_personas';
    const percentage = isJury ? 70 : 30;

    if (oldTable === newTable) {
        db.run(`UPDATE ${oldTable} SET name = ?, phone = ?, porcentaje = ? WHERE id = ?`,
            [name, phone, percentage, id], function (err) {
                if (err) return handleSQLError(res, err);
                // Also ensure person has a token if they don't
                db.run(`UPDATE ${oldTable} SET token = ? WHERE id = ? AND (token IS NULL OR token = "")`,
                    [generateShortToken(), id]);
                res.json({ message: 'Person updated' });
            });
    } else {
        // Role change: Move between tables
        const newToken = generateShortToken();
        db.serialize(() => {
            db.run(`DELETE FROM ${oldTable} WHERE id = ?`, [id]);
            db.run(`INSERT INTO ${newTable} (name, phone, porcentaje, token) VALUES (?, ?, ?, ?)`,
                [name, phone, percentage, newToken], function (err) {
                    if (err) return handleSQLError(res, err);
                    res.json({ message: 'Person updated and role changed' });
                });
        });
    }
};

// Version Debug 2.0 - Detección inteligente de cabeceras
exports.importPeople = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Obtenemos los datos como matriz (arreglo de arreglos)
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rows || rows.length === 0) {
            return res.status(400).json({ error: 'El archivo Excel parece estar vacío.' });
        }

        // Buscar la fila de cabeceras (la primera que tenga algo parecido a "Nombre" o "Telefono")
        let headerRowIndex = -1;
        let columnMapping = { name: -1, phone: -1, type: -1 };

        const normalize = (val) => String(val || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const nameIdx = row.findIndex(c => normalize(c).includes("nombre") || normalize(c).includes("name") || normalize(c).includes("completo"));
            const phoneIdx = row.findIndex(c => normalize(c).includes("telefono") || normalize(c).includes("phone") || normalize(c).includes("celular") || normalize(c).includes("whatsapp"));
            const typeIdx = row.findIndex(c => normalize(c).includes("tipo") || normalize(c).includes("type") || normalize(c).includes("rol") || normalize(c).includes("jurado"));

            if (nameIdx !== -1 && phoneIdx !== -1) {
                headerRowIndex = i;
                columnMapping = { name: nameIdx, phone: phoneIdx, type: typeIdx };
                break;
            }
        }

        if (headerRowIndex === -1) {
            console.log("No se detectaron cabeceras válidas en las primeras 10 filas. Filas analizadas:", rows.slice(0, 5));
            return res.status(400).json({ error: 'No se encontraron las columnas correctas (Nombre y Teléfono). Asegúrate de que las cabeceras estén en las primeras filas.' });
        }

        console.log(`Cabeceras detectadas en fila ${headerRowIndex + 1}:`, {
            nombre: rows[headerRowIndex][columnMapping.name],
            telefono: rows[headerRowIndex][columnMapping.phone],
            tipo: columnMapping.type !== -1 ? rows[headerRowIndex][columnMapping.type] : 'N/A'
        });

        const isPostgres = !!process.env.DATABASE_URL;
        const insertQuery = (table) => isPostgres
            ? `INSERT INTO ${table} (name, phone, porcentaje, token) VALUES (?, ?, ?, ?) ON CONFLICT (phone) DO NOTHING`
            : `INSERT OR IGNORE INTO ${table} (name, phone, porcentaje, token) VALUES (?, ?, ?, ?)`;

        const jurySql = insertQuery('jurados');
        const publicSql = insertQuery('registro_personas');

        let insertedCount = 0;
        let skippedCount = 0;

        // Procesar datos a partir de la fila siguiente a las cabeceras
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            let name = String(row[columnMapping.name] || "").trim();
            let phone = String(row[columnMapping.phone] || "").replace(/\D/g, "");
            let typeStr = columnMapping.type !== -1 ? String(row[columnMapping.type] || "").toUpperCase() : "";

            if (name && phone) {
                // Si tiene 10 dígitos y NO empieza con 1 (USA), prepender 52 (MX)
                if (phone.length === 10 && !phone.startsWith('1')) {
                    phone = '52' + phone;
                }

                const isJury = typeStr.includes('JURADO') || typeStr.includes('JURY') || typeStr === 'J' || typeStr.includes('JURADA');
                const targetSql = isJury ? jurySql : publicSql;
                const weight = isJury ? 70 : 30;
                const token = generateShortToken();

                await new Promise((resolve) => {
                    db.run(targetSql, [name, phone, weight, token], function (err) {
                        if (err) {
                            console.log(`❌ ERROR BD para ${name}:`, err.message);
                            skippedCount++;
                        } else if (this && this.changes > 0) {
                            console.log(`✅ INSERTADO: ${name} (${phone})`);
                            insertedCount++;
                        } else {
                            console.log(`⚠️ OMITIDO: ${name} (${phone})`);
                            skippedCount++;
                        }
                        resolve();
                    });
                });
            } else if (name || phone) {
                // Solo loguear si al menos tiene un dato pero está incompleto
                console.log('⚠️ Fila incompleta:', { name: name || 'VACÍO', phone: phone || 'VACÍO' });
                skippedCount++;
            }
        }

        res.json({
            message: 'Importación finalizada.',
            details: `Insertados: ${insertedCount}, Omitidos: ${skippedCount}`,
            total: rows.length - (headerRowIndex + 1)
        });
    } catch (err) {
        console.error('Import error:', err);
        res.status(500).json({ error: 'Error al procesar el archivo Excel: ' + err.message });
    }
};

exports.getStatsHistory = (req, res) => {
    db.all('SELECT * FROM resultados_votaciones ORDER BY timestamp ASC', [], (err, votes) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all('SELECT * FROM departamentos ORDER BY display_order ASC, id ASC', [], (dErr, depts) => {
            if (dErr) return res.status(500).json({ error: dErr.message });

            db.all('SELECT * FROM presentadores', [], (pErr, presenters) => {
                if (pErr) return res.status(500).json({ error: pErr.message });

                res.json({ votes, depts, presenters });
            });
        });
    });
};

exports.getStats = (req, res) => {
    const userQuery = `
      SELECT 'PUBLIC' as type, COUNT(*) as count, AVG(porcentaje) as weight FROM registro_personas
      UNION ALL
      SELECT 'JURY' as type, COUNT(*) as count, AVG(porcentaje) as weight FROM jurados
    `;

    db.all(userQuery, [], (uErr, userSummary) => {
        if (uErr) return res.status(500).json({ error: uErr.message });

        const juryInfo = userSummary.find(item => item.type === 'JURY') || { count: 0, weight: 70 };
        const publicInfo = userSummary.find(item => item.type === 'PUBLIC') || { count: 0, weight: 30 };

        const totalJuryUsers = Number(juryInfo.count) || 0;
        const totalPublicUsers = Number(publicInfo.count) || 0;
        const weightJ = (Number(juryInfo.weight) || 70) / 100;
        const weightP = (Number(publicInfo.weight) || 30) / 100;

        db.all('SELECT * FROM departamentos ORDER BY display_order ASC, id ASC', [], (dErr, depts) => {
            if (dErr) return res.status(500).json({ error: dErr.message });

            db.all('SELECT * FROM presentadores', [], (pErr, presenters) => {
                if (pErr) return res.status(500).json({ error: pErr.message });

                const deptPresenters = {};
                presenters.forEach(p => {
                    const d_id = Number(p.department_id);
                    if (!deptPresenters[d_id]) deptPresenters[d_id] = [];
                    deptPresenters[d_id].push(p);
                });

                db.all(`SELECT * FROM resultados_votaciones`, [], (err, rows) => {
                    if (err) return res.status(500).json({ error: err.message });

                    const deptStats = {};
                    const presenterStats = {};

                    rows.forEach((row) => {
                        const deptId = Number(row.department_id);
                        const type = row.user_type;
                        const scores = typeof row.criteria_scores === 'string' ? JSON.parse(row.criteria_scores) : row.criteria_scores;
                        const pScores = typeof row.presenter_scores === 'string' ? JSON.parse(row.presenter_scores) : row.presenter_scores;

                        if (!deptStats[deptId]) {
                            deptStats[deptId] = {
                                jury: { criteriaSum: { attitude: 0, creativity: 0, clarity: 0, impact: 0 }, count: 0 },
                                public: { criteriaSum: { attitude: 0, creativity: 0, clarity: 0, impact: 0 }, count: 0 }
                            };
                        }

                        const dTarg = type === 'JURY' ? deptStats[deptId].jury : deptStats[deptId].public;
                        dTarg.count++;
                        for (const key in scores || {}) {
                            dTarg.criteriaSum[key] = (dTarg.criteriaSum[key] || 0) + Number(scores[key] || 0);
                        }

                        for (const [pId, score] of Object.entries(pScores || {})) {
                            const pIdNum = Number(pId);
                            if (!presenterStats[pIdNum]) {
                                presenterStats[pIdNum] = { jury: { sum: 0, count: 0 }, public: { sum: 0, count: 0 } };
                            }
                            const pTarg = type === 'JURY' ? presenterStats[pIdNum].jury : presenterStats[pIdNum].public;
                            pTarg.sum += Number(score || 0);
                            pTarg.count++;
                        }
                    });

                    const results = [];
                    depts.forEach((dept) => {
                        const dId = Number(dept.id);
                        const dData = deptStats[dId] || {
                            jury: { criteriaSum: { attitude: 0, creativity: 0, clarity: 0, impact: 0 }, count: 0 },
                            public: { criteriaSum: { attitude: 0, creativity: 0, clarity: 0, impact: 0 }, count: 0 }
                        };

                        const processGroup = (group) => {
                            if (group.count === 0) return { score: 0, count: 0 };
                            let totalCriteria = 0;
                            let criteriaCount = 0;
                            for (const key in group.criteriaSum) {
                                totalCriteria += group.criteriaSum[key];
                                criteriaCount++;
                            }
                            const avgCriteria = (totalCriteria / (group.count * (criteriaCount || 4)));
                            const criteriaNorm = (avgCriteria / 5) * 100;
                            return { score: isNaN(criteriaNorm) ? 0 : criteriaNorm, count: group.count };
                        };

                        const juryDept = processGroup(dData.jury);
                        const pubDept = processGroup(dData.public);

                        const presenters_list = deptPresenters[dId] || [];
                        let totalPresenterAvgJury = 0;
                        let totalPresenterAvgPub = 0;
                        let presenterResults = [];

                        presenters_list.forEach(p => {
                            const pId = Number(p.id);
                            const pData = presenterStats[pId] || { jury: { sum: 0, count: 0 }, public: { sum: 0, count: 0 } };
                            const avgJ = pData.jury.count > 0 ? (pData.jury.sum / pData.jury.count) : 0;
                            const avgP = pData.public.count > 0 ? (pData.public.sum / pData.public.count) : 0;

                            let combinedP = 0;
                            if (pData.jury.count > 0 && pData.public.count > 0) {
                                combinedP = (avgJ * weightJ) + (avgP * weightP);
                            } else if (pData.jury.count > 0) {
                                combinedP = avgJ;
                            } else if (pData.public.count > 0) {
                                combinedP = avgP;
                            }

                            totalPresenterAvgJury += avgJ;
                            totalPresenterAvgPub += avgP;

                            presenterResults.push({
                                ...p,
                                avgJury: avgJ.toFixed(2),
                                avgPublic: avgP.toFixed(2),
                                combinedScore: combinedP.toFixed(2),
                                juryCount: pData.jury.count,
                                publicCount: pData.public.count
                            });
                        });

                        const deptAvgPresJury = presenters_list.length > 0 ? (totalPresenterAvgJury / presenters_list.length) : 0;
                        const deptAvgPresPub = presenters_list.length > 0 ? (totalPresenterAvgPub / presenters_list.length) : 0;

                        const deptPresScoreJury = (deptAvgPresJury / 10) * 100;
                        const deptPresScorePub = (deptAvgPresPub / 10) * 100;

                        const juryFinal = (juryDept.score + deptPresScoreJury) / 2;
                        const pubFinal = (pubDept.score + deptPresScorePub) / 2;

                        let finalScore = 0;
                        if (juryDept.count > 0 && pubDept.count > 0) {
                            finalScore = (juryFinal * weightJ) + (pubFinal * weightP);
                        } else if (juryDept.count > 0) {
                            finalScore = juryFinal;
                        } else if (pubDept.count > 0) {
                            finalScore = pubFinal;
                        }

                        results.push({
                            department_id: dId,
                            name: dept.name,
                            presenters: presenterResults,
                            final_score: isNaN(finalScore) ? "0.00" : Number(finalScore).toFixed(2),
                            jury_stats: { count: juryDept.count, score: juryFinal.toFixed(2) },
                            public_stats: { count: pubDept.count, score: pubFinal.toFixed(2) },
                            meta: {
                                totalJury: totalJuryUsers,
                                totalPublic: totalPublicUsers,
                                votesJury: juryDept.count,
                                votesPublic: pubDept.count
                            }
                        });
                    });

                    results.sort((a, b) => Number(b.final_score) - Number(a.final_score));
                    res.json(results);
                });
            });
        });
    });
};

exports.synchronizeTokens = async (req, res) => {
    try {
        let totalUpdated = 0;

        const updateTable = (tableName) => {
            return new Promise((resolve) => {
                db.all(`SELECT id FROM ${tableName} WHERE token IS NULL OR token = ''`, [], (err, rows) => {
                    if (err || !rows || rows.length === 0) return resolve(0);

                    let count = 0;
                    rows.forEach(p => {
                        const t = generateShortToken();
                        db.run(`UPDATE ${tableName} SET token = ? WHERE id = ?`, [t, p.id], () => {
                            count++;
                            if (count === rows.length) resolve(count);
                        });
                    });
                });
            });
        };

        const updatedPublic = await updateTable('registro_personas');
        const updatedJury = await updateTable('jurados');

        res.json({
            message: 'Sincronización de tokens completada',
            updated: updatedPublic + updatedJury
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Cambio de prueba para forzar subida