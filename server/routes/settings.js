const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settings');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', getSettings); // Public read? Or authenticated
router.put('/', verifyToken, isAdmin, updateSettings);

module.exports = router;
