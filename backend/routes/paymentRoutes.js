const express = require('express');
const router = express.Router();
const axios = require('axios');
const Transaction = require('../models/Transaction');

router.post('/stkpush', async (req, res) => {
    const { phone, amount, userId, items } = req.body;

    try {
        const transaction = await Transaction.create({
            user: userId,
            items: items,
            totalAmount: amount,
            status: 'Pending',
            mpesaReceiptNumber: `MOCK_${Date.now()}`
        });

        // Simulate Safaricom STK Push Delay and Webhook (ResultCode: 0)
        setTimeout(async () => {
            await Transaction.findByIdAndUpdate(transaction._id, { status: 'Paid' });
            console.log(`[Daraja Sandbox] Mock Webhook Received - Transaction ${transaction._id} Paid`);
        }, 5000);

        res.status(200).json({ 
            message: "STK Push Initiated. Please enter your M-Pesa PIN.",
            transactionId: transaction._id 
        });

    } catch (error) {
        console.error("STK Push Mock Error:", error);
        res.status(500).json({ message: "STK Push Failed." });
    }
});

// Endpoint for frontend to poll transaction status
router.get('/status/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: "Not found" });
        res.json({ status: transaction.status });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Callback route where Safaricom posts the result
router.post('/callback', async (req, res) => {
    const callbackData = req.body.Body?.stkCallback;
    console.log('Mpesa Callback Received:', callbackData);

    if (callbackData) {
        const merchantRequestID = callbackData.MerchantRequestID;
        const resultCode = callbackData.ResultCode;

        if (resultCode === 0) {
            await Transaction.findOneAndUpdate(
                { mpesaReceiptNumber: merchantRequestID },
                { status: 'Paid' }
            );
        } else {
            await Transaction.findOneAndUpdate(
                { mpesaReceiptNumber: merchantRequestID },
                { status: 'Failed' }
            );
        }
    }
    
    res.status(200).send('OK');
});

module.exports = router;
