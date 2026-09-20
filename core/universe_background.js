/**
 * HAZOOM OS — 3D Universe Background
 * Procedural galaxy with stars, nebulae, and cosmic dust
 * Uses Three.js via CDN with GPU instancing for performance
 */

(function() {
    'use strict';

    let scene, camera, renderer, stars, nebula, dust;
    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    let time = 0;
    let animationId = null;
    let isInitialized = false;

    const STAR_COUNT = 15000;
    const NEBULA_PARTICLES = 3000;
    const DUST_COUNT = 5000;

    const COLORS = {
        star: [0xffffff, 0xfff4e6, 0xe6f0ff, 0xffebc8, 0xc8e8ff],
        nebula: [0x00e8ff, 0x8b5cf6, 0xffc940, 0x00e676, 0xff3d71],
        dust: [0xffffff, 0xffe0b0, 0xb0e0ff]
    };

    function initUniverse() {
        if (isInitialized) return;
        isInitialized = true;

        const canvas = document.getElementById('desktop-canvas');
        if (!canvas) {
            console.warn('[Universe] Canvas not found');
            return;
        }

        // Scene setup
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x030308, 0.0003);

        // Camera - orthographic for 2.5D parallax feel
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = 100;
        camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            0.1, 10000
        );
        camera.position.z = 100;

        // Renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: false
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);

        // Create cosmic elements
        createStars();
        createNebulae();
        createCosmicDust();
        createGalaxyCore();

        // Event listeners
        document.addEventListener('mousemove', onMouseMove);
        window.addEventListener('resize', onResize);

        // Start render loop
        animate();

        console.log('[Universe] 3D background initialized');
    }

    function createStars() {
        // Multiple layers for depth
        const layers = [
            { count: 5000, size: 1.2, distance: 2000, opacity: 0.8, colorVariation: 0.3 },
            { count: 5000, size: 0.8, distance: 4000, opacity: 0.5, colorVariation: 0.5 },
            { count: 5000, size: 0.4, distance: 8000, opacity: 0.3, colorVariation: 0.7 }
        ];

        layers.forEach((layer, layerIndex) => {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(layer.count * 3);
            const colors = new Float32Array(layer.count * 3);
            const sizes = new Float32Array(layer.count);
            const velocities = new Float32Array(layer.count * 3);
            const phases = new Float32Array(layer.count);

            for (let i = 0; i < layer.count; i++) {
                // Spherical distribution
                const radius = layer.distance * (0.5 + Math.random() * 0.5);
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                positions[i * 3 + 2] = radius * Math.cos(phi);

                // Star color with variation
                const baseColor = COLORS.star[Math.floor(Math.random() * COLORS.star.length)];
                const color = new THREE.Color(baseColor);
                const variation = layer.colorVariation;
                color.offsetHSL(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * variation,
                    (Math.random() - 0.5) * variation * 0.5
                );
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;

                sizes[i] = layer.size * (0.5 + Math.random() * 1.5);

                // Velocity for subtle drift
                velocities[i * 3] = (Math.random() - 0.5) * 0.0001;
                velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0001;
                velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.00005;

                phases[i] = Math.random() * Math.PI * 2;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
            geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

            const material = new THREE.PointsMaterial({
                size: layer.size,
                vertexColors: true,
                transparent: true,
                opacity: layer.opacity,
                sizeAttenuation: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            const points = new THREE.Points(geometry, material);
            points.userData = { layerIndex, baseDistance: layer.distance, velocities, phases };
            scene.add(points);

            if (!stars) stars = [];
            stars.push(points);
        });
    }

    function createNebulae() {
        // Volumetric nebula clouds using additive blended particles
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(NEBULA_PARTICLES * 3);
        const colors = new Float32Array(NEBULA_PARTICLES * 3);
        const sizes = new Float32Array(NEBULA_PARTICLES);
        const opacities = new Float32Array(NEBULA_PARTICLES);
        const velocities = new Float32Array(NEBULA_PARTICLES * 3);
        const noiseOffsets = new Float32Array(NEBULA_PARTICLES * 3);

        // Create several nebula formations
        const formations = 5;
        const particlesPerFormation = NEBULA_PARTICLES / formations;

        for (let f = 0; f < formations; f++) {
            const centerX = (Math.random() - 0.5) * 3000;
            const centerY = (Math.random() - 0.5) * 3000;
            const centerZ = (Math.random() - 0.5) * 3000 - 2000;
            const radius = 400 + Math.random() * 600;
            const baseColor = new THREE.Color(COLORS.nebula[f % COLORS.nebula.length]);

            for (let i = 0; i < particlesPerFormation; i++) {
                const idx = f * particlesPerFormation + i;

                // Spherical with noise displacement
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = radius * Math.pow(Math.random(), 0.33); // Concentrate toward center

                let x = r * Math.sin(phi) * Math.cos(theta);
                let y = r * Math.sin(phi) * Math.sin(theta);
                let z = r * Math.cos(phi);

                // Add turbulence
                const noiseScale = 0.3;
                x += (Math.random() - 0.5) * radius * noiseScale;
                y += (Math.random() - 0.5) * radius * noiseScale;
                z += (Math.random() - 0.5) * radius * noiseScale;

                positions[idx * 3] = centerX + x;
                positions[idx * 3 + 1] = centerY + y;
                positions[idx * 3 + 2] = centerZ + z;

                // Color with variation
                const color = baseColor.clone();
                color.offsetHSL(
                    (Math.random() - 0.5) * 0.15,
                    (Math.random() - 0.5) * 0.3,
                    (Math.random() - 0.5) * 0.4
                );
                colors[idx * 3] = color.r;
                colors[idx * 3 + 1] = color.g;
                colors[idx * 3 + 2] = color.b;

                sizes[idx] = 80 + Math.random() * 120;
                opacities[idx] = 0.02 + Math.random() * 0.04;

                // Slow orbital velocity
                const orbitSpeed = 0.00001 + Math.random() * 0.00002;
                velocities[idx * 3] = -y * orbitSpeed;
                velocities[idx * 3 + 1] = x * orbitSpeed;
                velocities[idx * 3 + 2] = (Math.random() - 0.5) * 0.00001;

                noiseOffsets[idx * 3] = Math.random() * 100;
                noiseOffsets[idx * 3 + 1] = Math.random() * 100;
                noiseOffsets[idx * 3 + 2] = Math.random() * 100;
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('noiseOffset', new THREE.BufferAttribute(noiseOffsets, 3));

        const material = new THREE.PointsMaterial({
            size: 100,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            alphaMap: createAlphaTexture()
        });

        nebula = new THREE.Points(geometry, material);
        nebula.userData = { velocities, noiseOffsets, basePositions: positions.slice() };
        scene.add(nebula);
    }

    function createAlphaTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    function createCosmicDust() {
        // Fine dust particles for depth
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(DUST_COUNT * 3);
        const colors = new Float32Array(DUST_COUNT * 3);
        const sizes = new Float32Array(DUST_COUNT);
        const velocities = new Float32Array(DUST_COUNT * 3);
        const phases = new Float32Array(DUST_COUNT);

        for (let i = 0; i < DUST_COUNT; i++) {
            // Disk-like distribution (galaxy plane)
            const radius = 500 + Math.random() * 2500;
            const theta = Math.random() * Math.PI * 2;
            const height = (Math.random() - 0.5) * 200;

            positions[i * 3] = radius * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(theta);
            positions[i * 3 + 2] = height;

            const baseColor = COLORS.dust[Math.floor(Math.random() * COLORS.dust.length)];
            const color = new THREE.Color(baseColor);
            color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.3);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = 0.5 + Math.random() * 1.5;
            velocities[i * 3] = (Math.random() - 0.5) * 0.0002;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0002;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0001;
            phases[i] = Math.random() * Math.PI * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

        const material = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true,
            transparent: true,
            opacity: 0.4,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.NormalBlending
        });

        dust = new THREE.Points(geometry, material);
        dust.userData = { velocities, phases };
        scene.add(dust);
    }

    function createGalaxyCore() {
        // Central bright core
        const geometry = new THREE.SphereGeometry(50, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const core = new THREE.Mesh(geometry, material);
        core.position.set(0, 0, -1000);
        core.scale.setScalar(20);
        scene.add(core);

        // Core glow particles
        const glowGeometry = new THREE.BufferGeometry();
        const glowCount = 500;
        const glowPositions = new Float32Array(glowCount * 3);
        const glowSizes = new Float32Array(glowCount);
        const glowColors = new Float32Array(glowCount * 3);

        for (let i = 0; i < glowCount; i++) {
            const r = Math.random() * 1000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            glowPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            glowPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            glowPositions[i * 3 + 2] = r * Math.cos(phi) - 1000;

            glowSizes[i] = 20 + Math.random() * 40;

            const color = new THREE.Color().setHSL(
                0.55 + (Math.random() - 0.5) * 0.1,
                0.8,
                0.6 + Math.random() * 0.2
            );
            glowColors[i * 3] = color.r;
            glowColors[i * 3 + 1] = color.g;
            glowColors[i * 3 + 2] = color.b;
        }

        glowGeometry.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));
        glowGeometry.setAttribute('size', new THREE.BufferAttribute(glowSizes, 1));
        glowGeometry.setAttribute('color', new THREE.BufferAttribute(glowColors, 3));

        const glowMaterial = new THREE.PointsMaterial({
            size: 30,
            vertexColors: true,
            transparent: true,
            opacity: 0.15,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            alphaMap: createAlphaTexture()
        });

        const coreGlow = new THREE.Points(glowGeometry, glowMaterial);
        scene.add(coreGlow);

        if (!scene.userData.cores) scene.userData.cores = [];
        scene.userData.cores.push(core, coreGlow);
    }

    function onMouseMove(event) {
        // Normalized mouse position (-1 to 1)
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function onResize() {
        const canvas = document.getElementById('desktop-canvas');
        if (!canvas || !renderer || !camera) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        const aspect = width / height;
        const frustumSize = 100;

        camera.left = frustumSize * aspect / -2;
        camera.right = frustumSize * aspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = frustumSize / -2;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    // Animation state
    let targetNebulaOpacity = 0.7, currentNebulaOpacity = 0.7;
    let targetStarOpacity = 0.6, currentStarOpacity = 0.6;
    let targetDustOpacity = 0.4, currentDustOpacity = 0.4;

    function animate() {
        if (!isInitialized) return;

        animationId = requestAnimationFrame(animate);
        time += 0.016;

        // Smooth camera follow mouse (parallax)
        targetX = mouseX * 15;
        targetY = mouseY * 15;
        camera.position.x += (targetX - camera.position.x) * 0.02;
        camera.position.y += (targetY - camera.position.y) * 0.02;
        camera.lookAt(0, 0, -1000);

        // Animate stars
        if (stars) {
            stars.forEach((starLayer, layerIndex) => {
                const positions = starLayer.geometry.attributes.position.array;
                const velocities = starLayer.userData.velocities;
                const phases = starLayer.userData.phases;
                const baseDistance = starLayer.userData.baseDistance;

                for (let i = 0; i < positions.length / 3; i++) {
                    // Subtle twinkling
                    const twinkle = Math.sin(time * 2 + phases[i]) * 0.15 + 0.85;
                    starLayer.material.opacity = starLayer.material.opacity * 0.99 + twinkle * 0.01;

                    // Slow drift
                    positions[i * 3] += velocities[i * 3];
                    positions[i * 3 + 1] += velocities[i * 3 + 1];
                    positions[i * 3 + 2] += velocities[i * 3 + 2];

                    // Wrap around
                    const dist = Math.sqrt(
                        positions[i * 3] ** 2 +
                        positions[i * 3 + 1] ** 2 +
                        positions[i * 3 + 2] ** 2
                    );
                    if (dist > baseDistance * 1.5) {
                        const theta = Math.random() * Math.PI * 2;
                        const phi = Math.acos(2 * Math.random() - 1);
                        positions[i * 3] = baseDistance * Math.sin(phi) * Math.cos(theta);
                        positions[i * 3 + 1] = baseDistance * Math.sin(phi) * Math.sin(theta);
                        positions[i * 3 + 2] = baseDistance * Math.cos(phi);
                    }
                }
                starLayer.geometry.attributes.position.needsUpdate = true;
            });
        }

        // Animate nebulae
        if (nebula) {
            const positions = nebula.geometry.attributes.position.array;
            const velocities = nebula.userData.velocities;
            const noiseOffsets = nebula.userData.noiseOffsets;
            const basePositions = nebula.userData.basePositions;
            const opacities = nebula.geometry.attributes.opacity.array;
            const sizes = nebula.geometry.attributes.size.array;

            for (let i = 0; i < positions.length / 3; i++) {
                // Orbital motion
                positions[i * 3] += velocities[i * 3];
                positions[i * 3 + 1] += velocities[i * 3 + 1];
                positions[i * 3 + 2] += velocities[i * 3 + 2];

                // Perlin-like noise for organic movement
                const noiseX = Math.sin(time * 0.05 + noiseOffsets[i * 3]) * 0.5;
                const noiseY = Math.cos(time * 0.04 + noiseOffsets[i * 3 + 1]) * 0.5;
                positions[i * 3] += noiseX;
                positions[i * 3 + 1] += noiseY;

                // Pulsing opacity and size
                const pulse = Math.sin(time * 0.3 + noiseOffsets[i * 3 + 2]) * 0.3 + 0.7;
                opacities[i] = opacities[i] * 0.99 + (opacities[i] * pulse) * 0.01;
                sizes[i] = sizes[i] * 0.99 + (sizes[i] * pulse) * 0.01;
            }

            nebula.geometry.attributes.position.needsUpdate = true;
            nebula.geometry.attributes.opacity.needsUpdate = true;
            nebula.geometry.attributes.size.needsUpdate = true;

            // Slow rotation of entire nebula
            nebula.rotation.y += 0.00001;
            nebula.rotation.x += 0.000005;
        }

        // Animate cosmic dust
        if (dust) {
            const positions = dust.geometry.attributes.position.array;
            const velocities = dust.userData.velocities;
            const phases = dust.userData.phases;

            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3] += velocities[i * 3];
                positions[i * 3 + 1] += velocities[i * 3 + 1];
                positions[i * 3 + 2] += velocities[i * 3 + 2];

                // Galactic rotation
                const x = positions[i * 3];
                const y = positions[i * 3 + 1];
                const radius = Math.sqrt(x * x + y * y);
                if (radius > 0) {
                    const orbitSpeed = 0.000005 / (radius / 1000 + 1);
                    const angle = orbitSpeed;
                    const cos = Math.cos(angle);
                    const sin = Math.sin(angle);
                    positions[i * 3] = x * cos - y * sin;
                    positions[i * 3 + 1] = x * sin + y * cos;
                }

                // Vertical oscillation
                positions[i * 3 + 2] += Math.sin(time + phases[i]) * 0.01;

                // Wrap
                if (positions[i * 3 + 2] > 100) positions[i * 3 + 2] = -100;
                if (positions[i * 3 + 2] < -100) positions[i * 3 + 2] = 100;
            }
            dust.geometry.attributes.position.needsUpdate = true;
            dust.rotation.y += 0.000008;
        }

        // Animate galaxy cores
        if (scene.userData.cores) {
            scene.userData.cores.forEach((core, i) => {
                if (core.isPoints) {
                    core.rotation.y += 0.00002 * (i + 1);
                    core.material.opacity = 0.1 + Math.sin(time * 0.5 + i) * 0.05;
                } else {
                    core.scale.setScalar(20 + Math.sin(time * 0.3 + i) * 2);
                    core.material.opacity = 0.03 + Math.sin(time * 0.4 + i) * 0.02;
                }
            });
        }

        // Subtle camera breathing
        camera.position.z = 100 + Math.sin(time * 0.1) * 2;

        // Smooth intensity/opacity transitions
        const lerpSpeed = 0.05;
        
        // Global intensity
        window.HAZOOM_UNIVERSE.currentIntensity += (window.HAZOOM_UNIVERSE.targetIntensity - window.HAZOOM_UNIVERSE.currentIntensity) * lerpSpeed;
        const intensity = window.HAZOOM_UNIVERSE.currentIntensity;
        
        // Nebula opacity
        if (window.HAZOOM_UNIVERSE.targetNebulaOpacity !== undefined) {
            targetNebulaOpacity = window.HAZOOM_UNIVERSE.targetNebulaOpacity;
        }
        currentNebulaOpacity += (targetNebulaOpacity - currentNebulaOpacity) * lerpSpeed;
        
        // Star opacity
        if (window.HAZOOM_UNIVERSE.targetStarOpacity !== undefined) {
            targetStarOpacity = window.HAZOOM_UNIVERSE.targetStarOpacity;
        }
        currentStarOpacity += (targetStarOpacity - currentStarOpacity) * lerpSpeed;
        
        // Dust opacity
        if (window.HAZOOM_UNIVERSE.targetDustOpacity !== undefined) {
            targetDustOpacity = window.HAZOOM_UNIVERSE.targetDustOpacity;
        }
        currentDustOpacity += (targetDustOpacity - currentDustOpacity) * lerpSpeed;

        // Apply to materials
        if (nebula) nebula.material.opacity = currentNebulaOpacity * intensity;
        if (stars) stars.forEach(s => s.material.opacity = currentStarOpacity * intensity);
        if (dust) dust.material.opacity = currentDustOpacity * intensity;
        if (scene.userData.cores) {
            scene.userData.cores.forEach((core, i) => {
                if (core.isPoints) {
                    core.material.opacity = (0.1 + Math.sin(time * 0.5 + i) * 0.05) * intensity;
                } else {
                    core.material.opacity = (0.03 + Math.sin(time * 0.4 + i) * 0.02) * intensity;
                }
            });
        }

        renderer.render(scene, camera);
    }

    // Auto-initialize when Three.js is loaded
    function waitForThree() {
        if (typeof THREE !== 'undefined') {
            initUniverse();
        } else {
            setTimeout(waitForThree, 100);
        }
    }

    // Expose API
    window.HAZOOM_UNIVERSE = {
        init: initUniverse,
        destroy: () => {
            if (animationId) cancelAnimationFrame(animationId);
            document.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', onResize);
            if (renderer) renderer.dispose();
            isInitialized = false;
        },
        setIntensity: (value) => {
            if (stars) stars.forEach(s => s.material.opacity *= value);
            if (nebula) nebula.material.opacity *= value;
            if (dust) dust.material.opacity *= value;
        },
        // Mood/preset configurations
        presets: {
            calm: { 
                nebula: [0x00e8ff, 0x00b8d4, 0x4fc3f7], 
                stars: [0xe6f0ff, 0xffffff, 0xb3e5fc],
                bg: { r: 0.01, g: 0.02, b: 0.05 },
                nebulaOpacity: 0.8,
                starOpacity: 0.7,
                dustOpacity: 0.5
            },
            creative: { 
                nebula: [0x8b5cf6, 0xec4899, 0xa855f7], 
                stars: [0xf3e8ff, 0xffe6f0, 0xe9d5ff],
                bg: { r: 0.05, g: 0.01, b: 0.05 },
                nebulaOpacity: 1.0,
                starOpacity: 0.8,
                dustOpacity: 0.6
            },
            energetic: { 
                nebula: [0xffc940, 0xef4444, 0xf97316], 
                stars: [0xfff4e6, 0xffe6e6, 0xffedd5],
                bg: { r: 0.05, g: 0.02, b: 0.01 },
                nebulaOpacity: 1.2,
                starOpacity: 0.9,
                dustOpacity: 0.7
            },
            focused: { 
                nebula: [0x00e8ff, 0x8b5cf6, 0x00e676], 
                stars: [0xe6f0ff, 0xf0e6ff, 0xe6ffe6],
                bg: { r: 0.01, g: 0.01, b: 0.03 },
                nebulaOpacity: 0.7,
                starOpacity: 0.6,
                dustOpacity: 0.4
            },
            night: { 
                nebula: [0x1e1e3f, 0x312e81, 0x1e3a5f], 
                stars: [0x6b6b8f, 0x4b4b6f, 0x3b3b5f],
                bg: { r: 0.005, g: 0.005, b: 0.02 },
                nebulaOpacity: 0.5,
                starOpacity: 0.4,
                dustOpacity: 0.3
            },
            golden: { 
                nebula: [0xffc940, 0xf59e0b, 0xfbbf24], 
                stars: [0xfff4e6, 0xffebc8, 0xfef3c7],
                bg: { r: 0.04, g: 0.03, b: 0.01 },
                nebulaOpacity: 0.9,
                starOpacity: 0.8,
                dustOpacity: 0.6
            },
            'deep-space': { 
                nebula: [0x0d1b2a, 0x1b263b, 0x415a77], 
                stars: [0x778da9, 0x90e0ef, 0xcaf0f8],
                bg: { r: 0.002, g: 0.005, b: 0.015 },
                nebulaOpacity: 0.3,
                starOpacity: 1.0,
                dustOpacity: 0.2
            },
            'nebula-rich': { 
                nebula: [0x00e8ff, 0x8b5cf6, 0xffc940, 0x00e676, 0xff3d71], 
                stars: [0xe6f0ff, 0xf0e6ff, 0xfff4e6, 0xe6ffe6, 0xffe6e6],
                bg: { r: 0.02, g: 0.01, b: 0.03 },
                nebulaOpacity: 1.5,
                starOpacity: 0.8,
                dustOpacity: 0.8
            },
            minimal: { 
                nebula: [0x1a1a2e, 0x16213e, 0x0f3460], 
                stars: [0x4a4a6a, 0x5a5a7a, 0x6a6a8a],
                bg: { r: 0.008, g: 0.008, b: 0.015 },
                nebulaOpacity: 0.2,
                starOpacity: 0.3,
                dustOpacity: 0.1
            }
        },

        currentPreset: 'focused',
        moodSyncEnabled: true,
        targetIntensity: 0.7,
        currentIntensity: 0.7,

        setPreset: (preset) => {
            const p = window.HAZOOM_UNIVERSE.presets[preset];
            if (!p) return;
            window.HAZOOM_UNIVERSE.currentPreset = preset;
            window.HAZOOM_UNIVERSE.applyPreset(p);
            const select = document.getElementById('universe-preset');
            if (select) select.value = preset;
        },

        applyPreset: (p) => {
            const transitionSpeed = 0.02;
            
            // Nebula colors
            if (nebula && nebula.geometry.attributes.color) {
                const colors = nebula.geometry.attributes.color.array;
                const colorCount = p.nebula.length;
                for (let i = 0; i < colors.length / 3; i++) {
                    const targetColor = new THREE.Color(p.nebula[i % colorCount]);
                    const currentColor = new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
                    currentColor.lerp(targetColor, transitionSpeed);
                    colors[i * 3] = currentColor.r;
                    colors[i * 3 + 1] = currentColor.g;
                    colors[i * 3 + 2] = currentColor.b;
                }
                nebula.geometry.attributes.color.needsUpdate = true;
            }
            
            // Star colors
            if (stars) {
                stars.forEach(starLayer => {
                    if (starLayer.geometry.attributes.color) {
                        const colors = starLayer.geometry.attributes.color.array;
                        const colorCount = p.stars.length;
                        for (let i = 0; i < colors.length / 3; i++) {
                            const targetColor = new THREE.Color(p.stars[i % colorCount]);
                            const currentColor = new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
                            currentColor.lerp(targetColor, transitionSpeed * 0.5);
                            colors[i * 3] = currentColor.r;
                            colors[i * 3 + 1] = currentColor.g;
                            colors[i * 3 + 2] = currentColor.b;
                        }
                        starLayer.geometry.attributes.color.needsUpdate = true;
                    }
                });
            }
            
            // Fog
            if (scene && scene.fog) {
                const fogColor = new THREE.Color();
                fogColor.setRGB(p.bg.r, p.bg.g, p.bg.b);
                scene.fog.color.lerp(fogColor, transitionSpeed);
            }
            
            // Target opacities (animated in render loop)
            window.HAZOOM_UNIVERSE.targetNebulaOpacity = p.nebulaOpacity;
            window.HAZOOM_UNIVERSE.targetStarOpacity = p.starOpacity;
            window.HAZOOM_UNIVERSE.targetDustOpacity = p.dustOpacity;
        },

        setIntensity: (value) => {
            window.HAZOOM_UNIVERSE.targetIntensity = Math.max(0, Math.min(1, value));
            window.HAZOOM_UNIVERSE.currentIntensity = window.HAZOOM_UNIVERSE.targetIntensity;
            const slider = document.getElementById('universe-intensity');
            if (slider) slider.value = Math.round(value * 100);
        },

        setMood: (mood) => {
            if (!window.HAZOOM_UNIVERSE.moodSyncEnabled) return;
            const moodToPreset = {
                calm: 'calm',
                creative: 'creative',
                energetic: 'energetic',
                focused: 'focused',
                night: 'night',
                golden: 'golden'
            };
            const preset = moodToPreset[mood] || 'focused';
            window.HAZOOM_UNIVERSE.setPreset(preset);
        },

        setMoodSync: (enabled) => {
            window.HAZOOM_UNIVERSE.moodSyncEnabled = enabled;
        }
    };

    // Load Three.js if not present
    if (typeof THREE === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
        script.onload = waitForThree;
        script.onerror = () => {
            console.error('[Universe] Failed to load Three.js');
            // Fallback: create simple CSS-based background
            createFallbackBackground();
        };
        document.head.appendChild(script);
    } else {
        waitForThree();
    }

    function createFallbackBackground() {
        // Simple CSS-based animated background as fallback
        const canvas = document.getElementById('desktop-canvas');
        if (canvas) {
            canvas.style.display = 'none';
        }
        const desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.style.background = `
                radial-gradient(ellipse 800px 600px at 15% 50%, rgba(0, 232, 255, 0.04) 0%, transparent 100%),
                radial-gradient(ellipse 600px 800px at 85% 20%, rgba(139, 92, 246, 0.035) 0%, transparent 100%),
                radial-gradient(ellipse 700px 500px at 50% 90%, rgba(255, 201, 64, 0.025) 0%, transparent 100%),
                #030308
            `;
        }
    }
})();