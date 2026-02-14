const express = require('express');
const router = express.Router();
const { getCategories, addCategory, updateCategory, deleteCategory } = require('../controllers/categories');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getCategories);
router.post('/', verifyToken, isAdmin, addCategory);
router.put('/:id', verifyToken, isAdmin, updateCategory);
router.delete('/:id', verifyToken, isAdmin, deleteCategory);

module.exports = router;
