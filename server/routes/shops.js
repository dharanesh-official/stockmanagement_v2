const express = require('express');
const router = express.Router();
const { getShops, createShop, updateShop, deleteShop, getShopFinance } = require('../controllers/shops');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getShops);
router.get('/:id/finance', verifyToken, getShopFinance);
router.post('/', verifyToken, createShop);
router.put('/:id', verifyToken, updateShop);
router.delete('/:id', verifyToken, deleteShop);

module.exports = router;
