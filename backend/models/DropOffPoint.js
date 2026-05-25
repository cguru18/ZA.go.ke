const mongoose = require('mongoose');

const DropOffPointSchema = new mongoose.Schema({
    id:    { type: Number, required: true, unique: true }, // timestamp-based
    lat:   { type: Number, required: true },
    lng:   { type: Number, required: true },
    label: { type: String, required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('DropOffPoint', DropOffPointSchema);
