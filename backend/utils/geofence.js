/**
 * NAIROBI COUNTY GEOFENCING UTILITY
 * Core logic for Phase 3 Delivery Restrictions
 */

const NAIROBI_BOUNDARY = [
    { lat: -1.164, lng: 36.903 }, // North (Near Ruiru/Kasarani)
    { lat: -1.318, lng: 37.098 }, // East (Near Njiru/Embakasi)
    { lat: -1.455, lng: 36.942 }, // South (Near Syokimau boundary)
    { lat: -1.365, lng: 36.652 }, // West (Near Dagoretti/Karen)
    { lat: -1.164, lng: 36.903 }  // Closing the loop
];

/**
 * Ray-Casting Algorithm to determine if a point is within the Nairobi Polygon
 */
const isInsideNairobi = (userLat, userLng) => {
    let x = userLat, y = userLng;
    let inside = false;
    for (let i = 0, j = NAIROBI_BOUNDARY.length - 1; i < NAIROBI_BOUNDARY.length; j = i++) {
        let xi = NAIROBI_BOUNDARY[i].lat, yi = NAIROBI_BOUNDARY[i].lng;
        let xj = NAIROBI_BOUNDARY[j].lat, yj = NAIROBI_BOUNDARY[j].lng;

        let intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

module.exports = { isInsideNairobi };
