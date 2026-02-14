const express = require('express');
const router = express.Router();
const { getEmployees, createEmployee, updateEmployee, deleteUser, getEmployeeDetails, updateShops } = require('../controllers/users');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, isAdmin, getEmployees);
router.get('/:id', verifyToken, isAdmin, getEmployeeDetails);
router.post('/', verifyToken, isAdmin, createEmployee);
router.put('/:id', verifyToken, isAdmin, updateEmployee);
router.put('/:id/shops', verifyToken, isAdmin, updateShops);
router.delete('/:id', verifyToken, isAdmin, deleteUser);

module.exports = router;
