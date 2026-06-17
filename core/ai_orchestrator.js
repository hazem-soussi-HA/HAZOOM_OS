/**
 * HAZOOM OS V3 — AI Orchestrator (Enhanced from AlphaPony)
 * Multi-agent orchestration with event bus, conversation management,
 * deep reasoning, and persistent storage.
 */
(function(window) {
    'use strict';
    if (window.AIOrchestrator) return;

    class AIOrchestrator {
        constructor() {
            this.agents = new Map();
            this.conversations = new Map();
            this.models = new Map();
            this.hooks = new Map();
            this.eventTarget = new EventTarget();
            this.globalContext = {};
            this._state = { conversations: [], messages: [], lastSaved: null };
        }

        // === AGENT MANAGEMENT ===
        registerAgent(id, config) {
            this.agents.set(id, { id, status: 'idle', lastActive: null, ...config });
            this._emit('agent-registered', { agentId: id });
        }

        getAgent(id) { return this.agents.get(id); }
        getAllAgents() { return Array.from(this.agents.values()); }

        async executeAgentTask(agentId, task) {
            const agent = this.agents.get(agentId);
            if (!agent) throw new Error(`Agent ${agentId} not found`);
            agent.status = 'processing';
            agent.lastActive = Date.now();
            this._emit('agent-processing', { agentId });
            try {
                const result = await task();
                agent.status = 'idle';
                this._emit('agent-complete', { agentId, result });
                return result;
            } catch (err) {
                agent.status = 'error';
                this._emit('agent-error', { agentId, error: err.message });
                throw err;
            }
        }

        async coordinateAgents(tasks) {
            const entries = Object.entries(tasks);
            const results = await Promise.all(
                entries.map(([agentId, task]) => this.executeAgentTask(agentId, task).catch(e => ({ error: e.message })))
            );
            return Object.fromEntries(entries.map(([id], i) => [id, results[i]]));
        }

        // === CONVERSATION MANAGEMENT ===
        createConversation(id, meta = {}) {
            const conv = {
                id,
                messages: [],
                metadata: meta,
                settings: { temperature: 0.7, maxTokens: 2048, stream: false, ...meta.settings },
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            this.conversations.set(id, conv);
            this._emit('conversation-created', { conversationId: id });
            return conv;
        }

        getConversation(id) { return this.conversations.get(id); }
        listConversations() { return Array.from(this.conversations.values()); }

        addMessage(conversationId, role, content, meta = {}) {
            const conv = this.conversations.get(conversationId);
            if (!conv) throw new Error(`Conversation ${conversationId} not found`);
            const msg = { id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), role, content, timestamp: Date.now(), ...meta };
            conv.messages.push(msg);
            conv.updatedAt = Date.now();
            this._emit('message-added', { conversationId, message: msg });
            return msg;
        }

        // === EVENT BUS ===
        on(event, handler) {
            this.eventTarget.addEventListener(event, handler);
            return () => this.eventTarget.removeEventListener(event, handler);
        }

        _emit(event, data) {
            this.eventTarget.dispatchEvent(new CustomEvent(event, { detail: data }));
        }

        // === HOOKS SYSTEM ===
        registerHook(name, fn) {
            if (!this.hooks.has(name)) this.hooks.set(name, []);
            this.hooks.get(name).push(fn);
        }

        async triggerHook(name, data) {
            const hooks = this.hooks.get(name) || [];
            const results = [];
            for (const fn of hooks) {
                try { results.push(await fn(data)); } catch (e) { results.push({ error: e.message }); }
            }
            return results;
        }

        // === PERSISTENCE ===
        saveState(storage) {
            const state = {
                conversations: Array.from(this.conversations.entries()),
                models: Array.from(this.models.entries()),
                globalContext: this.globalContext,
                savedAt: Date.now()
            };
            if (storage?.setItem) {
                storage.setItem('hazoom_ai_state', JSON.stringify(state));
            }
            this._state = state;
            return state;
        }

        loadState(storage) {
            let state = null;
            if (storage?.getItem) {
                try { state = JSON.parse(storage.getItem('hazoom_ai_state')); } catch(e) {}
            }
            if (!state) return false;
            if (state.conversations) this.conversations = new Map(state.conversations);
            if (state.models) this.models = new Map(state.models);
            if (state.globalContext) this.globalContext = state.globalContext;
            this._state = state;
            return true;
        }

        clearState(storage) {
            this.conversations.clear();
            this.models.clear();
            this.globalContext = {};
            if (storage?.removeItem) storage.removeItem('hazoom_ai_state');
        }

        // === ANALYTICS ===
        getAnalytics() {
            let totalMessages = 0, userMessages = 0, aiMessages = 0;
            for (const conv of this.conversations.values()) {
                totalMessages += conv.messages.length;
                for (const msg of conv.messages) {
                    if (msg.role === 'user') userMessages++;
                    else aiMessages++;
                }
            }
            return {
                totalConversations: this.conversations.size,
                totalMessages,
                userMessages,
                aiMessages,
                activeAgents: Array.from(this.agents.values()).filter(a => a.status !== 'error').length,
                totalAgents: this.agents.size,
                models: this.models.size
            };
        }

        // === EXPORT ===
        exportConversation(conversationId, format = 'json') {
            const conv = this.conversations.get(conversationId);
            if (!conv) return null;
            if (format === 'json') return JSON.stringify(conv, null, 2);
            if (format === 'markdown') {
                let md = `# Conversation: ${conv.id}\nCreated: ${new Date(conv.createdAt).toISOString()}\n\n`;
                for (const msg of conv.messages) {
                    const role = msg.role === 'user' ? '**User**' : '**AI**';
                    md += `${role} (${new Date(msg.timestamp).toLocaleTimeString()}):\n${msg.content}\n\n`;
                }
                return md;
            }
            if (format === 'text') {
                return conv.messages.map(m => `[${m.role}] ${m.content}`).join('\n\n');
            }
            return conv;
        }

        setGlobalContext(ctx) { this.globalContext = { ...this.globalContext, ...ctx }; }
        getGlobalContext() { return { ...this.globalContext }; }
    }

    window.AIOrchestrator = AIOrchestrator;
})(window);
