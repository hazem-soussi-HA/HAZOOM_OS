/**
 * HAZOOM OS v6.0 — WebSocket Handler
 * Real-time kernel updates, Q-learning events, and consciousness notifications.
 * 
 * Copyright © 2024-2026 Hazem Soussi — All Rights Reserved
 */

'use strict';

const { WebSocketServer } = require('ws');

class WebSocketHandler {
    constructor(server, kernel, apiRouter, config = {}) {
        this.kernel = kernel;
        this.apiRouter = apiRouter;
        this.tickInterval = config.tickInterval || 2000;
        this.maxClients = config.maxClients || 50;

        this.wss = new WebSocketServer({ server });
        this.clients = new Set();
        this.shell = config.shell || null;
        this.authManager = config.authManager || null;

        this.kernel.on = this.kernel.on || function() {}; // ensure event-like
        this.logger = config.logger || console;

        this.wss.on('connection', (ws, req) => this._onConnect(ws, req));
        this.wss.on('close', () => {
            this._stopTicking();
            this.clients.clear();
        });

        this.tickTimer = setInterval(() => this._tick(), this.tickInterval);
        if (this.tickTimer && this.tickTimer.unref) this.tickTimer.unref();
    }

    _stopTicking() {
        if (this.tickTimer) {
            clearInterval(this.tickTimer);
            this.tickTimer = null;
        }
    }

    _tick() {
        if (!this.kernel.running) return;

        const tickResult = { source: 'kernel-heartbeat' };
        let qAction = null;
        if (this.kernel.qLearner) {
            const state = this.apiRouter._getOSState();
            qAction = this.kernel.qLearner.onTick(
                this.kernel.qLearner.lastState || state,
                state,
                null
            );
        }

        this.broadcast({
            type: 'tick',
            state: this.apiRouter.getKernelState(),
            tickResult,
            qAction
        });
    }

    _removeClient(ws) {
        if (!this.clients.delete(ws)) return;
        this.logger.info ? this.logger.info(`[WS] Client disconnected (${this.clients.size} total)`)
                          : console.log(`[WS] Client disconnected (${this.clients.size} total)`);
    }

    _extractBearerToken(value) {
        if (typeof value !== 'string') return null;
        const token = value.trim();
        if (!token) return null;
        return token.replace(/^Bearer\s+/i, '').trim() || null;
    }

    _hasAdminToken(msg) {
        if (!this.authManager) return false;
        for (const value of [msg?.token, msg?.authorization]) {
            const token = this._extractBearerToken(value);
            if (!token) continue;
            if (typeof this.authManager.isAdminToken === 'function') {
                if (this.authManager.isAdminToken(token)) return true;
                continue;
            }
            if (typeof this.authManager.verifyToken !== 'function') continue;
            const decoded = this.authManager.verifyToken(token);
            if (decoded?.body?.role === 'admin' || decoded?.role === 'admin') return true;
        }
        return false;
    }

    _onConnect(ws, req) {
        if (this.clients.size >= this.maxClients) {
            ws.send(JSON.stringify({ type: 'error', message: 'Max clients reached' }));
            ws.close();
            return;
        }

        this.clients.add(ws);
        this.logger.info ? this.logger.info(`[WS] Client connected (${this.clients.size} total)`)
                          : console.log(`[WS] Client connected (${this.clients.size} total)`);

        // Send initial state
        ws.send(JSON.stringify({
            type: 'connected',
            kernel: this.apiRouter.getKernelState()
        }));

        // Handle incoming messages from client
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                Promise.resolve(this._handleMessage(ws, msg)).catch(() => {
                    if (ws.readyState === 1) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Message handling failed' }));
                    }
                });
            } catch (e) {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
            }
        });

        ws.on('close', () => this._removeClient(ws));
        ws.on('error', () => this._removeClient(ws));
    }

    async _handleMessage(ws, msg) {
        switch (msg.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
            case 'command':
                if (!this._hasAdminToken(msg)) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        code: 'ADMIN_AUTH_REQUIRED',
                        message: 'Admin authentication required'
                    }));
                    break;
                }
                if (msg.command) {
                    if (this.shell) {
                        const result = await this.shell.execute(msg.command);
                        ws.send(JSON.stringify({
                            type: 'command_result',
                            command: msg.command,
                            result: result.output,
                            allowed: result.allowed,
                            exitCode: result.exitCode,
                            duration: result.duration
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: 'command_result',
                            command: msg.command,
                            result: 'Shell executor not loaded'
                        }));
                    }
                }
                break;
            case 'subscribe':
                // Subscribe to specific event types
                ws.subscriptions = ws.subscriptions || new Set();
                if (msg.events) {
                    msg.events.forEach(e => ws.subscriptions.add(e));
                }
                ws.send(JSON.stringify({ type: 'subscribed', events: [...(ws.subscriptions || [])] }));
                break;
            default:
                ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${msg.type}` }));
        }
    }

    /** Broadcast to all connected clients */
    broadcast(message) {
        const data = JSON.stringify(message);
        for (const ws of this.clients) {
            if (ws.readyState === 1) {
                ws.send(data);
            }
        }
    }

    /** Broadcast Q-learning event */
    broadcastQLearning(event) {
        this.broadcast({ type: 'qlearning', event });
    }

    /** Broadcast GitHub observation event (push / PR / workflow run).
     *  Sent to clients subscribed to 'github', or all when unsubscribed. */
    broadcastGitHub(payload) {
        const data = JSON.stringify(payload);
        for (const ws of this.clients) {
            if (ws.readyState !== 1) continue;
            const subs = ws.subscriptions;
            if (!subs || subs.size === 0 || subs.has('github')) {
                ws.send(data);
            }
        }
    }

    /** Broadcast consciousness event */
    broadcastConsciousness(event) {
        for (const ws of this.clients) {
            if (ws.readyState === 1 && ws.subscriptions?.has('consciousness')) {
                ws.send(JSON.stringify({ type: 'consciousness', event }));
            }
        }
    }

    close() {
        this._stopTicking();
        for (const ws of this.clients) {
            try {
                ws.close();
            } catch (e) {}
        }
        this.clients.clear();
        try {
            this.wss.close();
        } catch (e) {}
    }

    getStats() {
        return {
            connectedClients: this.clients.size,
            maxClients: this.maxClients,
            tickInterval: this.tickInterval
        };
    }
}

module.exports = { WebSocketHandler };
