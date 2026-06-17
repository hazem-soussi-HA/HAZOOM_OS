/**
 * Hazoom Search Engine - MCP-Powered Online Search
 * 
 * This creates a custom search engine using MCP (Model Context Protocol) principles
 * that integrates with Hazoom OS to provide context-aware web search capabilities.
 */

// Register the search engine with the system
function registerHazoomSearch() {
    console.log('🔍 Initializing Hazoom Search Engine...');
    
    // Register with the app registry if available
    if (window.AppRegistry) {
        window.AppRegistry.registerApp('hazoom_search', {
            name: 'Hazoom Search',
            icon: '🔍',
            category: 'tools'
        });
        console.log('✅ Hazoom Search registered with AppRegistry');
    }
    
    // Add to desktop if HAZOOM is available
    if (window.HAZOOM && window.HAZOOM.registerApp) {
        window.HAZOOM.registerApp('hazoom_search', {
            name: 'Hazoom Search', 
            icon: '🔍'
        });
        console.log('✅ Hazoom Search added to desktop');
    }
}

// MCP-powered search function
async function hazoomSearch(query) {
    console.log(`🔍 Performing Hazoom Search for: ${query}`);
    
    // Use MCP context router if available
    if (window.mcp) {
        try {
            console.log('📡 Using MCP Context Router for search...');
            const context = await window.mcp.nanoSearch(query);
            return processSearchResults(context, query);
        } catch (error) {
            console.error('MCP search failed:', error);
            // Fall back to basic search
        }
    }
    
    // Fallback to basic search
    return basicWebSearch(query);
}

// Process search results from MCP context
function processSearchResults(context, query) {
    console.log('📦 Processing MCP search results...');
    
    const results = [];
    
    // Process results from different MCP servers
    for (const [source, data] of Object.entries(context)) {
        if (data.error) {
            console.warn(`⚠️ ${source} server error:`, data.error);
            continue;
        }
        
        if (source === 'online' && data.results) {
            // Add online search results
            results.push(...data.results.results);
        } else {
            // Add context from other sources
            results.push({
                title: `${source.toUpperCase()} Context`,
                url: '#',
                snippet: JSON.stringify(data, null, 2).substring(0, 200) + '...',
                type: 'context',
                source: source
            });
        }
    }
    
    return {
        query: query,
        results: results,
        context_sources: Object.keys(context),
        timestamp: new Date().toISOString()
    };
}

// Basic web search fallback
async function basicWebSearch(query) {
    console.log('🌐 Performing basic web search...');
    
    // Simulate search results
    return {
        query: query,
        results: [
            {
                title: `Hazoom Search Results for "${query}"`,
                url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                snippet: `Showing search results for "${query}" from Hazoom Search Engine. This is a simulated result demonstrating MCP-powered search capabilities.`,
                type: 'search_result'
            },
            {
                title: 'Related Topics',
                url: '#',
                snippet: 'AI, Machine Learning, Web Technologies, Operating Systems',
                type: 'related'
            }
        ],
        context_sources: ['simulated'],
        timestamp: new Date().toISOString()
    };
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    registerHazoomSearch();
    
    // Add global search function
    window.hazoomSearch = hazoomSearch;
    
    console.log('🚀 Hazoom Search Engine initialized and ready!');
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { hazoomSearch, registerHazoomSearch };
}