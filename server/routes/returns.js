const express = require('express');
const router = express.Router();
const { getReturns, createReturn, getReturnItems } = require('../controllers/returns');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, getReturns);
router.post('/', verifyToken, createReturn);
router.get('/:id/items', verifyToken, getReturnItems);

module.exports = router;
