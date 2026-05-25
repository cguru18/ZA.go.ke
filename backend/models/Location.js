const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    vehicleId: { type: String, required: true },
    orderId: { type: String, required: true },
    currentLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // GeoJSON strictly follows [longitude, latitude]
    },
    eta: { type: String },
    freshness: { type: String },
    countdown: { type: Number },
    timestamp: { type: Date, default: Date.now }
});

// GeoJSON 2dsphere index for proximity atomic checks
LocationSchema.index({ currentLocation: '2dsphere' }, { name: 'RealTimeTrackingIndex' });

module.exports = mongoose.model('Location', LocationSchema);
