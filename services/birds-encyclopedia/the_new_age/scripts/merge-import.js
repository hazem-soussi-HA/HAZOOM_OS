#!/usr/bin/env node
// Merge LOCAL taxonomy imports (data/import/*.json) into data/birds.json.
// Air-gap safe: reads only local files, writes only local files.
const fs = require('fs');
const [, , dir, birdsPath] = process.argv;
if (!dir || !birdsPath) { console.error('usage: merge-import.js <importDir> <birds.json>'); process.exit(1); }
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
let birds = JSON.parse(fs.readFileSync(birdsPath, 'utf8'));
const have = new Set(birds.birds.map((b) => b.scientificName.toLowerCase()));
let added = 0;
for (const f of files) {
  const arr = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
  const list = Array.isArray(arr) ? arr : (arr.birds || arr.species || []);
  for (const sp of list) {
    if (!sp.scientificName || have.has(sp.scientificName.toLowerCase())) continue;
    have.add(sp.scientificName.toLowerCase());
    birds.birds.push({
      id: (sp.scientificName || 'sp' + added).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      commonName: sp.commonName || sp.scientificName,
      scientificName: sp.scientificName,
      order: sp.order || 'Unknown',
      family: sp.family || 'Unknown',
      iucnStatus: sp.iucnStatus || 'LC',
      range: sp.range || [],
      habitat: sp.habitat || '',
      diet: sp.diet || '',
      lengthCm: sp.lengthCm || 0,
      wingspanCm: sp.wingspanCm || 0,
      call: sp.call || '',
      funFacts: sp.funFacts || [],
      render: { type: 'procedural', profile: {
        form: 'perching',
        palette: { body: '#888', belly: '#aaa', wing: '#555', beak: '#222', leg: '#caa05a', neck: '#999', eye: '#111' },
        proportions: { bodyLen: 0.5, bodyHeight: 0.35, neckLen: 0.2, legLen: 0.35, beakLen: 0.15 },
        flightless: false } },
    });
    added++;
  }
}
fs.writeFileSync(birdsPath, JSON.stringify(birds, null, 2));
console.log(`✅ Merged ${added} new species from ${files.length} file(s) → ${birds.birds.length} total.`);
