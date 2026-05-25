/**
 * HEAT & TREATS - VAULT CONTROLLER
 * Handles AI Identity Verification logic using memory buffer.
 */

const User = require('../models/User');
const IdentityVerificationService = require('../services/IdentityVerificationService');

const verifyIdentity = async (req, res) => {
    try {
        const { userId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, message: "ID image is required." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Process in-memory buffer via AI Service
        const extractedDob = await IdentityVerificationService.extractDOBFromImage(file.buffer);
        const age = IdentityVerificationService.calculateAge(extractedDob);

        if (age < 21) {
            user.isAgeVerified = false;
            user.dob = extractedDob;
            await user.save();
            return res.status(403).json({ 
                success: false, 
                message: "Access Denied: You must be at least 21 years old to access Heat & Treats." 
            });
        }

        // Verification Passed
        user.isAgeVerified = true;
        user.dob = extractedDob;
        await user.save();

        res.status(200).json({ 
            success: true, 
            message: "Identity verified successfully. Premium access granted.",
            age: age
        });
        
    } catch (error) {
        console.error("Identity Verification Error:", error);
        res.status(500).json({ success: false, message: "Server error during verification." });
    }
};

module.exports = { verifyIdentity };
