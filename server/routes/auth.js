const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/auth');
const verifyToken = require('../middleware/auth').verifyToken;

router.post('/login', login);
router.post('/register', register); // Should secure this later

router.get('/me', verifyToken, (req, res) => {
    res.json(req.user);
});

router.put('/profile', verifyToken, require('../controllers/auth').updateProfile);

module.exports = router;
