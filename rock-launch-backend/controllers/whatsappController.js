const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const db = require('../db');

// Configuración desde .env o defaults
const WHATSAPP_VERSION = process.env.WHATSAPP_VERSION || 'v24.0';
const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com';
const ROCKET_IMAGE_URL = "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=1000&auto=format&fit=crop";

const getSetting = (key) => {
    return new Promise((resolve) => {
        db.get('SELECT value FROM app_settings WHERE key = ?', [key], (err, row) => {
            if (err || !row) resolve(null);
            else resolve(row.value);
        });
    });
};

const saveSetting = (key, value) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value';
        db.run(sql, [key, value], (err) => {
            if (err) {
                db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, value], (err2) => {
                    if (err2) reject(err2);
                    else resolve();
                });
            } else {
                resolve();
            }
        });
    });
};

// Formatea el teléfono según las reglas de Meta Cloud API
const formatPhone = (phone) => {
    let clean = String(phone).replace(/\D/g, '');

    // Si tiene 10 dígitos (MX), prepender 521 (13 dígitos)
    // Esto coincide con el formato 'From' visto en tu panel de Meta (+52 1...)
    if (clean.length === 10) {
        return '521' + clean;
    }

    // Si tiene 12 dígitos y empieza con 52, convertir a 521
    if (clean.length === 12 && clean.startsWith('52')) {
        return '521' + clean.slice(2);
    }

    return clean;
};

exports.sendTemplate = async (req, res) => {
    const { phone, templateName, variables } = req.body;
    let cleanPhone = formatPhone(phone);

    if (!cleanPhone || !templateName) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {
        const rawMediaId = await getSetting('whatsapp_media_id');
        const mediaId = rawMediaId ? String(rawMediaId).trim() : null;
        const url = `${FACEBOOK_GRAPH_URL}/${WHATSAPP_VERSION}/${process.env.WHATSAPP_PHONE_ID}/messages`;

        const headerParam = mediaId
            ? { type: "image", image: { id: mediaId } }
            : { type: "image", image: { link: ROCKET_IMAGE_URL } };

        const payload = {
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "template",
            template: {
                name: templateName,
                language: { code: "es" },
                components: [
                    { type: "header", parameters: [headerParam] },
                    {
                        type: "body",
                        parameters: (variables || []).map(val => ({ type: "text", text: String(val) }))
                    }
                ]
            }
        };

        console.log(`[WhatsApp] Intentando enviar plantilla (${WHATSAPP_VERSION}) a ${cleanPhone}...`);
        if (mediaId) console.log(`[WhatsApp] Usando Media ID: ${mediaId}`);

        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN.trim()}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000,
            validateStatus: false
        });

        if (response.status >= 200 && response.status < 300) {
            console.log(`[WhatsApp] EXITO para ${cleanPhone}:`, JSON.stringify(response.data, null, 2));
            return res.json({ success: true, messageId: response.data.messages?.[0]?.id, data: response.data });
        } else {
            console.error(`[WhatsApp] ERROR de Meta (${response.status}):`, JSON.stringify(response.data, null, 2));
            return res.status(response.status).json({
                error: 'Meta rechazó el mensaje',
                details: response.data,
                debug: { url, version: WHATSAPP_VERSION, phone: cleanPhone, payload }
            });
        }
    } catch (err) {
        console.error('[WhatsApp] ERROR INTERNO:', err.message);
        return res.status(500).json({ error: 'Error interno en el controlador', details: err.message });
    }
};

exports.sendBulkTemplates = async (req, res) => {
    const { people, templateName, url: broadcastUrl } = req.body;
    if (!Array.isArray(people) || !templateName) {
        return res.status(400).json({ error: 'Faltan datos para envío masivo' });
    }

    const results = { success: 0, failed: 0, errors: [] };
    const rawMediaId = await getSetting('whatsapp_media_id');
    const mediaId = rawMediaId ? String(rawMediaId).trim() : null;
    const headerParam = mediaId ? { type: "image", image: { id: mediaId } } : { type: "image", image: { link: ROCKET_IMAGE_URL } };

    for (const person of people) {
        try {
            const phoneStr = formatPhone(person.phone);
            const finalUrl = broadcastUrl
                ? (person.token ? `${broadcastUrl}${broadcastUrl.includes('?') ? '&' : '?'}token=${person.token}` : broadcastUrl)
                : 'https://rocklaunch2026.com';

            const payload = {
                messaging_product: "whatsapp",
                to: phoneStr,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: "es" },
                    components: [
                        { type: "header", parameters: [headerParam] },
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: String(person.name) },
                                { type: "text", text: String(finalUrl) }
                            ]
                        }
                    ]
                }
            };

            const response = await axios.post(`${FACEBOOK_GRAPH_URL}/${WHATSAPP_VERSION}/${process.env.WHATSAPP_PHONE_ID}/messages`, payload, {
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN.trim()}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000,
                validateStatus: false
            });

            if (response.status >= 200 && response.status < 300) {
                results.success++;
            } else {
                results.failed++;
                results.errors.push({ name: person.name, error: response.data });
            }
        } catch (err) {
            results.failed++;
            results.errors.push({ name: person.name, error: err.message });
        }
    }
    res.json(results);
};

exports.uploadToMeta = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Debes seleccionar una imagen' });
        const filePath = req.file.path;
        const form = new FormData();
        form.append('messaging_product', 'whatsapp');
        form.append('file', fs.createReadStream(filePath), { contentType: req.file.mimetype, filename: req.file.originalname });
        form.append('type', 'image');

        const url = `${FACEBOOK_GRAPH_URL}/${WHATSAPP_VERSION}/${process.env.WHATSAPP_PHONE_ID}/media`;
        const response = await axios.post(url, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN.trim()}`
            }
        });
        const mediaId = response.data.id;
        await saveSetting('whatsapp_media_id', mediaId);
        res.json({ success: true, media_id: mediaId });
    } catch (err) {
        res.status(500).json({ error: 'Error al subir a Meta', details: err.response?.data || err.message });
    }
};

exports.uploadImage = (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Archivo no encontrado' });
        const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.json({ filename: req.file.filename, url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMetaMediaInfo = async (req, res) => {
    const mediaId = await getSetting('whatsapp_media_id');
    res.json({ media_id: mediaId });
};
