/**
 * HAZOOM OS v5.0 — Structured Logger
 * Timestamped, leveled, with kernel log buffer integration.
 * 
 * Copyright © 2024-2026 Hazem Soussi — All Rights Reserved
 */

'use strict';

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const LEVEL_NAMES = ['debug', 'info', 'warn', 'error'];
const LEVEL_COLORS = ['\x1b[36m', '\x1b[32m', '\x1b[33m', '\x1b[31m'];
const RESET = '\x1b[0m';

class Logger {
    constructor(config = {}) {
        this.source = config.source || 'HAZOOM';
        this.minLevel = LEVELS[config.level ?? 'info'] ?? LEVELS.info;
        this.maxBuffer = config.maxBuffer ?? 5000;
        this.buffer = [];
        this.silent = config.silent ?? false;
    }

    _log(level, message, data = null) {
        if (level < this.minLevel) return;

        const timestamp = new Date().toISOString();
        const levelName = LEVEL_NAMES[level];
        const entry = { timestamp, level: levelName, source: this.source, message };

        if (data !== null && data !== undefined) {
            entry.data = data;
        }

        // Buffer for API access
        this.buffer.push(entry);
        if (this.buffer.length > this.maxBuffer) {
            this.buffer.shift();
        }

        // Console output
        if (!this.silent) {
            const color = LEVEL_COLORS[level];
            const prefix = `${color}[${this.source}]${RESET}`;
            const ts = `\x1b[90m${timestamp}${RESET}`;
            const line = data
                ? `${ts} ${prefix} ${message} ${JSON.stringify(data)}`
                : `${ts} ${prefix} ${message}`;
            console.log(line);
        }

        return entry;
    }

    debug(message, data) { return this._log(0, message, data); }
    info(message, data)  { return this._log(1, message, data); }
    warn(message, data)  { return this._log(2, message, data); }
    error(message, data) { return this._log(3, message, data); }

    /** Get buffered log entries */
    getLog(lines = 50, level = null) {
        let logs = this.buffer;
        if (level) logs = logs.filter(l => l.level === level);
        return logs.slice(-lines);
    }

    /** Clear buffer */
    clear() {
        this.buffer = [];
    }

    /** Create child logger with different source */
    child(source) {
        const child = new Logger({
            source: `${this.source}:${source}`,
            level: LEVEL_NAMES[this.minLevel],
            maxBuffer: 0,  // children don't buffer
            silent: this.silent
        });
        // Redirect buffer writes to parent
        child.buffer = this.buffer;
        child.maxBuffer = this.maxBuffer;
        return child;
    }
}

module.exports = { Logger, LEVELS };
