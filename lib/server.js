/**
 * HAZOOM OS v2 — Main Server
 * Express server with security and API proxying
 */

import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './core/config.js';
import logger, { requestLogger } from './core/logger.js';
import searchEngine from './core/search.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https:", "http:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "http://localhost:*", "wss:", "ws:"]
    }
  }
}));

app.use(cors());
app.use(rateLimit(config.security.rateLimit));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

// Static files
app.use(express.static(config.paths.public));

// ===== API ROUTES =====

// Search API
app.get('/api/search', async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = await searchEngine.search(q, { maxResults: parseInt(limit) || 10 });
    res.json({ query: q, results });
  } catch (error) {
    logger.error('Search API error', { error: error.message });
    res.status(500).json({ error: 'Search failed' });
  }
});

// System status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'hazoom-os',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Page routes
app.get('/', (req, res) => {
  res.sendFile(path.join(config.paths.public, 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.server.port, config.server.host, () => {
  logger.info(`HAZOOM OS v2 server started`, {
    port: config.server.port,
    host: config.server.host,
    env: config.server.env
  });
  console.log(`\n🚀 HAZOOM OS v2 running at http://${config.server.host}:${config.server.port}`);
  console.log(`   Health check: http://${config.server.host}:${config.server.port}/health`);
  console.log(`   Status: http://${config.server.host}:${config.server.port}/api/status\n`);
});

export default app;