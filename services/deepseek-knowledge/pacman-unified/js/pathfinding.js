// ═══════════════════════════════════════════════════════
//  pathfinding.js — A* pathfinding algorithm
// ═══════════════════════════════════════════════════════

import { COLS, ROWS, DX, DY, UP, DOWN, LEFT, RIGHT } from './config.js';

/**
 * A* pathfinding on the maze grid.
 * @param {number} sx - start X
 * @param {number} sy - start Y
 * @param {number} gx - goal X
 * @param {number} gy - goal Y
 * @param {Array} maze - 2D maze array
 * @param {boolean} allowGhostHouse - can path through ghost house
 * @returns {Array|null} path as [{x,y}, ...] or null
 */
export function aStar(sx, sy, gx, gy, maze, allowGhostHouse = false) {
  const key = (x, y) => x + ',' + y;
  const open = [{ x: sx, y: sy }];
  const from = {};
  const gs = { [key(sx, sy)]: 0 };
  const hs = { [key(sx, sy)]: Math.abs(sx - gx) + Math.abs(sy - gy) };

  while (open.length) {
    open.sort((a, b) => (hs[key(a.x, a.y)] || 1e9) - (hs[key(b.x, b.y)] || 1e9));
    const cur = open.shift();
    const ck = key(cur.x, cur.y);

    if (cur.x === gx && cur.y === gy) {
      const path = [cur];
      let kk = ck;
      while (from[kk]) {
        path.unshift(from[kk]);
        kk = key(from[kk].x, from[kk].y);
      }
      return path;
    }

    for (let d = 1; d <= 4; d++) {
      const nx = cur.x + DX[d];
      const ny = cur.y + DY[d];
      const nk = key(nx, ny);

      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      const t = maze[ny][nx];
      if (t === '#') continue;
      if (!allowGhostHouse && (t === 'H' || t === 'D')) continue;

      const ng = (gs[ck] || 0) + 1;
      if (ng < (gs[nk] || 1e9)) {
        from[nk] = cur;
        gs[nk] = ng;
        hs[nk] = ng + Math.abs(nx - gx) + Math.abs(ny - gy);
        if (!open.find(n => n.x === nx && n.y === ny)) {
          open.push({ x: nx, y: ny });
        }
      }
    }
  }
  return null;
}

/**
 * Get valid directions from a tile.
 */
export function validDirs(x, y, maze, allowGH = false) {
  const dirs = [];
  for (let d = 1; d <= 4; d++) {
    const nx = x + DX[d];
    const ny = y + DY[d];
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
      if (y === 14 && (nx < 0 || nx >= COLS)) dirs.push(d);
      continue;
    }
    const t = maze[ny][nx];
    if (t === '#') continue;
    if (!allowGH && (t === 'H' || t === 'D')) continue;
    dirs.push(d);
  }
  return dirs;
}
