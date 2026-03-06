const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getActivityLogs } = require('../controllers/settings');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getSettings);
router.put('/', verifyToken, isAdmin, updateSettings);
router.get('/logs', verifyToken, isAdmin, getActivityLogs);

module.exports = router;
