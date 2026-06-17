// ═══════════════════════════════════════════════════════════════
// SYSTEMS: POWER-UPS
// Collectible orbs on the track — boost, shield, magnet
// ═══════════════════════════════════════════════════════════════

const Powerups = {
  // Pool of pickup objects on the track
  pickups: [],

  // Active effects on the player
  active: {
    boost: 0,      // remaining seconds
    shield: 0,     // remaining seconds
    magnet: 0,     // remaining seconds
  },

  // Types config
  types: {
    boost:  { color: 0xff8800, name: 'BOOST',  emoji: '🔥', duration: 2.5, desc: '+50% top speed' },
    shield: { color: 0x00ffff, name: 'SHIELD', emoji: '🛡️', duration: 5,   desc: 'No collision damage' },
    magnet: { color: 0xff00ff, name: 'MAGNET', emoji: '🧲', duration: 4,   desc: 'Pulls nearby powerups' },
  },

  // Place pickups along the track
  spawn(trackCurve) {
    if (!trackCurve) return;
    this._clear();
    const count = 12;
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const typeKey = Object.keys(this.types)[i % 3];
      const type = this.types[typeKey];
      const pos = trackCurve.getPointAt(t);
      const tan = trackCurve.getTangentAt(t);
      const normal = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const group = new THREE.Group();
      group.position.set(pos.x, pos.y + 3, pos.z);

      // Inner core
      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.6, 1),
        new THREE.MeshBasicMaterial({ color: type.color, transparent: true, opacity: 0.9 })
      );
      core.userData = { phase: Math.random() * Math.PI * 2 };
      group.add(core);

      // Outer ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.2, 0.06, 8, 24),
        new THREE.MeshBasicMaterial({ color: type.color, transparent: true, opacity: 0.6 })
      );
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      // Glow point
      const glow = new THREE.PointLight(type.color, 2, 10);
      group.add(glow);

      group.userData = { type: typeKey, t: t, core: core, ring: ring, active: true, collected: false };
      Engine.scene.add(group);
      this.pickups.push(group);
    }
  },

  _clear() {
    this.pickups.forEach(p => Engine.scene.remove(p));
    this.pickups = [];
  },

  reset() {
    this._clear();
    this.active.boost = 0;
    this.active.shield = 0;
    this.active.magnet = 0;
  },

  // Decay active effect timers
  tick(dt) {
    if (this.active.boost  > 0) this.active.boost  = Math.max(0, this.active.boost  - dt / 60);
    if (this.active.shield > 0) this.active.shield = Math.max(0, this.active.shield - dt / 60);
    if (this.active.magnet > 0) this.active.magnet = Math.max(0, this.active.magnet - dt / 60);
  },

  // Magnet pull — gently yanks nearby uncollected pickups toward the player
  attractToPlayer(playerX, playerY, playerZ) {
    if (this.active.magnet <= 0) return;
    this.pickups.forEach(p => {
      if (!p.userData.active) return;
      const dx = playerX - p.position.x;
      const dz = playerZ - p.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 25 && dist > 0.1) {
        const pullStrength = (1 - dist / 25) * 0.6;
        p.position.x += (dx / dist) * pullStrength;
        p.position.z += (dz / dist) * pullStrength;
        p.position.y += (playerY + 2 - p.position.y) * 0.1;
      }
    });
  },

  // Animate the meshes (called every frame)
  updateVisuals(dt) {
    const now = performance.now() / 1000;
    this.pickups.forEach(p => {
      if (!p.userData.active) return;
      p.userData.core.rotation.x += 0.04;
      p.userData.core.rotation.y += 0.06;
      p.userData.ring.rotation.z += 0.03;
      const pulse = 1 + Math.sin(now * 2 + p.userData.core.userData.phase) * 0.15;
      p.userData.core.scale.setScalar(pulse);
    });
  },

  // Detect & collect a single pickup per call. Returns pickup data or null.
  checkPickup(playerX, playerZ) {
    const collectRange = this.active.magnet > 0 ? 6 : 3.5;
    for (const p of this.pickups) {
      if (!p.userData.active) continue;
      const dx = p.position.x - playerX;
      const dz = p.position.z - playerZ;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < collectRange) {
        return p;
      }
    }
    return null;
  },

  // Apply the effect from a collected pickup
  applyEffect(pickup) {
    if (!pickup || !pickup.userData.active) return null;
    pickup.userData.active = false;
    pickup.userData.collected = true;
    Engine.scene.remove(pickup);

    const typeKey = pickup.userData.type;
    const type = this.types[typeKey];
    this.active[typeKey] = type.duration;

    Combos.score += 200;
    Combos.scoreThisLap += 200;
    if (typeof Achievements !== 'undefined') {
      Achievements.onPowerupCollected(this.active.magnet > 0 && typeKey === 'magnet');
    }

    for (let i = 0; i < 20; i++) {
      const ang = Math.random() * Math.PI * 2;
      Particles.spawn(
        pickup.position.x, pickup.position.y, pickup.position.z,
        Math.cos(ang) * 2, Math.random() * 3, Math.sin(ang) * 2,
        (type.color >> 16) / 255, ((type.color >> 8) & 0xff) / 255, (type.color & 0xff) / 255
      );
    }

    return { type: typeKey, info: type, position: pickup.position.clone() };
  },

  // Legacy single-step update (kept for backward compatibility)
  update(dt, playerX, playerY, playerZ) {
    this.tick(dt);
    this.attractToPlayer(playerX, playerY, playerZ);
    this.updateVisuals(dt);
    const p = this.checkPickup(playerX, playerZ);
    if (p) this.applyEffect(p);
  },

  // Used by physics to apply effects
  getSpeedMultiplier() {
    return this.active.boost > 0 ? 1.5 : 1.0;
  },

  isShielded() { return this.active.shield > 0; },
  isMagnetActive() { return this.active.magnet > 0; },
  isBoostActive() { return this.active.boost > 0; }
};
