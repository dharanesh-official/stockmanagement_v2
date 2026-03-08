const express = require('express');
const router = express.Router();
const { getDashboardStats, globalSearch } = require('../controllers/dashboard');
const { verifyToken } = require('../middleware/auth');

router.get('/stats', verifyToken, getDashboardStats);
router.get('/search', verifyToken, globalSearch);

module.exports = router;
