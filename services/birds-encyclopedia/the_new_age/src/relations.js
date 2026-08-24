// Deterministic, offline relation-builder for the Birds of Africa atlas.
// Derives edges between birds from their own attributes — no API, no network.
// Each edge has a typed relation + a strength (0..1) used for line opacity.

export const RELATION_TYPES = {
  same_family:   { label: 'Same family',     color: '#f2c14e', weight: 1.0 },
  same_order:    { label: 'Same order',      color: '#3f86ff', weight: 0.7 },
  sympatry:      { label: 'Shared range',    color: '#2e7d32', weight: 0.6 },
  shared_habitat:{ label: 'Shared habitat',  color: '#3da34a', weight: 0.5 },
  diet_overlap:  { label: 'Diet overlap',    color: '#d9a441', weight: 0.4 },
  size_similar:  { label: 'Similar size',    color: '#9aa4c8', weight: 0.3 },
};

function overlap(a, b) {
  const sa = new Set(a.map((x) => x.toLowerCase()));
  const sb = new Set(b.map((x) => x.toLowerCase()));
  let n = 0;
  for (const x of sa) if (sb.has(x)) n++;
  return n;
}

function habitatTokens(h) {
  // crude tokenization: split on commas/;/& and keep meaningful words
  return (h || '').toLowerCase().split(/[;,/&]+|\sand\s/).map((s) => s.trim()).filter(Boolean);
}

function dietTokens(d) {
  return (d || '').toLowerCase().split(/[,;]/).map((s) => s.trim()).filter(Boolean);
}

export function buildRelations(birds) {
  const edges = [];
  const seen = new Set();
  for (let i = 0; i < birds.length; i++) {
    for (let j = i + 1; j < birds.length; j++) {
      const a = birds[i], b = birds[j];
      const rels = [];
      if (a.family === b.family) rels.push('same_family');
      if (a.order === b.order) rels.push('same_order');
      const ro = overlap(a.range, b.range);
      if (ro > 0) rels.push('sympatry');
      const ha = habitatTokens(a.habitat), hb = habitatTokens(b.habitat);
      if (overlap(ha, hb) > 0) rels.push('shared_habitat');
      const da = dietTokens(a.diet), db = dietTokens(b.diet);
      if (overlap(da, db) > 0) rels.push('diet_overlap');
      const sizeA = a.lengthCm || 0, sizeB = b.lengthCm || 0;
      if (sizeA && sizeB) {
        const ratio = Math.min(sizeA, sizeB) / Math.max(sizeA, sizeB);
        if (ratio >= 0.6) rels.push('size_similar');
      }
      if (!rels.length) continue;
      // strength = strongest relation present
      let strength = 0, topType = rels[0];
      for (const r of rels) {
        if (RELATION_TYPES[r].weight > strength) { strength = RELATION_TYPES[r].weight; topType = r; }
      }
      const key = a.id + '|' + b.id;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        source: a.id, target: b.id,
        relations: rels,
        primary: topType,
        strength,
      });
    }
  }
  return edges;
}

// For UI: neighbors of a given bird id
export function neighborsOf(edges, id) {
  const out = [];
  for (const e of edges) {
    if (e.source === id) out.push({ other: e.target, edge: e });
    else if (e.target === id) out.push({ other: e.source, edge: e });
  }
  return out;
}
