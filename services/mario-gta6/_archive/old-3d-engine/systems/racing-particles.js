// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.

// ═══════════════════════════════════════════════════════════════
// RACING PARTICLES — GPU particle system for 3D racing
// Nitro flames, drift sparks, tire smoke
// Uses THREE.Points with buffer geometry for performance
// ═══════════════════════════════════════════════════════════════

var RacingParticles = {
    system: null,
    particles: [],
    pool: [],
    count: 500,
    scene: null,

    init(scene) {
        this.scene = scene;
        var geo = new THREE.BufferGeometry();
        var pos = new Float32Array(this.count * 3);
        var col = new Float32Array(this.count * 3);
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

        var mat = new THREE.PointsMaterial({
            size: 2.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        this.system = new THREE.Points(geo, mat);
        scene.add(this.system);

        this.particles = [];
        this.pool = [];
        for (var i = 0; i < this.count; i++) {
            this.particles.push({
                x: 0, y: -10000, z: 0,
                vx: 0, vy: 0, vz: 0,
                life: 0, maxLife: 1,
                r: 1, g: 1, b: 1,
                active: false
            });
            this.pool.push(i);
        }
    },

    spawn(x, y, z, vx, vy, vz, r, g, b, life) {
        if (this.pool.length === 0) return;
        var idx = this.pool.pop();
        var p = this.particles[idx];
        p.x = x; p.y = y; p.z = z;
        p.vx = vx; p.vy = vy; p.vz = vz;
        p.life = life || 1.0;
        p.maxLife = p.life;
        p.r = r; p.g = g; p.b = b;
        p.active = true;
    },

    // Nitro boost flames from exhaust
    spawnNitro(carX, carY, carZ, angle) {
        for (var i = 0; i < 3; i++) {
            var spread = (Math.random() - 0.5) * 1.5;
            this.spawn(
                carX + (Math.random() - 0.5) * 0.8,
                carY - 0.3 + Math.random() * 0.5,
                carZ + Math.cos(angle) * 2.5,
                -Math.sin(angle) * 2 + spread,
                -0.5 + Math.random() * 1.5,
                -Math.cos(angle) * 2 + spread,
                1.0, 0.5 + Math.random() * 0.5, 0.0,
                0.4 + Math.random() * 0.3
            );
        }
    },

    // Sparks from tire slip
    spawnSparks(carX, carY, carZ, angle) {
        for (var i = 0; i < 2; i++) {
            this.spawn(
                carX + (Math.random() - 0.5) * 2,
                carY - 0.5,
                carZ + (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 3,
                Math.random() * 2,
                (Math.random() - 0.5) * 3,
                1.0, 0.8, 0.2,
                0.3 + Math.random() * 0.2
            );
        }
    },

    // Tire smoke
    spawnSmoke(carX, carY, carZ, angle) {
        for (var i = 0; i < 2; i++) {
            this.spawn(
                carX + (Math.random() - 0.5) * 1.5,
                carY - 0.3,
                carZ + (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 0.8,
                0.2 + Math.random() * 0.5,
                (Math.random() - 0.5) * 0.8,
                0.6, 0.6, 0.6,
                0.5 + Math.random() * 0.3
            );
        }
    },

    // Collision explosion
    spawnExplosion(x, y, z) {
        for (var i = 0; i < 15; i++) {
            var angle = Math.random() * Math.PI * 2;
            var up = Math.random() * Math.PI * 0.5;
            var speed = 2 + Math.random() * 4;
            this.spawn(
                x, y, z,
                Math.cos(angle) * Math.cos(up) * speed,
                Math.sin(up) * speed,
                Math.sin(angle) * Math.cos(up) * speed,
                1.0, 0.3 + Math.random() * 0.7, 0.0,
                0.5 + Math.random() * 0.5
            );
        }
    },

    // V1.8.3 — Small spark burst for car-to-car contact (used by
    // racing-mode.js on collision). 8 particles, hot white/yellow,
    // short life — should read as a "clang" of metal, not a crash.
    spawnHitSpark(x, y, z) {
        for (var i = 0; i < 8; i++) {
            var angle = Math.random() * Math.PI * 2;
            var up = (Math.random() - 0.3) * 1.5;
            var speed = 1.5 + Math.random() * 2.5;
            this.spawn(
                x, y, z,
                Math.cos(angle) * speed,
                up * 0.8,
                Math.sin(angle) * speed,
                1.0, 0.85 + Math.random() * 0.15, 0.2 + Math.random() * 0.3,
                0.25 + Math.random() * 0.2
            );
        }
    },

    update(dt) {
        if (!this.system) return;
        var posArr = this.system.geometry.attributes.position.array;
        var colArr = this.system.geometry.attributes.color.array;
        var gravity = -2.0;
        var drag = 0.96;
        var hasActive = false;

        for (var i = 0; i < this.count; i++) {
            var p = this.particles[i];
            if (p.active && p.life > 0) {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.z += p.vz * dt;
                p.vy += gravity * dt;
                p.vx *= drag;
                p.vy *= drag;
                p.vz *= drag;
                p.life -= dt * 0.8;

                var lifeRatio = Math.max(0, p.life / p.maxLife);
                posArr[i * 3] = p.x;
                posArr[i * 3 + 1] = p.y;
                posArr[i * 3 + 2] = p.z;
                colArr[i * 3] = p.r * lifeRatio;
                colArr[i * 3 + 1] = p.g * lifeRatio;
                colArr[i * 3 + 2] = p.b * lifeRatio;

                if (p.life <= 0) {
                    p.active = false;
                    p.y = -10000;
                    this.pool.push(i);
                } else {
                    hasActive = true;
                }
            } else {
                posArr[i * 3 + 1] = -10000;
            }
        }

        if (hasActive) {
            this.system.geometry.attributes.position.needsUpdate = true;
            this.system.geometry.attributes.color.needsUpdate = true;
        }
    }
};
