const express = require('express');
const router = express.Router();
const { getPricingRules, createPricingRule, updatePricingRule, deletePricingRule } = require('../controllers/pricing');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getPricingRules);
router.post('/', verifyToken, isAdmin, createPricingRule);
router.put('/:id', verifyToken, isAdmin, updatePricingRule);
router.delete('/:id', verifyToken, isAdmin, deletePricingRule);

module.exports = router;
