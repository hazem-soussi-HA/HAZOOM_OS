/**
 * HAZOOM OS v6 — Shell Executor (gated)
 * Real shell observation: read-only commands + safe git operations only.
 * Every command is matched against an allowlist; denials are logged too.
 * 
 * Copyright © 2024-2026 Hazem Soussi — All Rights Reserved
 */

'use strict';

const { execFile } = require('child_process');
const path = require('path');

const DEFAULT_ALLOWLIST = [
    // ── Git (read-only + safe ops) ──────────────────────────────
    { pattern: /^git\s+(status|log|diff|branch|show|rev-parse|remote|fetch|pull\s+--ff-only|tag|blame)\b/, label: 'git read/safe' },

    // ── System observation ──────────────────────────────────────
    { pattern: /^ps\s+(-?\w+\s*)+$/, label: 'ps' },
    { pattern: /^uptime$/, label: 'uptime' },
    { pattern: /^ls\s+(-la?|--color)?(\s+\S+)*$/, label: 'ls' },
    { pattern: /^df\s+-h(\s+\S+)*$/, label: 'df' },
    { pattern: /^free\s+-h$/, label: 'free' },
    { pattern: /^uname\s+(-a|\s)*-?[a-z]*$/, label: 'uname' },
    { pattern: /^date$/, label: 'date' },
    { pattern: /^hostname$/, label: 'hostname' },
    { pattern: /^whoami$/, label: 'whoami' },
    { pattern: /^node\s+--version$/, label: 'node version' },
    { pattern: /^npm\s+--version$/, label: 'npm version' },

    // ── Container / orchestration observation ───────────────────
    { pattern: /^docker\s+(ps|stats\s+--no-stream|images|network\s+ls|volume\s+ls)\b/, label: 'docker read' },
    { pattern: /^juju\s+(status|machines|models|controllers)\b/, label: 'juju read' },
    { pattern: /^kubectl\s+(get|describe|top|logs)\b/, label: 'kubectl read' }
];

class ShellExecutor {
    constructor(config = {}) {
        this.workDir = config.workDir || path.join(__dirname, '..');
        this.timeoutMs = config.timeoutMs || 8000;
        this.maxLog = config.maxLog || 500;
        this.logger = config.logger || console;
        this.allowlist = config.allowlist || DEFAULT_ALLOWLIST;
        this.log = [];   // ring buffer: {ts, command, allowed, exitCode, output, duration}

        if (config.enabled === false) {
            this.enabled = false;
        }
    }

    get enabled() {
        return this.allowlist.length > 0;
    }

    /** Return the allowlist match for a command, or null if denied */
    match(command) {
        const cmd = String(command || '').trim();
        if (!cmd) return null;
        for (const entry of this.allowlist) {
            if (entry.pattern.test(cmd)) {
                return { ...entry, command: cmd };
            }
        }
        return null;
    }

    /**
     * Execute a command if allowlisted.
     * Tokenized argv → execFile (no shell interpretation, no pipes).
     */
    execute(command) {
        const cmd = String(command || '').trim();
        const started = Date.now();

        return new Promise((resolve) => {
            if (!cmd) {
                return resolve(this._record({ command: cmd, allowed: false, exitCode: 1, output: 'empty command', duration: 0 }));
            }

            const match = this.match(cmd);
            if (!match) {
                const res = this._record({ command: cmd, allowed: false, exitCode: 1, output: `permission denied: not in shell allowlist`, duration: 0 });
                this.logger.warn ? this.logger.warn(`[SHELL] denied: ${cmd}`) : console.warn(`[SHELL] denied: ${cmd}`);
                return resolve(res);
            }

            const argv = cmd.split(/\s+/);
            const bin = argv.shift();

            execFile(bin, argv, {
                cwd: this.workDir,
                timeout: this.timeoutMs,
                maxBuffer: 1024 * 1024,
                env: { ...process.env, LANG: 'C' }
            }, (error, stdout, stderr) => {
                const output = [stdout, stderr].filter(Boolean).join('\n').trim();
                const res = this._record({
                    command: cmd,
                    allowed: true,
                    exitCode: error ? (error.code === null ? 1 : (typeof error.code === 'number' ? error.code : 1)) : 0,
                    output: output || (error ? error.message : '(no output)'),
                    duration: Date.now() - started
                });
                resolve(res);
            });
        });
    }

    _record(entry) {
        const rec = {
            ts: Date.now(),
            command: entry.command,
            allowed: entry.allowed,
            exitCode: entry.exitCode,
            output: String(entry.output || '').slice(0, 4000),
            duration: entry.duration
        };
        this.log = [rec, ...this.log].slice(0, this.maxLog);
        return rec;
    }

    getLog(offset = 0, limit = 50) {
        return {
            items: this.log.slice(offset, offset + limit),
            total: this.log.length,
            offset,
            limit,
            hasMore: offset + limit < this.log.length
        };
    }

    getStats() {
        const executed = this.log.filter(e => e.allowed).length;
        const denied = this.log.length - executed;
        return {
            enabled: this.enabled,
            executed,
            denied,
            logSize: this.log.length,
            maxLog: this.maxLog,
            allowlistEntries: this.allowlist.length,
            workDir: this.workDir
        };
    }
}

let _instance = null;

function getShellExecutor(config) {
    if (!_instance || config) {
        _instance = new ShellExecutor(config);
    }
    return _instance;
}

module.exports = { ShellExecutor, getShellExecutor, DEFAULT_ALLOWLIST };