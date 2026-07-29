/**
 * models/Product.js — Product catalog data access layer.
 *
 * Prices are stored in integer CENTS to avoid floating point rounding bugs.
 * `colors` and `images` are stored as JSON strings and parsed on read.
 * `category` is one of: tshirt | mug | hoodie | phonecase.
 */

const db = require('../db');
const { v4: uuid } = require('uuid');

function parseJson(field, fallback) {
  if (!field) return fallback;
  try { return JSON.parse(field); } catch { return fallback; }
}

function rowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    externalId: row.external_id,
    title: row.title,
    description: row.description,
    category: row.category,
    basePrice: row.base_price, // cents
    colors: parseJson(row.colors, []),
    images: parseJson(row.images, []),
    mockupUrl: row.mockup_url,
    stock: row.stock,
    createdAt: row.created_at,
  };
}

const Product = {
  async create(data) {
    const id = uuid();
    db.prepare(
      `INSERT INTO products
        (id, external_id, title, description, category, base_price, colors, images, mockup_url, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.externalId || null,
      data.title,
      data.description || '',
      data.category,
      data.basePrice,
      JSON.stringify(data.colors || []),
      JSON.stringify(data.images || []),
      data.mockupUrl || '',
      data.stock || 0
    );
    return this.findById(id);
  },

  async findById(id) {
    return rowToProduct(db.prepare(`SELECT * FROM products WHERE id = ?`).get(id));
  },

  /**
   * List products with optional filters.
   * @param {{category?:string, search?:string}} filters
   */
  async list(filters = {}) {
    const clauses = [];
    const params = [];
    if (filters.category) {
      clauses.push('category = ?');
      params.push(filters.category);
    }
    if (filters.search) {
      clauses.push('(title LIKE ? OR description LIKE ?)');
      const like = `%${filters.search}%`;
      params.push(like, like);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = db
      .prepare(`SELECT * FROM products ${where} ORDER BY created_at DESC`)
      .all(...params);
    return rows.map(rowToProduct);
  },

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const next = { ...existing, ...data };
    db.prepare(
      `UPDATE products SET
        title=?, description=?, category=?, base_price=?, colors=?, images=?, mockup_url=?, stock=?
       WHERE id=?`
    ).run(
      next.title, next.description, next.category, next.basePrice,
      JSON.stringify(next.colors || []), JSON.stringify(next.images || []),
      next.mockupUrl || '', next.stock, id
    );
    return this.findById(id);
  },

  async remove(id) {
    return db.prepare(`DELETE FROM products WHERE id = ?`).run(id).changes > 0;
  },
};

module.exports = Product;
