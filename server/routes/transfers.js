const express = require('express');
const router = express.Router();
const { getTransfers, createTransfer } = require('../controllers/transfers');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getTransfers);
router.post('/', verifyToken, isAdmin, createTransfer);

module.exports = router;
