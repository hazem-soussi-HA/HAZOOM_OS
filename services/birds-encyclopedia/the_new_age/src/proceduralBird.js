// Procedural low-poly bird generator for the Birds of Africa 3D Atlas.
// Completely offline: builds a recognizable bird mesh from a species profile
// (form, palette, proportions). No external assets required.
import * as THREE from 'three';

// Small helpers ----------------------------------------------------------
function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), flatShading: true, roughness: 0.75, metalness: 0.05, ...opts });
}
function colorOf(palette, key, fallback = '#888888') {
  return palette[key] || fallback;
}

// Generic body part builders --------------------------------------------
function makeEllipsoid(rx, ry, rz, material, seg = 10) {
  const g = new THREE.SphereGeometry(1, seg, Math.max(6, seg - 2));
  g.scale(rx, ry, rz);
  return new THREE.Mesh(g, material);
}

function makeCone(radius, height, material, seg = 8) {
  return new THREE.Mesh(new THREE.ConeGeometry(radius, height, seg), material);
}

function makeBox(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

// Wings: a flattened tapered shape, pivoted for a slight dihedral.
function makeWing(side, span, palette, profile) {
  const m = mat(colorOf(palette, 'wing', '#444444'));
  const wing = new THREE.Group();
  const shape = makeEllipsoid(span * 0.5, 0.06, 0.28, m, 6);
  shape.position.x = span * 0.5;
  // taper the tip
  const tip = makeCone(0.06, span * 0.4, m, 4);
  tip.rotation.z = Math.PI / 2 * (side > 0 ? -1 : 1);
  tip.position.x = span * 0.95;
  wing.add(shape, tip);
  wing.scale.x = side; // mirror for left/right
  wing.rotation.z = 0.18 * side; // dihedral
  return wing;
}

function makeLegPair(palette, len, spread = 0.12) {
  const g = new THREE.Group();
  const lm = mat(colorOf(palette, 'leg', '#caa05a'));
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    const thigh = makeBox(0.05, len * 0.6, 0.05, lm);
    thigh.position.y = -len * 0.3;
    const shin = makeBox(0.035, len * 0.6, 0.035, lm);
    shin.position.y = -len * 0.7;
    const foot = makeBox(0.12, 0.03, 0.08, lm);
    foot.position.set(0.04, -len + 0.01, 0);
    leg.add(thigh, shin, foot);
    leg.position.x = s * spread;
    g.add(leg);
  }
  return g;
}

function makeTail(len, palette) {
  const m = mat(colorOf(palette, 'wing', '#333333'));
  const tail = makeCone(0.18, len, m, 4);
  tail.rotation.x = Math.PI / 2;       // point backward (-z)
  tail.rotation.z = Math.PI / 4;
  tail.position.z = -len * 0.5 - 0.2;
  return tail;
}

// Form-specific assembly -------------------------------------------------
function assemblePerching(profile, palette) {
  const { bodyLen, bodyHeight, neckLen, legLen, beakLen } = profile.proportions;
  const root = new THREE.Group();
  const bm = mat(colorOf(palette, 'body', '#888'));
  const body = makeEllipsoid(bodyLen * 0.5, bodyHeight * 0.5, bodyLen * 0.35, bm, 10);
  body.rotation.z = 0.5; // upright-ish posture
  root.add(body);

  const neck = makeEllipsoid(0.08, neckLen * 0.5, 0.08, mat(colorOf(palette, 'neck', colorOf(palette, 'body'))), 6);
  neck.position.set(0.05, bodyHeight * 0.4 + neckLen * 0.3, 0.05);
  root.add(neck);

  const head = makeEllipsoid(0.13, 0.12, 0.13, bm, 8);
  head.position.set(0.08, bodyHeight * 0.55 + neckLen * 0.6, 0.06);
  root.add(head);

  const beak = makeCone(0.04, beakLen, mat(colorOf(palette, 'beak', '#222')), 5);
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.08 + beakLen * 0.5, head.position.y, 0.06);
  root.add(beak);

  const eye = makeBox(0.03, 0.03, 0.03, mat(colorOf(palette, 'eye', '#111'), { emissive: new THREE.Color(colorOf(palette, 'eye', '#111')), emissiveIntensity: 0.3 }));
  eye.position.set(0.16, head.position.y + 0.02, 0.1);
  root.add(eye);
  const eye2 = eye.clone(); eye2.position.z = -0.1; root.add(eye2);

  const wings = new THREE.Group();
  const wR = makeWing(1, bodyLen * 0.9, palette, profile); wR.position.set(0, bodyHeight * 0.2, 0.05);
  const wL = makeWing(-1, bodyLen * 0.9, palette, profile); wL.position.set(0, bodyHeight * 0.2, -0.05);
  wings.add(wR, wL); root.add(wings);

  const tail = makeTail(bodyLen * 0.8, palette); root.add(tail);

  const legs = makeLegPair(palette, legLen, 0.1);
  legs.position.set(0, -bodyHeight * 0.45, 0.05);
  root.add(legs);
  return root;
}

function assembleRaptor(profile, palette) {
  const g = assemblePerching(profile, palette);
  // bigger hooked beak already cone; add a brow
  return g;
}

function assembleWader(profile, palette) {
  const { bodyLen, bodyHeight, neckLen, legLen, beakLen } = profile.proportions;
  const root = assemblePerching(profile, palette);
  // lengthen neck + legs already from proportions; add long bill
  return root;
}

function assembleCrane(profile, palette) {
  const root = assemblePerching(profile, palette);
  // crown tuft
  const crown = makeCone(0.06, 0.18, mat(colorOf(palette, 'crown', '#f00')), 6);
  crown.position.set(0.08, 0.95, 0.06);
  root.add(crown);
  return root;
}

function assembleRatite(profile, palette) {
  const { bodyLen, bodyHeight, neckLen, legLen, beakLen } = profile.proportions;
  const root = new THREE.Group();
  const bm = mat(colorOf(palette, 'body', '#3a3a3a'));
  const body = makeEllipsoid(bodyLen * 0.4, bodyHeight * 0.4, bodyLen * 0.35, bm, 12);
  body.rotation.z = 0.2;
  root.add(body);
  const neck = makeEllipsoid(0.12, neckLen * 0.5, 0.12, mat(colorOf(palette, 'neck', '#2a2a2a')), 8);
  neck.position.set(bodyLen * 0.35, bodyHeight * 0.3 + neckLen * 0.3, 0);
  neck.rotation.z = -0.2;
  root.add(neck);
  const head = makeEllipsoid(0.16, 0.15, 0.16, bm, 8);
  head.position.set(bodyLen * 0.55, bodyHeight * 0.5 + neckLen * 0.6, 0);
  root.add(head);
  const beak = makeCone(0.05, beakLen, mat(colorOf(palette, 'beak', '#d9b44a')), 6);
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(bodyLen * 0.55 + beakLen * 0.5, head.position.y, 0);
  root.add(beak);
  const eye = makeBox(0.04, 0.04, 0.04, mat(colorOf(palette, 'eye', '#ffcc33'), { emissive: new THREE.Color('#ffcc33'), emissiveIntensity: 0.4 }));
  eye.position.set(bodyLen * 0.62, head.position.y + 0.03, 0.12); root.add(eye);
  const eye2 = eye.clone(); eye2.position.z = -0.12; root.add(eye2);
  // stubby wings
  const wR = makeWing(1, bodyLen * 0.5, palette, profile); wR.position.set(0, bodyHeight * 0.3, 0.1);
  const wL = makeWing(-1, bodyLen * 0.5, palette, profile); wL.position.set(0, bodyHeight * 0.3, -0.1);
  root.add(wR, wL);
  const legs = makeLegPair(palette, legLen, 0.18);
  legs.position.set(bodyLen * 0.1, -bodyHeight * 0.4, 0);
  root.add(legs);
  return root;
}

function assembleTerrestrialRaptor(profile, palette) {
  const root = assembleRatite(profile, palette);
  // secretary-bird: black crest feathers at the back of the head
  const crest = makeCone(0.05, 0.22, mat(colorOf(palette, 'body', '#1a1a1a')), 5);
  crest.position.set(0.28, 1.0, 0.06);
  root.add(crest);
  const crest2 = crest.clone(); crest2.position.z = -0.06; root.add(crest2);
  return root;
}

function assembleHornbill(profile, palette) {
  const root = assemblePerching(profile, palette);
  // big casque on bill
  const casque = makeEllipsoid(0.1, 0.12, 0.12, mat(colorOf(palette, 'casque', '#f2c14e')), 6);
  casque.position.set(0.32, 0.85, 0.06);
  root.add(casque);
  return root;
}

function assembleBustard(profile, palette) {
  return assembleRatite(profile, palette);
}

function assembleGalliform(profile, palette) {
  const root = assemblePerching(profile, palette);
  // helmet
  const helmet = makeCone(0.07, 0.12, mat(colorOf(palette, 'beak', '#c0392b')), 6);
  helmet.position.set(0.08, 0.7, 0.06);
  root.add(helmet);
  // spotted body (simple decorative boxes)
  for (let i = 0; i < 14; i++) {
    const s = makeBox(0.05, 0.05, 0.01, mat(colorOf(palette, 'spots', '#e8e8e8')));
    const a = Math.random() * Math.PI * 2; const r = Math.random() * 0.18;
    s.position.set(Math.cos(a) * r, -0.1 + Math.sin(a) * r * 0.6, 0.18 + Math.random() * 0.05);
    root.add(s);
  }
  return root;
}

function assemblePenguin(profile, palette) {
  const { bodyLen, bodyHeight, legLen, beakLen } = profile.proportions;
  const root = new THREE.Group();
  const bm = mat(colorOf(palette, 'body', '#1c1c1c'));
  const body = makeEllipsoid(bodyLen * 0.5, bodyHeight * 0.5, bodyLen * 0.4, bm, 12);
  root.add(body);
  const belly = makeEllipsoid(bodyLen * 0.42, bodyHeight * 0.46, bodyLen * 0.3, mat(colorOf(palette, 'belly', '#f2f2f2')), 12);
  belly.position.z = 0.12; root.add(belly);
  const head = makeEllipsoid(0.18, 0.17, 0.18, bm, 8);
  head.position.y = bodyHeight * 0.55; root.add(head);
  const face = makeEllipsoid(0.13, 0.13, 0.1, mat(colorOf(palette, 'face', '#fff')), 8);
  face.position.set(0, bodyHeight * 0.58, 0.12); root.add(face);
  const beak = makeCone(0.05, beakLen, mat(colorOf(palette, 'beak', '#f2a23a')), 6);
  beak.rotation.x = Math.PI / 2; beak.position.set(0, bodyHeight * 0.55, 0.18 + beakLen * 0.4);
  root.add(beak);
  const eye = makeBox(0.035, 0.035, 0.02, mat('#111'));
  eye.position.set(0.06, bodyHeight * 0.6, 0.18); root.add(eye);
  const eye2 = eye.clone(); eye2.position.x = -0.06; root.add(eye2);
  // flippers
  const fl = makeEllipsoid(0.06, 0.4, 0.16, mat('#111'), 6);
  fl.position.set(0.22, 0.1, 0); fl.rotation.z = 0.5; root.add(fl);
  const fr = fl.clone(); fr.position.x = -0.22; fr.rotation.z = -0.5; root.add(fr);
  const legs = makeLegPair(palette, legLen, 0.1);
  legs.position.y = -bodyHeight * 0.5; root.add(legs);
  return root;
}

const ASSEMBLERS = {
  'perching': assemblePerching,
  'raptor': assembleRaptor,
  'wader': assembleWader,
  'crane': assembleCrane,
  'ratite': assembleRatite,
  'terrestrial-raptor': assembleTerrestrialRaptor,
  'hornbill': assembleHornbill,
  'bustard': assembleBustard,
  'galliform': assembleGalliform,
  'penguin': assemblePenguin,
};

// Public API -------------------------------------------------------------
export function buildProceduralBird(profile) {
  const fn = ASSEMBLERS[profile.form] || assemblePerching;
  const group = fn(profile, profile.palette || {});
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

// For the GLTF path we still want a placeholder until the model loads.
export function buildPlaceholder(palette) {
  return makeEllipsoid(0.3, 0.3, 0.3, mat(colorOf(palette, 'body', '#888')), 6);
}
