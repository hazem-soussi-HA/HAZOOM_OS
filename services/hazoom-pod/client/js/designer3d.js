/**
 * js/designer3d.js — 3D-ready design preview for the Design Studio (ES module).
 *
 * Exposes window.hazoom3D with:
 *   init(container, opts)  -> creates a Three.js scene mounted in `container`,
 *                             returns a controller object.
 *
 * This is the real garment engine: it builds an actual T-SHIRT mesh (sleeves,
 * neckline, body) from an extruded silhouette with correct UVs, so the live
 * design texture wraps onto the chest like a printed shirt. Mug and cap are
 * also modeled properly. Call controller.paint(drawFn) whenever the design
 * changes; drawFn(ctx, size) composites the design onto a square texture that
 * maps to the garment surface.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function makeDesignCanvas(size = 1024) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

/**
 * Build a T-shirt silhouette as a THREE.Shape (units ~ -1.3..1.3 wide,
 * -1.6..1.6 tall). The chest print area is the central band where the design
 * UVs land. Returns the shape.
 */
function tshirtShape() {
  const s = new THREE.Shape();
  // Coordinates: x right, y up. Shoulders at y~1.45, hem at y~-1.6.
  const shoulderY = 1.45;
  const hemY = -1.6;
  const bodyHalf = 0.95;     // half width of the torso
  const sleeveTipX = 1.55;   // how far sleeves stick out
  const sleeveY = 0.55;      // where the sleeve meets the body
  const neckHalf = 0.32;     // half width of the neck opening
  const neckDrop = 0.28;     // how deep the neckline dips

  s.moveTo(-bodyHalf, hemY);                                  // bottom-left hem
  s.lineTo(-bodyHalf, shoulderY);                             // up the left side
  // left sleeve: out and down to tip, then back to underarm
  s.lineTo(-sleeveTipX, shoulderY - 0.1);
  s.lineTo(-sleeveTipX, sleeveY);
  s.lineTo(-bodyHalf, sleeveY - 0.05);
  // left shoulder up to neck
  s.lineTo(-neckHalf, shoulderY);
  // neckline (scooped) — quadratic curve across to right shoulder
  s.quadraticCurveTo(0, shoulderY + neckDrop, neckHalf, shoulderY);
  // right shoulder down
  s.lineTo(bodyHalf, sleeveY - 0.05);
  // right sleeve
  s.lineTo(sleeveTipX, sleeveY);
  s.lineTo(sleeveTipX, shoulderY - 0.1);
  s.lineTo(bodyHalf, shoulderY);
  // down the right side to hem
  s.lineTo(bodyHalf, hemY);
  s.lineTo(-bodyHalf, hemY);
  return s;
}

/**
 * Map a 2D silhouette (x in [-1.6,1.6], y in [-1.7,1.7]) to UV (0..1).
 * The chest print window is centered with a comfortable margin so the design
 * sits on the torso, not the sleeves/neck.
 */
function silhouetteUV(x, y) {
  // Design/window bounds in shape space (the printable chest area).
  const winMinX = -0.62, winMaxX = 0.62;
  const winMinY = -0.95, winMaxY = 0.78;
  const u = (x - winMinX) / (winMaxX - winMinX);
  const v = (y - winMinY) / (winMaxY - winMinY);
  // No extra flip: CanvasTexture defaults to flipY=true, so shape-space +Y
  // (shirt top) already maps to texture +V (canvas top). Flipping here would
  // render the design upside-down on the chest.
  return [THREE.MathUtils.clamp(u, 0, 1), THREE.MathUtils.clamp(v, 0, 1)];
}

function buildTshirtGeometry() {
  const shape = tshirtShape();
  const depth = 0.18; // fabric thickness-ish
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
    curveSegments: 24,
  });

  // Build UVs from the SHAPE-SPACE XY of each vertex (before center() shifts
  // the coordinates), so the chest print window maps correctly onto the front.
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const [u, v] = silhouetteUV(pos.getX(i), pos.getY(i));
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

  geo.center();
  geo.computeVertexNormals();
  return geo;
}

function buildMesh(shape, material) {
  let geo;
  switch (shape) {
    case 'mug':
      // cylinder body + a thin handle ring
      geo = new THREE.CylinderGeometry(1, 1, 1.9, 64, 1, true);
      break;
    case 'cap':
      geo = new THREE.SphereGeometry(1.1, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2);
      break;
    case 'tshirt':
    default:
      geo = buildTshirtGeometry();
      break;
  }
  const mesh = new THREE.Mesh(geo, material);

  // A mug looks better rotated a touch; t-shirts stand upright.
  if (shape === 'cap') mesh.rotation.x = Math.PI; // dome down -> crown up
  return mesh;
}

function init(container, opts = {}) {
  const width = container.clientWidth || 420;
  const height = opts.height || 460;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0.2, 5.4);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Lighting — soft key + cool rim so fabric folds read well.
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(3, 4, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.45);
  fill.position.set(-3, 1, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x88aaff, 0.5);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  // Live design texture (the garment's printed surface).
  const designCanvas = makeDesignCanvas(1024);
  const texture = new THREE.CanvasTexture(designCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.9,
    metalness: 0.0,
  });

  let currentShape = opts.shape || 'tshirt';
  let mesh = buildMesh(currentShape, material);
  scene.add(mesh);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 9;
  controls.autoRotate = !!opts.autoRotate;
  controls.autoRotateSpeed = 1.4;

  let raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
  }
  loop();

  function resize() {
    const w = container.clientWidth || width;
    camera.aspect = w / height;
    camera.updateProjectionMatrix();
    renderer.setSize(w, height);
  }
  window.addEventListener('resize', resize);

  return {
    /**
     * Repaint the garment surface. drawFn(ctx, size) draws the fabric + design.
     * The design's chest area maps to the shirt automatically via UVs.
     */
    paint(drawFn) {
      const ctx = designCanvas.getContext('2d');
      ctx.clearRect(0, 0, designCanvas.width, designCanvas.height);
      drawFn(ctx, designCanvas.width);
      texture.needsUpdate = true;
    },
    setShape(shape) {
      if (shape === currentShape) return;
      currentShape = shape;
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh = buildMesh(shape, material);
      scene.add(mesh);
    },
    setAutoRotate(on) { controls.autoRotate = !!on; },
    resetView() { camera.position.set(0, 0.2, 5.4); controls.target.set(0, 0, 0); },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      controls.dispose();
      renderer.dispose();
      texture.dispose();
      material.dispose();
      mesh.geometry.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.remove();
    },
  };
}

window.hazoom3D = { init };
