const express = require('express');
const router = express.Router();
const { isInsideNairobi } = require('../utils/geofence');

router.post('/validate-location', (req, res) => {
    const { userLat, userLng } = req.body;

    if (!userLat || !userLng) {
        return res.status(400).json({ status: "ERROR", message: "Coordinates missing." });
    }

    if (!isInsideNairobi(userLat, userLng)) {
        return res.status(403).json({
            status: "OUT_OF_BOUNDS",
            message: "Treats & Heat currently only delivers within Nairobi County. Stay tuned for expansion!",
            safeZone: false
        });
    }

    res.status(200).json({
        status: "IN_ZONE",
        message: "Nairobi County Verified. Delivery available.",
        safeZone: true
    });
});

// Haversine formula to calculate distance in meters
const calculateDistance = (coords1, coords2) => {
    const R = 6371e3; // Earth radius in meters
    const lat1 = coords1.lat * Math.PI/180;
    const lat2 = coords2.lat * Math.PI/180;
    const dLat = (coords2.lat - coords1.lat) * Math.PI/180;
    const dLon = (coords2.lng - coords1.lng) * Math.PI/180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

// Courier Update Endpoint (Replaces simulate_courier.js)
router.post('/update', async (req, res) => {
    const { orderId, courierLat, courierLng, dropOffLat, dropOffLng } = req.body;
    
    // In a real app, verify courier JWT token here

    if (!orderId || !courierLat || !courierLng || !dropOffLat || !dropOffLng) {
        return res.status(400).json({ status: "ERROR", message: "Missing tracking coordinates." });
    }

    const courierCoords = { lat: courierLat, lng: courierLng };
    const dropOffCoords = { lat: dropOffLat, lng: dropOffLng };

    const distanceMeters = calculateDistance(courierCoords, dropOffCoords);

    // Validate 0.2m proximity for secure handover
    const isAtDropOff = distanceMeters <= 0.2;

    // Ideally, update the order in DB with latest coordinates and fire a socket event via an event emitter/Redis publisher
    // This allows the frontend to listen to live updates without a simulator script.

    res.status(200).json({
        success: true,
        distanceMeters,
        isAtDropOff,
        message: isAtDropOff ? "Courier arrived at drop-off point." : "Courier in transit."
    });
});

module.exports = router;
