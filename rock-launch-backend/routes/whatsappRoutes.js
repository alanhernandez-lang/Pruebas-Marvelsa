const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const upload = require('../utils/upload');
const requireAdminAuth = require('../middleware/adminAuth');
const rateLimit = require('../middleware/rateLimit');

router.use(rateLimit({ windowMs: 60_000, max: 30 }));
router.use(requireAdminAuth);

router.post('/send', whatsappController.sendTemplate);
router.post('/send-bulk', whatsappController.sendBulkTemplates);

// Upload to Meta Cloud (Option A)
router.post('/upload-meta', upload.single('image'), whatsappController.uploadToMeta);
router.get('/media-info', (req, res) => {
    // Basic getter for the current media ID
    const db = require('../db');
    db.get('SELECT value FROM app_settings WHERE key = ?', ['whatsapp_media_id'], (err, row) => {
        res.json({ media_id: row ? row.value : null });
    });
});

// Upload locally
router.post('/upload-image', upload.single('image'), whatsappController.uploadImage);

module.exports = router;
