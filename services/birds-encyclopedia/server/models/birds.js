import { db } from '../db.js';

const SELECT = `id, common_name, scientific_name, class_name, order_name, family,
  conservation_status, size_cm, wingspan_cm, diet, habitat, range, identification,
  behavior, description, fun_facts, image_url, sound_type, sound_band, sound_description,
  created_by, created_at, updated_at`;

// Controlled vocabulary for bird sound classification.
const SOUND_TYPES = ['Song', 'Call', 'Alarm', 'Drum', 'Wingbeat', 'Silent'];
const SOUND_BANDS = ['Low', 'Mid', 'High', 'Very high'];

function validateSound(data) {
  const errs = [];
  if (data.sound_type != null && data.sound_type !== '' && !SOUND_TYPES.includes(data.sound_type)) {
    errs.push(`sound_type must be one of: ${SOUND_TYPES.join(', ')}`);
  }
  if (data.sound_band != null && data.sound_band !== '' && !SOUND_BANDS.includes(data.sound_band)) {
    errs.push(`sound_band must be one of: ${SOUND_BANDS.join(', ')}`);
  }
  return errs;
}

function parseFunFacts(row) {
  if (!row) return row;
  if (typeof row.fun_facts === 'string' && row.fun_facts) {
    try {
      row.fun_facts = JSON.parse(row.fun_facts);
    } catch {
      row.fun_facts = [row.fun_facts];
    }
  } else if (!row.fun_facts) {
    row.fun_facts = [];
  }
  return row;
}

export const birds = {
  create(data) {
    const errs = validateSound(data);
    if (errs.length) {
      const e = new Error(errs.join('; '));
      e.status = 400;
      throw e;
    }
    const stmt = db.prepare(`
      INSERT INTO birds (
        common_name, scientific_name, class_name, order_name, family,
        conservation_status, size_cm, wingspan_cm, diet, habitat, range,
        identification, behavior, description, fun_facts, image_url,
        sound_type, sound_band, sound_description, created_by
      ) VALUES (@common_name, @scientific_name, @class_name, @order_name, @family,
        @conservation_status, @size_cm, @wingspan_cm, @diet, @habitat, @range,
        @identification, @behavior, @description, @fun_facts, @image_url,
        @sound_type, @sound_band, @sound_description, @created_by)
    `);
    const payload = {
      common_name: data.common_name,
      scientific_name: data.scientific_name,
      class_name: data.class_name || 'Aves',
      order_name: data.order_name ?? null,
      family: data.family ?? null,
      conservation_status: data.conservation_status || 'LC',
      size_cm: data.size_cm ?? null,
      wingspan_cm: data.wingspan_cm ?? null,
      diet: data.diet ?? null,
      habitat: data.habitat ?? null,
      range: data.range ?? null,
      identification: data.identification ?? null,
      behavior: data.behavior ?? null,
      description: data.description ?? null,
      fun_facts: data.fun_facts ? JSON.stringify(data.fun_facts) : null,
      image_url: data.image_url ?? null,
      sound_type: data.sound_type || null,
      sound_band: data.sound_band || null,
      sound_description: data.sound_description ?? null,
      created_by: data.created_by ?? null,
    };
    const info = stmt.run(payload);
    return birds.findById(info.lastInsertRowid);
  },

  findById(id) {
    return parseFunFacts(db.prepare(`SELECT ${SELECT} FROM birds WHERE id = ?`).get(id));
  },

  // Search/filter. q matches common or scientific name. Optional filters.
  list({ q = '', order = '', family = '', status = '', sound = '', limit = 50, offset = 0 } = {}) {
    const where = [];
    const params = {};
    if (q) {
      where.push('(common_name LIKE @q OR scientific_name LIKE @q)');
      params.q = `%${q}%`;
    }
    if (order) {
      where.push('order_name = @order');
      params.order = order;
    }
    if (family) {
      where.push('family = @family');
      params.family = family;
    }
    if (status) {
      where.push('conservation_status = @status');
      params.status = status;
    }
    if (sound) {
      where.push('sound_type = @sound');
      params.sound = sound;
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    params.limit = Math.min(parseInt(limit, 10) || 50, 200);
    params.offset = parseInt(offset, 10) || 0;
    const rows = db
      .prepare(
        `SELECT ${SELECT} FROM birds ${whereSql} ORDER BY common_name LIMIT @limit OFFSET @offset`
      )
      .all(params);
    const total = db.prepare(`SELECT COUNT(*) AS c FROM birds ${whereSql}`).get(params).c;
    return { total, rows: rows.map(parseFunFacts) };
  },

  // Distinct taxonomy breadcrumbs for faceted browsing.
  taxonomy() {
    return db
      .prepare(
        `SELECT order_name, family, COUNT(*) AS count
         FROM birds WHERE order_name IS NOT NULL GROUP BY order_name, family ORDER BY order_name, family`
      )
      .all();
  },

  conservationCounts() {
    return db
      .prepare(
        `SELECT conservation_status, COUNT(*) AS count FROM birds GROUP BY conservation_status`
      )
      .all();
  },

  update(id, data) {
    const existing = birds.findById(id);
    if (!existing) return null;
    const errs = validateSound(data);
    if (errs.length) {
      const e = new Error(errs.join('; '));
      e.status = 400;
      throw e;
    }
    const merged = {
      common_name: data.common_name ?? existing.common_name,
      scientific_name: data.scientific_name ?? existing.scientific_name,
      class_name: data.class_name ?? existing.class_name,
      order_name: data.order_name ?? existing.order_name,
      family: data.family ?? existing.family,
      conservation_status: data.conservation_status ?? existing.conservation_status,
      size_cm: data.size_cm ?? existing.size_cm,
      wingspan_cm: data.wingspan_cm ?? existing.wingspan_cm,
      diet: data.diet ?? existing.diet,
      habitat: data.habitat ?? existing.habitat,
      range: data.range ?? existing.range,
      identification: data.identification ?? existing.identification,
      behavior: data.behavior ?? existing.behavior,
      description: data.description ?? existing.description,
      fun_facts: data.fun_facts
        ? (Array.isArray(data.fun_facts) ? JSON.stringify(data.fun_facts) : data.fun_facts)
        : (Array.isArray(existing.fun_facts) ? JSON.stringify(existing.fun_facts) : existing.fun_facts),
      image_url: data.image_url ?? existing.image_url,
      sound_type: data.sound_type ?? existing.sound_type,
      sound_band: data.sound_band ?? existing.sound_band,
      sound_description: data.sound_description ?? existing.sound_description,
    };
    db.prepare(
      `UPDATE birds SET
        common_name=@common_name, scientific_name=@scientific_name, class_name=@class_name,
        order_name=@order_name, family=@family, conservation_status=@conservation_status,
        size_cm=@size_cm, wingspan_cm=@wingspan_cm, diet=@diet, habitat=@habitat, range=@range,
        identification=@identification, behavior=@behavior, description=@description,
        fun_facts=@fun_facts, image_url=@image_url,
        sound_type=@sound_type, sound_band=@sound_band, sound_description=@sound_description,
        updated_at=datetime('now')
       WHERE id=@id`
    ).run({ ...merged, id });
    return birds.findById(id);
  },

  remove(id) {
    return db.prepare(`DELETE FROM birds WHERE id = ?`).run(id);
  },
};
