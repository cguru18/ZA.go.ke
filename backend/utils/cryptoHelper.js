const crypto = require('crypto');

// Pull the encryption key from env or use a cryptographically derived fallback
const rawKey = process.env.CHAT_ENCRYPTION_KEY || 'fallback_support_secret_key_123_treats_and_heat';
// Derive a secure 32-byte key using PBKDF2 or scrypt
const ENCRYPTION_KEY = crypto.scryptSync(rawKey, 'salt', 32);
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts a plaintext string using AES-256-GCM
 * @param {string} plainText 
 * @returns {object} { encryptedContent, iv, authTag }
 */
function encryptMessage(plainText) {
    if (!plainText) return null;
    
    // Generate a fresh 16-byte IV as explicitly requested in the prompt
    const iv = crypto.randomBytes(16); 
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
        encryptedContent: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag
    };
}

/**
 * Decrypts an AES-256-GCM encrypted message payload
 * @param {string} cipherText 
 * @param {string} ivHex 
 * @param {string} authTagHex 
 * @returns {string} Plaintext decrypted message
 */
function decryptMessage(cipherText, ivHex, authTagHex) {
    if (!cipherText || !ivHex || !authTagHex) return '';
    try {
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(cipherText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error.message);
        return '[Decryption Failed: Decryption key mismatch or corrupted payload]';
    }
}

module.exports = {
    encryptMessage,
    decryptMessage
};
