/**
 * routes/products.js — Public catalog + admin product management.
 *
 * Public:
 *   GET /api/products            -> list (optional ?category=&search=)
 *   GET /api/products/:id        -> detail
 *
 * Admin (requireAdmin):
 *   POST   /api/products         -> create
 *   PUT    /api/products/:id     -> update
 *   DELETE /api/products/:id     -> delete
 *   POST   /api/products/sync    -> pull catalog from Printify
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { requireAdmin } = require('../middleware/auth');
const printify = require('../services/printify');

const VALID_CATEGORIES = ['tshirt', 'mug', 'hoodie', 'phonecase'];

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const products = await Product.list({ category, search });
    res.json({ products });
  } catch (err) {
    console.error('[products:list]', err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    console.error('[products:detail]', err);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, description, category, basePrice, colors, images, mockupUrl, stock } = req.body || {};
    if (!title || !category || basePrice == null) {
      return res.status(400).json({ error: 'title, category and basePrice are required' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    const product = await Product.create({
      title, description, category,
      basePrice: Math.round(Number(basePrice)),
      colors: colors || [], images: images || [], mockupUrl: mockupUrl || '', stock: stock || 0,
    });
    res.status(201).json({ product });
  } catch (err) {
    console.error('[products:create]', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.update(req.params.id, req.body || {});
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    console.error('[products:update]', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const ok = await Product.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('[products:delete]', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Pull products from Printify into the local catalog.
router.post('/sync', requireAdmin, async (req, res) => {
  try {
    const remote = await printify.getProducts();
    if (!remote.length) {
      return res.json({ synced: 0, note: 'Printify not configured — nothing to sync.' });
    }
    let synced = 0;
    for (const p of remote) {
      await Product.create({
        externalId: p.externalId,
        title: p.title,
        category: 'tshirt', // map Printify product type -> Hazoom category as needed
        basePrice: 1999,
        images: p.images,
        mockupUrl: p.mockupUrl,
        stock: 999,
      });
      synced++;
    }
    res.json({ synced });
  } catch (err) {
    console.error('[products:sync]', err);
    res.status(500).json({ error: 'Printify sync failed: ' + err.message });
  }
});

module.exports = router;
