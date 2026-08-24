#!/usr/bin/env node
// Generates a JSON-LD knowledge graph of the ornithology data for AGI training/retrieval.
// Reads data/birds.json (local) and writes export/ornithology.jsonld. No network.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { soundProfileFor } from '../src/soundProfiles.js';
import { buildRelations } from '../src/relations.js';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.dirname(path.dirname(path.resolve(__filename)));
const src = path.join(ROOT, 'data', 'birds.json');
const outDir = path.join(ROOT, 'export');
const outFile = path.join(outDir, 'ornithology.jsonld');

const raw = JSON.parse(fs.readFileSync(src, 'utf8'));
const GRAPH_NS = 'https://local.agi/ontology/birds#';

const nodes = [];

// Controlled-vocabulary context for the AGI
const context = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  taxon: 'http://purl.org/NET/biol/ns#',
  dwc: 'http://rs.tdwg.org/dwc/terms/',
  ex: GRAPH_NS,
  name: 'dwc:scientificName',
  commonName: 'ex:commonName',
  order: 'dwc:order',
  family: 'dwc:family',
  iucnStatus: 'ex:iucnStatus',
  range: 'ex:range',
  habitat: 'ex:habitat',
  diet: 'ex:diet',
  lengthCm: 'ex:lengthCm',
  wingspanCm: 'ex:wingspanCm',
  call: 'ex:call',
  funFacts: 'ex:funFact',
  renderType: 'ex:renderType',
  speciesOf: { '@reverse': 'ex:hasSpecies' },
};

for (const b of raw.birds) {
  nodes.push({
    '@id': GRAPH_NS + encodeURIComponent(b.id),
    '@type': ['ex:Bird', 'owl:Thing'],
    name: b.scientificName,
    commonName: b.commonName,
    order: b.order,
    family: b.family,
    iucnStatus: b.iucnStatus,
    range: b.range,
    habitat: b.habitat,
    diet: b.diet,
    lengthCm: b.lengthCm,
    wingspanCm: b.wingspanCm,
    call: b.call,
    funFacts: b.funFacts,
    renderType: b.render ? b.render.type : 'procedural',
    soundProfile: soundProfileFor(b),
  });
}

// Index of families and orders (for AGI reasoning over groups)
const groups = {};
for (const b of raw.birds) {
  groups[b.family] = groups[b.family] || { family: b.family, order: b.order, members: [] };
  groups[b.family].members.push(b.commonName);
}
for (const f of Object.keys(groups)) {
  nodes.push({
    '@id': GRAPH_NS + 'family/' + encodeURIComponent(f),
    '@type': 'ex:Family',
    commonName: f,
    order: groups[f].order,
    hasSpecies: groups[f].members,
  });
}

// Relation edges (deterministic, offline) — the knowledge graph structure.
const REL_LABEL = {
  same_family: 'ex:sameFamilyAs', same_order: 'ex:sameOrderAs', sympatry: 'ex:sharesRangeWith',
  shared_habitat: 'ex:sharesHabitatWith', diet_overlap: 'ex:sharesDietWith', size_similar: 'ex:similarSizeTo',
};
const edgeNodes = buildRelations(raw.birds).map((e) => ({
  '@id': GRAPH_NS + 'edge/' + encodeURIComponent(e.source + '_' + e.target),
  '@type': 'ex:Relation',
  source: GRAPH_NS + encodeURIComponent(e.source),
  target: GRAPH_NS + encodeURIComponent(e.target),
  relation: e.relations.map((r) => REL_LABEL[r] || r),
  primary: REL_LABEL[e.primary] || e.primary,
  strength: Number(e.strength.toFixed(3)),
}));

const doc = {
  '@context': context,
  '@graph': nodes.concat(edgeNodes),
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(doc, null, 2));

// Also emit a flat training corpus (question/answer pairs) for the AGI
const corpus = [];
for (const b of raw.birds) {
  corpus.push({ q: `What is the scientific name of the ${b.commonName}?`, a: b.scientificName });
  corpus.push({ q: `What is the IUCN status of ${b.scientificName}?`, a: `${b.iucnStatus} (${b.iucnStatus})` });
  corpus.push({ q: `Where does the ${b.commonName} live?`, a: b.range.join(', ') });
  corpus.push({ q: `What does the ${b.commonName} eat?`, a: b.diet });
  corpus.push({ q: `Describe the ${b.commonName}.`, a: `${b.commonName} (${b.scientificName}) is a ${b.family} of order ${b.order}. ${b.habitat}. ${b.call}` });
}
fs.writeFileSync(path.join(outDir, 'training_corpus.jsonl'), corpus.map((x) => JSON.stringify(x)).join('\n'));

console.log(`Wrote ${outFile}`);
console.log(`  graph nodes : ${nodes.length} (${raw.birds.length} species + ${Object.keys(groups).length} families)`);
console.log(`  graph edges : ${edgeNodes.length} relations`);
console.log(`  training pairs: ${corpus.length} → ${path.join(outDir, 'training_corpus.jsonl')}`);
