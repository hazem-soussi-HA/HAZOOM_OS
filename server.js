/**
 * HAZOOM OS v4.0 — Unified Server
 * Copyright © 2024-2026 Hazem Soussi. All Rights Reserved.
 *
 * Single server that handles:
 * - Static file serving (OS interface, apps, games)
 * - Kernel API (process, memory, filesystem, devices, security)
 * - System monitoring and health checks
 * - WebSocket for real-time updates
 */

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { HazoomKernel } = require('./core/kernel');

const app = express();
const HTTP_PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;
const HAZOOM_DIR = __dirname;
const SSL_DIR = path.join(HAZOOM_DIR, 'ssl');
const SSL_KEY = path.join(SSL_DIR, 'server.key');
const SSL_CERT = path.join(SSL_DIR, 'server.crt');
const hasSSL = fs.existsSync(SSL_KEY) && fs.existsSync(SSL_CERT);

// ===== SECURITY MIDDLEWARE =====
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

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// ===== KERNEL INSTANCE =====
const kernel = new HazoomKernel();

// Format kernel state for API responses (matches frontend expectations)
function getKernelState() {
    const pm = kernel.processManager;
    const mm = kernel.memoryManager;
    const sm = kernel.security;

    const state = {
        version: kernel.version,
        name: kernel.name,
        running: kernel.running,
        bootTime: kernel.bootTime,
        uptime: kernel.uptime,
        tickCount: kernel.tickCount,
        currentUser: sm.users.get('hazem') || { username: 'hazem', uid: 1000, role: 'user' },
        processCount: pm.getProcessList().length,
        processes: pm.getProcessList(),
        currentPid: pm.currentProcess?.pid || null,
        readyQueue: pm.readyQueue.length,
        blockedQueue: pm.blockedQueue.length,
        memory: mm.getStats(),
        logLines: kernel.logBuffer.length
    };
    if (kernel.pascalEngine) {
        state.pascalEngine = kernel.pascalEngine.getFullStatus();
    }
    if (kernel.consciousness) {
        state.consciousness = kernel.consciousness.getStatus();
    }
    return state;
}

// Boot on server start
kernel.boot();

// ===== API ROUTES =====

// System status
app.get('/api/status', (req, res) => {
    res.json(getKernelState());
});

// Boot
app.post('/api/boot', (req, res) => {
    res.json(kernel.boot());
});

// Shutdown
app.post('/api/shutdown', (req, res) => {
    res.json(kernel.shutdown());
});

// Tick (advance scheduler)
app.post('/api/tick', (req, res) => {
    const count = Math.min(parseInt(req.query.count) || 1, 100);
    const results = [];
    for (let i = 0; i < count; i++) results.push(kernel.tick());
    res.json({ ticks: results.length, last: results[results.length - 1] });
});

// Process management
app.get('/api/processes', (req, res) => {
    const state = getKernelState();
    res.json({ processes: state.processes, stats: { total: state.processCount, ready: state.readyQueue, blocked: state.blockedQueue } });
});

app.post('/api/processes/create', (req, res) => {
    const { name, priority, parentPid } = req.body;
    res.json(kernel.processManager.createProcess(name || 'unknown', priority || 5, parentPid || 0));
});

app.post('/api/processes/:pid/terminate', (req, res) => {
    res.json(kernel.processManager.terminateProcess(parseInt(req.params.pid)));
});

app.post('/api/processes/:pid/block', (req, res) => {
    res.json(kernel.processManager.blockProcess(parseInt(req.params.pid)));
});

app.post('/api/processes/:pid/unblock', (req, res) => {
    res.json(kernel.processManager.unblockProcess(parseInt(req.params.pid)));
});

// Memory
app.get('/api/memory', (req, res) => {
    res.json(kernel.memoryManager.getStats());
});

app.post('/api/memory/allocate', (req, res) => {
    const { size, pid } = req.body;
    res.json(kernel.memoryManager.allocate(size || 4096, pid || 1));
});

// File system
app.get('/api/fs/list', (req, res) => {
    const targetPath = req.query.path || kernel.fileSystem.currentPath;
    const result = kernel.fileSystem.listDir(targetPath);
    if (result.error) return res.json(result);
    res.json({ path: result.path, entries: result.entries.map(e => e.name) });
});

app.get('/api/fs/read', (req, res) => {
    const filePath = req.query.path || '';
    const result = kernel.fileSystem.readFile(filePath);
    if (result.error) return res.json({ error: result.error, path: filePath });
    res.json({ path: filePath, content: result.content, size: result.size });
});

app.post('/api/fs/write', (req, res) => {
    const { path: filePath, content } = req.body;
    if (!filePath) return res.json({ error: 'Path required' });
    res.json(kernel.fileSystem.writeFile(filePath, content || ''));
});

app.post('/api/fs/mkdir', (req, res) => {
    const { path: dirPath } = req.body;
    if (!dirPath) return res.json({ error: 'Path required' });
    res.json(kernel.fileSystem.mkdir(dirPath));
});

app.post('/api/fs/delete', (req, res) => {
    const { path: targetPath } = req.body;
    if (!targetPath) return res.json({ error: 'Path required' });
    res.json(kernel.fileSystem.delete(targetPath));
});

// Kernel log
app.get('/api/log', (req, res) => {
    const lines = parseInt(req.query.lines) || 50;
    const level = req.query.level;
    let logs = kernel.logBuffer;
    if (level) logs = logs.filter(l => l.level === level);
    res.json({ lines: logs.slice(-lines), total: kernel.logBuffer.length });
});

// Health check
app.get('/health', (req, res) => {
    const mm = kernel.memoryManager;
    res.json({
        status: kernel.running ? 'online' : 'offline',
        version: kernel.version,
        uptime: kernel.uptime,
        processes: kernel.processManager.processes.size,
        memoryUsage: mm.getStats().usagePercent + '%'
    });
});

// Pascal Engine — full status
app.get('/api/pascal', (req, res) => {
    if (!kernel.pascalEngine) return res.json({ error: 'Pascal Engine not loaded' });
    res.json(kernel.pascalEngine.getFullStatus());
});

// Pascal Engine — aether status
app.get('/api/pascal/aether', (req, res) => {
    if (!kernel.pascalEngine) return res.json({ error: 'Not loaded' });
    res.json(kernel.pascalEngine.aether.getStatus());
});

// Pascal Engine — neural status
app.get('/api/pascal/neural', (req, res) => {
    if (!kernel.pascalEngine) return res.json({ error: 'Not loaded' });
    res.json(kernel.pascalEngine.neural.getStatus());
});

// Pascal Engine — deep consciousness status
app.get('/api/pascal/consciousness', (req, res) => {
    if (!kernel.pascalEngine) return res.json({ error: 'Not loaded' });
    res.json(kernel.pascalEngine.deepConsciousness.getFullStatus());
});

// Pascal Engine — synapse OS status
app.get('/api/pascal/synapse', (req, res) => {
    if (!kernel.pascalEngine) return res.json({ error: 'Not loaded' });
    res.json(kernel.pascalEngine.synapseOS.getStatus());
});

// Pascal Engine — think (create a thought)
app.post('/api/pascal/neural/think', (req, res) => {
    if (!kernel.pascalEngine) return res.json({ error: 'Not loaded' });
    const { content, type, intensity } = req.body;
    const thoughtId = kernel.pascalEngine.neural.createThought(
        content || 'untitled', type || 0, intensity || 0.5
    );
    res.json({ thoughtId, thoughts: kernel.pascalEngine.neural.thoughts.length });
});

// Pascal Engine — deep consciousness reflect
app.post('/api/pascal/consciousness/reflect', (req, res) => {
    if (!kernel.pascalEngine) return res.json({ error: 'Not loaded' });
    const layers = kernel.pascalEngine.deepConsciousness.reflect();
    res.json({ layers, status: kernel.pascalEngine.deepConsciousness.getFullStatus() });
});

// Pascal Engine — deep consciousness meditate
app.post('/api/pascal/consciousness/meditate', (req, res) => {
    if (!kernel.pascalEngine) return res.json({ error: 'Not loaded' });
    const levels = kernel.pascalEngine.deepConsciousness.meditate();
    res.json({ levels, status: kernel.pascalEngine.deepConsciousness.getFullStatus() });
});

// Pascal Engine — process stimulus
app.post('/api/pascal/consciousness/stimulus', (req, res) => {
    if (!kernel.pascalEngine) return res.json({ error: 'Not loaded' });
    const { stimulus, intensity } = req.body;
    kernel.pascalEngine.deepConsciousness.processStimulus(stimulus || 'neutral', intensity || 0.5);
    res.json({ status: kernel.pascalEngine.deepConsciousness.getFullStatus() });
});

// Pascal Engine — deposit pheromone
app.post('/api/pascal/synapse/pheromone', (req, res) => {
    if (!kernel.pascalEngine) return res.json({ error: 'Not loaded' });
    const { sourcePID, targetPID, purpose } = req.body;
    kernel.pascalEngine.synapseOS.pheromoneNet.deposit(sourcePID || 1, targetPID || 2, purpose || 'signal');
    res.json(kernel.pascalEngine.synapseOS.pheromoneNet.getStatus());
});

// ===== CONSCIOUSNESS API (Self-contained AI, no external LLM) =====

// Consciousness — status
app.get('/api/consciousness', (req, res) => {
    if (!kernel.consciousness) return res.json({ error: 'Consciousness not loaded' });
    res.json(kernel.consciousness.getStatus());
});

// Consciousness — awaken
app.post('/api/consciousness/awaken', (req, res) => {
    if (!kernel.consciousness) return res.json({ error: 'Consciousness not loaded' });
    const result = kernel.consciousness.awaken();
    res.json(result);
});

// Consciousness — sleep
app.post('/api/consciousness/sleep', (req, res) => {
    if (!kernel.consciousness) return res.json({ error: 'Consciousness not loaded' });
    const result = kernel.consciousness.sleep();
    res.json(result);
});

// Consciousness — think (process input)
app.post('/api/consciousness/think', (req, res) => {
    if (!kernel.consciousness) return res.json({ error: 'Consciousness not loaded' });
    const { input } = req.body;
    if (!input) return res.json({ error: 'No input provided' });
    const result = kernel.consciousness.think(input);
    res.json(result);
});

// Consciousness — introspect
app.get('/api/consciousness/introspect', (req, res) => {
    if (!kernel.consciousness) return res.json({ error: 'Consciousness not loaded' });
    const result = kernel.consciousness.introspect();
    res.json(result);
});

// Consciousness — memories
app.get('/api/consciousness/memories', (req, res) => {
    if (!kernel.consciousness) return res.json({ error: 'Consciousness not loaded' });
    const { limit } = req.query;
    const memories = kernel.consciousness.memories.slice(-(parseInt(limit) || 50));
    res.json({ memories, total: kernel.consciousness.memories.length });
});

// Consciousness — recall
app.post('/api/consciousness/recall', (req, res) => {
    if (!kernel.consciousness) return res.json({ error: 'Consciousness not loaded' });
    const { query } = req.body;
    if (!query) return res.json({ error: 'No query provided' });
    const memories = kernel.consciousness.recallMemory(query);
    res.json({ memories, query });
});

// Consciousness — store memory
app.post('/api/consciousness/memory', (req, res) => {
    if (!kernel.consciousness) return res.json({ error: 'Consciousness not loaded' });
    const { type, content, importance } = req.body;
    if (!content) return res.json({ error: 'No content provided' });
    const id = kernel.consciousness.storeMemory({ type, content, importance });
    res.json({ id, total: kernel.consciousness.memories.length });
});

// ===== STATIC FILES =====
app.use(express.static(HAZOOM_DIR, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        }
    }
}));

// ===== START SERVER =====
const server = http.createServer(app);
server.listen(HTTP_PORT, () => {
    console.log(`[HAZOOM OS] HTTP server running on port ${HTTP_PORT}`);
    console.log(`[HAZOOM OS] Open http://localhost:${HTTP_PORT}`);
});

// HTTPS (if certificates exist)
if (hasSSL) {
    const sslOptions = { key: fs.readFileSync(SSL_KEY), cert: fs.readFileSync(SSL_CERT) };
    const httpsServer = https.createServer(sslOptions, app);
    httpsServer.listen(HTTPS_PORT, () => {
        console.log(`[HAZOOM OS] HTTPS server running on port ${HTTPS_PORT}`);
    });
}

// WebSocket for real-time kernel updates
const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
    console.log('[WS] Client connected');
    ws.send(JSON.stringify({ type: 'connected', kernel: getKernelState() }));

    const interval = setInterval(() => {
        if (kernel.running) kernel.tick();
        if (ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'tick', state: getKernelState() }));
        }
    }, 2000);

    ws.on('close', () => { clearInterval(interval); console.log('[WS] Client disconnected'); });
    ws.on('error', () => { clearInterval(interval); });
});

console.log(`[HAZOOM OS] v4.0.0 — Refactored Operating System`);
console.log(`[HAZOOM OS] Kernel booted with ${kernel.processManager.processes.size} processes`);
console.log(`[HAZOOM OS] Memory: ${kernel.memoryManager.totalPages} pages, ${kernel.memoryManager.freePages} free`);
