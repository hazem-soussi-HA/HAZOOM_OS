/**
 * HAZOOM OS v6.0 — Service Manager (the OS as the brain for everything)
 * Copyright © 2024-2026 Hazem Soussi — All Rights Reserved.
 *
 * Integrates the fullstack projects under HAZOOM OS as first-class OS
 * "services" that the kernel's brain orchestrates:
 *   - planet_earth      (offline WebGL globe, real-sun model)
 *   - planet_earth_news (sovereign local news / climate feeds, https/loopback)
 *   - birds_encyclopedia (birds + natural-voice 3D atlas)
 *   - hazoom_pod         (print-on-demand platform)
 *   - hazoom_os         (this OS's own desktop)
 *   - collaborative_beat (local-first neural core / reasoning)
 *
 * The real process launch is delegated to the ALREADY-PROVEN, loopback-only,
 * blackout-safe `hazoom-os-launch.sh` (single source of truth). This
 * module is the OS control surface: it registers the services, tracks PIDs,
 * probes their loopback ports for health, and persists state to disk so the
 * whole stack survives a reboot / coupure (blackout-proof).
 *
 * Security: every service binds 127.0.0.1 ONLY. No LAN exposure. No
 * network egress at runtime. The launch script refuses any non-loopback bind.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const net = require('net');

// Default service table. `launchScript` is the ONE launcher that knows how to
// bring each project up on loopback. Override via config.services.launchScript
// or env HAZOOM_LAUNCH.
const DEFAULT_SERVICES = [
    { name: 'planet_earth',       port: 8080, url: 'http://127.0.0.1:8080/',          enabled: true },
    { name: 'planet_earth_news',  port: 8000, url: 'https://127.0.0.1:8000/',         enabled: true },
    { name: 'birds_encyclopedia',  port: 4100, url: 'http://127.0.0.1:4100/ (atlas /atlas/)', enabled: true },
    { name: 'hazoom_pod',          port: 4000, url: 'http://127.0.0.1:4000/',          enabled: true },
    { name: 'hazoom_os',           port: 3000, url: 'http://127.0.0.1:3000/ (desktop /os.html)', enabled: true },
    { name: 'collaborative_beat',   port: 5000, url: 'http://127.0.0.1:5000/',          enabled: true },
    { name: 'chatdev',             port: 5055, url: 'http://127.0.0.1:5055/ (Ornith offline chatbox)', enabled: true },
];

// Probe a loopback TCP port (no egress). Resolves true if open.
function portOpen(port, timeoutMs = 800) {
    return new Promise((resolve) => {
        const sock = new net.Socket();
        let done = false;
        const finish = (v) => { if (!done) { done = true; sock.destroy(); resolve(v); } };
        sock.setTimeout(timeoutMs);
        sock.once('connect', () => finish(true));
        sock.once('timeout', () => finish(false));
        sock.once('error', () => finish(false));
        sock.connect(port, '127.0.0.1');
    });
}

class ServiceManager {
    constructor(kernel, config = {}) {
        this.kernel = kernel;
        this.launchScript = config.launchScript
            || process.env.HAZOOM_LAUNCH
            || '/mnt/c/Users/HP/Desktop/planet_earth/hazoom-os-launch.sh';
        this.dataDir = config.persistencePath
            ? path.resolve(__dirname, '..', config.persistencePath)
            : path.resolve(__dirname, '..', 'data', 'services');
        this.stateFile = path.join(this.dataDir, 'state.json');
        this.services = DEFAULT_SERVICES.map(s => ({ ...s }));
        this.lastStarted = 0;
        this._loadState();
    }

    _loadState() {
        try {
            if (fs.existsSync(this.stateFile)) {
                const saved = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                if (Array.isArray(saved.services)) {
                    for (const s of this.services) {
                        const hit = saved.services.find(x => x.name === s.name);
                        if (hit) s.enabled = !!hit.enabled;
                    }
                }
                this.lastStarted = saved.lastStarted || 0;
            }
        } catch (e) {
            if (this.kernel && this.kernel.log) this.kernel.log('WARN', `[SVC] state load failed: ${e.message}`);
        }
    }

    _saveState() {
        try {
            if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
            fs.writeFileSync(this.stateFile, JSON.stringify({
                lastStarted: this.lastStarted,
                services: this.services.map(s => ({ name: s.name, enabled: s.enabled })),
            }, null, 2));
        } catch (e) {
            if (this.kernel && this.kernel.log) this.kernel.log('WARN', `[SVC] state save failed: ${e.message}`);
        }
    }

    list() {
        return this.services.map(s => ({ name: s.name, port: s.port, enabled: s.enabled, url: s.url }));
    }

    // Delegate to the proven launcher (start|stop|restart|status).
    _run(action) {
        return new Promise((resolve) => {
            execFile('bash', [this.launchScript, action], { timeout: 180000 }, (err, stdout) => {
                resolve({ action, ok: !err, output: (stdout || '').toString() });
            });
        });
    }

    async startAll() {
        const enabled = this.services.filter(s => s.enabled);
        if (this.kernel && this.kernel.log) this.kernel.log('INFO', `[SVC] Starting ${enabled.length} project services via HAZOOM OS launcher...`);
        const r = await this._run('start');
        this.lastStarted = Date.now();
        this._saveState();
        if (this.kernel && this.kernel.log) this.kernel.log('INFO', `[SVC] Launcher: ${r.ok ? 'ok' : 'error'}`);
        return r;
    }

    async stopAll() {
        if (this.kernel && this.kernel.log) this.kernel.log('INFO', '[SVC] Stopping all project services...');
        const r = await this._run('stop');
        this._saveState();
        return r;
    }

    async restartAll() {
        await this.stopAll();
        return this.startAll();
    }

    setEnabled(name, enabled) {
        const s = this.services.find(x => x.name === name);
        if (!s) return { error: `Service ${name} not found` };
        s.enabled = !!enabled;
        this._saveState();
        return { name, enabled: s.enabled };
    }

    // Health probe every enabled service on its loopback port.
    async health() {
        const out = [];
        for (const s of this.services) {
            const open = s.enabled ? await portOpen(s.port) : false;
            out.push({ name: s.name, port: s.port, enabled: s.enabled, up: open, url: s.url });
        }
        return out;
    }

    getStats() {
        const enabled = this.services.filter(s => s.enabled).length;
        return {
            total: this.services.length,
            enabled,
            lastStarted: this.lastStarted,
            launchedAgoSec: this.lastStarted ? Math.floor((Date.now() - this.lastStarted) / 1000) : null,
            launchScript: this.launchScript,
        };
    }
}

module.exports = { ServiceManager, DEFAULT_SERVICES };
module.exports.default = ServiceManager;
