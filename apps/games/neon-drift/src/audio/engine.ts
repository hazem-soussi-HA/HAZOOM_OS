export class AudioEngine {
  ctx: AudioContext | null = null;
  enabled = true;
  master: GainNode | null = null;
  engineOsc: OscillatorNode | null = null;
  engineOsc2: OscillatorNode | null = null;
  engineGain: GainNode | null = null;
  engineFilter: BiquadFilterNode | null = null;
  ambientOsc: OscillatorNode | null = null;
  ambientGain: GainNode | null = null;
  noiseBuffer: AudioBuffer | null = null;

  init() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.12;
    this.master.connect(this.ctx.destination);

    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineOsc.type = 'triangle';
    this.engineOsc2.type = 'sine';
    this.engineOsc.frequency.value = 50;
    this.engineOsc2.frequency.value = 50;
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 300;
    this.engineFilter.Q.value = 1;
    this.engineOsc.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.master);
    this.engineGain.gain.value = 0;
    this.engineOsc.start();
    this.engineOsc2.start();

    this.ambientOsc = this.ctx.createOscillator();
    this.ambientGain = this.ctx.createGain();
    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.value = 55;
    this.ambientOsc.connect(this.ambientGain);
    this.ambientGain.connect(this.master);
    this.ambientGain.gain.value = 0.015;
    this.ambientOsc.start();

    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
  }

  updateEngine(speed: number) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const f = 50 + speed * 200;
    this.engineOsc!.frequency.setTargetAtTime(f, t, 0.1);
    this.engineOsc2!.frequency.setTargetAtTime(f, t, 0.1);
    this.engineFilter!.frequency.setTargetAtTime(200 + speed * 400, t, 0.1);
    this.engineGain!.gain.setTargetAtTime(speed * 0.06, t, 0.1);
  }

  playNitro() {
    if (!this.ctx || !this.enabled || !this.noiseBuffer) return;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuffer;
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1;
    g.gain.setValueAtTime(0.08, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    s.connect(f); f.connect(g); g.connect(this.master!);
    s.start(); s.stop(this.ctx.currentTime + 0.4);
  }

  playCollision() {
    if (!this.ctx || !this.enabled) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.2);
    g.gain.setValueAtTime(0.12, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    o.connect(g); g.connect(this.master!);
    o.start(); o.stop(this.ctx.currentTime + 0.2);
  }

  playDrift() {
    if (!this.ctx || !this.enabled || !this.noiseBuffer) return;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuffer;
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 4000;
    g.gain.setValueAtTime(0.04, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    s.connect(f); f.connect(g); g.connect(this.master!);
    s.start(); s.stop(this.ctx.currentTime + 0.15);
  }

  playLap() {
    if (!this.ctx || !this.enabled) return;
    [523, 659, 784].forEach((freq, i) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      const t = this.ctx!.currentTime + i * 0.15;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      o.connect(g); g.connect(this.master!);
      o.start(t); o.stop(t + 0.4);
    });
  }

  playRaceEnd() {
    if (!this.ctx || !this.enabled) return;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      const t = this.ctx!.currentTime + i * 0.2;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.1, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      o.connect(g); g.connect(this.master!);
      o.start(t); o.stop(t + 0.8);
    });
  }

  playCountdownBeep(value: number) {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = value === 1 ? 300 : 440;
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain); gain.connect(this.master!);
    osc.start(); osc.stop(this.ctx.currentTime + 0.2);
  }

  playGoBeep() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(gain); gain.connect(this.master!);
    osc.start(); osc.stop(this.ctx.currentTime + 0.3);
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.master) {
      this.master.gain.setTargetAtTime(this.enabled ? 0.12 : 0, this.ctx!.currentTime, 0.1);
    }
    return this.enabled;
  }
}

export const audio = new AudioEngine();
