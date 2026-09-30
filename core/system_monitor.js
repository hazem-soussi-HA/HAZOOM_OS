/**
 * HAZOOM OS V6 — System Monitor Hook (from AlphaPony recovery)
 * Real-time system metrics with auto-polling, WebSocket support,
 * and mount-safety guards.
 */
(function(window) {
    'use strict';
    if (window.useSystemMonitor) return;

    const REFRESH_INTERVAL = 5000;
    const BYTES_PER_MB = 1024 * 1024;
    const MS_PER_SECOND = 1000;

    class SystemMonitor {
        constructor(options = {}) {
            this.interval = options.interval || REFRESH_INTERVAL;
            this.onUpdate = options.onUpdate || (() => {});
            this._metrics = this._emptyMetrics();
            this._health = this._emptyHealth();
            this._running = false;
            this._timer = null;
            this._ws = null;
            this._polling = false;
        }

        get metrics() { return { ...this._metrics }; }
        get health() { return { ...this._health }; }

        _emptyMetrics() {
            return {
                cpu: null,
                memory: null,
                totalMemory: null,
                memoryBytes: null,
                totalMemoryBytes: null,
                processes: null,
                uptime: null,
                uptimeMs: null,
                available: false,
                status: 'unavailable'
            };
        }

        _emptyHealth(error = null) {
            return { status: 'unavailable', score: null, checks: [], error };
        }

        _number(value) {
            if (value === null || value === undefined || value === '') return null;
            const number = Number(value);
            return Number.isFinite(number) ? number : null;
        }

        _normalize(data) {
            const source = data && data.metrics && typeof data.metrics === 'object' ? data.metrics : data || {};
            const cpu = this._number(source.cpu && typeof source.cpu === 'object' ? source.cpu.utilization : source.cpu);
            const memory = source.memory && typeof source.memory === 'object' ? source.memory : {};
            const usedBytes = this._number(memory.used ?? memory.usedMemory);
            const totalBytes = this._number(memory.total ?? memory.totalMemory);
            const processes = this._number(source.processes);
            const uptimeMs = this._number(source.uptimeMs ?? source.uptime);
            const running = source.running !== false && source.status !== 'offline';
            const fields = [cpu, usedBytes, totalBytes, processes, uptimeMs];
            const available = fields.every(value => value !== null);
            return {
                cpu,
                memory: usedBytes === null ? null : Math.round(usedBytes / BYTES_PER_MB),
                totalMemory: totalBytes === null ? null : Math.round(totalBytes / BYTES_PER_MB),
                memoryBytes: usedBytes,
                totalMemoryBytes: totalBytes,
                processes,
                uptime: uptimeMs === null ? null : Math.floor(uptimeMs / MS_PER_SECOND),
                uptimeMs,
                available,
                running,
                status: !running ? 'offline' : available ? 'online' : 'degraded'
            };
        }

        _applyPayload(data) {
            this._metrics = this._normalize(data);
            const check = (name, value) => ({
                name,
                status: value === null ? 'unavailable' : 'ok',
                value
            });
            this._health = {
                status: this._metrics.status,
                score: null,
                error: this._metrics.status === 'online' ? null : 'Incomplete metrics payload',
                checks: [
                    check('CPU', this._metrics.cpu),
                    check('Memory', this._metrics.memory),
                    check('Processes', this._metrics.processes),
                    check('Uptime', this._metrics.uptime)
                ]
            };
        }

        _setUnavailable(error) {
            this._metrics = { ...this._emptyMetrics(), error };
            this._health = this._emptyHealth(error);
        }

        start() {
            if (this._running) return;
            this._running = true;
            this._poll();
            this._timer = setInterval(() => this._poll(), this.interval);
        }

        stop() {
            this._running = false;
            if (this._timer) { clearInterval(this._timer); this._timer = null; }
            if (this._ws) { this._ws.close(); this._ws = null; }
        }

        async _poll() {
            if (this._polling) return;
            this._polling = true;
            try {
                const response = await fetch('/api/system/metrics', {
                    cache: 'no-store',
                    headers: { Accept: 'application/json' }
                });
                if (!response.ok) {
                    this._setUnavailable(`HTTP ${response.status}`);
                } else {
                    this._applyPayload(await response.json());
                }
            } catch (error) {
                this._setUnavailable(error.message || 'Metrics unavailable');
            } finally {
                this._polling = false;
            }
            this.onUpdate(this._metrics, this._health);
        }

        connectWebSocket(url) {
            if (this._ws) this._ws.close();
            try {
                this._ws = new WebSocket(url);
                this._ws.onmessage = (event) => {
                    try {
                        this._applyPayload(JSON.parse(event.data));
                        this.onUpdate(this._metrics, this._health);
                    } catch (error) {
                        this._setUnavailable(error.message || 'Invalid metrics payload');
                        this.onUpdate(this._metrics, this._health);
                    }
                };
                this._ws.onerror = () => {
                    this._setUnavailable('Metrics stream unavailable');
                    this.onUpdate(this._metrics, this._health);
                    this._ws = null;
                };
            } catch (error) {
                this._setUnavailable(error.message || 'Metrics stream unavailable');
                this.onUpdate(this._metrics, this._health);
            }
        }

        destroy() { this.stop(); }
    }

    window.SystemMonitor = SystemMonitor;
})(window);
