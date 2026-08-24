// ═══════════════════════════════════════════════════════
//  config.js — Game constants, maze data, timings
// ═══════════════════════════════════════════════════════

export const TILE = 20;
export const COLS = 28;
export const ROWS = 31;

// Directions
export const UP = 1, DOWN = 2, LEFT = 3, RIGHT = 4;
export const DX = { [UP]: 0, [DOWN]: 0, [LEFT]: -1, [RIGHT]: 1 };
export const DY = { [UP]: -1, [DOWN]: 1, [LEFT]: 0, [RIGHT]: 0 };
export const OPP = { [UP]: DOWN, [DOWN]: UP, [LEFT]: RIGHT, [RIGHT]: LEFT };

// Ghost modes
export const SCATTER = 1, CHASE = 2, FRIGHT = 3, EATEN = 4;

// Mode cycle timings (from original BASIC)
export const MODE_TIMINGS = [
  [7, 20], [7, 20], [5, 20], [5, 1033], [0, 1037], [5, 1033], [0, 0]
];

// Ghost colors
export const GHOST_COLORS = {
  Blinky: '#ff0000',
  Pinky: '#ffb8ff',
  Inky: '#00ffff',
  Clyde: '#ffb852'
};

// Colors
export const COLORS = {
  wall: '#2121de',
  wallInner: '#1111aa',
  wallStroke: '#4444ff',
  dot: '#ffb8ae',
  pellet: '#ffb8ae',
  door: '#ffb8ff',
  pacman: '#ffff00',
  text: '#ffffff'
};

// Classic maze layout (unified from BASIC/JS/Python/AI)
export const MAZE_STR = [
  '############################',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o####.#####.##.#####.####o#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.#####.##.#####.######',
  '######.#####.##.#####.######',
  '######.##          ##.######',
  '######.## ###DD### ##.######',
  '######.## #HHHHHH# ##.######',
  'TTTTTT.   #HHHHHH#   .TTTTTT',
  '######.## #HHHHHH# ##.######',
  '######.## ######## ##.######',
  '######.##          ##.######',
  '######.## ######## ##.######',
  '######.## ######## ##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o..##.......  .......##..o#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################'
];

// Ghost scatter targets (from BASIC)
export const SCATTER_TARGETS = {
  Blinky: { x: 25, y: 0 },
  Pinky: { x: 2, y: 0 },
  Inky: { x: 27, y: 30 },
  Clyde: { x: 0, y: 30 }
};

// Ghost release delays (ticks)
export const RELEASE_DELAYS = {
  Blinky: 0,
  Pinky: 60,
  Inky: 240,
  Clyde: 360
};

// Tunnel rows/cols — ghosts slow down here
export const TUNNEL_ROWS = [14];
export const TUNNEL_COLS_LEFT = [0, 1, 2, 3, 4, 5];
export const TUNNEL_COLS_RIGHT = [22, 23, 24, 25, 26, 27];
export const TUNNEL_SLOW_FACTOR = 2; // ghosts move half speed in tunnel

// ── Atari-authentic scoring ──
export const SCORE_DOT = 10;
export const SCORE_PELLET = 50;
export const SCORE_GHOST_BASE = 200; // doubles per ghost: 200, 400, 800, 1600
export const SCORE_BONUS_LIFE = 10000;

// Fruit bonus values per level (Atari authentic)
export const FRUIT_POINTS = [100, 300, 500, 700, 1000, 2000, 3000, 5000];
export const FRUIT_DOTS_TRIGGER = 70; // first fruit at 70 dots, second at 170

// Fright mode duration in ticks (decreases per level, Atari authentic)
// Level 1: 6sec, Level 2: 5sec, Level 3: 4sec, Level 4: 3sec, Level 5+: 2sec
export function getFrightDuration(level) {
  if (level <= 1) return 360; // 6 sec at 60fps
  if (level <= 2) return 300; // 5 sec
  if (level <= 3) return 240; // 4 sec
  if (level <= 4) return 180; // 3 sec
  return 120; // 2 sec for level 5+
}
