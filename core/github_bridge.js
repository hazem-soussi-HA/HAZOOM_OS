/**
 * HAZOOM OS v6 — GitHub Bridge
 * Real-time shell observation between GitHub and HAZOOM OS.
 * 
 * Inbound  : webhook receiver (push / pull_request / workflow_run)
 *             + HMAC-SHA256 signature verification
 * Outbound : GitHub REST client (commits, PRs, workflow runs, statuses)
 * GitOps   : ops/commands.json control file executed on push
 * 
 * Copyright © 2024-2026 Hazem Soussi — All Rights Reserved
 */

'use strict';

const crypto = require('crypto');
const path = require('path');

const OBSERVED_EVENTS = new Set(['push', 'pull_request', 'workflow_run']);

class GitHubBridge {
    constructor(config = {}) {
        this.owner = config.owner || process.env.GITHUB_OWNER || 'hazem-soussi-HA';
        this.repo = config.repo || process.env.GITHUB_REPO || 'HAZOOM_OS';
        this.token = config.token || process.env.GITHUB_TOKEN || '';
        this.webhookSecret = config.webhookSecret || process.env.GITHUB_WEBHOOK_SECRET || '';
        this.workDir = config.workDir || path.join(__dirname, '..');
        this.logger = config.logger || console;
        this.broadcast = config.broadcast || (() => {});
        this.maxEvents = config.maxEvents || 200;
        this.pollInterval = parseInt(config.pollInterval || process.env.GITHUB_POLL_INTERVAL || '30000', 10);

        this.events = [];          // ring buffer, newest first
        this.lastSync = null;
        this.syncError = null;
        this.lastSyncResult = null;
        this._pollTimer = null;

        if (this.token) this._startPolling();
    }

    get apiBase() {
        return `https://api.github.com/repos/${this.owner}/${this.repo}`;
    }

    get enabled() {
        return !!this.token;
    }

    _authHeaders(extra = {}) {
        return {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'HAZOOM-OS-Bridge',
            ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
            ...extra
        };
    }

    /** Constant-time HMAC verification of X-Hub-Signature-256 */
    verifySignature(rawBody, signatureHeader) {
        if (!this.webhookSecret || !signatureHeader) return false;
        const expected = 'sha256=' + crypto.createHmac('sha256', this.webhookSecret)
            .update(rawBody || '').digest('hex');
        const provided = String(signatureHeader);
        const a = Buffer.from(expected);
        const b = Buffer.from(provided);
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    }

    /** Normalize a raw GitHub webhook payload into a compact OS event */
    _normalize(eventType, payload) {
        if (!payload) return null;
        const base = {
            source: 'webhook',
            type: eventType,
            actor: payload.sender?.login || 'unknown',
            timestamp: Date.now(),
            url: null,
            ref: null,
            head: null,
            message: '',
            action: null,
            runStatus: null,
            raw: payload
        };

        switch (eventType) {
            case 'push': {
                if (!payload.head_commit) return null;
                const head = payload.head_commit;
                base.id = `push-${head.id}`;
                base.ref = payload.ref ? payload.ref.replace('refs/heads/', '') : null;
                base.head = head.id?.slice(0, 7);
                base.message = head.message?.split('\n')[0] || '';
                base.url = head.url || null;
                base.commits = (payload.commits || []).map(c => ({
                    id: c.id?.slice(0, 7),
                    message: c.message?.split('\n')[0] || '',
                    author: c.author?.name || c.author?.username || null
                }));
                base.forced = !!payload.forced;
                base.created = !!payload.created;
                base.deleted = !!payload.deleted;
                return base;
            }
            case 'pull_request': {
                const pr = payload.pull_request;
                if (!pr) return null;
                base.id = `pr-${pr.number}-${payload.action || 'event'}`;
                base.action = payload.action;
                base.ref = pr.base?.ref || null;
                base.head = pr.head?.sha?.slice(0, 7);
                base.message = pr.title || `PR #${pr.number}`;
                base.url = pr.html_url || null;
                base.number = pr.number;
                base.state = pr.state;
                base.merged = !!pr.merged;
                return base;
            }
            case 'workflow_run': {
                const run = payload.workflow_run;
                if (!run || run.repository?.full_name !== `${this.owner}/${this.repo}`) return null;
                base.id = `run-${run.id}-${payload.action || 'event'}`;
                base.action = payload.action;
                base.ref = run.head_branch || null;
                base.head = run.head_sha?.slice(0, 7);
                base.message = run.display_title || run.name || `Workflow #${run.run_number}`;
                base.url = run.html_url || null;
                base.runStatus = run.status;
                base.runConclusion = run.conclusion;
                base.runName = run.name;
                base.runNumber = run.run_number;
                return base;
            }
            default:
                return null;
        }
    }

    /** Push an observed event into the ring buffer + broadcast */
    handleWebhook(eventType, payload) {
        if (!OBSERVED_EVENTS.has(eventType)) return null;
        const event = this._normalize(eventType, payload);
        if (!event) return null;
        this._push(event);
        return event;
    }

    _push(event) {
        this.events = [event, ...this.events].slice(0, this.maxEvents);
        this.logger.info ? this.logger.info(`[GITHUB] observed ${event.type}${event.action ? '/' + event.action : ''} by ${event.actor}`)
                          : console.log(`[GITHUB] observed ${event.type} by ${event.actor}`);
        this.broadcast({ type: 'github_event', event });
    }

    /** Import normalized events from polling sync (dedupe by id) */
    _ingest(event) {
        if (!event || !event.id) return;
        if (this.events.some(e => e.id === event.id)) return;
        this.events = [event, ...this.events].slice(0, this.maxEvents);
        this.broadcast({ type: 'github_event', event });
    }

    getEvents(offset = 0, limit = 20) {
        const items = this.events.slice(offset, offset + limit);
        return {
            items,
            total: this.events.length,
            offset,
            limit,
            hasMore: offset + limit < this.events.length
        };
    }

    /** Snapshot of repo state observed by the OS */
    async getStatus() {
        const result = {
            owner: this.owner,
            repo: this.repo,
            enabled: this.enabled,
            lastSync: this.lastSync,
            syncError: this.syncError,
            lastSyncResult: this.lastSyncResult,
            observedEvents: this.events.length,
            latestEvent: this.events[0] || null
        };
        if (!this.enabled) return result;
        if (!this.lastSyncResult || !this.lastSync || Date.now() - this.lastSync > this.pollInterval * 2) {
            await this.sync();
        }
        result.lastSync = this.lastSync;
        result.syncError = this.syncError;
        result.lastSyncResult = this.lastSyncResult;
        return result;
    }

    /** Poll GitHub REST API: recent commits, open PRs, workflow runs */
    async sync() {
        if (!this.enabled) {
            this.syncError = 'GITHUB_TOKEN not configured';
            return { ok: false, error: this.syncError };
        }
        try {
            const [commits, pulls, runs] = await Promise.all([
                this._apiGet(`/commits?per_page=5`),
                this._apiGet(`/pulls?state=open&sort=updated&direction=desc&per_page=5`),
                this._apiGet(`/actions/runs?per_page=5`)
            ]);

            for (const c of (commits || [])) {
                this._ingest({
                    id: `push-${c.sha}`,
                    source: 'poll',
                    type: 'push',
                    actor: c.committer?.login || c.commit?.author?.name || 'unknown',
                    timestamp: Date.parse(c.commit?.committer?.date) || Date.now(),
                    ref: null,
                    head: c.sha?.slice(0, 7),
                    message: c.commit?.message?.split('\n')[0] || '',
                    url: c.html_url || null
                });
            }

            for (const pr of (pulls || [])) {
                this._ingest({
                    id: `pr-${pr.number}-open`,
                    source: 'poll',
                    type: 'pull_request',
                    actor: pr.user?.login || 'unknown',
                    timestamp: Date.parse(pr.updated_at) || Date.now(),
                    ref: pr.base?.ref || null,
                    head: pr.head?.sha?.slice(0, 7),
                    message: pr.title || `PR #${pr.number}`,
                    url: pr.html_url || null,
                    action: 'open',
                    number: pr.number,
                    state: pr.state
                });
            }

            for (const run of (runs || [])) {
                this._ingest({
                    id: `run-${run.id}-${run.status}`,
                    source: 'poll',
                    type: 'workflow_run',
                    actor: 'github-actions',
                    timestamp: Date.parse(run.created_at) || Date.now(),
                    ref: run.head_branch || null,
                    head: run.head_sha?.slice(0, 7),
                    message: run.display_title || run.name || `Workflow #${run.run_number}`,
                    url: run.html_url || null,
                    runStatus: run.status,
                    runConclusion: run.conclusion,
                    runName: run.name,
                    runNumber: run.run_number
                });
            }

            this.lastSync = Date.now();
            this.syncError = null;
            this.lastSyncResult = {
                commits: (commits || []).length,
                pulls: (pulls || []).length,
                runs: (runs || []).length
            };
            return { ok: true, ...this.lastSyncResult };
        } catch (e) {
            this.syncError = e.message;
            this.logger.warn ? this.logger.warn(`[GITHUB] sync failed: ${e.message}`)
                              : console.warn(`[GITHUB] sync failed: ${e.message}`);
            return { ok: false, error: e.message };
        }
    }

    /** Report a commit status back to GitHub (used by GitOps ops/commands.json) */
    async setCommitStatus(sha, state, description, context) {
        if (!this.enabled || !sha) return { ok: false, error: 'not configured' };
        try {
            const body = JSON.stringify({
                state, // error | failure | pending | success
                description: String(description).slice(0, 140),
                context: context || 'hazoom-os/bridge'
            });
            const res = await fetch(`${this.apiBase}/statuses/${sha}`, {
                method: 'POST',
                headers: this._authHeaders({ 'Content-Type': 'application/json' }),
                body,
                signal: AbortSignal.timeout(15000)
            });
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                return { ok: false, status: res.status, error: text.slice(0, 300) };
            }
            return { ok: true, status: res.status };
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    /**
     * GitOps control plane: on push, scan ops/commands.json and execute the
     * gated commands against the OS shell. Results reported as commit statuses.
     */
    async runOpsCommands(pushEvent) {
        const commandsPath = path.join(this.workDir, 'ops', 'commands.json');
        let controls;
        try {
            controls = JSON.parse(require('fs').readFileSync(commandsPath, 'utf8'));
        } catch (e) {
            return { ok: true, executed: 0, reason: 'no ops/commands.json' };
        }

        const shell = this._getShell();
        if (!shell) return { ok: false, executed: 0, reason: 'shell executor unavailable' };

        const list = Array.isArray(controls) ? controls
            : (controls.commands || controls.onPush || []);
        const sha = pushEvent.head;
        const results = [];

        for (const item of list) {
            const name = typeof item === 'string' ? item : (item.name || item.command);
            const command = typeof item === 'string' ? item : item.command;
            if (!command) continue;
            const res = await shell.execute(command);
            results.push({ name, command, ...res });
            if (sha) {
                const state = res.allowed && res.exitCode === 0 ? 'success' : 'failure';
                const description = `${res.allowed ? 'ok' : 'denied'}: ${command}`;
                await this.setCommitStatus(sha, state, description, `ops/${name}`);
            }
            this.logger.info ? this.logger.info(`[GITHUB] ops ${name}: ${res.allowed ? 'executed' : 'denied'} (${res.exitCode})`)
                              : console.log(`[GITHUB] ops ${name}: ${res.allowed ? 'executed' : 'denied'}`);
        }

        return { ok: true, executed: results.length, results };
    }

    _getShell() {
        try {
            const { getShellExecutor } = require('./shell');
            return getShellExecutor();
        } catch (e) {
            return null;
        }
    }

    async _apiGet(pathname) {
        const res = await fetch(`${this.apiBase}${pathname}`, {
            headers: this._authHeaders(),
            signal: AbortSignal.timeout(15000)
        });
        if (!res.ok) throw new Error(`GitHub API ${res.status}: ${pathname}`);
        return res.json();
    }

    _startPolling() {
        if (this._pollTimer) return;
        this._pollTimer = setInterval(() => this.sync().catch(() => {}), this.pollInterval);
        this._pollTimer.unref && this._pollTimer.unref();
        this.sync().catch(() => {});
        this.logger.info ? this.logger.info(`[GITHUB] bridge polling every ${this.pollInterval}ms`)
                          : console.log(`[GITHUB] bridge polling every ${this.pollInterval}ms`);
    }

    stop() {
        if (this._pollTimer) clearInterval(this._pollTimer);
        this._pollTimer = null;
    }

    getStats() {
        return {
            owner: this.owner,
            repo: this.repo,
            enabled: this.enabled,
            events: this.events.length,
            lastSync: this.lastSync,
            syncError: this.syncError,
            maxEvents: this.maxEvents,
            pollInterval: this.pollInterval
        };
    }
}

module.exports = { GitHubBridge };