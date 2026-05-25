const { isInsideNairobi } = require('../utils/geofence');

/**
 * Real-time Boundary Guard & Telemetry Stream
 * Enforces the Nairobi County polygon geofence.
 */
const validateBoundary = (req, res, next) => {
    const { lat, lng } = req.body.gps_coords || {};
    
    if (!lat || !lng) {
        return res.status(400).json({ message: "GPS coordinates required for boundary validation." });
    }

    const isInside = isInsideNairobi(parseFloat(lat), parseFloat(lng));
    
    if (!isInside) {
        // Critical Alert: Geofence Breach
        // Note: The actual socket broadcast will happen in the courier_update event in server.js
        // but this middleware can be used for API-based position updates.
        return res.status(403).json({ 
            code: "GEOFENCE_BREACH", 
            severity: "CRITICAL",
            message: "Courier has exited the Nairobi boundary."
        });
    }
    next();
};

module.exports = { validateBoundary };
