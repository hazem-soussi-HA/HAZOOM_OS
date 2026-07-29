// scripts/dump_dataset.js
// Evaluate the browser's data.js in Node and emit canonical JSON of the
// pure-data fields (arrays + GEO + MAX_AGE). Functions (ageToT/_analyze)
// are intentionally excluded — they live in the SRI-verified client code,
// not in the signed data. The server signs exactly this JSON.
const fs = require('fs');
const p = process.argv[2];
const src = fs.readFileSync(p, 'utf8');
const fn = new Function('module', 'exports', src + '\nmodule.exports = PEH;');
const mod = { exports: {} };
fn(mod, mod.exports);
const PEH = mod.exports;
const out = {
  LAYERS: PEH.LAYERS,
  EPOCHS: PEH.EPOCHS,
  FLOODS: PEH.FLOODS,
  PEOPLES: PEH.PEOPLES,
  BIRDS: PEH.BIRDS,
  DIVINE: PEH.DIVINE,
  INSIGHT: PEH.INSIGHT,
  GEO: PEH.GEO,
  MAX_AGE: PEH.MAX_AGE,
};
process.stdout.write(JSON.stringify(out));
