import { db } from '../db.js';

const SELECT = `id, slug, title, category, level, summary, content, order_index, created_by, created_at`;

export const topics = {
  create(data) {
    const stmt = db.prepare(`
      INSERT INTO topics (slug, title, category, level, summary, content, order_index, created_by)
      VALUES (@slug, @title, @category, @level, @summary, @content, @order_index, @created_by)
    `);
    const info = stmt.run({
      slug: data.slug,
      title: data.title,
      category: data.category,
      level: data.level || 'beginner',
      summary: data.summary ?? null,
      content: data.content ?? null,
      order_index: data.order_index ?? 0,
      created_by: data.created_by ?? null,
    });
    return topics.findById(info.lastInsertRowid);
  },

  findById(id) {
    return db.prepare(`SELECT ${SELECT} FROM topics WHERE id = ?`).get(id);
  },

  findBySlug(slug) {
    return db.prepare(`SELECT ${SELECT} FROM topics WHERE slug = ?`).get(slug);
  },

  list({ category = '', level = '' } = {}) {
    const where = [];
    const params = {};
    if (category) {
      where.push('category = @category');
      params.category = category;
    }
    if (level) {
      where.push('level = @level');
      params.level = level;
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    return db
      .prepare(
        `SELECT ${SELECT} FROM topics ${whereSql} ORDER BY category, order_index, title`
      )
      .all(params);
  },

  categories() {
    return db.prepare(`SELECT DISTINCT category FROM topics ORDER BY category`).all().map((r) => r.category);
  },

  update(id, data) {
    const existing = topics.findById(id);
    if (!existing) return null;
    const merged = {
      slug: data.slug ?? existing.slug,
      title: data.title ?? existing.title,
      category: data.category ?? existing.category,
      level: data.level ?? existing.level,
      summary: data.summary ?? existing.summary,
      content: data.content ?? existing.content,
      order_index: data.order_index ?? existing.order_index,
    };
    db.prepare(
      `UPDATE topics SET slug=@slug, title=@title, category=@category, level=@level,
        summary=@summary, content=@content, order_index=@order_index WHERE id=@id`
    ).run({ ...merged, id });
    return topics.findById(id);
  },

  remove(id) {
    return db.prepare(`DELETE FROM topics WHERE id = ?`).run(id);
  },
};
