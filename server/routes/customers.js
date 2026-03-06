const express = require('express');
const router = express.Router();
const { getCustomers, getCustomerById, addCustomer, updateCustomer, deleteCustomer, lockCustomer } = require('../controllers/customers');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Both Roles
router.get('/', verifyToken, getCustomers);
router.get('/:id', verifyToken, getCustomerById);
router.post('/', verifyToken, addCustomer);
router.put('/:id', verifyToken, updateCustomer);
router.delete('/:id', verifyToken, deleteCustomer);

// Admin Only
router.put('/:id/lock', verifyToken, isAdmin, lockCustomer);

module.exports = router;
