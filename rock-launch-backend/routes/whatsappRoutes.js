const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { upload, memoryUpload } = require('../utils/upload');
const requireAdminAuth = require('../middleware/adminAuth');
const rateLimit = require('../middleware/rateLimit');

router.use(rateLimit({ windowMs: 60_000, max: 30 }));
router.use(requireAdminAuth);

router.post('/send', whatsappController.sendTemplate);
router.post('/send-bulk', whatsappController.sendBulkTemplates);

// Upload to Meta Cloud (Option A)
router.post('/upload-meta', memoryUpload.single('image'), whatsappController.uploadToMeta);
router.get('/media-info', whatsappController.getMetaMediaInfo);

// Upload locally
router.post('/upload-image', upload.single('image'), whatsappController.uploadImage);

module.exports = router;
