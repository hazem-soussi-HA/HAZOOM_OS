// ═══════════════════════════════════════════════════════
//  audio.js — Web Audio API sound engine
// ═══════════════════════════════════════════════════════

let audioCtx = null;
let muted = false;

const AC = window.AudioContext || window.webkitAudioContext;

function ensureAudio() {
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function tone(freq, dur, type = 'square', vol = 0.06) {
  if (muted || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}

export function sfxEat() {
  tone(600, 0.06);
  setTimeout(() => tone(800, 0.06), 35);
}

export function sfxPower() {
  tone(150, 0.3, 'sine', 0.1);
}

export function sfxGhost() {
  tone(200, 0.12, 'sawtooth');
  setTimeout(() => tone(400, 0.15, 'sawtooth'), 60);
}

export function sfxDeath() {
  [400, 350, 300, 250, 200, 150, 100].forEach((f, i) =>
    setTimeout(() => tone(f, 0.12, 'sawtooth', 0.08), i * 80)
  );
}

export function sfxLevel() {
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => tone(f, 0.18, 'square', 0.05), i * 100)
  );
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

export { ensureAudio };
