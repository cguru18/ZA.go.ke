const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [{
        name: String,
        qty: Number,
        price: Number
    }],
    grossRevenue: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    processingFee: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    paymentStatus: { 
        type: String, 
        enum: ['Pending', 'Completed', 'Failed'], 
        default: 'Pending' 
    },
    // Sparse unique index — prevents duplicate revenue from Daraja webhook replays.
    // sparse: true means uniqueness is only enforced when the field is present.
    mpesaReceiptNumber: { 
        type: String, 
        unique: true, 
        sparse: true,
        trim: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
