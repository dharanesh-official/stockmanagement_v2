const express = require('express');
const router = express.Router();
const { getSales, createSale, updateSale, deleteSale, getSaleItems, getSaleById, updateOrderPayment } = require('../controllers/sales');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, getSales);
router.get('/:id', verifyToken, getSaleById);
router.get('/items/:id', verifyToken, getSaleItems);
router.post('/', verifyToken, createSale);
router.put('/:id', verifyToken, updateSale);
router.put('/payment/:id', verifyToken, updateOrderPayment);
router.delete('/:id', verifyToken, deleteSale);

module.exports = router;
