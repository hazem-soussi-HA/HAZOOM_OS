/**
 * HAZOOM OS v5.0 — CONVERGENCE — Unified Server
 * 
 * The single entry point. Modular architecture:
 *   core/config    → centralized configuration
 *   core/logger    → structured logging
 *   core/boot      → boot sequence orchestrator
 *   core/api       → REST API routes
 *   core/websocket → real-time WebSocket
 *   kernel/q-learning → Q-learning system
 *   core/kernel    → OS kernel (process, memory, FS, devices, security)
 * 
 * Production-grade enhancements:
 *   - Request ID (X-Request-Id)
 *   - Response time header (X-Response-Time)
 *   - CORS with configurable origins
 *   - Response compression via zlib (no external deps)
 *   - Security headers via helmet
 *   - Rate limiting per IP
 *   - Request body size validation
 *   - API response caching with TTL
 *   - Structured JSON request logging
 *   - Favicon handler
 *   - Static file serving with caching
 *   - Centralized error handling
 *   - Graceful shutdown (SIGTERM/SIGINT)
 * 
 * Copyright © 2024-2026 Hazem Soussi — All Rights Reserved
 */

'use strict';

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

// v5.0 modular core
const { getConfig } = require('./core/config');
const { Logger } = require('./core/logger');
const { BootSequence } = require('./core/boot');
const { APIRouter } = require('./core/api');
const { WebSocketHandler } = require('./core/websocket');

// OS kernel
const { HazoomKernel } = require('./core/kernel');

// Q-Learning system
const { HazoomQLearner } = require('./kernel/q-learning');

// Auth system
const { AuthManager } = require('./core/auth');

// ── CONFIGURATION ─────────────────────────────────────────────────

const config = getConfig();
const logger = new Logger({
    source: 'HAZOOM',
    level: config.get('logLevel'),
    maxBuffer: config.get('logMaxLines')
});

const HTTP_PORT = config.get('httpPort');
const HTTPS_PORT = config.get('httpsPort');
const HAZOOM_DIR = __dirname;

// ── HELPERS ───────────────────────────────────────────────────────

function generateRequestId() {
    return crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}`;
}

function parseBytes(str) {
    const match = String(str).match(/^(\d+)\s*(b|kb|mb|gb)$/i);
    if (!match) return 1024 * 1024;
    const num = parseInt(match[1], 10);
    switch (match[2].toLowerCase()) {
        case 'gb': return num * 1024 * 1024 * 1024;
        case 'mb': return num * 1024 * 1024;
        case 'kb': return num * 1024;
        default: return num;
    }
}

const MAX_BODY_BYTES = parseBytes(config.get('maxRequestBody'));
const CORS_ORIGINS = config.get('corsOrigins') || ['*'];
const CACHE_DEFAULT_TTL = config.get('cacheTTL') || 60000;

// In-memory cache with TTL for API responses
class MemoryCache {
    constructor(defaultTTL = 60000) {
        this._store = new Map();
        this._defaultTTL = defaultTTL;
        this._timer = setInterval(() => this._evictExpired(), 60000);
        if (this._timer.unref) this._timer.unref();
    }

    get(key) {
        const entry = this._store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expires) {
            this._store.delete(key);
            return null;
        }
        return entry.value;
    }

    set(key, value, ttl) {
        this._store.set(key, {
            value,
            expires: Date.now() + (ttl || this._defaultTTL)
        });
    }

    invalidate(pattern) {
        for (const key of this._store.keys()) {
            if (key.startsWith(pattern)) this._store.delete(key);
        }
    }

    clear() {
        this._store.clear();
    }

    _evictExpired() {
        const now = Date.now();
        for (const [key, entry] of this._store) {
            if (now > entry.expires) this._store.delete(key);
        }
    }

    destroy() {
        clearInterval(this._timer);
        this._store.clear();
    }
}

// ── EXPRESS APP ───────────────────────────────────────────────────

const app = express();
const apiCache = new MemoryCache(CACHE_DEFAULT_TTL);

// ── 1. REQUEST ID ────────────────────────────────────────────────

app.use((req, res, next) => {
    const reqId = req.headers['x-request-id'] || generateRequestId();
    req.id = reqId;
    res.setHeader('X-Request-Id', reqId);
    next();
});

// ── 2. RESPONSE TIME ────────────────────────────────────────────

app.use((req, res, next) => {
    const start = Date.now();
    const _origEnd = res.end.bind(res);
    res.end = function(chunk, encoding, callback) {
        const duration = Date.now() - start;
        if (!res.headersSent) {
            res.setHeader('X-Response-Time', `${duration}ms`);
        }
        return _origEnd(chunk, encoding, callback);
    };
    next();
});

// ── 3. BODY SIZE VALIDATION ──────────────────────────────────────

app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentLength = parseInt(req.headers['content-length'], 10) || 0;
        if (contentLength > MAX_BODY_BYTES) {
            return res.status(413).json({
                error: {
                    message: `Request body exceeds maximum size of ${config.get('maxRequestBody')}`,
                    code: 'PAYLOAD_TOO_LARGE',
                    status: 413,
                    requestId: req.id
                }
            });
        }
    }
    next();
});

// ── 4. CORS ──────────────────────────────────────────────────────

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        const allowAll = CORS_ORIGINS.includes('*');
        const allowed = allowAll || CORS_ORIGINS.includes(origin);
        if (allowed) {
            res.setHeader('Access-Control-Allow-Origin', allowAll ? '*' : origin);
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id, X-CSRF-Token');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Max-Age', '86400');
            res.setHeader('Vary', 'Origin');
        }
    }
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});

// ── 5. COMPRESSION (disabled — custom middleware broke express.static) ──
// The stream-based compression intercepted res.write/end but express.static
// uses res.sendFile which bypasses those. Body arrived empty in browsers.
// TODO: use compression() npm package if compression is needed.

// ── 6. SECURITY HEADERS (helmet) ─────────────────────────────────

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "http://localhost:*", "https:", "wss:", "ws:"],
            frameSrc: ["'self'"],
            frameAncestors: ["'self'"],
            baseUri: ["'self'"],
            formAction: ["'self'", "https:"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// ── 7. RATE LIMITING ─────────────────────────────────────────────

const limiter = rateLimit({
    windowMs: config.get('rateLimitWindow'),
    max: config.get('rateLimitMax'),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: {
            message: 'Too many requests, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            status: 429,
            timestamp: new Date().toISOString()
        }
    },
    keyGenerator: (req) => req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown'
});
app.use(limiter);
app.disable('x-powered-by');

// ── 8. BODY PARSING ──────────────────────────────────────────────

app.use(express.json({ limit: config.get('maxRequestBody') }));
app.use(express.urlencoded({ extended: false, limit: config.get('maxRequestBody') }));

// ── 9. FAVICON HANDLER ───────────────────────────────────────────

app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(HAZOOM_DIR, 'favicon.ico');
    if (fs.existsSync(faviconPath)) {
        return res.sendFile(faviconPath, {
            maxAge: config.isProduction ? '7d' : 0,
            headers: {
                'Cache-Control': config.isProduction ? 'public, max-age=604800, immutable' : 'no-cache'
            }
        });
    }
    res.status(204).end();
});

// ── 10. ENHANCED REQUEST LOGGING ─────────────────────────────────

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const entry = {
            method: req.method,
            url: req.originalUrl || req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            requestId: req.id,
            ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
            userAgent: (req.headers['user-agent'] || '').slice(0, 200),
            referer: req.headers['referer'] || ''
        };

        if (res.statusCode >= 500) {
            logger.error(`API ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, entry);
        } else if (res.statusCode >= 400) {
            logger.warn(`API ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, entry);
        } else {
            logger.info(`API ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, entry);
        }
    });
    next();
});

// ── 11. API RESPONSE CACHING ─────────────────────────────────────

app.use((req, res, next) => {
    if (req.method !== 'GET') {
        // Invalidate cache on mutations
        const p = req.path;
        if (p.startsWith('/api/')) {
            const base = p.split('/').slice(0, 3).join('/');
            apiCache.invalidate(base);
        }
        return next();
    }

    const skipPaths = ['/api/intelligence/stream'];
    if (skipPaths.some(p => req.path.startsWith(p))) return next();

    const cacheKey = req.originalUrl;
    const cached = apiCache.get(cacheKey);
    if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = function (body) {
        if (res.statusCode === 200) {
            apiCache.set(cacheKey, body);
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
    };
    next();
});

// ── KERNEL + Q-LEARNING ──────────────────────────────────────────

const kernel = new HazoomKernel();

// Initialize Q-Learning system
if (config.get('qLearning.enabled')) {
    const qConfig = config.get('qLearning');
    kernel.qLearner = new HazoomQLearner({
        mode: qConfig.mode,
        tabular: qConfig.tabular,
        dqn: qConfig.dqn
    });

    // Try to restore persisted Q-learning state
    const qPersistPath = path.join(HAZOOM_DIR, qConfig.persistencePath, 'state.json');
    try {
        if (fs.existsSync(qPersistPath)) {
            const saved = JSON.parse(fs.readFileSync(qPersistPath, 'utf8'));
            kernel.qLearner.fromJSON(saved);
            logger.info('Q-Learning state restored from disk');
        }
    } catch (e) {
        logger.warn(`Q-Learning restore failed: ${e.message}`);
    }

    logger.info('Q-Learning system initialized', { mode: qConfig.mode });
}

// ── AUTH SYSTEM ────────────────────────────────────────────────────

const authManager = new AuthManager(kernel);
kernel.authManager = authManager;
logger.info('Auth system initialized', { users: authManager.users.size });

// ── BOOT SEQUENCE ────────────────────────────────────────────────

const bootSequence = new BootSequence(kernel, { logLevel: config.get('logLevel') });
const bootResult = bootSequence.boot();
logger.info(`Boot ${bootResult.success ? 'complete' : 'failed'}`, { duration: bootResult.totalDuration + 'ms', errors: bootResult.errors.length });

// ── API ROUTES ───────────────────────────────────────────────────

const apiRouter = new APIRouter(kernel, { logger: logger.child('API'), authManager });
app.use(apiRouter.getMiddleware());

// ── STATIC FILES ─────────────────────────────────────────────────

app.use(express.static(HAZOOM_DIR, {
    maxAge: 0,
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        if (filePath.endsWith('.html')) {
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        }
    }
}));

// ── 12. 404 HANDLER ──────────────────────────────────────────────

app.use((req, res) => {
    if (req.path === '/favicon.ico') return res.status(204).end();
    res.status(404).json({
        error: {
            message: `Route not found: ${req.method} ${req.originalUrl}`,
            code: 'NOT_FOUND',
            status: 404,
            requestId: req.id
        }
    });
});

// ── 13. CENTRALIZED ERROR HANDLER ───────────────────────────────

app.use((err, req, res, next) => {
    const statusCode = err.status || err.statusCode || 500;
    const isServerError = statusCode >= 500;

    logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, {
        error: err.message,
        stack: config.isProduction ? undefined : err.stack,
        requestId: req.id,
        status: statusCode
    });

    res.status(statusCode).json({
        error: {
            message: config.isProduction && isServerError
                ? 'Internal Server Error'
                : err.message || 'Internal Server Error',
            code: err.code || (isServerError ? 'INTERNAL_ERROR' : 'BAD_REQUEST'),
            status: statusCode,
            requestId: req.id,
            timestamp: new Date().toISOString()
        }
    });
});

// ── START SERVER ─────────────────────────────────────────────────

const server = http.createServer(app);
server.listen(HTTP_PORT, config.get('host'), () => {
    logger.info(`HTTP server running on port ${HTTP_PORT}`);
    logger.info(`Open http://localhost:${HTTP_PORT}`);
});

// HTTPS (if certificates exist)
if (config.hasSSL) {
    const sslDir = path.join(HAZOOM_DIR, config.get('sslDir'));
    const sslOptions = {
        key: fs.readFileSync(path.join(sslDir, 'server.key')),
        cert: fs.readFileSync(path.join(sslDir, 'server.crt'))
    };
    const httpsServer = https.createServer(sslOptions, app);
    httpsServer.listen(HTTPS_PORT, () => {
        logger.info(`HTTPS server running on port ${HTTPS_PORT}`);
    });
}

// ── WEBSOCKET ─────────────────────────────────────────────────────

const wsHandler = new WebSocketHandler(server, kernel, apiRouter, {
    tickInterval: config.get('wsTickInterval'),
    logger: logger.child('WS')
});

// ── GRACEFUL SHUTDOWN ─────────────────────────────────────────────

function gracefulShutdown(signal) {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    // Save Q-learning state
    if (kernel.qLearner) {
        try {
            const qPersistDir = path.join(HAZOOM_DIR, config.get('qLearning.persistencePath'));
            if (!fs.existsSync(qPersistDir)) fs.mkdirSync(qPersistDir, { recursive: true });
            fs.writeFileSync(
                path.join(qPersistDir, 'state.json'),
                JSON.stringify(kernel.qLearner.toJSON())
            );
            logger.info('Q-Learning state saved to disk');
        } catch (e) {
            logger.error(`Q-Learning save failed: ${e.message}`);
        }
    }

    // Shutdown kernel
    kernel.shutdown();
    logger.info('Kernel shutdown complete');

    // Clean up cache
    apiCache.destroy();

    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });

    // Force exit after 5s
    setTimeout(() => {
        logger.warn('Forced shutdown after 5s timeout');
        process.exit(1);
    }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── STARTUP BANNER ────────────────────────────────────────────────

logger.info('HAZOOM OS v5.0.0 — CONVERGENCE');
logger.info(`Kernel: ${kernel.processManager.processes.size} processes`);
logger.info(`Memory: ${kernel.memoryManager.totalPages} pages, ${kernel.memoryManager.freePages} free`);
logger.info(`Q-Learning: ${kernel.qLearner ? kernel.qLearner.mode + ' mode' : 'disabled'}`);
logger.info(`Endpoints: /api/status, /api/processes, /api/memory, /api/fs, /api/qlearner, /api/consciousness, /api/pascal`);
