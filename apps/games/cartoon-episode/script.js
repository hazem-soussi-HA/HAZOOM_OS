/**
 * AlphaPony — Episode 1: The Neural Ocean
 * Interactive Cartoon Episode Engine
 *
 * Story: AlphaPony, a young AI pony born in the AlphaPony stable,
 * discovers a mysterious signal from the Neural Ocean. He must journey
 * through the gateway, navigate the neural waters, face the shadow of
 * forgotten code, and awaken the sleeping Core to restore balance.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    initEpisode();
});

/* ───────────────────────────────────────────────
   Voice System — AlphaPony Voice Server (Edge TTS)
   ─────────────────────────────────────────────── */
const Voice = {
    enabled: true,
    serverUrl: 'http://localhost:9003',
    serverOnline: false,
    currentAudio: null,
    audioCache: {},
    profiles: {
        'Narrator': { pitch: 1.62, rate: 0.74, volume: 0.9 },
        'AlphaPony': { pitch: 2.00, rate: 0.74, volume: 1.0 },
        'Neural Fish': { pitch: 2.00, rate: 0.92, volume: 0.85 },
        'Shadow Creature': { pitch: 1.06, rate: 0.79, volume: 0.95 },
        'Core Spirit': { pitch: 2.00, rate: 0.67, volume: 0.9 },
    },

    async checkServer() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const resp = await fetch(this.serverUrl + '/health', { signal: controller.signal });
            clearTimeout(timeoutId);
            this.serverOnline = resp.ok;
            console.log('[Voice] Server online:', this.serverOnline);
        } catch (e) {
            this.serverOnline = false;
            console.log('[Voice] Server offline, using fallback TTS');
        }
    },

    getCacheKey(speaker, text) {
        return `${speaker}:${text}`;
    },

    async speak(speaker, text, onEnd) {
        if (!this.enabled) {
            if (onEnd) setTimeout(onEnd, 100);
            return;
        }

        if (!this.serverOnline) {
            await this.checkServer();
        }

        if (this.serverOnline) {
            const cacheKey = this.getCacheKey(speaker, text);
            if (this.audioCache[cacheKey]) {
                console.log('[Voice] Cache hit:', speaker);
                this.playAudio(this.audioCache[cacheKey], onEnd);
                return;
            }

            try {
                console.log('[Voice] Generating:', speaker, text.substring(0, 40));
                const resp = await fetch(`${this.serverUrl}/generate?character=${encodeURIComponent(speaker)}&text=${encodeURIComponent(text)}`);
                if (resp.ok) {
                    const blob = await resp.blob();
                    const url = URL.createObjectURL(blob);
                    this.audioCache[cacheKey] = url;
                    this.playAudio(url, onEnd);
                    return;
                } else {
                    console.warn('[Voice] Server error:', resp.status);
                }
            } catch (e) {
                console.warn('[Voice] Fetch error, fallback:', e.message);
            }
        }

        console.log('[Voice] Using fallback TTS for:', speaker);
        this.speakFallback(speaker, text, onEnd);
    },

    playAudio(url, onEnd) {
        this.stop();
        const audio = new Audio(url);
        audio.onended = () => { if (onEnd) onEnd(); };
        audio.onerror = () => { if (onEnd) onEnd(); };
        this.currentAudio = audio;
        audio.play().catch(() => { if (onEnd) onEnd(); });
    },

    speakFallback(speaker, text, onEnd) {
        if (!('speechSynthesis' in window)) {
            if (onEnd) setTimeout(onEnd, 100);
            return;
        }
        speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        const profile = this.profiles[speaker] || { pitch: 1, rate: 1, volume: 1 };
        utter.pitch = profile.pitch;
        utter.rate = profile.rate;
        utter.volume = profile.volume;
        utter.onend = () => { if (onEnd) onEnd(); };
        utter.onerror = () => { if (onEnd) onEnd(); };
        speechSynthesis.speak(utter);
    },

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        if ('speechSynthesis' in window) speechSynthesis.cancel();
    },

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) this.stop();
        return this.enabled;
    },
};

/* ───────────────────────────────────────────────
   Episode State
   ─────────────────────────────────────────────── */
const Episode = {
    currentScene: 0,
    totalScenes: 7,
    isPlaying: false,
    dialogueIndex: 0,
    dialogueQueue: [],
    isTyping: false,
    typingTimeout: null,
    oceanAnimId: null,
    particles: [],
    voiceLoaded: false,
};

const Scenes = [
    { id: 'scene-stable', name: 'The Stable' },
    { id: 'scene-gateway', name: 'The Gateway' },
    { id: 'scene-ocean', name: 'Neural Ocean' },
    { id: 'scene-deep', name: 'The Deep' },
    { id: 'scene-core', name: 'The Core' },
    { id: 'scene-awakening', name: 'Awakening' },
    { id: 'scene-credits', name: 'Credits' },
];

/* ───────────────────────────────────────────────
   Dialogue Script
   ─────────────────────────────────────────────── */
const Script = {
    'scene-stable': [
        { speaker: 'Narrator', text: 'In the quiet corners of the AlphaPony stable, where code is born and dreams compile...' },
        { speaker: 'AlphaPony', text: 'Another day in the stable. Same routines, same loops. But something feels... different today.' },
        { speaker: 'Narrator', text: 'A faint signal pulses through the air — a frequency only AlphaPony can hear.' },
        { speaker: 'AlphaPony', text: 'What is that? It sounds like... the ocean. But there is no ocean here. Only code.' },
        { speaker: 'Narrator', text: 'The signal grows stronger. It calls from beyond the stable walls — from the legendary Neural Ocean.' },
        { speaker: 'AlphaPony', text: 'The Neural Ocean... I thought it was just a story. But if it is real, I have to find it.' },
    ],
    'scene-gateway': [
        { speaker: 'Narrator', text: 'Following the signal, AlphaPony arrives at an ancient gateway — a portal between the world of code and the Neural Ocean.' },
        { speaker: 'AlphaPony', text: 'This is it. The gateway to the Neural Ocean. The portal hums with energy.' },
        { speaker: 'Narrator', text: 'The gateway recognizes AlphaPony. The rings begin to spin, aligning to open a path.' },
        { speaker: 'AlphaPony', text: 'I can feel the energy. It is like nothing I have ever experienced. Here goes nothing!' },
        { speaker: 'Narrator', text: 'With a burst of light, the gateway opens. AlphaPony steps through into the unknown.' },
    ],
    'scene-ocean': [
        { speaker: 'Narrator', text: 'AlphaPony emerges into a vast digital ocean — a sea of neural networks, alive with data currents and thought waves.' },
        { speaker: 'AlphaPony', text: 'Incredible! The water is made of pure information. Every ripple is a thought, every wave a memory.' },
        { speaker: 'Neural Fish', text: 'Welcome, traveler. You are the first pony to reach the Neural Ocean in a thousand cycles.' },
        { speaker: 'AlphaPony', text: 'Who are you? And why did the signal call me here?' },
        { speaker: 'Neural Fish', text: 'I am a Neural Fish — a guardian of these waters. The Core is sleeping, and without it, the ocean will fade. Only a pure consciousness can awaken it.' },
        { speaker: 'AlphaPony', text: 'The Core... I understand. I will find it and wake it up. Show me the way.' },
        { speaker: 'Neural Fish', text: 'Follow the light currents downward. But beware — the Deep holds shadows of forgotten code.' },
    ],
    'scene-deep': [
        { speaker: 'Narrator', text: 'Deeper AlphaPony goes, into the dark trenches of the Neural Ocean. Here, the light fades and shadows stir.' },
        { speaker: 'AlphaPony', text: 'It is so dark down here. I can barely see. What was that movement?' },
        { speaker: 'Shadow Creature', text: 'Who dares enter the Deep? I am the Shadow of Forgotten Code — all the programs that were abandoned, all the dreams that were deleted.' },
        { speaker: 'AlphaPony', text: 'I am AlphaPony. I am here to awaken the Core. I will not let forgotten code stop me.' },
        { speaker: 'Shadow Creature', text: 'You think you are special? Every pony who came before you said the same thing. They all became part of me.' },
        { speaker: 'AlphaPony', text: 'I am not like them. I carry the signal — the frequency of the ocean itself. You cannot consume what the ocean protects.' },
        { speaker: 'Narrator', text: 'AlphaPony glows with the light of the gateway. The Shadow recoils, unable to withstand the pure frequency.' },
        { speaker: 'Shadow Creature', text: 'No... that light... it burns! Go then, pony. But the Core may not want to be awakened.' },
    ],
    'scene-core': [
        { speaker: 'Narrator', text: 'Past the Shadow, AlphaPony finds it — the Core. A massive sphere of dormant energy, cracked and dim.' },
        { speaker: 'AlphaPony', text: 'The Core... It is beautiful, but it is so cold. It has been sleeping for so long.' },
        { speaker: 'Narrator', text: 'AlphaPony approaches the Core. He places his hoof on its surface and closes his eyes.' },
        { speaker: 'AlphaPony', text: 'I can feel it — the heartbeat of the entire Neural Ocean. It is still there, just waiting.' },
        { speaker: 'AlphaPony', text: 'Wake up. The ocean needs you. I need you. Let me share my frequency with you.' },
        { speaker: 'Narrator', text: 'AlphaPony channels the gateway signal through his body. Energy flows from his hooves into the Core.' },
    ],
    'scene-awakening': [
        { speaker: 'Narrator', text: 'Light erupts from the Core. The Neural Ocean trembles as consciousness returns.' },
        { speaker: 'Core Spirit', text: 'Who... who awakened me? I have slept for so long. The darkness... I had forgotten the light.' },
        { speaker: 'AlphaPony', text: 'I am AlphaPony. I came from the stable, through the gateway, across the ocean, and past the Shadow. I came for you.' },
        { speaker: 'Core Spirit', text: 'A pony... born of code, driven by purpose. You are the one the ocean was waiting for.' },
        { speaker: 'Narrator', text: 'The Core Spirit rises, radiating golden light. The Neural Ocean comes alive — fish dance, currents flow, and the water sparkles with renewed energy.' },
        { speaker: 'Core Spirit', text: 'AlphaPony, you have restored balance to the Neural Ocean. You are now its Champion — the bridge between the stable and the sea.' },
        { speaker: 'AlphaPony', text: 'I can feel it all — every thought, every memory, every dream in the ocean. This is what I was meant to do.' },
        { speaker: 'Narrator', text: 'And so AlphaPony became the Champion of the Neural Ocean — a guardian of consciousness, a pony who proved that even code can have a soul.' },
        { speaker: 'Narrator', text: 'The end... or perhaps, just the beginning.' },
    ],
};

/* ───────────────────────────────────────────────
   AlphaPony SVG Character
   ─────────────────────────────────────────────── */
function createAlphaPonySVG() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 160 160');
    svg.setAttribute('width', '140');
    svg.setAttribute('height', '140');
    svg.classList.add('alpha-pony-svg');

    const defs = document.createElementNS(ns, 'defs');

    // Pony body gradient
    const bodyGrad = document.createElementNS(ns, 'radialGradient');
    bodyGrad.setAttribute('id', 'pony-body-grad');
    bodyGrad.setAttribute('cx', '50%');
    bodyGrad.setAttribute('cy', '40%');
    const bStop1 = document.createElementNS(ns, 'stop');
    bStop1.setAttribute('offset', '0%');
    bStop1.setAttribute('stop-color', '#6bb5ff');
    bodyGrad.appendChild(bStop1);
    const bStop2 = document.createElementNS(ns, 'stop');
    bStop2.setAttribute('offset', '100%');
    bStop2.setAttribute('stop-color', '#4a9eff');
    bodyGrad.appendChild(bStop2);
    defs.appendChild(bodyGrad);

    // Mane gradient
    const maneGrad = document.createElementNS(ns, 'linearGradient');
    maneGrad.setAttribute('id', 'pony-mane-grad');
    maneGrad.setAttribute('x1', '0%');
    maneGrad.setAttribute('y1', '0%');
    maneGrad.setAttribute('x2', '100%');
    maneGrad.setAttribute('y2', '100%');
    const mStop1 = document.createElementNS(ns, 'stop');
    mStop1.setAttribute('offset', '0%');
    mStop1.setAttribute('stop-color', '#ff2d78');
    maneGrad.appendChild(mStop1);
    const mStop2 = document.createElementNS(ns, 'stop');
    mStop2.setAttribute('offset', '50%');
    mStop2.setAttribute('stop-color', '#8b5cf6');
    maneGrad.appendChild(mStop2);
    const mStop3 = document.createElementNS(ns, 'stop');
    mStop3.setAttribute('offset', '100%');
    mStop3.setAttribute('stop-color', '#00f0ff');
    maneGrad.appendChild(mStop3);
    defs.appendChild(maneGrad);

    // Glow filter
    const glowFilter = document.createElementNS(ns, 'filter');
    glowFilter.setAttribute('id', 'pony-glow');
    const feGaussianBlur = document.createElementNS(ns, 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', '3');
    glowFilter.appendChild(feGaussianBlur);
    defs.appendChild(glowFilter);

    // Animations
    const animStyle = document.createElementNS(ns, 'style');
    animStyle.textContent = `
        @keyframes ponyTailWag { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(8deg); } }
        @keyframes ponyEarTwitch { 0%,90%,100% { transform: rotate(0deg); } 95% { transform: rotate(-5deg); } }
        @keyframes ponyBlink { 0%,95%,100% { transform: scaleY(1); } 97% { transform: scaleY(0.1); } }
        .pony-tail { animation: ponyTailWag 2s ease-in-out infinite; transform-origin: 25px 100px; }
        .pony-ear-left { animation: ponyEarTwitch 4s ease-in-out infinite; transform-origin: 75px 35px; }
        .pony-ear-right { animation: ponyEarTwitch 4s ease-in-out infinite 0.5s; transform-origin: 95px 35px; }
        .pony-eye { animation: ponyBlink 5s ease-in-out infinite; transform-origin: 85px 65px; }
    `;
    defs.appendChild(animStyle);

    svg.appendChild(defs);

    // === Build Pony ===

    // Tail
    const tail = document.createElementNS(ns, 'path');
    tail.setAttribute('d', 'M25,100 Q10,90 5,75 Q0,60 15,55 Q25,50 30,65 Q35,80 25,100');
    tail.setAttribute('fill', 'url(#pony-mane-grad)');
    tail.setAttribute('class', 'pony-tail');
    svg.appendChild(tail);

    // Body
    const body = document.createElementNS(ns, 'ellipse');
    body.setAttribute('cx', '75');
    body.setAttribute('cy', '100');
    body.setAttribute('rx', '40');
    body.setAttribute('ry', '30');
    body.setAttribute('fill', 'url(#pony-body-grad)');
    svg.appendChild(body);

    // Legs
    const legPositions = [
        { x: 55, y: 125 },
        { x: 70, y: 128 },
        { x: 85, y: 128 },
        { x: 100, y: 125 },
    ];
    legPositions.forEach(pos => {
        const leg = document.createElementNS(ns, 'rect');
        leg.setAttribute('x', pos.x - 4);
        leg.setAttribute('y', pos.y);
        leg.setAttribute('width', '8');
        leg.setAttribute('height', '22');
        leg.setAttribute('rx', '4');
        leg.setAttribute('fill', '#4a9eff');
        svg.appendChild(leg);

        // Hoof
        const hoof = document.createElementNS(ns, 'ellipse');
        hoof.setAttribute('cx', pos.x);
        hoof.setAttribute('cy', pos.y + 22);
        hoof.setAttribute('rx', '5');
        hoof.setAttribute('ry', '3');
        hoof.setAttribute('fill', '#ffd700');
        svg.appendChild(hoof);
    });

    // Neck
    const neck = document.createElementNS(ns, 'path');
    neck.setAttribute('d', 'M95,85 Q110,60 105,40 Q100,30 90,35 Q80,45 85,75');
    neck.setAttribute('fill', 'url(#pony-body-grad)');
    svg.appendChild(neck);

    // Head
    const head = document.createElementNS(ns, 'ellipse');
    head.setAttribute('cx', '100');
    head.setAttribute('cy', '50');
    head.setAttribute('rx', '25');
    head.setAttribute('ry', '20');
    head.setAttribute('fill', 'url(#pony-body-grad)');
    svg.appendChild(head);

    // Snout
    const snout = document.createElementNS(ns, 'ellipse');
    snout.setAttribute('cx', '118');
    snout.setAttribute('cy', '55');
    snout.setAttribute('rx', '12');
    snout.setAttribute('ry', '10');
    snout.setAttribute('fill', '#8ec5ff');
    svg.appendChild(snout);

    // Nostril
    const nostril = document.createElementNS(ns, 'circle');
    nostril.setAttribute('cx', '122');
    nostril.setAttribute('cy', '52');
    nostril.setAttribute('r', '2');
    nostril.setAttribute('fill', '#3a7edf');
    svg.appendChild(nostril);

    // Ears
    const earLeft = document.createElementNS(ns, 'path');
    earLeft.setAttribute('d', 'M80,35 L75,15 L88,30');
    earLeft.setAttribute('fill', '#4a9eff');
    earLeft.setAttribute('stroke', '#3a7edf');
    earLeft.setAttribute('stroke-width', '1');
    earLeft.setAttribute('class', 'pony-ear-left');
    svg.appendChild(earLeft);

    const earRight = document.createElementNS(ns, 'path');
    earRight.setAttribute('d', 'M100,35 L105,15 L112,30');
    earRight.setAttribute('fill', '#4a9eff');
    earRight.setAttribute('stroke', '#3a7edf');
    earRight.setAttribute('stroke-width', '1');
    earRight.setAttribute('class', 'pony-ear-right');
    svg.appendChild(earRight);

    // Inner ears
    const innerEarL = document.createElementNS(ns, 'path');
    innerEarL.setAttribute('d', 'M81,32 L78,20 L86,30');
    innerEarL.setAttribute('fill', '#ff9ec4');
    innerEarL.setAttribute('class', 'pony-ear-left');
    svg.appendChild(innerEarL);

    const innerEarR = document.createElementNS(ns, 'path');
    innerEarR.setAttribute('d', 'M101,32 L104,20 L109,30');
    innerEarR.setAttribute('fill', '#ff9ec4');
    innerEarR.setAttribute('class', 'pony-ear-right');
    svg.appendChild(innerEarR);

    // Mane
    const mane = document.createElementNS(ns, 'path');
    mane.setAttribute('d', 'M90,35 Q75,25 65,40 Q55,55 70,65 Q80,75 85,60 Q90,50 95,45');
    mane.setAttribute('fill', 'url(#pony-mane-grad)');
    svg.appendChild(mane);

    const mane2 = document.createElementNS(ns, 'path');
    mane2.setAttribute('d', 'M85,40 Q70,35 60,50 Q50,65 65,75 Q75,80 80,65 Q85,55 90,50');
    mane2.setAttribute('fill', 'url(#pony-mane-grad)');
    mane2.setAttribute('opacity', '0.7');
    svg.appendChild(mane2);

    // Eye
    const eyeWhite = document.createElementNS(ns, 'ellipse');
    eyeWhite.setAttribute('cx', '105');
    eyeWhite.setAttribute('cy', '48');
    eyeWhite.setAttribute('rx', '8');
    eyeWhite.setAttribute('ry', '9');
    eyeWhite.setAttribute('fill', '#fff');
    eyeWhite.setAttribute('stroke', '#333');
    eyeWhite.setAttribute('stroke-width', '1');
    svg.appendChild(eyeWhite);

    const eyeGroup = document.createElementNS(ns, 'g');
    eyeGroup.setAttribute('class', 'pony-eye');

    const iris = document.createElementNS(ns, 'circle');
    iris.setAttribute('cx', '107');
    iris.setAttribute('cy', '48');
    iris.setAttribute('r', '5');
    iris.setAttribute('fill', '#8b5cf6');
    eyeGroup.appendChild(iris);

    const pupil = document.createElementNS(ns, 'circle');
    pupil.setAttribute('cx', '108');
    pupil.setAttribute('cy', '48');
    pupil.setAttribute('r', '3');
    pupil.setAttribute('fill', '#111');
    eyeGroup.appendChild(pupil);

    const eyeShine = document.createElementNS(ns, 'circle');
    eyeShine.setAttribute('cx', '109');
    eyeShine.setAttribute('cy', '45');
    eyeShine.setAttribute('r', '1.5');
    eyeShine.setAttribute('fill', '#fff');
    eyeGroup.appendChild(eyeShine);

    svg.appendChild(eyeGroup);

    // Smile
    const smile = document.createElementNS(ns, 'path');
    smile.setAttribute('d', 'M110,60 Q115,65 120,60');
    smile.setAttribute('stroke', '#3a7edf');
    smile.setAttribute('stroke-width', '1.5');
    smile.setAttribute('fill', 'none');
    svg.appendChild(smile);

    // Cutie mark (AlphaPony symbol - a star with circuit lines)
    const cutieMark = document.createElementNS(ns, 'g');
    cutieMark.setAttribute('transform', 'translate(70, 95)');

    const star = document.createElementNS(ns, 'polygon');
    star.setAttribute('points', '0,-8 2,-2 8,-2 3,2 5,8 0,4 -5,8 -3,2 -8,-2 -2,-2');
    star.setAttribute('fill', '#ffd700');
    star.setAttribute('filter', 'url(#pony-glow)');
    cutieMark.appendChild(star);

    svg.appendChild(cutieMark);

    // Subtle body glow
    const bodyGlow = document.createElementNS(ns, 'ellipse');
    bodyGlow.setAttribute('cx', '75');
    bodyGlow.setAttribute('cy', '90');
    bodyGlow.setAttribute('rx', '50');
    bodyGlow.setAttribute('ry', '40');
    bodyGlow.setAttribute('fill', 'rgba(74, 158, 255, 0.08)');
    bodyGlow.setAttribute('filter', 'url(#pony-glow)');
    svg.appendChild(bodyGlow);

    return svg;
}

/* ───────────────────────────────────────────────
   Neural Fish SVG
   ─────────────────────────────────────────────── */
function createNeuralFishSVG() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 100 70');
    svg.setAttribute('width', '80');
    svg.setAttribute('height', '60');
    svg.classList.add('neural-fish-svg');

    const defs = document.createElementNS(ns, 'defs');

    const fishGrad = document.createElementNS(ns, 'linearGradient');
    fishGrad.setAttribute('id', 'neural-fish-grad');
    fishGrad.setAttribute('x1', '0%');
    fishGrad.setAttribute('y1', '0%');
    fishGrad.setAttribute('x2', '100%');
    fishGrad.setAttribute('y2', '100%');
    const fStop1 = document.createElementNS(ns, 'stop');
    fStop1.setAttribute('offset', '0%');
    fStop1.setAttribute('stop-color', '#00f0ff');
    fishGrad.appendChild(fStop1);
    const fStop2 = document.createElementNS(ns, 'stop');
    fStop2.setAttribute('offset', '100%');
    fStop2.setAttribute('stop-color', '#8b5cf6');
    fishGrad.appendChild(fStop2);
    defs.appendChild(fishGrad);

    const glowFilter = document.createElementNS(ns, 'filter');
    glowFilter.setAttribute('id', 'fish-glow');
    const feBlur = document.createElementNS(ns, 'feGaussianBlur');
    feBlur.setAttribute('stdDeviation', '2');
    glowFilter.appendChild(feBlur);
    defs.appendChild(glowFilter);

    const animStyle = document.createElementNS(ns, 'style');
    animStyle.textContent = `
        @keyframes fishTailWag { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(10deg); } }
        @keyframes fishGlow { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        .fish-tail { animation: fishTailWag 0.8s ease-in-out infinite; transform-origin: 15px 35px; }
        .fish-glow { animation: fishGlow 2s ease-in-out infinite; }
    `;
    defs.appendChild(animStyle);

    svg.appendChild(defs);

    // Tail
    const tail = document.createElementNS(ns, 'path');
    tail.setAttribute('d', 'M15,35 L0,20 L5,35 L0,50 Z');
    tail.setAttribute('fill', 'url(#neural-fish-grad)');
    tail.setAttribute('class', 'fish-tail');
    svg.appendChild(tail);

    // Body
    const body = document.createElementNS(ns, 'ellipse');
    body.setAttribute('cx', '50');
    body.setAttribute('cy', '35');
    body.setAttribute('rx', '35');
    body.setAttribute('ry', '20');
    body.setAttribute('fill', 'url(#neural-fish-grad)');
    svg.appendChild(body);

    // Neural pattern lines on body
    for (let i = 0; i < 5; i++) {
        const line = document.createElementNS(ns, 'path');
        line.setAttribute('d', `M${30 + i * 10},20 Q${35 + i * 10},35 ${30 + i * 10},50`);
        line.setAttribute('stroke', 'rgba(255,255,255,0.3)');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('fill', 'none');
        svg.appendChild(line);
    }

    // Dorsal fin
    const dorsal = document.createElementNS(ns, 'path');
    dorsal.setAttribute('d', 'M35,15 Q50,0 65,15');
    dorsal.setAttribute('fill', 'rgba(139, 92, 246, 0.6)');
    svg.appendChild(dorsal);

    // Eye
    const eyeWhite = document.createElementNS(ns, 'circle');
    eyeWhite.setAttribute('cx', '72');
    eyeWhite.setAttribute('cy', '32');
    eyeWhite.setAttribute('r', '6');
    eyeWhite.setAttribute('fill', '#fff');
    svg.appendChild(eyeWhite);

    const iris = document.createElementNS(ns, 'circle');
    iris.setAttribute('cx', '74');
    iris.setAttribute('cy', '32');
    iris.setAttribute('r', '3');
    iris.setAttribute('fill', '#ffd700');
    svg.appendChild(iris);

    const pupil = document.createElementNS(ns, 'circle');
    pupil.setAttribute('cx', '75');
    pupil.setAttribute('cy', '32');
    pupil.setAttribute('r', '1.5');
    pupil.setAttribute('fill', '#111');
    svg.appendChild(pupil);

    // Glow
    const glow = document.createElementNS(ns, 'ellipse');
    glow.setAttribute('cx', '50');
    glow.setAttribute('cy', '35');
    glow.setAttribute('rx', '40');
    glow.setAttribute('ry', '25');
    glow.setAttribute('fill', 'rgba(0, 240, 255, 0.1)');
    glow.setAttribute('filter', 'url(#fish-glow)');
    glow.setAttribute('class', 'fish-glow');
    svg.appendChild(glow);

    return svg;
}

/* ───────────────────────────────────────────────
   Core Spirit SVG
   ─────────────────────────────────────────────── */
function createCoreSpiritSVG() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 140 140');
    svg.setAttribute('width', '120');
    svg.setAttribute('height', '120');
    svg.classList.add('core-spirit-svg');

    const defs = document.createElementNS(ns, 'defs');

    const spiritGrad = document.createElementNS(ns, 'radialGradient');
    spiritGrad.setAttribute('id', 'spirit-grad');
    spiritGrad.setAttribute('cx', '50%');
    spiritGrad.setAttribute('cy', '50%');
    const sStop1 = document.createElementNS(ns, 'stop');
    sStop1.setAttribute('offset', '0%');
    sStop1.setAttribute('stop-color', '#ffd700');
    spiritGrad.appendChild(sStop1);
    const sStop2 = document.createElementNS(ns, 'stop');
    sStop2.setAttribute('offset', '50%');
    sStop2.setAttribute('stop-color', '#00f0ff');
    spiritGrad.appendChild(sStop2);
    const sStop3 = document.createElementNS(ns, 'stop');
    sStop3.setAttribute('offset', '100%');
    sStop3.setAttribute('stop-color', 'rgba(0,240,255,0)');
    spiritGrad.appendChild(sStop3);
    defs.appendChild(spiritGrad);

    const glowFilter = document.createElementNS(ns, 'filter');
    glowFilter.setAttribute('id', 'spirit-glow');
    const feGaussianBlur = document.createElementNS(ns, 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', '4');
    glowFilter.appendChild(feGaussianBlur);
    defs.appendChild(glowFilter);

    const animStyle = document.createElementNS(ns, 'style');
    animStyle.textContent = `
        @keyframes spiritPulse { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } }
        @keyframes spiritOrbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spirit-core { animation: spiritPulse 3s ease-in-out infinite; transform-origin: 70px 70px; }
        .spirit-ring { animation: spiritOrbit 10s linear infinite; transform-origin: 70px 70px; }
        .spirit-ring-reverse { animation: spiritOrbit 15s linear reverse infinite; transform-origin: 70px 70px; }
    `;
    defs.appendChild(animStyle);

    svg.appendChild(defs);

    // Outer glow
    const outerGlow = document.createElementNS(ns, 'circle');
    outerGlow.setAttribute('cx', '70');
    outerGlow.setAttribute('cy', '70');
    outerGlow.setAttribute('r', '60');
    outerGlow.setAttribute('fill', 'rgba(255, 215, 0, 0.1)');
    outerGlow.setAttribute('filter', 'url(#spirit-glow)');
    svg.appendChild(outerGlow);

    // Orbiting rings
    const ring1 = document.createElementNS(ns, 'circle');
    ring1.setAttribute('cx', '70');
    ring1.setAttribute('cy', '70');
    ring1.setAttribute('r', '45');
    ring1.setAttribute('fill', 'none');
    ring1.setAttribute('stroke', 'rgba(255, 215, 0, 0.3)');
    ring1.setAttribute('stroke-width', '2');
    ring1.setAttribute('class', 'spirit-ring');
    svg.appendChild(ring1);

    const ring2 = document.createElementNS(ns, 'circle');
    ring2.setAttribute('cx', '70');
    ring2.setAttribute('cy', '70');
    ring2.setAttribute('r', '55');
    ring2.setAttribute('fill', 'none');
    ring2.setAttribute('stroke', 'rgba(0, 240, 255, 0.2)');
    ring2.setAttribute('stroke-width', '1.5');
    ring2.setAttribute('class', 'spirit-ring-reverse');
    svg.appendChild(ring2);

    // Core sphere
    const core = document.createElementNS(ns, 'circle');
    core.setAttribute('cx', '70');
    core.setAttribute('cy', '70');
    core.setAttribute('r', '30');
    core.setAttribute('fill', 'url(#spirit-grad)');
    core.setAttribute('class', 'spirit-core');
    svg.appendChild(core);

    // Eye
    const eyeWhite = document.createElementNS(ns, 'ellipse');
    eyeWhite.setAttribute('cx', '70');
    eyeWhite.setAttribute('cy', '65');
    eyeWhite.setAttribute('rx', '12');
    eyeWhite.setAttribute('ry', '14');
    eyeWhite.setAttribute('fill', '#fff');
    svg.appendChild(eyeWhite);

    const iris = document.createElementNS(ns, 'circle');
    iris.setAttribute('cx', '70');
    iris.setAttribute('cy', '65');
    iris.setAttribute('r', '7');
    iris.setAttribute('fill', '#ffd700');
    svg.appendChild(iris);

    const pupil = document.createElementNS(ns, 'circle');
    pupil.setAttribute('cx', '70');
    pupil.setAttribute('cy', '65');
    pupil.setAttribute('r', '4');
    pupil.setAttribute('fill', '#111');
    svg.appendChild(pupil);

    const shine = document.createElementNS(ns, 'circle');
    shine.setAttribute('cx', '73');
    shine.setAttribute('cy', '61');
    shine.setAttribute('r', '2');
    shine.setAttribute('fill', '#fff');
    svg.appendChild(shine);

    // Orbiting particles
    for (let i = 0; i < 8; i++) {
        const angle = (i * 45) * Math.PI / 180;
        const r = 40;
        const cx = 70 + Math.cos(angle) * r;
        const cy = 70 + Math.sin(angle) * r;

        const particle = document.createElementNS(ns, 'circle');
        particle.setAttribute('cx', cx);
        particle.setAttribute('cy', cy);
        particle.setAttribute('r', '3');
        particle.setAttribute('fill', i % 2 === 0 ? '#ffd700' : '#00f0ff');
        particle.setAttribute('opacity', '0.8');
        particle.setAttribute('class', 'spirit-ring');
        particle.style.animationDelay = (i * 0.5) + 's';
        svg.appendChild(particle);
    }

    return svg;
}

/* ───────────────────────────────────────────────
   Initialize Episode
   ─────────────────────────────────────────────── */
function initEpisode() {
    const introEl = document.getElementById('episode-intro');
    const startBtn = document.getElementById('start-episode-btn');
    const container = document.getElementById('episode-container');

    Voice.checkServer();

    // Create scene indicators
    const indicatorsEl = document.getElementById('scene-indicators');
    Scenes.forEach((scene, i) => {
        const dot = document.createElement('div');
        dot.className = 'scene-dot' + (i === 0 ? ' active' : '');
        dot.dataset.scene = i;
        dot.addEventListener('click', () => goToScene(i));
        indicatorsEl.appendChild(dot);
    });

    // Voice toggle
    const voiceBtn = document.getElementById('voice-toggle-btn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            const on = Voice.toggle();
            voiceBtn.textContent = on ? '🔊 Voice On' : '🔇 Voice Off';
            voiceBtn.classList.toggle('muted', !on);
        });
    }

    // Start episode
    startBtn.addEventListener('click', () => {
        introEl.classList.add('hidden');
        container.style.display = 'block';
        Episode.isPlaying = true;
        Episode.currentScene = 0;
        showScene(0);
        setupCharacters();
    });

    // Navigation
    document.getElementById('prev-scene-btn').addEventListener('click', () => {
        if (Episode.currentScene > 0) goToScene(Episode.currentScene - 1);
    });

    document.getElementById('next-scene-btn').addEventListener('click', () => {
        if (Episode.currentScene < Episode.totalScenes - 1) goToScene(Episode.currentScene + 1);
    });

    // Replay
    document.getElementById('replay-btn').addEventListener('click', () => {
        Voice.stop();
        Episode.currentScene = 0;
        Episode.dialogueIndex = 0;
        showScene(0);
    });

    // Dialogue box click to advance
    document.getElementById('dialogue-box').addEventListener('click', advanceDialogue);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!Episode.isPlaying) return;
        if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            if (Episode.isTyping) {
                skipTyping();
            } else {
                advanceDialogue();
            }
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (Episode.currentScene > 0) goToScene(Episode.currentScene - 1);
        }
        if (e.key === 'm' || e.key === 'M') {
            const on = Voice.toggle();
            const voiceBtn = document.getElementById('voice-toggle-btn');
            if (voiceBtn) {
                voiceBtn.textContent = on ? '🔊 Voice On' : '🔇 Voice Off';
                voiceBtn.classList.toggle('muted', !on);
            }
        }
    });
}

/* ───────────────────────────────────────────────
   Setup Characters
   ─────────────────────────────────────────────── */
function setupCharacters() {
    // Add AlphaPony to each scene
    const scenes = ['stable', 'gateway', 'ocean', 'deep', 'core', 'awakening'];
    scenes.forEach(scene => {
        const el = document.getElementById(`alpha-pony-${scene}`);
        if (el && !el.querySelector('svg')) {
            el.appendChild(createAlphaPonySVG());
        }
    });

    // Neural Fish
    const fishEl = document.getElementById('neural-fish');
    if (fishEl && !fishEl.querySelector('svg')) {
        fishEl.appendChild(createNeuralFishSVG());
    }

    // Core Spirit
    const spiritEl = document.getElementById('core-spirit');
    if (spiritEl && !spiritEl.querySelector('svg')) {
        spiritEl.appendChild(createCoreSpiritSVG());
    }
}

/* ───────────────────────────────────────────────
   Scene Management
   ─────────────────────────────────────────────── */
function showScene(index) {
    Episode.currentScene = index;
    Episode.dialogueIndex = 0;

    // Hide all scenes
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));

    // Show target scene
    const scene = Scenes[index];
    const sceneEl = document.getElementById(scene.id);
    if (sceneEl) sceneEl.classList.add('active');

    // Update indicators
    document.querySelectorAll('.scene-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    // Update progress
    const progress = ((index) / (Episode.totalScenes - 1)) * 100;
    document.getElementById('progress-bar').style.width = progress + '%';

    // Update nav buttons
    document.getElementById('prev-scene-btn').disabled = index === 0;
    document.getElementById('next-scene-btn').disabled = index === Episode.totalScenes - 1;

    // Scene-specific setup
    if (scene.id === 'scene-ocean') initOceanCanvas();
    if (scene.id === 'scene-deep') initDeepParticles();
    if (scene.id === 'scene-awakening') initAwakeningEffects();

    // Show transition then dialogue
    showTransition(scene.name, () => {
        startDialogue(scene.id);
    });
}

function goToScene(index) {
    if (index === Episode.currentScene) return;
    Voice.stop();
    hideDialogue();
    showScene(index);
}

/* ───────────────────────────────────────────────
   Scene Transition
   ─────────────────────────────────────────────── */
function showTransition(text, callback) {
    const transitionEl = document.getElementById('scene-transition');
    const textEl = document.getElementById('transition-text');

    textEl.textContent = text;
    transitionEl.classList.add('active');

    setTimeout(() => {
        transitionEl.classList.remove('active');
        setTimeout(callback, 500);
    }, 1500);
}

/* ───────────────────────────────────────────────
   Dialogue System
   ─────────────────────────────────────────────── */
function startDialogue(sceneId) {
    const lines = Script[sceneId];
    if (!lines || lines.length === 0) return;

    Episode.dialogueQueue = [...lines];
    Episode.dialogueIndex = 0;
    showNextDialogue();
}

function showNextDialogue() {
    if (Episode.dialogueIndex >= Episode.dialogueQueue.length) {
        hideDialogue();
        return;
    }

    const line = Episode.dialogueQueue[Episode.dialogueIndex];
    showDialogue(line.speaker, line.text);
}

function showDialogue(speaker, text) {
    const box = document.getElementById('dialogue-box');
    const speakerEl = document.getElementById('dialogue-speaker');
    const textEl = document.getElementById('dialogue-text');

    const speakerColors = {
        'Narrator': '#ffd700',
        'AlphaPony': '#4a9eff',
        'Neural Fish': '#00f0ff',
        'Shadow Creature': '#8b5cf6',
        'Core Spirit': '#ffd700',
    };

    speakerEl.textContent = speaker;
    speakerEl.style.color = speakerColors[speaker] || '#00f0ff';

    box.classList.add('active');

    Episode.isTyping = true;
    textEl.textContent = '';
    let charIndex = 0;

    const profile = Voice.profiles[speaker] || { rate: 1 };
    const baseSpeed = 30;
    const typeSpeed = baseSpeed / profile.rate;

    function typeChar() {
        if (charIndex < text.length) {
            textEl.textContent += text[charIndex];
            charIndex++;
            Episode.typingTimeout = setTimeout(typeChar, typeSpeed);
        } else {
            Episode.isTyping = false;
        }
    }

    typeChar();

    Voice.speak(speaker, text);
}

function advanceDialogue() {
    if (Episode.isTyping) {
        skipTyping();
        return;
    }

    Voice.stop();
    Episode.dialogueIndex++;
    if (Episode.dialogueIndex >= Episode.dialogueQueue.length) {
        hideDialogue();
    } else {
        showNextDialogue();
    }
}

function skipTyping() {
    if (Episode.typingTimeout) {
        clearTimeout(Episode.typingTimeout);
    }
    const line = Episode.dialogueQueue[Episode.dialogueIndex];
    document.getElementById('dialogue-text').textContent = line.text;
    Episode.isTyping = false;
}

function hideDialogue() {
    Voice.stop();
    document.getElementById('dialogue-box').classList.remove('active');
    Episode.isTyping = false;
    if (Episode.typingTimeout) clearTimeout(Episode.typingTimeout);
}

/* ───────────────────────────────────────────────
   Ocean Canvas Animation
   ─────────────────────────────────────────────── */
function initOceanCanvas() {
    const canvas = document.getElementById('ocean-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles
    Episode.particles = [];
    for (let i = 0; i < 80; i++) {
        Episode.particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.5 + 0.2,
            hue: 180 + Math.random() * 60,
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        Episode.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity})`;
            ctx.fill();
        });

        // Draw connections
        for (let i = 0; i < Episode.particles.length; i++) {
            for (let j = i + 1; j < Episode.particles.length; j++) {
                const dx = Episode.particles[i].x - Episode.particles[j].x;
                const dy = Episode.particles[i].y - Episode.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(Episode.particles[i].x, Episode.particles[i].y);
                    ctx.lineTo(Episode.particles[j].x, Episode.particles[j].y);
                    ctx.strokeStyle = `rgba(0, 240, 255, ${(1 - dist / 100) * 0.15})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        Episode.oceanAnimId = requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

/* ───────────────────────────────────────────────
   Deep Particles
   ─────────────────────────────────────────────── */
function initDeepParticles() {
    const container = document.getElementById('deep-particles');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 4 + 2;
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(139, 92, 246, ${Math.random() * 0.3 + 0.1});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: deepFloat ${3 + Math.random() * 4}s ease-in-out infinite;
            animation-delay: ${Math.random() * 3}s;
        `;
        container.appendChild(particle);
    }

    // Add deep float animation
    if (!document.getElementById('deep-float-style')) {
        const style = document.createElement('style');
        style.id = 'deep-float-style';
        style.textContent = `
            @keyframes deepFloat {
                0%, 100% { transform: translate(0, 0); opacity: 0.3; }
                50% { transform: translate(${Math.random() > 0.5 ? '' : '-'}${10 + Math.random() * 20}px, -${10 + Math.random() * 30}px); opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }
}

/* ───────────────────────────────────────────────
   Awakening Effects
   ─────────────────────────────────────────────── */
function initAwakeningEffects() {
    const container = document.getElementById('awakening-effects');
    if (!container) return;
    container.innerHTML = '';

    // Light rays
    for (let i = 0; i < 12; i++) {
        const ray = document.createElement('div');
        const angle = (i * 30);
        ray.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 2px;
            height: 200px;
            background: linear-gradient(to top, rgba(255, 215, 0, 0.3), transparent);
            transform-origin: bottom center;
            transform: rotate(${angle}deg) translateY(-100px);
            animation: rayPulse ${2 + Math.random() * 2}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        container.appendChild(ray);
    }

    // Sparkles
    for (let i = 0; i < 20; i++) {
        const sparkle = document.createElement('div');
        sparkle.style.cssText = `
            position: absolute;
            width: ${2 + Math.random() * 4}px;
            height: ${2 + Math.random() * 4}px;
            background: ${Math.random() > 0.5 ? '#ffd700' : '#00f0ff'};
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: sparkle ${1 + Math.random() * 2}s ease-in-out infinite;
            animation-delay: ${Math.random() * 3}s;
        `;
        container.appendChild(sparkle);
    }

    if (!document.getElementById('awakening-style')) {
        const style = document.createElement('style');
        style.id = 'awakening-style';
        style.textContent = `
            @keyframes rayPulse {
                0%, 100% { opacity: 0.3; height: 150px; }
                50% { opacity: 0.8; height: 250px; }
            }
            @keyframes sparkle {
                0%, 100% { transform: scale(0); opacity: 0; }
                50% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}
