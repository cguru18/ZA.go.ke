const mongoose = require('mongoose');

const AccessCodeSchema = new mongoose.Schema({
    // ── Plaintext code (shown to admin ONCE at generation time) ─────────────
    // Stored temporarily so admin can view it in the dashboard.
    // Cleared automatically 5 minutes after creation via TTL-style logic
    // in the generate route. In production you'd store ONLY the hash.
    code:      { type: String, required: true },

    // ── Bcrypt hash of the plaintext code (secure storage) ──────────────────
    // Used for verification — never compared in plaintext DB queries
    codeHash:  { type: String, default: null },

    // ── Lifecycle ────────────────────────────────────────────────────────────
    isActive:  { type: Boolean, default: true },
    expiresAt: { type: Date,    required: true, index: true },

    // ── Generation metadata ──────────────────────────────────────────────────
    generatedBy: { type: String, default: null },  // admin email
    generatedAt: { type: Date,   default: Date.now },

    // ── Usage tracking ───────────────────────────────────────────────────────
    usageCount:  { type: Number, default: 0 },
    lastUsedAt:  { type: Date,   default: null },
    lastUsedIp:  { type: String, default: null },

    // ── Mutex lock fields ────────────────────────────────────────────────────
    // Prevent two cluster workers from rotating simultaneously.
    lockedBy:  { type: String, default: null }, // admin email holding the lock
    lockedAt:  { type: Date,   default: null }, // lock acquisition timestamp

    // ── Rotation metadata ────────────────────────────────────────────────────
    version:   { type: Number, default: 1 }, // incremented on each rotation

}, { timestamps: true });

// Compound index: fast lookup of active, non-expired codes
AccessCodeSchema.index({ isActive: 1, expiresAt: 1 });

module.exports = mongoose.model('AccessCode', AccessCodeSchema);
