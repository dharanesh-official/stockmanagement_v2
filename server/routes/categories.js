const express = require('express');
const router = express.Router();
const { getCategories, addCategory, updateCategory, deleteCategory } = require('../controllers/categories');
const { verifyToken, isAdmin, isStaff } = require('../middleware/auth');

router.get('/', verifyToken, getCategories);
router.post('/', verifyToken, isStaff, addCategory);
router.put('/:id', verifyToken, isStaff, updateCategory);
router.delete('/:id', verifyToken, isAdmin, deleteCategory);

module.exports = router;
