// ═══════════════════════════════════════════════════════════════
// ENGINE: AUDIO
// Procedural audio engine — engine sound, tires, effects
// ═══════════════════════════════════════════════════════════════

const Audio = {
  ctx: null,
  enabled: true,
  master: null,

  // Engine
  engineOsc: null,
  engineOsc2: null,
  engineGain: null,
  engineFilter: null,
  engineFilter2: null,

  // Tires
  tireOsc: null,
  tireGain: null,
  tireFilter: null,

  // Collision
  noiseBuffer: null,

  // Volume settings (0-1)
  volumes: {
    master: 0.08,
    engine: 1.0,
    tires: 1.0,
    effects: 1.0,
    music: 0.5,
  },

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volumes.master;
      this.master.connect(this.ctx.destination);

      // Engine oscillator 1 (fundamental)
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 80;
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.value = 80;

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 200;
      this.engineFilter2 = this.ctx.createBiquadFilter();
      this.engineFilter2.type = 'bandpass';
      this.engineFilter2.frequency.value = 3000;
      this.engineFilter2.Q.value = 3;

      this.engineOsc.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineFilter2);
      this.engineFilter2.connect(this.engineGain);
      this.engineGain.connect(this.master);
      this.engineOsc.start();
      this.engineOsc2.start();

      // Tire noise
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

      // Noise buffer for one-shots
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    } catch (e) {
      console.warn('Audio init failed:', e);
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  updateEngine(rpm, gear, throttle) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const vol = this.volumes.master * this.volumes.engine;
    const f = Math.max(40, (rpm / 60) * (gear > 0 ? 1 : 0.5));
    this.engineOsc.frequency.setTargetAtTime(f, t, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(f * 0.5, t, 0.05);
    const filt = 150 + (rpm / PHYS.maxRpm) * 6000;
    this.engineFilter.frequency.setTargetAtTime(filt, t, 0.08);
    this.engineFilter2.frequency.setTargetAtTime(2000 + (rpm / PHYS.maxRpm) * 4000, t, 0.08);
    const outVol = (0.02 + throttle * 0.08) * vol;
    this.engineGain.gain.setTargetAtTime(outVol, t, 0.05);
  },

  updateTire(slip) {
    if (!this.ctx || !this.enabled) return;
    const vol = this.volumes.master * this.volumes.tires;
    const outVol = Math.min(slip * 0.15, 0.05) * vol;
    this.tireGain.gain.setTargetAtTime(outVol, this.ctx.currentTime, 0.05);
    this.tireFilter.frequency.setTargetAtTime(2000 + slip * 4000, this.ctx.currentTime, 0.05);
  },

  playNoise(duration, bandFreq, bandQ, vol) {
    if (!this.ctx || !this.enabled) return;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuffer;
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = bandFreq;
    f.Q.value = bandQ;
    const v = vol * this.volumes.master * this.volumes.effects;
    g.gain.setValueAtTime(v, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(); s.stop(this.ctx.currentTime + duration);
  },

  playNitro() { this.playNoise(0.3, 1500, 1, 0.06); },
  playCollision() {
    if (!this.ctx || !this.enabled) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.2);
    const v = 0.10 * this.volumes.master * this.volumes.effects;
    g.gain.setValueAtTime(v, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    o.connect(g); g.connect(this.master);
    o.start(); o.stop(this.ctx.currentTime + 0.2);
  },
  playDrift() { this.playNoise(0.12, 4000, 2, 0.03); },

  playTone(freq, dur, type, vol) {
    if (!this.ctx || !this.enabled) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    const v = vol * this.volumes.master * this.volumes.effects;
    g.gain.setValueAtTime(v, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.master);
    o.start(); o.stop(this.ctx.currentTime + dur);
  },

  playLap() {
    [523, 659, 784].forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      const time = this.ctx.currentTime + i * 0.15;
      const v = 0.06 * this.volumes.master * this.volumes.effects;
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(v, time + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
      o.connect(g); g.connect(this.master);
      o.start(time); o.stop(time + 0.4);
    });
  },

  playRaceEnd() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      const time = this.ctx.currentTime + i * 0.2;
      const v = 0.08 * this.volumes.master * this.volumes.effects;
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(v, time + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
      o.connect(g); g.connect(this.master);
      o.start(time); o.stop(time + 0.8);
    });
  },

  playCountdownBeep(freq, dur) {
    if (!this.ctx || !this.enabled) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    const v = 0.06 * this.volumes.master * this.volumes.effects;
    g.gain.setValueAtTime(v, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.master);
    o.start(); o.stop(this.ctx.currentTime + dur);
  },

  // ─── NEW: Reward & feedback SFX ───
  playPowerup() {
    if (!this.ctx || !this.enabled) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(440, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.18);
    const v = 0.10 * this.volumes.master * this.volumes.effects;
    g.gain.setValueAtTime(v, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    o.connect(g); g.connect(this.master);
    o.start(); o.stop(this.ctx.currentTime + 0.25);
  },

  playCheer() {
    if (!this.ctx || !this.enabled) return;
    // Quick ascending triad
    [523, 659, 784].forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      const time = this.ctx.currentTime + i * 0.06;
      const v = 0.08 * this.volumes.master * this.volumes.effects;
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(v, time + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
      o.connect(g); g.connect(this.master);
      o.start(time); o.stop(time + 0.25);
    });
  },

  playBoo() {
    if (!this.ctx || !this.enabled) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.3);
    const v = 0.06 * this.volumes.master * this.volumes.effects;
    g.gain.setValueAtTime(v, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    o.connect(g); g.connect(this.master);
    o.start(); o.stop(this.ctx.currentTime + 0.35);
  },

  playAchievement() {
    if (!this.ctx || !this.enabled) return;
    // Triumphant ascending arpeggio
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle'; o.frequency.value = freq;
      const time = this.ctx.currentTime + i * 0.08;
      const v = 0.09 * this.volumes.master * this.volumes.effects;
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(v, time + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
      o.connect(g); g.connect(this.master);
      o.start(time); o.stop(time + 0.5);
    });
  },

  playFanfare() {
    if (!this.ctx || !this.enabled) return;
    // Big celebration chord
    [262, 330, 392, 523].forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      const time = this.ctx.currentTime;
      const v = 0.07 * this.volumes.master * this.volumes.effects;
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(v, time + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, time + 1.5);
      o.connect(g); g.connect(this.master);
      o.start(time); o.stop(time + 1.5);
    });
    // Shimmer
    for (let i = 0; i < 6; i++) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 1000 + Math.random() * 1500;
      const time = this.ctx.currentTime + i * 0.1;
      const v = 0.04 * this.volumes.master * this.volumes.effects;
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(v, time + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
      o.connect(g); g.connect(this.master);
      o.start(time); o.stop(time + 0.3);
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    if (this.master) {
      this.master.gain.setTargetAtTime(
        this.enabled ? this.volumes.master : 0,
        this.ctx.currentTime, 0.1
      );
    }
    return this.enabled;
  },

  setVolume(category, value) {
    this.volumes[category] = value;
    if (category === 'master' && this.master) {
      this.master.gain.setTargetAtTime(value, this.ctx.currentTime, 0.1);
    }
  },

  loadSettings() {
    const v = Save.get('audio');
    if (v) Object.assign(this.volumes, v);
  }
};
