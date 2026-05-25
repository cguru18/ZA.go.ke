const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');
const { Parser } = require('json2csv');

// Middleware to protect routes
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

router.get('/profile', protect, async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({ message: 'Server error fetching profile', error: error.message });
    }
});

router.get('/transactions', protect, async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        console.error("Transactions fetch error:", error);
        res.status(500).json({ message: 'Server error fetching transactions', error: error.message });
    }
});

router.get('/transactions/download', protect, async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
        const fields = ['_id', 'totalAmount', 'status', 'createdAt', 'items'];
        const data = transactions.map(t => ({
            _id: t._id,
            totalAmount: t.totalAmount,
            status: t.status,
            createdAt: t.createdAt,
            items: t.items.map(i => `${i.name} (x${i.qty})`).join(', ')
        }));

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        res.header('Content-Type', 'text/csv');
        res.attachment('transactions.csv');
        return res.send(csv);
    } catch (err) {
        res.status(500).json({ message: 'Error generating CSV' });
    }
});

module.exports = router;
