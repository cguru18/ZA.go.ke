const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

router.post('/signup', async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ fullName, email, password });
        res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error("Signup error details:", error);
        res.status(500).json({ message: 'Server error', error: error.message || error });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error("Login error details:", error);
        res.status(500).json({ message: 'Server error', error: error.message || error });
    }
});

module.exports = router;
