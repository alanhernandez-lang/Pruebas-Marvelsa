const db = require('../db');

exports.register = (req, res) => {
    const { name, phone } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ error: 'Nombre y teléfono son requeridos.' });
    }

    // Regex Validation
    const phoneRegex = /^\d{10}$/;
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    if (!nameRegex.test(name)) {
        return res.status(400).json({ error: 'El nombre solo debe contener letras.' });
    }

    if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'El teléfono debe tener exactamente 10 números.' });
    }

    // Check in jurados first
    db.get(`SELECT *, 'JURY' as type FROM jurados WHERE phone = ?`, [phone], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            console.log(`Jury member accessed: ${row.name} (${phone})`);
            return res.json({ user: row, message: 'Bienvenido Jurado.' });
        } else {
            // Check in registro_personas
            db.get(`SELECT *, 'PUBLIC' as type FROM registro_personas WHERE phone = ?`, [phone], (err, publicRow) => {
                if (err) return res.status(500).json({ error: err.message });

                if (publicRow) {
                    console.log(`Public member accessed: ${publicRow.name} (${phone})`);
                    return res.json({ user: publicRow, message: 'Bienvenido.' });
                } else {
                    // Not found in either table
                    console.log(`Access denied for: ${name} (${phone})`);
                    return res.status(403).json({ error: 'Acceso Denegado: Los datos ingresados no coinciden con nuestra lista de invitados.' });
                }
            });
        }
    });
};

exports.resetIndex = (req, res) => {
    const { user_id, user_type } = req.body;
    if (!user_id || !user_type) return res.status(400).json({ error: 'Missing user info' });

    const targetTable = user_type === 'JURY' ? 'jurados' : 'registro_personas';

    db.run(`UPDATE ${targetTable} SET current_dept_index = 0 WHERE id = ?`, [user_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Progress reset successfully' });
    });
};

exports.validateToken = (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: 'Token no proporcionado.' });
    }

    const TARGET_DATE = new Date("April 14, 2026 13:00:00");
    if (new Date() < TARGET_DATE) {
        return res.status(403).json({ error: 'La votación aún no ha comenzado.' });
    }

    const queryJury = `SELECT *, 'JURY' as type FROM jurados WHERE token = ?`;
    const queryPublic = `SELECT *, 'PUBLIC' as type FROM registro_personas WHERE token = ?`;

    db.get(queryJury, [token], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            if (row.has_voted) {
                return res.status(403).json({ error: 'Participación ya registrada: Este token ya ha sido utilizado para votar.' });
            }
            return res.json({ user: row });
        }

        db.get(queryPublic, [token], (err, publicRow) => {
            if (err) return res.status(500).json({ error: err.message });

            if (publicRow) {
                if (publicRow.has_voted) {
                    return res.status(403).json({ error: 'Participación ya registrada: Este token ya ha sido utilizado para votar.' });
                }
                return res.json({ user: publicRow });
            }

            return res.status(404).json({ error: 'Token inválido o no encontrado.' });
        });
    });
};
