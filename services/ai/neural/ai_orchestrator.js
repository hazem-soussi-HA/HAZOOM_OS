// HAZOOM OS - AI Orchestrator
// Manages multiple AI interactions and system-wide AI coordination

class AIOrchestrator {
    constructor() {
        this.agents = new Map();
        this.conversations = new Map();
        this.modelRegistry = new Map();
        this.activeConversation = null;
        this.systemHooks = new Map();
        this.eventBus = new EventTarget();
    }

    // Agent Management
    registerAgent(id, agent) {
        this.agents.set(id, {
            ...agent,
            status: 'idle',
            lastActive: Date.now()
        });
        this.dispatchEvent('agent-registered', { id, agent });
    }

    getAgent(id) {
        return this.agents.get(id);
    }

    getAllAgents() {
        return Array.from(this.agents.values());
    }

    // Conversation Management
    createConversation(id, options = {}) {
        const conversation = {
            id,
            model: options.model || 'qwen2.5-coder:quantum',
            messages: [],
            context: options.context || {},
            metadata: {
                created: Date.now(),
                updated: Date.now(),
                title: options.title || 'Untitled'
            },
            settings: {
                temperature: options.temperature || 0.7,
                maxTokens: options.maxTokens || 2048,
                stream: options.stream !== false
            }
        };

        this.conversations.set(id, conversation);
        this.setActiveConversation(id);
        this.dispatchEvent('conversation-created', { id, conversation });
        return conversation;
    }

    getConversation(id) {
        return this.conversations.get(id);
    }

    getAllConversations() {
        return Array.from(this.conversations.values());
    }

    setActiveConversation(id) {
        this.activeConversation = id;
        this.dispatchEvent('conversation-activated', { id });
    }

    updateConversation(id, updates) {
        const conv = this.conversations.get(id);
        if (conv) {
            Object.assign(conv, updates);
            conv.metadata.updated = Date.now();
            this.dispatchEvent('conversation-updated', { id, conversation: conv });
        }
    }

    deleteConversation(id) {
        if (this.conversations.has(id)) {
            this.conversations.delete(id);
            if (this.activeConversation === id) {
                this.activeConversation = null;
            }
            this.dispatchEvent('conversation-deleted', { id });
        }
    }

    // Message Management
    addMessage(conversationId, role, content, metadata = {}) {
        const conv = this.conversations.get(conversationId);
        if (!conv) return null;

        const message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role,
            content,
            timestamp: Date.now(),
            metadata
        };

        conv.messages.push(message);
        conv.metadata.updated = Date.now();

        this.dispatchEvent('message-added', {
            conversationId,
            message,
            conversation: conv
        });

        return message;
    }

    // Model Management
    async loadModels(llmEngine) {
        const models = await llmEngine.getAvailableModels();
        models.forEach(model => {
            this.modelRegistry.set(model.name, model);
        });
        this.dispatchEvent('models-loaded', { models });
        return models;
    }

    getModels() {
        return Array.from(this.modelRegistry.values());
    }

    getModel(name) {
        return this.modelRegistry.get(name);
    }

    // System Hooks
    registerHook(event, handler) {
        if (!this.systemHooks.has(event)) {
            this.systemHooks.set(event, []);
        }
        this.systemHooks.get(event).push(handler);
    }

    triggerHook(event, data) {
        const handlers = this.systemHooks.get(event) || [];
        return handlers.map(handler => handler(data));
    }

    // Event Bus
    dispatchEvent(type, data) {
        const event = new CustomEvent(type, { detail: data });
        this.eventBus.dispatchEvent(event);
    }

    addEventListener(type, callback) {
        this.eventBus.addEventListener(type, (e) => callback(e.detail));
    }

    removeEventListener(type, callback) {
        this.eventBus.removeEventListener(type, callback);
    }

    // AI Orchestration
    async executeAgentTask(agentId, task, context = {}) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        agent.status = 'processing';
        agent.lastActive = Date.now();
        this.dispatchEvent('agent-started', { id: agentId, task });

        try {
            const result = await agent.handler(task, context);
            agent.status = 'idle';
            this.dispatchEvent('agent-completed', { id: agentId, task, result });
            return result;
        } catch (error) {
            agent.status = 'error';
            this.dispatchEvent('agent-failed', { id: agentId, task, error });
            throw error;
        }
    }

    // Multi-Agent Coordination
    async coordinateAgents(agents, task) {
        const promises = agents.map(agentId =>
            this.executeAgentTask(agentId, task, { coordination: true })
        );

        try {
            const results = await Promise.all(promises);
            this.dispatchEvent('coordination-completed', { task, results });
            return results;
        } catch (error) {
            this.dispatchEvent('coordination-failed', { task, error });
            throw error;
        }
    }

    // Context Management
    getGlobalContext() {
        return {
            timestamp: Date.now(),
            activeConversation: this.activeConversation,
            agentsCount: this.agents.size,
            conversationsCount: this.conversations.size,
            availableModels: this.modelRegistry.size
        };
    }

    setGlobalContext(context) {
        // Update system-wide context for all conversations
        this.conversations.forEach(conv => {
            conv.context = { ...conv.context, ...context };
        });
        this.dispatchEvent('context-updated', context);
    }

    // Persistence
    async saveState(storage) {
        const state = {
            conversations: Array.from(this.conversations.entries()),
            models: Array.from(this.modelRegistry.entries()),
            activeConversation: this.activeConversation,
            timestamp: Date.now()
        };

        await storage.setItem('ai_orchestrator_state', JSON.stringify(state));
        this.dispatchEvent('state-saved', state);
    }

    async loadState(storage) {
        try {
            const data = await storage.getItem('ai_orchestrator_state');
            if (!data) return;

            const state = JSON.parse(data);
            this.conversations = new Map(state.conversations);
            this.modelRegistry = new Map(state.models);
            this.activeConversation = state.activeConversation;

            this.dispatchEvent('state-loaded', state);
            return state;
        } catch (error) {
            console.error('Error loading AI orchestrator state:', error);
            return null;
        }
    }

    async clearState(storage) {
        await storage.removeItem('ai_orchestrator_state');
        this.conversations.clear();
        this.modelRegistry.clear();
        this.activeConversation = null;
        this.dispatchEvent('state-cleared');
    }

    // Analytics
    getAnalytics() {
        const conversations = this.getAllConversations();
        const allMessages = conversations.flatMap(c => c.messages);

        return {
            totalConversations: conversations.length,
            totalMessages: allMessages.length,
            userMessages: allMessages.filter(m => m.role === 'user').length,
            aiMessages: allMessages.filter(m => m.role === 'assistant').length,
            activeAgents: this.agents.size,
            availableModels: this.modelRegistry.size,
            activeConversation: this.activeConversation
        };
    }

    // Export/Import
    exportConversation(id, format = 'json') {
        const conv = this.conversations.get(id);
        if (!conv) return null;

        switch (format) {
            case 'json':
                return JSON.stringify(conv, null, 2);
            case 'markdown':
                return this.conversationToMarkdown(conv);
            case 'txt':
                return this.conversationToText(conv);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    conversationToMarkdown(conv) {
        let md = `# ${conv.metadata.title}\n\n`;
        md += `Created: ${new Date(conv.metadata.created).toLocaleString()}\n`;
        md += `Model: ${conv.model}\n\n`;
        md += `---\n\n`;

        conv.messages.forEach(msg => {
            md += `### ${msg.role === 'user' ? '👤 User' : '🤖 AI'}\n`;
            md += `${msg.content}\n\n`;
        });

        return md;
    }

    conversationToText(conv) {
        let txt = `Conversation: ${conv.metadata.title}\n`;
        txt += `${'='.repeat(50)}\n\n`;

        conv.messages.forEach(msg => {
            const role = msg.role === 'user' ? 'USER' : 'AI';
            const time = new Date(msg.timestamp).toLocaleTimeString();
            txt += `[${time}] ${role}:\n${msg.content}\n\n`;
        });

        return txt;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.AIOrchestrator = AIOrchestrator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIOrchestrator;
}