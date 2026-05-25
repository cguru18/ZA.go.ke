const express = require('express');
const router = express.Router();
const { requestHandoverCode, verifyHandshake } = require('../controllers/vault.controller');
const { protect, admin } = require('../middleware/authMiddleware');

// Secure endpoint for vault code rotation
router.post('/request/:orderId', protect, admin, requestHandoverCode);

// Secure endpoint for handover verification (proximity + token)
router.post('/verify', protect, verifyHandshake);

module.exports = router;
