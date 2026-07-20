/**
 * HAZOOM OS v5.0 — REST API Routes
 * All unified endpoints for the OS kernel, Q-learning, Pascal brain, and consciousness.
 * 
 * Copyright © 2024-2026 Hazem Soussi — All Rights Reserved
 */

'use strict';

const express = require('express');

class APIRouter {
    constructor(kernel, config = {}) {
        this.kernel = kernel;
        this.router = express.Router();
        this.logger = config.logger || console;
        this._registerRoutes();
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

        // ── SYSTEM ────────────────────────────────────────

        r.get('/api/status', (req, res) => {
            res.json(this.getKernelState());
        });

        r.post('/api/boot', (req, res) => {
            res.json(k.boot());
        });

        r.post('/api/shutdown', (req, res) => {
            res.json(k.shutdown());
        });

        r.post('/api/tick', (req, res) => {
            const count = Math.min(parseInt(req.query.count) || 1, 100);
            const results = [];
            for (let i = 0; i < count; i++) results.push(k.tick());
            res.json({ ticks: results.length, last: results[results.length - 1] });
        });

        r.get('/api/log', (req, res) => {
            const lines = parseInt(req.query.lines) || 50;
            const level = req.query.level;
            let logs = k.logBuffer || [];
            if (level) logs = logs.filter(l => l.level === level);
            res.json({ lines: logs.slice(-lines), total: (k.logBuffer || []).length });
        });

        r.get('/health', (req, res) => {
            const mm = k.memoryManager;
            res.json({
                status: k.running ? 'online' : 'offline',
                version: k.version,
                uptime: k.uptime,
                processes: k.processManager.processes.size,
                memoryUsage: mm.getStats().usagePercent + '%'
            });
        });

        // ── PROCESSES ─────────────────────────────────────

        r.get('/api/processes', (req, res) => {
            const state = this.getKernelState();
            res.json({
                processes: state.processes,
                stats: { total: state.processCount, ready: state.readyQueue, blocked: state.blockedQueue }
            });
        });

        r.post('/api/processes/create', (req, res) => {
            const { name, priority, parentPid } = req.body;
            res.json(k.processManager.createProcess(name || 'unknown', priority || 5, parentPid || 0));
        });

        r.post('/api/processes/:pid/terminate', (req, res) => {
            res.json(k.processManager.terminateProcess(parseInt(req.params.pid)));
        });

        r.post('/api/processes/:pid/block', (req, res) => {
            res.json(k.processManager.blockProcess(parseInt(req.params.pid)));
        });

        r.post('/api/processes/:pid/unblock', (req, res) => {
            res.json(k.processManager.unblockProcess(parseInt(req.params.pid)));
        });

        // ── MEMORY ────────────────────────────────────────

        r.get('/api/memory', (req, res) => {
            res.json(k.memoryManager.getStats());
        });

        r.post('/api/memory/allocate', (req, res) => {
            const { size, pid } = req.body;
            res.json(k.memoryManager.allocate(size || 4096, pid || 1));
        });

        // ── FILE SYSTEM ───────────────────────────────────

        r.get('/api/fs/list', (req, res) => {
            const targetPath = req.query.path || k.fileSystem.currentPath;
            const result = k.fileSystem.listDir(targetPath);
            if (result.error) return res.json(result);
            res.json({ path: result.path, entries: result.entries.map(e => e.name) });
        });

        r.get('/api/fs/read', (req, res) => {
            const filePath = req.query.path || '';
            const result = k.fileSystem.readFile(filePath);
            if (result.error) return res.json({ error: result.error, path: filePath });
            res.json({ path: filePath, content: result.content, size: result.size });
        });

        r.post('/api/fs/write', (req, res) => {
            const { path: filePath, content } = req.body;
            if (!filePath) return res.json({ error: 'Path required' });
            res.json(k.fileSystem.writeFile(filePath, content || ''));
        });

        r.post('/api/fs/mkdir', (req, res) => {
            const { path: dirPath } = req.body;
            if (!dirPath) return res.json({ error: 'Path required' });
            res.json(k.fileSystem.mkdir(dirPath));
        });

        r.post('/api/fs/delete', (req, res) => {
            const { path: targetPath } = req.body;
            if (!targetPath) return res.json({ error: 'Path required' });
            res.json(k.fileSystem.delete(targetPath));
        });

        // ── PASCAL ENGINE ─────────────────────────────────

        r.get('/api/pascal', (req, res) => {
            if (!k.pascalEngine) return res.json({ error: 'Pascal Engine not loaded' });
            res.json(k.pascalEngine.getFullStatus());
        });

        r.get('/api/pascal/aether', (req, res) => {
            if (!k.pascalEngine) return res.json({ error: 'Not loaded' });
            res.json(k.pascalEngine.aether.getStatus());
        });

        r.get('/api/pascal/neural', (req, res) => {
            if (!k.pascalEngine) return res.json({ error: 'Not loaded' });
            res.json(k.pascalEngine.neural.getStatus());
        });

        r.get('/api/pascal/consciousness', (req, res) => {
            if (!k.pascalEngine) return res.json({ error: 'Not loaded' });
            res.json(k.pascalEngine.deepConsciousness.getFullStatus());
        });

        r.get('/api/pascal/synapse', (req, res) => {
            if (!k.pascalEngine) return res.json({ error: 'Not loaded' });
            res.json(k.pascalEngine.synapseOS.getStatus());
        });

        r.post('/api/pascal/neural/think', (req, res) => {
            if (!k.pascalEngine) return res.json({ error: 'Not loaded' });
            const { content, type, intensity } = req.body;
            const thoughtId = k.pascalEngine.neural.createThought(content || 'untitled', type || 0, intensity || 0.5);
            res.json({ thoughtId, thoughts: k.pascalEngine.neural.thoughts.length });
        });

        r.post('/api/pascal/consciousness/reflect', (req, res) => {
            if (!k.pascalEngine) return res.json({ error: 'Not loaded' });
            const layers = k.pascalEngine.deepConsciousness.reflect();
            res.json({ layers, status: k.pascalEngine.deepConsciousness.getFullStatus() });
        });

        r.post('/api/pascal/consciousness/meditate', (req, res) => {
            if (!k.pascalEngine) return res.json({ error: 'Not loaded' });
            const levels = k.pascalEngine.deepConsciousness.meditate();
            res.json({ levels, status: k.pascalEngine.deepConsciousness.getFullStatus() });
        });

        r.post('/api/pascal/consciousness/stimulus', (req, res) => {
            if (!k.pascalEngine) return res.json({ error: 'Not loaded' });
            const { stimulus, intensity } = req.body;
            k.pascalEngine.deepConsciousness.processStimulus(stimulus || 'neutral', intensity || 0.5);
            res.json({ status: k.pascalEngine.deepConsciousness.getFullStatus() });
        });

        r.post('/api/pascal/synapse/pheromone', (req, res) => {
            if (!k.pascalEngine) return res.json({ error: 'Not loaded' });
            const { sourcePID, targetPID, purpose } = req.body;
            k.pascalEngine.synapseOS.pheromoneNet.deposit(sourcePID || 1, targetPID || 2, purpose || 'signal');
            res.json(k.pascalEngine.synapseOS.pheromoneNet.getStatus());
        });

        // ── CONSCIOUSNESS ─────────────────────────────────

        r.get('/api/consciousness', (req, res) => {
            if (!k.consciousness) return res.json({ error: 'Consciousness not loaded' });
            res.json(k.consciousness.getStatus());
        });

        r.post('/api/consciousness/awaken', (req, res) => {
            if (!k.consciousness) return res.json({ error: 'Not loaded' });
            res.json(k.consciousness.awaken());
        });

        r.post('/api/consciousness/sleep', (req, res) => {
            if (!k.consciousness) return res.json({ error: 'Not loaded' });
            res.json(k.consciousness.sleep());
        });

        r.post('/api/consciousness/think', (req, res) => {
            if (!k.consciousness) return res.json({ error: 'Not loaded' });
            const { input } = req.body;
            if (!input) return res.json({ error: 'No input provided' });
            res.json(k.consciousness.think(input));
        });

        r.get('/api/consciousness/introspect', (req, res) => {
            if (!k.consciousness) return res.json({ error: 'Not loaded' });
            res.json(k.consciousness.introspect());
        });

        r.get('/api/consciousness/memories', (req, res) => {
            if (!k.consciousness) return res.json({ error: 'Not loaded' });
            const { limit } = req.query;
            const memories = k.consciousness.memories.slice(-(parseInt(limit) || 50));
            res.json({ memories, total: k.consciousness.memories.length });
        });

        r.post('/api/consciousness/recall', (req, res) => {
            if (!k.consciousness) return res.json({ error: 'Not loaded' });
            const { query } = req.body;
            if (!query) return res.json({ error: 'No query provided' });
            res.json({ memories: k.consciousness.recallMemory(query), query });
        });

        r.post('/api/consciousness/memory', (req, res) => {
            if (!k.consciousness) return res.json({ error: 'Not loaded' });
            const { type, content, importance } = req.body;
            if (!content) return res.json({ error: 'No content provided' });
            const id = k.consciousness.storeMemory({ type, content, importance });
            res.json({ id, total: k.consciousness.memories.length });
        });

        // ── SERVICES (HAZOOM fullstack orchestrated by the OS) ──
        r.get('/api/services', async (req, res) => {
            if (!k.serviceManager) return res.json({ error: 'ServiceManager not loaded' });
            const list = k.serviceManager.list();
            const health = await k.serviceManager.health();
            res.json({ stats: k.serviceManager.getStats(), list, health });
        });
        r.post('/api/services/start', async (req, res) => {
            if (!k.serviceManager) return res.json({ error: 'ServiceManager not loaded' });
            res.json(await k.serviceManager.startAll());
        });
        r.post('/api/services/stop', async (req, res) => {
            if (!k.serviceManager) return res.json({ error: 'ServiceManager not loaded' });
            res.json(await k.serviceManager.stopAll());
        });
        r.post('/api/services/restart', async (req, res) => {
            if (!k.serviceManager) return res.json({ error: 'ServiceManager not loaded' });
            res.json(await k.serviceManager.restartAll());
        });
        r.post('/api/services/:name/toggle', async (req, res) => {
            if (!k.serviceManager) return res.json({ error: 'ServiceManager not loaded' });
            const enabled = req.body.enabled !== false;
            res.json(k.serviceManager.setEnabled(req.params.name, enabled));
        });

        // ── Q-LARNING (NEW IN v5.0) ─────────────────────

        r.get('/api/qlearner/status', (req, res) => {
            if (!k.qLearner) return res.json({ error: 'Q-Learning not loaded' });
            res.json(k.qLearner.getStatus());
        });

        r.get('/api/qlearner/policy', (req, res) => {
            if (!k.qLearner) return res.json({ error: 'Q-Learning not loaded' });
            const state = this._getOSState();
            res.json(k.qLearner.getPolicy(state));
        });

        r.get('/api/qlearner/history', (req, res) => {
            if (!k.qLearner) return res.json({ error: 'Q-Learning not loaded' });
            const n = parseInt(req.query.n) || 100;
            res.json({
                history: k.qLearner.history.slice(-n),
                total: k.qLearner.history.length
            });
        });

        r.post('/api/qlearner/config', (req, res) => {
            if (!k.qLearner) return res.json({ error: 'Q-Learning not loaded' });
            const { mode, tabular, dqn } = req.body;
            if (mode) k.qLearner.mode = mode;
            if (tabular) Object.assign(k.qLearner.tabular, tabular);
            if (dqn) Object.assign(k.qLearner.dqn, dqn);
            res.json(k.qLearner.getStatus());
        });

        r.post('/api/qlearner/reset', (req, res) => {
            if (!k.qLearner) return res.json({ error: 'Q-Learning not loaded' });
            k.qLearner.reset();
            res.json({ status: 'reset', qLearning: k.qLearner.getStatus() });
        });

        r.get('/api/qlearner/stats', (req, res) => {
            if (!k.qLearner) return res.json({ error: 'Q-Learning not loaded' });
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

        // ── SYSTEM METRICS (fixes v4 missing endpoint) ────

        r.get('/api/system/metrics', (req, res) => {
            const state = this.getKernelState();
            res.json({
                timestamp: Date.now(),
                cpu: {
                    utilization: Math.min(100, (state.processCount / 50) * 30 + Math.random() * 20),
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

        // ── INTELLIGENCE CORE (real local-LLM reasoning) ──

        r.get('/api/intelligence/status', (req, res) => {
            if (!k.intelligence) return res.json({ error: 'Intelligence Core not loaded' });
            res.json(k.intelligence.getStatus());
        });

        r.get('/api/intelligence/health', async (req, res) => {
            if (!k.intelligence) return res.json({ error: 'Intelligence Core not loaded' });
            res.json(await k.intelligence.health());
        });

        r.post('/api/intelligence/think', async (req, res) => {
            if (!k.intelligence) return res.json({ error: 'Intelligence Core not loaded' });
            const { input, model } = req.body || {};
            if (!input) return res.json({ error: 'No input provided' });
            res.json(await k.intelligence.think(input, { model }));
        });

        r.post('/api/intelligence/stream', async (req, res) => {
            if (!k.intelligence) return res.json({ error: 'Intelligence Core not loaded' });
            const { input, model } = req.body || {};
            if (!input) return res.json({ error: 'No input provided' });
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            const out = await k.intelligence.streamThink(input, (delta) => res.write(delta), { model });
            res.end();
        });

        r.post('/api/intelligence/reset', (req, res) => {
            if (!k.intelligence) return res.json({ error: 'Intelligence Core not loaded' });
            res.json(k.intelligence.reset());
        });
    }
    _getOSState() {
        const k = this.kernel;
        const pm = k.processManager;
        const mm = k.memoryManager;

        return {
            processCount: pm.processes.size,
            cpuUtilization: Math.min(100, (pm.readyQueue.length / pm.maxProcesses) * 100),
            readyQueueLength: pm.readyQueue.length,
            memoryUtilization: mm.getStats().usagePercent,
            pageFaultRate: mm.pageFaults ? (mm.pageFaults / Math.max(1, mm.totalPages)) * 100 : 0,
            swapUsage: mm.swapUsed ? (mm.swapUsed / mm.swapSize) * 100 : 0,
            diskIOPS: mm.diskIOPS || Math.floor(Math.random() * 500),
            networkBandwidth: Math.random() * 50,
            threatLevel: k.security?.threatLevel || 0,
            failedLogins: k.security?.failedLogins || 0,
            aiLatency: k.consciousness ? 200 : 9999,
            aetherBusLoad: k.pascalEngine ? Math.random() * 30 : 0
        };
    }

    getMiddleware() {
        return this.router;
    }
}

module.exports = { APIRouter };
