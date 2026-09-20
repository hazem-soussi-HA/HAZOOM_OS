// Human Energy Construct — HAZOOM Visualizer
// Symbolic 3D representation of human energy systems.
// Not a medical or scientific model; purely artistic/educational.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ──────────────────────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────────────────────
const CONFIG = {
    aura: { enabled: true, particleCount: 2000, color: 0x00ffcc, size: 0.02 },
    nervous: { enabled: true, color: 0x00d4aa, opacity: 0.6 },
    heart: { enabled: true, color: 0xff6b9d, pulseSpeed: 2.0 },
    intention: { enabled: true, colorShift: 0.3 },
    telepathy: { enabled: false, waveSpeed: 1.5, color: 0xffcc00 },
    animation: { enabled: true, timeScale: 1.0 }
};

// ──────────────────────────────────────────────────────────────
// Three.js Setup
// ──────────────────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050714);

const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(0, 1.6, 4);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2;
controls.maxDistance = 8;
controls.target.set(0, 1.0, 0);

// Lights
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 1.2);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(3, 5, 4);
scene.add(dirLight);

// ──────────────────────────────────────────────────────────────
// Human Figure (procedural simple geometry)
// ──────────────────────────────────────────────────────────────
const humanGroup = new THREE.Group();
humanGroup.name = 'human';
scene.add(humanGroup);

const materialBase = new THREE.MeshStandardMaterial({
    color: 0x223355, metalness: 0.1, roughness: 0.7, transparent: true, opacity: 0.4
});

function createLimb(topRadius, bottomRadius, height, position, rotation = null) {
    const geo = new THREE.CapsuleGeometry(topRadius, height, 8, 16);
    const mesh = new THREE.Mesh(geo, materialBase);
    mesh.position.copy(position);
    if (rotation) mesh.rotation.set(...rotation);
    humanGroup.add(mesh);
    return mesh;
}

// Torso
const torsoGeo = new THREE.CapsuleGeometry(0.25, 0.7, 8, 16);
const torso = new THREE.Mesh(torsoGeo, materialBase);
torso.position.y = 1.0;
humanGroup.add(torso);

// Head
const headGeo = new THREE.SphereGeometry(0.12, 16, 16);
const head = new THREE.Mesh(headGeo, materialBase);
head.position.y = 1.65;
humanGroup.add(head);

// Limbs
const limbs = [];
// Upper arms
limbs.push(createLimb(0.06, 0.05, 0.35, new THREE.Vector3(-0.3, 1.35, 0), [0, 0, Math.PI / 4]));
limbs.push(createLimb(0.06, 0.05, 0.35, new THREE.Vector3(0.3, 1.35, 0), [0, 0, -Math.PI / 4]));
// Lower arms
limbs.push(createLimb(0.05, 0.04, 0.3, new THREE.Vector3(-0.5, 1.0, 0), [0, 0, Math.PI / 3]));
limbs.push(createLimb(0.05, 0.04, 0.3, new THREE.Vector3(0.5, 1.0, 0), [0, 0, -Math.PI / 3]));
// Upper legs
limbs.push(createLimb(0.09, 0.07, 0.45, new THREE.Vector3(-0.15, 0.4, 0), [0, 0, -0.2]));
limbs.push(createLimb(0.09, 0.07, 0.45, new THREE.Vector3(0.15, 0.4, 0), [0, 0, 0.2]));
// Lower legs
limbs.push(createLimb(0.07, 0.05, 0.4, new THREE.Vector3(-0.15, -0.1, 0), [0, 0, -0.1]));
limbs.push(createLimb(0.07, 0.05, 0.4, new THREE.Vector3(0.15, -0.1, 0), [0, 0, 0.1]));

// ──────────────────────────────────────────────────────────────
// AURA — particle field around body
// ──────────────────────────────────────────────────────────────
const auraParticles = new THREE.Points();
function createAura() {
    const count = CONFIG.aura.particleCount;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const baseColor = new THREE.Color(CONFIG.aura.color);
    for (let i = 0; i < count; i++) {
        // Random point in a capsule around body
        const r = 0.5 + Math.random() * 0.8;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 0.8; // shift up
        positions[i * 3 + 2] = r * Math.cos(phi);
        sizes[i] = CONFIG.aura.size * (0.5 + Math.random() * 0.5);
        // Color variation
        const c = baseColor.clone().offsetHSL((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.1);
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
        size: CONFIG.aura.size, vertexColors: true, transparent: true, opacity: 0.6,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    });
    auraParticles.geometry = geo;
    auraParticles.material = mat;
    auraParticles.visible = CONFIG.aura.enabled;
    humanGroup.add(auraParticles);
}
createAura();

// ──────────────────────────────────────────────────────────────
// NERVOUS SYSTEM — line network along spine and limbs
// ──────────────────────────────────────────────────────────────
const nervousLines = new THREE.Group();
nervousLines.name = 'nervous';
nervousLines.visible = CONFIG.nervous.enabled;
humanGroup.add(nervousLines);

function createNervousSystem() {
    const mat = new THREE.LineBasicMaterial({ color: CONFIG.nervous.color, transparent: true, opacity: CONFIG.nervous.opacity });
    // Central spine line
    const spinePoints = [];
    for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const y = 0.2 + t * 1.3;
        spinePoints.push(new THREE.Vector3(0, y, 0.05));
    }
    const spineGeo = new THREE.BufferGeometry().setFromPoints(spinePoints);
    const spineLine = new THREE.Line(spineGeo, mat);
    nervousLines.add(spineLine);

    // Branches to limbs (simplified)
    const branchData = [
        { from: new THREE.Vector3(0, 1.35, 0.05), to: new THREE.Vector3(-0.3, 1.35, 0) },
        { from: new THREE.Vector3(0, 1.35, 0.05), to: new THREE.Vector3(0.3, 1.35, 0) },
        { from: new THREE.Vector3(0, 0.6, 0.05), to: new THREE.Vector3(-0.15, 0.4, 0) },
        { from: new THREE.Vector3(0, 0.6, 0.05), to: new THREE.Vector3(0.15, 0.4, 0) }
    ];
    branchData.forEach(b => {
        const geo = new THREE.BufferGeometry().setFromPoints([b.from, b.to]);
        nervousLines.add(new THREE.Line(geo, mat));
    });
}
createNervousSystem();

// ──────────────────────────────────────────────────────────────
// HEART — pulsing sphere at heart position
// ──────────────────────────────────────────────────────────────
const heartGroup = new THREE.Group();
heartGroup.name = 'heart';
heartGroup.visible = CONFIG.heart.enabled;
humanGroup.add(heartGroup);

const heartGeo = new THREE.SphereGeometry(0.08, 16, 16);
const heartMat = new THREE.MeshBasicMaterial({
    color: CONFIG.heart.color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending
});
const heartMesh = new THREE.Mesh(heartGeo, heartMat);
heartMesh.position.set(0, 1.15, 0.2);
heartGroup.add(heartMesh);

// Outer glow
const glowGeo = new THREE.SphereGeometry(0.12, 16, 16);
const glowMat = new THREE.MeshBasicMaterial({
    color: CONFIG.heart.color, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, side: THREE.BackSide
});
const glowMesh = new THREE.Mesh(glowGeo, glowMat);
heartGroup.add(glowMesh);

// ──────────────────────────────────────────────────────────────
// INTENTION FIELD — color shift aura based on intention
// ──────────────────────────────────────────────────────────────
let intentionHue = 0.5; // default cyan
function updateIntentionColor(hue) {
    intentionHue = hue;
    // Shift aura particles color
    if (auraParticles.geometry && auraParticles.geometry.attributes.color) {
        const colors = auraParticles.geometry.attributes.color.array;
        const base = new THREE.Color().setHSL(hue, 0.8, 0.5);
        for (let i = 0; i < colors.length; i += 3) {
            const c = base.clone().offsetHSL((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.1);
            colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b;
        }
        auraParticles.geometry.attributes.color.needsUpdate = true;
    }
    // Shift nervous system
    nervousLines.traverse(obj => {
        if (obj.material && obj.material.color) {
            obj.material.color.setHSL(hue, 0.8, 0.5);
        }
    });
    // Heart color
    heartMesh.material.color.setHSL(hue, 0.8, 0.5);
    glowMesh.material.color.setHSL(hue, 0.8, 0.5);
}

// ──────────────────────────────────────────────────────────────
// TELEPATHY — wave ring expanding from head
// ──────────────────────────────────────────────────────────────
const telepathyRings = [];
function createTelepathyRing() {
    const ringGeo = new THREE.RingGeometry(0.15, 0.18, 32);
    const ringMat = new THREE.MeshBasicMaterial({
        color: CONFIG.telepathy.color, transparent: true, opacity: 0.5,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(head.getWorldPosition(new THREE.Vector3()));
    ring.rotation.x = -Math.PI / 2;
    ring.userData = { age: 0, maxAge: 3.0 };
    humanGroup.add(ring);
    telepathyRings.push(ring);
}

// ──────────────────────────────────────────────────────────────
// UI Wiring
// ──────────────────────────────────────────────────────────────
const toggles = {
    aura: document.getElementById('toggle-aura'),
    nervous: document.getElementById('toggle-nervous'),
    heart: document.getElementById('toggle-heart'),
    intention: document.getElementById('toggle-intention'),
    telepathy: document.getElementById('toggle-telepathy')
};

Object.entries(toggles).forEach(([key, el]) => {
    el.addEventListener('change', () => {
        CONFIG[key].enabled = el.checked;
        switch (key) {
            case 'aura': auraParticles.visible = el.checked; break;
            case 'nervous': nervousLines.visible = el.checked; break;
            case 'heart': heartGroup.visible = el.checked; break;
            case 'intention': /* color shift handled in animation */ break;
            case 'telepathy': /* rings created on demand */ break;
        }
        updateStatus();
    });
});

const intentionText = document.getElementById('intention-text');
const applyBtn = document.getElementById('apply-intention');
const feedback = document.getElementById('intention-feedback');

function hashStringToHue(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return (Math.abs(hash) % 360) / 360;
}

applyBtn.addEventListener('click', () => {
    const text = intentionText.value.trim();
    if (!text) { feedback.textContent = 'Enter an intention first.'; return; }
    const hue = hashStringToHue(text);
    updateIntentionColor(hue);
    feedback.textContent = `Intention applied: hue ${(hue * 360).toFixed(0)}°`;
    if (CONFIG.telepathy.enabled && toggles.telepathy.checked) {
        createTelepathyRing();
    }
});

// ──────────────────────────────────────────────────────────────
// Animation Loop
// ──────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let lastTime = 0;

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1) * CONFIG.animation.timeScale;
    const elapsed = clock.getElapsedTime();

    // Aura particle drift
    if (CONFIG.aura.enabled && auraParticles.geometry) {
        const positions = auraParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] += Math.sin(elapsed * 0.5 + i * 0.01) * 0.0005;
            positions[i] += Math.cos(elapsed * 0.3 + i * 0.01) * 0.0003;
        }
        auraParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Heart pulse
    if (CONFIG.heart.enabled) {
        const scale = 1 + Math.sin(elapsed * CONFIG.heart.pulseSpeed) * 0.15;
        heartMesh.scale.setScalar(scale);
        glowMesh.scale.setScalar(scale * 1.2);
        // Opacity pulse
        heartMesh.material.opacity = 0.6 + Math.sin(elapsed * CONFIG.heart.pulseSpeed) * 0.2;
        glowMesh.material.opacity = 0.15 + Math.sin(elapsed * CONFIG.heart.pulseSpeed) * 0.1;
    }

    // Nervous system subtle pulse
    if (CONFIG.nervous.enabled) {
        nervousLines.traverse(obj => {
            if (obj.material && obj.material.opacity !== undefined) {
                obj.material.opacity = CONFIG.nervous.opacity * (0.8 + Math.sin(elapsed * 2 + obj.id * 0.5) * 0.2);
            }
        });
    }

    // Telepathy rings expand and fade
    for (let i = telepathyRings.length - 1; i >= 0; i--) {
        const ring = telepathyRings[i];
        ring.userData.age += dt;
        const progress = ring.userData.age / ring.userData.maxAge;
        if (progress >= 1) {
            humanGroup.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
            telepathyRings.splice(i, 1);
        } else {
            const scale = 1 + progress * 8;
            ring.scale.setScalar(scale);
            ring.material.opacity = 0.5 * (1 - progress);
        }
    }

    // Gentle body sway
    humanGroup.rotation.y = Math.sin(elapsed * 0.1) * 0.02;

    controls.update();
    renderer.render(scene, camera);
    updateStatus(elapsed);
}

// ──────────────────────────────────────────────────────────────
// Status Display
// ──────────────────────────────────────────────────────────────
const statusEl = document.getElementById('status');
const detailsEl = document.getElementById('status-details');

function updateStatus(elapsed = 0) {
    const layers = [];
    if (CONFIG.aura.enabled) layers.push('Aura');
    if (CONFIG.nervous.enabled) layers.push('Nervous');
    if (CONFIG.heart.enabled) layers.push('Heart');
    if (CONFIG.intention.enabled) layers.push('Intention');
    if (CONFIG.telepathy.enabled) layers.push('Telepathy');
    statusEl.textContent = layers.length ? `Active: ${layers.join(', ')}` : 'All layers disabled';

    detailsEl.innerHTML = `
        <div class="stat-row"><span class="stat-label">Frame Time</span><span class="stat-value">${(clock.getDelta() * 1000).toFixed(1)} ms</span></div>
        <div class="stat-row"><span class="stat-label">Aura Particles</span><span class="stat-value">${CONFIG.aura.particleCount}</span></div>
        <div class="stat-row"><span class="stat-label">Telepathy Rings</span><span class="stat-value">${telepathyRings.length}</span></div>
        <div class="stat-row"><span class="stat-label">Intention Hue</span><span class="stat-value">${(intentionHue * 360).toFixed(0)}°</span></div>
    `;
}

// ──────────────────────────────────────────────────────────────
// Resize Handling
// ──────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
});

// ──────────────────────────────────────────────────────────────
// Start
// ──────────────────────────────────────────────────────────────
animate();