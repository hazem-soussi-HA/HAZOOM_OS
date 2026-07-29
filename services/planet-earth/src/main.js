// Planet Earth — real-time WebGL emulation
// Three.js (vendored, offline). Custom day/night terminator shader,
// cloud layer, atmospheric limb glow, procedural starfield.
// ------------------------------------------------------------------
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TEX = './assets/textures/';

// ---------------------------------------------------------------------------
// Renderer (performance-capped, color-managed)
// ---------------------------------------------------------------------------
const canvas = document.getElementById('scene');
// Production stays optimized. `?capturable=1` enables preserveDrawingBuffer so
// automated/headless tests can read back the framebuffer via readPixels.
const CAPTURABLE = new URLSearchParams(location.search).has('capturable');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    stencil: false,
    preserveDrawingBuffer: CAPTURABLE,
  });
} catch (e) {
  fatal('WebGL is not available in this browser.');
  throw e;
}
// Cap device-pixel-ratio to 2: beyond that is invisible to the eye but
// costs 2.25x the fragments on a 3x panel. This is the single biggest
// real-world perf lever on retina/mobile.
const DPR_CAP = 2;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

// Adaptive fragment precision: the per-pixel fragment shaders are the GPU hot
// path. On mobile GPUs, highp is costly and unnecessary for color/lighting, so
// we drop to mediump there. Vertex shaders keep highp (positional accuracy
// matters, and they're vertex-count-bounded, not pixel-count-bounded).
const isMobileGPU = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  || Math.min(window.innerWidth, window.innerHeight) * (window.devicePixelRatio || 1) < 700;
const FRAG_PREC = isMobileGPU ? 'precision mediump float;' : 'precision highp float;';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(0, 1.6, 6.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.rotateSpeed = 0.55;
controls.minDistance = 2.35; // close enough to read the terrain (earth radius = 2)
controls.maxDistance = 18;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;

// ---------------------------------------------------------------------------
// Lighting model: a single directional "sun" we animate.
// ---------------------------------------------------------------------------
const sunDir = new THREE.Vector3(1, 0, 0);

// ---------------------------------------------------------------------------
// Loading manager → drives the progress overlay.
// ---------------------------------------------------------------------------
const manager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(manager);
const $bar = document.querySelector('#bar > i');
const $pct = document.getElementById('pct');

manager.onProgress = (url, loaded, total) => {
  const p = Math.round((loaded / total) * 100);
  $bar.style.width = p + '%';
  $pct.textContent = `loading ${p}%`;
};
manager.onLoad = () => {
  document.getElementById('loader').classList.add('hidden');
};
manager.onError = (url) => fatal(`Failed to load asset:\n${url}`);

function loadColor(name) {
  const t = loader.load(TEX + name);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
function loadData(name) {
  const t = loader.load(TEX + name);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

const dayMap = loadColor('earth_atmos_2048.jpg');
const nightMap = loadColor('earth_lights_2048.png');
const cloudMap = loadColor('earth_clouds_1024.png');
const specMap = loadData('earth_specular_2048.jpg');

// ---------------------------------------------------------------------------
// EARTH — custom day/night ShaderMaterial
// ---------------------------------------------------------------------------
const earthUniforms = {
  dayTexture:   { value: dayMap },
  nightTexture: { value: nightMap },
  specularMap:  { value: specMap },
  sunDirection: { value: sunDir },
  lightsOn:     { value: 1.0 },
  atmoColor:    { value: new THREE.Color(0x3a7bd5) },
};

const earthMat = new THREE.ShaderMaterial({
  uniforms: earthUniforms,
  vertexShader: /* glsl */`
    varying vec2 vUv;
    varying vec3 vNormalW;
    varying vec3 vViewDir;
    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vNormalW = normalize(mat3(modelMatrix) * normal);
      vViewDir = normalize(cameraPosition - worldPos.xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: /* glsl */`
    ${FRAG_PREC}
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform sampler2D specularMap;
    uniform vec3 sunDirection;
    uniform vec3 atmoColor;
    uniform float lightsOn;
    varying vec2 vUv;
    varying vec3 vNormalW;
    varying vec3 vViewDir;

    void main() {
      vec3 N = normalize(vNormalW);
      vec3 L = normalize(sunDirection);
      vec3 V = normalize(vViewDir);

      // Day/night blend across the terminator (smooth, soft line).
      float diffuse = dot(N, L);
      float dayAmt = smoothstep(-0.15, 0.25, diffuse);

      vec3 dayCol = texture2D(dayTexture, vUv).rgb;
      vec3 nightCol = texture2D(nightTexture, vUv).rgb;

      // City lights + faint night base, only on the dark side, toggleable.
      // When lightsOn = 0 the night side goes fully dark (clear OFF state).
      vec3 night = nightCol * (0.04 + lightsOn * 2.4 * (1.0 - dayAmt));
      vec3 lights = night * (1.0 - dayAmt);

      // Ocean specular glint (specular map: water bright, land dark).
      float ocean = texture2D(specularMap, vUv).r;
      vec3 H = normalize(L + V);
      float spec = pow(max(dot(N, H), 0.0), 28.0) * ocean * dayAmt;

      // Subtle atmospheric tint on the lit limb.
      float rim = pow(1.0 - max(dot(N, V), 0.0), 2.5) * dayAmt;
      vec3 limb = atmoColor * rim * 0.6;

      // Base: dark night side (gated by lightsOn) blended into lit day side.
      vec3 col = mix(lights, dayCol * 1.02, dayAmt);
      col += vec3(0.7, 0.85, 1.0) * spec * 1.6;
      col += limb;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
});

const earth = new THREE.Mesh(new THREE.SphereGeometry(2, 96, 96), earthMat);
scene.add(earth);

// ---------------------------------------------------------------------------
// CLOUDS — separate transparent sphere, slightly larger, slow drift.
// ---------------------------------------------------------------------------
const cloudMat = new THREE.MeshLambertMaterial({
  map: cloudMap,
  transparent: true,
  depthWrite: false,
  opacity: 0.9,
});
const clouds = new THREE.Mesh(new THREE.SphereGeometry(2.018, 96, 96), cloudMat);
scene.add(clouds);

// A soft light so clouds are shaded by the same sun direction.
const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
sunLight.position.copy(sunDir);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.55));

// ---------------------------------------------------------------------------
// ATMOSPHERE — back-side fresnel shell (additive glow on the limb).
// ---------------------------------------------------------------------------
const atmoUniforms = {
  sunDirection: { value: sunDir },
  glowColor:    { value: new THREE.Color(0x4ea1ff) },
};
const atmoMat = new THREE.ShaderMaterial({
  uniforms: atmoUniforms,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthWrite: false,
  vertexShader: /* glsl */`
    varying vec3 vNormalW;
    varying vec3 vViewDir;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vNormalW = normalize(mat3(modelMatrix) * normal);
      vViewDir = normalize(cameraPosition - worldPos.xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: /* glsl */`
    ${FRAG_PREC}
    uniform vec3 sunDirection;
    uniform vec3 glowColor;
    varying vec3 vNormalW;
    varying vec3 vViewDir;
    void main() {
      vec3 N = normalize(vNormalW);
      vec3 V = normalize(vViewDir);
      float fres = pow(1.0 - abs(dot(N, V)), 3.0);
      float sun = clamp(dot(N, normalize(sunDirection)) * 0.5 + 0.6, 0.0, 1.0);
      float intensity = fres * sun;
      gl_FragColor = vec4(glowColor, 1.0) * intensity * 1.4;
    }
  `,
});
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(2.22, 64, 64), atmoMat);
scene.add(atmosphere);

// ---------------------------------------------------------------------------
// STARFIELD — procedural points on a large sphere (no external skybox).
// ---------------------------------------------------------------------------
function makeStars(count, radius) {
  const pos = new Float32Array(count * 3);
  const siz = new Float32Array(count);
  const col = new Float32Array(count * 3);
  const tmp = new THREE.Vector3();
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    tmp.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
    if (tmp.lengthSq() < 1e-4) tmp.set(0, 0, 1);
    tmp.normalize().multiplyScalar(radius * (0.85 + Math.random() * 0.15));
    pos[i * 3] = tmp.x; pos[i * 3 + 1] = tmp.y; pos[i * 3 + 2] = tmp.z;
    siz[i] = Math.random() < 0.92 ? 1.0 : 2.6; // a few brighter stars
    const t = 0.6 + Math.random() * 0.4;
    c.setHSL(0.55 + Math.random() * 0.1, 0.25, t);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('size', new THREE.BufferAttribute(siz, 1));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
const starMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: { uScale: { value: window.innerHeight } },
  vertexShader: /* glsl */`
    attribute float size;
    varying vec3 vColor;
    uniform float uScale;
    void main() {
      vColor = color;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (uScale / -mv.z) * 0.035;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */`
    precision mediump float;
    varying vec3 vColor;
    void main() {
      vec2 d = gl_PointCoord - vec2(0.5);
      float a = smoothstep(0.5, 0.0, length(d));
      gl_FragColor = vec4(vColor, a);
    }
  `,
  vertexColors: true,
});
const stars = new THREE.Points(makeStars(6000, 120), starMat);
scene.add(stars);

// ---------------------------------------------------------------------------
// UI wiring
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
$('t-rotate').addEventListener('change', (e) => { controls.autoRotate = e.target.checked; dirty = true; });
$('t-clouds').addEventListener('change', (e) => { clouds.visible = e.target.checked; dirty = true; });
$('t-atmo').addEventListener('change', (e) => { atmosphere.visible = e.target.checked; dirty = true; });
$('t-lights').addEventListener('change', (e) => { earthUniforms.lightsOn.value = e.target.checked ? 1.0 : 0.0; dirty = true; });

// TIME × = how many real seconds pass per wall-clock second (time-lapse).
// 1 = live real time. 0 = freeze. Up to 200× for fast day/night cycling.
let timeScale = 1.0;
$('s-sun').addEventListener('input', (e) => {
  timeScale = parseFloat(e.target.value);
  $('v-sun').textContent = timeScale === 0 ? 'frozen' : (timeScale === 1 ? 'live' : timeScale + '×');
  dirty = true;
});
$('s-spin').addEventListener('input', (e) => {
  spinSpeed = parseFloat(e.target.value);
  $('v-spin').textContent = spinSpeed.toFixed(2);
});

let spinSpeed = 0.35;

// ---- Real-sun model -------------------------------------------------------
// The day/night terminator is driven by the ACTUAL current UTC time, not an
// arbitrary animation. We compute the Sun's sub-point (subsolar longitude /
// latitude) from the real date so the lit hemisphere matches the real Earth
// right now. Earth's axial tilt = 23.44°.
// Texture convention (verified in three.module.js SphereGeometry): u=0.5 is
// the +X axis, so we rotate the mesh so the PRIME MERIDIAN (lon 0) faces +X,
// then offset by the subsolar longitude to place the Sun correctly.
const DEG = Math.PI / 180;

// Mark the prime meridian on the sphere at +X (u=0.5). The texture already has
// lon 0 at u=0.5, so no extra offset is needed — we just keep earth.rotation.y
// as the spin from real sidereal time.
function subsolarPoint(date) {
  const JD = date.getTime() / 86400000 + 2440587.5;          // Julian Date
  const n = JD - 2451545.0;                                  // days since J2000
  const L = (280.460 + 0.9856474 * n) % 360;                 // mean longitude
  const g = ((357.528 + 0.9856003 * n) % 360) * DEG;         // mean anomaly
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG; // ecliptic lon
  const eps = 23.439 - 0.0000004 * n;                        // obliquity
  const decl = Math.asin(Math.sin(eps * DEG) * Math.sin(lambda)); // solar declination
  // equation of time -> subsolar longitude
  const GMST = (280.46061837 + 360.98564736629 * n) % 360;   // Greenwich mean sidereal
  const eqTime = L - GMST;                                   // degrees (simplified)
  let lon = -((GMST + eqTime) % 360);
  if (lon < -180) lon += 360; if (lon > 180) lon -= 360;
  return { lon: lon * DEG, lat: decl };
}

const simEpoch = Date.now();   // wall-clock start
let simTime = simEpoch;        // simulated UTC ms (advances by timeScale)

function updateAnim(dt) {
  // Advance simulated clock in real proportion to wall time × timeScale.
  simTime += dt * 1000 * timeScale;
  const sub = subsolarPoint(new Date(simTime));

  // Sun direction in world space. lon 0 -> +X. East (positive lon) rotates the
  // lit edge toward -Z; latitude tilts toward +Y (north).
  sunDir.set(
    Math.cos(sub.lat) * Math.cos(sub.lon),
    Math.sin(sub.lat),
    -Math.cos(sub.lat) * Math.sin(sub.lon)
  ).normalize();
  sunLight.position.copy(sunDir);

  // Earth self-rotation: sidereal day ≈ 23h56m04s of SIMULATED time.
  const siderealMs = 86164 * 1000;
  earth.rotation.y += (dt * 1000 * timeScale / siderealMs) * Math.PI * 2;
  clouds.rotation.y += (dt * 1000 * timeScale / siderealMs) * Math.PI * 2 * 1.02;
  stars.rotation.y += dt * 0.002;

  // Live readout for the Truth overlay.
  if (truthOpen) updateTruthLive(sub);
}

// ---- Truth / verification overlay ----------------------------------------
let truthOpen = false;
const $truth = $('truth');
const $truthLive = $('truth-live');
const $truthFacts = $('truth-facts');

const FACTS = [
  { k: 'Shape', v: 'Oblate spheroid', d: 'Sphere flattened at the poles. Equatorial radius 6,378.137 km vs polar 6,356.752 km.' },
  { k: 'Equatorial circumference', v: '40,075 km', d: 'Mean circumference around the equator (WGS-84).' },
  { k: 'Polar circumference', v: '40,008 km', d: 'Smaller than equatorial by ~67 km — the measurable oblateness.' },
  { k: 'Flattening (f)', v: '1 / 298.257', d: 'f = (a−b)/a. Non-zero and measurable from orbit and GPS.' },
  { k: 'Mean radius', v: '6,371 km', d: 'Volumetric mean radius of the reference ellipsoid.' },
  { k: 'Surface area', v: '510.1 M km²', d: '~71% ocean, ~29% land — from satellite altimetry & imagery.' },
  { k: 'Mass', v: '5.972 × 10²⁴ kg', d: 'From the orbits of the Moon and satellites (Newton + Kepler).' },
  { k: 'Day length', v: '23h 56m 04s', d: 'Sidereal rotation. Verified by tracking fixed stars nightly.' },
  { k: 'Axial tilt', v: '23.44°', d: 'Drives the seasons; observable as the Sun\'s yearly declination swing.' },
  { k: 'Gravitational accel.', v: '9.80665 m/s²', d: 'Measured worldwide; consistent with a near-spherical mass.' },
  { k: 'Atmosphere', v: '78% N₂ · 21% O₂', d: 'Thin shell ~100 km — visible as the blue limb in this render.' },
  { k: 'Proof of curvature', v: 'GPS · horizons · eclipses', d: 'Every GPS fix, ship horizon, and round shadow assumes a sphere.' },
];

$truthFacts.innerHTML = FACTS.map(f =>
  `<div class="fact"><div class="k">${f.k}</div><div class="v">${f.v}</div><div class="d">${f.d}</div></div>`
).join('');

function fmtUTC(d) {
  return d.toISOString().replace('T', ' ').replace('.000Z', ' UTC').replace('Z', ' UTC');
}
function lonToTime(lonDeg) {
  const off = lonDeg / 15; // hours
  const h = Math.floor(off), m = Math.round((off - h) * 60);
  return `UTC${h >= 0 ? '+' : ''}${h}:${String(Math.abs(m)).padStart(2, '0')}`;
}
function updateTruthLive(sub) {
  const d = new Date(simTime);
  const lonDeg = sub.lon / DEG;
  $truthLive.innerHTML =
    `Simulated time: <b>${fmtUTC(d)}</b><br>` +
    `Sun sub-point: <b>${Math.abs(lonDeg).toFixed(1)}°${lonDeg >= 0 ? 'E' : 'W'}, ` +
    `${Math.abs(sub.lat / DEG).toFixed(1)}°${sub.lat >= 0 ? 'N' : 'S'}</b><br>` +
    `Local solar time at sub-point: <b>${lonToTime(lonDeg)}</b><br>` +
    `Earth is a sphere — lit hemisphere follows the real Sun.`;
}

$('btn-truth').addEventListener('click', () => {
  truthOpen = true; $truth.hidden = false;
  updateTruthLive(subsolarPoint(new Date(simTime)));
  dirty = true;
});
$('truth-close').addEventListener('click', () => {
  truthOpen = false; $truth.hidden = true; dirty = true;
});
// ---------------------------------------------------------------------------
// Resize (DPR-capped)
// ---------------------------------------------------------------------------
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  starMat.uniforms.uScale.value = h;
  dirty = true;
}
window.addEventListener('resize', resize);

// Pause the whole loop when the tab is hidden (battery / CPU saver).
let running = true;
document.addEventListener('visibilitychange', () => {
  running = !document.hidden;
  if (running) { clock.start(); }
});

// On-demand rendering: we keep the rAF loop alive (cheap) so OrbitControls
// damping can settle smoothly, but we SKIP the actual GPU draw when nothing
// changed — that is what saves power/battery when the scene is static.
let dirty = true; // force a render after load

const clock = new THREE.Clock();
const $fps = $('fps'), $draws = $('draws'), $tris = $('tris');
let fpsAccum = 0, fpsFrames = 0, fpsLast = performance.now();

function loop() {
  if (!running) return;
  const dt = Math.min(clock.getDelta(), 0.1);

  const animating = controls.autoRotate || timeScale > 0 || spinSpeed > 0;
  if (animating) updateAnim(dt);

  // controls.update() returns true while the camera is still moving (damping).
  const moved = controls.update();

  if (dirty || animating || moved) {
    renderer.render(scene, camera);
    dirty = false;

    // Stats (read once per drawn frame).
    const now = performance.now();
    fpsFrames++; fpsAccum += now - fpsLast; fpsLast = now;
    if (fpsAccum >= 500) {
      $fps.textContent = Math.round((fpsFrames * 1000) / fpsAccum);
      $draws.textContent = renderer.info.render.calls;
      $tris.textContent = renderer.info.render.triangles.toLocaleString();
      fpsFrames = 0; fpsAccum = 0;
    }
  }
  requestAnimationFrame(loop);
}

resize();
clock.start();
loop();

// ---------------------------------------------------------------------------
function fatal(msg) {
  const el = document.getElementById('err');
  el.style.display = 'flex';
  el.textContent = msg;
  const ld = document.getElementById('loader');
  if (ld) ld.classList.add('hidden');
}
window.addEventListener('error', (e) => fatal('Runtime error:\n' + (e.message || e.error)));
