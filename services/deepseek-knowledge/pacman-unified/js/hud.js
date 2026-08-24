// ═══════════════════════════════════════════════════════
//  hud.js — Score, lives, mode indicators overlay
// ═══════════════════════════════════════════════════════

import { GHOST_COLORS } from './config.js';

const MODE_NAMES = { 1: 'SCAT', 2: 'CHASE', 3: 'FEAR', 4: 'GONE' };
const GHOST_NAMES = ['Blinky', 'Pinky', 'Inky', 'Clyde'];

// Cache DOM references
let scEl, hiEl, lvEl, ldiv, mdiv;
let lifeEls = [];
let modeEls = [];

function init() {
  scEl = document.getElementById('sc');
  hiEl = document.getElementById('hi');
  lvEl = document.getElementById('lv');
  ldiv = document.getElementById('lives');
  mdiv = document.getElementById('modes');
}

export function updateHUD(score, highScore, level, lives, ghosts) {
  if (!scEl) init();

  // Update score text (no DOM rebuild)
  scEl.textContent = score;
  hiEl.textContent = highScore;
  lvEl.textContent = level;

  // Update lives — reuse elements, add/remove only what's needed
  while (lifeEls.length < lives) {
    const d = document.createElement('div');
    d.className = 'life';
    ldiv.appendChild(d);
    lifeEls.push(d);
  }
  while (lifeEls.length > lives) {
    ldiv.removeChild(lifeEls.pop());
  }

  // Update ghost mode tags — reuse elements
  if (ghosts) {
    while (modeEls.length < ghosts.length) {
      const tag = document.createElement('span');
      tag.className = 'mode-tag';
      mdiv.appendChild(tag);
      modeEls.push(tag);
    }
    while (modeEls.length > ghosts.length) {
      mdiv.removeChild(modeEls.pop());
    }
    for (let i = 0; i < ghosts.length; i++) {
      const g = ghosts[i];
      modeEls[i].style.background = GHOST_COLORS[g.name];
      modeEls[i].textContent = `${GHOST_NAMES[i]}:${MODE_NAMES[g.mode] || '?'}`;
    }
  }
}
