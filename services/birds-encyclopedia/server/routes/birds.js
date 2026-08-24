import { Router } from 'express';
import { birds } from '../models/birds.js';
import { requireAuth, requireAdmin } from '../auth.js';

const router = Router();

// GET /api/birds  — search + filter
router.get('/', (req, res) => {
  const { q, order, family, status, sound, limit, offset } = req.query;
  const result = birds.list({
    q: q || '',
    order: order || '',
    family: family || '',
    status: status || '',
    sound: sound || '',
    limit: limit || 50,
    offset: offset || 0,
  });
  res.json(result);
});

// GET /api/birds/taxonomy
router.get('/taxonomy', (req, res) => {
  res.json({ taxonomy: birds.taxonomy(), conservation: birds.conservationCounts() });
});

// GET /api/birds/:id
router.get('/:id', (req, res) => {
  const bird = birds.findById(req.params.id);
  if (!bird) return res.status(404).json({ error: 'bird not found' });
  res.json(bird);
});

// POST /api/birds  (auth required)
router.post('/', requireAuth, (req, res) => {
  const b = req.body || {};
  if (!b.common_name || !b.scientific_name) {
    return res.status(400).json({ error: 'common_name and scientific_name are required' });
  }
  const existing = birds.list({ q: b.scientific_name, limit: 1 });
  if (existing.rows.length) {
    return res.status(409).json({ error: 'a bird with that scientific name already exists' });
  }
  try {
    const created = birds.create({ ...b, created_by: req.user.id });
    res.status(201).json(created);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// PUT /api/birds/:id  (auth required)
router.put('/:id', requireAuth, (req, res) => {
  try {
    const updated = birds.update(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'bird not found' });
    res.json(updated);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// DELETE /api/birds/:id  (admin only)
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const r = birds.remove(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'bird not found' });
  res.json({ ok: true });
});

export default router;
