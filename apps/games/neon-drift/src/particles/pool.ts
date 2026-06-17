import * as THREE from 'three';
import { scene } from '../engine/scene';

const COUNT = 1000;
const geo = new THREE.BufferGeometry();
const pos = new Float32Array(COUNT * 3);
const col = new Float32Array(COUNT * 3);
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

const mat = new THREE.PointsMaterial({
  size: 3, vertexColors: true, transparent: true, opacity: 0.7,
  blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: false,
});

export const particleSystem = new THREE.Points(geo, mat);
scene.add(particleSystem);

interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number;
  r: number; g: number; b: number;
  active: boolean;
}

const particles: Particle[] = [];
const pool: number[] = [];

for (let i = 0; i < COUNT; i++) {
  particles.push({ x: 0, y: -10000, z: 0, vx: 0, vy: 0, vz: 0, life: 0, r: 1, g: 1, b: 1, active: false });
  pool.push(i);
}

function spawn(x: number, y: number, z: number, vx: number, vy: number, vz: number, r: number, g: number, b: number) {
  if (pool.length === 0) return;
  const idx = pool.pop()!;
  const p = particles[idx];
  p.x = x; p.y = y; p.z = z;
  p.vx = vx; p.vy = vy; p.vz = vz;
  p.life = 1.0; p.r = r; p.g = g; p.b = b;
  p.active = true;
}

export function spawnNitroTrail(px: number, py: number, pz: number, angle: number, nitro: number) {
  const bx = px - Math.cos(angle) * 5;
  const by = py - 2;
  const bz = pz - Math.sin(angle) * 5;
  for (let i = 0; i < 2; i++) {
    spawn(
      bx + (Math.random() - 0.5) * 1.5,
      by + (Math.random() - 0.5) * 1.5,
      bz + (Math.random() - 0.5) * 1.5,
      -Math.cos(angle) * 1.5 + (Math.random() - 0.5),
      -0.8 + Math.random() * 1.6,
      -Math.sin(angle) * 1.5 + (Math.random() - 0.5),
      nitro > 30 ? 0 : 1,
      nitro > 30 ? 1 : 0.5,
      nitro > 30 ? 1 : 0,
    );
  }
}

export function spawnDriftSparks(px: number, py: number, pz: number, angle: number) {
  const bx = px - Math.cos(angle) * 3;
  const by = py - 1;
  const bz = pz - Math.sin(angle) * 3;
  spawn(
    bx + (Math.random() - 0.5) * 2,
    by + (Math.random() - 0.5),
    bz + (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
    Math.random() * 1.5,
    (Math.random() - 0.5) * 2,
    1, 0.8, 0.2,
  );
}

export function updateParticles() {
  const posArr = particleSystem.geometry.attributes.position.array as Float32Array;
  const colArr = particleSystem.geometry.attributes.color.array as Float32Array;
  let activeCount = 0;

  for (let i = 0; i < COUNT; i++) {
    const p = particles[i];
    if (p.active && p.life > 0) {
      p.x += p.vx; p.y += p.vy; p.z += p.vz;
      p.vx *= 0.95; p.vy *= 0.95; p.vz *= 0.95;
      p.life -= 0.025;

      posArr[i * 3] = p.x; posArr[i * 3 + 1] = p.y; posArr[i * 3 + 2] = p.z;
      colArr[i * 3] = p.r * p.life; colArr[i * 3 + 1] = p.g * p.life; colArr[i * 3 + 2] = p.b * p.life;
      activeCount++;

      if (p.life <= 0) {
        p.active = false;
        p.x = 0; p.y = -10000; p.z = 0;
        pool.push(i);
      }
    }
  }

  if (activeCount > 0) {
    particleSystem.geometry.attributes.position.needsUpdate = true;
    particleSystem.geometry.attributes.color.needsUpdate = true;
  }
}
