// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// RACING MODE — Core Integration
// Manages 3D racing state, transitions, and Three.js lifecycle
// ═══════════════════════════════════════════════════════════════

var RacingMode = {
    // State
    active: false,
    initialized: false,

    // Three.js objects
    scene: null,
    camera: null,
    renderer: null,
    composer: null,

    // Racing objects
    carGroup: null,
    carPhysics: null,
    roadMesh: null,

    // Racing state
    speed: 0,        // km/h
    rpm: 800,
    gear: 0,         // -1=R, 0=N, 1-6
    throttle: 0,
    brake: 0,
    steerInput: 0,
    steerAngle: 0,
    nitro: NITRO_MAX,
    nitroActive: false,
    camView: 0,      // index into CAM_VIEWS
    totalAngle: 0,
    angularVel: 0,

    // Transition
    transitionProgress: 0,
    transitionState: 'none', // 'none', 'entering', 'exiting'
    exitX: 0,        // world X where player exited car

    // ─── THREE.JS RESOLUTION (vendored, no CDN) ───

    loadThreeJS() {
        if (typeof THREE !== 'undefined' && THREE && THREE.Scene) {
            return Promise.resolve(THREE);
        }
        return new Promise((resolve) => {
            var wait = 0;
            var tick = setInterval(() => {
                wait += 50;
                if (typeof THREE !== 'undefined' && THREE && THREE.Scene) {
                    clearInterval(tick);
                    resolve(THREE);
                } else if (wait > 5000) {
                    clearInterval(tick);
                    console.error('[ RacingMode ] Three.js vendor script missing (js/vendor/three.min.js)');
                    resolve(null);
                }
            }, 50);
        });
    },

    // ─── INITIALIZATION ───

    // ─── COUNTDOWN STATE ───
    countdownActive: false,
    countdownValue: 3,
    countdownTimer: 0,
    countdownCarEntity: null,

    async init(carEntity) {
        if (this.initialized) return;

        var three = await this.loadThreeJS();
        if (!three) {
            console.error('[ RacingMode ] Cannot init without Three.js');
            return;
        }

        // Create racing canvas overlay
        this.createRacingCanvas();

        // Setup Three.js scene
        this.setupScene(three);

        // Create car model
        this.createCar(three);

        // Generate road from tilemap
        this.generateRoadFromTilemap(three, carEntity);

        // Initialize racing subsystems
        if (typeof RacingHUD !== 'undefined') {
            RacingHUD.init();
            RacingHUD.show();
        }
        if (typeof RacingAudio !== 'undefined') {
            RacingAudio.init();
            RacingAudio.resume();
        }
        if (typeof RacingParticles !== 'undefined') {
            RacingParticles.init(this.scene);
        }
        if (typeof RacingOpponents !== 'undefined') {
            RacingOpponents.init(this.scene);
        }

        // Position car on road
        if (this.roadData && this.roadData.spline) {
            var startPos = this.roadData.spline.getPointAt(0);
            this.carGroup.position.copy(startPos);
            this.carGroup.position.y += 0.5;
        }

        this.initialized = true;
        console.log('%c[ RacingMode ] Initialized', 'color:#0f0');
    },

    createRacingCanvas() {
        // Create a second canvas for 3D rendering, overlaying the 2D canvas
        var container = document.getElementById('game-container');
        if (!container) {
            console.error('[ RacingMode ] #game-container not found');
            return;
        }

        // Check if racing canvas already exists
        var existing = document.getElementById('racing-canvas');
        if (existing) {
            this.canvas = existing;
            return;
        }

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'racing-canvas';
        this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:none;z-index:2;';
        container.appendChild(this.canvas);
    },

    setupScene(three) {
        var w = window.innerWidth;
        var h = window.innerHeight;

        // Scene
        this.scene = new three.Scene();
        this.scene.background = new three.Color(0x0a0a1a);
        this.scene.fog = new three.FogExp2(0x0a0a1a, 0.008);

        // Camera
        this.camera = new three.PerspectiveCamera(60, w / h, 0.1, 2000);
        this.camera.position.set(0, 8, -15);

        // Renderer
        this.renderer = new three.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = three.PCFSoftShadowMap;

        // Lighting
        var ambient = new three.AmbientLight(0x606080, 1.0);
        this.scene.add(ambient);

        var hemi = new three.HemisphereLight(0x4444aa, 0x222244, 0.6);
        this.scene.add(hemi);

        var dirLight = new three.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 500;
        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        this.scene.add(dirLight);

        // Neon accent lights
        var pointLight1 = new three.PointLight(0x00ffff, 2, 50);
        pointLight1.position.set(-10, 5, 0);
        this.scene.add(pointLight1);

        var pointLight2 = new three.PointLight(0xff00ff, 2, 50);
        pointLight2.position.set(10, 5, 0);
        this.scene.add(pointLight2);

        // Handle resize
        var self = this;
        window.addEventListener('resize', function() {
            if (!self.renderer) return;
            var nw = window.innerWidth;
            var nh = window.innerHeight;
            self.camera.aspect = nw / nh;
            self.camera.updateProjectionMatrix();
            self.renderer.setSize(nw, nh);
        });
    },

    // ─── CAR MODEL (PHASE 2: detailed 3D) ───
    //
    // PBR (MeshStandardMaterial) body + cabin
    // 4 wheels (CylinderGeometry) with hubcaps, rotating with speed
    // 2 headlights (emissive boxes + SpotLights with cones)
    // 2 tail lights (emissive, brighten on brake)
    // 2 exhaust pipes (CylinderGeometry, open ends)
    // 2 side mirrors (small angular shapes)
    // Rear wing with end plates
    // Underglow plane + thruster point light

    createCar(three) {
        this.carGroup = new three.Group();
        var bodyColor = 0x1a1a2e;
        var cabinColor = 0x05050f;
        var accent = 0x00ffff;
        var tireColor = 0x0a0a0a;
        var rimColor = 0x444466;
        var headlightColor = 0xfff8d0;
        var taillightColor = 0xff0033;

        // ── PBR body (chassis) ──
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
        var extrudeSettings = {
            depth: 4.6, bevelEnabled: true, bevelThickness: 0.06,
            bevelSize: 0.06, bevelSegments: 4
        };
        var bodyGeo = new three.ExtrudeGeometry(bodyShape, extrudeSettings);
        bodyGeo.center();
        var bodyMat = new three.MeshStandardMaterial({
            color: bodyColor, emissive: accent, emissiveIntensity: 0.15,
            metalness: 0.85, roughness: 0.25
        });
        var body = new three.Mesh(bodyGeo, bodyMat);
        body.rotation.y = Math.PI / 2;
        body.position.z = -0.4;
        body.castShadow = true;
        this.carGroup.add(body);

        // ── Cabin (greenhouse) ──
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
            color: cabinColor, emissive: accent, emissiveIntensity: 0.08,
            metalness: 0.6, roughness: 0.15, transparent: true, opacity: 0.75
        });
        var cabin = new three.Mesh(cabinGeo, cabinMat);
        cabin.rotation.y = Math.PI / 2;
        cabin.position.set(0, 0.55, -0.4);
        cabin.castShadow = true;
        this.carGroup.add(cabin);

        // ── 4 wheels ──
        this.wheels = [];
        var wheelPositions = [
            { x: -1.1, z: -1.3 },   // front-left
            { x:  1.1, z: -1.3 },   // front-right
            { x: -1.1, z:  1.3 },   // rear-left
            { x:  1.1, z:  1.3 }    // rear-right
        ];
        for (var i = 0; i < wheelPositions.length; i++) {
            var wp = wheelPositions[i];
            var wheelGroup = new three.Group();
            // Tire
            var tireGeo = new three.CylinderGeometry(0.42, 0.42, 0.32, 24);
            var tireMat = new three.MeshStandardMaterial({
                color: tireColor, metalness: 0.2, roughness: 0.85
            });
            var tire = new three.Mesh(tireGeo, tireMat);
            tire.rotation.z = Math.PI / 2;
            tire.castShadow = true;
            wheelGroup.add(tire);
            // Rim
            var rimGeo = new three.CylinderGeometry(0.28, 0.28, 0.34, 12);
            var rimMat = new three.MeshStandardMaterial({
                color: rimColor, metalness: 0.9, roughness: 0.3,
                emissive: accent, emissiveIntensity: 0.15
            });
            var rim = new three.Mesh(rimGeo, rimMat);
            rim.rotation.z = Math.PI / 2;
            wheelGroup.add(rim);
            // Spokes (5 thin boxes)
            for (var s = 0; s < 5; s++) {
                var spokeGeo = new three.BoxGeometry(0.06, 0.52, 0.08);
                var spoke = new three.Mesh(spokeGeo, rimMat);
                spoke.rotation.x = (s / 5) * Math.PI;
                wheelGroup.add(spoke);
            }
            wheelGroup.position.set(wp.x, -0.35, wp.z);
            this.carGroup.add(wheelGroup);
            this.wheels.push(wheelGroup);
        }

        // ── 2 headlights (emissive boxes + SpotLights) ──
        this.headlights = [];
        this.headlightLights = [];
        for (var h = 0; h < 2; h++) {
            var side = h === 0 ? -0.75 : 0.75;
            var hlGeo = new three.BoxGeometry(0.32, 0.12, 0.05);
            var hlMat = new three.MeshStandardMaterial({
                color: headlightColor, emissive: headlightColor,
                emissiveIntensity: 1.5, metalness: 0.4, roughness: 0.1
            });
            var hl = new three.Mesh(hlGeo, hlMat);
            hl.position.set(side, 0.25, -2.3);
            this.carGroup.add(hl);
            this.headlights.push(hl);
            // SpotLight cone
            var hlLight = new three.SpotLight(headlightColor, 1.5, 40, Math.PI / 6, 0.5, 1.2);
            hlLight.position.set(side, 0.25, -2.4);
            hlLight.target.position.set(side * 1.2, -1, -12);
            this.carGroup.add(hlLight);
            this.carGroup.add(hlLight.target);
            this.headlightLights.push(hlLight);
        }

        // ── 2 tail lights (red emissive, brighten on brake) ──
        this.tailLights = [];
        for (var t = 0; t < 2; t++) {
            var tside = t === 0 ? -0.85 : 0.85;
            var tlGeo = new three.BoxGeometry(0.45, 0.1, 0.04);
            var tlMat = new three.MeshStandardMaterial({
                color: taillightColor, emissive: taillightColor,
                emissiveIntensity: 0.8, metalness: 0.3, roughness: 0.2
            });
            var tl = new three.Mesh(tlGeo, tlMat);
            tl.position.set(tside, 0.3, 2.32);
            this.carGroup.add(tl);
            this.tailLights.push(tl);
        }

        // ── 2 exhaust pipes ──
        for (var e = 0; e < 2; e++) {
            var ex = e === 0 ? -0.55 : 0.55;
            var exGeo = new three.CylinderGeometry(0.08, 0.1, 0.4, 12, 1, true);
            var exMat = new three.MeshStandardMaterial({
                color: 0x222222, metalness: 0.95, roughness: 0.4, side: three.DoubleSide
            });
            var exPipe = new three.Mesh(exGeo, exMat);
            exPipe.rotation.x = Math.PI / 2;
            exPipe.position.set(ex, -0.2, 2.35);
            this.carGroup.add(exPipe);
        }

        // ── 2 side mirrors ──
        for (var m = 0; m < 2; m++) {
            var mside = m === 0 ? -1.35 : 1.35;
            var mirrorGroup = new three.Group();
            // Stem
            var stemGeo = new three.BoxGeometry(0.04, 0.04, 0.18);
            var stemMat = new three.MeshStandardMaterial({ color: bodyColor, metalness: 0.7, roughness: 0.3 });
            var stem = new three.Mesh(stemGeo, stemMat);
            stem.position.z = 0.05;
            mirrorGroup.add(stem);
            // Mirror
            var mirrorGeo = new three.BoxGeometry(0.12, 0.08, 0.16);
            var mirrorMat = new three.MeshStandardMaterial({
                color: 0x88ccff, metalness: 0.95, roughness: 0.05,
                emissive: 0x224466, emissiveIntensity: 0.2
            });
            var mirrorMesh = new three.Mesh(mirrorGeo, mirrorMat);
            mirrorMesh.position.z = 0.18;
            mirrorGroup.add(mirrorMesh);
            mirrorGroup.position.set(mside, 0.5, -0.8);
            this.carGroup.add(mirrorGroup);
        }

        // ── Rear wing with end plates ──
        var wingBarGeo = new three.BoxGeometry(2.8, 0.06, 0.35);
        var wingMat = new three.MeshStandardMaterial({
            color: bodyColor, metalness: 0.7, roughness: 0.3,
            emissive: accent, emissiveIntensity: 0.25
        });
        var wingBar = new three.Mesh(wingBarGeo, wingMat);
        wingBar.position.set(0, 0.85, 2.3);
        wingBar.castShadow = true;
        this.carGroup.add(wingBar);
        for (var p = 0; p < 2; p++) {
            var pside = p === 0 ? -1.35 : 1.35;
            var plateGeo = new three.BoxGeometry(0.06, 0.3, 0.4);
            var plate = new three.Mesh(plateGeo, wingMat);
            plate.position.set(pside, 0.85, 2.3);
            this.carGroup.add(plate);
        }

        // ── Side skirts (neon) ──
        for (var sk = 0; sk < 2; sk++) {
            var skside = sk === 0 ? -1.15 : 1.15;
            var skirtGeo = new three.BoxGeometry(0.12, 0.08, 3.0);
            var skirtMat = new three.MeshStandardMaterial({
                color: accent, emissive: accent, emissiveIntensity: 0.9,
                metalness: 0.4, roughness: 0.3
            });
            var skirt = new three.Mesh(skirtGeo, skirtMat);
            skirt.position.set(skside, -0.28, 0.4);
            this.carGroup.add(skirt);
        }

        // ── Underglow plane ──
        var underglowGeo = new three.PlaneGeometry(3.2, 5.2);
        var underglowMat = new three.MeshBasicMaterial({
            color: accent, transparent: true, opacity: 0.18, side: three.DoubleSide
        });
        var underglow = new three.Mesh(underglowGeo, underglowMat);
        underglow.rotation.x = -Math.PI / 2;
        underglow.position.y = -0.55;
        this.carGroup.add(underglow);

        // ── Thruster point light (under car) ──
        var thrusterLight = new three.PointLight(accent, 4, 20);
        thrusterLight.position.set(0, -0.4, 2.2);
        this.carGroup.add(thrusterLight);

        this.carGroup.castShadow = true;
        this.scene.add(this.carGroup);
    },

    // ─── TILEMAP-BASED ROAD GENERATION ───

    generateRoadFromTilemap(three, carEntity) {
        // Get the tilemap from the game
        var tilemap = game.lvl;
        if (!tilemap) {
            console.warn('[ RacingMode ] No tilemap, falling back to straight road');
            this.generateStraightRoad(three);
            return;
        }

        // Find the tile X where the car is
        var startTileX = carEntity ? Math.floor(carEntity.x / TILE) : 10;
        startTileX = Math.max(0, Math.min(WW - 300, startTileX));

        // Use RoadGenerator to create the road
        if (typeof RoadGenerator !== 'undefined') {
            this.roadData = RoadGenerator.generate(this.scene, tilemap, startTileX);
            this.roadGenerator = RoadGenerator;
            console.log('%c[ RacingMode ] Road generated from tilemap, length=' + Math.floor(this.roadData.length), 'color:#0ff');
        } else {
            console.warn('[ RacingMode ] RoadGenerator not available, falling back to straight road');
            this.generateStraightRoad(three);
        }
    },

    // ─── FALLBACK: Straight road (no tilemap) ───

    generateStraightRoad(three) {

        // ── Road surface (asphalt) ──
        var roadSurfaceGeo = new three.PlaneGeometry(roadWidth, roadLength * segmentLength);
        var roadSurfaceMat = new three.MeshStandardMaterial({
            color: 0x1a1a22, metalness: 0.3, roughness: 0.85
        });
        var roadSurface = new three.Mesh(roadSurfaceGeo, roadSurfaceMat);
        roadSurface.rotation.x = -Math.PI / 2;
        roadSurface.position.set(0, 0, roadLength * segmentLength / 2 - 50);
        roadSurface.receiveShadow = true;
        this.scene.add(roadSurface);

        // ── Center dashed lane markers ──
        for (var i = 0; i < roadLength; i += 3) {
            var lineGeo = new three.PlaneGeometry(0.3, 4);
            var lineMat = new three.MeshBasicMaterial({ color: 0xffffff, side: three.DoubleSide });
            var line = new three.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.02, i * segmentLength - 50);
            this.scene.add(line);
        }

        // ── Edge lines (continuous) ──
        for (var side of [-1, 1]) {
            var edgeGeo = new three.PlaneGeometry(0.2, roadLength * segmentLength);
            var edgeMat = new three.MeshBasicMaterial({
                color: side === -1 ? 0xff0044 : 0x00ff88,
                side: three.DoubleSide
            });
            var edge = new three.Mesh(edgeGeo, edgeMat);
            edge.rotation.x = -Math.PI / 2;
            edge.position.set(side * (roadWidth / 2 - 0.5), 0.02, roadLength * segmentLength / 2 - 50);
            this.scene.add(edge);
        }

        // ── Side barriers (neon-lit walls) ──
        for (var side of [-1, 1]) {
            // Barrier wall
            var barGeo = new three.BoxGeometry(0.4, 0.8, roadLength * segmentLength);
            var barMat = new three.MeshStandardMaterial({
                color: 0x111118, metalness: 0.7, roughness: 0.4
            });
            var bar = new three.Mesh(barGeo, barMat);
            bar.position.set(side * (roadWidth / 2 + 0.2), 0.4, roadLength * segmentLength / 2 - 50);
            bar.castShadow = true;
            bar.receiveShadow = true;
            this.scene.add(bar);
            // Neon top strip
            var stripGeo = new three.BoxGeometry(0.12, 0.08, roadLength * segmentLength);
            var stripMat = new three.MeshBasicMaterial({
                color: side === -1 ? 0xff0066 : 0x00ffff
            });
            var strip = new three.Mesh(stripGeo, stripMat);
            strip.position.set(side * (roadWidth / 2 + 0.2), 0.85, roadLength * segmentLength / 2 - 50);
            this.scene.add(strip);
            // Barrier posts every 6m
            for (var p = 0; p < roadLength * segmentLength; p += 6) {
                var postGeo = new three.CylinderGeometry(0.08, 0.08, 0.9, 8);
                var postMat = new three.MeshStandardMaterial({
                    color: 0x222233, metalness: 0.9, roughness: 0.3
                });
                var post = new three.Mesh(postGeo, postMat);
                post.position.set(side * (roadWidth / 2 + 0.2), 0.45, p - 50);
                this.scene.add(post);
            }
        }

        // ── Shoulder terrain ──
        for (var side of [-1, 1]) {
            var shoulderGeo = new three.PlaneGeometry(8, roadLength * segmentLength);
            var shoulderMat = new three.MeshStandardMaterial({
                color: 0x0a0a12, metalness: 0.1, roughness: 0.95
            });
            var shoulder = new three.Mesh(shoulderGeo, shoulderMat);
            shoulder.rotation.x = -Math.PI / 2;
            shoulder.position.set(side * (roadWidth / 2 + 4.2), -0.05, roadLength * segmentLength / 2 - 50);
            shoulder.receiveShadow = true;
            this.scene.add(shoulder);
        }

        // ── Grid floor (infinite ground feel) ──
        var gridHelper = new three.GridHelper(2000, 200, 0x00ffff, 0x003333);
        gridHelper.position.y = -0.15;
        this.scene.add(gridHelper);

        // ── Neon buildings on sides ──
        this.createBuildings(three, roadLength, roadWidth);
    },

    createBuildings(three, roadLength, roadWidth) {
        var buildingColors = [0x00ffff, 0xff00ff, 0xff8800, 0x00ff88, 0x4444ff];

        for (var i = 0; i < roadLength; i += 8) {
            for (var side of [-1, 1]) {
                if (Math.random() > 0.4) continue;

                var bw = 3 + Math.random() * 8;
                var bh = 5 + Math.random() * 30;
                var bd = 3 + Math.random() * 8;

                var bGeo = new three.BoxGeometry(bw, bh, bd);
                var bMat = new three.MeshPhongMaterial({
                    color: 0x0a0a15,
                    emissive: buildingColors[Math.floor(Math.random() * buildingColors.length)],
                    emissiveIntensity: 0.05,
                    shininess: 80
                });
                var building = new three.Mesh(bGeo, bMat);
                var xOff = side * (roadWidth / 2 + bw / 2 + 2 + Math.random() * 5);
                building.position.set(xOff, bh / 2 - 0.1, i * 10 - 50 + Math.random() * 5);
                building.castShadow = true;
                building.receiveShadow = true;
                this.scene.add(building);

                // Window lights
                for (var wy = 0; wy < bh - 2; wy += 3) {
                    for (var wx = -bw / 2 + 1; wx < bw / 2 - 1; wx += 2) {
                        if (Math.random() > 0.3) continue;
                        var winGeo = new three.PlaneGeometry(0.8, 1.2);
                        var winColor = buildingColors[Math.floor(Math.random() * buildingColors.length)];
                        var winMat = new three.MeshBasicMaterial({
                            color: winColor,
                            transparent: true,
                            opacity: 0.3 + Math.random() * 0.5
                        });
                        var win = new three.Mesh(winGeo, winMat);
                        win.position.set(
                            xOff + wx,
                            wy + 1,
                            i * 10 - 50 + Math.random() * 5 + (side > 0 ? bd / 2 + 0.01 : -bd / 2 - 0.01)
                        );
                        if (side > 0) win.rotation.y = Math.PI;
                        this.scene.add(win);
                    }
                }
            }
        }
    },

    // ─── PHYSICS UPDATE ───

    updatePhysics(dt) {
        if (!this.active) return;

        var dtSec = dt;
        var phys = RACING_PHYS;

        // Input
        var throttleInput = (isKey('ArrowUp') || isKey('w') || isKey('W')) ? 1 : 0;
        var brakeInput = (isKey('ArrowDown') || isKey('s') || isKey('S')) ? 1 : 0;
        var steerVal = (isKey('ArrowLeft') || isKey('a') || isKey('A') ? -1 : 0) +
                        (isKey('ArrowRight') || isKey('d') || isKey('D') ? 1 : 0);
        var nitroInput = isKey(' ') && this.nitro > 0;

        // Smooth input
        this.throttle += (throttleInput - this.throttle) * Math.min(1, dtSec * 6);
        this.brake += (brakeInput - this.brake) * Math.min(1, dtSec * 8);
        this.steerInput += (steerVal - this.steerInput) * Math.min(1, dtSec * 12);

        var speedMs = this.speed / 3.6;
        var steerSpeedFactor = Math.max(0.12, 1 - speedMs * 0.012);
        var maxSteer = 0.5 * steerSpeedFactor;
        this.steerAngle = this.steerInput * maxSteer;
        this.steerAngle *= 0.9;

        // Gearbox
        if (this.gear === 0 && this.throttle > 0.2 && this.speed < 1) {
            this.gear = 1;
        }

        var gearRatio = this.gear > 0 ? phys.gearRatios[this.gear - 1] : this.gear < 0 ? -3.0 : 1;
        var totalRatio = gearRatio * phys.finalDrive;

        if (this.gear === 0 || this.gear === -1) {
            this.rpm += (phys.idleRpm - this.rpm) * dtSec * 5;
        } else {
            var wheelRpm = speedMs / phys.wheelRadius * totalRatio * 60 / (2 * Math.PI);
            var throttleRpm = phys.idleRpm + this.throttle * 5000;
            var targetRpm = Math.max(wheelRpm, throttleRpm);
            this.rpm += (targetRpm - this.rpm) * dtSec * 8;
            this.rpm = Math.max(phys.idleRpm, Math.min(phys.maxRpm, this.rpm));
        }

        // Torque curve
        var torqueCurve = 0.35 + 0.65 * Math.max(0, 1 - Math.pow((this.rpm - 5500) / 4000, 2));
        var engineTorque = phys.enginePower * (5500 / Math.max(1, this.rpm)) * torqueCurve * this.throttle;
        var driveTorque = this.gear > 0 ? engineTorque * totalRatio : 0;
        var driveForce = driveTorque / phys.wheelRadius;
        var brakingForce = this.brake * phys.brakeTorque / phys.wheelRadius;

        var dragForce = 0.5 * AIR_DENSITY * phys.dragCoeff * phys.frontalArea * speedMs * Math.abs(speedMs);
        var netForce = driveForce - dragForce * Math.sign(this.speed + 0.01) - brakingForce;
        var acceleration = netForce / phys.mass;
        this.speed += acceleration * dtSec;

        // Nitro
        if (nitroInput && this.nitro > 0) {
            this.speed += NITRO_BOOST * dtSec;
            this.nitro -= NITRO_CONSUME_RATE * dtSec * 60;
            this.nitro = Math.max(0, this.nitro);
            this.nitroActive = true;
        } else {
            this.nitro += NITRO_REGEN_RATE * dtSec * 60;
            this.nitro = Math.min(NITRO_MAX, this.nitro);
            this.nitroActive = false;
        }

        this.speed = Math.max(-30, Math.min(phys.maxSpeed, this.speed));

    // Steering / angular velocity
    if (Math.abs(this.speed) > 1) {
        var slipAngle = -this.steerAngle * (1 + speedMs * 0.018);
        var angVelTarget = -slipAngle * speedMs * 0.18 / (1 + speedMs * 0.04);
        this.angularVel += (angVelTarget - this.angularVel) * dtSec * 5;
    } else {
        this.angularVel *= 0.9;
    }
    this.totalAngle += this.angularVel * dtSec;

    // ═══ V1.8.3 — CAR-TO-CAR COLLISION ═══
    // Player car visual bounds (in 3D world units): half-width 1.25,
    // half-length 2.3, so a "touching" threshold of 2.4 catches brush
    // contact and a "bounce" threshold of 2.0 triggers the response.
    // The opponents' bodies are 2.2 wide × 4.5 long, so 2.0 is the
    // exact contact distance (not overlapping).
    if (typeof RacingOpponents !== 'undefined' && this.carGroup) {
        var px = this.carGroup.position.x;
        var pz = this.carGroup.position.z;
        var HALF_W = 1.25;
        var HALF_L = 2.3;
        for (var oi = 0; oi < RacingOpponents.data.length; oi++) {
            var opp = RacingOpponents.data[oi];
            var dx = px - opp.x;
            var dz = pz - opp.z;
            var dist = Math.sqrt(dx * dx + dz * dz);
            // Threshold = combined half-extents of the two cars (~2.4)
            if (dist > 0.001 && dist < 2.4) {
                // Normal vector from opponent → player
                var nx = dx / dist;
                var nz = dz / dist;

                // Push the player car OUT of the overlap, along the normal
                var overlap = 2.4 - dist;
                this.carGroup.position.x += nx * overlap;
                this.carGroup.position.z += nz * overlap;

                // Reflect a portion of the velocity (elastic-ish bounce)
                var relSpeed = this.speed;
                if (relSpeed > 5) {
                    this.speed *= 0.45;       // hard slowdown
                    this.angularVel += (Math.random() - 0.5) * 0.6;  // small spin
                    // Push the opponent away too (it's just data, AI will
                    // re-target, but visually it should jolt a bit)
                    opp.x -= nx * overlap * 0.3;
                    opp.z -= nz * overlap * 0.3;
                    opp.speed = Math.max(40, opp.speed - 25);
                }

                // Visual + audio feedback — gated to avoid every-frame spam
                if (!this._lastHit || Date.now() - this._lastHit > 250) {
                    this._lastHit = Date.now();
                    if (typeof RacingParticles !== 'undefined') {
                        RacingParticles.spawnHitSpark(
                            (this.carGroup.position.x + opp.x) * 0.5,
                            0.4,
                            (this.carGroup.position.z + opp.z) * 0.5
                        );
                    }
                    if (typeof RacingAudio !== 'undefined') {
                        RacingAudio.playCollision();
                    }
                    // Camera shake via the renderer offset
                    if (typeof RacingHUD !== 'undefined' && RacingHUD.shake) {
                        RacingHUD.shake(0.6);
                    }
                }
                break;  // one collision per frame is enough
            }
        }
    }

        // Auto upshift
        if (this.rpm > phys.maxRpm - 200 && this.gear < phys.gearRatios.length && this.throttle > 0.3) {
            if (this.gear < phys.gearRatios.length - 1) {
                this.gear++;
                this.rpm = phys.idleRpm + (this.rpm - phys.idleRpm) * 0.5;
            }
        }
        // Auto downshift
        if (this.rpm < 2500 && this.gear > 1 && this.throttle < 0.1) {
            this.gear--;
            this.rpm = Math.min(phys.maxRpm, this.rpm + 2000);
        }
    },

    // ─── CAR POSITION UPDATE ───

    updateCarTransform(dt) {
        if (!this.carGroup) return;

        // Move car forward along Z based on speed
        var speedMs = this.speed / 3.6;
        this.carGroup.position.z += speedMs * dt;

        // Orient car along spline tangent
        if (this.roadData && this.roadData.spline) {
            var progress = this.carGroup.position.z / this.roadData.length;
            progress = Math.max(0, Math.min(0.99, progress));
            var tangent = this.roadData.spline.getTangentAt(progress);
            var angle = Math.atan2(tangent.x, tangent.z);
            this.carGroup.rotation.y = angle + this.totalAngle;
        } else {
            this.carGroup.rotation.y = this.totalAngle;
        }

        // Slight body roll on steering
        this.carGroup.rotation.z = -this.steerAngle * 0.15;

        // Wheel spin (proportional to forward speed)
        if (this.wheels) {
            var wheelSpin = (speedMs / 0.33) * dt;  // wheelRadius = 0.33m
            for (var wi = 0; wi < this.wheels.length; wi++) {
                this.wheels[wi].rotation.x -= wheelSpin;
            }
        }

        // Headlight flicker disabled — keep steady
        // Tail lights brighten on brake
        if (this.tailLights) {
            var brake = this.brake > 0.1 ? 1.0 : 0.0;
            for (var ti = 0; ti < this.tailLights.length; ti++) {
                this.tailLights[ti].material.emissiveIntensity = 0.8 + brake * 1.8;
            }
        }

        // Underglow pulse
        var underglow = this.carGroup.children.find(function(c) {
            return c.material && c.material.opacity !== undefined && c.geometry && c.geometry.type === 'PlaneGeometry';
        });
        if (underglow) {
            underglow.material.opacity = 0.12 + Math.sin(Date.now() * 0.01) * 0.05;
        }
    },

    // ─── CAMERA UPDATE ───

    updateCamera() {
        if (!this.camera || !this.carGroup) return;

        var view = CAM_VIEWS[this.camView];
        var carPos = this.carGroup.position;
        var carAngle = this.carGroup.rotation.y;

        var camX, camY, camZ;

        switch (view) {
            case 'chase':
                camX = carPos.x - Math.sin(carAngle) * 12;
                camY = carPos.y + 5;
                camZ = carPos.z - Math.cos(carAngle) * 12;
                this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.08);
                this.camera.lookAt(carPos.x, carPos.y + 1, carPos.z + 5);
                break;
            case 'cockpit':
                camX = carPos.x + Math.sin(carAngle) * 0.5;
                camY = carPos.y + 1.2;
                camZ = carPos.z + Math.cos(carAngle) * 0.5;
                this.camera.position.set(camX, camY, camZ);
                this.camera.lookAt(
                    carPos.x + Math.sin(carAngle) * 10,
                    carPos.y + 1,
                    carPos.z + Math.cos(carAngle) * 10
                );
                break;
            case 'hood':
                camX = carPos.x + Math.sin(carAngle) * 2;
                camY = carPos.y + 2.0;
                camZ = carPos.z + Math.cos(carAngle) * 3;
                this.camera.position.set(camX, camY, camZ);
                this.camera.lookAt(
                    carPos.x + Math.sin(carAngle) * 20,
                    carPos.y + 0.5,
                    carPos.z + Math.cos(carAngle) * 20
                );
                break;
            case 'bumper':
                camX = carPos.x;
                camY = carPos.y + 0.8;
                camZ = carPos.z + Math.cos(carAngle) * 2.5;
                this.camera.position.set(camX, camY, camZ);
                this.camera.lookAt(
                    carPos.x + Math.sin(carAngle) * 30,
                    carPos.y + 0.3,
                    carPos.z + Math.cos(carAngle) * 30
                );
                break;
        }
    },

    // ─── RENDER ───

    render() {
        if (!this.renderer || !this.scene || !this.camera) return;
        this.renderer.render(this.scene, this.camera);
    },

    // ─── CAMERA CYCLE ───

    cycleCamera() {
        this.camView = (this.camView + 1) % CAM_VIEWS.length;
        console.log('[ RacingMode ] Camera:', CAM_LABELS[CAM_VIEWS[this.camView]]);
    },

    // ─── TRANSITIONS ───

    async enter(carEntity) {
        if (this.active) return;

        // Stop BGM
        stopBGM();

        // Initialize Three.js and scene
        await this.init(carEntity);

        // Show racing canvas, hide 2D canvas
        this.canvas.style.display = 'block';
        var gameCanvas = document.getElementById('game-canvas');
        if (gameCanvas) gameCanvas.style.display = 'none';

        // Show HUD
        if (typeof RacingHUD !== 'undefined') {
            RacingHUD.show();
            RacingHUD.resize();
        }

        // Reset physics state
        this.speed = 0;
        this.rpm = RACING_PHYS.idleRpm;
        this.gear = 0;
        this.throttle = 0;
        this.brake = 0;
        this.steerInput = 0;
        this.steerAngle = 0;
        this.nitro = NITRO_MAX;
        this.totalAngle = 0;
        this.angularVel = 0;
        this.camView = 0;

        // Store exit tile position for when we return to 2D
        this.exitTileX = carEntity ? Math.floor(carEntity.x / TILE) : 10;

        this.active = true;
        this.transitionState = 'entering';

        // Start countdown sequence
        this.countdownActive = true;
        this.countdownValue = 3;
        this.countdownTimer = 0;
        this.countdownCarEntity = carEntity;

        // Start engine sound + ambient music
        if (typeof RacingAudio !== 'undefined') {
            RacingAudio.init();
            RacingAudio.resume();
            RacingAudio.startMusic();
        }

        console.log('%c[ RacingMode ] Entered racing mode (countdown starting)', 'color:#0f0');
    },

    exit() {
        if (!this.active) return;

        // Hide racing canvas, show 2D canvas
        if (this.canvas) this.canvas.style.display = 'none';
        var gameCanvas = document.getElementById('game-canvas');
        if (gameCanvas) gameCanvas.style.display = 'block';

        // Hide HUD
        if (typeof RacingHUD !== 'undefined') RacingHUD.hide();

        // Stop racing audio
        if (typeof RacingAudio !== 'undefined') RacingAudio.stop();

        // Map 3D car position back to 2D tile position
        // The road starts at exitTileX and each tile = 10 world units
        if (this.carGroup && typeof this.exitTileX !== 'undefined') {
            var carZ = this.carGroup.position.z;
            var tilesTraveled = Math.floor(carZ / 10);
            this.exitX = (this.exitTileX + tilesTraveled) * TILE;
            // Clamp to level bounds
            this.exitX = Math.max(TILE * 3, Math.min(WW * TILE - TILE * 3, this.exitX));
        }

        this.active = false;
        this.countdownActive = false;
        this.transitionState = 'none';

        // Resume BGM
        startBGM();

        console.log('%c[ RacingMode ] Exited racing mode, exitX=' + this.exitX, 'color:#f80');
    },

    // ─── CLEANUP ───

    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        if (this.scene) {
            this.scene.traverse(function(obj) {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(function(m) { m.dispose(); });
                    } else {
                        obj.material.dispose();
                    }
                }
            });
            this.scene = null;
        }
        this.camera = null;
        this.carGroup = null;
        this.roadMesh = null;
        this.initialized = false;
        console.log('%c[ RacingMode ] Disposed', 'color:#f80');
    }
};
