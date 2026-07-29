/**
 * routes/orders.js — Order lifecycle + admin management.
 *
 * Customer (auth):
 *   GET  /api/orders          -> my orders
 *   GET  /api/orders/:id      -> my order detail
 *
 * Admin (requireAdmin):
 *   GET  /api/orders/all      -> all orders (optional ?status=)
 *   PATCH /api/orders/:id     -> update status (+ optional printifyId)
 *   GET  /api/orders/analytics-> sales metrics
 *   POST /api/orders/:id/fulfill -> push to Printify
 */

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const printify = require('../services/printify');
const email = require('../services/email');

router.get('/', requireAuth, async (req, res) => {
  try {
    const orders = await Order.listByUser(req.user.id);
    res.json({ orders });
  } catch (err) {
    console.error('[orders:mine]', err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId && order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json({ order });
  } catch (err) {
    console.error('[orders:detail]', err);
    res.status(500).json({ error: 'Failed to load order' });
  }
});

router.get('/all/list', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.listAll(req.query.status);
    res.json({ orders });
  } catch (err) {
    console.error('[orders:all]', err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, printifyId, stripeId } = req.body || {};
    const order = await Order.updateStatus(req.params.id, status, { printifyId, stripeId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    console.error('[orders:status]', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.get('/analytics/metrics', requireAdmin, async (req, res) => {
  try {
    const data = await Order.analytics();
    res.json(data);
  } catch (err) {
    console.error('[orders:analytics]', err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// Submit a paid order to Printify for fulfillment.
router.post('/:id/fulfill', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const result = await printify.createOrder(order);
    const updated = await Order.updateStatus(req.params.id, 'fulfilled', {
      printifyId: result.id,
    });
    res.json({ result, order: updated });
  } catch (err) {
    console.error('[orders:fulfill]', err);
    res.status(500).json({ error: 'Fulfillment failed: ' + err.message });
  }
});

module.exports = router;
