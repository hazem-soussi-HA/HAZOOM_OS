// ═══════════════════════════════════════════════════════════════
// ENTITIES: PARTICLES
// GPU particle system — nitro, sparks, smoke
// ═══════════════════════════════════════════════════════════════

const Particles = {
  system: null,
  particles: [],
  pool: [],
  count: PARTICLE_COUNT,

  init() {
    const q = QUALITY[Engine.quality];
    this.count = q.particles;

    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.count * 3);
    const col = new Float32Array(this.count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 3, vertexColors: true, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: false
    });

    this.system = new THREE.Points(geo, mat);
    Engine.scene.add(this.system);

    this.particles = [];
    this.pool = [];
    for (let i = 0; i < this.count; i++) {
      this.particles.push({ x: 0, y: -10000, z: 0, vx: 0, vy: 0, vz: 0, life: 0, r: 1, g: 1, b: 1, active: false });
      this.pool.push(i);
    }
  },

  spawn(x, y, z, vx, vy, vz, r, g, b) {
    if (this.pool.length === 0) return;
    const idx = this.pool.pop();
    const p = this.particles[idx];
    p.x = x; p.y = y; p.z = z;
    p.vx = vx; p.vy = vy; p.vz = vz;
    p.life = 1.0; p.r = r; p.g = g; p.b = b;
    p.active = true;
  },

  spawnNitro(carX, carY, carZ, angle, nitroAmount) {
    const bx = carX - Math.cos(angle) * 5;
    const by = carY - 2;
    const bz = carZ - Math.sin(angle) * 5;
    for (let i = 0; i < 2; i++) {
      this.spawn(
        bx + (Math.random() - 0.5) * 1.5, by + (Math.random() - 0.5) * 1.5, bz + (Math.random() - 0.5) * 1.5,
        -Math.cos(angle) * 1.5 + (Math.random() - 0.5), -0.8 + Math.random() * 1.6, -Math.sin(angle) * 1.5 + (Math.random() - 0.5),
        nitroAmount > 30 ? 0 : 1, nitroAmount > 30 ? 1 : 0.5, nitroAmount > 30 ? 1 : 0
      );
    }
  },

  spawnDriftSparks(carX, carY, carZ, angle) {
    const bx = carX - Math.cos(angle) * 3;
    const by = carY - 1;
    const bz = carZ - Math.sin(angle) * 3;
    for (let i = 0; i < 2; i++) {
      this.spawn(
        bx + (Math.random() - 0.5) * 2, by + (Math.random() - 0.5), bz + (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2, Math.random() * 1.5, (Math.random() - 0.5) * 2,
        1, 0.8, 0.2
      );
    }
  },

  spawnTireSmoke(carX, carY, carZ, angle) {
    const bx = carX - Math.cos(angle) * 2;
    const by = carY - 0.5;
    const bz = carZ - Math.sin(angle) * 2;
    for (let i = 0; i < 2; i++) {
      this.spawn(
        bx + (Math.random() - 0.5) * 2, by + Math.random() * 0.5, bz + (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 0.5, 0.3 + Math.random() * 0.5, (Math.random() - 0.5) * 0.5,
        0.7, 0.7, 0.7
      );
    }
  },

  update() {
    const posArr = this.system.geometry.attributes.position.array;
    const colArr = this.system.geometry.attributes.color.array;
    let dirty = false;

    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];
      if (p.active && p.life > 0) {
        p.x += p.vx; p.y += p.vy; p.z += p.vz;
        p.vx *= 0.95; p.vy *= 0.95; p.vz *= 0.95;
        p.life -= 0.025;
        posArr[i * 3] = p.x; posArr[i * 3 + 1] = p.y; posArr[i * 3 + 2] = p.z;
        colArr[i * 3] = p.r * p.life;
        colArr[i * 3 + 1] = p.g * p.life;
        colArr[i * 3 + 2] = p.b * p.life;
        if (p.life <= 0) {
          p.active = false; p.x = 0; p.y = -10000; p.z = 0;
          this.pool.push(i);
        }
        dirty = true;
      }
    }

    if (dirty && this.pool.length < this.count) {
      this.system.geometry.attributes.position.needsUpdate = true;
      this.system.geometry.attributes.color.needsUpdate = true;
    }
  }
};
