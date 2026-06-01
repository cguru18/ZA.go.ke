const fs = require('fs');
const path = require('path');

const VAULT_ROOT = 'C:/Users/mwiti/Downloads/Obsidian/mySpace/02-Projects/ZA.go.ke';

const folders = [
    '',
    '01-Infrastructure-Gateway',
    '02-Core-Logic-Data',
    '03-Client-Interface'
];

// Ensure directories exist
folders.forEach(f => {
    const dir = path.join(VAULT_ROOT, f);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// File contents mapping using single quotes
const files = {
    // ── Root Index ──
    'ZA.go.ke - Architecture Index.md': '# ZA.go.ke - System Architecture Index\n\nWelcome to the central system architecture map for the **ZA.go.ke** platform. The architecture is organized into three distinct tiers:\n\n## System Tiers\n1. **Infrastructure & Gateway Layer**: [[Infrastructure-Gateway-MOC]]\n   - Deals with server initialization, load balancing, environment setup, and containerization.\n2. **Core Logic & Data Layer**: [[Core-Logic-MOC]]\n   - Details Express routers, database schemas, cryptographic helper utilities, and authentication middleware.\n3. **Client Interface Layer**: [[Client-Interface-MOC]]\n   - Houses React components, view pages, client-side route guards, and socket hook contexts.\n\n---\n*Back to Vault Home: [[ZA.go.ke - Architecture Index]]*',

    // ── Tier MOCs ──
    '01-Infrastructure-Gateway/Infrastructure-Gateway-MOC.md': '# Infrastructure & Gateway - Map of Content\n\nThis layer initializes and controls the runtime environment, handles API load balancing, and defines deployment configurations.\n\n## Architecture Root\n- Backlink: [[ZA.go.ke - Architecture Index]]\n\n## Node Representations\n- [[server.js]]: Main Express and Socket.io entry point.\n- [[env]]: Configuration files for runtime environments.\n- [[nginx.conf]]: Reverse proxy load balancing configurations.\n- [[Dockerfile]]: Containerization parameters for Cloud Run.\n\n## Relations\nThis tier exposes API interfaces and sockets used by the client layer [[Client-Interface-MOC]] and executes core modules tracked in [[Core-Logic-MOC]].',

    '02-Core-Logic-Data/Core-Logic-MOC.md': '# Core Logic & Data - Map of Content\n\nThis layer houses the data schemas, API endpoints, security policies, and cryptographic algorithms.\n\n## Architecture Root\n- Backlink: [[ZA.go.ke - Architecture Index]]\n\n## Node Representations\n- [[Message.js]]: Database model storing encrypted chat tokens.\n- [[User.js]]: Account schemas, tier specifications, and permission scopes.\n- [[cryptoHelper.js]]: AES-256-GCM message encryption helper.\n- [[authMiddleware.js]]: HTTP-Only cookie and Bearer token API validation.\n- [[adminRoutes.js]]: Financial aggregations, code rotations, and chat log controllers.\n\n## Relations\nThis tier processes requests from the client layer [[Client-Interface-MOC]] and attaches server hooks controlled by [[Infrastructure-Gateway-MOC]].',

    '03-Client-Interface/Client-Interface-MOC.md': '# Client Interface - Map of Content\n\nThis layer defines user interaction components, route guards, layouts, and real-time state contexts.\n\n## Architecture Root\n- Backlink: [[ZA.go.ke - Architecture Index]]\n\n## Node Representations\n- [[App.jsx]]: React-Router wrapper organizing guards and components.\n- [[AdminRouteGuard.jsx]]: Route element for secure pre-flight claims checks.\n- [[AdminDashboard.jsx]]: Tabbed admin overview console.\n- [[AdminChatConsole.jsx]]: Support ticket sidebar queues and conversation windows.\n- [[UserChatbox.jsx]]: Floating support widget with AES-GCM history decryption.\n\n## Relations\nThis tier sends user actions and support queries to the gateway layer [[Infrastructure-Gateway-MOC]] and consumes endpoints governed by [[Core-Logic-MOC]].',

    // ── Tier 1 File Notes ──
    '01-Infrastructure-Gateway/server.js.md': '# server.js\n\nParent Folder: [[Infrastructure-Gateway-MOC]] | Core Dependencies: [[authMiddleware.js]], [[Message.js]]\n\n## Overview\nExposes the main Express server and Socket.io socket handlers under worker processes.\n- Initializes the `/support` namespace.\n- Intercepts customer connections to fetch their user profiles and inject them into message streams.\n- Manages secure symmetric encryption checks via [[cryptoHelper.js]] during chat event triggers.',

    '01-Infrastructure-Gateway/env.md': '# .env\n\nParent Folder: [[Infrastructure-Gateway-MOC]] | Target Files: [[server.js]], [[cryptoHelper.js]]\n\n## Overview\nStores the system configuration and keys, including:\n- `CHAT_ENCRYPTION_KEY`: Stretched 32-byte hex key for Galois/Counter Mode.\n- `JWT_SECRET`: Seed used for client JWT signatures.\n- `MONGO_URI`: Target connection string for database states.',

    '01-Infrastructure-Gateway/nginx.conf.md': '# nginx.conf\n\nParent Folder: [[Infrastructure-Gateway-MOC]] | Target Files: [[server.js]]\n\n## Overview\nSpecifies the Nginx reverse-proxy load balancer layer. Ensures connections are load-balanced across Node cluster worker PIDs and sets headers for geofencing rate limits.',

    '01-Infrastructure-Gateway/Dockerfile.md': '# Dockerfile\n\nParent Folder: [[Infrastructure-Gateway-MOC]] | Target Files: [[server.js]]\n\n## Overview\nSpecifies environment parameters for container creation, compiling dependencies, and deploying production server clusters on Google Cloud Run.',

    // ── Tier 2 File Notes ──
    '02-Core-Logic-Data/Message.js.md': '# Message.js\n\nParent Folder: [[Core-Logic-MOC]] | Schema Consumers: [[server.js]], [[adminRoutes.js]]\n\n## Overview\nDefines the Mongoose database schema to store support ticket logs. Messages are encrypted before insertion:\n- `conversationId`: Grouping ID.\n- `senderId`: Reference link to User profile.\n- `encryptedContent`: Output string from [[cryptoHelper.js]].\n- `iv`: Initialization vector.\n- `authTag`: Verification token ensuring packet integrity.\n- `isReadByAdmin`: Tracking state for support counters.',

    '02-Core-Logic-Data/User.js.md': '# User.js\n\nParent Folder: [[Core-Logic-MOC]] | Schema Consumers: [[server.js]], [[adminRoutes.js]]\n\n## Overview\nDefines database schema for accounts, including `fullName`, `email`, and authorization `role`. Includes dynamic properties like `tier` (e.g. VIP, STANDARD) for profile enrichment.',

    '02-Core-Logic-Data/cryptoHelper.js.md': '# cryptoHelper.js\n\nParent Folder: [[Core-Logic-MOC]] | Upstream Config: [[env]] | Consumers: [[server.js]], [[adminRoutes.js]]\n\n## Overview\nHouses backend cryptographic encryption/decryption utilities using native Node `crypto`.\n- Algorithmic Choice: **AES-256-GCM**.\n- Key Derivation: Stretches `CHAT_ENCRYPTION_KEY` via PBKDF2 with SHA-512.\n- Generates 16-byte cryptographically secure random Initialization Vectors (IV) for every package.',

    '02-Core-Logic-Data/authMiddleware.js.md': '# authMiddleware.js\n\nParent Folder: [[Core-Logic-MOC]] | Core Consumers: [[adminRoutes.js]]\n\n## Overview\nValidates client API access. Enforces secure cookies (`admin_token`) and Bearer token headers. Emits a clean JSON `403 Forbidden` payload on authorization failure.',

    '02-Core-Logic-Data/adminRoutes.js.md': '# adminRoutes.js\n\nParent Folder: [[Core-Logic-MOC]] | Endpoint consumers: [[AdminRouteGuard.jsx]], [[AdminChatConsole.jsx]]\n\n## Overview\nExposes administrative API endpoints under `/api/admin/*`.\n- `GET /verify`: Enforces cookie and claim pre-flight tests.\n- `GET /conversations`: Returns unread counts, timestamps, and customer profiles.\n- `GET /conversations/:id/messages`: Retrieves decrypted support history.',

    // ── Tier 3 File Notes ──
    '03-Client-Interface/App.jsx.md': '# App.jsx\n\nParent Folder: [[Client-Interface-MOC]] | Route Wrappers: [[AdminRouteGuard.jsx]]\n\n## Overview\nInitializes React-Router. Protects premium views including `AdminDashboard` (`/admin`) and `LiveMap` (`/map`) under route guards to avoid layout cache bypasses.',

    '03-Client-Interface/AdminRouteGuard.jsx.md': '# AdminRouteGuard.jsx\n\nParent Folder: [[Client-Interface-MOC]] | Backend Validator: [[adminRoutes.js]]\n\n## Overview\nStrict React router guard component:\n- Issues synchronous pre-flight cryptographic tests against `/api/admin/verify` using HTTP-Only cookies.\n- Performs hard views memory purges and redirects user sessions to login (`window.location.replace(\'/login\')`) on verification failures.',

    '03-Client-Interface/AdminDashboard.jsx.md': '# AdminDashboard.jsx\n\nParent Folder: [[Client-Interface-MOC]] | Mounted console: [[AdminChatConsole.jsx]]\n\n## Overview\nHouses the Command Center dashboard, featuring a tabbed display system. Leverages Framer Motion for premium slide transitions and badge notifications.',

    '03-Client-Interface/AdminChatConsole.jsx.md': '# AdminChatConsole.jsx\n\nParent Folder: [[Client-Interface-MOC]] | Specifications: [[Secure-Chatbox-Specification]], [[Admin-Access-Control-SLA]]\n\n## Overview\nImplements the administrator\'s support workspace.\n- Organizes client chats into a sorted queue based on `lastMessageTimestamp`.\n- Displays dynamic avatars, email records, and counter badges for unread inputs.\n- Establishes Socket.io support channel connection tunnels to direct messages.',

    '03-Client-Interface/UserChatbox.jsx.md': '# UserChatbox.jsx\n\nParent Folder: [[Client-Interface-MOC]] | Specifications: [[Secure-Chatbox-Specification]]\n\n## Overview\nRenders the floating customer support widget. Establishes socket tunnels, loads historical logs, and applies HTML sanitization checks to eliminate XSS injections.'
};

// Write files
Object.entries(files).forEach(([fileRelPath, content]) => {
    const fullPath = path.join(VAULT_ROOT, fileRelPath);
    // Ensure parent directories exist
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim(), 'utf8');
    console.log(`Successfully generated note: ${fullPath}`);
});

console.log('Knowledge ecosystem notes generation completed successfully!');
