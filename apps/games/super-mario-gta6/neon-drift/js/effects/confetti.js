// ═══════════════════════════════════════════════════════════════
// EFFECTS: CONFETTI
// Celebration particles for milestones, achievements, personal bests
// ═══════════════════════════════════════════════════════════════

const Confetti = {
  group: null,
  pieces: [],
  active: false,

  init() {
    this.group = new THREE.Group();
    this.group.name = 'confetti-group';
    Engine.scene.add(this.group);
  },

  reset() {
    while (this.group.children.length) {
      const c = this.group.children[0];
      this.group.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }
    this.pieces = [];
    this.active = false;
  },

  // Burst of confetti around a position
  burst(count, x, y, z) {
    if (!this.group) return;
    this.active = true;
    const cx = x !== undefined ? x : Player.x;
    const cy = y !== undefined ? y : Player.y + 5;
    const cz = z !== undefined ? z : Player.z;

    const colors = [0xff00ff, 0x00ffff, 0xffff00, 0x00ff00, 0xff8800, 0xff0044];

    for (let i = 0; i < count; i++) {
      const geo = new THREE.PlaneGeometry(0.3, 0.5);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({
        color, side: THREE.DoubleSide, transparent: true, opacity: 1
      });
      const piece = new THREE.Mesh(geo, mat);
      piece.position.set(cx, cy, cz);
      this.group.add(piece);

      this.pieces.push({
        mesh: piece,
        vx: (Math.random() - 0.5) * 8,
        vy: 3 + Math.random() * 6,
        vz: (Math.random() - 0.5) * 8,
        rx: Math.random() * Math.PI * 2,
        ry: Math.random() * Math.PI * 2,
        rz: Math.random() * Math.PI * 2,
        rvx: (Math.random() - 0.5) * 0.4,
        rvy: (Math.random() - 0.5) * 0.4,
        rvz: (Math.random() - 0.5) * 0.4,
        life: 4 + Math.random() * 2,
      });
    }
  },

  update(dt) {
    if (!this.pieces.length) return;
    const toRemove = [];
    this.pieces.forEach((p, i) => {
      p.life -= dt / 60;
      if (p.life <= 0) {
        toRemove.push(i);
        return;
      }
      p.mesh.position.x += p.vx * (dt / 60);
      p.mesh.position.y += p.vy * (dt / 60);
      p.mesh.position.z += p.vz * (dt / 60);
      p.vy -= 6 * (dt / 60); // gravity
      p.vx *= 0.99; p.vz *= 0.99;
      p.rx += p.rvx; p.ry += p.rvy; p.rz += p.rvz;
      p.mesh.rotation.set(p.rx, p.ry, p.rz);
      p.mesh.material.opacity = Math.min(1, p.life / 2);
    });
    // Remove dead pieces (reverse order to keep indices stable)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      const idx = toRemove[i];
      const p = this.pieces[idx];
      this.group.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      this.pieces.splice(idx, 1);
    }
  }
};
