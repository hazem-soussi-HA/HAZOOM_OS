// ═══════════════════════════════════════════════════════
//  pacman.js — Pacman entity: state, movement, rendering
// ═══════════════════════════════════════════════════════

import { TILE, COLS, ROWS, LEFT, DX, DY, COLORS } from './config.js';
import { sfxEat, sfxPower } from './audio.js';
import { markDotEaten } from './maze.js';
import { getNextDir } from './input.js';

/**
 * Create initial pacman state.
 */
export function createPacman() {
  return { x: 14, y: 23, dir: LEFT, nextDir: LEFT, mouth: 0, mouthD: 1, invuln: 120 };
}

/**
 * Update pacman direction and position.
 * Reads desired direction directly from input module (no stale reference).
 * Returns 'eat' | 'power' | null event.
 */
export function updatePacman(pac, maze, tick) {
  // Mouth animation
  pac.mouth += pac.mouthD;
  if (pac.mouth > 2) pac.mouthD = -1;
  if (pac.mouth < 0) pac.mouthD = 1;

  // Read desired direction from input module (always fresh)
  const desired = getNextDir();
  if (desired !== pac.dir) {
    pac.nextDir = desired;
  }

  // Try next direction
  let nx = pac.x + DX[pac.nextDir];
  let ny = pac.y + DY[pac.nextDir];
  if (nx < 0) nx = COLS - 1;
  if (nx >= COLS) nx = 0;
  if (ny >= 0 && ny < ROWS) {
    const t = maze[ny][nx];
    if (t !== '#' && t !== 'H' && t !== 'D') {
      pac.dir = pac.nextDir;
    }
  }

  // Move in current direction
  nx = pac.x + DX[pac.dir];
  ny = pac.y + DY[pac.dir];
  if (nx < 0) nx = COLS - 1;
  if (nx >= COLS) nx = 0;
  if (ny >= 0 && ny < ROWS) {
    const t = maze[ny][nx];
    if (t !== '#' && t !== 'H' && t !== 'D') {
      pac.x = nx;
      pac.y = ny;
    }
  }

  // Eat dot
  const tile = maze[pac.y][pac.x];
  if (tile === '.') {
    maze[pac.y][pac.x] = ' ';
    markDotEaten();
    sfxEat();
    return 'eat';
  }
  if (tile === 'o') {
    maze[pac.y][pac.x] = ' ';
    markDotEaten();
    sfxPower();
    return 'power';
  }

  return null;
}

/**
 * Draw Pacman on the buffer context.
 */
export function renderPacman(ctx, pac) {
  const cx = pac.x * TILE + TILE / 2;
  const cy = pac.y * TILE + TILE / 2;
  const r = TILE / 2 - 1;
  const mouth = pac.mouth * 0.4;

  // UP=1, DOWN=2, LEFT=3, RIGHT=4
  let angle;
  switch (pac.dir) {
    case 4: angle = 0; break;            // RIGHT
    case 2: angle = Math.PI / 2; break;  // DOWN
    case 3: angle = Math.PI; break;      // LEFT
    case 1: angle = -Math.PI / 2; break; // UP
    default: angle = 0; break;
  }

  // Blink during invulnerability
  if (pac.invuln > 0 && (pac.invuln >> 3) % 2 === 0) return;

  ctx.fillStyle = COLORS.pacman;
  ctx.beginPath();
  ctx.arc(cx, cy, r, angle + mouth, angle + Math.PI * 2 - mouth);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();
}
