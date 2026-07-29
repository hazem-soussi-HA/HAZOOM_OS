/**
 * models/User.js — User data access layer.
 *
 * Stores customer and admin accounts. Passwords are NEVER stored in
 * plaintext; callers must hash with bcrypt before save() and compare
 * with bcrypt.compare. `role` is either 'customer' or 'admin'.
 */

const db = require('../db');
const { v4: uuid } = require('uuid');

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
  };
}

const User = {
  /** Create a new user. passwordHash must already be bcrypt-hashed. */
  async create({ email, passwordHash, name = '', role = 'customer' }) {
    const id = uuid();
    db.prepare(
      `INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`
    ).run(id, email.toLowerCase(), passwordHash, name, role);
    return this.findById(id);
  },

  async findById(id) {
    return rowToUser(db.prepare(`SELECT * FROM users WHERE id = ?`).get(id));
  },

  async findByEmail(email) {
    if (!email) return null;
    return rowToUser(
      db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase())
    );
  },

  /** Returns the user WITH the password hash — for login comparison only. */
  async findByEmailWithHash(email) {
    if (!email) return null;
    return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase());
  },

  async list() {
    return db.prepare(`SELECT * FROM users ORDER BY created_at DESC`).all().map(rowToUser);
  },
};

module.exports = User;
