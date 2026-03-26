const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/reset-index', authController.resetIndex);
router.get('/validate-token', authController.validateToken);

module.exports = router;
