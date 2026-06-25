/**
 * HAZOOM OS v5.0 — WebSocket Handler
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

        this.wss.on('connection', (ws, req) => this._onConnect(ws, req));

        this.kernel.on = this.kernel.on || function() {}; // ensure event-like
        this.logger = config.logger || console;
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

        // Periodic kernel ticks + state updates
        const tickTimer = setInterval(() => {
            if (!this.kernel.running) return;

            // Kernel tick
            const tickResult = this.kernel.tick();

            // Q-learning tick
            let qAction = null;
            if (this.kernel.qLearner) {
                const state = this.apiRouter._getOSState();
                qAction = this.kernel.qLearner.onTick(
                    this.kernel.qLearner.lastState || state,
                    state,
                    null // action execution happens inside kernel
                );
            }

            // Push update to client
            if (ws.readyState === 1) {
                ws.send(JSON.stringify({
                    type: 'tick',
                    state: this.apiRouter.getKernelState(),
                    tickResult,
                    qAction
                }));
            }
        }, this.tickInterval);

        // Handle incoming messages from client
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                this._handleMessage(ws, msg);
            } catch (e) {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
            }
        });

        ws.on('close', () => {
            clearInterval(tickTimer);
            this.clients.delete(ws);
            this.logger.info ? this.logger.info(`[WS] Client disconnected (${this.clients.size} total)`)
                              : console.log(`[WS] Client disconnected (${this.clients.size} total)`);
        });

        ws.on('error', () => {
            clearInterval(tickTimer);
            this.clients.delete(ws);
        });
    }

    _handleMessage(ws, msg) {
        switch (msg.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
            case 'command':
                // Execute terminal command via kernel
                if (msg.command) {
                    // Could route to terminal emulator here
                    ws.send(JSON.stringify({
                        type: 'command_result',
                        command: msg.command,
                        result: 'Command routing not yet implemented in WS'
                    }));
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

    /** Broadcast consciousness event */
    broadcastConsciousness(event) {
        for (const ws of this.clients) {
            if (ws.readyState === 1 && ws.subscriptions?.has('consciousness')) {
                ws.send(JSON.stringify({ type: 'consciousness', event }));
            }
        }
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
