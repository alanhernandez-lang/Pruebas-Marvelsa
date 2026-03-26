const db = require('../db');

module.exports = (io) => {
    return {
        submitVote: (req, res) => {
            const { user_id, department_id, criteria_scores, presenter_scores, user_type } = req.body;

            if (!user_id || !department_id || !criteria_scores || !presenter_scores || !user_type) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const criteriaJson = JSON.stringify(criteria_scores);
            const presentersJson = JSON.stringify(presenter_scores);
            const targetTable = user_type === 'JURY' ? 'jurados' : 'registro_personas';

            db.run(
                'INSERT INTO resultados_votaciones (user_id, user_type, department_id, criteria_scores, presenter_scores) VALUES (?, ?, ?, ?, ?)',
                [user_id, user_type, department_id, criteriaJson, presentersJson],
                function (err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    db.get(`SELECT current_dept_index FROM ${targetTable} WHERE id = ?`, [user_id], (err, userRow) => {
                        const newIndex = (userRow?.current_dept_index || 0) + 1;

                        db.run(`UPDATE ${targetTable} SET current_dept_index = ? WHERE id = ?`, [newIndex, user_id], (err) => {
                            if (err) console.error('Error updating user index:', err);

                            // Check if finished all departments
                            db.all('SELECT id FROM departamentos', [], (err, depts) => {
                                if (!err && newIndex >= depts.length) {
                                    db.run(`UPDATE ${targetTable} SET has_voted = 1 WHERE id = ?`, [user_id]);
                                }
                            });

                            if (io) io.emit('vote_update', { department_id });
                            res.json({ message: 'Vote recorded successfully.', nextIndex: newIndex });
                        });
                    });
                }
            );
        }
    };
};
