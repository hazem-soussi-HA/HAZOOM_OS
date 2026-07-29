/**
 * HAZOOM SEROTONIN ENGINE — Audio Core
 * Solf frequencies + Binaural Beats + Ambient Layers
 * Stimulates positive body hormones through frequency
 */

class SerotoninEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.analyser = null;
        this.layers = [];
        this.isPlaying = false;
        this.sessionTimer = null;
        this.onTick = null;
        this.onComplete = null;
        this.onFrequencyData = null;
        this.timeRemaining = 0;
        this.fadeTime = 2;
    }

    async init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0;
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.85;
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        return this;
    }

    /* ── Solfeggio Frequencies ── */
    static SOLF = {
        F174: 174,   // Pain relief, foundation
        F285: 285,   // Tissue repair, energy
        F396: 396,   // Liberating guilt/fear
        F417: 417,   // Undoing situations, change
        F528: 528,   // Transformation, love, miracles
        F639: 639,   // Connections, relationships
        F741: 741,   // Awakening intuition
        F852: 852,   // Returning to spiritual order
        F963: 963,   // Divine consciousness
    };

    /* ── Healing Presets ── */
    static PRESETS = {
        restore: {
            name: 'Restore',
            desc: 'Heal from negativity',
            solf: [396, 417, 528],
            binaural: { hz: 6, range: 'theta' },
            ambient: 'rain',
            color: '#00ff88',
        },
        abundance: {
            name: 'Abundance',
            desc: 'Attract money & prosperity',
            solf: [888, 639, 528],
            binaural: { hz: 10, range: 'alpha' },
            ambient: 'ocean',
            color: '#ffd700',
        },
        opportunity: {
            name: 'Opportunity',
            desc: 'Attract good things',
            solf: [741, 852, 963],
            binaural: { hz: 15, range: 'beta' },
            ambient: 'wind',
            color: '#aa00ff',
        },
        peace: {
            name: 'Peace',
            desc: 'Inner calm & serenity',
            solf: [432, 528, 639],
            binaural: { hz: 5, range: 'theta' },
            ambient: 'forest',
            color: '#00aaff',
        },
    };

    /* ── Create Solf Layer ── */
    createSolfLayer(freq, volume = 0.15) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = volume;
        osc.connect(gain);
        gain.connect(this.masterGain);
        return { osc, gain, type: 'solf', freq };
    }

    /* ── Create Binaural Beat Layer ── */
    createBinauralLayer(baseFreq, beatHz, volume = 0.12) {
        const splitter = this.ctx.createChannelSplitter(2);
        const merger = this.ctx.createChannelMerger(2);
        const gainL = this.ctx.createGain();
        const gainR = this.ctx.createGain();
        const oscL = this.ctx.createOscillator();
        const oscR = this.ctx.createOscillator();

        oscL.type = 'sine';
        oscL.frequency.value = baseFreq;
        oscR.type = 'sine';
        oscR.frequency.value = baseFreq + beatHz;

        gainL.gain.value = volume;
        gainR.gain.value = volume;

        oscL.connect(gainL);
        oscR.connect(gainR);
        gainL.connect(merger, 0, 0);
        gainR.connect(merger, 0, 1);
        merger.connect(this.masterGain);

        return { oscL, oscR, gainL, gainR, type: 'binaural', baseFreq, beatHz };
    }

    /* ── Create Ambient Layer (Noise-based) ── */
    createAmbientLayer(type = 'rain', volume = 0.08) {
        const bufferSize = this.ctx.sampleRate * 4;
        const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
        const dataL = buffer.getChannelData(0);
        const dataR = buffer.getChannelData(1);

        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            switch (type) {
                case 'rain':
                    dataL[i] = (lastOut + 0.02 * white) / 1.02;
                    dataR[i] = (lastOut + 0.02 * white) / 1.02;
                    lastOut = dataL[i];
                    dataL[i] *= 3.5;
                    dataR[i] *= 3.5;
                    break;
                case 'ocean':
                    const mod = Math.sin(i / (this.ctx.sampleRate * 0.8)) * 0.5 + 0.5;
                    dataL[i] = white * mod * 0.6;
                    dataR[i] = white * mod * 0.6;
                    break;
                case 'wind':
                    dataL[i] = white * (Math.sin(i / 1000) * 0.3 + 0.3);
                    dataR[i] = white * (Math.cos(i / 1200) * 0.3 + 0.3);
                    break;
                case 'forest':
                    dataL[i] = white * 0.1 * (Math.random() > 0.998 ? 8 : 1);
                    dataR[i] = white * 0.1 * (Math.random() > 0.997 ? 6 : 1);
                    break;
            }
        }

        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
        filter.frequency.value = type === 'rain' ? 3000 : type === 'ocean' ? 500 : 1000;

        const gain = this.ctx.createGain();
        gain.gain.value = volume;

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        return { src, filter, gain, type: 'ambient', ambientType: type };
    }

    /* ── Create Sub Bass Layer ── */
    createSubLayer(freq = 40, volume = 0.1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = volume;
        osc.connect(gain);
        gain.connect(this.masterGain);
        return { osc, gain, type: 'sub', freq };
    }

    /* ── Load Preset ── */
    loadPreset(presetName) {
        const preset = SerotoninEngine.PRESETS[presetName];
        if (!preset) return;

        this.stopAll();
        this.layers = [];

        preset.solf.forEach((freq, i) => {
            this.layers.push(this.createSolfLayer(freq, 0.12 - i * 0.02));
        });

        const binauralBase = preset.solf[0];
        this.layers.push(this.createBinauralLayer(binauralBase, preset.binaural.hz, 0.1));

        this.layers.push(this.createAmbientLayer(preset.ambient, 0.06));
        this.layers.push(this.createSubLayer(36, 0.08));

        return preset;
    }

    /* ── Start Playing ── */
    async play() {
        if (!this.ctx) await this.init();
        if (this.ctx.state === 'suspended') await this.ctx.resume();

        this.layers.forEach(layer => {
            if (layer.osc) layer.osc.start();
            if (layer.oscL) layer.oscL.start();
            if (layer.oscR) layer.oscR.start();
            if (layer.src) layer.src.start();
        });

        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + this.fadeTime);

        this.isPlaying = true;
        this.startFrequencyLoop();
    }

    /* ── Stop All ── */
    stopAll() {
        if (!this.ctx) return;

        this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + this.fadeTime);

        setTimeout(() => {
            this.layers.forEach(layer => {
                try {
                    if (layer.osc) layer.osc.stop();
                    if (layer.oscL) layer.oscL.stop();
                    if (layer.oscR) layer.oscR.stop();
                    if (layer.src) layer.src.stop();
                } catch (e) {}
            });
            this.layers = [];
            this.isPlaying = false;
        }, this.fadeTime * 1000 + 100);
    }

    /* ── Start Session Timer ── */
    startSession(durationMinutes, onTick, onComplete) {
        this.timeRemaining = durationMinutes * 60;
        this.onTick = onTick;
        this.onComplete = onComplete;

        if (this.sessionTimer) clearInterval(this.sessionTimer);

        this.sessionTimer = setInterval(() => {
            this.timeRemaining--;
            if (this.onTick) this.onTick(this.timeRemaining);
            if (this.timeRemaining <= 0) {
                clearInterval(this.sessionTimer);
                this.stopAll();
                if (this.onComplete) this.onComplete();
            }
        }, 1000);
    }

    /* ── Stop Session ── */
    stopSession() {
        if (this.sessionTimer) clearInterval(this.sessionTimer);
        this.stopAll();
        this.timeRemaining = 0;
    }

    /* ── Frequency Analysis Loop ── */
    startFrequencyLoop() {
        const loop = () => {
            if (!this.isPlaying) return;
            this.analyser.getByteFrequencyData(this.frequencyData);
            if (this.onFrequencyData) this.onFrequencyData(this.frequencyData);
            requestAnimationFrame(loop);
        };
        loop();
    }

    /* ── Get Frequency Bands ── */
    getBands() {
        const d = this.frequencyData;
        if (!d) return { sub: 0, bass: 0, mid: 0, high: 0, presence: 0 };
        const len = d.length;
        let sub = 0, bass = 0, mid = 0, high = 0, presence = 0;
        for (let i = 0; i < len; i++) {
            const v = d[i] / 255;
            const hz = i / len * 22050;
            if (hz < 60) sub += v;
            else if (hz < 250) bass += v;
            else if (hz < 2000) mid += v;
            else if (hz < 8000) high += v;
            else presence += v;
        }
        return {
            sub: sub / (len * 0.03),
            bass: bass / (len * 0.1),
            mid: mid / (len * 0.3),
            high: high / (len * 0.3),
            presence: presence / (len * 0.25),
        };
    }

    /* ── Format Time ── */
    static formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
}

window.SerotoninEngine = SerotoninEngine;
