const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    conversationId: { type: String, required: true, index: true },
    senderId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    encryptedContent: { type: String, required: true },
    iv:             { type: String, required: true },
    authTag:        { type: String, required: true },
    isReadByAdmin:  { type: Boolean, default: false },
    timestamp:      { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
