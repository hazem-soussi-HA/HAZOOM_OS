#!/usr/bin/env node
/**
 * HAZOOM — DJ Intelligence
 * A generative techno engine. Renders a full arrangement to a 16-bit WAV using
 * pure DSP: no samples, no libraries, no network.
 *
 *   node scripts/dj-intelligence.js --bpm 132 --bars 64 --out ~/Music/hazoom-dj.wav
 *
 * It also emits the pattern as JSON so a live set can be handed to the
 * Transistor Studio sequencer (apps/tools/transistor-studio.html).
 *
 * Signal flow per voice:  osc -> state-variable filter -> ADSR -> drive -> pan
 * Master:                 sum -> sidechain duck -> glue saturation -> limiter
 */

'use strict';
const fs = require('fs');
const path = require('path');

/* ── args ─────────────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const BPM      = Number(arg('bpm', 132));
const BARS     = Number(arg('bars', 64));
const OUT      = arg('out', path.join(process.env.HOME || '.', 'hazoom-dj.wav'));
const SOLO     = arg('solo', '');           // kick | bass | hat | clap | stab | music (all)
const SR       = 44100;
const SPB      = 60 / BPM;              // seconds per beat
const SPBAR    = SPB * 4;               // seconds per bar
const STEPS    = 16;                    // 16th notes
const SPS      = SPBAR / STEPS;         // seconds per 16th
const TOTAL    = Math.ceil(BARS * SPBAR * SR);

/* ── deterministic rng so a seed always gives the same track ──── */
let _s = Number(arg('seed', 20260926)) >>> 0;
const rnd = () => {
  _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5; _s >>>= 0;
  if (_s === 0) _s = 0x9e3779b9;          // xorshift locks at 0 — never allow it
  return _s / 4294967296;
};
const pick = a => a[Math.floor(rnd() * a.length)];

/* ── dsp primitives ───────────────────────────────────────────── */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp  = (a, b, t) => a + (b - a) * t;
const soft  = x => { const k = 1.7; return Math.tanh(k * x) / Math.tanh(k); };

/**
 * Chamberlin state-variable filter.
 *
 * The naive form  f = 2*sin(pi*fc/SR)  is only stable while f < ~1.0. At 8 kHz
 * f reaches 1.1, the state runs away, and a single Infinity in a 5M-sample
 * render poisons the whole file (that is where the first NaN peak came from).
 * So: clamp the cutoff well below Nyquist, hard-clamp f, floor the damping,
 * and refuse to propagate a non-finite state.
 */
function svf() {
  let lp = 0, bp = 0;
  return (x, cutoff, q) => {
    const fc = clamp(cutoff, 20, SR * 0.22);
    let f = 2 * Math.sin(Math.PI * fc / SR);
    if (f > 0.95) f = 0.95;
    if (f < 0) f = 0;
    const damp = clamp(q, 0.7, 2);
    const hp = x - lp - damp * bp;
    bp += f * hp;
    lp += f * bp;
    if (!Number.isFinite(lp) || !Number.isFinite(bp)) { lp = 0; bp = 0; }
    return { lp: Number.isFinite(lp) ? lp : 0, bp: Number.isFinite(bp) ? bp : 0, hp: Number.isFinite(hp) ? hp : 0 };
  };
}

/** Simple ADSR in seconds; returns a closure you call once per sample. */
function adsr(a, d, s, r) {
  let stage = 0, t = 0;
  const sustain = clamp(s, 0, 1);
  return (dt) => {
    t += dt;
    switch (stage) {
      case 0:
        if (t >= a) { t -= a; stage = 1; }
        return clamp(t / Math.max(a, 1e-6), 0, 1);
      case 1:
        if (t >= d) { t -= d; stage = 2; }
        return lerp(1, sustain, clamp(t / Math.max(d, 1e-6), 0, 1));
      case 2:
        return sustain;
      default: {
        const v = sustain * (1 - t / Math.max(r, 1e-6));
        if (t >= r) { stage = 0; t = 0; }
        return v < 0 ? 0 : v;
      }
    }
  };
}

/* ── voices: each writes into the mix buffer ─────────────────── */
const mixL = new Float32Array(TOTAL);
const mixR = new Float32Array(TOTAL);
const duck = new Float32Array(TOTAL);   // 1 = open, <1 = ducked
const revL = new Float32Array(TOTAL);
const revR = new Float32Array(TOTAL);

/* --solo gates voices so a stem can be rendered and measured on its own.
   The kick and the sub bass overlap in frequency, so a filter cannot separate
   them; only muting can. */
let CURRENT = '';
function setVoice(v) { CURRENT = v; }
function soloed(v) { return !SOLO || SOLO === 'music' || SOLO === v; }
function add(i, l, r) {
  if (i < 0 || i >= TOTAL || !soloed(CURRENT)) return;
  mixL[i] += l; mixR[i] += r;
}

/* 4-on-the-floor kick: pitch-swept sine + transient click.
   The decay has to be shorter than the beat (0.45s at 132bpm) or consecutive
   kicks smear into each other and the low end never breathes. tau ~0.10s,
   audible tail gone by ~0.30s. */
function kick(at, vel = 1) {
  setVoice('kick');
  const i0 = Math.floor(at * SR);
  const len = Math.floor(0.30 * SR);
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    // pitch env 132Hz -> 45Hz in 40ms
    const f = 45 + (132 - 45) * Math.exp(-t / 0.022);
    const env = Math.exp(-t / (0.055 + 0.050 * vel)) * vel;
    let v = Math.sin(TAU * f * t) * env;
    if (t < 0.003) v += (rnd() * 2 - 1) * 0.55 * (1 - t / 0.003);   // beater click
    const i = i0 + n; if (i >= TOTAL) break;
    add(i, v, v);
    if (soloed('kick')) {
      const dd = 1 - 0.62 * vel * Math.exp(-t / 0.16);
      if (i >= 0) duck[i] = Math.min(duck[i], dd);
    }
  }
}

/* Rolling sub bass: saw through an SVF, short glide between notes. */
function bass(at, dur, hz, vel = 1) {
  setVoice('bass');
  const i0 = Math.floor(at * SR);
  const len = Math.floor((dur + 0.06) * SR);
  const f1 = svf();
  let phase = 0, lastHz = hz;
  const env = adsr(0.004, 0.06, 0.85, 0.05);
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const glide = Math.min(1, t / 0.012);
    const f = lerp(lastHz, hz, glide);
    lastHz = f;
    phase += f / SR; if (phase > 1) phase -= 1;
    const saw = 2 * phase - 1;
    const sub = Math.sin(TAU * f * 0.5 * t);
    const cut = 180 + 900 * Math.exp(-t / 0.05) + 120;
    const o = f1(saw * 0.8 + sub * 0.55, cut, 1.4);
    const e = env(1 / SR);
    const v = soft(o.lp * 2.1) * e * 0.5 * vel;
    const i = i0 + n; if (i >= TOTAL) break;
    add(i, v, v);
  }
}

/* Closed hat on the offbeat, or an open hat when open=true. */
function hat(at, open = false, vel = 1) {
  setVoice('hat');
  const i0 = Math.floor(at * SR);
  const len = Math.floor((open ? 0.19 : 0.045) * SR);
  const f = svf();
  let hp_prev = 0;
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const noise = rnd() * 2 - 1;
    const bp = f(noise, 8200, 0.9).bp;
    const hp = noise - hp_prev; hp_prev = noise;
    const env = Math.exp(-t / (open ? 0.075 : 0.014)) * vel;
    const v = (bp * 0.35 + hp * 0.14) * env;
    const i = i0 + n; if (i >= TOTAL) break;
    const pan = 0.18;
    add(i, v * (1 - pan), v * (1 + pan));
  }
}

/* Clap: three offset noise taps + a body, sent hard to the reverb. */
function clap(at, vel = 1) {
  setVoice('clap');
  const i0 = Math.floor(at * SR);
  const len = Math.floor(0.34 * SR);
  const f = svf();
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    let env = 0;
    for (const [off, amp] of [[0, 1], [0.011, 0.85], [0.023, 0.7]]) {
      if (t >= off) env = Math.max(env, Math.exp(-(t - off) / 0.028) * amp);
    }
    if (t > 0.03) env = Math.max(env, Math.exp(-(t - 0.03) / 0.10) * 0.55);
    const bp = f(rnd() * 2 - 1, 1500, 0.7).bp;
    const v = bp * env * 0.34 * vel;
    const i = i0 + n; if (i >= TOTAL) break;
    add(i, v * 1.1, v * 0.9);
    if (soloed('clap')) { revL[i] += v * 0.5; revR[i] += v * 0.5; }
  }
}

/* Detuned saw chord stab with a filter env — the lead. */
function stab(at, hz, dur, vel = 1) {
  setVoice('stab');
  const i0 = Math.floor(at * SR);
  const len = Math.floor((dur + 0.18) * SR);
  const f = svf();
  const det = [-9, -3, 0, 4, 10];
  const ph = det.map(() => rnd());
  const env = adsr(0.004, 0.10, 0.42, 0.14);
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    let s = 0;
    for (let d = 0; d < det.length; d++) {
      ph[d] += (hz * (1 + det[d] / 1200)) / SR; if (ph[d] > 1) ph[d] -= 1;
      s += 2 * ph[d] - 1;
    }
    s /= det.length;
    const cut = 320 + 5200 * Math.exp(-t / 0.09);
    const o = f(s, cut, 2.1);
    const v = soft(o.lp * 1.7) * env(1 / SR) * 0.20 * vel;
    const i = i0 + n; if (i >= TOTAL) break;
    add(i, v, v);
    if (soloed('stab')) { revL[i] += v * 0.42; revR[i] += v * 0.42; }
  }
}

/* Reverse-swept noise riser for builds. */
function riser(at, dur, vel = 1) {
  setVoice('riser');
  const i0 = Math.floor(at * SR);
  const len = Math.floor(dur * SR);
  const f = svf();
  for (let n = 0; n < len; n++) {
    const t = n / SR, p = t / dur;
    const cut = 300 * Math.pow(46, p);
    const bp = f(rnd() * 2 - 1, cut, 1.1).bp;
    const env = Math.pow(p, 2.1) * vel;
    const i = i0 + n; if (i >= TOTAL) break;
    add(i, bp * 0.16 * env, bp * 0.16 * env);
    if (soloed('riser')) { revL[i] += bp * 0.10 * env; revR[i] += bp * 0.10 * env; }
  }
}

/* Impact for downbeats of a drop. */
function impact(at, vel = 1) {
  setVoice('impact');
  const i0 = Math.floor(at * SR);
  const len = Math.floor(1.4 * SR);
  const f = svf();
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const lp = f((rnd() * 2 - 1) + Math.sin(TAU * 41 * t) * 0.7, 900 * Math.exp(-t / 0.4) + 60, 1.2).lp;
    const env = Math.exp(-t / 0.42) * vel;
    const i = i0 + n; if (i >= TOTAL) break;
    add(i, lp * 0.4 * env, lp * 0.4 * env);
    if (soloed('impact')) { revL[i] += lp * 0.3 * env; revR[i] += lp * 0.3 * env; }
  }
}

/* ── reverb: 4 combs + 2 allpass per side ────────────────────── */
function reverb(intoL, intoR, outL, outR, decay = 0.78) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map(d => ({ d, i: 0, buf: new Float32Array(d) }));
  const aps   = [556, 441, 341, 225].map(d => ({ d, i: 0, buf: new Float32Array(d) }));
  for (let n = 0; n < TOTAL; n++) {
    let l = intoL[n], r = intoR[n];
    for (const c of combs) {
      const y = c.buf[c.i];
      c.buf[c.i] = l + y * decay; c.i = (c.i + 1) % c.d;
      l += y * 0.24;
    }
    for (const a of aps) {
      const y = a.buf[a.i];
      a.buf[a.i] = l + y * 0.5; a.i = (a.i + 1) % a.d;
      l = y - l;
    }
    outL[n] = l * 0.5;
    outR[n] = r * 0.42 + l * 0.10;
    if (!Number.isFinite(outL[n])) outL[n] = 0;
    if (!Number.isFinite(outR[n])) outR[n] = 0;
  }
}

/* ── arrangement ──────────────────────────────────────────────── */
const A = 55;                                             // A1
const N = m => A * Math.pow(2, m / 12);                   // semitone offset
const CHORD_MIN = [0, 3, 7, 10, 12];                      // Am7 voicing
// a minor-key bassline motif, in semitones relative to the root
const MOTIF = [0, 0, 12, 0, 7, 0, 3, 0, 0, 10, 0, 7, 3, 0, 5, 0];

const energy = bar => {
  if (bar < 8)  return 'intro';
  if (bar < 16) return 'build';
  if (bar < 32) return 'drop';
  if (bar < 40) return 'breakdown';
  if (bar < 56) return 'drop2';
  return 'outro';
};

const sections = [];
for (let bar = 0; bar < BARS; bar++) {
  const kind = energy(bar);
  if (!sections.length || sections[sections.length - 1].kind !== kind)
    sections.push({ kind, from: bar, bars: 0 });
  sections[sections.length - 1].bars++;
}
if (SOLO) console.log(`solo: ${SOLO}`);
if (SOLO && SOLO !== 'music') console.log(`solo: ${SOLO}`);
console.log('arrangement:', sections.map(s => `${s.kind}(${s.bars})`).join(' → '));

const rootShift = { intro: 0, build: 0, drop: 0, breakdown: -2, drop2: 3, outro: 0 };

/** How many elements are live in a given bar — the arrangement, explicitly. */
function density(bar) {
  const kind = energy(bar);
  if (kind === 'intro')    return { kick: true,  hat: bar >= 4, bass: bar >= 6, clap: false, stab: false, riser: false };
  if (kind === 'build')    return { kick: true,  hat: true,  bass: true,  clap: bar >= 4, stab: bar >= 6, riser: bar % 4 === 3 };
  if (kind === 'drop')     return { kick: true,  hat: true,  bass: true,  clap: true,  stab: true,  riser: false };
  if (kind === 'breakdown')return { kick: bar % 4 === 3, hat: bar >= 4, bass: bar % 2 === 1, clap: false, stab: true, riser: bar % 4 === 3 };
  if (kind === 'drop2')    return { kick: true,  hat: true,  bass: true,  clap: true,  stab: true,  riser: false };
  // outro strips back over 8 bars
  const o = bar - 56;
  return { kick: o < 7, hat: o < 4, bass: o < 6, clap: o < 4, stab: o < 3, riser: false };
}

for (let bar = 0; bar < BARS; bar++) {
  const kind = energy(bar);
  const t0 = bar * SPBAR;
  const shift = rootShift[kind] || 0;
  const full  = kind === 'drop' || kind === 'drop2';
  const brk   = kind === 'breakdown';
  const d     = density(bar);

  if (d.kick) for (let b = 0; b < 4; b++) kick(t0 + b * SPB, brk ? 0.7 : 1);
  if (d.clap) for (const b of [1, 3]) clap(t0 + b * SPB, full ? 1 : 0.6);

  if (d.hat) {
    for (let s = 0; s < STEPS; s++) {
      const off = s % 4 === 2;
      const roll = full && s % 2 === 1;
      if (off || roll || kind === 'build') {
        const open = full && s === 14 && bar % 4 === 3;
        hat(t0 + s * SPS, open, (off ? 0.55 : 0.32));
      }
    }
  }

  if (d.bass) {
    for (let s = 0; s < STEPS; s++) {
      if (kind === 'intro' && s % 4 !== 0) continue;
      bass(t0 + s * SPS, SPS * 0.82, N(24 + MOTIF[s] + shift), brk ? 0.75 : 1);
    }
  }

  if (d.stab) {
    for (const s of [2, 6, 10, 14]) {
      if (rnd() < (kind === 'build' ? 0.45 : 0.82)) {
        stab(t0 + s * SPS, N(48 + CHORD_MIN[(s / 2) % CHORD_MIN.length] + shift), SPS * 0.5, kind === 'build' ? 0.6 : 1);
      }
    }
  }

  if (d.riser) riser(t0, SPBAR, 1);
  if (bar % 16 === 0 && full) impact(t0, 1);
}

/**
 * Per-section level. Without this the intro sits only 3 dB under the drop and
 * the outro is as loud as the drop, because everything sums to the same place
 * and the limiter squares off the difference.
 */
function sectionGain(bar) {
  const kind = energy(bar);
  if (kind === 'intro')     return bar < 4 ? 0.40 : 0.58;
  if (kind === 'build')     return 0.66 + (bar % 8) / 8 * 0.30;
  if (kind === 'drop')      return 1.00;
  if (kind === 'breakdown') return 0.38;
  if (kind === 'drop2')     return 1.00;
  const o = Math.max(0, Math.min(7, bar - 56));
  return 0.95 - o * 0.092;                      // 0.95 → 0.31
}

/* ── master: reverb, sidechain, glue, limiter ────────────────── */
duck.fill(1);
const sendL = new Float32Array(TOTAL), sendR = new Float32Array(TOTAL);
reverb(revL, revR, sendL, sendR, 0.76);

const outL = new Float32Array(TOTAL), outR = new Float32Array(TOTAL);
const glue = svf();
let env = 0, gEnv = sectionGain(0);                 // slewed section gain
const SLEW = 0.00035;                               // ~15 ms to traverse, click-free
for (let n = 0; n < TOTAL; n++) {
  const barNow = Math.floor((n / SR) / SPBAR);
  const target = sectionGain(Math.min(BARS - 1, barNow));
  gEnv += clamp(target - gEnv, -SLEW, SLEW);
  const d = duck[n] * gEnv;
  let l = mixL[n] * d + sendL[n] * 0.9 * gEnv;
  let r = mixR[n] * d + sendR[n] * 0.9 * gEnv;
  // mono-ise the sub region, keep hats wide
  const sub = (l + r) * 0.5;
  l = sub + (l - sub) * 0.55; r = sub + (r - sub) * 0.55;
  // glue saturation + a touch of top via one-pole
  const g = glue(l + r, 7200, 0.9);
  l = soft(l * 0.82 + g.lp * 0.10);
  r = soft(r * 0.82 + g.lp * 0.10);
  // peak limiter with a fast attack / slow release
  const peak = Math.max(Math.abs(l), Math.abs(r));
  env = peak > env ? peak : env * 0.9994;
  const gain = env > 0.89 ? 0.89 / env : 1;
  outL[n] = l * gain; outR[n] = r * gain;
}

/* fade in/out so the file never clicks */
const fade = Math.floor(0.05 * SR);
for (let n = 0; n < fade; n++) { const g = n / fade; outL[n] *= g; outR[n] *= g; }
for (let n = 0; n < fade; n++) { const g = n / fade; outL[TOTAL-1-n] *= g; outR[TOTAL-1-n] *= g; }

/* Safety net: scrub anything non-finite before it reaches the encoder.
   A single NaN would otherwise silence the whole file. */
let scrubbed = 0;
for (let n = 0; n < TOTAL; n++) {
  if (!Number.isFinite(outL[n])) { outL[n] = 0; scrubbed++; }
  if (!Number.isFinite(outR[n])) { outR[n] = 0; scrubbed++; }
}
if (scrubbed) console.warn(`  warning: scrubbed ${scrubbed} non-finite sample(s)`);

/* ── write 16-bit PCM WAV ─────────────────────────────────────── */
function wav(l, r) {
  const n = l.length, dataBytes = n * 4, buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataBytes, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(dataBytes, 40);
  let o = 44, peak = 0;
  for (let i = 0; i < n; i++) {
    let a = clamp(l[i], -1, 1), b = clamp(r[i], -1, 1);
    peak = Math.max(peak, Math.abs(a), Math.abs(b));
    buf.writeInt16LE((a * 32767) | 0, o); o += 2;
    buf.writeInt16LE((b * 32767) | 0, o); o += 2;
  }
  return { buf, peak };
}

const { buf, peak } = wav(outL, outR);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, buf);
const secs = (TOTAL / SR);
console.log(`rendered ${OUT}`);
console.log(`  ${secs.toFixed(1)}s · ${BPM} bpm · ${BARS} bars · ${(buf.length/1048576).toFixed(1)} MB · peak ${(20*Math.log10(peak)).toFixed(1)} dBFS`);

/* ── hand the pattern to the live sequencer ───────────────────── */
const steps = [];
for (let i = 0; i < 16; i++) {
  const deg = MOTIF[i] + rootShift.drop2;
  steps.push({ step: i, note: 36 + deg, len: 0.5, on: i % 2 === 0 });
}
fs.writeFileSync(path.join(path.dirname(OUT), 'hazoom-dj-pattern.json'),
  JSON.stringify({ bpm: BPM, bars: BARS, sections, steps }, null, 2));
console.log(`  pattern → ${path.join(path.dirname(OUT), 'hazoom-dj-pattern.json')} (paste into Transistor Studio)`);
