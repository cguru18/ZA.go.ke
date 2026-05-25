/**
 * server.js  —  ZA.go.ke Backend  (Load-Balanced Cluster Edition)
 * ─────────────────────────────────────────────────────────────────────────────
 * Architecture:
 *   • Node.js cluster: 1 primary + N workers (one per CPU core)
 *   • Workers share the same TCP port — OS kernel load-balances connections
 *   • express-rate-limit: global (100/15min) + per-route limits
 *   • helmet: security response headers (XSS, clickjacking, MIME-sniff, etc.)
 *   • /health endpoint: returns worker PID + uptime for reverse-proxy checks
 *   • Graceful SIGTERM shutdown: drains active connections before exit
 *   • Socket.io tuned for cluster stability (pingTimeout / pingInterval)
 *
 * Load Balancer Integration:
 *   See nginx.conf in project root for the Nginx reverse-proxy configuration.
 *   When running behind Nginx, set TRUST_PROXY=1 in .env so rate-limiter
 *   reads the real client IP from X-Forwarded-For.
 */

const cluster = require('cluster');
const os      = require('os');

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
    console.log(`╔═══════════════════════════════════════════════════╗`);
    console.log(`║  ZA.go.ke Load-Balanced Server                    ║`);
    console.log(`║  Primary PID: ${String(process.pid).padEnd(35)}║`);
    console.log(`║  Workers:     ${String(numCPUs).padEnd(35)}║`);
    console.log(`╚═══════════════════════════════════════════════════╝`);

    for (let i = 0; i < numCPUs; i++) cluster.fork();

    // Auto-restart dead workers
    cluster.on('exit', (worker, code, signal) => {
        console.warn(`⚠  Worker ${worker.process.pid} died (${signal || code}). Respawning...`);
        cluster.fork();
    });

    cluster.on('online', (worker) => {
        console.log(`✓  Worker ${worker.process.pid} online`);
    });

} else {
    // ──────────────────────────────────────────────────────────
    // WORKER PROCESS
    // ──────────────────────────────────────────────────────────
    const express    = require('express');
    const http       = require('http');
    const { Server } = require('socket.io');
    const mongoose   = require('mongoose');
    const cors       = require('cors');
    const dotenv     = require('dotenv');
    const rateLimit  = require('express-rate-limit');
    const helmet     = require('helmet');

    dotenv.config();

    const app    = express();
    const server = http.createServer(app);

    const { createClient } = require('redis');
    const { createAdapter } = require('@socket.io/redis-adapter');

    const io = new Server(server, {
        cors: { 
            origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:3000'],
            credentials: true
        },
        pingTimeout:   60000,
        pingInterval:  25000,
        transports:    ['websocket', 'polling'],
        perMessageDeflate: true, // Enable compression
    });

    // ── Redis Adapter for Horizontal Scaling ───────────────────
    if (process.env.REDIS_URL) {
        const pubClient = createClient({ url: process.env.REDIS_URL });
        const subClient = pubClient.duplicate();
        Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
            io.adapter(createAdapter(pubClient, subClient));
            console.log(`Worker ${process.pid} ✓ Redis Socket.io Adapter connected`);
        }).catch(err => {
            console.error(`Worker ${process.pid} ✗ Redis Adapter error:`, err.message);
        });
    }

    // ── Security Headers (helmet) ─────────────────────────────
    app.use(helmet({
        contentSecurityPolicy: false, // Disabled to allow CDN assets; enable with explicit directives in production
    }));

    // ── Trust proxy (Required for Cloud Run & express-rate-limit) ────────
    app.set('trust proxy', 1);

    // ── CORS + Body Parsing ───────────────────────────────────
    const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:3000'];
    app.use(cors({ 
        origin: function(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // ── Global Rate Limiter (100 req / 15 min per IP) ─────────
    const globalLimiter = rateLimit({
        windowMs:       15 * 60 * 1000,
        max:            100,
        standardHeaders: true,
        legacyHeaders:  false,
        validate: { trustProxy: false },
        message: { error: 'Too many requests from this IP. Please try again later.' },
    });
    app.use(globalLimiter);

    // ── Health Check Endpoint ─────────────────────────────────
    app.get('/health', (req, res) => {
        res.status(200).json({
            status:    'ok',
            pid:       process.pid,
            uptime:    Math.floor(process.uptime()),
            memory:    process.memoryUsage(),
            workers:   numCPUs,
            timestamp: new Date().toISOString(),
        });
    });

    // ── MongoDB Connection ────────────────────────────────────
    mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zago')
        .then(() => {
            console.log(`Worker ${process.pid} ✓ MongoDB connected`);
            // Initialize scheduled jobs
            const { initCron } = require('./services/SecureCodeService');
            initCron();

            // Auto seed products if database is empty
            const Product = require('./models/Product');
            Product.countDocuments()
                .then(count => {
                    if (count === 0) {
                        const seedProductsList = [
                            { title: "Classic Chocolate Chip Cookie", thc: "0mg", price: 150, color: "yellow", category: "Cookies", isInfused: false },
                            { title: "Strawberry Bliss Smoothie", thc: "0mg", price: 300, color: "burgundy", category: "Drinks", isInfused: false },
                            { title: "Assorted Gummy Bears", thc: "0mg", price: 100, color: "blue", category: "Sweets", isInfused: false },
                            { title: "Vanilla Fudge", thc: "0mg", price: 120, color: "yellow", category: "Sweets", isInfused: false },
                            { title: "Fresh Lemonade", thc: "0mg", price: 200, color: "jade", category: "Drinks", isInfused: false },
                            { title: "Purple Haze Gummy", thc: "25mg", price: 300, color: "lilac", category: "Edibles", isInfused: true },
                            { title: "Forest Kush Brownie", thc: "50mg", price: 250, color: "jade", category: "Edibles", isInfused: true },
                            { title: "Smoothie: Velvet Dream", thc: "Infused", price: 450, color: "burgundy", category: "Drinks", isInfused: true },
                            { title: "Edible Cookies", thc: "15mg", price: 200, color: "yellow", category: "Edibles", isInfused: true },
                            { title: "CBD Chill Drops", thc: "50mg CBD", price: 1000, color: "blue", category: "Tinctures", isInfused: true },
                            { title: "Golden Ticket Truffles", thc: "100mg", price: 800, color: "yellow", category: "Edibles", isInfused: true },
                            { title: "Midnight Express Vape", thc: "85%", price: 3500, color: "purple", category: "Vapes", isInfused: true },
                            { title: "Green Crack Pre-roll", thc: "20%", price: 500, color: "jade", category: "Flower", isInfused: true },
                            { title: "Mango Tango Smoothie", thc: "Infused", price: 450, color: "yellow", category: "Drinks", isInfused: true },
                            { title: "Berry Blast Gummies", thc: "30mg", price: 350, color: "burgundy", category: "Edibles", isInfused: true },
                            { title: "Sour Diesel Flower (1g)", thc: "22%", price: 1200, color: "jade", category: "Flower", isInfused: true },
                            { title: "Lemon Haze Cartridge", thc: "80%", price: 2800, color: "yellow", category: "Vapes", isInfused: true },
                            { title: "Sleepy Time Tea", thc: "10mg", price: 300, color: "lilac", category: "Drinks", isInfused: true },
                            { title: "Space Cake", thc: "150mg", price: 1500, color: "purple", category: "Edibles", isInfused: true },
                            { title: "Mint Magic Tincture", thc: "500mg", price: 2500, color: "blue", category: "Tinctures", isInfused: true }
                        ];
                        Product.insertMany(seedProductsList)
                            .then(() => console.log(`Worker ${process.pid} ✓ Seeded products successfully.`))
                            .catch(err => console.log(`Worker ${process.pid} - Seed overlap or error:`, err.message));
                    }
                })
                .catch(err => console.error('Auto-seed check failed:', err.message));
        })
        .catch(err => console.error(`Worker ${process.pid} ✗ MongoDB error:`, err.message));

    // ── API Routes ────────────────────────────────────────────
    app.use('/api/auth',      require('./routes/authRoutes'));
    app.use('/api/user',      require('./routes/userRoutes'));
    app.use('/api/products',  require('./routes/productRoutes'));
    app.use('/api/payment',   require('./routes/paymentRoutes'));
    app.use('/api/logistics', require('./routes/logisticsRoutes'));
    app.use('/api/access',    require('./routes/accessRoutes'));
    app.use('/api/vault',     require('./routes/vaultRoutes'));
    app.use('/api/admin',     require('./routes/adminRoutes'));

    // ── 404 Handler ───────────────────────────────────────────
    app.use((req, res) => {
        res.status(404).json({ error: 'Route not found' });
    });

    // ── Global Error Handler ──────────────────────────────────
    app.use((err, req, res, next) => {
        console.error(`[Worker ${process.pid}] Error:`, err.message);
        res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    });

    // ── Imports for Socket Logic ───────────────────────────────
    const { isPointInPolygon, nairobiPolygon } = require('./middleware/geofence');
    const bcrypt       = require('bcryptjs');
    const jwt          = require('jsonwebtoken');
    const User         = require('./models/User');
    const Message      = require('./models/Message');
    const DropOffPoint = require('./models/DropOffPoint');
    const Location     = require('./models/Location');

    const activeKitchenOrders = new Map();

    const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
        const R  = 6371e3;
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;
        const a  = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    // ── MongoDB Change Stream for Real-Time Location ───────────
    try {
        const locationStream = Location.watch([], { fullDocument: 'updateLookup' });
        locationStream.on('change', (change) => {
            if (change.operationType === 'insert' || change.operationType === 'update') {
                const doc = change.fullDocument;
                if (!doc || !doc.currentLocation) return;
                const update = {
                    orderId: doc.orderId,
                    lat: doc.currentLocation.coordinates[1],
                    lng: doc.currentLocation.coordinates[0],
                    eta: doc.eta,
                    freshness: doc.freshness,
                    countdown: doc.countdown,
                    timestamp: doc.timestamp
                };
                io.to(`order_${doc.orderId}`).emit('order:update', update);
                io.to('map_feed').emit('global:courier_batch', [update]);
            }
        });
        locationStream.on('error', (err) => {
            console.error('Location change stream cursor error:', err.message);
        });
    } catch (err) {
        console.error('Change stream init failed (ensure replica set is active):', err.message);
    }

    // ── Main Socket.io Namespace ──────────────────────────────
    io.on('connection', (socket) => {
        socket.on('join_order_room', (orderId) => socket.join(`order_${orderId}`));

        socket.on('courier_update', async (data) => {
            const point   = [parseFloat(data.lng), parseFloat(data.lat)];
            const isInside = isPointInPolygon(point, nairobiPolygon);

            if (!isInside) {
                io.to(`order_${data.orderId}`).emit('order:boundary-exit', {
                    message: 'Delivery Warning: Courier has exited the Nairobi boundary.'
                });
            }

            let freshness = 100, countdown = 1800;
            if (activeKitchenOrders.has(data.orderId)) {
                const prepTime       = activeKitchenOrders.get(data.orderId);
                const timeElapsedSecs = (Date.now() - prepTime) / 1000;
                countdown = Math.max(0, 1800 - timeElapsedSecs);
                freshness = Math.max(0, Math.floor((countdown / 1800) * 100));
            }

            // Save to MongoDB (Change stream handles broadcasting)
            try {
                await Location.findOneAndUpdate(
                    { orderId: data.orderId, vehicleId: data.vehicleId || 'default' },
                    { 
                        currentLocation: { type: 'Point', coordinates: point },
                        eta: data.eta,
                        freshness: freshness.toString(),
                        countdown,
                        timestamp: new Date()
                    },
                    { upsert: true, new: true }
                );
            } catch (err) {
                console.error('Location save error:', err.message);
            }

            const customerLat    = -1.2921, customerLng = 36.8219;
            const distanceMeters = getDistanceMeters(data.lat, data.lng, customerLat, customerLng);

            socket.emit('telemetry:config', distanceMeters <= 2000
                ? { interval: 1000, mode: 'BURST' }
                : { interval: 5000, mode: 'NORMAL' }
            );

            if (distanceMeters <= 500 && !activeKitchenOrders.has(data.orderId)) {
                io.to(`order_${data.orderId}`).emit('order:prep-trigger', { status: 'KITCHEN_START' });
                activeKitchenOrders.set(data.orderId, Date.now());
            }
        });

        socket.on('disconnect', () => { /* Cleanup on disconnect if needed */ });

        socket.on('order_completed', (data) => activeKitchenOrders.delete(data.orderId));

        // ── Live Map Sync ─────────────────────────────────────
        socket.on('join_map', async () => {
            socket.join('map_feed');
            try {
                const savedPoints = await DropOffPoint.find().sort({ createdAt: 1 }).lean();
                socket.emit('init_points', savedPoints);
            } catch (err) {
                console.error('init_points fetch error:', err.message);
            }
        });

        socket.on('admin_add_point', async (pointData, token) => {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
                if (decoded.role !== 'ADMIN') return socket.emit('map_error', { message: 'Admin access required.' });
            } catch {
                return socket.emit('map_error', { message: 'Invalid or expired token.' });
            }
            try {
                const point = {
                    id:      pointData.id    || Date.now(),
                    lat:     parseFloat(pointData.lat),
                    lng:     parseFloat(pointData.lng),
                    label:   pointData.label || `Drop-off #${pointData.id}`,
                    addedBy: pointData.addedBy || null
                };
                await DropOffPoint.findOneAndUpdate({ id: point.id }, point, { upsert: true, new: true });
                io.to('map_feed').emit('new_dropoff_synced', point);
            } catch (err) {
                socket.emit('map_error', { message: 'Failed to save drop-off point.' });
            }
        });

        socket.on('admin_clear_all', async (token) => {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
                if (decoded.role !== 'ADMIN') return socket.emit('map_error', { message: 'Admin access required.' });
            } catch {
                return socket.emit('map_error', { message: 'Invalid or expired token.' });
            }
            try {
                await DropOffPoint.deleteMany({});
                io.to('map_feed').emit('map_cleared');
            } catch (err) {
                console.error('admin_clear_all error:', err.message);
            }
        });

        socket.on('courier_location_update', (pos) => {
            io.to('map_feed').emit('courier_update', {
                lat: parseFloat(pos.lat),
                lng: parseFloat(pos.lng)
            });
        });
    });

    // ── Support Chat Namespace (/support) ─────────────────────
    const supportIo = io.of('/support');

    supportIo.use(async (socket, next) => {
        const { role, customerId, adminSecretKey, adminEmail, token } = socket.handshake.auth || {};

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
                socket.jwtPayload = decoded;
            } catch {
                return next(new Error('JWT Verification Failed'));
            }
        }

        if (role === 'ADMIN') {
            try {
                const adminUser = await User.findOne({ email: adminEmail, role: 'ADMIN' });
                if (!adminUser || !adminUser.adminSecretHash || !adminSecretKey)
                    return next(new Error('Unauthorized Admin Connection'));
                const isKeyMatch = await bcrypt.compare(adminSecretKey, adminUser.adminSecretHash);
                if (!isKeyMatch) return next(new Error('Unauthorized Admin Key'));
                socket.isAdmin    = true;
                socket.adminEmail = adminEmail;
                return next();
            } catch {
                return next(new Error('Internal Auth Error'));
            }
        } else if (role === 'CUSTOMER' && customerId) {
            socket.customerId = customerId;
            return next();
        } else {
            return next(new Error('Authentication Error'));
        }
    });

    supportIo.on('connection', (socket) => {
        if (socket.isAdmin) {
            socket.join('admin_pool');
            console.log(`Admin [${socket.adminEmail}] entered admin_pool`);
        } else {
            socket.join(`customer_${socket.customerId}`);
        }

        socket.on('customer_query', async (messageData) => {
            try {
                const text    = typeof messageData === 'string' ? messageData : messageData.message;
                const orderId = messageData.orderId || null; // Context from tracker
                
                if (!text || !text.trim()) return;
                
                const newMsg = await new Message({
                    senderId:   socket.customerId,
                    receiverId: null,
                    orderId:    orderId,
                    message:    text.trim(),
                }).save();

                supportIo.to('admin_pool').emit('new_inquiry_alert', {
                    _id:       newMsg._id,
                    senderId:  socket.customerId,
                    orderId:   newMsg.orderId,
                    message:   newMsg.message,
                    timestamp: newMsg.createdAt
                });

                socket.emit('DELIVERED', { _id: newMsg._id, status: '100% Delivered to Admins' });
            } catch (err) {
                console.error('customer_query save error:', err.message);
                socket.emit('message_sent', { status: 'error', detail: err.message });
            }
        });

        socket.on('send_message', async (data) => {
            const { senderId, receiverId, message, isFromAdmin } = data;
            try {
                const safeReceiverId = isFromAdmin ? receiverId : null;
                const newMsg = await new Message({ senderId, receiverId: safeReceiverId, message }).save();
                if (isFromAdmin) {
                    supportIo.to(`customer_${receiverId}`).emit('receive_message', newMsg);
                } else {
                    supportIo.to('admin_pool').emit('receive_message', newMsg);
                }
            } catch (err) {
                console.error('send_message save error:', err.message);
            }
        });
    });

    // ── Start Server ──────────────────────────────────────────
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Worker ${process.pid} listening on :${PORT}`);
    });

    // ── Graceful Shutdown (SIGTERM from Nginx / Docker / K8s) ─
    process.on('SIGTERM', () => {
        console.log(`Worker ${process.pid} received SIGTERM — shutting down gracefully...`);
        server.close(() => {
            console.log(`Worker ${process.pid} HTTP server closed.`);
            mongoose.connection.close(false, () => {
                console.log(`Worker ${process.pid} MongoDB connection closed.`);
                process.exit(0);
            });
        });

        // Force exit if still alive after 30s
        setTimeout(() => process.exit(1), 30000);
    });

    // ── Global Error Handling ──────────────────────────────────
    process.on('unhandledRejection', (reason, promise) => {
        console.error(`Worker ${process.pid} UNHANDLED REJECTION:`, reason);
    });

    process.on('uncaughtException', (err) => {
        console.error(`Worker ${process.pid} UNCAUGHT EXCEPTION:`, err);
        process.exit(1);
    });
}
