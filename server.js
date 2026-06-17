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

// ===== KERNEL STATE (in-memory OS) =====
// We load the kernel from the JS file and run it server-side
const kernelState = {
    running: false,
    bootTime: null,
    uptime: 0,
    tickCount: 0,
    logBuffer: [],
    maxLogLines: 500,

    // Process table
    processes: new Map(),
    pidCounter: 1,
    readyQueue: [],
    blockedQueue: [],
    currentProcess: null,
    maxProcesses: 1024,
    timeQuantum: 100,

    // Memory
    totalMemory: 16 * 1024 * 1024 * 1024,
    pageSize: 4096,
    totalPages: Math.floor(16 * 1024 * 1024 * 1024 / 4096),
    freePages: 0,
    usedPages: 0,
    pageTable: new Map(),
    frameTable: [],
    swapUsed: 0,
    swapTotal: 4 * 1024 * 1024 * 1024,
    pageFaults: 0,

    // File system (simplified server-side)
    fsCurrentPath: '/home/hazem',
    fsTree: null,

    // Devices
    devices: {},

    // Security
    currentUser: { username: 'hazem', uid: 1000, gid: 1000, role: 'user' },
    sessionActive: true
};

// Initialize memory frames
kernelState.frameTable = new Array(kernelState.totalPages).fill(null);
const kernelFrames = Math.floor((512 * 1024 * 1024) / kernelState.pageSize);
for (let i = 0; i < kernelFrames; i++) kernelState.frameTable[i] = 0;
kernelState.freePages = kernelState.totalPages - kernelFrames;
kernelState.usedPages = kernelFrames;

// ===== KERNEL FUNCTIONS =====
function kernelLog(level, message) {
    const entry = { timestamp: new Date().toISOString(), level, message, tick: kernelState.tickCount };
    kernelState.logBuffer.push(entry);
    if (kernelState.logBuffer.length > kernelState.maxLogLines) kernelState.logBuffer.shift();
    return entry;
}

function createProcess(name, priority = 5, parentPid = 1) {
    if (kernelState.processes.size >= kernelState.maxProcesses) return { error: 'Max process limit' };
    const pid = kernelState.pidCounter++;
    kernelState.processes.set(pid, {
        pid, ppid: parentPid, name, state: 'READY',
        priority, cpuTime: 0, memoryUsed: 0, openFiles: [],
        creationTime: Date.now(), exitCode: null
    });
    kernelState.readyQueue.push(pid);
    kernelLog('PROC', `Created process "${name}" (PID: ${pid})`);
    return { pid, name, state: 'READY' };
}

function terminateProcess(pid) {
    const proc = kernelState.processes.get(pid);
    if (!proc) return { error: `Process ${pid} not found` };
    proc.state = 'TERMINATED';
    proc.exitCode = 0;
    kernelState.readyQueue = kernelState.readyQueue.filter(p => p !== pid);
    kernelState.blockedQueue = kernelState.blockedQueue.filter(p => p !== pid);
    kernelLog('PROC', `Terminated process "${proc.name}" (PID: ${pid})`);
    return { pid, exitCode: 0 };
}

function scheduleProcess() {
    if (kernelState.readyQueue.length === 0) return null;
    const nextPid = kernelState.readyQueue.shift();
    const proc = kernelState.processes.get(nextPid);
    if (!proc || proc.state === 'TERMINATED') return scheduleProcess();
    if (kernelState.currentProcess && kernelState.currentProcess.state === 'RUNNING') {
        kernelState.currentProcess.state = 'READY';
        kernelState.readyQueue.push(kernelState.currentProcess.pid);
    }
    proc.state = 'RUNNING';
    kernelState.currentProcess = proc;
    return proc;
}

function kernelTick() {
    kernelState.tickCount++;
    kernelState.uptime = kernelState.bootTime ? Date.now() - kernelState.bootTime : 0;
    if (!kernelState.currentProcess) scheduleProcess();
    if (kernelState.currentProcess) {
        kernelState.currentProcess.cpuTime += kernelState.timeQuantum;
        if (kernelState.currentProcess.cpuTime % (kernelState.timeQuantum * 10) < kernelState.timeQuantum) {
            kernelState.currentProcess.state = 'READY';
            kernelState.readyQueue.push(kernelState.currentProcess.pid);
            kernelState.currentProcess = null;
            scheduleProcess();
        }
    }
    return { tick: kernelState.tickCount, uptime: kernelState.uptime };
}

function bootKernel() {
    kernelState.logBuffer = [];
    kernelState.processes.clear();
    kernelState.pidCounter = 1;
    kernelState.readyQueue = [];
    kernelState.blockedQueue = [];
    kernelState.currentProcess = null;

    kernelLog('BOOT', 'HAZOOM OS v4.0.0 — Refactored Operating System');
    kernelLog('BOOT', '[POST] Power-On Self-Test...');
    kernelLog('BOOT', '[POST] CPU: Virtual Multi-Core Processor — OK');
    kernelLog('BOOT', `[POST] Memory: ${(kernelState.totalMemory / (1024**3)).toFixed(0)} GB — OK`);
    kernelLog('BOOT', '[POST] Storage: Virtual Block Device — OK');
    kernelLog('BOOT', '[POST] Network: Virtual NIC — OK');
    kernelLog('BOOT', '[BOOTLOADER] Loading kernel...');
    kernelLog('BOOT', '[KERNEL] Initializing subsystems...');
    kernelLog('BOOT', `[KERNEL] Memory: ${kernelState.totalPages} pages × ${kernelState.pageSize}B`);
    kernelLog('BOOT', '[KERNEL] Process table initialized (max 1024)');
    kernelLog('BOOT', '[KERNEL] File system: hazoomfs (journaled)');
    kernelLog('BOOT', '[KERNEL] Security: Ring 0/3 isolation active');

    // Create init
    const init = createProcess('init', 0);
    createProcess('kthreadd', 1, init.pid);
    createProcess('syslogd', 3, init.pid);
    createProcess('sshd', 5, init.pid);
    createProcess('hazoom-sh', 5, init.pid);
    createProcess('aether-engine', 5, init.pid);
    createProcess('neural-core', 5, init.pid);

    kernelState.bootTime = Date.now();
    kernelState.running = true;
    kernelLog('BOOT', '═══════════════════════════════════════');
    kernelLog('BOOT', 'HAZOOM OS v4.0.0 is ONLINE');
    kernelLog('BOOT', '═══════════════════════════════════════');

    return { status: 'online', bootTime: kernelState.bootTime };
}

function shutdownKernel() {
    kernelLog('SHUTDOWN', 'Initiating system shutdown...');
    for (const [pid, proc] of kernelState.processes) {
        proc.state = 'TERMINATED';
        proc.exitCode = 0;
    }
    kernelState.processes.clear();
    kernelState.readyQueue = [];
    kernelState.currentProcess = null;
    kernelState.running = false;
    kernelLog('SHUTDOWN', 'System halted');
    return { status: 'shutdown' };
}

function getKernelState() {
    const procs = [];
    for (const [, p] of kernelState.processes) {
        if (p.state !== 'TERMINATED') {
            procs.push({ pid: p.pid, ppid: p.ppid, name: p.name, state: p.state, priority: p.priority, cpuTime: p.cpuTime });
        }
    }
    return {
        version: '4.0.0',
        name: 'HAZOOM OS',
        running: kernelState.running,
        bootTime: kernelState.bootTime,
        uptime: kernelState.uptime,
        tickCount: kernelState.tickCount,
        currentUser: kernelState.currentUser,
        processCount: procs.length,
        processes: procs.sort((a, b) => a.pid - b.pid),
        currentPid: kernelState.currentProcess?.pid || null,
        readyQueue: kernelState.readyQueue.length,
        blockedQueue: kernelState.blockedQueue.length,
        memory: {
            total: kernelState.totalMemory,
            used: kernelState.usedPages * kernelState.pageSize,
            free: kernelState.freePages * kernelState.pageSize,
            pageSize: kernelState.pageSize,
            totalPages: kernelState.totalPages,
            usedPages: kernelState.usedPages,
            freePages: kernelState.freePages,
            pageFaults: kernelState.pageFaults,
            usagePercent: ((kernelState.usedPages / kernelState.totalPages) * 100).toFixed(2)
        },
        logLines: kernelState.logBuffer.length
    };
}

// Boot on server start
bootKernel();

// ===== API ROUTES =====

// System status
app.get('/api/status', (req, res) => {
    res.json(getKernelState());
});

// Boot
app.post('/api/boot', (req, res) => {
    const result = bootKernel();
    res.json(result);
});

// Shutdown
app.post('/api/shutdown', (req, res) => {
    const result = shutdownKernel();
    res.json(result);
});

// Tick (advance scheduler)
app.post('/api/tick', (req, res) => {
    const count = Math.min(parseInt(req.query.count) || 1, 100);
    const results = [];
    for (let i = 0; i < count; i++) results.push(kernelTick());
    res.json({ ticks: results.length, last: results[results.length - 1] });
});

// Process management
app.get('/api/processes', (req, res) => {
    const state = getKernelState();
    res.json({ processes: state.processes, stats: { total: state.processCount, ready: state.readyQueue, blocked: state.blockedQueue } });
});

app.post('/api/processes/create', (req, res) => {
    const { name, priority, parentPid } = req.body;
    res.json(createProcess(name || 'unknown', priority || 5, parentPid || 1));
});

app.post('/api/processes/:pid/terminate', (req, res) => {
    res.json(terminateProcess(parseInt(req.params.pid)));
});

app.post('/api/processes/:pid/block', (req, res) => {
    const proc = kernelState.processes.get(parseInt(req.params.pid));
    if (!proc) return res.json({ error: 'Not found' });
    proc.state = 'WAITING';
    kernelState.readyQueue = kernelState.readyQueue.filter(p => p !== proc.pid);
    if (!kernelState.blockedQueue.includes(proc.pid)) kernelState.blockedQueue.push(proc.pid);
    res.json({ pid: proc.pid, state: 'WAITING' });
});

app.post('/api/processes/:pid/unblock', (req, res) => {
    const proc = kernelState.processes.get(parseInt(req.params.pid));
    if (!proc) return res.json({ error: 'Not found' });
    proc.state = 'READY';
    kernelState.blockedQueue = kernelState.blockedQueue.filter(p => p !== proc.pid);
    if (!kernelState.readyQueue.includes(proc.pid)) kernelState.readyQueue.push(proc.pid);
    res.json({ pid: proc.pid, state: 'READY' });
});

// Memory
app.get('/api/memory', (req, res) => {
    res.json(getKernelState().memory);
});

app.post('/api/memory/allocate', (req, res) => {
    const { size, pid } = req.body;
    const pagesNeeded = Math.ceil((size || 4096) / kernelState.pageSize);
    if (pagesNeeded > kernelState.freePages) return res.json({ error: 'Out of memory' });
    const frames = [];
    for (let i = 0; i < kernelState.frameTable.length && frames.length < pagesNeeded; i++) {
        if (kernelState.frameTable[i] === null) {
            kernelState.frameTable[i] = pid || 1;
            frames.push(i);
        }
    }
    kernelState.freePages -= frames.length;
    kernelState.usedPages += frames.length;
    res.json({ frames: frames.length, bytes: frames.length * kernelState.pageSize });
});

// File system
app.get('/api/fs/list', (req, res) => {
    const targetPath = req.query.path || kernelState.fsCurrentPath;
    // Return a simulated directory listing
    const standardDirs = {
        '/': ['bin', 'boot', 'dev', 'etc', 'home', 'lib', 'media', 'mnt', 'opt', 'proc', 'root', 'run', 'sbin', 'srv', 'sys', 'tmp', 'usr', 'var'],
        '/home': ['hazem'],
        '/home/hazem': ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Music', 'Videos', 'Projects', 'README.md', '.bashrc'],
        '/home/hazem/Projects': ['hazoom-os', 'mario-gta6', 'portfolio'],
        '/etc': ['os-release', 'hostname', 'passwd', 'shadow', 'fstab'],
        '/var': ['log', 'tmp', 'cache'],
        '/var/log': ['syslog', 'auth.log', 'kern.log'],
        '/usr': ['bin', 'lib', 'local', 'share'],
        '/bin': ['bash', 'ls', 'cat', 'echo', 'mkdir', 'rm', 'cp', 'mv', 'ps', 'kill', 'chmod', 'chown']
    };
    const entries = standardDirs[targetPath] || [];
    res.json({ path: targetPath, entries });
});

app.get('/api/fs/read', (req, res) => {
    const filePath = req.query.path || '';
    const files = {
        '/etc/os-release': 'NAME="HAZOOM OS"\nVERSION="4.0.0"\nID=hazoom\nPRETTY_NAME="HAZOOM Operating System 4.0.0"\n',
        '/etc/hostname': 'hazoom-os\n',
        '/etc/passwd': 'root:x:0:0:root:/root:/bin/bash\nhazem:x:1000:1000:Hazem Soussi:/home/hazem:/bin/bash\n',
        '/home/hazem/README.md': '# HAZOOM OS v4.0\n\nBrowser-based operating system with AI at its core.\n\nCopyright © 2024-2026 Hazem Soussi. All Rights Reserved.\n',
        '/home/hazem/.bashrc': '# HAZOOM Shell Configuration\nexport PS1="\\u@\\h:\\w$ "\nexport PATH="/usr/local/bin:/usr/bin:/bin"\nalias ll="ls -la"\n',
        '/var/log/syslog': kernelState.logBuffer.slice(-20).map(l => `[${l.timestamp}] ${l.level}: ${l.message}`).join('\n') + '\n'
    };
    if (files[filePath]) {
        res.json({ path: filePath, content: files[filePath], size: files[filePath].length });
    } else {
        res.json({ error: 'File not found or not readable', path: filePath });
    }
});

app.post('/api/fs/write', (req, res) => {
    const { path: filePath, content } = req.body;
    if (!filePath) return res.json({ error: 'Path required' });
    kernelLog('FS', `Write: ${filePath} (${(content || '').length} bytes)`);
    res.json({ path: filePath, written: true, size: (content || '').length });
});

app.post('/api/fs/mkdir', (req, res) => {
    const { path: dirPath } = req.body;
    if (!dirPath) return res.json({ error: 'Path required' });
    kernelLog('FS', `Mkdir: ${dirPath}`);
    res.json({ path: dirPath, created: true });
});

app.post('/api/fs/delete', (req, res) => {
    const { path: targetPath } = req.body;
    if (!targetPath) return res.json({ error: 'Path required' });
    kernelLog('FS', `Delete: ${targetPath}`);
    res.json({ path: targetPath, deleted: true });
});

// Kernel log
app.get('/api/log', (req, res) => {
    const lines = parseInt(req.query.lines) || 50;
    const level = req.query.level;
    let logs = kernelState.logBuffer;
    if (level) logs = logs.filter(l => l.level === level);
    res.json({ lines: logs.slice(-lines), total: kernelState.logBuffer.length });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: kernelState.running ? 'online' : 'offline',
        version: '4.0.0',
        uptime: kernelState.uptime,
        processes: kernelState.processes.size,
        memoryUsage: ((kernelState.usedPages / kernelState.totalPages) * 100).toFixed(2) + '%'
    });
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
        if (kernelState.running) kernelTick();
        if (ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'tick', state: getKernelState() }));
        }
    }, 2000);

    ws.on('close', () => { clearInterval(interval); console.log('[WS] Client disconnected'); });
    ws.on('error', () => { clearInterval(interval); });
});

console.log(`[HAZOOM OS] v4.0.0 — Refactored Operating System`);
console.log(`[HAZOOM OS] Kernel booted with ${kernelState.processes.size} processes`);
console.log(`[HAZOOM OS] Memory: ${kernelState.totalPages} pages, ${kernelState.freePages} free`);
