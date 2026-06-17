// ═══════════════════════════════════════════════════════════════
// ENTITIES: MASCOT
// A small floating drone companion that gives encouraging tips
// ═══════════════════════════════════════════════════════════════

const Mascot = {
  group: null,
  bobPhase: 0,
  speech: '',
  speechUntil: 0,
  speechEl: null,

  init() {
    this.group = new THREE.Group();
    this.group.name = 'mascot';

    // Body — small octahedron
    const body = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.MeshPhongMaterial({
        color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.4, shininess: 100
      })
    );
    this.group.add(body);

    // Eyes — two small black spheres
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
      eye.position.set(side * 0.2, 0.05, 0.4);
      this.group.add(eye);
    }

    // Antenna
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    antenna.position.set(0, 0.45, 0);
    this.group.add(antenna);

    // Antenna tip
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff00ff })
    );
    tip.position.set(0, 0.7, 0);
    tip.name = 'mascot-tip';
    this.group.add(tip);

    // Point light
    const light = new THREE.PointLight(0x00ffff, 1, 8);
    this.group.add(light);

    Engine.scene.add(this.group);
    this.group.visible = false; // hidden until race starts

    // Speech bubble (DOM)
    this.speechEl = document.createElement('div');
    this.speechEl.id = 'mascot-speech';
    this.speechEl.style.cssText = 'position:absolute;bottom:18%;left:50%;transform:translateX(-50%);background:rgba(0,255,255,0.15);color:#0ff;border:1px solid #0ff;padding:6px 14px;border-radius:14px;font-family:"Courier New",monospace;font-size:13px;letter-spacing:1px;z-index:25;pointer-events:none;opacity:0;transition:opacity 0.3s;text-shadow:0 0 6px rgba(0,255,255,0.6);max-width:60%;text-align:center';
    document.getElementById('ui').appendChild(this.speechEl);
  },

  show() {
    if (this.group) this.group.visible = true;
  },

  hide() {
    if (this.group) this.group.visible = false;
    this._setSpeech('');
  },

  _setSpeech(text) {
    if (!this.speechEl) return;
    this.speechEl.textContent = text;
    this.speechEl.style.opacity = text ? '1' : '0';
  },

  say(text, duration) {
    this._setSpeech(text);
    clearTimeout(this._speechTimer);
    if (duration) {
      this._speechTimer = setTimeout(() => this._setSpeech(''), duration);
    }
  },

  update(dt) {
    if (!this.group || !this.group.visible) return;

    this.bobPhase += dt / 60;

    // Float above and behind the player
    const offsetX = -Math.cos(Physics.totalAngle) * 6;
    const offsetZ = -Math.sin(Physics.totalAngle) * 6;
    const targetX = Player.x + offsetX;
    const targetZ = Player.z + offsetZ;
    const targetY = Player.y + 5 + Math.sin(this.bobPhase * 2) * 0.4;

    this.group.position.x += (targetX - this.group.position.x) * 0.06;
    this.group.position.y += (targetY - this.group.position.y) * 0.06;
    this.group.position.z += (targetZ - this.group.position.z) * 0.06;

    // Face the player / camera
    this.group.rotation.y = Physics.totalAngle;
    this.group.rotation.z = Math.sin(this.bobPhase * 2) * 0.15;

    // Spin the antenna tip
    const tip = this.group.getObjectByName('mascot-tip');
    if (tip) {
      tip.material.color.setHSL((this.bobPhase * 0.1) % 1, 1, 0.5);
    }

    // Context-aware speech
    this._maybeSpeak();
  },

  _maybeSpeak() {
    const now = performance.now();
    if (now - (this._lastSpeak || 0) < 5000) return;
    if (Math.random() > 0.03) return; // ~3% chance per frame after cooldown

    this._lastSpeak = now;

    const speed = Math.floor(Physics.v);
    let msg;

    if (Player.drifting && Combos.count >= 5) {
      msg = ['Look at you go! 🌪️', 'WHEEL MAGIC!', 'Tire royalty!'][Math.floor(Math.random() * 3)];
    } else if (speed > 300) {
      msg = ['Whoosh! 💨', 'Faster than light!', 'Speed racer!'][Math.floor(Math.random() * 3)];
    } else if (Powerups.active.boost > 0) {
      msg = 'NITRO BABY! 🚀';
    } else if (Powerups.active.shield > 0) {
      msg = 'Shield up! You\'re untouchable! 🛡️';
    } else if (Powerups.active.magnet > 0) {
      msg = 'Grab everything! 🧲';
    } else if (Combos.score < 1000 && Player.lap === 1) {
      const tips = ['Try drifting through turns!', 'W = go, S = slow, A/D = steer!', 'SPACE for nitro!', 'SHIFT to drift!'];
      msg = tips[Math.floor(Math.random() * tips.length)];
    } else {
      msg = ['You\'re amazing!', 'Keep it up!', 'Beautiful lines!', 'Smooth moves!'][Math.floor(Math.random() * 4)];
    }

    this.say(msg, 3000);
  }
};
