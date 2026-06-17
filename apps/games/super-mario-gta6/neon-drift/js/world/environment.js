// ═══════════════════════════════════════════════════════════════
// WORLD: ENVIRONMENT
// Starfield, grid, buildings, track mesh generation
// ═══════════════════════════════════════════════════════════════

const Environment = {
  starField: null,
  gridHelper: null,
  trackCurve: null,
  trackMeshes: [],
  trackWidth: 24,
  selectedTrack: 'command-center',

  build(trackKey) {
    this.selectedTrack = trackKey;
    const td = TRACKS[trackKey];
    const th = td.theme;
    const sc = td.scale;

    // Sky
    Engine.scene.background = new THREE.Color(th.sky);
    Engine.scene.fog = new THREE.FogExp2(th.fog, 0.0006);

    // Starfield
    this._buildStarfield(th.starColor, th.starOpacity);

    // Grid
    this._buildGrid(th.grid);

    // Track curve
    const pts = td.waypoints.map(w => {
      const p = latLngTo3D(w.lat, w.lng, sc);
      return new THREE.Vector3(p.x, p.y, p.z);
    });
    this.trackCurve = new THREE.CatmullRomCurve3(pts, true);

    // Clear old meshes
    this.trackMeshes.forEach(m => Engine.scene.remove(m));
    this.trackMeshes = [];

    // Track surface
    this._buildTrackSurface(th);
    this._buildEdgeLines(th);
    this._buildCenterDash(th);
    this._buildWaypoints(td, sc, th);
    this._buildStartArch(td);
    this._buildBuildings(th, sc);

    UI.setTrackName(td.name);
  },

  _buildStarfield(color, opacity) {
    if (this.starField) Engine.scene.remove(this.starField);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(3000 * 3);
    for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - 0.5) * 4000;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.starField = new THREE.Points(geo, new THREE.PointsMaterial({
      color, size: 1.5, transparent: true, opacity
    }));
    Engine.scene.add(this.starField);
  },

  _buildGrid(color) {
    if (this.gridHelper) Engine.scene.remove(this.gridHelper);
    this.gridHelper = new THREE.GridHelper(4000, 80, color, 0x110022);
    this.gridHelper.position.y = -200;
    this.gridHelper.material.transparent = true;
    this.gridHelper.material.opacity = 0.25;
    Engine.scene.add(this.gridHelper);
  },

  _buildTrackSurface(th) {
    const tubeGeo = new THREE.TubeGeometry(this.trackCurve, 200, this.trackWidth, 12, true);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x080810, emissive: th.trackEmissive, emissiveIntensity: 0.4,
      roughness: 0.8, metalness: 0.2, side: THREE.DoubleSide
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    Engine.scene.add(tube);
    this.trackMeshes.push(tube);
  },

  _buildEdgeLines(th) {
    for (let side = -1; side <= 1; side += 2) {
      const sidePts = [];
      for (let i = 0; i <= 240; i++) {
        const t = i / 240;
        const f = this.trackCurve.getPointAt(t);
        const tan = this.trackCurve.getTangentAt(t);
        const nrm = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
        sidePts.push(f.clone().add(nrm.multiplyScalar(this.trackWidth * side)));
      }
      const color = side > 0 ? th.edge1 : th.edge2;
      const lineGeo = new THREE.BufferGeometry().setFromPoints(sidePts);
      const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 });
      const line = new THREE.Line(lineGeo, lineMat);
      Engine.scene.add(line);
      this.trackMeshes.push(line);

      const curve = new THREE.CatmullRomCurve3(sidePts, true);
      const glowGeo = new THREE.TubeGeometry(curve, 80, 0.6, 4, true);
      const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.06 });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      Engine.scene.add(glow);
      this.trackMeshes.push(glow);
    }
  },

  _buildCenterDash(th) {
    const cPts = [];
    for (let i = 0; i <= 200; i++) cPts.push(this.trackCurve.getPointAt(i / 200));
    const cGeo = new THREE.BufferGeometry().setFromPoints(cPts);
    const cMat = new THREE.LineDashedMaterial({
      color: th.center, transparent: true, opacity: 0.35, dashSize: 5, gapSize: 4
    });
    const cLine = new THREE.Line(cGeo, cMat);
    cLine.computeLineDistances();
    Engine.scene.add(cLine);
    this.trackMeshes.push(cLine);
  },

  _buildWaypoints(td, sc, th) {
    const startMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.85 });
    const wpMat = new THREE.MeshBasicMaterial({ color: th.edge1, transparent: true, opacity: 0.6 });
    const sphereMat = new THREE.MeshBasicMaterial({ color: th.edge2, transparent: true, opacity: 0.9 });
    const startSphereMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.95 });

    td.waypoints.forEach((w, i) => {
      const p = latLngTo3D(w.lat, w.lng, sc);
      const isStart = i === 0;

      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.6, 22, 8),
        isStart ? startMat : wpMat
      );
      pillar.position.set(p.x, p.y + 11, p.z);
      Engine.scene.add(pillar);
      this.trackMeshes.push(pillar);

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.8, 12, 12),
        isStart ? startSphereMat : sphereMat
      );
      sphere.position.set(p.x, p.y + 22, p.z);
      sphere.userData = { phase: i * 1.2 };
      Engine.scene.add(sphere);
      this.trackMeshes.push(sphere);

      if (isStart) {
        const pl = new THREE.PointLight(0x00ff00, 6, 35);
        pl.position.set(p.x, p.y + 22, p.z);
        Engine.scene.add(pl);
        this.trackMeshes.push(pl);
      }
    });
  },

  _buildStartArch(td) {
    const sp = this.trackCurve.getPointAt(0);
    const st = this.trackCurve.getTangentAt(0);
    const archGeo = new THREE.TorusGeometry(this.trackWidth + 0.5, 0.4, 8, 20, Math.PI);
    const archMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.6 });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.copy(sp);
    arch.position.y += 6;
    arch.lookAt(sp.clone().add(st));
    arch.rotateX(Math.PI / 2);
    Engine.scene.add(arch);
    this.trackMeshes.push(arch);
  },

  _buildBuildings(th, sc) {
    const q = QUALITY[Engine.quality];
    const bh = q.buildingCount;
    const ib = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({
        vertexColors: true, emissiveIntensity: 0.3, transparent: true, opacity: 0.7
      }),
      bh
    );
    const db = new THREE.Color();
    for (let i = 0; i < bh; i++) {
      const ti = Math.random();
      const p = this.trackCurve.getPointAt(ti);
      const tan = this.trackCurve.getTangentAt(ti);
      const nrm = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const side = Math.random() > 0.5 ? 1 : -1;
      const dist = 70 + Math.random() * 180;
      const h = 25 + Math.random() * 120;
      const w = 6 + Math.random() * 18;
      const d = 6 + Math.random() * 18;
      db.setHSL(
        th.buildingHue[0] + Math.random() * (th.buildingHue[1] - th.buildingHue[0]),
        0.7, 0.04
      );
      const obj = new THREE.Object3D();
      obj.position.copy(p).add(nrm.multiplyScalar(dist * side));
      obj.scale.set(w, h, d);
      obj.updateMatrix();
      ib.setMatrixAt(i, obj.matrix);
      ib.setColorAt(i, db);
    }
    ib.instanceMatrix.needsUpdate = true;
    Engine.scene.add(ib);
    this.trackMeshes.push(ib);
  },

  getCurve() { return this.trackCurve; },
  getWidth() { return this.trackWidth; }
};
