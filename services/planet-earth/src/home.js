// Planet Earth — advanced homepage: glowing planet + animated 3D emblems.
// Vendored three + post-processing (bloom). DPR-capped, reduced-motion aware.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('home-scene');
const CAPTURABLE = new URLSearchParams(location.search).has('capturable');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: CAPTURABLE });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0, 6);

scene.add(new THREE.AmbientLight(0x335599, 0.7));
const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 4, 5); scene.add(key);
const rim = new THREE.DirectionalLight(0x4ea1ff, 1.6); rim.position.set(-4, -2, -3); scene.add(rim);

// ---- Glowing stylized planet (hero) ----
const planet = new THREE.Group();
const globe = new THREE.Mesh(
  new THREE.SphereGeometry(1.5, 64, 64),
  new THREE.MeshStandardMaterial({ color: 0x1f5fc0, roughness: 0.6, metalness: 0.1, emissive: 0x0a1a33, emissiveIntensity: 0.5 })
);
planet.add(globe);
// glowing "land" arcs (emissive) — honest: stylized, not a real texture
const landMat = new THREE.MeshStandardMaterial({ color: 0x57d98a, emissive: 0x1f8a52, emissiveIntensity: 1.4, roughness: 1 });
[[0.5, 0.5, 0.1, 0.4], [-0.6, -0.3, 0.25, 0.3], [0.1, -0.7, 0.3, 0.35], [0.7, -0.2, 0.15, 0.25]].forEach(([x, y, z, s]) => {
  const b = new THREE.Mesh(new THREE.SphereGeometry(s, 20, 20), landMat);
  b.position.set(x, y, z); b.scale.set(1, 0.55, 1); globe.add(b);
});
// atmosphere rim glow
const atmo = new THREE.Mesh(
  new THREE.SphereGeometry(1.72, 48, 48),
  new THREE.ShaderMaterial({
    transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: { c: { value: new THREE.Color(0x4ea1ff) } },
    vertexShader: `varying float i; void main(){ vec3 n=normalize(normalMatrix*normal); vec3 v=normalize((modelViewMatrix*vec4(position,1.0)).xyz); i=pow(1.0-abs(dot(n,v)),2.0); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 c; varying float i; void main(){ gl_FragColor=vec4(c, i*0.9); }`
  })
);
planet.add(atmo);
// orbiting aether node (glowing)
const node = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 2), new THREE.MeshStandardMaterial({ color: 0xaee9ff, emissive: 0x4ea1ff, emissiveIntensity: 3.0 }));
scene.add(node);

// ---- Feature emblems (emissive 3D icons) ----
function makeEmissive(geo, color, emi) {
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: emi, roughness: 0.4, metalness: 0.2 }));
}
function atom() {
  const g = new THREE.Group();
  g.add(makeEmissive(new THREE.SphereGeometry(0.2, 24, 24), 0x9fe6ff, 2.6));
  for (let i = 0; i < 3; i++) {
    const ring = makeEmissive(new THREE.TorusGeometry(0.5, 0.025, 10, 64), 0x4ea1ff, 1.8);
    ring.rotation.x = (i * Math.PI) / 3; ring.rotation.y = (i * Math.PI) / 4; g.add(ring);
  }
  return g;
}
function chat() {
  const g = new THREE.Group();
  const bubble = makeEmissive(new THREE.SphereGeometry(0.45, 24, 24), 0x6fce8a, 1.6);
  bubble.scale.set(1, 0.75, 0.7); g.add(bubble);
  for (let i = -1; i <= 1; i++) {
    const d = makeEmissive(new THREE.SphereGeometry(0.07, 12, 12), 0xffffff, 2.2); d.position.set(i * 0.17, 0, 0.32); g.add(d);
  }
  return g;
}
function shield() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.6); shape.lineTo(0.45, 0.4); shape.lineTo(0.45, -0.1); shape.lineTo(0, -0.55);
  shape.lineTo(-0.45, -0.1); shape.lineTo(-0.45, 0.4); shape.lineTo(0, 0.6);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 });
  geo.center();
  return makeEmissive(geo, 0x4ea1ff, 1.5);
}
function connect() {
  const g = new THREE.Group();
  const t1 = makeEmissive(new THREE.TorusGeometry(0.3, 0.07, 12, 40), 0x9fe6ff, 2.0);
  const t2 = makeEmissive(new THREE.TorusGeometry(0.3, 0.07, 12, 40), 0x6fce8a, 2.0);
  t2.position.x = 0.28; t1.rotation.z = 0.5; t2.rotation.z = -0.5; g.add(t1, t2);
  return g;
}
const emblems = [atom(), chat(), shield(), connect()];
emblems.forEach((e) => { e.scale.setScalar(0.95); e.visible = false; scene.add(e); });

// ---- Bloom composer ----
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(420, 420), 0.85, 0.6, 0.2);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize() {
  const stage = canvas.parentElement;
  const w = (stage && stage.clientWidth) || canvas.clientWidth || 420;
  const h = w; // square stage
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = 1; camera.updateProjectionMatrix();
}
window.addEventListener('load', resize);
resize();

// ---- Animation ----
const clock = new THREE.Clock();
let active = -1;
function setActive(i) {
  if (active === i) return;
  if (active >= 0) emblems[active].visible = false;
  active = i;
  emblems[active].visible = true;
  emblems[active].position.set(0, 0, 0);
  planet.position.set(-2.4, 0, 0); atmo.position.set(-2.4, 0, 0);
  node.position.set(-2.4 + Math.cos(0) * 2.0, 0, Math.sin(0) * 2.0); // park node near planet
}
let t = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = clock.getDelta(); t += dt;
  if (!reduceMotion) {
    globe.rotation.y += dt * 0.25; atmo.rotation.y -= dt * 0.1;
    node.position.set(-2.4 + Math.cos(t * 1.2) * 2.0, Math.sin(t * 1.6) * 0.5, Math.sin(t * 1.2) * 2.0);
    // auto-cycle emblem every 3.4s when nothing hovered
    if (Math.floor(t / 3.4) !== Math.floor((t - dt) / 3.4)) setActive((active + 1) % emblems.length);
    if (active >= 0) { emblems[active].rotation.y += dt * 0.7; emblems[active].rotation.x = Math.sin(t) * 0.25; }
  }
  composer.render();
}
loop();

document.querySelectorAll('.feat').forEach((el, i) => {
  el.addEventListener('mouseenter', () => setActive(i));
  el.addEventListener('focus', () => setActive(i));
});
window.addEventListener('resize', resize);

// Verification hook (capturable mode only): force a synchronous render + read.
if (CAPTURABLE) {
  window.__home = {
    renderNow() { composer.render(); return renderer.info.render; },
  };
}
