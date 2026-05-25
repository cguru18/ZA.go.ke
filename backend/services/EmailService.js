const nodemailer = require('nodemailer');
const User = require('../models/User');

/**
 * Creates a reusable transporter object using the default SMTP transport.
 * Note: In production, configure environment variables for SMTP details.
 * For this implementation, we use a test or console mock if SMTP isn't provided.
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
        user: process.env.SMTP_USER || 'test-user',
        pass: process.env.SMTP_PASS || 'test-pass'
    }
});

/**
 * Sends the new 24h Vault Code to all registered admins.
 * @param {string} newCode The newly generated access code
 */
const sendVaultCodeToAdmins = async (newCode) => {
    try {
        const admins = await User.find({ role: 'ADMIN' }).select('email');
        if (!admins.length) return;

        const emailList = admins.map(admin => admin.email).join(', ');

        const mailOptions = {
            from: '"ZA.go Systems" <no-reply@za.go.ke>',
            to: emailList,
            subject: 'ZA.go 🔐 New 24-Hour Premium Access Code',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #800020;">Vault Access Rotated</h2>
                    <p>The premium menu access code has been automatically rotated.</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <span style="font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #000;">
                            ${newCode}
                        </span>
                    </div>
                    <p>This code will expire in exactly 24 hours.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #999;">This is an automated system message. Do not reply.</p>
                </div>
            `
        };

        if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
            await transporter.sendMail(mailOptions);
            console.log('[EmailService] Vault code emailed to admins.');
        } else {
            console.log(`[EmailService - MOCK] Simulated email to ${emailList}`);
            console.log(`[EmailService - MOCK] Subject: ${mailOptions.subject}`);
            console.log(`[EmailService - MOCK] Body contains code: ${newCode}`);
        }
    } catch (error) {
        console.error('[EmailService] Error sending email:', error);
    }
};

module.exports = {
    sendVaultCodeToAdmins
};
