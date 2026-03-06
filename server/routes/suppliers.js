const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/suppliers');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getSuppliers);
router.post('/', verifyToken, isAdmin, createSupplier);
router.put('/:id', verifyToken, isAdmin, updateSupplier);
router.delete('/:id', verifyToken, isAdmin, deleteSupplier);

module.exports = router;
