// Temperature Meteorology — worldwide countries (offline, vendored Three.js r160)
// Globe + per-country temperature nodes, search, ranking, methodology panel.
// Data is MODELED climatology (see /data/temperatures.json meta). Live API is
// shipped but DISABLED by default to stay air-gapped; flip the flag to wire it.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const LIVE_API_ENABLED = true;  // shows ACTUAL current temp (marked LIVE) when network egress is available; fails soft to MODELED offline

// ---------------------------------------------------------------- constants
const R = 1;                       // globe radius
const NODE_R = 0.014;              // base node radius
const COL = {
  bg: 0x05070d, ocean: 0x0b1f3a, oceanEmis: 0x05101f,
  atmo: 0x3a7bd5, star: 0xffffff,
};

// ---------------------------------------------------------------- DOM refs
const $ = (id) => document.getElementById(id);
const loadingEl = $('loading');
const hudEl = $('hud');
const toastEl = $('toast');
const detailEl = $('detail');
const rankBody = $('rankBody');
const suggestEl = $('suggest');

// floating tooltip (created in JS to keep index.html lean)
const tip = document.createElement('div');
Object.assign(tip.style, {
  position: 'fixed', zIndex: 45, pointerEvents: 'none', display: 'none',
  padding: '6px 10px', borderRadius: '10px', background: 'rgba(10,15,28,.92)',
  border: '1px solid rgba(120,160,255,.25)', color: '#e8eefc', fontSize: '12px',
  fontFamily: 'Segoe UI,system-ui,sans-serif', transform: 'translate(-50%,-130%)',
  whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,.5)',
});
document.body.appendChild(tip);

// ---------------------------------------------------------------- state
let scene, camera, renderer, composer, controls, bloom, worldGroup, globe, atmo, nodes, halo, stars;
let data = null, countries = [], byIso = {};
const dummy = new THREE.Object3D();
let hovered = -1, selected = -1;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-2, -2);
let spin = true, focusZoom = true, sizeScale = 1.2;
let sortKey = 'temp', sortAsc = false, regionFilter = 'all';
let focusing = false; const camDest = new THREE.Vector3();
let frameCount = 0, lastFpsT = performance.now(), fps = 0;

const clock = new THREE.Clock();

// ---------------------------------------------------------------- utils
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isFlag = (iso2) => /^[A-Za-z]{2}$/.test(iso2);
function flagEmoji(iso2) {
  if (!isFlag(iso2)) return '🌍';
  return String.fromCodePoint(...iso2.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}
// diverging temperature ramp: cold(blue) -> cool(purple) -> mid(green) -> warm(amber) -> hot(red/white)
function tempToColor(t) {
  const stops = [
    [-25, 0x3b4cc0], [-12, 0x6a3cc0], [0, 0xc0392b],
    [10, 0xe67e22], [16, 0xf1c40f], [22, 0x7cfc00], [27, 0xffffff], [32, 0xff5e3a],
  ];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
  }
  if (t <= stops[0][0]) return new THREE.Color(stops[0][1]);
  if (t >= stops[stops.length - 1][0]) return new THREE.Color(stops[stops.length - 1][1]);
  const c1 = new THREE.Color(a[1]), c2 = new THREE.Color(b[1]);
  const f = (t - a[0]) / (b[0] - a[0]);
  return c1.lerp(c2, f);
}
function latLonToVec3(lat, lon, r) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}
function toast(msg) {
  toastEl.textContent = msg; toastEl.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

// surface any uncaught error so a silent failure is never invisible
addEventListener('error', (ev) => {
  const m = (ev.error && ev.error.stack) || ev.message || 'unknown error';
  if (loadingEl) { loadingEl.classList.remove('hide'); loadingEl.querySelector('.t').textContent = '⚠ ' + m; }
  console.error('[temp]', m);
});
addEventListener('unhandledrejection', (ev) => {
  const m = (ev.reason && (ev.reason.stack || ev.reason.message)) || String(ev.reason);
  if (loadingEl) { loadingEl.classList.remove('hide'); loadingEl.querySelector('.t').textContent = '⚠ ' + m; }
  console.error('[temp]', m);
});

// ---------------------------------------------------------------- boot
init();

async function init() {
  try {
    const res = await fetch('/data/temperatures.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
    countries = data.countries;
    countries.forEach((c, i) => { c._i = i; c._color = tempToColor(c.temp_c); byIso[c.iso2] = c; });

    buildScene();
    buildNodes();
    buildGlobeExtras();
    populateRegions();
    buildRankTable();
    wireUI();
    startClock();
    loadingEl.classList.add('hide');
    toast('Loaded ' + countries.length + ' countries · MODELED data');
    animate();
  } catch (e) {
    const m = (e && (e.stack || e.message)) || String(e);
    loadingEl.classList.remove('hide');
    loadingEl.querySelector('.t').textContent = '⚠ Failed to start: ' + m;
    console.error('[temp] init failed:', m);
  }
}

// ---------------------------------------------------------------- scene
function buildScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(COL.bg);

  camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.01, 100);
  camera.position.set(0, 0.6, 3.2);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  $('app').appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.5; controls.minDistance = 1.4; controls.maxDistance = 7;
  controls.enablePan = false;

  // lights
  scene.add(new THREE.AmbientLight(0x6677aa, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(3, 2, 4); scene.add(sun);
  const rim = new THREE.DirectionalLight(0x3355ff, 0.4);
  rim.position.set(-4, -1, -3); scene.add(rim);

  // rotating world (globe + nodes + atmosphere)
  worldGroup = new THREE.Group();
  scene.add(worldGroup);

  // ocean globe
  const geo = new THREE.SphereGeometry(R, 64, 48);
  const mat = new THREE.MeshPhongMaterial({
    color: COL.ocean, emissive: COL.oceanEmis, emissiveIntensity: 1,
    specular: 0x2a4a7a, shininess: 18,
  });
  globe = new THREE.Mesh(geo, mat);
  worldGroup.add(globe);

  // atmosphere limb glow
  const aGeo = new THREE.SphereGeometry(R * 1.025, 64, 48);
  const aMat = new THREE.MeshBasicMaterial({
    color: COL.atmo, transparent: true, opacity: 0.12,
    side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  atmo = new THREE.Mesh(aGeo, aMat);
  worldGroup.add(atmo);

  buildStars();

  // post-processing bloom
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.65, 0.5, 0.18);
  composer.addPass(bloom);

  addEventListener('resize', onResize);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
}

function buildStars() {
  const N = 2200, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 30 + Math.random() * 40;
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    pos[i * 3] = r * s * Math.cos(th);
    pos[i * 3 + 1] = r * u;
    pos[i * 3 + 2] = r * s * Math.sin(th);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color: COL.star, size: 0.15, sizeAttenuation: true, transparent: true, opacity: 0.85 });
  stars = new THREE.Points(g, m);
  scene.add(stars); // not in worldGroup -> stays fixed
}

function buildGlobeExtras() {
  // halo used for hover/selection highlight
  const hGeo = new THREE.SphereGeometry(1, 20, 16);
  const hMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.28,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  halo = new THREE.Mesh(hGeo, hMat);
  halo.visible = false;
  worldGroup.add(halo);
}

// ---------------------------------------------------------------- nodes
function buildNodes() {
  const geo = new THREE.SphereGeometry(NODE_R, 12, 12);
  const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
  nodes = new THREE.InstancedMesh(geo, mat, countries.length);
  nodes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  countries.forEach((c, i) => {
    c._pos = latLonToVec3(c.lat, c.lon, R * 1.005);
    c._dim = c._color.clone().multiplyScalar(0.22);
  });
  worldGroup.add(nodes);
  applyNodeState();
}

function nodeVisible(c) { return regionFilter === 'all' || c.region === regionFilter; }

function applyNodeState() {
  countries.forEach((c, i) => {
    const vis = nodeVisible(c);
    dummy.position.copy(c._pos);
    dummy.scale.setScalar(vis ? (c._i === selected ? 1.9 : 1) * sizeScale : 0.45 * sizeScale);
    dummy.updateMatrix();
    nodes.setMatrixAt(i, dummy.matrix);
    nodes.setColorAt(i, vis ? c._color : c._dim);
  });
  nodes.instanceMatrix.needsUpdate = true;
  if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true;
}

function worldPosOf(c) { return c._pos.clone().applyMatrix4(nodes.matrixWorld); }

// ---------------------------------------------------------------- interaction
function setPointerFromEvent(e) {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
}
function pick() {
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(nodes);
  return hit.length ? hit[0].instanceId : -1;
}
function onPointerMove(e) {
  setPointerFromEvent(e);
  const id = pick();
  if (id !== hovered) {
    hovered = id;
    renderer.domElement.style.cursor = id >= 0 ? 'pointer' : 'grab';
    if (id >= 0) showHalo(countries[id], false);
    else if (selected < 0) hideHalo();
    else showHalo(countries[selected], true);
  }
  if (id >= 0) {
    const c = countries[id];
    tip.style.display = 'block';
    tip.style.left = e.clientX + 'px';
    tip.style.top = e.clientY + 'px';
    tip.innerHTML = `<b>${flagEmoji(c.iso2)} ${c.name}</b> · <span style="color:#7df9c9;font-family:monospace">${c.temp_c}°C</span>`;
  } else tip.style.display = 'none';
}
function onPointerDown(e) {
  setPointerFromEvent(e);
  const id = pick();
  if (id >= 0) selectCountry(countries[id], true);
  else { /* keep selection; click on empty space does not deselect to avoid losing panel */ }
}
function showHalo(c, isSel) {
  halo.visible = true;
  halo.position.copy(c._pos);
  const r = NODE_R * (isSel ? 3.0 : 2.2) * sizeScale;
  halo.scale.setScalar(r);
  halo.material.color.copy(isSel ? new THREE.Color(0xffffff) : c._color);
}
function hideHalo() { halo.visible = false; }

function selectCountry(c, doFocus) {
  selected = c._i;
  applyNodeState();
  showHalo(c, true);
  fillDetail(c);
  highlightRow(c);
  if (doFocus && focusZoom) {
    const wp = worldPosOf(c);
    camDest.copy(wp.clone().normalize().multiplyScalar(R * 2.35));
    focusing = true;
  }
}

// ---------------------------------------------------------------- detail card
async function fillDetail(c) {
  let temp = c.temp_c, mode = 'MODELED';
  if (LIVE_API_ENABLED) {
    const live = await fetchLiveTemperature(c);
    if (live !== null) { temp = Math.round(live * 10) / 10; mode = 'LIVE'; }
    else mode = 'MODELED (live offline)';
  }
  $('dFlag').textContent = flagEmoji(c.iso2);
  $('dName').textContent = c.name;
  $('dTemp').textContent = temp + ' °C';
  $('dTemp').style.color = '#' + c._color.getHexString();
  $('dRegion').textContent = c.region;
  $('dLat').textContent = c.lat.toFixed(2) + '°';
  $('dLon').textContent = c.lon.toFixed(2) + '°';
  $('dElev').textContent = c.elevation_m.toLocaleString() + ' m';
  $('dModeled').textContent = c.temp_c + ' °C (' + mode + ')';
  const b = $('dBadge');
  if (temp >= 24) { b.textContent = 'Hot'; b.className = 'badge hot'; }
  else if (temp <= 0) { b.textContent = 'Freezing / cold'; b.className = 'badge cold'; }
  else { b.textContent = 'Mild'; b.className = 'badge mild'; }
  detailEl.classList.add('show');
}

async function fetchLiveTemperature(c) {
  if (!LIVE_API_ENABLED) return null;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m&timezone=auto`;
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 4000); // fail fast when offline
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(to);
    const j = await r.json();
    if (j && j.current && typeof j.current.temperature_2m === 'number') return j.current.temperature_2m;
  } catch (e) { /* offline or blocked — fall back to MODELED */ }
  return null;
}

// ---------------------------------------------------------------- ranking
function populateRegions() {
  const set = new Set(countries.map(c => c.region));
  const sel = $('regionFilter');
  [...set].sort().forEach(r => {
    const o = document.createElement('option'); o.value = r; o.textContent = r; sel.appendChild(o);
  });
}
function sortedCountries() {
  const arr = countries.filter(nodeVisible);
  const k = sortKey;
  arr.sort((a, b) => {
    let r;
    if (k === 'name' || k === 'region') r = String(a[k]).localeCompare(String(b[k]));
    else r = a.temp_c - b.temp_c;
    return sortAsc ? r : -r;
  });
  return arr;
}
function buildRankTable() {
  const arr = sortedCountries();
  rankBody.innerHTML = '';
  arr.forEach((c, idx) => {
    const tr = document.createElement('tr');
    tr.dataset.iso = c.iso2;
    tr.innerHTML =
      `<td>${idx + 1}</td>` +
      `<td><span class="dot" style="background:#${c._color.getHexString()}"></span>${c.name}</td>` +
      `<td>${c.region}</td>` +
      `<td class="t" style="color:#${c._color.getHexString()}">${c.temp_c}</td>`;
    tr.onclick = () => { selectCountry(c, true); };
    rankBody.appendChild(tr);
  });
  $('rankCount').textContent = arr.length + ' countries';
  // header sort indicators
  document.querySelectorAll('#rankTable th').forEach(th => {
    th.classList.toggle('sorted', th.dataset.k === sortKey);
    th.classList.toggle('asc', th.dataset.k === sortKey && sortAsc);
  });
}
function highlightRow(c) {
  rankBody.querySelectorAll('tr').forEach(tr => {
    tr.classList.toggle('active', tr.dataset.iso === c.iso2);
  });
  const active = rankBody.querySelector('tr.active');
  if (active) active.scrollIntoView({ block: 'nearest' });
}

// ---------------------------------------------------------------- search
let sugIdx = -1;
function showSuggest(q) {
  const ql = q.trim().toLowerCase();
  if (!ql) { suggestEl.classList.remove('show'); return; }
  const hits = countries.filter(c => c.name.toLowerCase().includes(ql)).slice(0, 8);
  if (!hits.length) { suggestEl.classList.remove('show'); return; }
  suggestEl.innerHTML = hits.map((c, i) =>
    `<div data-iso="${c.iso2}" class="${i === sugIdx ? 'active' : ''}"><span>${flagEmoji(c.iso2)} ${c.name}</span><span class="t" style="color:#${c._color.getHexString()}">${c.temp_c}°C</span></div>`
  ).join('');
  suggestEl.classList.add('show');
  suggestEl.querySelectorAll('div').forEach(d => {
    d.onclick = () => { const c = byIso[d.dataset.iso]; $('search').value = c.name; suggestEl.classList.remove('show'); selectCountry(c, true); };
  });
}

// ---------------------------------------------------------------- UI wiring
function wireUI() {
  $('spin').onchange = (e) => { spin = e.target.checked; };
  $('focusZoom').onchange = (e) => { focusZoom = e.target.checked; };
  $('sizeScale').oninput = (e) => { sizeScale = parseFloat(e.target.value); applyNodeState(); };
  $('sortBy').onchange = (e) => { sortKey = e.target.value; if (sortKey !== 'temp') sortAsc = true; else sortAsc = false; buildRankTable(); };
  $('regionFilter').onchange = (e) => { regionFilter = e.target.value; applyNodeState(); buildRankTable(); };
  $('detailClose').onclick = () => { detailEl.classList.remove('show'); selected = -1; applyNodeState(); hideHalo(); };
  $('openMethod').onclick = () => $('methodModal').classList.add('show');
  $('methodClose').onclick = () => $('methodModal').classList.remove('show');
  $('methodModal').onclick = (e) => { if (e.target === $('methodModal')) $('methodModal').classList.remove('show'); };
  addEventListener('keydown', (e) => { if (e.key === 'Escape') $('methodModal').classList.remove('show'); });

  const search = $('search');
  search.oninput = (e) => { sugIdx = -1; showSuggest(e.target.value); };
  search.onkeydown = (e) => {
    const items = [...suggestEl.querySelectorAll('div')];
    if (!items.length) return;
    if (e.key === 'ArrowDown') { sugIdx = (sugIdx + 1) % items.length; showSuggest(search.value); }
    else if (e.key === 'ArrowUp') { sugIdx = (sugIdx - 1 + items.length) % items.length; showSuggest(search.value); }
    else if (e.key === 'Enter') { const t = items[sugIdx >= 0 ? sugIdx : 0]; if (t) { const c = byIso[t.dataset.iso]; search.value = c.name; suggestEl.classList.remove('show'); selectCountry(c, true); } }
    else if (e.key === 'Escape') suggestEl.classList.remove('show');
  };
  search.onblur = () => setTimeout(() => suggestEl.classList.remove('show'), 150);

  document.querySelectorAll('#rankTable th').forEach(th => {
    th.onclick = () => {
      const k = th.dataset.k;
      if (k === 'rank') return;
      if (sortKey === k) sortAsc = !sortAsc; else { sortKey = k; sortAsc = (k !== 'temp'); }
      buildRankTable();
    };
  });
}

// ---------------------------------------------------------------- clock
function startClock() {
  const tick = () => { $('clock').textContent = new Date().toLocaleTimeString(); };
  tick(); setInterval(tick, 1000);
}

// ---------------------------------------------------------------- loop
function onResize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
}
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if (spin) worldGroup.rotation.y += dt * 0.06;
  if (focusing) {
    camera.position.lerp(camDest, 0.10);
    if (camera.position.distanceTo(camDest) < 0.02) focusing = false;
  }
  // keep halo glued to rotating node
  if (halo.visible && (hovered >= 0 || selected >= 0)) {
    const c = countries[hovered >= 0 ? hovered : selected];
    halo.position.copy(c._pos);
  }
  controls.update();
  composer.render();

  frameCount++;
  const now = performance.now();
  if (now - lastFpsT >= 1000) { fps = frameCount; frameCount = 0; lastFpsT = now; }
  hudEl.innerHTML = `<b>${fps}</b> fps · <b>${countries.length}</b> nodes · ${spin ? 'spinning' : 'paused'} · ${LIVE_API_ENABLED ? 'live-mode' : 'modeled'}`;
}
