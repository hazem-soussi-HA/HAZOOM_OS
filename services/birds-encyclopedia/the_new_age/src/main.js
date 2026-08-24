// Birds of Africa — 3D Ornithology Atlas
// 100% offline: Three.js is vendored locally, data is local JSON, models are local GLB.
import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/addons/controls/OrbitControls.js';
import { GLTFLoader } from '../vendor/three/addons/loaders/GLTFLoader.js';
import { buildProceduralBird, buildPlaceholder } from './proceduralBird.js';
import { playBirdCall, setMuted, isMuted, resumeAudio } from './audioBird.js';
import { buildRelations, neighborsOf, RELATION_TYPES } from './relations.js';

const IUCN_COLORS = { LC: '#2e7d32', NT: '#9ccc65', VU: '#f9a825', EN: '#ef6c00', CR: '#c62828', EW: '#6a1b9a', EX: '#212121' };
const IUCN_LABEL = { LC: 'Least Concern', NT: 'Near Threatened', VU: 'Vulnerable', EN: 'Endangered', CR: 'Critically Endangered', EW: 'Extinct in Wild', EX: 'Extinct' };

let scene, camera, renderer, controls, clock;
let birdsData = [];
let edges = [];
let relationGroup = null;
let relationMode = 'all'; // 'all' | 'selected' | 'off'
const birdMeshes = new Map(); // id -> { group, baseY, data }
let selected = null;

init();

async function init() {
  const canvas = document.getElementById('scene');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b1020');
  scene.fog = new THREE.Fog('#0b1020', 18, 45);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 4, 12);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 2;
  controls.maxDistance = 40;
  controls.target.set(0, 2.5, 0);

  // Lights
  const hemi = new THREE.HemisphereLight('#bcd0ff', '#1a2030', 0.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff4e0', 1.1);
  sun.position.set(8, 14, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -20;
  scene.add(sun);
  scene.add(new THREE.AmbientLight('#556', 0.4));

  // Ground (savanna)
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(40, 48),
    new THREE.MeshStandardMaterial({ color: '#2c3a22', roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  clock = new THREE.Clock();
  window.addEventListener('resize', onResize);

  // Load data + build
  try {
    const res = await fetch('./data/birds.json');
    birdsData = (await res.json()).birds;
  } catch (e) {
    console.error('Failed to load bird data', e);
    document.getElementById('status').textContent = 'Error: could not load data/birds.json';
    return;
  }

  buildGallery();
  buildUI();
  animate();
  document.getElementById('status').textContent = `Loaded ${birdsData.length} species — offline & confidential.`;
}

function buildGallery() {
  const n = birdsData.length;
  const radius = Math.max(6, n * 0.55);
  const ringGroup = new THREE.Group();
  ringGroup.position.y = 0;
  scene.add(ringGroup);

  const gltfLoader = new GLTFLoader();

  birdsData.forEach((b, i) => {
    const angle = (i / n) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 1.4;

    const placeholder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.05, 4),
      new THREE.MeshBasicMaterial({ visible: false })
    );

    if (b.render && b.render.type === 'gltf') {
      const url = b.render.model;
      const scale = b.render.scale || 0.1;
      gltfLoader.load(url, (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(scale);
        model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        // center it
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        placeholder.add(model);
      }, undefined, (err) => {
        console.warn('GLTF load failed, using procedural fallback', url, err);
        const fb = buildProceduralBird(b.render.profile || defaultProfile(b));
        placeholder.add(fb);
      });
    } else {
      const profile = (b.render && b.render.profile) ? b.render.profile : defaultProfile(b);
      placeholder.add(buildProceduralBird(profile));
    }

    placeholder.position.set(x, y, z);
    placeholder.userData = { id: b.id, baseY: y, spin: 0.003 + Math.random() * 0.004 };
    ringGroup.add(placeholder);
    birdMeshes.set(b.id, { group: placeholder, data: b, baseY: y });

    // pedestal
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.6, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: '#1b2336', roughness: 0.9 })
    );
    ped.position.set(x, 0.15, z);
    ped.receiveShadow = true;
    ringGroup.add(ped);

    // name plate (canvas texture)
    const label = makeLabel(b.commonName);
    label.position.set(x, 0.45, z);
    ringGroup.add(label);

    // click target
    placeholder.userData.pedestal = ped;
  });

  // gentle auto-rotate of the ring
  ringGroup.userData.spin = 0.0008;
  scene.userData.ring = ringGroup;

  // --- relation graph (deterministic, offline) ---
  edges = buildRelations(birdsData);
  relationGroup = new THREE.Group();
  ringGroup.add(relationGroup);
  rebuildRelationLines();
}

// Draw relation edges as lines inside the (rotating) ring group.
function rebuildRelationLines() {
  if (!relationGroup) return;
  while (relationGroup.children.length) relationGroup.remove(relationGroup.children[0]);
  const byId = (id) => birdMeshes.get(id);
  for (const e of edges) {
    if (relationMode === 'off') continue;
    if (relationMode === 'selected' && selected && e.source !== selected && e.target !== selected) continue;
    const a = byId(e.source), b = byId(e.target);
    if (!a || !b) continue;
    const pa = a.group.position, pb = b.group.position;
    const col = RELATION_TYPES[e.primary] ? RELATION_TYPES[e.primary].color : '#888';
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(pa.x, pa.y, pa.z),
      new THREE.Vector3(pb.x, pb.y, pb.z),
    ]);
    const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(col), transparent: true, opacity: 0.18 + e.strength * 0.5 });
    relationGroup.add(new THREE.Line(geo, mat));
  }
}

function makeLabel(text) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(10,14,28,0.85)';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#e8eefc';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(c);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  spr.scale.set(2.2, 0.55, 1);
  return spr;
}

function defaultProfile(b) {
  return {
    form: 'perching',
    palette: { body: '#888', belly: '#aaa', wing: '#555', beak: '#222', leg: '#caa05a', neck: '#999', eye: '#111' },
    proportions: { bodyLen: 0.5, bodyHeight: 0.35, neckLen: 0.2, legLen: 0.35, beakLen: 0.15 },
    flightless: false,
  };
}

// Raycaster for selection
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downPos = null;

renderer && 0; // noop
window.addEventListener('pointerdown', (e) => { downPos = { x: e.clientX, y: e.clientY }; });
window.addEventListener('pointerup', (e) => {
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
  downPos = null;
  if (moved > 6) return; // was a drag
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const targets = [...birdMeshes.values()].map((m) => m.group);
  const hits = raycaster.intersectObjects(targets, true);
  if (hits.length) {
    let obj = hits[0].object;
    while (obj && !obj.userData.id) obj = obj.parent;
    if (obj && obj.userData.id) selectBird(obj.userData.id);
  }
});

function selectBird(id) {
  selected = id;
  const entry = birdMeshes.get(id);
  if (!entry) return;
  const b = entry.data;
  controls.target.set(entry.group.position.x, entry.baseY + 0.5, entry.group.position.z);
  showInfo(b);
  // highlight pedestal
  birdMeshes.forEach((m) => { if (m.group.userData.pedestal) m.group.userData.pedestal.material.emissive = new THREE.Color('#000'); });
  if (entry.group.userData.pedestal) entry.group.userData.pedestal.material.emissive = new THREE.Color('#2a6cff');
  // pause ring spin to focus
  if (scene.userData.ring) scene.userData.ring.userData.spin = 0;
  // auto-play this bird's call (also unlocks the AudioContext on user gesture)
  resumeAudio();
  playBirdCall(b, { repeat: 1 });
  if (relationMode === 'selected') rebuildRelationLines();
  document.querySelectorAll('.bird-card').forEach((el) => {
    el.classList.toggle('active', el.dataset.id === id);
  });
}

function showInfo(b) {
  const el = document.getElementById('info');
  const status = IUCN_LABEL[b.iucnStatus] || b.iucnStatus;
  const col = IUCN_COLORS[b.iucnStatus] || '#888';
  el.innerHTML = `
    <button class="close" onclick="window.__closeInfo()">✕</button>
    <div class="panel-head">
      <div>
        <h2>${b.commonName}</h2>
        <div class="sci">${b.scientificName}</div>
      </div>
      <button class="sound-btn" onclick="window.__playCall('${b.id}')" title="Play this bird's call (synthesized)">🔊 Play call</button>
    </div>
    <div class="tags">
      <span class="tag" style="background:${col}22;color:${col};border:1px solid ${col}">IUCN: ${status}</span>
      <span class="tag">${b.order}</span>
      <span class="tag">${b.family}</span>
    </div>
    <div class="grid">
      <div><b>Length</b><br>${b.lengthCm} cm</div>
      <div><b>Wingspan</b><br>${b.wingspanCm ? b.wingspanCm + ' cm' : '—'}</div>
      <div><b>Habitat</b><br>${b.habitat}</div>
      <div><b>Diet</b><br>${b.diet}</div>
    </div>
    <div class="section"><b>Range:</b> ${b.range.join(', ')}</div>
    <div class="section"><b>Call:</b> ${b.call}</div>
    ${relationBlock(b)}
    <div class="facts"><b>Did you know?</b><ul>${b.funFacts.map((f) => `<li>${f}</li>`).join('')}</ul></div>
    <div class="agi"><b>For the AGI:</b> species=<code>${b.scientificName}</code>, status=<code>${b.iucnStatus}</code>, render=<code>${b.render ? b.render.type : 'procedural'}</code></div>
  `;
  el.classList.add('open');
}

function relationBlock(b) {
  if (!edges.length) return '';
  const ns = neighborsOf(edges, b.id);
  if (!ns.length) return '<div class="section"><b>Relations:</b> no derived links in this set.</div>';
  const items = ns
    .sort((x, y) => y.edge.strength - x.edge.strength)
    .map(({ other, edge }) => {
      const ob = birdMeshes.get(other);
      const name = ob ? ob.data.commonName : other;
      const rels = edge.relations.map((r) => RELATION_TYPES[r] ? RELATION_TYPES[r].label : r).join(', ');
      const col = RELATION_TYPES[edge.primary] ? RELATION_TYPES[edge.primary].color : '#888';
      return `<li><span style="color:${col}">●</span> <a href="#" onclick="window.__selectFromList('${other}');return false;">${name}</a> — ${rels}</li>`;
    }).join('');
  return `<div class="facts"><b>🔗 Relations (${ns.length}):</b><ul>${items}</ul></div>`;
}
window.__playCall = function (id) {
  const entry = birdMeshes.get(id);
  if (entry) playBirdCall(entry.data, { repeat: 1 });
};
window.__toggleMute = function () {
  const next = !isMuted();
  setMuted(next);
  const btn = document.getElementById('muteBtn');
  if (btn) {
    btn.textContent = next ? '🔇 Muted' : '🔊 Sound';
    btn.classList.toggle('off', next);
  }
};
window.__setRelationMode = function (mode) {
  relationMode = mode;
  document.querySelectorAll('.rel-btn').forEach((el) => el.classList.toggle('active', el.dataset.mode === mode));
  rebuildRelationLines();
};
window.__closeInfo = function () {
  document.getElementById('info').classList.remove('open');
  selected = null;
  birdMeshes.forEach((m) => { if (m.group.userData.pedestal) m.group.userData.pedestal.material.emissive = new THREE.Color('#000'); });
  if (scene.userData.ring) scene.userData.ring.userData.spin = 0.0008;
  document.querySelectorAll('.bird-card').forEach((el) => el.classList.remove('active'));
};

function buildUI() {
  const list = document.getElementById('birds');
  const orders = {};
  birdsData.forEach((b) => { (orders[b.order] = orders[b.order] || []).push(b); });
  list.innerHTML = birdsData.map((b) => `
    <div class="bird-card" data-id="${b.id}" onclick="window.__selectFromList('${b.id}')">
      <span class="dot" style="background:${IUCN_COLORS[b.iucnStatus] || '#888'}"></span>
      <span class="name">${b.commonName}</span>
      <span class="order">${b.order}</span>
    </div>`).join('');

  window.__selectFromList = (id) => {
    selectBird(id);
    const entry = birdMeshes.get(id);
    if (entry) controls.target.set(entry.group.position.x, entry.baseY + 0.5, entry.group.position.z);
  };

  const search = document.getElementById('search');
  search.addEventListener('input', () => {
    const q = search.value.toLowerCase().trim();
    document.querySelectorAll('.bird-card').forEach((el) => {
      const b = birdsData.find((x) => x.id === el.dataset.id);
      const hit = !q || b.commonName.toLowerCase().includes(q) || b.scientificName.toLowerCase().includes(q) || b.family.toLowerCase().includes(q) || b.order.toLowerCase().includes(q);
      el.style.display = hit ? '' : 'none';
    });
  });

  const filter = document.getElementById('filterStatus');
  filter.addEventListener('change', () => {
    const v = filter.value;
    document.querySelectorAll('.bird-card').forEach((el) => {
      const b = birdsData.find((x) => x.id === el.dataset.id);
      const hit = !v || b.iucnStatus === v;
      el.style.display = hit ? '' : 'none';
    });
  });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  // idle bob + spin for each bird; focused one stays put
  birdMeshes.forEach((m, id) => {
    const g = m.group;
    g.position.y = m.baseY + Math.sin(t * 1.5 + g.position.x) * 0.12;
    if (id !== selected) g.rotation.y += g.userData.spin || 0.004;
  });
  if (scene.userData.ring) scene.userData.ring.rotation.y += scene.userData.ring.userData.spin || 0;
  controls.update();
  renderer.render(scene, camera);
}
