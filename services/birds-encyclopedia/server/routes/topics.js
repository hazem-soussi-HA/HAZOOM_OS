import { Router } from 'express';
import { topics } from '../models/topics.js';
import { requireAuth, requireAdmin } from '../auth.js';

const router = Router();

// GET /api/topics
router.get('/', (req, res) => {
  const { category, level } = req.query;
  res.json({ topics: topics.list({ category: category || '', level: level || '' }), categories: topics.categories() });
});

// GET /api/topics/:slug
router.get('/:slug', (req, res) => {
  const t = topics.findBySlug(req.params.slug);
  if (!t) return res.status(404).json({ error: 'topic not found' });
  res.json(t);
});

// POST /api/topics  (auth required)
router.post('/', requireAuth, (req, res) => {
  const t = req.body || {};
  if (!t.slug || !t.title || !t.category) {
    return res.status(400).json({ error: 'slug, title and category are required' });
  }
  if (topics.findBySlug(t.slug)) {
    return res.status(409).json({ error: 'a topic with that slug already exists' });
  }
  const created = topics.create({ ...t, created_by: req.user.id });
  res.status(201).json(created);
});

// PUT /api/topics/:id
router.put('/:id', requireAuth, (req, res) => {
  const updated = topics.update(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'topic not found' });
  res.json(updated);
});

// DELETE /api/topics/:id  (admin only)
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const r = topics.remove(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'topic not found' });
  res.json({ ok: true });
});

export default router;
