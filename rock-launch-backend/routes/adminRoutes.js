const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../utils/upload');
const requireAdminAuth = require('../middleware/adminAuth');
const rateLimit = require('../middleware/rateLimit');

router.use(rateLimit({ windowMs: 60_000, max: 60 }));
router.use(requireAdminAuth);

// Departments
router.post('/departments', adminController.addDepartment);
router.delete('/departments/:id', adminController.deleteDepartment);
router.put('/departments/:id', adminController.updateDepartment);

// Presenters
router.get('/presenters', adminController.getPresenters);
router.post('/presenters', upload.single('photo'), adminController.addPresenter);
router.delete('/presenters/:id', adminController.deletePresenter);
router.put('/presenters/:id', upload.single('photo'), adminController.updatePresenter);

// People
router.get('/people', adminController.getPeople);
router.post('/people', adminController.addPerson);
router.delete('/people/:type/:id', adminController.deletePerson);
router.put('/people/:type/:id', adminController.updatePerson);
router.post('/people/import', upload.single('file'), adminController.importPeople);
router.post('/people/sync-tokens', adminController.synchronizeTokens);

// Stats
router.get('/stats-history', adminController.getStatsHistory);
router.get('/stats', adminController.getStats);

module.exports = router;
