/**
 * CodeAuditLog.js
 * ────────────────────────────────────────────────────────────────────────────
 * MongoDB model that records every access-code lifecycle event:
 *   GENERATE | VERIFY_SUCCESS | VERIFY_FAIL | EXPIRE | ROTATE
 *
 * Used for:
 *  • Security forensics (who generated/verified when, from which IP)
 *  • Rate-limit violation detection
 *  • Admin dashboard audit view (/api/access/audit)
 *
 * Indexed for fast admin queries and auto-expires entries after 30 days.
 */

const mongoose = require('mongoose');

const CodeAuditLogSchema = new mongoose.Schema({
    // Event type
    event: {
        type: String,
        enum: ['GENERATE', 'VERIFY_SUCCESS', 'VERIFY_FAIL', 'EXPIRE', 'ROTATE'],
        required: true,
        index: true,
    },

    // Reference to the AccessCode document (if applicable)
    codeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccessCode',
        default: null,
        index: true,
    },

    // Request metadata
    ip:        { type: String, default: 'unknown', index: true },
    userAgent: { type: String, default: 'unknown' },

    // Whether the operation succeeded
    success: { type: Boolean, default: true },

    // Extra structured metadata (e.g. generatedBy admin email, failReason)
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },

}, {
    timestamps: true,  // createdAt, updatedAt
});

// Auto-expire audit log documents after 30 days (TTL index on createdAt)
CodeAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('CodeAuditLog', CodeAuditLogSchema);
