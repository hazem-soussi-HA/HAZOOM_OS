// ═══════════════════════════════════════════════════════════════
// ENTITIES: CAR
// 3D car model builder — detailed body, wheels, lights, effects
// ═══════════════════════════════════════════════════════════════

const CarBuilder = {
  group: null,

  create(color) {
    this.group = new THREE.Group();
    const bodyColor = 0x0a0a0a;
    const accent = color;

    // Main body — extruded shape
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-1.2, 0);
    bodyShape.lineTo(-1.0, 0.5);
    bodyShape.lineTo(-0.3, 0.7);
    bodyShape.lineTo(0.5, 0.7);
    bodyShape.lineTo(1.0, 0.5);
    bodyShape.lineTo(1.2, 0);
    bodyShape.lineTo(1.0, -0.3);
    bodyShape.lineTo(-1.0, -0.3);
    bodyShape.closePath();

    const extrudeSettings = {
      depth: 4.5, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3
    };
    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
    bodyGeo.center();
    const bodyMat = new THREE.MeshPhongMaterial({
      color: bodyColor, emissive: accent, emissiveIntensity: 0.15,
      shininess: 150, specular: 0xffffff
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.y = Math.PI / 2;
    body.position.z = -0.5;
    this.group.add(body);

    // Canopy
    const canopyGeo = new THREE.SphereGeometry(0.65, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const canopyMat = new THREE.MeshPhongMaterial({
      color: accent, emissive: accent, emissiveIntensity: 0.1,
      transparent: true, opacity: 0.35, shininess: 200
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.5, -0.5);
    canopy.scale.set(1, 0.6, 1.2);
    this.group.add(canopy);

    // Side skirts
    for (const side of [-1, 1]) {
      const skirtGeo = new THREE.BoxGeometry(0.15, 0.1, 3.5);
      const skirtMat = new THREE.MeshPhongMaterial({
        color: accent, emissive: accent, emissiveIntensity: 0.5
      });
      const skirt = new THREE.Mesh(skirtGeo, skirtMat);
      skirt.position.set(side * 1.1, -0.25, 0.5);
      this.group.add(skirt);
    }

    // Front splitter
    const splitterGeo = new THREE.BoxGeometry(2.6, 0.08, 0.6);
    const splitterMat = new THREE.MeshPhongMaterial({
      color: accent, emissive: accent, emissiveIntensity: 0.3
    });
    const splitter = new THREE.Mesh(splitterGeo, splitterMat);
    splitter.position.set(0, -0.35, -2.5);
    this.group.add(splitter);

    // Rear diffuser
    const diffuserGeo = new THREE.BoxGeometry(2.4, 0.15, 0.5);
    const diffuser = new THREE.Mesh(diffuserGeo, splitterMat);
    diffuser.position.set(0, -0.3, 2.5);
    this.group.add(diffuser);

    // Rear wing
    const wingGeo = new THREE.BoxGeometry(2.8, 0.08, 0.5);
    const wingMat = new THREE.MeshPhongMaterial({
      color: bodyColor, emissive: accent, emissiveIntensity: 0.2, shininess: 100
    });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(0, 0.7, 2.2);
    this.group.add(wing);

    // Wing supports
    for (const side of [-1, 1]) {
      const supportGeo = new THREE.BoxGeometry(0.08, 0.5, 0.08);
      const support = new THREE.Mesh(supportGeo, wingMat);
      support.position.set(side * 1.0, 0.45, 2.2);
      this.group.add(support);
    }

    // Headlights
    for (const side of [-1, 1]) {
      const headlightGeo = new THREE.BoxGeometry(0.6, 0.08, 0.15);
      const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const headlight = new THREE.Mesh(headlightGeo, headlightMat);
      headlight.position.set(side * 0.7, 0.1, -2.3);
      this.group.add(headlight);

      if (color === 0x00ffff) {
        const beamLight = new THREE.SpotLight(0xffffff, 3, 80, 0.4, 0.5, 1);
        beamLight.position.set(side * 0.7, 0.1, -2.3);
        beamLight.target.position.set(side * 0.7, 0, -30);
        this.group.add(beamLight);
        this.group.add(beamLight.target);
      }
    }

    // Tail lights
    const tailGeo = new THREE.BoxGeometry(2.4, 0.06, 0.1);
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0033, transparent: true, opacity: 0.8 });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 0.15, 2.3);
    tail.name = 'taillight';
    this.group.add(tail);

    // Tail light rings
    for (const side of [-1, 1]) {
      const ringGeo = new THREE.TorusGeometry(0.3, 0.04, 8, 20);
      const ringMat = new THREE.MeshBasicMaterial({ color: accent });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(side * 0.5, -0.1, 2.5);
      this.group.add(ring);
    }

    // Underglow
    const underglowGeo = new THREE.PlaneGeometry(3, 5);
    const underglowMat = new THREE.MeshBasicMaterial({
      color: accent, transparent: true, opacity: 0.15, side: THREE.DoubleSide
    });
    const underglow = new THREE.Mesh(underglowGeo, underglowMat);
    underglow.rotation.x = -Math.PI / 2;
    underglow.position.y = -0.5;
    underglow.name = 'underglow';
    this.group.add(underglow);

    // Thruster light
    const thrusterLight = new THREE.PointLight(accent, 5, 25);
    thrusterLight.position.set(0, 0, 2.5);
    thrusterLight.name = 'thruster';
    this.group.add(thrusterLight);

    // Body accent lines
    for (const side of [-1, 1]) {
      const lineGeo = new THREE.BoxGeometry(0.03, 0.03, 4);
      const lineMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.6 });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(side * 1.15, 0.1, 0);
      this.group.add(line);
    }

    return this.group;
  },

  get() { return this.group; },

  update(gameTime, isNitro, brakeGlow, invincible) {
    if (!this.group) return;

    // Thruster
    const thruster = this.group.getObjectByName('thruster');
    if (thruster) {
      thruster.color.setHex(isNitro ? 0xff8800 : 0x00ffff);
      thruster.intensity = isNitro ? 15 + Math.sin(gameTime * 20) * 5 : 5 + Math.sin(gameTime * 10) * 2;
    }

    // Underglow pulse
    const underglow = this.group.getObjectByName('underglow');
    if (underglow) {
      underglow.material.opacity = 0.12 + Math.sin(gameTime * 2) * 0.05;
    }

    // Brake lights
    const taillight = this.group.getObjectByName('taillight');
    if (taillight) {
      taillight.material.opacity = 0.5 + brakeGlow * 0.5;
      taillight.material.color.setHex(brakeGlow > 0.3 ? 0xff2200 : 0xff0033);
    }

    // Invincibility blink
    if (invincible > 0 && Math.floor(invincible * 10) % 3 < 2) {
      this.group.visible = false;
    } else {
      this.group.visible = true;
    }
  }
};
