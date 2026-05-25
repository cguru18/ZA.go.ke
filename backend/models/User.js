const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAgeVerified: { type: Boolean, default: false },
    dob: { type: Date },
    resetToken: { type: String },
    expireToken: { type: Date },
    role: { type: String, enum: ['CUSTOMER', 'ADMIN', 'user'], default: 'CUSTOMER' },
    adminSecretHash: { type: String },
    permissions: [{ type: String }]
}, { timestamps: true });

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);
