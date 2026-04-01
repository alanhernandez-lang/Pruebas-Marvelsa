const db = require('../db');

exports.getDepartments = (req, res) => {
    db.all(`
      SELECT 
        d.id as dept_id, 
        d.name as dept_name, 
        d.display_order,
        p.id as presenter_id, 
        p.name as presenter_name, 
        p.photo_url as presenter_photo
      FROM departamentos d
      LEFT JOIN presentadores p ON d.id = p.department_id
      ORDER BY d.display_order ASC, d.id ASC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const depts = [];
        rows.forEach(row => {
            let dept = depts.find(d => d.id === row.dept_id);
            if (!dept) {
                dept = { id: row.dept_id, name: row.dept_name, display_order: row.display_order, presenters: [] };
                depts.push(dept);
            }
            if (row.presenter_id) {
                dept.presenters.push({
                    id: row.presenter_id,
                    name: row.presenter_name,
                    photo_url: row.presenter_photo
                });
            }
        });
        res.json(depts);
    });
};
