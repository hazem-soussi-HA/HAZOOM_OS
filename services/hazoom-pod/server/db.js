/**
 * db.js — Central database connection and schema bootstrap.
 *
 * Hazoom uses SQLite (via better-sqlite3) for zero-config local runs.
 * All tables are created here on first launch. The synchronous API of
 * better-sqlite3 keeps the data-access layer simple and fast for this
 * application's scale.
 *
 * If you prefer MongoDB, set DB_TYPE=mongo in .env and replace the
 * models/ files with Mongoose schemas (see README).
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.SQLITE_PATH || './data/hazoom.db';

// Ensure the directory for the SQLite file exists.
const dbDir = path.dirname(path.resolve(DB_PATH));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Create tables if they do not already exist. Idempotent.
 */
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name          TEXT,
      role          TEXT NOT NULL DEFAULT 'customer',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id           TEXT PRIMARY KEY,
      external_id  TEXT,            -- Printify product id (when synced)
      title        TEXT NOT NULL,
      description  TEXT,
      category     TEXT NOT NULL,   -- tshirt | mug | hoodie | phonecase
      base_price   REAL NOT NULL,   -- price in cents to avoid float errors
      colors       TEXT,            -- JSON array of available colors
      images       TEXT,            -- JSON array of image URLs
      mockup_url   TEXT,            -- product mockup base image
      stock        INTEGER DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id            TEXT PRIMARY KEY,
      user_id       TEXT,
      email         TEXT,
      items         TEXT NOT NULL,  -- JSON array of line items
      shipping      TEXT NOT NULL,  -- JSON shipping address
      billing       TEXT,           -- JSON billing address (optional)
      subtotal      INTEGER NOT NULL,
      shipping_fee  INTEGER DEFAULT 0,
      total         INTEGER NOT NULL,
      status        TEXT NOT NULL DEFAULT 'pending', -- pending|paid|fulfilled|shipped|delivered|cancelled
      stripe_id     TEXT,
      printify_id   TEXT,
      design_ref    TEXT,           -- JSON: custom design data per item
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  `);
}

initSchema();

module.exports = db;
