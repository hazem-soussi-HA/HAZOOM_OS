import { Router } from 'express';
import { users } from '../models/users.js';
import {
  signToken,
  verifyPassword,
  requireAuth,
  requireAdmin,
} from '../auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }
  if (users.findByUsername(username)) {
    return res.status(409).json({ error: 'username already taken' });
  }
  if (users.findByEmail(email)) {
    return res.status(409).json({ error: 'email already registered' });
  }
  const user = users.create({ username, email, password, role: 'editor' });
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = users.findByUsername(username) || users.findByEmail(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = users.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json({ user: publicUser(user) });
});

// GET /api/auth/users  (admin)
router.get('/users', requireAuth, requireAdmin, (req, res) => {
  res.json({ users: users.list() });
});

function publicUser(u) {
  return { id: u.id, username: u.username, email: u.email, role: u.role, created_at: u.created_at };
}

export default router;
