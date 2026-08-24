import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DB_PATH = process.env.DB_PATH || path.join(ROOT, 'data', 'birds.db');
// Ensure the directory exists (data/ is gitignored).
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'editor',   -- 'admin' | 'editor'
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS birds (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      common_name        TEXT NOT NULL,
      scientific_name    TEXT NOT NULL UNIQUE,
      class_name         TEXT NOT NULL DEFAULT 'Aves',
      order_name         TEXT,                      -- e.g. Passeriformes
      family             TEXT,                      -- e.g. Corvidae
      conservation_status TEXT DEFAULT 'LC',        -- IUCN: LC,NT,VU,EN,CR,EX,DD
      size_cm            REAL,                      -- body length in cm
      wingspan_cm        REAL,                      -- wingspan in cm
      diet               TEXT,
      habitat            TEXT,
      range              TEXT,                      -- geographic distribution
      identification     TEXT,                      -- how to recognize it
      behavior           TEXT,
      description        TEXT,
      fun_facts          TEXT,                      -- JSON array of strings
      image_url          TEXT,
      -- Sound classification (controlled vocabulary).
      sound_type         TEXT,                      -- Song|Call|Alarm|Drum|Wingbeat|Silent
      sound_band         TEXT,                      -- Low|Mid|High|Very high (pitch range)
      sound_description  TEXT,                      -- human description of its voice
      created_by         INTEGER REFERENCES users(id),
      created_at         TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_birds_common ON birds(common_name);
    CREATE INDEX IF NOT EXISTS idx_birds_order ON birds(order_name);
    CREATE INDEX IF NOT EXISTS idx_birds_family ON birds(family);

    CREATE TABLE IF NOT EXISTS topics (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      slug         TEXT NOT NULL UNIQUE,
      title        TEXT NOT NULL,
      category     TEXT NOT NULL,                   -- e.g. 'Fundamentals','Identification','Conservation'
      level        TEXT DEFAULT 'beginner',         -- beginner | intermediate | advanced
      summary      TEXT,
      content      TEXT,                            -- long-form learning text (markdown-ish)
      order_index  INTEGER DEFAULT 0,
      created_by   INTEGER REFERENCES users(id),
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);
  `);

  migrateSoundColumns();
}

// Add sound-classification columns to any pre-existing `birds` table that
// lacks them (CREATE TABLE IF NOT EXISTS above won't modify an existing table).
// Safe to run repeatedly; no-ops once columns are present. Runs before the
// sound index is created so the index never references a missing column.
function migrateSoundColumns() {
  const existing = new Set(
    db.prepare("PRAGMA table_info(birds)").all().map((c) => c.name)
  );
  if (!existing.has('sound_type')) {
    db.exec('ALTER TABLE birds ADD COLUMN sound_type TEXT');          // Song|Call|Alarm|Drum|Wingbeat|Silent
  }
  if (!existing.has('sound_band')) {
    db.exec('ALTER TABLE birds ADD COLUMN sound_band TEXT');          // Low|Mid|High|Very high
  }
  if (!existing.has('sound_description')) {
    db.exec('ALTER TABLE birds ADD COLUMN sound_description TEXT');   // human description of voice
  }
  // Now that the columns are guaranteed to exist, create the supporting index.
  db.exec('CREATE INDEX IF NOT EXISTS idx_birds_sound ON birds(sound_type)');
}
