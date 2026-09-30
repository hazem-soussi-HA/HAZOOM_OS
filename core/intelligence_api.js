'use strict';

/**
 * HAZOOM OS — Intelligence API
 *
 * Exposes the kernel's real reasoning core (core/intelligence-core.js) over HTTP.
 * The IntelligenceCore was previously initialised by the kernel but reachable
 * from nowhere: the desktop could only read a legacy chat service on a hardcoded
 * port, so the UI reported "AI offline" while a working local model sat idle.
 *
 * These routes are the single, honest surface for the system's intelligence:
 *   GET  /api/v1/intelligence/status  — model, availability, measured latency
 *   GET  /api/v1/intelligence/health  — cheap liveness for the UI badge
 *   POST /api/v1/intelligence/think   — one-shot real reasoning (authenticated)
 *   POST /api/v1/intelligence/stream  — token streaming via SSE (authenticated)
 *   POST /api/v1/intelligence/reset   — clear rolling conversation memory
 *
 * Design rules:
 *   - Never fabricate a healthy answer. If the model is unreachable, say so.
 *   - Never block boot or health on a long generation.
 *   - Authenticate anything that spends compute or touches memory.
 */

const MAX_PROMPT_CHARS = 8000;

class IntelligenceAPI {
    constructor(kernel, config = {}) {
        this.kernel = kernel;
        this.logger = config.logger || console;
        this.auth = config.authManager || kernel.authManager;
        this.noStore = (res) => {
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('X-Content-Type-Options', 'nosniff');
        };
    }

    get core() {
        return this.kernel?.intelligence || null;
    }

    _unavailable(res) {
        return res.status(503).json({
            error: 'Reasoning core is not initialised',
            code: 'INTELLIGENCE_UNAVAILABLE',
            available: false
        });
    }

    /** Honest availability: a model is usable when Ollama reports it installed. */
    _snapshot() {
        const core = this.core;
        if (!core) return { available: false, reason: 'not initialised' };
        const status = core.getStatus();
        return {
            available: Boolean(status.enabled && status.available),
            model: status.activeModel,
            warm: status.warm,
            warmMs: status.warmMs,
            offline: status.offline,
            lastError: status.lastError,
            totalInferences: status.totalInferences
        };
    }

    register(router) {
        const protect = this.auth ? this.auth.authenticate.bind(this.auth) : (req, res) =>
            res.status(401).json({ error: 'Authentication required', code: 'NO_TOKEN' });
        const asyncHandler = handler => (req, res, next) =>
            Promise.resolve(handler(req, res, next)).catch(next);

        router.get('/api/v1/intelligence/status', (req, res) => {
            this.noStore(res);
            const core = this.core;
            if (!core) return this._unavailable(res);
            res.json({ ...core.getStatus(), timestamp: new Date().toISOString() });
        });

        // Cheap, generation-free liveness for the desktop status bar.
        router.get('/api/v1/intelligence/health', asyncHandler(async (req, res) => {
            this.noStore(res);
            const core = this.core;
            if (!core) return this._unavailable(res);
            const health = await core.health();
            res.json({
                status: health.ok ? 'online' : 'offline',
                model: health.model || core.model || null,
                reason: health.reason || null,
                warm: core.warm || 'pending',
                warmMs: core.warmMs ?? null,
                timestamp: new Date().toISOString()
            });
        }));

        router.post('/api/v1/intelligence/think', protect, asyncHandler(async (req, res) => {
            this.noStore(res);
            const core = this.core;
            if (!core) return this._unavailable(res);

            const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
            if (!prompt) {
                return res.status(400).json({ error: 'prompt is required', code: 'VALIDATION' });
            }
            if (prompt.length > MAX_PROMPT_CHARS) {
                return res.status(413).json({ error: `prompt exceeds ${MAX_PROMPT_CHARS} characters`, code: 'PROMPT_TOO_LONG' });
            }

            const result = await core.think(prompt);
            res.status(result.offline ? 503 : 200).json({ ...result, timestamp: new Date().toISOString() });
        }));

        router.post('/api/v1/intelligence/stream', protect, (req, res) => {
            this.noStore(res);
            const core = this.core;
            if (!core) return this._unavailable(res);

            const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
            if (!prompt) {
                return res.status(400).json({ error: 'prompt is required', code: 'VALIDATION' });
            }
            if (prompt.length > MAX_PROMPT_CHARS) {
                return res.status(413).json({ error: `prompt exceeds ${MAX_PROMPT_CHARS} characters`, code: 'PROMPT_TOO_LONG' });
            }

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            res.flushHeaders?.();

            let closed = false;
            // Track the response, not the request: req 'close' fires as soon as the
            // POST body is consumed and would suppress every event before generation.
            res.on('close', () => { closed = true; });

            const send = event => {
                if (closed) return;
                res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
            };

            core.streamThink(prompt, token => send({ type: 'token', token }))
                .then(result => {
                    send({ type: 'done', ...result });
                    res.end();
                })
                .catch(error => {
                    send({ type: 'error', error: error.message });
                    res.end();
                });
        });

        router.post('/api/v1/intelligence/reset', protect, (req, res) => {
            this.noStore(res);
            const core = this.core;
            if (!core) return this._unavailable(res);
            res.json(core.reset());
        });

        return router;
    }
}

module.exports = { IntelligenceAPI };
