/**
 * routes/auth.js — Registration, login, current-user.
 *
 * POST /api/auth/register  { email, password, name }
 * POST /api/auth/login     { email, password } -> { token, user }
 * GET  /api/auth/me        (auth) -> current user
 *
 * Passwords are hashed with bcrypt (cost 12). JWTs are signed with the
 * configured JWT_SECRET and expire per JWT_EXPIRES_IN.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const BCRYPT_COST = 12;

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const user = await User.create({ email, passwordHash, name, role: 'customer' });
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('[auth:register]', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const row = await User.findByEmailWithHash(email);
    if (!row) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = {
      id: row.id, email: row.email, name: row.name, role: row.role,
    };
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error('[auth:login]', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', require('./../middleware/auth').requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('[auth:me]', err);
    res.status(500).json({ error: 'Failed to load user' });
  }
});

module.exports = router;
