const express = require('express');
const router = express.Router();
const { getPurchases, createPurchase, getPurchaseItems } = require('../controllers/purchases');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getPurchases);
router.post('/', verifyToken, isAdmin, createPurchase);
router.get('/:id/items', verifyToken, getPurchaseItems);

module.exports = router;
