const express = require('express');
const router = express.Router();
const { getAreas, createArea, updateArea, deleteArea } = require('../controllers/areas');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, getAreas);
router.post('/', verifyToken, createArea);
router.put('/:id', verifyToken, updateArea);
router.delete('/:id', verifyToken, deleteArea);

module.exports = router;
