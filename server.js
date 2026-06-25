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

// ── EXPRESS APP ───────────────────────────────────────────────────

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "https:", "http:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
            connectSrc: ["'self'", "http://localhost:*", "https:", "http:", "wss:", "ws:"],
            frameSrc: ["*"],
            frameAncestors: ["'self'"],
            baseUri: ["'self'"],
            formAction: ["'self'", "https:", "http:"],
            upgradeInsecureRequests: null
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    hsts: false
}));

app.use(rateLimit({
    windowMs: config.get('rateLimitWindow'),
    max: config.get('rateLimitMax'),
    standardHeaders: true,
    legacyHeaders: false
}));
app.disable('x-powered-by');
app.use(express.json({ limit: config.get('maxRequestBody') }));
app.use(express.urlencoded({ extended: false, limit: config.get('maxRequestBody') }));

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// ── KERNEL + Q-LEARNING ───────────────────────────────────────────

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

// ── BOOT SEQUENCE ─────────────────────────────────────────────────

const bootSequence = new BootSequence(kernel, { logLevel: config.get('logLevel') });
const bootResult = bootSequence.boot();
logger.info(`Boot ${bootResult.success ? 'complete' : 'failed'}`, { duration: bootResult.totalDuration + 'ms', errors: bootResult.errors.length });

// ── API ROUTES ────────────────────────────────────────────────────

const apiRouter = new APIRouter(kernel, { logger: logger.child('API') });
app.use(apiRouter.getMiddleware());

// ── STATIC FILES ──────────────────────────────────────────────────

app.use(express.static(HAZOOM_DIR, {
    maxAge: config.isProduction ? '1d' : 0,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        }
    }
}));

// ── START SERVER ──────────────────────────────────────────────────

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
