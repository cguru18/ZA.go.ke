const mongoose = require('mongoose');
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.JWT_SECRET || 'fallback_secret', 'salt', 32);

function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return text;
    }
}

const MessageSchema = new mongoose.Schema({
    senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    orderId:    { type: String, default: null },
    message:    { type: String, required: true, set: encrypt, get: decrypt },
    isRead:     { type: Boolean, default: false }
}, { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } });

module.exports = mongoose.model('Message', MessageSchema);
