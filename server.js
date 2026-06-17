/**
 * HAZOOM OS V3 — Secure Express Server
 * Copyright © 2024-2026 Hazem Soussi. All Rights Reserved.
 */

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const HTTP_PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;

const HAZOOM_DIR = path.join(__dirname);
const GAMES_DIR = path.join(__dirname, 'games');
const NEON_DRIFT_DIST = path.join(GAMES_DIR, 'neon-drift', 'dist');
const SSL_DIR = path.join(HAZOOM_DIR, 'ssl');

// SSL certificate paths
const SSL_KEY = path.join(SSL_DIR, 'server.key');
const SSL_CERT = path.join(SSL_DIR, 'server.crt');
const hasSSL = fs.existsSync(SSL_KEY) && fs.existsSync(SSL_CERT);

// Security headers via helmet
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

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Hide powered-by header
app.disable('x-powered-by');

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const proto = req.socket.encrypted ? 'HTTPS' : 'HTTP';
        console.log(`[${new Date().toISOString()}] ${proto} ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// Parse JSON with size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Static files with cache control
app.use(express.static(HAZOOM_DIR, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        }
    }
}));

// Games directory (no CSP restrictions for Three.js CDN)
app.use('/games', express.static(GAMES_DIR, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Security-Policy',
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "font-src 'self' https://fonts.gstatic.com; " +
                "img-src 'self' data: blob: https:; " +
                "connect-src 'self' http://localhost:* https:; " +
                "frame-ancestors 'none'"
            );
        }
    }
}));

// ===== API PROXY ENDPOINTS =====

// Proxy to chat server (port 9004)
app.post('/api/chat', (req, res) => {
    const body = JSON.stringify(req.body);
    const options = {
        hostname: '127.0.0.1',
        port: 9004,
        path: '/chat',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        },
        timeout: 120000
    };
    const proxyReq = http.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => {
            res.status(proxyRes.statusCode).json(JSON.parse(data || '{}'));
        });
    });
    proxyReq.on('error', (e) => {
        res.status(503).json({ error: 'Chat server unavailable', reply: 'AI service is offline. Start Ollama or run ./hazoom-os.sh start' });
    });
    proxyReq.on('timeout', () => {
        proxyReq.destroy();
        res.status(504).json({ error: 'Chat server timeout' });
    });
    proxyReq.write(body);
    proxyReq.end();
});

app.get('/api/chat/health', (req, res) => {
    const options = {
        hostname: '127.0.0.1',
        port: 9004,
        path: '/health',
        method: 'GET',
        timeout: 5000
    };
    const proxyReq = http.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => res.status(proxyRes.statusCode).json(JSON.parse(data || '{}')));
    });
    proxyReq.on('error', () => res.status(503).json({ status: 'offline', ollama: 'offline' }));
    proxyReq.on('timeout', () => { proxyReq.destroy(); res.status(504).json({ status: 'timeout' }); });
    proxyReq.end();
});

// Proxy to unified API gateway (port 8080)
app.all('/api/unified/*', (req, res) => {
    const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : null;
    const options = {
        hostname: '127.0.0.1',
        port: 8080,
        path: req.path.replace('/api/unified', '/api'),
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {})
        },
        timeout: 30000
    };
    const proxyReq = http.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => {
            res.status(proxyRes.statusCode);
            try { res.json(JSON.parse(data || '{}')); } catch { res.send(data); }
        });
    });
    proxyReq.on('error', () => res.status(503).json({ error: 'Unified API unavailable' }));
    proxyReq.on('timeout', () => { proxyReq.destroy(); res.status(504).json({ error: 'Timeout' }); });
    if (body) proxyReq.write(body);
    proxyReq.end();
});

// Proxy to content filter (port 8081)
app.post('/api/filter', (req, res) => {
    const body = JSON.stringify(req.body);
    const options = {
        hostname: '127.0.0.1',
        port: 8081,
        path: '/filter',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 10000
    };
    const proxyReq = http.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => res.status(proxyRes.statusCode).json(JSON.parse(data || '{}')));
    });
    proxyReq.on('error', () => res.status(503).json({ error: 'Filter service unavailable' }));
    proxyReq.write(body);
    proxyReq.end();
});

// System status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        service: 'hazoom-os',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            web: { status: 'online', port: HTTP_PORT },
            chat: { port: 9004 },
            apiGateway: { port: 8080 },
            contentFilter: { port: 8081 },
        }
    });
});

// ===== PAGE ROUTES =====

app.get('/', (req, res) => {
    res.sendFile(path.join(HAZOOM_DIR, 'landing.html'));
});

app.get('/os', (req, res) => {
    res.sendFile(path.join(HAZOOM_DIR, 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'hazoom-os',
        version: '3.0.0',
        tls: req.socket.encrypted || false,
        timestamp: new Date().toISOString()
    });
});

// Game routes
const gameLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/game', gameLimiter, express.static(NEON_DRIFT_DIST, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Security-Policy',
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "font-src 'self' https://fonts.gstatic.com; " +
                "img-src 'self' data: blob: https:; " +
                "connect-src 'self' http://localhost:* https:; " +
                "frame-ancestors 'none'"
            );
        }
        if (filePath.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
        }
    }
}));

app.get('/game', (req, res) => {
    res.sendFile(path.join(NEON_DRIFT_DIST, 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    res.status(err.status || 500).json({ error: 'Internal server error' });
});

// Start HTTP server (localhost only)
const httpServer = http.createServer(app);
httpServer.listen(HTTP_PORT, '127.0.0.1', () => {
    console.log(`HAZOOM OS HTTP  -> http://127.0.0.1:${HTTP_PORT}`);
});

// Start HTTPS server if SSL certs exist
if (hasSSL) {
    const httpsOptions = {
        key: fs.readFileSync(SSL_KEY),
        cert: fs.readFileSync(SSL_CERT),
        minVersion: 'TLSv1.2',
        ciphers: [
            'ECDHE-ECDSA-AES128-GCM-SHA256',
            'ECDHE-RSA-AES128-GCM-SHA256',
            'ECDHE-ECDSA-AES256-GCM-SHA384',
            'ECDHE-RSA-AES256-GCM-SHA384'
        ].join(':'),
        honorCipherOrder: true,
        rejectUnauthorized: true,
        headers: {
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
        }
    };
    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(HTTPS_PORT, '127.0.0.1', () => {
        console.log(`HAZOOM OS HTTPS -> https://127.0.0.1:${HTTPS_PORT}`);
        console.log(`  HSTS: Enabled with 1 year max-age`);
    });
} else {
    console.log(`HTTPS disabled -- no SSL certs found at ${SSL_DIR}`);
    console.log(`  Run: openssl req -x509 -newkey rsa:4096 -keyout ssl/server.key -out ssl/server.crt -days 365 -nodes`);
}

console.log(`  Landing page: http://127.0.0.1:${HTTP_PORT}/`);
console.log(`  Desktop OS:   http://127.0.0.1:${HTTP_PORT}/os`);
console.log(`  Health check: http://127.0.0.1:${HTTP_PORT}/health`);
console.log(`  Game:         http://127.0.0.1:${HTTP_PORT}/game (NEON DRIFT v2.0)`);
