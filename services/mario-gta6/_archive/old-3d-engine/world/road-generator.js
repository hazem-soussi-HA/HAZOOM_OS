// SPDX-License-Identifier: MIT
// Copyright (c) 206 Hazem Soussi (HA)
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.

// ═══════════════════════════════════════════════════════════════
// ROAD GENERATOR — Parse 2D tilemap into 3D racing road
// Scans the level tilemap to find the ground path and generates
// a CatmullRom spline for the racing road, with elevation changes
// based on gaps and terrain features.
// ═══════════════════════════════════════════════════════════════

var RoadGenerator = {
    // Generated road data
    spline: null,        // THREE.CatmullRomCurve3
    length: 0,           // total road length in world units
    width: 14,           // road width
    samplePoints: [],    // sampled points along the spline

    // ─── MAIN ENTRY: Generate road from tilemap ───
    generate(scene, tilemap, startTileX) {
        // Step 1: Scan tilemap for ground path
        var pathPoints = this.scanGroundPath(tilemap, startTileX);

        // Step 2: Convert tile coordinates to 3D world coordinates
        var worldPoints = this.pathToWorld(pathPoints);

        // Step 3: Create CatmullRom spline
        this.spline = new THREE.CatmullRomCurve3(worldPoints, false, 'catmullrom', 0.5);
        this.samplePoints = this.spline.getPoints(200);
        this.length = this.computeLength(this.samplePoints);

        // Step 4: Build 3D road mesh along spline
        this.buildRoadMesh(scene, worldPoints);

        // Step 5: Build environment (buildings, barriers)
        this.buildEnvironment(scene, worldPoints);

        return {
            spline: this.spline,
            length: this.length,
            startPoint: worldPoints[0],
            samplePoints: this.samplePoints
        };
    },

    // ─── STEP 1: Scan tilemap for ground path ───
    scanGroundPath(tilemap, startTileX) {
        var path = [];
        var groundY = WH - 2;  // Ground is at rows WH-2 and WH-1

        // Scan from startTileX forward, sampling every few tiles
        var step = 3;  // Sample every 3 tiles for smooth curves
        var endX = Math.min(WW, startTileX + 300);  // 300 tiles ahead

        for (var x = startTileX; x < endX; x += step) {
            // Check if there's ground at this x position
            var hasGround = (tilemap[groundY] && tilemap[groundY][x] === 1);
            var hasGroundAbove = (tilemap[groundY - 1] && tilemap[groundY - 1][x] === 1);

            // Y position: ground level or elevated if there's a platform
            var tileY = hasGround ? groundY : (hasGroundAbove ? groundY - 1 : -1);

            if (tileY >= 0) {
                path.push({ x: x, y: tileY, hasGround: true });
            } else {
                // Gap — mark as jump section
                path.push({ x: x, y: groundY, hasGround: false });
            }
        }

        // Always include the start point
        if (path.length === 0 || path[0].x > startTileX) {
            path.unshift({ x: startTileX, y: groundY, hasGround: true });
        }

        return path;
    },

    // ─── STEP 2: Convert tile coords to 3D world coords ───
    pathToWorld(pathPoints) {
        var worldPoints = [];
        var scale = 10;  // 1 tile = 10 world units
        var baseY = 0;   // Ground level in world coords

        for (var i = 0; i < pathPoints.length; i++) {
            var p = pathPoints[i];
            // X: spread tiles along Z axis (forward)
            var z = (p.x - pathPoints[0].x) * scale;
            // Y: elevation — gaps create dips, platforms create hills
            var y = baseY;
            if (!p.hasGround) {
                y = baseY - 3;  // Dip for gaps
            }
            // X in 3D: slight lateral variation for visual interest
            var x = 0;

            worldPoints.push(new THREE.Vector3(x, y, z));
        }

        return worldPoints;
    },

    // ─── STEP 3: Compute spline length ───
    computeLength(points) {
        var len = 0;
        for (var i = 1; i < points.length; i++) {
            len += points[i].distanceTo(points[i - 1]);
        }
        return len;
    },

    // ─── STEP 4: Build 3D road mesh ───
    buildRoadMesh(scene, worldPoints) {
        // Create a tube-like road by extruding a rectangle along the spline
        var segments = 200;
        var roadWidth = this.width;

        // Generate road surface vertices along the spline
        var roadGeo = new THREE.BufferGeometry();
        var vertices = [];
        var uvs = [];
        var indices = [];

        for (var i = 0; i <= segments; i++) {
            var t = i / segments;
            var point = this.spline.getPointAt(t);
            var tangent = this.spline.getTangentAt(t);

            // Compute perpendicular direction (cross product with up)
            var up = new THREE.Vector3(0, 1, 0);
            var right = new THREE.Vector3().crossVectors(tangent, up).normalize();

            // Left and right edges of road
            var left = point.clone().add(right.clone().multiplyScalar(-roadWidth / 2));
            var rightP = point.clone().add(right.clone().multiplyScalar(roadWidth / 2));

            vertices.push(left.x, left.y + 0.05, left.z);
            vertices.push(rightP.x, rightP.y + 0.05, rightP.z);

            uvs.push(0, t * 20);
            uvs.push(1, t * 20);

            // Create triangles
            if (i < segments) {
                var base = i * 2;
                indices.push(base, base + 1, base + 2);
                indices.push(base + 1, base + 3, base + 2);
            }
        }

        roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        roadGeo.setIndex(indices);
        roadGeo.computeVertexNormals();

        var roadMat = new THREE.MeshPhongMaterial({
            color: 0x333344,
            shininess: 20,
            side: THREE.DoubleSide
        });

        var roadMesh = new THREE.Mesh(roadGeo, roadMat);
        roadMesh.receiveShadow = true;
        scene.add(roadMesh);

        // Road center line (dashed)
        this.buildRoadLines(scene, segments);

        // Road edge barriers
        this.buildBarriers(scene, segments, roadWidth);
    },

    buildRoadLines(scene, segments) {
        // Center dashed line
        for (var i = 0; i < segments; i += 4) {
            var t1 = i / segments;
            var t2 = Math.min((i + 2) / segments, 1);
            var p1 = this.spline.getPointAt(t1);
            var p2 = this.spline.getPointAt(t2);

            var lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
            var lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.6, transparent: true });
            var line = new THREE.Line(lineGeo, lineMat);
            line.position.y = 0.1;
            scene.add(line);
        }
    },

    buildBarriers(scene, segments, roadWidth) {
        // Red/green edge lines
        for (var side = -1; side <= 1; side += 2) {
            var points = [];
            for (var i = 0; i <= segments; i += 2) {
                var t = i / segments;
                var point = this.spline.getPointAt(t);
                var tangent = this.spline.getTangentAt(t);
                var up = new THREE.Vector3(0, 1, 0);
                var right = new THREE.Vector3().crossVectors(tangent, up).normalize();
                var edge = point.clone().add(right.clone().multiplyScalar(side * (roadWidth / 2 - 0.5)));
                edge.y += 0.15;
                points.push(edge);
            }

            var color = side < 0 ? 0xff2200 : 0x00ff44;
            var lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            var lineMat = new THREE.LineBasicMaterial({ color: color, opacity: 0.7, transparent: true });
            scene.add(new THREE.Line(lineGeo, lineMat));
        }
    },

    // ─── STEP 5: Build environment ───
    buildEnvironment(scene, worldPoints) {
        var buildingColors = [0x00ffff, 0xff00ff, 0xff8800, 0x00ff88, 0x4444ff, 0xff4488];

        // Place buildings along the road
        for (var i = 0; i < worldPoints.length; i += 4) {
            var p = worldPoints[i];
            for (var side = -1; side <= 1; side += 2) {
                if (Math.random() > 0.35) continue;

                var bw = 3 + Math.random() * 6;
                var bh = 8 + Math.random() * 35;
                var bd = 3 + Math.random() * 6;

                var bGeo = new THREE.BoxGeometry(bw, bh, bd);
                var color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
                var bMat = new THREE.MeshPhongMaterial({
                    color: 0x0a0a15,
                    emissive: color,
                    emissiveIntensity: 0.08,
                    shininess: 80
                });
                var building = new THREE.Mesh(bGeo, bMat);
                var xOff = side * (this.width / 2 + bw / 2 + 3 + Math.random() * 8);
                building.position.set(p.x + xOff, bh / 2, p.z + (Math.random() - 0.5) * 10);
                building.castShadow = true;
                building.receiveShadow = true;
                scene.add(building);

                // Window lights
                for (var wy = 2; wy < bh - 2; wy += 3) {
                    for (var wx = -bw / 2 + 1.5; wx < bw / 2 - 1; wx += 2) {
                        if (Math.random() > 0.25) continue;
                        var winGeo = new THREE.PlaneGeometry(0.8, 1.2);
                        var winColor = buildingColors[Math.floor(Math.random() * buildingColors.length)];
                        var winMat = new THREE.MeshBasicMaterial({
                            color: winColor, transparent: true,
                            opacity: 0.3 + Math.random() * 0.5
                        });
                        var win = new THREE.Mesh(winGeo, winMat);
                        win.position.set(
                            p.x + xOff + wx, wy + 1,
                            p.z + (side > 0 ? bd / 2 + 0.01 : -bd / 2 - 0.01)
                        );
                        if (side > 0) win.rotation.y = Math.PI;
                        scene.add(win);
                    }
                }
            }
        }

        // Grid floor for infinite ground feel
        var gridHelper = new THREE.GridHelper(3000, 300, 0x00ffff, 0x003333);
        gridHelper.position.y = -0.2;
        scene.add(gridHelper);
    },

    // ─── UTILITY: Get position on road at progress t (0-1) ───
    getPositionAt(t) {
        if (!this.spline) return new THREE.Vector3();
        return this.spline.getPointAt(Math.max(0, Math.min(1, t)));
    },

    getTangentAt(t) {
        if (!this.spline) return new THREE.Vector3(0, 0, 1);
        return this.spline.getTangentAt(Math.max(0, Math.min(1, t)));
    }
};
