// ═══════════════════════════════════════════════════════
//  maze.js — Maze initialization, dot management, rendering
// ═══════════════════════════════════════════════════════

import { TILE, COLS, ROWS, MAZE_STR, COLORS } from './config.js';

export function parseMaze() {
  const maze = [];
  let totalDots = 0;
  for (let r = 0; r < ROWS; r++) {
    maze[r] = [];
    for (let c = 0; c < COLS; c++) {
      const ch = MAZE_STR[r][c];
      maze[r][c] = ch;
      if (ch === '.' || ch === 'o') totalDots++;
    }
  }
  return { maze, totalDots };
}

function isWall(maze, cx, ry) {
  if (cx < 0 || cx >= COLS || ry < 0 || ry >= ROWS) return false;
  return maze[ry][cx] === '#';
}

/**
 * Draw maze walls to offscreen canvas (static, cached per level).
 */
export function renderMazeCached(ctx, maze) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = maze[r][c];
      const x = c * TILE, y = r * TILE;

      if (ch === '#') {
        const t = isWall(maze, c, r - 1), b = isWall(maze, c, r + 1);
        const l = isWall(maze, c - 1, r), ri = isWall(maze, c + 1, r);

        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x, y, TILE, TILE);

        if (t || b || l || ri) {
          ctx.fillStyle = COLORS.wallInner;
          ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        }

        ctx.strokeStyle = COLORS.wallStroke;
        ctx.lineWidth = 1;
        const cx = x + TILE / 2, cy = y + TILE / 2;
        ctx.beginPath();
        if (t) { ctx.moveTo(cx, cy); ctx.lineTo(cx, y); }
        if (b) { ctx.moveTo(cx, cy); ctx.lineTo(cx, y + TILE); }
        if (l) { ctx.moveTo(cx, cy); ctx.lineTo(x, cy); }
        if (ri) { ctx.moveTo(cx, cy); ctx.lineTo(x + TILE, cy); }
        ctx.stroke();
      } else if (ch === 'D') {
        ctx.fillStyle = COLORS.door;
        ctx.fillRect(x + 2, y + TILE / 2 - 2, TILE - 4, 4);
      }
    }
  }
}

/**
 * Draw dots and power pellets. Called every frame — fast, just small arcs.
 * Skips eaten tiles (now ' ' or 'H').
 */
export function renderDots(ctx, maze, tick) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = maze[r][c];
      if (ch !== '.' && ch !== 'o') continue;

      const cx = c * TILE + TILE / 2;
      const cy = r * TILE + TILE / 2;

      if (ch === '.') {
        ctx.fillStyle = COLORS.dot;
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Power pellet — pulsing glow
        const pulse = Math.sin(tick * 0.1) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255,184,174,${pulse})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export function markDotEaten() {
  // No-op now — dots are rendered from maze state each frame
}

/**
 * Draw the fruit bonus item (Atari authentic).
 * Fruit appears in the center of the maze (row 17, col 14).
 */
export function renderFruit(ctx, tick, fruitScore) {
  const cx = 14 * TILE + TILE / 2;
  const cy = 17 * TILE + TILE / 2;
  const pulse = Math.sin(tick * 0.15) * 0.2 + 0.8;

  // Draw a simple fruit shape (cherry-like)
  // Left circle
  ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
  ctx.beginPath();
  ctx.arc(cx - 4, cy + 2, 4, 0, Math.PI * 2);
  ctx.fill();
  // Right circle
  ctx.beginPath();
  ctx.arc(cx + 4, cy + 2, 4, 0, Math.PI * 2);
  ctx.fill();
  // Stem
  ctx.strokeStyle = '#00aa00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 2);
  ctx.quadraticCurveTo(cx, cy - 8, cx + 2, cy - 2);
  ctx.stroke();
  // Leaves
  ctx.fillStyle = '#00cc00';
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy - 4, 3, 1.5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Score text below
  ctx.fillStyle = '#fff';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(fruitScore, cx, cy + 12);
}
