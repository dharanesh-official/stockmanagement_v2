const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).send('Access Denied');

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') return res.status(403).send('Access Denied: Admins Only');
    next();
};

const isStaff = (req, res, next) => {
    const staffRoles = ['admin', 'super_admin', 'manager', 'employee'];
    if (!staffRoles.includes(req.user.role)) {
        return res.status(403).send('Access Denied: Staff Only');
    }
    next();
};

module.exports = { verifyToken, isAdmin, isStaff };
