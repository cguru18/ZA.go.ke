/**
 * HEAT & TREATS - NAIROBI GEOFENCE MIDDLEWARE
 * Implements a Ray-Casting algorithm to ensure coordinates fall strictly within the Nairobi polygon.
 */

// Nairobi County approximate polygon coordinates
// [longitude, latitude] to match standard GeoJSON format
const nairobiPolygon = [
    [36.652, -1.365], // West
    [36.903, -1.164], // North
    [37.098, -1.318], // East
    [36.942, -1.455], // South
    [36.652, -1.365]  // Close the polygon
];

/**
 * Ray-Casting Algorithm to check if a point is inside a polygon
 * @param {Array} point - [longitude, latitude]
 * @param {Array} polygon - Array of [longitude, latitude] coordinates
 * @returns {boolean} - True if inside, False otherwise
 */
const isPointInPolygon = (point, vs) => {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];

        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

const verifyGeofence = (req, res, next) => {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
        return res.status(400).json({ success: false, message: "Location coordinates required." });
    }

    const point = [parseFloat(lng), parseFloat(lat)];
    const isInside = isPointInPolygon(point, nairobiPolygon);

    if (!isInside) {
        return res.status(403).json({ 
            success: false, 
            message: "Delivery denied. Operations are strictly restricted to Nairobi County." 
        });
    }

    next();
};

module.exports = { verifyGeofence, isPointInPolygon, nairobiPolygon };
