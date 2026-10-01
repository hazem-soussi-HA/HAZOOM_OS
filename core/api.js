'use strict';

const express = require('express');
const crypto = require('crypto');
const { AuthManager } = require('./auth');

class APIRouter {
    constructor(kernel, config = {}) {
        this.kernel = kernel;
        this.router = express.Router();
        this.logger = config.logger || console;
        this.auth = config.authManager || new AuthManager(kernel);
        this._registerRoutes();
    }

    /** Send a structured error response */
    _error(res, status, message, code) {
        return res.status(status).json({
            error: message,
            code: code || 'ERROR',
            timestamp: new Date().toISOString()
        });
    }

    /** Validate that required fields exist in req.body */
    _requireFields(body, fields) {
        const missing = fields.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
        if (missing.length > 0) {
            return { valid: false, missing };
        }
        return { valid: true };
    }

    /** Extract pagination params from query */
    _paginate(query) {
        const offset = Math.max(0, parseInt(query.offset) || 0);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
        return { offset, limit };
    }

    /** Apply pagination to an array */
    _applyPagination(arr, offset, limit) {
        return {
            items: arr.slice(offset, offset + limit),
            total: arr.length,
            offset,
            limit,
            hasMore: offset + limit < arr.length
        };
    }

    /** Helper: get full kernel state for API responses */
    getKernelState() {
        const k = this.kernel;
        const pm = k.processManager;
        const mm = k.memoryManager;
        const sm = k.security;

        const state = {
            version: k.version,
            name: k.name,
            running: k.running,
            bootTime: k.bootTime,
            uptime: k.uptime,
            tickCount: k.tickCount,
            currentUser: sm.users?.get('hazem') || { username: 'hazem', uid: 1000, role: 'user' },
            processCount: pm.getProcessList().length,
            processes: pm.getProcessList(),
            currentPid: pm.currentProcess?.pid || null,
            readyQueue: pm.readyQueue.length,
            blockedQueue: pm.blockedQueue.length,
            memory: mm.getStats(),
            logLines: k.logBuffer?.length || 0
        };

        if (k.pascalEngine) state.pascalEngine = k.pascalEngine.getFullStatus();
        if (k.consciousness) state.consciousness = k.consciousness.getStatus();
        if (k.qLearner) state.qLearning = k.qLearner.getStatus();
        if (k.serviceManager) state.services = {
            stats: k.serviceManager.getStats(),
            list: k.serviceManager.list(),
        };
        if (k.intelligence) state.intelligence = k.intelligence.getStatus();

        return state;
    }

    _registerRoutes() {
        const r = this.router;
        const k = this.kernel;
        const $ = this.auth;
        const protect = $.authenticate.bind($);
        const adminOnly = [protect, $.requireRole('admin').bind($)];
        const registrationEnabled = process.env.NODE_ENV !== 'production' || process.env.ALLOW_REGISTRATION === 'true';
        const asyncHandler = handler => (req, res, next) => {
            Promise.resolve(handler(req, res, next)).catch(next);
        };

        // Service availability feeds the learner's threat signal. Probed on a
        // slow timer because _getOSState is synchronous and runs every tick.
        this._serviceUp = new Map();
        this._serviceProbe = setInterval(() => this._refreshServiceAvailability(), 15000);
        if (this._serviceProbe.unref) this._serviceProbe.unref();
        this._refreshServiceAvailability();

        // ── AUTH (unauthenticated) ────────────────────────────

        r.post('/api/v1/auth/register', (req, res) => {
            if (!registrationEnabled) return this._error(res, 403, 'Public registration is disabled', 'REGISTRATION_DISABLED');
            const { username, password } = req.body;
            const validation = this._requireFields(req.body, ['username', 'password']);
            if (!validation.valid) {
                return this._error(res, 400, `Missing fields: ${validation.missing.join(', ')}`, 'VALIDATION');
            }
            const result = $.register(username, password, 'user');
            if (result.error) return this._error(res, 409, result.error, 'CONFLICT');
            res.status(201).json(result);
        });

        r.post('/api/v1/auth/login', (req, res) => {
            const { username, password } = req.body;
            const validation = this._requireFields(req.body, ['username', 'password']);
            if (!validation.valid) {
                return this._error(res, 400, `Missing fields: ${validation.missing.join(', ')}`, 'VALIDATION');
            }
            const result = $.login(username, password);
            if (result.error) return this._error(res, 401, result.error, 'AUTH_FAILED');
            res.json(result);
        });

        r.post('/api/v1/auth/logout', protect, (req, res) => {
            const auth = req.headers.authorization;
            const token = auth.slice(7);
            res.json($.logout(token));
        });

        r.post('/api/v1/auth/refresh', (req, res) => {
            const { refreshToken } = req.body;
            if (!refreshToken) return this._error(res, 400, 'Refresh token required', 'VALIDATION');
            const result = $.refreshToken(refreshToken);
            if (result.error) return this._error(res, 401, result.error, 'REFRESH_FAILED');
            res.json(result);
        });

        r.get('/api/v1/auth/me', protect, (req, res) => {
            res.json({ user: req.user });
        });

        // Legacy non-versioned auth routes
        r.post('/api/auth/register', (req, res) => {
            if (!registrationEnabled) return res.status(403).json({ error: 'Public registration is disabled', code: 'REGISTRATION_DISABLED' });
            const { username, password } = req.body;
            const validation = this._requireFields(req.body, ['username', 'password']);
            if (!validation.valid) {
                return res.status(400).json({ error: `Missing fields: ${validation.missing.join(', ')}` });
            }
            const result = $.register(username, password, 'user');
            if (result.error) return res.status(409).json({ error: result.error });
            res.status(201).json(result);
        });

        r.post('/api/auth/login', (req, res) => {
            const { username, password } = req.body;
            const validation = this._requireFields(req.body, ['username', 'password']);
            if (!validation.valid) {
                return res.status(400).json({ error: `Missing fields: ${validation.missing.join(', ')}` });
            }
            const result = $.login(username, password);
            if (result.error) return res.status(401).json({ error: result.error });
            res.json(result);
        });

        r.post('/api/auth/logout', protect, (req, res) => {
            const auth = req.headers.authorization;
            res.json($.logout(auth.slice(7)));
        });

        r.post('/api/auth/refresh', (req, res) => {
            const { refreshToken } = req.body;
            if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
            const result = $.refreshToken(refreshToken);
            if (result.error) return res.status(401).json({ error: result.error });
            res.json(result);
        });

        r.get('/api/auth/me', protect, (req, res) => {
            res.json({ user: req.user });
        });

        // ── SYSTEM (mixed auth) ───────────────────────────────

        r.get('/api/status', (req, res) => {
            res.json(this.getKernelState());
        });

        r.get('/api/v1/status', (req, res) => {
            res.json(this.getKernelState());
        });

        r.post('/api/boot', adminOnly, (req, res) => {
            if (k.running) return this._error(res, 409, 'Kernel is already running', 'ALREADY_RUNNING');
            res.json(k.boot());
        });

        r.post('/api/shutdown', adminOnly, (req, res) => {
            res.json(k.shutdown());
        });

        r.post('/api/tick', adminOnly, (req, res) => {
            const count = Math.min(parseInt(req.query.count) || 1, 100);
            const results = [];
            for (let i = 0; i < count; i++) results.push(k.tick());
            res.json({ ticks: results.length, last: results[results.length - 1] });
        });

        r.get('/api/log', adminOnly, (req, res) => {
            const lines = parseInt(req.query.lines) || 50;
            const level = req.query.level;
            let logs = k.logBuffer || [];
            if (level) logs = logs.filter(l => l.level === level);
            res.json({ lines: logs.slice(-lines), total: (k.logBuffer || []).length });
        });

        // ── NEW KERNEL FEATURES (v6) ─────────────────────────

        r.get('/api/v1/system/advanced-stats', protect, (req, res) => {
            if (typeof k.getAdvancedStats === 'function') return res.json(k.getAdvancedStats());
            res.json({ error: 'Method not available' });
        });

        r.get('/api/system/advanced-stats', protect, (req, res) => {
            if (typeof k.getAdvancedStats === 'function') return res.json(k.getAdvancedStats());
            res.json({ error: 'Method not available' });
        });

        r.get('/api/v1/system/process-tree', protect, (req, res) => {
            if (typeof k.getProcessTree === 'function') return res.json({ tree: k.getProcessTree() });
            res.json({ tree: k.processManager.getProcessList() });
        });

        r.get('/api/system/process-tree', protect, (req, res) => {
            if (typeof k.getProcessTree === 'function') return res.json({ tree: k.getProcessTree() });
            res.json({ tree: k.processManager.getProcessList() });
        });

        r.get('/api/v1/system/load-averages', protect, (req, res) => {
            if (typeof k.getLoadAverages === 'function') return res.json({ loadAverages: k.getLoadAverages() });
            res.json({ loadAverages: [0, 0, 0] });
        });

        r.get('/api/system/load-averages', protect, (req, res) => {
            if (typeof k.getLoadAverages === 'function') return res.json({ loadAverages: k.getLoadAverages() });
            res.json({ loadAverages: [0, 0, 0] });
        });

        r.get('/api/v1/processes/groups', protect, (req, res) => {
            res.json({ groups: Array.from(k.processManager.groups?.entries() || []) });
        });

        r.post('/api/v1/processes/ipc/send', adminOnly, (req, res) => {
            const { pid, message } = req.body;
            if (!pid || !message) return res.status(400).json({ error: 'pid and message required' });
            res.json(k.processManager.sendMessage(pid, message));
        });

        r.get('/api/v1/processes/ipc/receive', adminOnly, (req, res) => {
            const pid = parseInt(req.query.pid) || 0;
            if (!pid) return res.status(400).json({ error: 'pid required' });
            res.json({ messages: k.processManager.receiveMessage(pid) });
        });

        r.get('/health', (req, res) => {
            const mm = k.memoryManager;
            res.status(k.running ? 200 : 503).json({
                status: k.running ? 'online' : 'offline',
                version: k.version,
                uptime: k.uptime,
                processes: k.processManager.getProcessList().length,
                memoryUsage: mm.getStats().usagePercent + '%'
            });
        });

        // ── PROCESSES ─────────────────────────────────────

        r.get('/api/processes', protect, (req, res) => {
            const state = this.getKernelState();
            const { offset, limit } = this._paginate(req.query);
            const procs = state.processes;
            const paginated = this._applyPagination(procs, offset, limit);
            res.json({
                processes: paginated.items,
                stats: { total: state.processCount, ready: state.readyQueue, blocked: state.blockedQueue },
                pagination: { total: paginated.total, offset, limit, hasMore: paginated.hasMore }
            });
        });

        r.post('/api/processes/create', adminOnly, (req, res) => {
            const { name, priority, parentPid } = req.body;
            if (!name && !req.body.name) return this._error(res, 400, 'Process name required', 'VALIDATION');
            res.json(k.processManager.createProcess(name || 'unknown', priority || 5, parentPid || 0));
        });

        r.post('/api/processes/:pid/terminate', adminOnly, (req, res) => {
            const pid = parseInt(req.params.pid);
            if (isNaN(pid)) return this._error(res, 400, 'Invalid PID', 'VALIDATION');
            res.json(k.processManager.terminateProcess(pid));
        });

        r.post('/api/processes/:pid/block', adminOnly, (req, res) => {
            res.json(k.processManager.blockProcess(parseInt(req.params.pid)));
        });

        r.post('/api/processes/:pid/unblock', adminOnly, (req, res) => {
            res.json(k.processManager.unblockProcess(parseInt(req.params.pid)));
        });

        // ── MEMORY ────────────────────────────────────────

        r.get('/api/memory', protect, (req, res) => {
            res.json(k.memoryManager.getStats());
        });

        r.post('/api/memory/allocate', adminOnly, (req, res) => {
            const { size, pid } = req.body;
            if (!size && !req.body.size) return this._error(res, 400, 'Size required', 'VALIDATION');
            res.json(k.memoryManager.allocate(size || 4096, pid || 1));
        });

        // ── FILE SYSTEM ───────────────────────────────────

        r.get('/api/fs/list', protect, (req, res) => {
            const targetPath = req.query.path || k.fileSystem.currentPath;
            const result = k.fileSystem.listDir(targetPath);
            if (result.error) return res.json(result);
            const { offset, limit } = this._paginate(req.query);
            const paginated = this._applyPagination(result.entries, offset, limit);
            res.json({ path: result.path, entries: paginated.items, pagination: { total: paginated.total, offset, limit, hasMore: paginated.hasMore } });
        });

        r.get('/api/fs/read', protect, (req, res) => {
            const filePath = req.query.path || '';
            if (!filePath) return this._error(res, 400, 'Path required', 'VALIDATION');
            const result = k.fileSystem.readFile(filePath);
            if (result.error) return res.status(404).json({ error: result.error, path: filePath });
            res.json({ path: filePath, content: result.content, size: result.size });
        });

        r.post('/api/fs/write', adminOnly, (req, res) => {
            const { path: filePath, content } = req.body;
            if (!filePath) return this._error(res, 400, 'Path required', 'VALIDATION');
            res.json(k.fileSystem.writeFile(filePath, content || ''));
        });

        r.post('/api/fs/mkdir', adminOnly, (req, res) => {
            const { path: dirPath } = req.body;
            if (!dirPath) return this._error(res, 400, 'Path required', 'VALIDATION');
            res.json(k.fileSystem.mkdir(dirPath));
        });

        r.post('/api/fs/delete', adminOnly, (req, res) => {
            const { path: targetPath } = req.body;
            if (!targetPath) return this._error(res, 400, 'Path required', 'VALIDATION');
            res.json(k.fileSystem.delete(targetPath));
        });

        // ── PASCAL ENGINE ─────────────────────────────────

        r.get('/api/pascal', protect, (req, res) => {
            if (!k.pascalEngine) return this._error(res, 404, 'Pascal Engine not loaded', 'NOT_LOADED');
            res.json(k.pascalEngine.getFullStatus());
        });

        r.get('/api/pascal/aether', protect, (req, res) => {
            if (!k.pascalEngine) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            res.json(k.pascalEngine.aether.getStatus());
        });

        r.get('/api/pascal/neural', protect, (req, res) => {
            if (!k.pascalEngine) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            res.json(k.pascalEngine.neural.getStatus());
        });

        r.get('/api/pascal/consciousness', protect, (req, res) => {
            if (!k.pascalEngine) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            res.json(k.pascalEngine.deepConsciousness.getFullStatus());
        });

        r.get('/api/pascal/synapse', protect, (req, res) => {
            if (!k.pascalEngine) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            res.json(k.pascalEngine.synapseOS.getStatus());
        });

        r.post('/api/pascal/neural/think', protect, (req, res) => {
            if (!k.pascalEngine) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            const { content, type, intensity } = req.body;
            if (!content && !req.body.content) return this._error(res, 400, 'Content required', 'VALIDATION');
            const thoughtId = k.pascalEngine.neural.createThought(content || 'untitled', type || 0, intensity || 0.5);
            res.json({ thoughtId, thoughts: k.pascalEngine.neural.thoughts.length });
        });

        r.post('/api/pascal/consciousness/reflect', protect, (req, res) => {
            if (!k.pascalEngine) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            const layers = k.pascalEngine.deepConsciousness.reflect();
            res.json({ layers, status: k.pascalEngine.deepConsciousness.getFullStatus() });
        });

        r.post('/api/pascal/consciousness/meditate', protect, (req, res) => {
            if (!k.pascalEngine) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            const levels = k.pascalEngine.deepConsciousness.meditate();
            res.json({ levels, status: k.pascalEngine.deepConsciousness.getFullStatus() });
        });

        r.post('/api/pascal/consciousness/stimulus', protect, (req, res) => {
            if (!k.pascalEngine) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            const { stimulus, intensity } = req.body;
            k.pascalEngine.deepConsciousness.processStimulus(stimulus || 'neutral', intensity || 0.5);
            res.json({ status: k.pascalEngine.deepConsciousness.getFullStatus() });
        });

        r.post('/api/pascal/synapse/pheromone', protect, (req, res) => {
            if (!k.pascalEngine) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            const { sourcePID, targetPID, purpose } = req.body;
            k.pascalEngine.synapseOS.pheromoneNet.deposit(sourcePID || 1, targetPID || 2, purpose || 'signal');
            res.json(k.pascalEngine.synapseOS.pheromoneNet.getStatus());
        });

        // ── CONSCIOUSNESS ─────────────────────────────────

        r.get('/api/consciousness', protect, (req, res) => {
            if (!k.consciousness) return this._error(res, 404, 'Consciousness not loaded', 'NOT_LOADED');
            res.json(k.consciousness.getStatus());
        });

        r.post('/api/consciousness/awaken', protect, (req, res) => {
            if (!k.consciousness) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            res.json(k.consciousness.awaken());
        });

        r.post('/api/consciousness/sleep', protect, (req, res) => {
            if (!k.consciousness) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            res.json(k.consciousness.sleep());
        });

        r.post('/api/consciousness/think', protect, (req, res) => {
            if (!k.consciousness) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            const { input } = req.body;
            if (!input) return this._error(res, 400, 'No input provided', 'VALIDATION');
            res.json(k.consciousness.think(input));
        });

        r.get('/api/consciousness/introspect', protect, (req, res) => {
            if (!k.consciousness) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            res.json(k.consciousness.introspect());
        });

        r.get('/api/consciousness/memories', protect, (req, res) => {
            if (!k.consciousness) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            const { offset, limit } = this._paginate(req.query);
            const memories = k.consciousness.memories;
            const paginated = this._applyPagination(memories, offset, limit);
            res.json({ memories: paginated.items, total: memories.length, pagination: { total: paginated.total, offset, limit, hasMore: paginated.hasMore } });
        });

        r.post('/api/consciousness/recall', protect, (req, res) => {
            if (!k.consciousness) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            const { query } = req.body;
            if (!query) return this._error(res, 400, 'No query provided', 'VALIDATION');
            res.json({ memories: k.consciousness.recallMemory(query), query });
        });

        r.post('/api/consciousness/memory', protect, (req, res) => {
            if (!k.consciousness) return this._error(res, 404, 'Not loaded', 'NOT_LOADED');
            const { type, content, importance } = req.body;
            if (!content) return this._error(res, 400, 'No content provided', 'VALIDATION');
            const id = k.consciousness.storeMemory({ type, content, importance });
            res.json({ id, total: k.consciousness.memories.length });
        });

        // ── SERVICES ──────────────────────────────────────

        r.get('/api/services', protect, asyncHandler(async (req, res) => {
            if (!k.serviceManager) return this._error(res, 404, 'ServiceManager not loaded', 'NOT_LOADED');
            const list = k.serviceManager.list();
            const health = await k.serviceManager.health();
            res.json({ stats: k.serviceManager.getStats(), list, health });
        }));

        r.get('/api/services/constellation', asyncHandler(async (req, res, next) => {
            try {
            if (!k.serviceManager) return this._error(res, 404, 'ServiceManager not loaded', 'NOT_LOADED');
            const health = await k.serviceManager.health();
            const stars = health.map((s, i) => {
                const h = crypto.createHash('sha256').update(`hazoom-constellation:${s.name}`).digest();
                return {
                    name: s.name,
                    port: s.port,
                    url: s.url,
                    enabled: s.enabled,
                    up: s.up,
                    status: !s.enabled ? 'disabled' : (s.up ? 'online' : 'offline'),
                    // Stable pseudo-random position derived from service name
                    x: h[0] / 255,            // 0..1 horizontal
                    y: h[1] / 255,            // 0..1 vertical
                    magnitude: 1.6 + (h[2] / 255) * 1.4, // brightness 1.6..3.0
                    hue: h[3] / 255,          // 0..1 color phase
                    order: i
                };
            });
            // Links: connect each star to its nearest neighbor (constellation lines)
            const links = stars.map((a, i) => {
                let best = -1, bestD = Infinity;
                stars.forEach((b, j) => {
                    if (i === j) return;
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const d = dx * dx + dy * dy;
                    if (d < bestD) { bestD = d; best = j; }
                });
                return { from: i, to: best };
            });
            res.json({
                timestamp: Date.now(),
                stats: { total: stars.length, online: stars.filter(s => s.up).length },
                stars,
                links: links.filter(link => link.to >= 0 && link.from < link.to)
            });
            } catch (error) {
                next(error);
            }
        }));

        r.post('/api/services/start', adminOnly, asyncHandler(async (req, res) => {
            if (!k.serviceManager) return this._error(res, 404, 'ServiceManager not loaded', 'NOT_LOADED');
            res.json(await k.serviceManager.startAll());
        }));

        r.post('/api/services/stop', adminOnly, asyncHandler(async (req, res) => {
            if (!k.serviceManager) return this._error(res, 404, 'ServiceManager not loaded', 'NOT_LOADED');
            res.json(await k.serviceManager.stopAll());
        }));

        r.post('/api/services/restart', adminOnly, asyncHandler(async (req, res) => {
            if (!k.serviceManager) return this._error(res, 404, 'ServiceManager not loaded', 'NOT_LOADED');
            res.json(await k.serviceManager.restartAll());
        }));

        r.post('/api/services/:name/toggle', adminOnly, asyncHandler(async (req, res) => {
            if (!k.serviceManager) return this._error(res, 404, 'ServiceManager not loaded', 'NOT_LOADED');
            const enabled = req.body.enabled !== false;
            res.json(k.serviceManager.setEnabled(req.params.name, enabled));
        }));

        // ── Q-LEARNING ────────────────────────────────────

        r.get('/api/qlearner/status', protect, (req, res) => {
            if (!k.qLearner) return this._error(res, 404, 'Q-Learning not loaded', 'NOT_LOADED');
            res.json(k.qLearner.getStatus());
        });

        r.get('/api/qlearner/policy', protect, (req, res) => {
            if (!k.qLearner) return this._error(res, 404, 'Q-Learning not loaded', 'NOT_LOADED');
            const state = this._getOSState();
            res.json(k.qLearner.getPolicy(state));
        });

        r.get('/api/qlearner/history', protect, (req, res) => {
            if (!k.qLearner) return this._error(res, 404, 'Q-Learning not loaded', 'NOT_LOADED');
            const { offset, limit } = this._paginate(req.query);
            const history = k.qLearner.history;
            const paginated = this._applyPagination(history, offset, limit);
            res.json({ history: paginated.items, total: history.length, pagination: { total: paginated.total, offset, limit, hasMore: paginated.hasMore } });
        });

        r.post('/api/qlearner/config', adminOnly, (req, res) => {
            if (!k.qLearner) return this._error(res, 404, 'Q-Learning not loaded', 'NOT_LOADED');
            const { mode, tabular, dqn } = req.body;
            if (mode) k.qLearner.mode = mode;
            if (tabular) Object.assign(k.qLearner.tabular, tabular);
            if (dqn) Object.assign(k.qLearner.dqn, dqn);
            res.json(k.qLearner.getStatus());
        });

        r.post('/api/qlearner/reset', adminOnly, (req, res) => {
            if (!k.qLearner) return this._error(res, 404, 'Q-Learning not loaded', 'NOT_LOADED');
            k.qLearner.reset();
            res.json({ status: 'reset', qLearning: k.qLearner.getStatus() });
        });

        r.get('/api/qlearner/stats', protect, (req, res) => {
            if (!k.qLearner) return this._error(res, 404, 'Q-Learning not loaded', 'NOT_LOADED');
            const status = k.qLearner.getStatus();
            res.json({
                totalDecisions: status.totalDecisions,
                avgReward: status.avgReward,
                tabularStatesExplored: status.tabular.statesExplored,
                tabularEpsilon: status.tabular.epsilon,
                dqnStepCount: status.dqn.stepCount,
                dqnEpsilon: status.dqn.epsilon,
                dqnAvgLoss: status.dqn.avgLoss,
                replayBufferUtilization: status.dqn.replayBuffer?.utilization
            });
        });

        // ── SYSTEM METRICS ────────────────────────────────
        // Public: the desktop's system monitor polls this without auth.

        r.get('/api/system/metrics', (req, res) => {
            const state = this.getKernelState();
            res.json({
                timestamp: Date.now(),
                status: state.running ? 'online' : 'offline',
                running: state.running,
                scope: 'virtual-kernel',
                cpu: {
                    utilization: Math.min(100, (state.readyQueue / Math.max(1, k.processManager.maxProcesses)) * 100),
                    processCount: state.processCount,
                    readyQueue: state.readyQueue,
                    blockedQueue: state.blockedQueue
                },
                memory: state.memory,
                processes: state.processCount,
                uptime: state.uptime,
                qLearning: k.qLearner ? k.qLearner.getStatus() : null
            });
        });

        // ── INTELLIGENCE CORE ─────────────────────────────

        r.get('/api/intelligence/status', protect, (req, res) => {
            if (!k.intelligence) return this._error(res, 404, 'Intelligence Core not loaded', 'NOT_LOADED');
            res.json(k.intelligence.getStatus());
        });

        // ── VALUE BENCHMARK ────────────────────────────────
        // Live measurement of what exists and what actually runs. Recomputed
        // per request from the filesystem, git, the service ports and the
        // model registry — nothing is asserted from a hardcoded number, so it
        // is designed to disagree with a stale README.
        r.get('/api/benchmark', protect, asyncHandler(async (req, res) => {
            try {
                const benchmark = require('./benchmark.js');
                // getStatus() is the measured surface — `available`, `warm` and
                // `warmMs` live there, not on the instance. Reading the
                // instance directly made the core look offline when it was
                // serving. health() probes every port, so it is awaited rather
                // than assumed: a benchmark that guesses is worse than none.
                const intel = k.intelligence ? k.intelligence.getStatus() : null;
                const svc = k.serviceManager
                    ? { list: k.serviceManager.list(), health: await k.serviceManager.health() }
                    : { list: [], health: [] };
                res.json(benchmark.build(intel, svc));
            } catch (err) {
                this._error(res, 500, 'Benchmark failed: ' + err.message, 'BENCHMARK_ERROR');
            }
        }));

        r.get('/api/intelligence/health', protect, asyncHandler(async (req, res) => {
            if (!k.intelligence) return this._error(res, 404, 'Intelligence Core not loaded', 'NOT_LOADED');
            res.json(await k.intelligence.health());
        }));

        r.post('/api/intelligence/think', protect, asyncHandler(async (req, res) => {
            if (!k.intelligence) return this._error(res, 404, 'Intelligence Core not loaded', 'NOT_LOADED');
            const { input, model } = req.body || {};
            if (!input) return this._error(res, 400, 'No input provided', 'VALIDATION');
            res.json(await k.intelligence.think(input, { model }));
        }));

        r.post('/api/intelligence/stream', protect, asyncHandler(async (req, res) => {
            if (!k.intelligence) return this._error(res, 404, 'Intelligence Core not loaded', 'NOT_LOADED');
            const { input, model } = req.body || {};
            if (!input) return this._error(res, 400, 'No input provided', 'VALIDATION');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            const out = await k.intelligence.streamThink(input, (delta) => res.write(delta), { model });
            res.end();
        }));

        r.post('/api/intelligence/reset', protect, (req, res) => {
            if (!k.intelligence) return this._error(res, 404, 'Intelligence Core not loaded', 'NOT_LOADED');
            res.json(k.intelligence.reset());
        });

        // ── ADMIN ROUTES (require admin role) ─────────────

        r.get('/api/admin/auth/stats', adminOnly, (req, res) => {
            res.json($.getStats());
        });

        r.get('/api/admin/auth/users', adminOnly, (req, res) => {
            const { offset, limit } = this._paginate(req.query);
            const users = Array.from($.users.values()).map(u => ({
                username: u.username, role: u.role, uid: u.uid, createdAt: u.createdAt
            }));
            const paginated = this._applyPagination(users, offset, limit);
            res.json({ users: paginated.items, pagination: { total: paginated.total, offset, limit, hasMore: paginated.hasMore } });
        });

        r.delete('/api/admin/auth/users/:username', adminOnly, (req, res) => {
            const { username } = req.params;
            if (username === 'root') return this._error(res, 403, 'Cannot delete root', 'FORBIDDEN');
            if (!$.users.has(username)) return this._error(res, 404, 'User not found', 'NOT_FOUND');
            $.users.delete(username);
            res.json({ deleted: username });
        });

        r.get('/api/admin/system/state', adminOnly, (req, res) => {
            res.json(k.getSystemState());
        });

        r.get('/api/admin/system/log', adminOnly, (req, res) => {
            const { offset, limit } = this._paginate(req.query);
            const logs = k.logBuffer || [];
            const paginated = this._applyPagination(logs, offset, limit);
            res.json({ entries: paginated.items, pagination: { total: paginated.total, offset, limit, hasMore: paginated.hasMore } });
        });

        r.post('/api/admin/system/tick', adminOnly, (req, res) => {
            const count = Math.min(parseInt(req.query.count) || 1, 1000);
            const results = [];
            for (let i = 0; i < count; i++) results.push(k.tick());
            res.json({ ticks: results.length, last: results[results.length - 1] });
        });

        r.get('/api/admin/security', adminOnly, (req, res) => {
            res.json(k.security.getStats());
        });

        r.get('/api/admin/processes', adminOnly, (req, res) => {
            const { offset, limit } = this._paginate(req.query);
            const allProcs = Array.from(k.processManager.processes.values());
            const paginated = this._applyPagination(allProcs, offset, limit);
            res.json({ processes: paginated.items, pagination: { total: paginated.total, offset, limit, hasMore: paginated.hasMore } });
        });

        r.get('/api/admin/memory', adminOnly, (req, res) => {
            res.json({
                stats: k.memoryManager.getStats(),
                pageTable: Object.fromEntries(k.memoryManager.pageTable)
            });
        });

        // ── GITHUB BRIDGE ────────────────────────────────────
        // Real-time shell observation between GitHub and the OS.
        // POST webhook is HMAC-verified; reads are public (repo is public).

        r.post('/api/github/webhook', asyncHandler(async (req, res) => {
            const bridge = k.githubBridge;
            if (!bridge) return this._error(res, 404, 'GitHub bridge not loaded', 'NOT_LOADED');

            const eventType = req.headers['x-github-event'];
            if (!eventType) return this._error(res, 400, 'Missing X-GitHub-Event header', 'VALIDATION');

            if (!bridge.verifySignature(req.rawBody, req.headers['x-hub-signature-256'])) {
                return this._error(res, 401, 'Invalid webhook signature', 'FORBIDDEN');
            }

            const event = bridge.handleWebhook(eventType, req.body);
            if (event && event.type === 'push') {
                // GitOps control plane: executes ops/commands.json (gated).
                // Commit-status reporting inside only fires when a token exists.
                bridge.runOpsCommands(event).catch(() => {});
            }
            res.status(202).json({ ok: true, received: eventType, observed: !!event });
        }));

        r.get('/api/github/events', (req, res) => {
            const bridge = k.githubBridge;
            if (!bridge) return this._error(res, 404, 'GitHub bridge not loaded', 'NOT_LOADED');
            const { offset, limit } = this._paginate(req.query);
            res.json(bridge.getEvents(offset, limit));
        });

        r.get('/api/github/status', asyncHandler(async (req, res) => {
            const bridge = k.githubBridge;
            if (!bridge) return this._error(res, 404, 'GitHub bridge not loaded', 'NOT_LOADED');
            res.json(await bridge.getStatus());
        }));

        r.post('/api/github/sync', adminOnly, asyncHandler(async (req, res) => {
            const bridge = k.githubBridge;
            if (!bridge) return this._error(res, 404, 'GitHub bridge not loaded', 'NOT_LOADED');
            res.json(await bridge.sync());
        }));

        r.get('/api/github/stats', (req, res) => {
            const bridge = k.githubBridge;
            if (!bridge) return this._error(res, 404, 'GitHub bridge not loaded', 'NOT_LOADED');
            res.json(bridge.getStats());
        });

        // ── SHELL OBSERVATION (gated allowlist) ───────────────
        // Read-only + safe git ops only. See core/shell.js.

        r.post('/api/shell/exec', adminOnly, asyncHandler(async (req, res) => {
            const shell = k.shellExecutor;
            if (!shell) return this._error(res, 404, 'Shell executor not loaded', 'NOT_LOADED');
            const { command } = req.body || {};
            if (!command || typeof command !== 'string') {
                return this._error(res, 400, 'No command provided', 'VALIDATION');
            }
            res.json(await shell.execute(command));
        }));

        r.get('/api/shell/log', adminOnly, (req, res) => {
            const shell = k.shellExecutor;
            if (!shell) return this._error(res, 404, 'Shell executor not loaded', 'NOT_LOADED');
            const { offset, limit } = this._paginate(req.query);
            res.json(shell.getLog(offset, limit));
        });

        r.get('/api/shell/stats', adminOnly, (req, res) => {
            const shell = k.shellExecutor;
            if (!shell) return this._error(res, 404, 'Shell executor not loaded', 'NOT_LOADED');
            res.json(shell.getStats());
        });

        // ── VERSIONED API ENDPOINTS (mirrors of key endpoints) ──

        r.get('/api/v1/system/metrics', protect, (req, res) => {
            const state = this.getKernelState();
            res.json({
                timestamp: Date.now(),
                status: state.running ? 'online' : 'offline',
                running: state.running,
                scope: 'virtual-kernel',
                cpu: {
                    utilization: Math.min(100, (state.readyQueue / Math.max(1, k.processManager.maxProcesses)) * 100),
                    processCount: state.processCount,
                    readyQueue: state.readyQueue,
                    blockedQueue: state.blockedQueue
                },
                memory: state.memory,
                processes: state.processCount,
                uptime: state.uptime,
                qLearning: k.qLearner ? k.qLearner.getStatus() : null
            });
        });

        r.get('/api/v1/processes', protect, (req, res) => {
            const state = this.getKernelState();
            const { offset, limit } = this._paginate(req.query);
            const procs = state.processes;
            const paginated = this._applyPagination(procs, offset, limit);
            res.json({
                processes: paginated.items,
                stats: { total: state.processCount, ready: state.readyQueue, blocked: state.blockedQueue },
                pagination: { total: paginated.total, offset, limit, hasMore: paginated.hasMore }
            });
        });

        r.get('/api/v1/memory', protect, (req, res) => {
            res.json(k.memoryManager.getStats());
        });

        r.get('/api/v1/fs/list', protect, (req, res) => {
            const targetPath = req.query.path || k.fileSystem.currentPath;
            const result = k.fileSystem.listDir(targetPath);
            if (result.error) return res.json(result);
            const { offset, limit } = this._paginate(req.query);
            const paginated = this._applyPagination(result.entries, offset, limit);
            res.json({ path: result.path, entries: paginated.items, pagination: { total: paginated.total, offset, limit, hasMore: paginated.hasMore } });
        });

        r.get('/api/v1/health', (req, res) => {
            const mm = k.memoryManager;
            res.status(k.running ? 200 : 503).json({
                status: k.running ? 'online' : 'offline',
                version: k.version,
                uptime: k.uptime,
                processes: k.processManager.getProcessList().length,
                memoryUsage: mm.getStats().usagePercent + '%'
            });
        });

        // ── AUTH STATS (unauthenticated, for health checks) ──
        r.get('/api/auth/stats', (req, res) => {
            res.json($.getStats());
        });
    }

    _getOSState() {
        const k = this.kernel;
        const pm = k.processManager;
        const mm = k.memoryManager;

        // Measured AI latency, not a placeholder. This used to be
        // `k.consciousness ? 0 : 9999` — a constant, which meant the Q-learner
        // was training its policy on a fabricated signal and could never
        // converge on anything real. warmMs comes from an actual first-token
        // probe; until one has happened we report the offline ceiling rather
        // than a flattering zero.
        let aiLatency = 9999;
        if (k.intelligence) {
            if (typeof k.intelligence.warmMs === 'number') aiLatency = k.intelligence.warmMs;
            else if (k.intelligence.lastError) aiLatency = 9999;
        }

        // Service availability is a real threat signal: services going down is
        // the OS degrading, and the policy should be able to see it. The probe
        // is async, so it is cached and refreshed on a timer rather than
        // awaited inside the synchronous tick that _getOSState runs on.
        this._serviceUp = this._serviceUp || new Map();
        let threatLevel = (k.security && k.security.threatLevel) || 0;
        if (!threatLevel && k.serviceManager) {
            const list = k.serviceManager.list();
            if (list.length) {
                let down = 0;
                for (const s of list) {
                    if (!s.enabled) continue;
                    if (this._serviceUp.get(s.port) === false) down++;
                }
                const ratio = down / list.length;
                if (ratio >= 0.5) threatLevel = 3;
                else if (ratio >= 0.25) threatLevel = 2;
                else if (ratio > 0) threatLevel = 1;
            }
        }

        return {
            processCount: pm.processes.size,
            cpuUtilization: Math.min(100, (pm.readyQueue.length / pm.maxProcesses) * 100),
            readyQueueLength: pm.readyQueue.length,
            memoryUtilization: mm.getStats().usagePercent,
            pageFaultRate: mm.pageFaults ? (mm.pageFaults / Math.max(1, mm.totalPages)) * 100 : 0,
            swapUsage: mm.swapUsed ? (mm.swapUsed / mm.swapSize) * 100 : 0,
            diskIOPS: mm.diskIOPS || 0,
            networkBandwidth: mm.networkBandwidth || 0,
            threatLevel,
            failedLogins: (k.security && k.security.failedLogins) || 0,
            aiLatency,
            aetherBusLoad: 0
        };
    }

    /**
     * Refresh the service-availability cache the learner reads.
     *
     * Kept out of _getOSState on purpose: that runs synchronously on every
     * kernel heartbeat, and a TCP probe per service per tick would block the
     * event loop for no benefit. This runs on its own slow timer and the
     * learner reads whatever the last answer was.
     */
    async _refreshServiceAvailability() {
        const k = this.kernel;
        if (!k || !k.serviceManager) return;
        try {
            const health = await k.serviceManager.health();
            if (!this._serviceUp) this._serviceUp = new Map();
            for (const h of health) this._serviceUp.set(h.port, !!h.up);
        } catch (e) { /* keep the previous reading rather than fabricate one */ }
    }

    getMiddleware() {
        return this.router;
    }
}

module.exports = { APIRouter };
