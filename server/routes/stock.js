const express = require('express');
const router = express.Router();
const {
    getAllStocks,
    getStockById,
    addStock,
    updateStock,
    increaseStock,
    reduceStock,
    deleteStock
} = require('../controllers/stock');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getAllStocks);
router.get('/:id', verifyToken, getStockById);

router.post('/', verifyToken, isAdmin, addStock);
router.put('/:id', verifyToken, isAdmin, updateStock);
router.put('/increase/:id', verifyToken, isAdmin, increaseStock);
router.put('/reduce/:id', verifyToken, isAdmin, reduceStock);
router.delete('/:id', verifyToken, isAdmin, deleteStock);

module.exports = router;
