const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    thc: { type: String, required: true },
    price: { type: Number, required: true }, // In KSh
    color: { type: String, required: true }, // For UI styling
    category: { type: String, required: true },
    isInfused: { type: Boolean, default: false },
    image: { type: String, default: '' }, // Base64 image
    inStock: { type: Boolean, default: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notifyList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
