const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const AccessCode = require('../models/AccessCode');
const Location = require('../models/Location');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { hashCode } = require('../services/SecureCodeService');

const { protect, admin } = require('../middleware/authMiddleware');

// POST /api/admin/signup
router.post('/signup', async (req, res) => {
    try {
        const { fullName, email, password, masterPassword } = req.body;

        const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'HEAT_AND_TREATS_2026';

        if (masterPassword !== MASTER_PASSWORD) {
            return res.status(403).json({ success: false, message: 'Invalid Master Password.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Generate Dual-Key AES-256 equivalent
        const rawEncryptionKey = crypto.randomBytes(32).toString('hex');
        
        // Hash the encryption key to store safely
        const salt = await bcrypt.genSalt(12);
        const adminSecretHash = await bcrypt.hash(rawEncryptionKey, salt);

        const adminUser = new User({
            fullName,
            email,
            password, // Mongoose pre-save hook will hash this
            role: 'ADMIN',
            adminSecretHash,
            permissions: ['ALL']
        });

        await adminUser.save();

        res.status(201).json({
            success: true,
            message: 'Admin successfully created. SAVE YOUR ENCRYPTION KEY. IT WILL ONLY BE SHOWN ONCE.',
            encryptionKey: rawEncryptionKey
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/admin/login
router.post('/login', async (req, res) => {
    const { email, password, encryptionKey } = req.body;

    try {
        const adminUser = await User.findOne({ email, role: 'ADMIN' });
        if (!adminUser) {
            return res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
        }

        // 1. Verify Password
        const isPasswordMatch = await adminUser.matchPassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({ success: false, message: 'Invalid Password' });
        }

        // 2. Verify Physical Encryption Key
        if (!adminUser.adminSecretHash || !encryptionKey) {
             return res.status(401).json({ success: false, message: 'Encryption Key Required' });
        }
        
        const isKeyMatch = await bcrypt.compare(encryptionKey, adminUser.adminSecretHash);
        if (!isKeyMatch) {
            return res.status(401).json({ success: false, message: 'Invalid Encryption Key' });
        }

        const token = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET || 'secret123', {
            expiresIn: '30d'
        });

        // Set securely signed, HTTP-Only cookie for premium route guarding
        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.status(200).json({
            success: true,
            token,
            admin: {
                id: adminUser._id,
                fullName: adminUser.fullName,
                email: adminUser.email,
                role: adminUser.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Secure Admin Routes
router.use(protect);
router.use(admin);

// GET /api/admin/verify
// Explicit cryptographic pre-flight verification check
router.get('/verify', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Cryptographic claims verified successfully',
        user: {
            id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email,
            role: req.user.role
        }
    });
});


// GET /api/admin/financial-summary
// Lightweight aggregation for the financial summary KPI card
router.get('/financial-summary', async (req, res) => {
    try {
        const report = await Order.aggregate([
            { $match: { paymentStatus: 'Completed' } },
            {
                $group: {
                    _id: null,
                    totalGross:  { $sum: '$grossRevenue' },
                    totalOrders: { $count: {} },
                    // Daraja takes 0.5% — calculate processing fees on the fly
                    totalFees:   { $sum: { $multiply: ['$grossRevenue', 0.005] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalGross:  1,
                    totalOrders: 1,
                    totalFees:   1,
                    netRevenue:  { $subtract: ['$totalGross', '$totalFees'] }
                }
            }
        ]);

        res.json(report[0] || { totalGross: 0, totalOrders: 0, totalFees: 0, netRevenue: 0 });
    } catch (err) {
        res.status(500).json({ error: 'Aggregation Failed' });
    }
});

// GET /api/admin/reports
router.get('/reports', async (req, res) => {
    try {
        // Accounting Aggregation Pipeline
        const financials = await Order.aggregate([
            { $match: { paymentStatus: 'Completed' } },
            { 
                $group: { 
                    _id: null, 
                    totalGrossRevenue: { $sum: '$grossRevenue' },
                    totalProcessingFees: { $sum: { $multiply: ['$grossRevenue', 0.005] } } // 0.5% Daraja Fee
                } 
            }
        ]);

        const gross = financials.length > 0 ? financials[0].totalGrossRevenue : 0;
        const fees = financials.length > 0 ? financials[0].totalProcessingFees : 0;
        const net = gross - fees;

        // Traffic Metrics (Simulated sessions via recently created users in 24h as fallback)
        const last24h = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
        const trafficCount = await User.countDocuments({ createdAt: { $gte: last24h } });

        // Active Deliveries (unique active orders tracked in the last 2 hours)
        const last2Hours = new Date(new Date().getTime() - (2 * 60 * 60 * 1000));
        const activeDeliveriesList = await Location.distinct('orderId', { timestamp: { $gte: last2Hours } });
        const activeDeliveries = activeDeliveriesList.length;

        // Retrieve orders for the Accounting Table — include mpesaReceiptNumber for audit trail
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('customerId', 'fullName email')
            .select('orderId customerId grossRevenue processingFee netProfit paymentStatus mpesaReceiptNumber createdAt')
            .limit(50);

        res.status(200).json({
            success: true,
            kpis: {
                grossRevenue: gross,
                processingFees: fees,
                netProfit: net,
                traffic24h: trafficCount,
                activeDeliveries
            },
            orders: recentOrders
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ── Mutex TTL: any lock held longer than this is considered stale ─────────────
const LOCK_TTL_MS = 30_000; // 30 seconds

// GET /api/admin/vault-code
// Returns the current active vault code for admin display (admin-only route).
router.get('/vault-code', async (req, res) => {
    try {
        const now = new Date();

        // Find the currently active, non-expired code
        let activeCode = await AccessCode.findOne({ isActive: true, expiresAt: { $gt: now } })
            .sort({ createdAt: -1 });

        // If none exists yet, auto-generate one so the dashboard is never empty
        if (!activeCode) {
            const rawCode  = crypto.randomBytes(3).toString('hex').toUpperCase();
            const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const hashedCode = await hashCode(rawCode);
            activeCode = await AccessCode.create({ code: rawCode, codeHash: hashedCode, isActive: true, expiresAt });
            console.log(`[VAULT] Auto-generated first access code: ${activeCode.code}`);
        }

        return res.status(200).json({
            success:   true,
            code:      activeCode.code,
            expiresAt: activeCode.expiresAt,
            // Tell the UI if the code is currently being rotated by another admin
            isLocked:  !!(activeCode.lockedBy && (now - new Date(activeCode.lockedAt)) < LOCK_TTL_MS),
            lockedBy:  activeCode.lockedBy || null,
        });
    } catch (error) {
        console.error('vault-code fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/admin/rotate-codes
// Atomically acquires a DB-level mutex before rotating, preventing concurrent
// changes by multiple admins across all cluster workers.
router.post('/rotate-codes', async (req, res) => {
    // The calling admin's email must be sent in the request body for the lock audit trail
    const adminEmail = req.body?.adminEmail || 'unknown-admin';

    try {
        const now        = new Date();
        const staleLimit = new Date(now.getTime() - LOCK_TTL_MS);

        // ── Step 1: Atomically acquire the lock ──────────────────────────────
        const lockedDoc = await AccessCode.findOneAndUpdate(
            {
                isActive: true,
                $or: [
                    { lockedBy: null },
                    { lockedAt: { $lt: staleLimit } }, // stale lock auto-release
                ],
            },
            {
                $set: { lockedBy: adminEmail, lockedAt: now },
            },
            { new: true, sort: { createdAt: -1 } }
        );

        // If no document was updated, another admin holds the lock right now
        if (!lockedDoc) {
            // Find the doc to report who locked it
            const blocker = await AccessCode.findOne({ isActive: true }).sort({ createdAt: -1 });
            const lockedByEmail = blocker?.lockedBy || 'another admin';
            return res.status(423).json({
                success: false,
                message: `Code change is locked by ${lockedByEmail}. Please wait a moment and try again.`,
            });
        }

        // ── Step 2: Deactivate all current codes and create a new one ────────
        await AccessCode.updateMany({ isActive: true, _id: { $ne: lockedDoc._id } }, { isActive: false });

        const { generateCode, sendVaultCodeToAdmins } = require('../services/SecureCodeService');
        const newCode   = generateCode(8); // Base32
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h from now
        
        // HASH THE NEW CODE! Essential for verify endpoint to work properly.
        const hashedCode = await hashCode(newCode);

        const newRecord = await AccessCode.create({
            code:      newCode,
            codeHash:  hashedCode,
            isActive:  true,
            expiresAt,
            lockedBy:  null, // new code has no lock
            lockedAt:  null,
            generatedBy: adminEmail
        });

        // ── Step 3: Deactivate the old locked doc (it's been replaced) ───────
        await AccessCode.findByIdAndUpdate(lockedDoc._id, { isActive: false, lockedBy: null, lockedAt: null });

        console.log(`[VAULT] Code rotated by ${adminEmail}. New code: ${newCode}`);
        
        // Let's also email the manually rotated code to all admins
        const emailService = require('../services/EmailService');
        await emailService.sendVaultCodeToAdmins(newCode);

        return res.status(200).json({
            success:   true,
            newCode,
            expiresAt: newRecord.expiresAt,
            message:   'Vault access code successfully changed.',
        });
    } catch (error) {
        console.error('rotate-codes error:', error);
        // Always release the lock on error to avoid a deadlock
        try {
            await AccessCode.updateMany({ lockedBy: adminEmail }, { lockedBy: null, lockedAt: null });
        } catch (_) {}
        res.status(500).json({ success: false, message: 'Server error during code rotation.' });
    }
});

// GET /api/admin/conversations
// Retrieve unique conversation threads for the AdminChatConsole sidebar
router.get('/conversations', async (req, res) => {
    try {
        const Message = require('../models/Message');
        const User = require('../models/User');
        const cryptoHelper = require('../utils/cryptoHelper');

        // Aggregation to find latest message per conversationId
        const conversations = await Message.aggregate([
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: '$conversationId',
                    lastMessage: { $first: '$$ROOT' }
                }
            },
            { $sort: { 'lastMessage.timestamp': -1 } }
        ]);

        const populatedConversations = await Promise.all(conversations.map(async (c) => {
            const lastMsg = c.lastMessage;
            const decryptedContent = cryptoHelper.decryptMessage(
                lastMsg.encryptedContent,
                lastMsg.iv,
                lastMsg.authTag
            );

            // Fetch profile and details from database
            const customerId = c._id.replace('conv_', '');
            let userProfile = null;
            try {
                const customerUser = await User.findById(customerId).lean();
                if (customerUser) {
                    userProfile = {
                        fullName: customerUser.fullName,
                        profilePictureUrl: customerUser.profilePictureUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
                        email: customerUser.email,
                        tier: customerUser.tier || 'STANDARD',
                        createdAt: customerUser.createdAt
                    };
                }
            } catch (err) {
                console.error('Failed to get user profile in /conversations:', err);
            }

            // Calculate unreadCount for the thread (customer sent it, not read by admin)
            const unreadCount = await Message.countDocuments({
                conversationId: c._id,
                senderId: customerId,
                isReadByAdmin: false
            });

            return {
                conversationId: c._id,
                lastMessage: decryptedContent,
                timestamp: lastMsg.timestamp,
                lastMessageTimestamp: lastMsg.timestamp, // Configuration dynamic sorting
                senderId: lastMsg.senderId,
                unreadCount,
                userProfile
            };
        }));

        res.json({ success: true, conversations: populatedConversations });
    } catch (error) {
        console.error('Fetch conversations error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
    }
});

// GET /api/admin/conversations/:id/messages
// Returns decrypted message history for a specific conversationId
router.get('/conversations/:id/messages', async (req, res) => {
    try {
        const Message = require('../models/Message');
        const User = require('../models/User');
        const Order = require('../models/Order');
        const cryptoHelper = require('../utils/cryptoHelper');
        const conversationId = req.params.id;

        // Mark messages as read by admin when viewing history
        const customerId = conversationId.replace('conv_', '');
        await Message.updateMany(
            { conversationId, senderId: customerId, isReadByAdmin: false },
            { $set: { isReadByAdmin: true } }
        );

        const messages = await Message.find({ conversationId }).sort({ timestamp: 1 });

        const decryptedMessages = messages.map(m => {
            const plainContent = cryptoHelper.decryptMessage(m.encryptedContent, m.iv, m.authTag);
            return {
                _id: m._id,
                conversationId: m.conversationId,
                senderId: m.senderId,
                message: plainContent,
                timestamp: m.timestamp,
                isReadByAdmin: m.isReadByAdmin
            };
        });

        // ── Rich Profiling Database Integration ──────────────────
        let userProfile = null;
        try {
            const customerUser = await User.findById(customerId).lean();
            if (customerUser) {
                // Fetch last 3 orders of the customer
                const orders = await Order.find({ customerId }).sort({ createdAt: -1 }).limit(3).lean();
                const logs = orders.map(o => ({
                    action: `Placed Order #${o.orderId}`,
                    timestamp: o.createdAt,
                    details: `${o.products.map(p => `${p.name} (x${p.qty})`).join(', ')} - KES ${o.grossRevenue} (${o.paymentStatus})`
                }));

                // Fallback default log if logs are fewer than 3
                if (logs.length < 3) {
                    logs.push({
                        action: "Account Registered",
                        timestamp: customerUser.createdAt || new Date(),
                        details: "Customer account initialized on ZA.go.ke"
                    });
                }

                userProfile = {
                    fullName: customerUser.fullName,
                    profilePictureUrl: customerUser.profilePictureUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
                    email: customerUser.email,
                    accountTier: customerUser.tier || 'STANDARD',
                    createdAt: customerUser.createdAt,
                    location: 'Nairobi, Kenya',
                    logs
                };
            }
        } catch (err) {
            console.error('Failed to get rich user profile in /conversations/:id/messages:', err);
        }

        res.json({ success: true, messages: decryptedMessages, userProfile });
    } catch (error) {
        console.error('Fetch conversation messages error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
});


module.exports = router;
