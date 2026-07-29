/**
 * models/Order.js — Order data access layer.
 *
 * An order bundles line items, shipping/billing addresses, pricing (cents),
 * fulfillment status, and external references (Stripe charge id, Printify id).
 * `items`, `shipping`, `billing`, and `design_ref` are JSON-encoded.
 */

const db = require('../db');
const { v4: uuid } = require('uuid');

function parseJson(field, fallback) {
  if (!field) return fallback;
  try { return JSON.parse(field); } catch { return fallback; }
}

function rowToOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    items: parseJson(row.items, []),
    shipping: parseJson(row.shipping, {}),
    billing: parseJson(row.billing, null),
    subtotal: row.subtotal,
    shippingFee: row.shipping_fee,
    total: row.total,
    status: row.status,
    stripeId: row.stripe_id,
    printifyId: row.printify_id,
    designRef: parseJson(row.design_ref, null),
    createdAt: row.created_at,
  };
}

const Order = {
  async create(data) {
    const id = uuid();
    db.prepare(
      `INSERT INTO orders
        (id, user_id, email, items, shipping, billing, subtotal, shipping_fee, total, status, design_ref)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.userId || null,
      data.email || null,
      JSON.stringify(data.items || []),
      JSON.stringify(data.shipping || {}),
      JSON.stringify(data.billing || null),
      data.subtotal,
      data.shippingFee || 0,
      data.total,
      data.status || 'pending',
      JSON.stringify(data.designRef || null)
    );
    return this.findById(id);
  },

  async findById(id) {
    return rowToOrder(db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id));
  },

  /** All orders for a user (most recent first). */
  async listByUser(userId) {
    return db
      .prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`)
      .all(userId)
      .map(rowToOrder);
  },

  /** Admin: all orders, with optional status filter. */
  async listAll(status) {
    if (status) {
      return db
        .prepare(`SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC`)
        .all(status)
        .map(rowToOrder);
    }
    return db
      .prepare(`SELECT * FROM orders ORDER BY created_at DESC`)
      .all()
      .map(rowToOrder);
  },

  async updateStatus(id, status, extra = {}) {
    const sets = ['status = ?'];
    const params = [status];
    if (extra.printifyId) { sets.push('printify_id = ?'); params.push(extra.printifyId); }
    if (extra.stripeId) { sets.push('stripe_id = ?'); params.push(extra.stripeId); }
    params.push(id);
    const changes = db
      .prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`)
      .run(...params).changes;
    return changes > 0 ? this.findById(id) : null;
  },

  /** Basic analytics: total revenue + order count grouped by status. */
  async analytics() {
    const totals = db
      .prepare(`SELECT COUNT(*) AS count, COALESCE(SUM(total),0) AS revenue FROM orders WHERE status != 'cancelled'`)
      .get();
    const byStatus = db
      .prepare(`SELECT status, COUNT(*) AS count FROM orders GROUP BY status`)
      .all();
    return {
      totalOrders: totals.count,
      totalRevenue: totals.revenue, // cents
      byStatus,
    };
  },
};

module.exports = Order;
