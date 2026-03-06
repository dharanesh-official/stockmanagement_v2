const express = require('express');
const router = express.Router();
const {
    getAllStocks,
    getStockById,
    addStock,
    updateStock,
    adjustStock,
    getStockHistory,
    increaseStock,
    reduceStock,
    deleteStock
} = require('../controllers/stock');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getAllStocks);
router.get('/:id', verifyToken, getStockById);

router.post('/', verifyToken, isAdmin, addStock);
router.put('/:id', verifyToken, isAdmin, updateStock);
router.post('/:id/adjust', verifyToken, isAdmin, adjustStock);
router.get('/:id/history', verifyToken, getStockHistory);
router.put('/increase/:id', verifyToken, isAdmin, increaseStock);
router.put('/reduce/:id', verifyToken, isAdmin, reduceStock);
router.delete('/:id', verifyToken, isAdmin, deleteStock);

module.exports = router;
