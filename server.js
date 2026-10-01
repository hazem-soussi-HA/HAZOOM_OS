/**
 * HAZOOM OS v6.0 — CONVERGENCE — Unified Server
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
const { spawn } = require('child_process');
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
const PUBLIC_STATIC_ROOTS = new Set(['apps', 'assets', 'core', 'projects']);
const BLOCKED_PUBLIC_PATHS = new Set([
    '/apps/ai-apps/jev-terminal.html',
    '/core/jev-core.js',
    '/core/jev-core.js.bak'
]);

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

// ── EXPRESS APP ───────────────────────────────────────────────────

const app = express();

app.use((req, res, next) => {
    if (req.path === '/health' || req.path === '/api' || req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'no-store');
    }
    next();
});

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
        const explicitlyAllowed = CORS_ORIGINS.includes(origin);
        const allowed = allowAll || explicitlyAllowed;
        if (allowed) {
            res.setHeader('Access-Control-Allow-Origin', explicitlyAllowed ? origin : '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id, X-CSRF-Token');
            if (explicitlyAllowed) res.setHeader('Access-Control-Allow-Credentials', 'true');
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

// ── 5b. COMPRESSION (npm `compression` — sendFile-safe, unlike the
// custom stream middleware previously removed) ────────────────────

const compression = require('compression');
app.use(compression({ threshold: 1024 }));

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            mediaSrc: ["'self'", "https:", "https://www.soundhelix.com"],
            connectSrc: ["'self'", "http://localhost:*", "https:", "wss:", "ws:"],
            frameSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*"],
            frameAncestors: ["'self'"],
            baseUri: ["'self'"],
            formAction: ["'self'", "https:"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    hsts: config.hasSSL ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
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
    // rate-limit v8 requires the ipKeyGenerator helper for correct IPv6
    // handling; a raw req.ip keyGenerator logs a ValidationError and
    // lets IPv6 clients bypass the limit.
    keyGenerator: require('express-rate-limit').ipKeyGenerator
});
app.use(limiter);
app.disable('x-powered-by');

// ── 8. BODY PARSING ──────────────────────────────────────────────

// rawBody captured for GitHub webhook HMAC verification (X-Hub-Signature-256)
app.use(express.json({
    limit: config.get('maxRequestBody'),
    verify: (req, res, buf) => { req.rawBody = buf; }
}));
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

// ── KERNEL + Q-LEARNING ──────────────────────────────────────────

const kernel = new HazoomKernel(config);

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

// Real reasoning surface over the kernel's IntelligenceCore (local Ollama).
const { IntelligenceAPI } = require('./core/intelligence_api');
new IntelligenceAPI(kernel, { logger: logger.child('INTEL'), authManager }).register(apiRouter.getMiddleware());

function getAppPathStatus(requestedPath) {
    const value = String(requestedPath || '');
    if (!value) return { path: value, available: false, type: 'local' };
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return { path: value, available: true, type: 'external' };

    let decodedPath;
    try {
        decodedPath = decodeURIComponent(value);
    } catch {
        return { path: value, available: false, type: 'local' };
    }

    const normalizedPath = decodedPath.startsWith('/') ? decodedPath : `/${decodedPath}`;
    if (BLOCKED_PUBLIC_PATHS.has(normalizedPath)) return { path: value, available: false, type: 'blocked' };

    const resolvedPath = path.resolve(HAZOOM_DIR, `.${normalizedPath}`);
    const relativePath = path.relative(HAZOOM_DIR, resolvedPath);
    const topLevel = relativePath.split(path.sep)[0];
    if (!PUBLIC_STATIC_ROOTS.has(topLevel)) return { path: value, available: false, type: 'private' };

    try {
        const stat = fs.statSync(resolvedPath);
        const available = stat.isDirectory()
            ? fs.existsSync(path.join(resolvedPath, 'index.html'))
            : stat.isFile();
        return { path: value, available, type: 'local' };
    } catch {
        return { path: value, available: false, type: 'local' };
    }
}

app.get('/api/apps/availability', (req, res) => {
    res.json(getAppPathStatus(req.query.path));
});

app.get('/api/apps/manifest', (req, res) => {
    const paths = String(req.query.paths || '').split('|').filter(Boolean).slice(0, 100);
    res.json({ paths: paths.map(getAppPathStatus) });
});

// ── AI CHAT GATEWAY ──────────────────────────────────────────────
// Single same-origin gateway to the Ollama chat backend. The desktop
// must never hardcode a backend port (v3 used localhost:9004 and broke
// on CORS + port drift). Point CHAT_BACKEND at whatever serves /chat.

const CHAT_BACKEND = process.env.CHAT_BACKEND || 'http://127.0.0.1:5055';
const CHAT_PATH = process.env.CHAT_BACKEND ? '/chat' : '/api/chat';
const CHAT_HEALTH_PATH = process.env.CHAT_BACKEND ? '/health' : '/api/health';

app.post('/api/chat', async (req, res) => {
    try {
        const r = await fetch(`${CHAT_BACKEND}${CHAT_PATH}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
            signal: AbortSignal.timeout(130000)
        });
        const data = await r.json().catch(() => ({}));
        res.status(r.status).json({ ...data, reply: data.reply || data.response || data.error || 'No response from model' });
    } catch (e) {
        logger.warn('AI chat backend unreachable', { error: e.message });
        res.status(503).json({ error: 'AI backend offline' });
    }
});

app.get('/api/chat/health', async (req, res) => {
    try {
        const r = await fetch(`${CHAT_BACKEND}${CHAT_HEALTH_PATH}`, { signal: AbortSignal.timeout(5000) });
        const data = await r.json().catch(() => ({}));
        res.status(r.status).json({ ...data, ollama: data.ollama || (data.ollama_alive ? 'online' : 'offline') });
    } catch (e) {
        res.status(503).json({ status: 'offline', ollama: 'offline', model: null });
    }
});

// ── SECURE WEB ACCESS (in-OS browser) ─────────────────────────────────────
// The browser reads the public internet through a hardened fetcher rather than
// a raw iframe. Two independent layers keep third-party pages from touching the
// OS: core/web_fetch.js refuses private/loopback targets (SSRF), and
// core/html_sanitizer.js strips executable constructs while the route below pins
// a CSP that would neutralise anything the sanitizer missed.

const { fetchResource, WebFetchError, stats: webFetchStats, clearCaches: clearWebCaches } = require('./core/web_fetch');
const { sanitizeHtml, PAGE_ROUTE, ASSET_ROUTE } = require('./core/html_sanitizer');

const WEB_ENABLED = (process.env.HAZOOM_WEB_ACCESS || 'on').toLowerCase() !== 'off';
const WEB_RATE_LIMIT = Number(process.env.HAZOOM_WEB_RPM) || 240;

// Strict, same-origin policy for anything we render. script-src 'none' is the
// guarantee; the sanitizer is the optimisation.
const SECURE_PAGE_CSP = [
    "default-src 'none'",
    "script-src 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    "form-action 'none'",
    "frame-src 'none'",
    "child-src 'none'",
    "connect-src 'none'",
    "base-uri 'none'",
    "object-src 'none'"
].join('; ');

const webLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: WEB_RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Web access rate limit reached', code: 'RATE_LIMITED' }
});

function webGuard(req, res, next) {
    if (!WEB_ENABLED) {
        return res.status(503).json({
            error: 'Web access is disabled. Set HAZOOM_WEB_ACCESS=on to enable.',
            code: 'WEB_DISABLED'
        });
    }
    res.setHeader('Content-Security-Policy', SECURE_PAGE_CSP);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
}

function webError(res, error) {
    if (error instanceof WebFetchError) {
        return res.status(error.status || 400).json({ error: error.message, code: error.code });
    }
    if (error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
        return res.status(504).json({ error: 'Upstream request timed out', code: 'TIMEOUT' });
    }
    logger.warn('Web fetch failed', { name: error?.name, code: error?.code, message: error?.message, cause: error?.cause?.code || error?.cause?.message });
    return res.status(502).json({ error: 'Upstream request failed', code: 'UPSTREAM_ERROR' });
}

// Rendered page: sanitized HTML, same-origin so rewritten assets resolve.
app.get(PAGE_ROUTE, webLimiter, webGuard, async (req, res) => {
    const target = String(req.query.url || '');
    let result;
    try {
        result = await fetchResource(target, {
            accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
            maxBytes: 4 * 1024 * 1024
        });
    } catch (e) {
        return webError(res, e);
    }

    const type = String(result.headers['content-type'] || '');
    if (!/text\/html|application\/xhtml|text\/plain/i.test(type)) {
        // Not a document: show it as escaped text rather than pretending to render.
        const body = result.body.toString('utf8').slice(0, 200000);
        return res.type('html').send(
            `<!doctype html><meta charset="utf-8"><title>${result.finalUrl}</title>` +
            `<pre style="white-space:pre-wrap;word-break:break-word;background:#0a0c14;color:#e8ecf4;padding:16px;margin:0">` +
            `${body.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre>`
        );
    }

    const html = sanitizeHtml(result.body.toString('utf8'), { baseUrl: result.finalUrl });
    res.setHeader('Cache-Control', 'no-store');
    res.type('html').send(html);
});

// Sub-resources (images, stylesheets, media) referenced by a rendered page.
app.get(ASSET_ROUTE, webLimiter, webGuard, async (req, res) => {
    const target = String(req.query.url || '');
    let result;
    try {
        result = await fetchResource(target, {
            accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif,image/svg+xml,text/css,*/*;q=0.5',
            maxBytes: 8 * 1024 * 1024,
            cacheTtlMs: 5 * 60 * 1000
        });
    } catch (e) {
        return webError(res, e);
    }
    const type = String(result.headers['content-type'] || 'application/octet-stream');
    // Never let a remote asset arrive as something the browser will execute.
    res.setHeader('Content-Type', /^(text\/css|image\/|font\/|application\/font)/i.test(type) ? type : 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.status(result.status).send(result.body);
});

app.get('/api/web/status', webGuard, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ enabled: WEB_ENABLED, rateLimitPerMinute: WEB_RATE_LIMIT, ...webFetchStats() });
});

app.post('/api/web/cache/clear', webLimiter, webGuard, (req, res) => {
    clearWebCaches();
    res.json({ cleared: true });
});

// ── SPEECH ────────────────────────────────────────────────────────
//
// Arabic (and Latin) text to speech. espeak-ng reads the text from stdin and
// writes WAV to stdout, so caller-supplied text never reaches argv and there
// is no shell to quote. This machine has no sound card — output leaves through
// the WSLg PulseAudio server, which forwards to the Windows host. The browser
// does the playing; this route only renders.
//
// Guarded because it shells out to a binary: authenticated, length-capped,
// time-capped, output-capped.

// TTS engine. Piper is a neural VITS model and is the default because espeak
// is a formant synthesiser with a tiny transition inventory — it audibly loops,
// and no amount of EQ fixes that. espeak is kept for French and English, where
// it is more tolerable, and can be forced with voice "espeak:fr".
//
// Piper reads text from stdin and writes WAV to stdout, same as espeak, so
// caller text still never reaches argv and there is still no shell.
// The server may run as root while the model was installed under a user's home,
// so HOME cannot be trusted here — check the candidates and use the first that
// actually exists.
function resolvePiperModel() {
    if (process.env.HAZOOM_PIPER_MODEL) return process.env.HAZOOM_PIPER_MODEL;
    const name = 'ar_JO-kareem-medium.onnx';
    const candidates = [
        path.join('/home/hazem/.local/share/piper', name),
        path.join(process.env.HOME || '/root', '.local/share/piper', name),
        path.join('/root/.local/share/piper', name),
        '/usr/share/piper/' + name
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
    return candidates[0];
}
const PIPER_MODEL = resolvePiperModel();
const ESPEAK_VOICES = { ar: 'ar', fr: 'fr-fr', en: 'en' };
const VOICE_LANG = { ar: 'ar', fr: 'fr', en: 'en' };

function runSynth(bin, args, text, maxBytes, timeoutMs) {
    return new Promise((resolve, reject) => {
        let child;
        try { child = spawn(bin, args, { stdio: ['pipe', 'pipe', 'pipe'] }); }
        catch (e) { return reject(Object.assign(new Error('engine unavailable'), { status: 503 })); }
        const chunks = []; let total = 0; let err = '';
        const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch (_) {} }, timeoutMs);
        child.stdout.on('data', d => {
            total += d.length;
            if (total > maxBytes) { try { child.kill('SIGKILL'); } catch (_) {} }
            else chunks.push(d);
        });
        child.stderr.on('data', d => { if (err.length < 500) err += d.toString(); });
        child.on('error', e => { clearTimeout(timer);
            reject(Object.assign(new Error('engine unavailable'), { status: 503, cause: e })); });
        child.on('close', code => {
            clearTimeout(timer);
            if (code === 0 && total > 0) return resolve({ wav: Buffer.concat(chunks), bytes: total });
            reject(Object.assign(new Error('synthesis produced no audio'), { status: 502, detail: err.trim() }));
        });
        child.stdin.on('error', () => {});
        child.stdin.end(text, 'utf8');
    });
}

function renderSpeech(text, voice, rate) {
    if (voice === 'espeak:fr' || voice === 'espeak:en') {
        const v = ESPEAK_VOICES[voice.split(':')[1]] || 'fr-fr';
        return runSynth(process.env.HAZOOM_TTS_BIN || 'espeak-ng',
            ['-v', v, '-s', String(rate || 150), '--stdout'], text, TTS_MAX_BYTES, TTS_TIMEOUT_MS);
    }
    const lang = VOICE_LANG[voice] || 'ar';
    return runSynth('piper', ['-m', PIPER_MODEL, '--output_raw'], text,
        TTS_MAX_BYTES, 180000);
}

const speakAuth = authManager.authenticate.bind(authManager);

app.post('/api/speak', speakAuth, async (req, res) => {
    const { text, voice = 'ar', rate } = req.body || {};
    if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'No text provided', code: 'VALIDATION' });
    }
    if (text.length > TTS_MAX_CHARS) {
        return res.status(413).json({ error: `Text too long (max ${TTS_MAX_CHARS})`, code: 'TOO_LONG' });
    }
    let out;
    try {
        out = await renderSpeech(text.slice(0, TTS_MAX_CHARS), voice, rate);
    } catch (e) {
        logger.warn('TTS failed', { voice, message: e.message, detail: e.detail });
        return res.status(e.status || 502).json({ error: e.message, code: 'TTS_FAILED' });
    }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(out.wav);
});

app.get('/api/speak/voices', speakAuth, (_req, res) => {
    res.json({
        voices: ['ar', 'fr', 'en', 'espeak:fr', 'espeak:en'],
        default: 'ar',
        engine: { ar: 'piper ' + path.basename(PIPER_MODEL), fr: 'piper', en: 'piper',
                  'espeak:fr': 'espeak-ng', 'espeak:en': 'espeak-ng' }
    });
});

// ── REASONING ────────────────────────────────────────────────────
//
// Local model via Ollama. The system prompt is deliberately pure Arabic: an
// earlier version had two stray CJK characters in it, and the model faithfully
// switched to Chinese mid-answer. Whatever the system prompt contains, the
// model treats as in-scope.

const TTS_MAX_CHARS = 2000;
const TTS_TIMEOUT_MS = 15000;
const TTS_MAX_BYTES = 8 * 1024 * 1024;

const OLLAMA = process.env.OLLAMA_HOST || 'http://localhost:11434';
const ASK_MODEL = process.env.HAZOOM_ASK_MODEL || 'qwen2.5:7b-instruct';
const ASK_TIMEOUT_MS = 120000;
const ASK_MAX_TURNS = 12;                       // kept per session
const askSessions = new Map();                   // token -> [{role,content}]

function askSystemPrompt() {
    return [
        'أنت حازم، مساعد نظام HAZOOM المحلي.',
        'أجب بنفس اللغة التي كتب بها المستخدم.',
        'إذا كتب بالدارجة التونسية أجب بالدارجة التونسية.',
        'إذا كتب بالعربية الفصحى أجب بالعربية الفصحى.',
        'لا تستخدم أي لغة أخرى مهما طُلب منك.',
        'اجعل الإجابة بين جملة واحدة وثلاث جمل.',
        'لا تخترع هويتك ولا تذكر اسم أي شركة أو نموذج آخر.',
        'إذا سُئلت عن هويتك فقل: أنا حازم، مساعد نظام HAZOOM المحلي.'
    ].join(' ');
}

app.post('/api/ask', speakAuth, async (req, res) => {
    const { text, reset } = req.body || {};
    if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'No text provided', code: 'VALIDATION' });
    }
    if (text.length > 4000) {
        return res.status(413).json({ error: 'Text too long', code: 'TOO_LONG' });
    }

    const key = req.user.username;
    let history = askSessions.get(key) || [];
    if (reset || !Array.isArray(history)) history = [];
    history.push({ role: 'user', content: text });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ASK_TIMEOUT_MS);
    try {
        const upstream = await fetch(`${OLLAMA}/api/chat`, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: ASK_MODEL,
                messages: [{ role: 'system', content: askSystemPrompt() }, ...history],
                stream: false,
                options: { temperature: 0.3, num_predict: 300 }
            })
        });
        if (!upstream.ok) {
            const t = await upstream.text();
            throw Object.assign(new Error(`model returned ${upstream.status}`), { status: 502, detail: t.slice(0, 200) });
        }
        const data = await upstream.json();
        const reply = (data?.message?.content || '').trim();
        history.push({ role: 'assistant', content: reply });
        askSessions.set(key, history.slice(-ASK_MAX_TURNS * 2));
        res.setHeader('Cache-Control', 'no-store');
        res.json({ reply, model: ASK_MODEL, turns: Math.ceil(history.length / 2) });
    } catch (e) {
        logger.warn('ask failed', { message: e.message, detail: e.detail });
        const msg = e.name === 'AbortError' ? 'the model took too long'
            : 'the local model is unavailable — is Ollama running?';
        res.status(504).json({ error: msg, code: e.name === 'AbortError' ? 'TIMEOUT' : 'MODEL_UNAVAILABLE' });
    } finally {
        clearTimeout(timer);
    }
});

app.get('/api/ask/health', speakAuth, (_req, res) => {
    res.json({ model: ASK_MODEL, ollama: OLLAMA });
});

// ── STATIC FILES ─────────────────────────────────────────────────

app.use((req, res, next) => {
    if (BLOCKED_PUBLIC_PATHS.has(req.path)) return res.status(404).end();
    next();
});

const staticOptions = {
    maxAge: 0,
    etag: true,
    lastModified: true,
    dotfiles: 'deny',
    setHeaders: (res, filePath) => {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        if (filePath.endsWith('.html')) {
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        }
    }
};

const sendPublicFile = (fileName) => (req, res) => res.sendFile(path.join(HAZOOM_DIR, fileName));

/**
 * The only modules under /core that the browser actually loads.
 *
 * Everything else in core/ is server-side and must never be served:
 * core/auth.js publishes the default admin credentials in source
 * (ADMIN_PASSWORD || 'root'), core/shell.js publishes the shell
 * allowlist, and core/security*.js publish the security implementation.
 * Mounting the whole directory handed all 52 of them to any visitor.
 *
 * Allowlist rather than denylist, so a newly added server module is
 * private by default. Verified against the live request log.
 */
const CORE_CLIENT_MODULES = new Set([
    'ai_orchestrator.js',
    'app_launcher.js',
    'app_registry.js',
    'boot_audio.js',
    'deep_think_engine.js',
    'icons.js',
    'os-desktop.js',
    'os-filesystem.js',
    'privacy_browser.js',
    'quantum_crypto.js',
    'quantum_events.js',
    'quantum_state.js',
    'service_constellation.js',
    'system_monitor.js',
    'universe_background.js',
]);

app.get(['/', '/index.html'], sendPublicFile('index.html'));
app.get('/landing.html', sendPublicFile('landing.html'));
app.get(['/showcase', '/showcase.html'], sendPublicFile('showcase.html'));
app.get('/apps-registry.json', sendPublicFile('apps-registry.json'));
app.use('/apps', express.static(path.join(HAZOOM_DIR, 'apps'), staticOptions));
app.use('/assets', express.static(path.join(HAZOOM_DIR, 'assets'), staticOptions));
app.use('/core', (req, res, next) => {
    // Reject nested paths and anything not explicitly cleared, with 404 so
    // the response does not confirm which files exist.
    if (!/^\/[^/]+$/.test(req.path) || !CORE_CLIENT_MODULES.has(path.basename(req.path))) {
        return res.status(404).json({
            error: { message: 'Not found', code: 'NOT_FOUND', status: 404 }
        });
    }
    next();
});
app.use('/core', express.static(path.join(HAZOOM_DIR, 'core'), staticOptions));
app.use('/projects', express.static(path.join(HAZOOM_DIR, 'projects'), staticOptions));

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
server.on('error', (error) => {
    logger.error(`HTTP server error: ${error.message}`);
    process.exit(1);
});
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

// ── SHELL EXECUTOR (gated) ────────────────────────────────────────
// Real shell observation with allowlist: read-only + safe git ops.

const { getShellExecutor } = require('./core/shell');
const shellExecutor = getShellExecutor({ workDir: HAZOOM_DIR, logger: logger.child('SHELL') });
kernel.shellExecutor = shellExecutor;
logger.info('Shell executor ready — gated allowlist', shellExecutor.getStats());

// ── WEBSOCKET ─────────────────────────────────────────────────────

const wsHandler = new WebSocketHandler(server, kernel, apiRouter, {
    tickInterval: config.get('wsTickInterval'),
    logger: logger.child('WS'),
    shell: shellExecutor,
    authManager
});

// ── GITHUB BRIDGE ─────────────────────────────────────────────────
// Real-time shell observation between GitHub and the OS.
// Webhook receiver (HMAC-verified) + REST polling + GitOps control.

const { GitHubBridge } = require('./core/github_bridge');
const githubBridge = new GitHubBridge({
    owner: config.get('github.owner'),
    repo: config.get('github.repo'),
    token: config.get('github.token'),
    webhookSecret: config.get('github.webhookSecret'),
    pollInterval: config.get('github.pollInterval'),
    maxEvents: config.get('github.maxEvents'),
    workDir: HAZOOM_DIR,
    logger: logger.child('GITHUB'),
    broadcast: (msg) => wsHandler.broadcastGitHub(msg)
});
kernel.githubBridge = githubBridge;

if (githubBridge.enabled) {
    logger.info('GitHub bridge enabled — observing GitHub in real time', {
        repo: `${githubBridge.owner}/${githubBridge.repo}`,
        events: ['push', 'pull_request', 'workflow_run']
    });
} else {
    logger.warn('GitHub bridge running without token — webhook-only mode (set GITHUB_TOKEN for polling)');
}

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

    // Stop GitHub bridge polling
    if (githubBridge) githubBridge.stop();

    if (wsHandler) wsHandler.close();

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

logger.info('HAZOOM OS v6.0.0 — CONVERGENCE');
logger.info(`Kernel: ${kernel.processManager.getProcessList().length} processes`);
logger.info(`Memory: ${kernel.memoryManager.totalPages} pages, ${kernel.memoryManager.freePages} free`);
logger.info(`Q-Learning: ${kernel.qLearner ? kernel.qLearner.mode + ' mode' : 'disabled'}`);
logger.info(`Endpoints: /api/status, /api/processes, /api/memory, /api/fs, /api/qlearner, /api/consciousness, /api/pascal`);
