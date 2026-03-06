const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getActivityLogs, getPublicSettings } = require('../controllers/settings');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/public', getPublicSettings); // Public route for login screen
router.get('/', verifyToken, getSettings);
router.put('/', verifyToken, isAdmin, updateSettings);
router.get('/logs', verifyToken, isAdmin, getActivityLogs);

module.exports = router;
