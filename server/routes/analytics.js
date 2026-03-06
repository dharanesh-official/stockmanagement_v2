const express = require('express');
const router = express.Router();
const { getSalesmanPerformance, getGlobalLeaderboard } = require('../controllers/analytics');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/performance/:salesmanId', verifyToken, getSalesmanPerformance);
router.get('/leaderboard', verifyToken, getGlobalLeaderboard);

module.exports = router;
