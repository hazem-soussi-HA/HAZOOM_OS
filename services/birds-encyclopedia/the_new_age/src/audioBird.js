// On-device bird-call synthesizer (Web Audio API). No audio files fetched over
// the network — every call is generated locally. Mirrors the GLTF pattern: a bird
// may specify a local sound file (assets/sounds/*.mp3) OR fall back to synthesis.
import { soundProfileFor } from './soundProfiles.js';

let ctx = null;
let master = null;
let muted = false;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// --- primitive voices --------------------------------------------------
function tone(freq, t0, dur, type = 'sine', gain = 0.3, glideTo = null) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

function noiseBurst(t0, dur, gain = 0.2, lp = 1200) {
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = lp;
  const g = ctx.createGain(); g.gain.value = gain;
  src.connect(filt); filt.connect(g); g.connect(master);
  src.start(t0);
}

function chirp(t0, f0, f1, dur, type = 'triangle', gain = 0.25) {
  tone(f0, t0, dur, type, gain, f1);
}

// --- family voices (named synth profiles) ------------------------------
const VOICES = {
  parrot(t) { // harsh squawk + mimic-like warble
    tone(900, t, 0.12, 'sawtooth', 0.25, 1400);
    tone(1300, t + 0.14, 0.1, 'square', 0.18, 800);
    chirp(t + 0.28, 700, 1500, 0.18, 'sine', 0.2);
  },
  flamingo(t) { // goose-like honk
    tone(420, t, 0.18, 'sawtooth', 0.22, 360);
    tone(380, t + 0.2, 0.16, 'sawtooth', 0.2, 320);
  },
  stork(t) { // mostly silent; soft bill-clatter via noise
    noiseBurst(t, 0.05, 0.15, 2500);
    noiseBurst(t + 0.09, 0.05, 0.13, 2500);
    noiseBurst(t + 0.18, 0.05, 0.12, 2500);
  },
  ostrich(t) { // low booming
    tone(110, t, 0.5, 'sine', 0.35, 80);
    tone(90, t + 0.1, 0.4, 'sine', 0.25, 70);
  },
  secretary(t) { // croaking kurr-kurr
    tone(300, t, 0.1, 'sawtooth', 0.2, 220);
    tone(280, t + 0.13, 0.1, 'sawtooth', 0.18, 210);
  },
  roller(t) { // rolling grating rak-rak
    for (let i = 0; i < 4; i++) chirp(t + i * 0.09, 1100, 700, 0.07, 'square', 0.18);
  },
  accipiter(t) { // yelping eagle cry
    tone(700, t, 0.18, 'sawtooth', 0.28, 1100);
    tone(1000, t + 0.18, 0.16, 'sawtooth', 0.24, 1400);
    tone(900, t + 0.36, 0.14, 'sawtooth', 0.2, 1200);
  },
  crane(t) { // resonant honking + trill
    tone(480, t, 0.22, 'sawtooth', 0.24, 420);
    chirp(t + 0.26, 900, 1500, 0.2, 'sine', 0.18);
  },
  hornbill(t) { // deep booming
    tone(140, t, 0.45, 'sine', 0.33, 100);
    tone(120, t + 0.12, 0.35, 'sine', 0.24, 90);
  },
  shoebill(t) { // machine-gun bill clatter
    for (let i = 0; i < 6; i++) noiseBurst(t + i * 0.07, 0.04, 0.18, 3000);
  },
  bustard(t) { // deep booming oomf
    tone(160, t, 0.4, 'sine', 0.3, 110);
    tone(130, t + 0.1, 0.3, 'sine', 0.22, 95);
  },
  guineafowl(t) { // kek-kek alarm chatter
    for (let i = 0; i < 6; i++) chirp(t + i * 0.08, 600, 500, 0.05, 'square', 0.16);
  },
  oxpecker(t) { // hissing sss + shrill chirp
    noiseBurst(t, 0.2, 0.12, 4000);
    chirp(t + 0.22, 1800, 2200, 0.1, 'sine', 0.14);
  },
  penguin(t) { // donkey bray
    tone(500, t, 0.2, 'sawtooth', 0.3, 300);
    tone(320, t + 0.22, 0.22, 'sawtooth', 0.26, 480);
  },
  lapwing(t) { // sharp kik-kik
    for (let i = 0; i < 4; i++) chirp(t + i * 0.1, 1400, 1000, 0.06, 'square', 0.18);
  },
  starling(t) { // whistled tsee + warble
    chirp(t, 2000, 2600, 0.12, 'sine', 0.18);
    chirp(t + 0.16, 2400, 1800, 0.14, 'sine', 0.16);
  },
  jacana(t) { // harsh kree-kree
    chirp(t, 1200, 800, 0.1, 'sawtooth', 0.2);
    chirp(t + 0.14, 1100, 750, 0.1, 'sawtooth', 0.18);
  },
  ibis(t) { // raucous haa-da-da
    tone(520, t, 0.12, 'sawtooth', 0.24, 460);
    tone(560, t + 0.14, 0.1, 'sawtooth', 0.2, 500);
    tone(500, t + 0.26, 0.12, 'sawtooth', 0.2, 440);
  },
  generic(t) { // pleasant chirp fallback
    chirp(t, 1000, 1600, 0.15, 'sine', 0.2);
    chirp(t + 0.18, 1500, 1100, 0.14, 'sine', 0.16);
  },
};

let fileCache = new Map();
function playFile(src) {
  const url = src;
  const run = (buf) => {
    const t0 = ctx.currentTime;
    const srcNode = ctx.createBufferSource();
    srcNode.buffer = buf;
    const g = ctx.createGain(); g.gain.value = 0.8;
    srcNode.connect(g); g.connect(master);
    srcNode.start(t0);
  };
  if (fileCache.has(url)) { run(fileCache.get(url)); return; }
  fetch(url).then((r) => r.arrayBuffer()).then((ab) => {
    ctx.decodeAudioData(ab, (buf) => { fileCache.set(url, buf); run(buf); },
      (e) => console.warn('sound decode failed', url, e));
  });
}

export function playBirdCall(bird, { repeat = 1 } = {}) {
  ensureCtx();
  if (muted) return;
  const prof = soundProfileFor(bird);
  let voiceFn = VOICES.generic;
  let isFile = false;
  if (prof.startsWith('file:')) { isFile = true; }
  else { voiceFn = VOICES[prof] || VOICES.generic; }

  const reps = Math.max(1, repeat | 0);
  for (let r = 0; r < reps; r++) {
    const t = ctx.currentTime + r * 0.9;
    if (isFile) playFile(prof.slice(5));
    else voiceFn(t);
  }
}

export function setMuted(v) { muted = !!v; if (master) master.gain.value = muted ? 0 : 0.6; }
export function isMuted() { return muted; }
export function resumeAudio() { ensureCtx(); }
