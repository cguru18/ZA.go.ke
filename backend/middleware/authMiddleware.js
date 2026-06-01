const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Cryptographic Cookie extraction
    const cookies = req.headers.cookie ? Object.fromEntries(
        req.headers.cookie.split('; ').map(c => {
            const parts = c.split('=');
            return [parts[0], parts.slice(1).join('=')];
        })
    ) : {};

    if (cookies.admin_token) {
        token = cookies.admin_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(403).json({ success: false, error: 'Forbidden: Authentication token required.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(403).json({ success: false, error: 'Forbidden: Authenticated user not found.' });
        }
        next();
    } catch (error) {
        return res.status(403).json({ success: false, error: 'Forbidden: Invalid or expired token.' });
    }
});

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        return res.status(403).json({ success: false, error: 'Forbidden: Explicit administrator claims required.' });
    }
};

module.exports = { protect, admin };

