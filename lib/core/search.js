/**
 * HAZOOM OS v2 — Search Engine Module
 * Web search integration with DuckDuckGo and caching
 */

import config from './config.js';
import logger from './logger.js';

class SearchEngine {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = config.search.cacheTimeout * 1000;
  }

  /**
   * Perform a web search
   */
  async search(query, options = {}) {
    const { maxResults = config.search.maxResults, useCache = true } = options;
    
    // Check cache first
    if (useCache) {
      const cached = this.getFromCache(query);
      if (cached) {
        logger.debug('Cache hit', { query });
        return cached;
      }
    }

    try {
      const results = await this.searchDuckDuckGo(query, maxResults);
      
      // Cache results
      if (useCache && results.length > 0) {
        this.cache.set(query, {
          results,
          timestamp: Date.now()
        });
      }

      logger.info('Search completed', { query, resultCount: results.length });
      return results;
    } catch (error) {
      logger.error('Search failed', { query, error: error.message });
      throw error;
    }
  }

  /**
   * Search DuckDuckGo
   */
  async searchDuckDuckGo(query, maxResults) {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      no_html: '1',
      skip_disambig: '1'
    });

    const response = await fetch(
      `https://api.duckduckgo.com/?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'HAZOOM-OS/2.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract and format results
    const results = [];
    
    if (data.Abstract) {
      results.push({
        title: data.Heading,
        snippet: data.Abstract,
        url: data.AbstractURL,
        source: 'DuckDuckGo Abstract'
      });
    }

    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, maxResults)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0],
            snippet: topic.Text,
            url: topic.FirstURL,
            source: 'DuckDuckGo Related'
          });
        }
      }
    }

    return results.slice(0, maxResults);
  }

  /**
   * Get results from cache
   */
  getFromCache(query) {
    const cached = this.cache.get(query);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.results;
    }
    this.cache.delete(query);
    return null;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [query, data] of this.cache.entries()) {
      if (now - data.timestamp >= this.cacheTimeout) {
        this.cache.delete(query);
      }
    }
  }
}

// Create singleton instance
const searchEngine = new SearchEngine();

// Clear cache periodically
setInterval(() => searchEngine.clearExpiredCache(), 60000);

export default searchEngine;