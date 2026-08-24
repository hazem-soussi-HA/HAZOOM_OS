import { db } from '../db.js';
import { hashPassword, verifyPassword } from '../auth.js';

export const users = {
  create({ username, email, password, role = 'editor' }) {
    const stmt = db.prepare(
      `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`
    );
    const info = stmt.run(username, email, hashPassword(password), role);
    return users.findById(info.lastInsertRowid);
  },
  findByUsername(username) {
    return db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
  },
  findByEmail(email) {
    return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
  },
  findById(id) {
    return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
  },
  checkPassword(plain, user) {
    // user may be looked up by caller; we also re-fetch to have the hash
    const u = user || null;
    if (!u) return false;
    return verifyPassword(plain, u.password_hash);
  },
  list() {
    return db.prepare(`SELECT id, username, email, role, created_at FROM users ORDER BY id`).all();
  },
  delete(id) {
    return db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
  },
};
