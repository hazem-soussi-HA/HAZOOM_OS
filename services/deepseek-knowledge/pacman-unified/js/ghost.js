// ═══════════════════════════════════════════════════════
//  ghost.js — Ghost AI, movement, rendering
// ═══════════════════════════════════════════════════════

import { TILE, COLS, ROWS, UP, DOWN, LEFT, RIGHT, DX, DY, OPP, SCATTER, CHASE, FRIGHT, EATEN, GHOST_COLORS, SCATTER_TARGETS, RELEASE_DELAYS, TUNNEL_ROWS, TUNNEL_COLS_LEFT, TUNNEL_COLS_RIGHT } from './config.js';
import { validDirs } from './pathfinding.js';

/**
 * Create a single ghost.
 */
export function createGhost(name, sx, sy, dir, mode) {
  return {
    name,
    x: sx, y: sy,
    dir,
    mode,
    frightened: 0,
    scatterX: SCATTER_TARGETS[name].x,
    scatterY: SCATTER_TARGETS[name].y,
    homeX: sx, homeY: sy,
    released: RELEASE_DELAYS[name] <= 0,
    releaseTimer: RELEASE_DELAYS[name],
    flashTimer: 0
  };
}

/**
 * Create all 4 ghosts.
 */
export function createGhosts() {
  return [
    createGhost('Blinky', 14, 11, LEFT, SCATTER),
    createGhost('Pinky', 14, 14, UP, CHASE),
    createGhost('Inky', 12, 14, UP, CHASE),
    createGhost('Clyde', 16, 14, UP, CHASE)
  ];
}

/**
 * Get chase-mode target for a ghost (from BASIC 32000-32120).
 */
function chaseTarget(g, pacman, blinky) {
  const px = pacman.x, py = pacman.y;

  switch (g.name) {
    case 'Blinky':
      return { x: px, y: py };

    case 'Pinky': {
      let tx = px, ty = py;
      if (pacman.dir === UP) { ty -= 4; tx -= 4; }
      else if (pacman.dir === DOWN) ty += 4;
      else if (pacman.dir === LEFT) tx -= 4;
      else tx += 4;
      return { x: tx, y: ty };
    }

    case 'Inky': {
      let ax = px, ay = py;
      if (pacman.dir === UP) ay -= 2;
      else if (pacman.dir === DOWN) ay += 2;
      else if (pacman.dir === LEFT) ax -= 2;
      else ax += 2;
      return { x: ax + (ax - blinky.x), y: ay + (ay - blinky.y) };
    }

    case 'Clyde': {
      const dist = Math.abs(g.x - px) + Math.abs(g.y - py);
      if (dist > 8) return { x: px, y: py };
      return { x: g.scatterX, y: g.scatterY };
    }
  }
  return { x: px, y: py };
}

/**
 * Get target for a ghost based on current mode.
 */
function getTarget(g, pacman, ghosts) {
  if (g.mode === SCATTER) return { x: g.scatterX, y: g.scatterY };
  if (g.mode === FRIGHT) return { x: Math.random() * COLS | 0, y: Math.random() * ROWS | 0 };
  if (g.mode === EATEN) return { x: 14, y: 11 };
  return chaseTarget(g, pacman, ghosts[0]);
}

/**
 * Update all ghosts. Returns event: 'eat' (ghost eaten) | 'die' (pacman died) | null.
 */
export function updateGhosts(ghosts, pacman, maze, currentMode, tick) {
  let event = null;

  for (const g of ghosts) {
    // Release timer
    if (!g.released) {
      g.releaseTimer--;
      if (g.releaseTimer <= 0) {
        g.released = true;
        g.x = 14;
        g.y = 11;
        g.dir = LEFT;
      }
      continue;
    }

    // Frightened countdown
    if (g.mode === FRIGHT) {
      g.frightened--;
      if (g.frightened <= 0) g.mode = currentMode;
    }

    // Eaten ghost returns home — use A* pathfinding
    if (g.mode === EATEN) {
      if (g.x === 14 && g.y === 11) {
        g.mode = currentMode;
      } else {
        // Simple greedy walk toward home (14,11), with wall checks
        const dx = 14 - g.x, dy = 11 - g.y;
        const dirs = [];
        if (dx > 0) dirs.push(RIGHT);
        else if (dx < 0) dirs.push(LEFT);
        if (dy > 0) dirs.push(DOWN);
        else if (dy < 0) dirs.push(UP);
        // Try preferred dirs first, then any valid
        const allValid = validDirs(g.x, g.y, maze, true);
        let moved = false;
        for (const d of dirs) {
          if (allValid.includes(d)) {
            g.x += DX[d]; g.y += DY[d]; moved = true; break;
          }
        }
        if (!moved && allValid.length) {
          const d = allValid[0];
          g.x += DX[d]; g.y += DY[d];
        }
      }
      continue;
    }

    // Pixel alignment — snap to grid before decision
    const px = g.x * TILE, py = g.y * TILE;
    g.x = Math.round(g.x);
    g.y = Math.round(g.y);

    // Tunnel wrap
    if (g.x < 0) { g.x = COLS - 1; g.y = 14; }
    if (g.x >= COLS) { g.x = 0; g.y = 14; }

    // Decision at intersection
    const target = getTarget(g, pacman, ghosts);
    const valid = validDirs(g.x, g.y, maze, false);
    const filtered = valid.filter(d => d !== OPP[g.dir]);

    if (g.mode === FRIGHT) {
      // Frightened: random direction
      if (filtered.length && Math.random() < 0.25) {
        g.dir = filtered[Math.random() * filtered.length | 0];
      }
    } else if (filtered.length) {
      // Greedy targeting — squared Euclidean distance
      let bestDir = filtered[0];
      let bestDist = 1e9;
      for (const d of filtered) {
        const nx = g.x + DX[d];
        const ny = g.y + DY[d];
        const dist = (nx - target.x) ** 2 + (ny - target.y) ** 2;
        if (dist < bestDist) { bestDist = dist; bestDir = d; }
      }
      g.dir = bestDir;
    } else if (valid.length) {
      // Dead end — reverse
      g.dir = OPP[g.dir];
    }

    // Move — check bounds + walls + ghost house
    // Tunnel slowdown: ghosts in tunnel only move every other update
    const inTunnel = TUNNEL_ROWS.includes(g.y) &&
      (TUNNEL_COLS_LEFT.includes(g.x) || TUNNEL_COLS_RIGHT.includes(g.x));
    if (inTunnel && (tick & 1)) {
      // Skip this move — ghost is slow in tunnel
    } else {
      const mx = g.x + DX[g.dir];
      const my = g.y + DY[g.dir];
      if (mx >= 0 && mx < COLS && my >= 0 && my < ROWS) {
        const mt = maze[my][mx];
        if (mt !== '#' && mt !== 'H' && mt !== 'D') {
          g.x = mx;
          g.y = my;
        }
      }
    }

    // Flash when frightened ending
    if (g.mode === FRIGHT && g.frightened < 120) g.flashTimer++;
    else g.flashTimer = 0;
  }

  return event;
}

/**
 * Check collision between pacman and ghosts.
 * Returns 'eat' (ghost eaten) | 'die' (pacman died) | null.
 */
export function checkGhostCollision(pac, ghosts) {
  for (const g of ghosts) {
    if (!g.released) continue;
    if (pac.invuln > 0) continue; // invulnerable at start
    if (g.x === pac.x && g.y === pac.y) {
      if (g.mode === FRIGHT) {
        g.mode = EATEN;
        return 'eat';
      }
      if (g.mode !== EATEN) {
        return 'die';
      }
    }
  }
  return null;
}

/**
 * Draw ghosts on buffer context.
 */
export function renderGhosts(ctx, ghosts, tick) {
  for (const g of ghosts) {
    if (!g.released) continue;
    if (g.mode === EATEN && Math.abs(g.x - 14) <= 1 && Math.abs(g.y - 11) <= 1) continue;

    const cx = g.x * TILE + TILE / 2;
    const cy = g.y * TILE + TILE / 2 - 2;
    const r = TILE / 2 - 2;

    let color;
    if (g.mode === FRIGHT) {
      color = (g.flashTimer > 0 && ((g.flashTimer / 8 | 0) % 2)) ? '#fff' : '#2121de';
    } else if (g.mode === EATEN) {
      drawEyes(ctx, cx, cy, g.dir);
      continue;
    } else {
      color = GHOST_COLORS[g.name];
    }

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy - 2, r, Math.PI, 0);
    ctx.lineTo(cx + r, cy + r - 2);
    const w = Math.sin(tick / 8) * 2;
    const segs = 3, sw = (r * 2) / segs;
    for (let i = segs; i > 0; i--) {
      const sx = cx - r + i * sw;
      ctx.lineTo(sx - sw / 2, cy + r - 2 + (i % 2 ? w : -w));
      ctx.lineTo(sx - sw, cy + r - 2);
    }
    ctx.closePath();
    ctx.fill();

    // Eyes or frightened face
    if (g.mode !== FRIGHT) {
      drawEyes(ctx, cx, cy, g.dir);
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 3, 2, 0, Math.PI * 2);
      ctx.arc(cx + 3, cy - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 3);
      for (let i = 0; i < 4; i++) ctx.lineTo(cx - 4 + i * 2.5, cy + 3 + (i % 2 ? -1.5 : 1.5));
      ctx.stroke();
    }
  }
}

function drawEyes(ctx, cx, cy, dir) {
  const ox = dir === LEFT ? -2 : dir === RIGHT ? 2 : 0;
  const oy = dir === UP ? -2 : dir === DOWN ? 2 : 0;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(cx - 3, cy - 3, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 3, cy - 3, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#00f';
  ctx.beginPath(); ctx.arc(cx - 3 + ox, cy - 3 + oy, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 3 + ox, cy - 3 + oy, 1.5, 0, Math.PI * 2); ctx.fill();
}
