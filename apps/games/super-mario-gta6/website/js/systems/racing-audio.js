// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.

// ═══════════════════════════════════════════════════════════════
// RACING AUDIO — Procedural engine + tire screech + drift + music
// + lap jingle + collision thud. All synthesized, no samples.
// ═══════════════════════════════════════════════════════════════

var RacingAudio = {
    ctx: null,
    enabled: true,
    master: null,
    musicGain: null,
    initialized: false,

    // Engine oscillators
    engineOsc: null,
    engineOsc2: null,
    engineGain: null,
    engineFilter: null,

    // Tire noise
    tireOsc: null,
    tireGain: null,
    tireFilter: null,

    // Drift screech
    screechGain: null,
    screechFilter: null,
    screechActive: false,

    // Music layer
    musicOsc1: null,
    musicOsc2: null,
    musicLfo: null,
    musicPlaying: false,

    // Lap tracking
    lastLapZ: 0,
    lapCount: 0,
    bestLapTime: null,
    currentLapStart: 0,

    // Collision noise buffer
    noiseBuffer: null,

    volumes: {
        master: 0.06,
        engine: 1.0,
        tires: 0.8,
        effects: 1.0,
        music: 0.5
    },

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.master = this.ctx.createGain();
            this.master.gain.value = this.volumes.master;
            this.master.connect(this.ctx.destination);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0;
            this.musicGain.connect(this.master);

            // Engine oscillator 1 (sawtooth fundamental)
            this.engineOsc = this.ctx.createOscillator();
            this.engineOsc.type = 'sawtooth';
            this.engineOsc.frequency.value = 80;

            // Engine oscillator 2 (triangle harmonic)
            this.engineOsc2 = this.ctx.createOscillator();
            this.engineOsc2.type = 'triangle';
            this.engineOsc2.frequency.value = 40;

            this.engineGain = this.ctx.createGain();
            this.engineGain.gain.value = 0;

            this.engineFilter = this.ctx.createBiquadFilter();
            this.engineFilter.type = 'lowpass';
            this.engineFilter.frequency.value = 200;

            this.engineOsc.connect(this.engineFilter);
            this.engineOsc2.connect(this.engineFilter);
            this.engineFilter.connect(this.engineGain);
            this.engineGain.connect(this.master);

            this.engineOsc.start();
            this.engineOsc2.start();

            // Tire noise (rolling)
            this.tireOsc = this.ctx.createOscillator();
            this.tireOsc.type = 'sawtooth';
            this.tireGain = this.ctx.createGain();
            this.tireGain.gain.value = 0;
            this.tireFilter = this.ctx.createBiquadFilter();
            this.tireFilter.type = 'highpass';
            this.tireFilter.frequency.value = 2000;
            this.tireOsc.connect(this.tireFilter);
            this.tireFilter.connect(this.tireGain);
            this.tireGain.connect(this.master);
            this.tireOsc.start();

            // Drift screech (sustained noise burst)
            this.screechGain = this.ctx.createGain();
            this.screechGain.gain.value = 0;
            this.screechFilter = this.ctx.createBiquadFilter();
            this.screechFilter.type = 'bandpass';
            this.screechFilter.frequency.value = 4500;
            this.screechFilter.Q.value = 6;
            this.screechGain.connect(this.screechFilter);
            this.screechFilter.connect(this.master);

            // Music layer (sustained pad with slow LFO)
            this.musicOsc1 = this.ctx.createOscillator();
            this.musicOsc1.type = 'sawtooth';
            this.musicOsc1.frequency.value = 110;   // A2
            this.musicOsc2 = this.ctx.createOscillator();
            this.musicOsc2.type = 'sine';
            this.musicOsc2.frequency.value = 165;   // E3 (perfect fifth)
            var musicFilter = this.ctx.createBiquadFilter();
            musicFilter.type = 'lowpass';
            musicFilter.frequency.value = 800;
            this.musicOsc1.connect(musicFilter);
            this.musicOsc2.connect(musicFilter);
            musicFilter.connect(this.musicGain);
            // LFO modulates the filter for movement
            this.musicLfo = this.ctx.createOscillator();
            this.musicLfo.type = 'sine';
            this.musicLfo.frequency.value = 0.15;
            var lfoGain = this.ctx.createGain();
            lfoGain.gain.value = 400;
            this.musicLfo.connect(lfoGain);
            lfoGain.connect(musicFilter.frequency);
            this.musicOsc1.start();
            this.musicOsc2.start();
            this.musicLfo.start();

            // Noise buffer for one-shots (tire screech, nitro, etc.)
            var buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
            var d = buf.getChannelData(0);
            for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            this.noiseBuffer = buf;

            this.initialized = true;
        } catch (e) {
            console.warn('[ RacingAudio ] Init failed:', e);
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },

    update() {
        if (!this.ctx || !this.enabled || !RacingMode || !RacingMode.active) return;
        var rm = RacingMode;
        var t = this.ctx.currentTime;
        var vol = this.volumes.master * this.volumes.engine;

        // ── Engine frequency from RPM ──
        var f = Math.max(40, (rm.rpm / 60) * (rm.gear > 0 ? 1 : 0.5));
        this.engineOsc.frequency.setTargetAtTime(f, t, 0.05);
        this.engineOsc2.frequency.setTargetAtTime(f * 0.5, t, 0.05);

        // Filter opens with RPM
        var filtFreq = 150 + (rm.rpm / RACING_PHYS.maxRpm) * 6000;
        this.engineFilter.frequency.setTargetAtTime(filtFreq, t, 0.08);

        // Volume from throttle
        var outVol = (0.015 + rm.throttle * 0.06) * vol;
        this.engineGain.gain.setTargetAtTime(outVol, t, 0.05);

        // ── Tire rolling noise from speed ──
        var speedFactor = Math.min(1, Math.abs(rm.speed) / 200);
        var tireVol = speedFactor * 0.02 * this.volumes.master * this.volumes.tires;
        this.tireGain.gain.setTargetAtTime(tireVol, t, 0.05);
        this.tireFilter.frequency.setTargetAtTime(2000 + speedFactor * 3000, t, 0.05);

        // ── Drift screech: high speed + heavy steering ──
        var absSteer = Math.abs(rm.steerInput || 0);
        var speedMs = Math.abs(rm.speed) / 3.6;
        var driftFactor = speedMs > 15 ? (absSteer * speedMs / 30) : 0;
        driftFactor = Math.min(1, driftFactor);
        var screechVol = driftFactor * 0.08 * this.volumes.master * this.volumes.tires;
        this.screechGain.gain.setTargetAtTime(screechVol, t, 0.03);
        if (screechVol > 0.005 && !this.screechActive) {
            this.screechActive = true;
            this._startScreechSource();
        } else if (screechVol <= 0.005) {
            this.screechActive = false;
        }

        // ── Music: fade in during racing ──
        if (this.musicPlaying) {
            var musicVol = this.volumes.music * this.volumes.master;
            this.musicGain.gain.setTargetAtTime(musicVol, t, 0.5);
        }

        // ── Lap detection: cross start/finish line ──
        if (this.currentLapStart === 0) {
            this.currentLapStart = t;
        }
        if (rm.carGroup && this.lastLapZ !== undefined) {
            var curZ = rm.carGroup.position.z;
            // Assume lap is road length
            var roadLen = (rm.roadData && rm.roadData.length) || 1500;
            if (curZ - this.lastLapZ > roadLen * 0.9 && this.lastLapZ > 0) {
                this.lapCount++;
                var lapTime = t - this.currentLapStart;
                this.playLapJingle();
                if (this.bestLapTime === null || lapTime < this.bestLapTime) {
                    this.bestLapTime = lapTime;
                }
                this.currentLapStart = t;
            }
            this.lastLapZ = curZ;
        }
    },

    _startScreechSource() {
        if (!this.screechActive || this._screechSource) return;
        var s = this.ctx.createBufferSource();
        s.buffer = this.noiseBuffer;
        s.loop = true;
        s.connect(this.screechFilter);
        s.start();
        this._screechSource = s;
    },

    _stopScreechSource() {
        if (this._screechSource) {
            try { this._screechSource.stop(); } catch (e) {}
            this._screechSource = null;
        }
    },

    playNitro() {
        if (!this.ctx || !this.enabled) return;
        this._playNoise(0.3, 1500, 1, 0.05);
    },

    playCollision() {
        if (!this.ctx || !this.enabled) return;
        var o = this.ctx.createOscillator();
        var g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(120, this.ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.2);
        var v = 0.08 * this.volumes.master * this.volumes.effects;
        g.gain.setValueAtTime(v, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        o.connect(g); g.connect(this.master);
        o.start(); o.stop(this.ctx.currentTime + 0.2);
    },

    playCountdownBeep(freq, dur) {
        if (!this.ctx || !this.enabled) return;
        var o = this.ctx.createOscillator();
        var g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        var v = 0.05 * this.volumes.master * this.volumes.effects;
        g.gain.setValueAtTime(v, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        o.connect(g); g.connect(this.master);
        o.start(); o.stop(this.ctx.currentTime + dur);
    },

    playLapJingle() {
        if (!this.ctx || !this.enabled) return;
        // Triumphant 4-note arpeggio: C5 → E5 → G5 → C6
        var notes = [523.25, 659.25, 783.99, 1046.50];
        var t0 = this.ctx.currentTime;
        for (var i = 0; i < notes.length; i++) {
            var o = this.ctx.createOscillator();
            var g = this.ctx.createGain();
            o.type = 'triangle';
            o.frequency.value = notes[i];
            var t = t0 + i * 0.12;
            var v = 0.06 * this.volumes.master * this.volumes.effects;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(v, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            o.connect(g); g.connect(this.master);
            o.start(t);
            o.stop(t + 0.42);
        }
    },

    _playNoise(duration, bandFreq, bandQ, vol) {
        if (!this.ctx || !this.enabled) return;
        var s = this.ctx.createBufferSource();
        s.buffer = this.noiseBuffer;
        var g = this.ctx.createGain();
        var f = this.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = bandFreq;
        f.Q.value = bandQ;
        var v = vol * this.volumes.master * this.volumes.effects;
        g.gain.setValueAtTime(v, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        s.connect(f); f.connect(g); g.connect(this.master);
        s.start(); s.stop(this.ctx.currentTime + duration);
    },

    startMusic() {
        if (!this.ctx) return;
        this.musicPlaying = true;
    },

    stopMusic() {
        if (!this.ctx) return;
        this.musicPlaying = false;
        this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    },

    stop() {
        // Fade out engine + music when exiting racing mode
        if (this.master && this.ctx) {
            this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
        }
        this.stopMusic();
        this._stopScreechSource();
        // Reset after fade
        setTimeout(() => {
            if (this.master && this.ctx) {
                this.master.gain.setTargetAtTime(this.volumes.master, this.ctx.currentTime, 0.05);
            }
            this.lastLapZ = 0;
            this.lapCount = 0;
            this.currentLapStart = 0;
        }, 200);
    }
};
