// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// WORLD: 3D CAR IN 2D WORLD
// Renders a Three.js car on a layered canvas OVER the 2D world.
// The car uses 2D physics (game.pCar.x/y/vx) but the camera + car
// itself are 3D, so the world stays a side-scroller but the car
// has proper depth, lighting, wheels, etc.
// ═══════════════════════════════════════════════════════════════

var Car3D = {
    active: false,
    canvas: null,
    ctx: null,
    scene: null,
    camera: null,
    renderer: null,
    carGroup: null,
    wheels: [],
    tailLights: [],
    headlights: [],

    // Lighting
    ambient: null,
    sun: null,

    // Ground mesh (renders the road under the car in 3D)
    ground: null,
    buildings: [],

    // Input
    throttle: 0,
    brake: 0,
    steer: 0,

    // Camera
    camDist: 12,
    camHeight: 5,
    camAngle: 0,

    init() {
        if (typeof THREE === 'undefined' || !THREE.Scene) return false;
        this.injectCanvas();
        return true;
    },

    injectCanvas() {
        if (this.canvas) return;
        var c = document.createElement('canvas');
        c.id = 'car-3d-canvas';
        c.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;display:none;z-index:5;';
        var container = document.getElementById('game-container') || document.body;
        container.appendChild(c);
        this.canvas = c;
        this.ctx = c.getContext('webgl', { antialias: true, alpha: true }) ||
                   c.getContext('experimental-webgl', { antialias: true, alpha: true });
    },

    buildScene() {
        if (!this.ctx) return false;
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, context: this.ctx, antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x000000, 0);  // transparent

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.012);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, this.canvas.width / this.canvas.height, 0.1, 200);

        // Lighting
        this.ambient = new THREE.AmbientLight(0x606080, 0.6);
        this.scene.add(this.ambient);
        this.sun = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sun.position.set(10, 20, 10);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.width = 1024;
        this.sun.shadow.mapSize.height = 1024;
        this.sun.shadow.camera.near = 0.5;
        this.sun.shadow.camera.far = 80;
        this.sun.shadow.camera.left = -30;
        this.sun.shadow.camera.right = 30;
        this.sun.shadow.camera.top = 30;
        this.sun.shadow.camera.bottom = -30;
        this.scene.add(this.sun);

        // Hemisphere for sky/ground tint
        var hemi = new THREE.HemisphereLight(0x6688ff, 0x442211, 0.4);
        this.scene.add(hemi);

        // Ground (large plane)
        var groundGeo = new THREE.PlaneGeometry(400, 400);
        var groundMat = new THREE.MeshStandardMaterial({
            color: 0x2a3a1a, metalness: 0.1, roughness: 0.9
        });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -0.6;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        // Grid (subtle reference)
        var grid = new THREE.GridHelper(200, 40, 0x003333, 0x001a1a);
        grid.position.y = -0.58;
        this.scene.add(grid);

        // Side buildings (low-poly backdrop)
        for (var s = 0; s < 2; s++) {
            var side = s === 0 ? -1 : 1;
            for (var i = 0; i < 10; i++) {
                var bw = 4 + Math.random() * 6;
                var bh = 6 + Math.random() * 14;
                var bd = 4 + Math.random() * 6;
                var bGeo = new THREE.BoxGeometry(bw, bh, bd);
                var bMat = new THREE.MeshStandardMaterial({
                    color: 0x222233, metalness: 0.3, roughness: 0.7,
                    emissive: 0x00ffff, emissiveIntensity: 0.05
                });
                var b = new THREE.Mesh(bGeo, bMat);
                b.position.set(
                    (Math.random() - 0.5) * 80,
                    bh / 2 - 0.6,
                    side * (20 + Math.random() * 30) + (Math.random() - 0.5) * 20
                );
                b.castShadow = true;
                b.receiveShadow = true;
                this.scene.add(b);
                this.buildings.push(b);
            }
        }

        // Car group (mirrors the existing RacingMode detailed car)
        this.buildCar();

        return true;
    },

    buildCar() {
        var three = THREE;
        this.carGroup = new three.Group();
        var bodyColor = 0x1a1a2e;
        var accent = 0x00ffff;

        // Body
        var bodyShape = new three.Shape();
        bodyShape.moveTo(-1.25, 0);
        bodyShape.lineTo(-1.05, 0.35);
        bodyShape.lineTo(-0.4, 0.55);
        bodyShape.lineTo(0.5, 0.55);
        bodyShape.lineTo(1.05, 0.35);
        bodyShape.lineTo(1.25, 0);
        bodyShape.lineTo(1.1, -0.35);
        bodyShape.lineTo(-1.1, -0.35);
        bodyShape.closePath();
        var bodyGeo = new three.ExtrudeGeometry(bodyShape, {
            depth: 4.6, bevelEnabled: true, bevelThickness: 0.06,
            bevelSize: 0.06, bevelSegments: 4
        });
        bodyGeo.center();
        var bodyMat = new three.MeshStandardMaterial({
            color: bodyColor, emissive: accent, emissiveIntensity: 0.2,
            metalness: 0.85, roughness: 0.25
        });
        var body = new three.Mesh(bodyGeo, bodyMat);
        body.rotation.y = Math.PI / 2;
        body.castShadow = true;
        this.carGroup.add(body);

        // Cabin
        var cabinShape = new three.Shape();
        cabinShape.moveTo(-0.55, 0);
        cabinShape.lineTo(-0.4, 0.55);
        cabinShape.quadraticCurveTo(0, 0.72, 0.4, 0.55);
        cabinShape.lineTo(0.55, 0);
        cabinShape.lineTo(0.4, -0.1);
        cabinShape.lineTo(-0.4, -0.1);
        cabinShape.closePath();
        var cabinGeo = new three.ExtrudeGeometry(cabinShape, {
            depth: 2.0, bevelEnabled: true, bevelThickness: 0.04,
            bevelSize: 0.04, bevelSegments: 3
        });
        cabinGeo.center();
        var cabinMat = new three.MeshStandardMaterial({
            color: 0x05050f, metalness: 0.6, roughness: 0.15,
            transparent: true, opacity: 0.75
        });
        var cabin = new three.Mesh(cabinGeo, cabinMat);
        cabin.rotation.y = Math.PI / 2;
        cabin.position.set(0, 0.55, -0.4);
        cabin.castShadow = true;
        this.carGroup.add(cabin);

        // 4 wheels
        this.wheels = [];
        var wheelPositions = [
            { x: -1.1, z: -1.3 },
            { x:  1.1, z: -1.3 },
            { x: -1.1, z:  1.3 },
            { x:  1.1, z:  1.3 }
        ];
        for (var i = 0; i < 4; i++) {
            var wp = wheelPositions[i];
            var wheelGroup = new three.Group();
            var tireGeo = new three.CylinderGeometry(0.42, 0.42, 0.32, 24);
            var tireMat = new three.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.2, roughness: 0.85 });
            var tire = new three.Mesh(tireGeo, tireMat);
            tire.rotation.z = Math.PI / 2;
            tire.castShadow = true;
            wheelGroup.add(tire);
            var rimGeo = new three.CylinderGeometry(0.28, 0.28, 0.34, 12);
            var rimMat = new three.MeshStandardMaterial({
                color: 0x444466, metalness: 0.9, roughness: 0.3,
                emissive: accent, emissiveIntensity: 0.2
            });
            var rim = new three.Mesh(rimGeo, rimMat);
            rim.rotation.z = Math.PI / 2;
            wheelGroup.add(rim);
            for (var s2 = 0; s2 < 5; s2++) {
                var spokeGeo = new three.BoxGeometry(0.06, 0.52, 0.08);
                var spoke = new three.Mesh(spokeGeo, rimMat);
                spoke.rotation.x = (s2 / 5) * Math.PI;
                wheelGroup.add(spoke);
            }
            wheelGroup.position.set(wp.x, -0.35, wp.z);
            this.carGroup.add(wheelGroup);
            this.wheels.push(wheelGroup);
        }

        // Headlights
        this.headlights = [];
        for (var h = 0; h < 2; h++) {
            var hs = h === 0 ? -0.75 : 0.75;
            var hlGeo = new three.BoxGeometry(0.32, 0.12, 0.05);
            var hlMat = new three.MeshStandardMaterial({
                color: 0xfff8d0, emissive: 0xfff8d0, emissiveIntensity: 1.5,
                metalness: 0.4, roughness: 0.1
            });
            var hl = new three.Mesh(hlGeo, hlMat);
            hl.position.set(hs, 0.25, -2.3);
            this.carGroup.add(hl);
            this.headlights.push(hl);
            var hlLight = new three.SpotLight(0xfff8d0, 1.5, 40, Math.PI / 6, 0.5, 1.2);
            hlLight.position.set(hs, 0.25, -2.4);
            hlLight.target.position.set(hs * 1.2, -1, -12);
            this.carGroup.add(hlLight);
            this.carGroup.add(hlLight.target);
        }

        // Tail lights
        this.tailLights = [];
        for (var t = 0; t < 2; t++) {
            var ts = t === 0 ? -0.85 : 0.85;
            var tlGeo = new three.BoxGeometry(0.45, 0.1, 0.04);
            var tlMat = new three.MeshStandardMaterial({
                color: 0xff0033, emissive: 0xff0033, emissiveIntensity: 0.8,
                metalness: 0.3, roughness: 0.2
            });
            var tl = new three.Mesh(tlGeo, tlMat);
            tl.position.set(ts, 0.3, 2.32);
            this.carGroup.add(tl);
            this.tailLights.push(tl);
        }

        // Underglow
        var ugGeo = new three.PlaneGeometry(3.2, 5.2);
        var ugMat = new three.MeshBasicMaterial({
            color: accent, transparent: true, opacity: 0.25, side: three.DoubleSide
        });
        var ug = new three.Mesh(ugGeo, ugMat);
        ug.rotation.x = -Math.PI / 2;
        ug.position.y = -0.55;
        this.carGroup.add(ug);

        this.carGroup.castShadow = true;
        this.scene.add(this.carGroup);
    },

    enter() {
        if (this.active) return;
        if (!this.init()) return;
        if (!this.scene) this.buildScene();
        if (!this.canvas) return;
        var w = this.canvas.clientWidth || window.innerWidth;
        var h = this.canvas.clientHeight || window.innerHeight;
        this.canvas.width = w * (window.devicePixelRatio || 1);
        this.canvas.height = h * (window.devicePixelRatio || 1);
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.canvas.style.display = 'block';
        this.active = true;
    },

    exit() {
        this.active = false;
        if (this.canvas) this.canvas.style.display = 'none';
    },

    update(dt) {
        if (!this.active || !this.carGroup || !game || !game.pCar) return;

        // Map 2D world → 3D
        // World is WW tiles wide. We center the camera on the car in 2D X.
        // In 3D, car is at (0, 0, 0); camera is at (-camDist, camHeight, 0) etc.
        // 2D vx becomes carGroup.position.z (forward) and steer yaws the car.
        var car = game.pCar;
        // Forward in 3D = +Z. Map vx to -Z so positive vx (right) goes "into" the screen
        this.carGroup.position.set(0, -0.6 + Math.sin(Date.now() * 0.005) * 0.05, 0);

        // Wheel spin from |vx|
        var wheelSpin = (Math.abs(car.vx) / 0.33) * dt;
        for (var i = 0; i < this.wheels.length; i++) {
            this.wheels[i].rotation.x -= wheelSpin;
        }

        // Tail lights brighten on brake
        var brake = this.brake > 0.1;
        for (var t = 0; t < this.tailLights.length; t++) {
            this.tailLights[t].material.emissiveIntensity = 0.8 + (brake ? 1.8 : 0);
        }

        // Slight body roll on steer
        this.carGroup.rotation.z = -this.steer * 0.12;
        this.carGroup.rotation.y = this.steer * 0.05;

        // Camera follows the car in 2D, but in 3D we use a chase cam around the car
        var cx = -Math.sin(this.steer * 0.3) * this.camDist;
        var cz = -Math.cos(this.steer * 0.3) * this.camDist;
        this.camera.position.lerp(new THREE.Vector3(cx, this.camHeight, cz), 0.08);
        this.camera.lookAt(0, 0, 0);

        // Move buildings with the car so the world scrolls (parallax)
        for (var b = 0; b < this.buildings.length; b++) {
            this.buildings[b].position.x -= car.vx * dt * 0.5;
            if (this.buildings[b].position.x < -80) this.buildings[b].position.x += 160;
            if (this.buildings[b].position.x >  80) this.buildings[b].position.x -= 160;
        }
    },

    render() {
        if (!this.active || !this.renderer) return;
        this.renderer.render(this.scene, this.camera);
    },

    // Input hooks (called by physics.js for car driving in 2D world)
    setInput(throttle, brake, steer) {
        this.throttle = throttle;
        this.brake = brake;
        this.steer = steer;
    }
};
