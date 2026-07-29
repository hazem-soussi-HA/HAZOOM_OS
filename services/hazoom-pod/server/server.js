/**
 * server/server.js — Hazoom API + static client host.
 *
 * Responsibilities:
 *  - Load env, harden HTTP with helmet, CORS, rate limiting.
 *  - Mount /api/* route groups.
 *  - Capture RAW body for the Stripe webhook (signature verification).
 *  - Serve the built /client SPA in production.
 *  - Seed an admin account + demo products on first run.
 */

require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// ---- Security headers ----
app.use(helmet({
  contentSecurityPolicy: false, // SPA with inline canvas; tighten per needs
}));

// ---- CORS ----
const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5500')
  .split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: origins, credentials: true }));

// ---- Body parsers ----
// JSON for most routes; RAW for the Stripe webhook so we can verify the sig.
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Rate limiting (brute-force protection) ----
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // per IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ---- Routes ----
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// Public config the client needs (Stripe publishable key, etc.)
app.get('/api/config', (req, res) => {
  res.json({
    version: require('../package.json').version,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    stripeOffline: !require('./services/stripe').enabled,
    printifyConfigured: require('./services/printify').isConfigured(),
    categories: ['tshirt', 'mug', 'hoodie', 'phonecase'],
  });
});

// ---- App version ----
app.get('/api/version', (req, res) => res.json({ version: require('../package.json').version }));

// ---- Health check ----
app.get('/api/health', (req, res) => res.json({ ok: true, version: require('../package.json').version, ts: Date.now() }));

// ---- Serve the SPA (client/) ----
const clientDir = path.join(__dirname, '..', 'client');
app.use(express.static(clientDir));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(clientDir, 'index.html'));
});

// ---- Seed admin + demo data on first run ----
const seed = require('./seed');
seed.run().catch((e) => console.error('[seed]', e));

// ---- Start ----
// Only auto-listen when run directly (node server/server.js). When imported
// by tests/tooling we expose `app` without binding a port.
if (require.main === module) {
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n  Hazoom API listening on http://localhost:${PORT}`);
  console.log(`  Stripe: ${require('./services/stripe').enabled ? 'LIVE' : 'OFFLINE (demo)'}`);
  console.log(`  Printify: ${require('./services/printify').isConfigured() ? 'LIVE' : 'MOCK'}\n`);
});
} // end require.main guard

module.exports = app;
