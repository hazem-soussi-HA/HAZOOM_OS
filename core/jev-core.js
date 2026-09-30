'use strict';

const fs = require('fs');
const path = require('path');

class JevCore {
    constructor(opts = {}) {
        this.name = 'JEV';
        this.version = '1.13';
        this.baseUrl = opts.baseUrl || process.env.JEV_BASE_URL || 'http://127.0.0.1:8440';
        this.model = 'jev-1.13';
        this.token = opts.token || process.env.JEV_TOKEN || '';
        this.enabled = opts.enabled !== false;
        this.history = [];
        this.maxHistory = 20;
        this.totalDecisions = 0;
        this.offline = true;
        this.lastError = null;
        this.memPath = path.join(__dirname, '..', 'memory', 'jev-core.json');
        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(this.memPath)) {
                const data = JSON.parse(fs.readFileSync(this.memPath, 'utf8'));
                this.history = (data.history || []).slice(-this.maxHistory);
            }
        } catch (e) { /* fresh */ }
    }

    _save() {
        try {
            const dir = path.dirname(this.memPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.memPath, JSON.stringify({ history: this.history.slice(-this.maxHistory) }, null, 2));
        } catch (e) { /* non-fatal */ }
    }

    _auth() {
        if (this.token) return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.token };
        // Read token from config if not set
        try {
            const cfg = JSON.parse(fs.readFileSync('/root/jev-security/config.json', 'utf8'));
            this.token = cfg.token || '';
            return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.token };
        } catch (e) {
            return { 'Content-Type': 'application/json' };
        }
    }

    async health() {
        if (!this.enabled) return { ok: false, offline: true, reason: 'disabled' };
        try {
            const r = await fetch(this.baseUrl + '/healthz', { signal: AbortSignal.timeout(3000) });
            if (r.ok) {
                this.offline = false;
                this.lastError = null;
                return { ok: true, model: this.model, engine: 'local-jev-clone' };
            }
            this.offline = true;
            return { ok: false, offline: true, reason: `HTTP ${r.status}` };
        } catch (e) {
            this.offline = true;
            this.lastError = e.message;
            return { ok: false, offline: true, reason: e.message };
        }
    }

    async decide(state, questions) {
        if (!this.enabled) return { error: 'JEV disabled' };
        const start = Date.now();
        try {
            const res = await fetch(this.baseUrl + '/api/local/decide', {
                method: 'POST',
                headers: this._auth(),
                body: JSON.stringify({ state, questions })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this.totalDecisions++;
            this.offline = false;
            return { ...data, latencyMs: Date.now() - start, offline: false };
        } catch (e) {
            this.offline = true;
            this.lastError = e.message;
            return { error: e.message, offline: true };
        }
    }

    async cloudDecide(state, questions, model = 'jev-latest') {
        if (!this.enabled) return { error: 'JEV disabled' };
        const start = Date.now();
        try {
            const apiKey = this._loadApiKey();
            if (!apiKey) return { error: 'No TYPESAFE_API_KEY', offline: true };
            const res = await fetch('https://api.typesafe.ai/v1/systemone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify({ state, model, questions })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this.totalDecisions++;
            this.offline = false;
            return { ...data, latencyMs: Date.now() - start, offline: false, cloud: true };
        } catch (e) {
            this.offline = true;
            this.lastError = e.message;
            return { error: e.message, offline: true };
        }
    }

    _loadApiKey() {
        try {
            const env = fs.readFileSync('/root/.env', 'utf8');
            const m = env.match(/TYPESAFE_API_KEY=([^\n]+)/);
            if (m) return m[1].trim();
        } catch (e) {}
        return process.env.TYPESAFE_API_KEY || '';
    }

    async choose(state, options) {
        return this.decide(state, {
            selection: { type: 'choice', instructions: 'Choose the best option', criteria: options }
        });
    }

    async noul(state, instruction, useCloud = false) {
        if (useCloud) return this.cloudDecide(state, { judgment: { type: 'noul', instructions: instruction } });
        return this.decide(state, { judgment: { type: 'noul', instructions: instruction } });
    }

    async score(state, levels, instruction, useCloud = false) {
        if (useCloud) return this.cloudDecide(state, { evaluation: { type: 'score', instructions: instruction, criteria: levels } });
        return this.decide(state, { evaluation: { type: 'score', instructions: instruction, criteria: levels } });
    }

    getStatus() {
        return {
            name: this.name,
            version: this.version,
            enabled: this.enabled,
            baseUrl: this.baseUrl,
            model: this.model,
            offline: this.offline,
            lastError: this.lastError,
            totalDecisions: this.totalDecisions,
            contextTurns: this.history.length
        };
    }
}

module.exports = { JevCore };
