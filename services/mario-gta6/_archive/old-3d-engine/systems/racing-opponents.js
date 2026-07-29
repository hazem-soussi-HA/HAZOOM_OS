// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.

// ═══════════════════════════════════════════════════════════════
// RACING OPPONENTS — AI cars in 3D racing mode
// Simple AI: drive along the road at varying speeds
// ═══════════════════════════════════════════════════════════════

var RacingOpponents = {
    meshes: [],
    data: [],
    scene: null,

    OPPONENT_COUNT: 4,
    OPPONENT_NAMES: ['BLADE', 'VIPER', 'NOVA', 'SHADOW'],
    OPPONENT_COLORS: [0xff0000, 0xffff00, 0x00ff00, 0xff8800],

    init(scene) {
        this.scene = scene;
        this.meshes = [];
        this.data = [];

        for (var i = 0; i < this.OPPONENT_COUNT; i++) {
            var group = this.createCarMesh(scene, this.OPPONENT_COLORS[i]);
            scene.add(group);
            this.meshes.push(group);
            this.data.push({
                z: -20 - i * 15,        // staggered behind player
                x: (Math.random() - 0.5) * 6,  // slight lateral offset
                speed: 80 + Math.random() * 60, // km/h base speed
                name: this.OPPONENT_NAMES[i],
                color: this.OPPONENT_COLORS[i],
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.5 + Math.random() * 1.5,
                wobbleAmp: 0.5 + Math.random() * 1.5
            });
        }
    },

    createCarMesh(scene, color) {
        var group = new THREE.Group();
        var bodyColor = 0x111111;

        // Body
        var bodyGeo = new THREE.BoxGeometry(2.2, 0.8, 4.5);
        var bodyMat = new THREE.MeshPhongMaterial({
            color: bodyColor,
            emissive: color,
            emissiveIntensity: 0.1,
            shininess: 100
        });
        var body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.4;
        group.add(body);

        // Canopy
        var canopyGeo = new THREE.BoxGeometry(1.6, 0.6, 2.0);
        var canopyMat = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.08,
            transparent: true,
            opacity: 0.4,
            shininess: 150
        });
        var canopy = new THREE.Mesh(canopyGeo, canopyMat);
        canopy.position.set(0, 1.0, -0.3);
        group.add(canopy);

        // Tail lights
        for (var side of [-1, 1]) {
            var tlGeo = new THREE.BoxGeometry(0.4, 0.15, 0.05);
            var tlMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
            var tl = new THREE.Mesh(tlGeo, tlMat);
            tl.position.set(side * 0.7, 0.5, 2.25);
            group.add(tl);
        }

        // Headlights
        for (var side of [-1, 1]) {
            var hlGeo = new THREE.BoxGeometry(0.3, 0.1, 0.05);
            var hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            var hl = new THREE.Mesh(hlGeo, hlMat);
            hl.position.set(side * 0.7, 0.5, -2.25);
            group.add(hl);
        }

        // Underglow
        var ugGeo = new THREE.PlaneGeometry(2.5, 4.5);
        var ugMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide
        });
        var ug = new THREE.Mesh(ugGeo, ugMat);
        ug.rotation.x = -Math.PI / 2;
        ug.position.y = -0.1;
        group.add(ug);

        return group;
    },

    update(dt) {
        if (!RacingMode.active) return;
        var rm = RacingMode;
        var playerZ = rm.carGroup ? rm.carGroup.position.z : 0;
        var playerSpeed = rm.speed;

        for (var i = 0; i < this.data.length; i++) {
            var opp = this.data[i];
            var mesh = this.meshes[i];

            // AI speed: base speed with some variation
            var targetSpeed = opp.speed + Math.sin(Date.now() * 0.001 + i) * 15;
            var speedMs = targetSpeed / 3.6;

            // Move forward
            opp.z += speedMs * dt;

            // Lateral wobble (lane changes)
            opp.wobble += opp.wobbleSpeed * dt;
            var targetX = Math.sin(opp.wobble) * opp.wobbleAmp;
            opp.x += (targetX - opp.x) * 0.02;

            // Keep relative to player (wrap around if too far)
            if (opp.z > playerZ + 100) {
                opp.z = playerZ - 60 - Math.random() * 40;
                opp.x = (Math.random() - 0.5) * 8;
            }
            if (opp.z < playerZ - 150) {
                opp.z = playerZ + 50 + Math.random() * 30;
            }

            // Update mesh position
            mesh.position.set(opp.x, 0, opp.z);
            mesh.rotation.y = Math.sin(opp.wobble * 0.5) * 0.05; // slight steering visual

            // Underglow pulse
            var ug = mesh.children[mesh.children.length - 1];
            if (ug && ug.material) {
                ug.material.opacity = 0.08 + Math.sin(Date.now() * 0.003 + i) * 0.04;
            }
        }
    },

    checkCollision() {
        if (!RacingMode.carGroup) return false;
        var px = RacingMode.carGroup.position.x;
        var pz = RacingMode.carGroup.position.z;

        for (var i = 0; i < this.data.length; i++) {
            var opp = this.data[i];
            var dx = px - opp.x;
            var dz = pz - opp.z;
            var dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 3.5) return { index: i, x: opp.x, z: opp.z };
        }
        return false;
    }
};
