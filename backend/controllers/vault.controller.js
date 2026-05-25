const AccessCode = require('../models/AccessCode');
const Order = require('../models/Order');
const asyncHandler = require('express-async-handler');
const { redis } = require('./redisClient');

/**
 * Haversine formula to calculate distance in meters
 */
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

/**
 * @desc    Request a secure handover code with Atomic Mutex Locking
 * @route   POST /api/vault/request/:orderId
 * @access  Private (Admin/Courier)
 */
const requestHandoverCode = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const adminEmail = req.user.email;
    const LOCK_TTL_MS = 60000; // 60 seconds

    // ATOMIC MUTEX: Attempt to acquire the lock using findOneAndUpdate
    // We only acquire if lockedBy is null OR the previous lock is expired
    const now = new Date();
    const staleTime = new Date(now.getTime() - LOCK_TTL_MS);

    const vaultLock = await AccessCode.findOneAndUpdate(
        {
            $or: [
                { lockedBy: null },
                { lockedAt: { $lt: staleTime } }
            ]
        },
        {
            lockedBy: adminEmail,
            lockedAt: now,
            isActive: true
        },
        { new: true, upsert: true }
    );

    if (!vaultLock || vaultLock.lockedBy !== adminEmail) {
        return res.status(401).json({ 
            code: "VAULT_LOCK_ACTIVE", 
            message: "Another admin is currently rotating the vault. Please wait." 
        });
    }

    const vaultToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Store token in Redis for non-blocking high-availability
    await redis.set(`vault:token:${orderId}`, vaultToken, 'EX', 60);

    res.json({ 
        vault_token: vaultToken, 
        expires_in: 60, 
        policy: "atomic_mutex",
        locked_by: vaultLock.lockedBy
    });
});

/**
 * @desc    Verify the secure hand-off handshake
 * @route   POST /api/vault/verify
 * @access  Private (Courier)
 */
const verifyHandshake = asyncHandler(async (req, res) => {
    const { orderId, handoverToken, courierCoords } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // 1. Proximity Check: Must be within 0.2m
        // recipientCoords should ideally come from the order or drop-off point
        const recipientCoords = { lat: order.latitude || -1.2921, lng: order.longitude || 36.8219 };
        const distance = calculateDistance(courierCoords, recipientCoords);

        if (distance > 0.2) {
            return res.status(403).json({
                status: "error",
                code: "PROXIMITY_VIOLATION",
                message: `Courier is too far (${distance.toFixed(2)}m). Must be within 0.2m for secure hand-off.`
            });
        }

        // 2. Atomic Token Check: Verify against Redis
        const storedToken = await redis.get(`vault:token:${orderId}`);
        if (!storedToken || storedToken !== handoverToken) {
            return res.status(401).json({
                status: "error",
                code: "TOKEN_EXPIRED",
                message: "Hand-off token has rotated or expired."
            });
        }

        // 3. Success: Trigger Final Delivery State
        await Order.findByIdAndUpdate(orderId, { 
            status: 'DELIVERED',
            deliveredAt: new Date(),
            handoverVerified: true
        });

        res.json({ status: "success", message: "Hand-off verified via Atomic Mutex." });

    } catch (err) {
        console.error('Verification error:', err);
        res.status(500).json({ code: "VAULT_LOCK_ACTIVE", message: "Hand-off server error." });
    }
});

module.exports = { requestHandoverCode, verifyHandshake };
