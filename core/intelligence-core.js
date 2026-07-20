/**
 * HAZOOM OS — Intelligence Core (real reasoning, offline-first)
 * Copyright © 2024-2026 Hazem Soussi. All Rights Reserved.
 *
 * WHAT THIS IS
 *   The genuine general-intelligence layer of HAZOOM OS. Unlike the symbolic
 *   `consciousness.js` (keyword templates) and the placeholder `llm-engine.js`
 *   (returns `[HAZOOM Core] Processing: ...`), this routes reasoning to a REAL
 *   local model served by Ollama — by default `ornith:35b` (already pulled on
 *   this machine). No API keys, no egress. Blackout-proof by design.
 *
 * DESIGN (KISS/DRY, additive)
 *   - Pure Node 18+ fetch to http://127.0.0.1:11434/api/chat (Ollama native).
 *   - Fails SOFT: if Ollama is absent it returns a clear `{offline:true}` so the
 *     OS still reports status and the symbolic consciousness can take over.
 *   - Keeps a rolling conversation context (memory) so the OS "remembers".
 *   - Exposes: think(input), streamThink(input, onToken), getStatus(), reset().
 *
 * HONESTY NOTE
 *   This is the real brain. The symbolic modules (pascal-engine, consciousness)
 *   remain the OS "body/state" — emotional vectors, self-model, introspection
 *   counters — layered on top of this for the UI. Reasoning happens here.
 */

'use strict';

const fs = require('fs');
const path = require('path');

class IntelligenceCore {
    constructor(opts = {}) {
        this.name = 'HAZOOM-IntelligenceCore';
        this.version = '1.0.0';

        // Ollama endpoint (always loopback — offline by design)
        this.baseUrl = opts.baseUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
        // Preferred model if it can actually serve traffic on this hardware.
        // Real-world: on CPU-only boxes a 35B model (ornith) is too slow to first
        // token (measured >120s). We auto-select the fastest *responsive* local
        // model at boot, preferring smaller/faster ones. This keeps the OS genuinely
        // intelligent and offline, instead of claiming ornith "thinks" while it hangs.
        this.preferredModel = opts.model || process.env.OLLAMA_MODEL || 'ornith:35b';
        // Order = preference if multiple respond (fast-first). Tiny models win on CPU.
        this.candidateOrder = ['tinyllama:1.1b', 'gemma:2b', 'qwen2.5-coder:3b', 'phi3:mini', 'llama3.1:8b', this.preferredModel];
        this.model = null;               // resolved at boot via _selectModel()
        this.probeTimeoutMs = opts.probeTimeoutMs || 30000;  // per-model responsiveness probe
        this.timeoutMs = opts.timeoutMs || 90000;

        // Rolling memory (recent turns) — the OS's working context.
        this.maxHistory = opts.maxHistory || 20;
        this.systemPrompt =
            opts.systemPrompt ||
            'You are the reasoning core of HAZOOM OS, a local-first, offline, ' +
            'sovereign operating system created by Hazem Soussi. You are helpful, ' +
            'precise, and honest. You never invent facts; when uncertain you say so. ' +
            'You operate with zero external network egress. Be concise and clear.';
        this.history = [];
        this.offline = false;       // last attempt failed -> true
        this.lastError = null;
        this.totalInferences = 0;
        this.enabled = opts.enabled !== false;

        // Persist conversation across restarts (filesystem-backed memory)
        this.memPath = path.join(__dirname, '..', 'memory', 'intelligence-core.json');
        this._load();
    }

    /**
     * Probe Ollama for available models and pick the *fastest responsive* one.
     * Runs candidates in PARALLEL with a hard overall cap so OS boot never hangs
     * on a dead large model (e.g. a 35B model on CPU that never emits a token).
     * Sets this.model. Returns the chosen model name (or null if none respond).
     */
    async _selectModel() {
        let list = [];
        try {
            const ctrl = new AbortController();
            const to = setTimeout(() => ctrl.abort(), 5000);
            const r = await fetch(`${this.baseUrl}/api/tags`, { signal: ctrl.signal });
            clearTimeout(to);
            if (r.ok) { const j = await r.json(); list = (j.models || []).map(m => m.name); }
        } catch (e) { this.offline = true; this.lastError = e.message; return null; }
        if (!list.length) { this.offline = true; this.lastError = 'no local models'; return null; }

        // Candidate order: fast-first preference, only those present locally.
        const order = this.candidateOrder.filter(m => list.includes(m) || list.some(x => x.startsWith(m.split(':')[0])));
        if (this.preferredModel && !order.includes(this.preferredModel)) order.push(this.preferredModel);

        // Probe all candidates concurrently; first to respond (fastest) wins.
        const overallCap = Math.min(this.probeTimeoutMs * 2, 60000);
        const race = order.map(m => (async () => {
            try {
                const ctrl = new AbortController();
                const to = setTimeout(() => ctrl.abort(), this.probeTimeoutMs);
                const r = await fetch(`${this.baseUrl}/api/chat`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
                    body: JSON.stringify({ model: m, messages: [{ role: 'user', content: 'Say: OK' }], stream: false, options: { num_predict: 4 } })
                });
                clearTimeout(to);
                if (r.ok) { const j = await r.json(); if (j.message && j.message.content) return m; }
            } catch (e) { /* try next */ }
            return null;
        })());

        // Hard wall-clock cap so we never block boot indefinitely.
        const capped = Promise.race([
            Promise.all(race),
            new Promise(res => setTimeout(() => res([]), overallCap))
        ]);
        const results = await capped;
        const winners = results.filter(Boolean);
        if (winners.length) {
            this.model = winners[0];   // order is fast-first, so winner[0] is the preferred responsive one
            this.offline = false;
            return this.model;
        }
        this.offline = true;
        this.lastError = 'no responsive local model (all timed out)';
        return null;
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

    /** Truncate a tool/error message so the model context stays bounded. */
    _pushHistory(role, content) {
        this.history.push({ role, content, t: Date.now() });
        if (this.history.length > this.maxHistory) this.history = this.history.slice(-this.maxHistory);
        this._save();
    }

    /**
     * Check the model is reachable (fast, offline-safe).
     * Resolves the best local model via a short probe, then reports.
     * Returns { ok, model, offline, available }.
     */
    async health() {
        if (!this.enabled) return { ok: false, offline: true, reason: 'disabled' };
        const chosen = this.model || await this._selectModel();
        if (!chosen) {
            return { ok: false, offline: true, reason: this.lastError || 'no responsive model' };
        }
        try {
            const ctrl = new AbortController();
            const to = setTimeout(() => ctrl.abort(), 5000);
            const r = await fetch(`${this.baseUrl}/api/tags`, { signal: ctrl.signal });
            clearTimeout(to);
            if (!r.ok) { this.offline = true; return { ok: false, offline: true, reason: `HTTP ${r.status}` }; }
            const j = await r.json();
            const models = (j.models || []).map(m => m.name);
            this.offline = false;
            return { ok: true, model: chosen, available: models, modelPresent: true };
        } catch (e) {
            this.offline = true;
            this.lastError = e.message;
            return { ok: false, offline: true, reason: e.message };
        }
    }

    /** Ensure a responsive model is selected before reasoning. */
    async _ensureModel() {
        if (this.model) return this.model;
        return await this._selectModel();
    }

    /**
     * think(): one synchronous-looking call -> full text response.
     * Returns { text, model, offline, latencyMs }.
     */
    async think(input, opts = {}) {
        const model = await this._ensureModel() || opts.model || this.preferredModel;
        const start = Date.now();
        const h = await this.health();
        if (!h.ok) {
            return {
                text: '(reasoning core offline — local model unreachable at ' + this.baseUrl + ')',
                model, offline: true, latencyMs: Date.now() - start,
                reason: h.reason
            };
        }
        try {
            const messages = [
                { role: 'system', content: this.systemPrompt },
                ...this.history.slice(-this.maxHistory),
                { role: 'user', content: input }
            ];
            const ctrl = new AbortController();
            const to = setTimeout(() => ctrl.abort(), this.timeoutMs);
            const r = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: ctrl.signal,
                body: JSON.stringify({ model, messages, stream: false, options: { temperature: 0.7 } })
            });
            clearTimeout(to);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const j = await r.json();
            const text = (j.message && j.message.content) || '';
            this._pushHistory('user', input);
            this._pushHistory('assistant', text);
            this.totalInferences++;
            this.offline = false;
            return { text: text.trim(), model, offline: false, latencyMs: Date.now() - start };
        } catch (e) {
            this.offline = true;
            this.lastError = e.message;
            return { text: '(reasoning error: ' + e.message + ')', model, offline: true, latencyMs: Date.now() - start };
        }
    }

    /**
     * streamThink(): token-by-token via Ollama SSE (`stream:true`).
     * onToken(deltaText) is called per chunk. Resolves with the full text.
     */
    async streamThink(input, onToken, opts = {}) {
        const model = await this._ensureModel() || opts.model || this.preferredModel;
        const h = await this.health();
        if (!h.ok) {
            const msg = '(reasoning core offline at ' + this.baseUrl + ')';
            onToken && onToken(msg);
            return { text: msg, model, offline: true };
        }
        try {
            const messages = [
                { role: 'system', content: this.systemPrompt },
                ...this.history.slice(-this.maxHistory),
                { role: 'user', content: input }
            ];
            const ctrl = new AbortController();
            const to = setTimeout(() => ctrl.abort(), this.timeoutMs);
            const r = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: ctrl.signal,
                body: JSON.stringify({ model, messages, stream: true, options: { temperature: 0.7 } })
            });
            clearTimeout(to);
            if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`);

            const reader = r.body.getReader();
            const decoder = new TextDecoder();
            let full = '';
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                // Ollama SSE: lines of JSON, terminated by "\n"
                let nl;
                while ((nl = buffer.indexOf('\n')) >= 0) {
                    const line = buffer.slice(0, nl).trim();
                    buffer = buffer.slice(nl + 1);
                    if (!line) continue;
                    try {
                        const j = JSON.parse(line);
                        const delta = j.message && j.message.content ? j.message.content : '';
                        if (delta) { full += delta; onToken && onToken(delta); }
                        if (j.done) break;
                    } catch (_) { /* partial chunk, skip */ }
                }
            }
            this._pushHistory('user', input);
            this._pushHistory('assistant', full);
            this.totalInferences++;
            this.offline = false;
            return { text: full.trim(), model, offline: false };
        } catch (e) {
            this.offline = true;
            this.lastError = e.message;
            onToken && onToken('(stream error: ' + e.message + ')');
            return { text: '', model, offline: true, error: e.message };
        }
    }

    reset() {
        this.history = [];
        this._save();
        return { reset: true };
    }

    getStatus() {
        return {
            name: this.name,
            version: this.version,
            enabled: this.enabled,
            preferredModel: this.preferredModel,
            activeModel: this.model,
            endpoint: this.baseUrl,
            offline: this.offline,
            lastError: this.lastError,
            totalInferences: this.totalInferences,
            contextTurns: this.history.length
        };
    }
}

module.exports = { IntelligenceCore };
