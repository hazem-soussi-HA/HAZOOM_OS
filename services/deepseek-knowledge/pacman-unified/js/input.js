// ═══════════════════════════════════════════════════════
//  input.js — Keyboard + mobile d-pad controls
// ═══════════════════════════════════════════════════════

import { UP, DOWN, LEFT, RIGHT } from './config.js';

const dirMap = {
  ArrowUp: UP, ArrowDown: DOWN, ArrowLeft: LEFT, ArrowRight: RIGHT,
  w: UP, W: UP, s: DOWN, S: DOWN, a: LEFT, A: LEFT, d: RIGHT, D: RIGHT
};

let nextDir = LEFT;
let pausePressed = false;
let mutePressed = false;

export function getNextDir() { return nextDir; }
export function resetNextDir(d) { nextDir = d; }
export function consumePause() { const v = pausePressed; pausePressed = false; return v; }
export function consumeMute() { const v = mutePressed; mutePressed = false; return v; }

/**
 * Called by input handlers — stores desired direction.
 * game.js reads this via getNextDir() and applies it to pacman.nextDir each tick.
 */
function setNextDir(d) {
  nextDir = d;
  // Also update pacman directly if available (avoids stale reference issues)
  if (window.__pacman) window.__pacman.nextDir = d;
}

export function initInput(pacman) {
  if (pacman) window.__pacman = pacman;

  document.addEventListener('keydown', e => {
    if (dirMap[e.key] !== undefined) {
      setNextDir(dirMap[e.key]);
      e.preventDefault();
    }
    if (e.key === 'p' || e.key === 'P') pausePressed = true;
    if (e.key === 'm' || e.key === 'M') mutePressed = true;
  });

  // Mobile d-pad
  document.querySelectorAll('.db[data-d]').forEach(btn => {
    const d = { up: UP, down: DOWN, left: LEFT, right: RIGHT }[btn.dataset.d];
    const handler = e => {
      e.preventDefault();
      setNextDir(d);
    };
    btn.addEventListener('touchstart', handler);
    btn.addEventListener('mousedown', handler);
  });
}
