/**
 * HAZOOM OS v2 — Configuration Module
 * Centralized configuration management with environment support
 */

import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenvConfig({ path: path.join(__dirname, '../../.env') });

const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3000'),
    httpsPort: parseInt(process.env.HTTPS_PORT || '8443'),
    host: process.env.HOST || '127.0.0.1',
    env: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production'
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    dir: process.env.LOG_DIR || path.join(__dirname, '../../logs')
  },

  // AI/LLM configuration
  ai: {
    ollamaHost: process.env.OLLAMA_HOST || '127.0.0.1',
    ollamaPort: parseInt(process.env.OLLAMA_PORT || '11434'),
    apiKey: process.env.API_KEY,
    model: process.env.AI_MODEL || 'llama3.2'
  },

  // Search configuration
  search: {
    provider: process.env.SEARCH_PROVIDER || 'duckduckgo',
    maxResults: parseInt(process.env.MAX_SEARCH_RESULTS || '10'),
    cacheTimeout: parseInt(process.env.SEARCH_CACHE_TIMEOUT || '3600')
  },

  // Security configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'hazoom-os-secret-change-in-production',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400000'),
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX || '200')
    }
  },

  // Paths
  paths: {
    root: path.join(__dirname, '../..'),
    public: path.join(__dirname, '../../public'),
    logs: path.join(__dirname, '../../logs'),
    data: path.join(__dirname, '../../data')
  }
};

export default config;