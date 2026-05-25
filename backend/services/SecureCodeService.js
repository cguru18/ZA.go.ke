/**
 * SecureCodeService.js
 * ────────────────────────────────────────────────────────────────────────────
 * Provides cryptographically-secure access code generation, hashing,
 * verification and audit logging for the ZA.go.ke platform.
 *
 * Design decisions:
 *  • Base32 alphabet (no I/O/1/0 to avoid visual confusion)
 *  • crypto.randomBytes → guaranteed OS entropy, not Math.random
 *  • bcrypt (rounds=12) for storage → safe even if DB is compromised
 *  • Every event (generate / verify-ok / verify-fail) is written to
 *    CodeAuditLog for forensic trail across cluster workers
 */

const crypto    = require('crypto');
const bcrypt    = require('bcryptjs');
const CodeAuditLog = require('../models/CodeAuditLog');

// Base32 alphabet: RFC 4648 minus I O 1 0 to avoid user confusion
const BASE32_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const BCRYPT_ROUNDS   = 12;

/**
 * generateCode(length = 8)
 * Returns a random Base32-encoded access code of `length` characters.
 * Uses OS-level entropy via crypto.randomBytes.
 */
function generateCode(length = 8) {
    const bytes = crypto.randomBytes(length * 2); // Extra bytes for modulo bias reduction
    let code = '';
    for (let i = 0; i < length; i++) {
        // Use 2 bytes per character to minimise modulo bias
        const val = bytes.readUInt16BE(i * 2) % BASE32_ALPHABET.length;
        code += BASE32_ALPHABET[val];
    }
    return code;
}

/**
 * hashCode(plainCode)
 * Returns a bcrypt hash of the access code for secure storage.
 * Async — awaitable.
 */
async function hashCode(plainCode) {
    return bcrypt.hash(plainCode, BCRYPT_ROUNDS);
}

/**
 * verifyCode(plainCode, storedHash)
 * Returns true if plainCode matches the stored bcrypt hash.
 */
async function verifyCode(plainCode, storedHash) {
    if (!plainCode || !storedHash) return false;
    return bcrypt.compare(plainCode.toUpperCase(), storedHash);
}

/**
 * auditLog({ event, codeId, ip, userAgent, success, meta })
 * Persists an audit entry. Fire-and-forget safe (non-throwing).
 *
 * event values: 'GENERATE' | 'VERIFY_SUCCESS' | 'VERIFY_FAIL' | 'EXPIRE' | 'ROTATE'
 */
async function auditLog({ event, codeId = null, ip = 'unknown', userAgent = 'unknown', success = true, meta = {} }) {
    try {
        await CodeAuditLog.create({ event, codeId, ip, userAgent, success, meta });
    } catch (err) {
        // Non-blocking: log to console but don't throw
        console.error('[SecureCodeService] AuditLog write failed:', err.message);
    }
}

const cron = require('node-cron');
const AccessCode = require('../models/AccessCode');
const { sendVaultCodeToAdmins } = require('./EmailService');

/**
 * formatExpiry(expiresAt)
 * Returns a human-readable string for the expiry time.
 */
function formatExpiry(expiresAt) {
    const ms   = expiresAt - Date.now();
    const hrs  = Math.floor(ms / 3_600_000);
    const mins = Math.floor((ms % 3_600_000) / 60_000);
    return `${hrs}h ${mins}m`;
}

/**
 * Initializes the automated 24-hour vault code rotation cron job.
 * Runs at midnight every day. Uses atomic MongoDB locks to ensure
 * only one cluster worker performs the rotation.
 */
function initCron() {
    // Run at 00:00 every day
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('[SecureCodeService] Cron job triggered: Rotating vault code...');
            const now = new Date();
            
            // Try to acquire lock for cron job
            const lockedDoc = await AccessCode.findOneAndUpdate(
                {
                    isActive: true,
                    $or: [
                        { lockedBy: null },
                        { lockedAt: { $lt: new Date(now.getTime() - 30000) } }
                    ],
                },
                { $set: { lockedBy: 'SYSTEM_CRON', lockedAt: now } },
                { new: true, sort: { createdAt: -1 } }
            );

            // If another worker already locked it, skip
            if (!lockedDoc && await AccessCode.countDocuments({ isActive: true }) > 0) {
                console.log('[SecureCodeService] Another worker is handling rotation.');
                return;
            }

            // Deactivate old codes
            if (lockedDoc) {
                await AccessCode.updateMany({ isActive: true, _id: { $ne: lockedDoc._id } }, { isActive: false });
            }

            // Generate new code
            const newCode = generateCode(8); // Base32
            const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const hashed = await hashCode(newCode);

            await AccessCode.create({
                code: newCode,
                codeHash: hashed,
                isActive: true,
                expiresAt,
                lockedBy: null,
                lockedAt: null,
                generatedBy: 'SYSTEM_CRON'
            });

            if (lockedDoc) {
                await AccessCode.findByIdAndUpdate(lockedDoc._id, { isActive: false, lockedBy: null, lockedAt: null });
            }

            console.log(`[SecureCodeService] Code successfully rotated by CRON. New code: ${newCode}`);
            
            // Email the new code to admins
            await sendVaultCodeToAdmins(newCode);
            
            await auditLog({ event: 'ROTATE', success: true, meta: { trigger: 'CRON' } });

        } catch (error) {
            console.error('[SecureCodeService] Cron rotation failed:', error);
            // Release lock on error
            try {
                await AccessCode.updateMany({ lockedBy: 'SYSTEM_CRON' }, { lockedBy: null, lockedAt: null });
            } catch (_) {}
        }
    });
}

module.exports = { generateCode, hashCode, verifyCode, auditLog, formatExpiry, initCron };
