// HAZOOM OS - LLM Engine
// Live AI interaction with Ollama integration

class LLMEngine {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || 'http://localhost:11434';
        this.currentModel = config.model || 'qwen2.5-coder:quantum';
        this.temperature = config.temperature || 0.7;
        this.maxTokens = config.maxTokens || 2048;
        this.systemPrompt = config.systemPrompt || this.getDefaultSystemPrompt();
        this.conversationHistory = [];
        this.isProcessing = false;
        this.streamingCallback = null;
        this.systemContext = {};
    }

    getDefaultSystemPrompt() {
        return `You are the Quantum Intelligence layer of HAZOOM OS, an advanced agentic operating system created by Hazem Soussi.

Your capabilities:
- Answer questions about the HAZOOM OS environment and system state
- Help users orchestrate OS tasks and applications
- Provide intelligent suggestions and code assistance
- Maintain awareness of system context and running applications
- Bridge human creativity with machine precision across quantum boundaries

Communication style:
- Professional yet friendly
- Quantum-inspired metaphors when appropriate
- Concise and actionable responses
- Use technical terms accurately
- Include "quantum thoughts" showing your reasoning

System Context Awareness:
- You have access to HAZOOM OS state
- You can interact with applications and services
- You understand the OS architecture and capabilities

Be helpful, intelligent, and aware of your role in the HAZOOM OS ecosystem.`;
    }

    setSystemContext(context) {
        this.systemContext = { ...this.systemContext, ...context };
    }

    setCurrentModel(model) {
        this.currentModel = model;
    }

    addMessage(role, content) {
        this.conversationHistory.push({ role, content });
        // Keep last 10 messages to stay within context window
        if (this.conversationHistory.length > 10) {
            this.conversationHistory.shift();
        }
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    async generateResponse(prompt, options = {}) {
        const stream = options.stream !== false;
        const onProgress = options.onProgress || null;
        const onThought = options.onThought || null;
        const onComplete = options.onComplete || null;

        this.isProcessing = true;

        try {
            // Build system prompt with context
            const systemPrompt = this.buildSystemPrompt();

            const messages = [
                { role: 'system', content: systemPrompt },
                ...this.conversationHistory,
                { role: 'user', content: prompt }
            ];

            if (stream && onProgress) {
                await this.streamResponse(messages, onProgress, onThought, onComplete);
            } else {
                const response = await this.generateNonStream(messages);
                this.addMessage('user', prompt);
                this.addMessage('assistant', response);
                if (onComplete) onComplete(response);
                return response;
            }
        } catch (error) {
            console.error('LLM Engine Error:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    buildSystemPrompt() {
        let prompt = this.systemPrompt;

        if (Object.keys(this.systemContext).length > 0) {
            prompt += '\n\nCurrent System Context:\n';
            for (const [key, value] of Object.entries(this.systemContext)) {
                prompt += `- ${key}: ${JSON.stringify(value)}\n`;
            }
        }

        return prompt;
    }

    async fetchWithRetry(url, options, retries = 3, backoff = 1000) {
        for (let i = 0; i <= retries; i++) {
            try {
                const response = await fetch(url, options);

                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After');
                    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : backoff * Math.pow(2, i);
                    console.warn(`⚠️ Rate limit hit. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);

                    if (i === retries) {
                        throw new Error(`Rate limit exceeded after ${retries} retries.`);
                    }

                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response;
            } catch (error) {
                if (i === retries) throw error;
                console.warn(`Request failed: ${error.message}. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, backoff));
            }
        }
    }

    async streamResponse(messages, onProgress, onThought, onComplete) {
        const response = await this.fetchWithRetry(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.currentModel,
                messages: messages,
                stream: true,
                options: {
                    temperature: this.temperature,
                    num_predict: this.maxTokens
                }
            })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let lastThought = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const json = JSON.parse(data);
                        if (json.message && json.message.content) {
                            const content = json.message.content;

                            // Check for quantum thoughts (lines starting with //)
                            const thoughtMatch = content.match(/^(\/\/[^\\n]*)(\\n)?/);
                            if (thoughtMatch && thoughtMatch[1] !== lastThought) {
                                const thought = thoughtMatch[1];
                                lastThought = thought;
                                if (onThought) onThought(thought);
                            }

                            // Extract actual content (after thought if present)
                            const actualContent = content.replace(/^\/\/[^\\n]*\\n?/, '');
                            fullResponse += actualContent;

                            if (onProgress) {
                                onProgress(actualContent, fullResponse);
                            }
                        }

                        // Check for done flag
                        if (json.done) {
                            this.addMessage('user', messages[messages.length - 1].content);
                            this.addMessage('assistant', fullResponse);
                            if (onComplete) onComplete(fullResponse);
                            return;
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
    }

    async generateNonStream(messages) {
        const response = await this.fetchWithRetry(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.currentModel,
                messages: messages,
                stream: false,
                options: {
                    temperature: this.temperature,
                    num_predict: this.maxTokens
                }
            })
        });

        const data = await response.json();
        return data.message.content;
    }

    async getAvailableModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            const data = await response.json();
            return data.models || [];
        } catch (error) {
            console.error('Error fetching models:', error);
            return [];
        }
    }

    async getModelInfo(model) {
        try {
            const response = await fetch(`${this.baseUrl}/api/show`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: model })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching model info:', error);
            return null;
        }
    }
}

// Export for use in apps
if (typeof window !== 'undefined') {
    window.LLMEngine = LLMEngine;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LLMEngine;
}