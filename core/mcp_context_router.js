/**
 * MCP Context Router - Hazoom OS Online Search Engine
 * Provides context resolution for online search capabilities
 */

class MCPContextRouter {
    constructor() {
        this.servers = {
            memory: new MemoryServer(),
            filesystem: new FileServer(),
            vertexai: new VertexAIServer(),
            opencode: new OpenCodeServer(),
            sentinel: new SentinelServer(),
            // New online search server
            online: new OnlineSearchServer()
        };
        
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
    }

    /**
     * Nano Search - Intelligent context resolution
     */
    async nanoSearch(query) {
        console.log(`🔍 MCP Nano Search: ${query}`);
        
        // Auto-detect relevant sources based on query
        const sources = this.detectSources(query);
        console.log(`📡 Detected sources: ${sources.join(', ')}`);
        
        // Check cache first
        const cacheKey = `${sources.join('_')}_${query}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('💾 Returning cached result');
                return cached.data;
            } else {
                this.cache.delete(cacheKey);
            }
        }
        
        // Fetch from all relevant servers in parallel
        const promises = sources.map(source => {
            if (this.servers[source]) {
                return this.servers[source].fetch(query)
                    .then(result => ({ source, result }))
                    .catch(error => ({ source, error: error.message }));
            }
            return Promise.resolve({ source, error: 'Server not found' });
        });
        
        const results = await Promise.all(promises);
        
        // Process and merge results
        const processedResults = {};
        results.forEach(({ source, result, error }) => {
            if (error) {
                processedResults[source] = { error };
            } else {
                processedResults[source] = result;
            }
        });
        
        // Cache the results
        this.cache.set(cacheKey, {
            data: processedResults,
            timestamp: Date.now()
        });
        
        return processedResults;
    }

    /**
     * Detect which servers are relevant for a query
     */
    detectSources(query) {
        const lowerQuery = query.toLowerCase();
        const sources = new Set(['memory', 'filesystem']); // Always include basic sources
        
        // Add online search for web-related queries
        if (this.isWebQuery(lowerQuery)) {
            sources.add('online');
        }
        
        // Add AI for complex queries
        if (this.isComplexQuery(lowerQuery)) {
            sources.add('vertexai');
        }
        
        // Add execution for task-oriented queries
        if (this.isTaskQuery(lowerQuery)) {
            sources.add('opencode');
        }
        
        return Array.from(sources);
    }

    isWebQuery(query) {
        return /search|find|lookup|google|bing|yahoo|web|internet|online|browse|url|link|site|page/.test(query);
    }

    isComplexQuery(query) {
        return /analyze|explain|summarize|compare|evaluate|complex|difficult/.test(query);
    }

    isTaskQuery(query) {
        return /run|execute|do|perform|create|build|make|generate|implement/.test(query);
    }

    /**
     * Resolve context from specific sources
     */
    async resolveContext(query, sources = null) {
        if (!sources) {
            sources = this.detectSources(query);
        }
        
        return this.nanoSearch(query);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ MCP Context Router cache cleared');
    }

    /**
     * Get server info
     */
    getServerInfo() {
        return Object.keys(this.servers).map(name => ({
            name: `:${name.toUpperCase()}`,
            status: 'active',
            capabilities: this.servers[name].capabilities
        }));
    }
}

/**
 * Memory Server - User preferences and session state
 */
class MemoryServer {
    constructor() {
        this.capabilities = ['preferences', 'session', 'history', 'project'];
    }

    async fetch(query) {
        // Simulate fetching from browser storage
        const prefs = JSON.parse(localStorage.getItem('hazoom_user_prefs') || '{}');
        const session = JSON.parse(sessionStorage.getItem('hazoom_session') || '{}');
        
        return {
            preferences: prefs,
            session: session,
            query: query
        };
    }
}

/**
 * File System Server - Local file search
 */
class FileServer {
    constructor() {
        this.capabilities = ['documents', 'code', 'config'];
    }

    async fetch(query) {
        // Simulate fetching from local file system
        const fs = window.parent?.FileSystem;
        if (fs && typeof fs.search === 'function') {
            return {
                files: fs.search(query),
                query: query
            };
        }
        return {
            files: [],
            query: query
        };
    }
}

/**
 * Vertex AI Server - AI model integration
 */
class VertexAIServer {
    constructor() {
        this.capabilities = ['models', 'endpoints', 'embeddings'];
    }

    async fetch(query) {
        return {
            models: ['gemma-3-4b-it', 'llama-3.2-3b-instruct'],
            endpoints: ['local', 'cloud'],
            query: query
        };
    }
}

/**
 * OpenCode Server - Self-healing execution
 */
class OpenCodeServer {
    constructor() {
        this.capabilities = ['tools', 'scripts', 'templates'];
    }

    async fetch(query) {
        return {
            tools: ['shell.execute', 'file.create', 'git.commit'],
            query: query
        };
    }
}

/**
 * Sentinel Server - Security monitoring
 */
class SentinelServer {
    constructor() {
        this.capabilities = ['threats', 'audit_log'];
    }

    async fetch(query) {
        return {
            threats: [],
            audit_log: [],
            query: query
        };
    }
}

/**
 * Online Search Server - Web search capabilities
 */
class OnlineSearchServer {
    constructor() {
        this.capabilities = ['web_search', 'url_lookup', 'content_extraction'];
        this.searchEngines = {
            google: 'https://www.google.com/search?q=',
            duckduckgo: 'https://duckduckgo.com/?q=',
            bing: 'https://www.bing.com/search?q=',
            // Custom Hazoom search endpoint
            hazoom: 'https://api.hazoom-search.com/search?q='
        };
    }

    async fetch(query) {
        console.log(`🌐 Online search for: ${query}`);
        
        try {
            // Perform web search using multiple engines
            const results = await this.performWebSearch(query);
            return {
                success: true,
                query: query,
                results: results,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Online search failed:', error);
            return {
                success: false,
                query: query,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async performWebSearch(query) {
        // Use DuckDuckGo as default for privacy
        const searchUrl = this.searchEngines.duckduckgo + encodeURIComponent(query);
        
        // Create a temporary iframe to perform the search
        // Note: This is a simplified version - in reality, we'd need a backend proxy
        // due to CORS restrictions
        
        // For now, simulate the search with a mock response
        // In a real implementation, this would call a backend service
        return this.mockWebSearch(query);
    }

    async mockWebSearch(query) {
        // Simulate search results
        return {
            engine: 'Hazoom Search',
            query: query,
            results: [
                {
                    title: `Hazoom Search Results for "${query}"`,
                    url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                    snippet: `Showing search results for "${query}" from Hazoom Search Engine`,
                    type: 'search_result'
                },
                {
                    title: 'Related Topics',
                    url: '#',
                    snippet: 'AI, Machine Learning, Web Technologies',
                    type: 'related'
                }
            ],
            took: 0.123,
            total_results: 1000000
        };
    }

    /**
     * Perform actual web search via backend proxy
     */
    async performRealWebSearch(query) {
        try {
            // Call backend proxy to avoid CORS issues
            const response = await fetch('/api/web-search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Real web search failed:', error);
            // Fall back to mock search
            return this.mockWebSearch(query);
        }
    }
}

// Export the MCP Context Router
if (typeof window !== 'undefined') {
    window.MCPContextRouter = MCPContextRouter;
    
    // Create a global instance
    window.mcp = new MCPContextRouter();
    
    console.log('🧬 MCP Context Router initialized');
    console.log('📡 Available servers:', Object.keys(window.mcp.servers));
}

export { MCPContextRouter };