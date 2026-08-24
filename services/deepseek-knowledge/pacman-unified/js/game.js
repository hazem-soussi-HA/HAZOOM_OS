// ═══════════════════════════════════════════════════════
//  game.js — Main game loop, state machine, orchestration
// ═══════════════════════════════════════════════════════

import { TILE, COLS, ROWS, SCATTER, CHASE, FRIGHT, MODE_TIMINGS, LEFT, SCORE_DOT, SCORE_PELLET, SCORE_GHOST_BASE, SCORE_BONUS_LIFE, FRUIT_POINTS, FRUIT_DOTS_TRIGGER, getFrightDuration } from './config.js';
import { ensureAudio, sfxDeath, sfxLevel, toggleMute } from './audio.js';
import { parseMaze, renderMazeCached, renderDots, renderFruit } from './maze.js';
import { createPacman, updatePacman, renderPacman } from './pacman.js';
import { createGhosts, updateGhosts, checkGhostCollision, renderGhosts } from './ghost.js';
import { initInput, consumePause, consumeMute, resetNextDir } from './input.js';
import { updateHUD } from './hud.js';
import { connectWallet, getWallet, onWalletChange } from './wallet.js';

// ── Canvas setup ──
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
canvas.width = COLS * TILE;
canvas.height = ROWS * TILE;

// Double buffer
const buf = document.createElement('canvas');
buf.width = canvas.width;
buf.height = canvas.height;
const bx = buf.getContext('2d');

// Maze static cache (offscreen canvas, drawn once)
let mazeCache = null;

function buildMazeCache(maze) {
  mazeCache = document.createElement('canvas');
  mazeCache.width = buf.width;
  mazeCache.height = buf.height;
  const mctx = mazeCache.getContext('2d');
  renderMazeCached(mctx, maze);
}

// ── Game state ──
let maze = [];
let totalDots = 0;
let dotsEaten = 0;
let score = 0;
let lives = 3;
let level = 1;
let pacman = null;
let ghosts = null;
let highScore = parseInt(localStorage.getItem('pm_hi') || '0');
let gameState = 'menu';
let deathTimer = 0;
let levelTimer = 0;
let tick = 0;
let modeCycleIdx = 0;
let currentMode = SCATTER;
let modeTimer = 0;
let ghostEatMult = 1;
let anyGhostFrightened = false;
let ghostMoveTimer = 0;
let pacmanMoveTimer = 0;
const PACMAN_MOVE_INTERVAL = 2;
const GHOST_MOVE_INTERVAL = 1; // ghosts slightly faster (Atari authentic)

// ── Fruit bonus system (Atari authentic) ──
let fruitTimer = 0;
let fruitVisible = false;
let fruitEaten = false;
let showFruit = false;
let fruitScore = 0;

// ── Bonus life tracking ──
let lastBonusScore = 0;

// ── Frame timing ──
const TARGET_FPS = 60;
const FRAME_MS = 1000 / TARGET_FPS;
let lastTs = 0;
let animHandle = null;
let lastRenderTick = -1;

// ── Keep input.js synced with current pacman ──
function syncPacman(p) {
  window.__pacman = p;
}

// ── Init ──
function initLevel() {
  const parsed = parseMaze();
  maze = parsed.maze;
  totalDots = parsed.totalDots;
  dotsEaten = 0;
  pacman = createPacman();
  ghosts = createGhosts();
  syncPacman(pacman);
  window.__ghosts = ghosts;
  modeCycleIdx = 0;
  currentMode = SCATTER;
  modeTimer = MODE_TIMINGS[0][0] * 60;
  ghostEatMult = 1;
  // Fruit system reset
  fruitVisible = false;
  fruitEaten = false;
  showFruit = false;
  fruitTimer = 0;
  fruitScore = FRUIT_POINTS[Math.min(level - 1, FRUIT_POINTS.length - 1)];
  lastBonusScore = Math.floor(score / SCORE_BONUS_LIFE) * SCORE_BONUS_LIFE;
  buildMazeCache(maze);
}

function resetPositions() {
  pacman.x = 14;
  pacman.y = 23;
  pacman.dir = LEFT;
  pacman.nextDir = LEFT;
  resetNextDir(LEFT);
  syncPacman(pacman);          // <-- pacman object is same, but sync anyway
  ghosts.forEach(g => {
    g.x = g.homeX;
    g.y = g.homeY;
    g.dir = LEFT;
    g.mode = SCATTER;
    g.released = g.releaseTimer <= 0;
    g.frightened = 0;
  });
  modeCycleIdx = 0;
  currentMode = SCATTER;
  modeTimer = MODE_TIMINGS[0][0] * 60;
}

function syncFrightenedFlag() {
  anyGhostFrightened = ghosts ? ghosts.some(g => g.mode === FRIGHT) : false;
}

// ── Mode timer ──
function updateModeTimer() {
  if (anyGhostFrightened) return;
  modeTimer--;
  if (modeTimer > 0) return;
  modeCycleIdx++;
  if (modeCycleIdx >= MODE_TIMINGS.length) modeCycleIdx = MODE_TIMINGS.length - 1;
  currentMode = currentMode === SCATTER ? CHASE : SCATTER;
  ghosts.forEach(g => {
    if (g.mode !== FRIGHT && g.mode !== 4 && g.released) {
      g.mode = currentMode;
      const OPP = { 1: 2, 2: 1, 3: 4, 4: 3 };
      g.dir = OPP[g.dir];
    }
  });
  const t = MODE_TIMINGS[modeCycleIdx];
  modeTimer = (currentMode === SCATTER ? t[0] : t[1]) * 60;
}

// ── Render ──
function render() {
  bx.fillStyle = '#000';
  bx.fillRect(0, 0, buf.width, buf.height);

  if (mazeCache) bx.drawImage(mazeCache, 0, 0);

  renderDots(bx, maze, tick);

  if (showFruit) renderFruit(bx, tick, fruitScore);

  renderGhosts(bx, ghosts, tick);
  if (gameState !== 'dying') renderPacman(bx, pacman);
  renderDeath(bx);

  ctx.drawImage(buf, 0, 0);
}

function renderDeath() {
  if (gameState !== 'dying') return;
  const progress = 1 - deathTimer / 90;
  const cx = pacman.x * TILE + TILE / 2;
  const cy = pacman.y * TILE + TILE / 2;
  const r = TILE / 2 - 1;
  bx.fillStyle = '#ffff00';
  bx.beginPath();
  bx.arc(cx, cy, r * (1 - progress), progress * Math.PI, Math.PI * 2 - progress * Math.PI);
  bx.lineTo(cx, cy);
  bx.closePath();
  bx.fill();
}

// ── Overlay ──
function showOverlay(title, sub, btn) {
  const ov = document.getElementById('ov');
  ov.innerHTML = `
    <h1>${title}</h1>
    <h2>${sub}</h2>
    <button class="btn" id="rbtn">${btn}</button>
    <div class="sub">WASD / Arrows &bull; P pause &bull; M mute</div>
  `;
  ov.classList.add('active');
  document.getElementById('rbtn').onclick = () => {
    ensureAudio();
    startGame();
  };
}

function hideOverlay() {
  document.getElementById('ov').classList.remove('active');
}

function startGame() {
  ensureAudio();
  score = 0;
  lives = 3;
  level = 1;
  initLevel();                 // creates new pacman + syncs to window.__pacman
  gameState = 'playing';
  hideOverlay();
  lastTs = 0;
  lastRenderTick = -1;
  updateHUD(score, highScore, level, lives, ghosts);
}

// ── Main loop ──
function loop(ts) {
  animHandle = requestAnimationFrame(loop);

  if (lastTs === 0) lastTs = ts;
  const elapsed = ts - lastTs;
  if (elapsed < FRAME_MS) return;
  lastTs = ts - (elapsed % FRAME_MS);
  tick++;

  if (consumePause()) {
    if (gameState === 'playing') {
      gameState = 'paused';
      showOverlay('PAUSED', '', 'RESUME');
    } else if (gameState === 'paused') {
      gameState = 'playing';
      hideOverlay();
      lastTs = 0;
    }
  }
  if (consumeMute()) toggleMute();

  if (gameState === 'playing') {
    // Pacman moves every N ticks
    pacmanMoveTimer++;
    if (pacmanMoveTimer >= PACMAN_MOVE_INTERVAL) {
      pacmanMoveTimer = 0;
      const evt = updatePacman(pacman, maze, tick);
      if (evt === 'eat') {
        score += SCORE_DOT; dotsEaten++;
        // Check for fruit spawn (at 70 and 170 dots)
        if (!fruitVisible && !fruitEaten && (dotsEaten === FRUIT_DOTS_TRIGGER || dotsEaten === FRUIT_DOTS_TRIGGER * 2 + 30)) {
          fruitVisible = true;
          showFruit = true;
          fruitTimer = 600; // 10 seconds at 60fps
        }
      } else if (evt === 'power') {
        score += SCORE_PELLET; dotsEaten++;
        // Fright mode with authentic duration
        const frightDur = getFrightDuration(level);
        ghosts.forEach(g => {
          if (g.mode !== 4 && g.released) {
            g.mode = FRIGHT;
            g.frightened = frightDur;
            g.dir = { 1: 2, 2: 1, 3: 4, 4: 3 }[g.dir];
          }
        });
        ghostEatMult = 1;
      }

      // Check fruit collision
      if (showFruit && pacman.x === 14 && pacman.y === 17) {
        score += fruitScore;
        showFruit = false;
        fruitEaten = true;
      }

      // Check bonus life at 10,000 points
      if (score - lastBonusScore >= SCORE_BONUS_LIFE) {
        lives++;
        lastBonusScore += SCORE_BONUS_LIFE;
      }
    } else {
      // Still animate mouth even when not moving
      pacman.mouth += pacman.mouthD;
      if (pacman.mouth > 2) pacman.mouthD = -1;
      if (pacman.mouth < 0) pacman.mouthD = 1;
    }

    // Decrement invulnerability
    if (pacman.invuln > 0) pacman.invuln--;

    // Ghosts move every N frames (tick throttle)
    ghostMoveTimer++;
    if (ghostMoveTimer >= GHOST_MOVE_INTERVAL) {
      ghostMoveTimer = 0;
      updateGhosts(ghosts, pacman, maze, currentMode, tick);
    }
    // Fruit timer countdown
    if (showFruit) {
      fruitTimer--;
      if (fruitTimer <= 0) {
        showFruit = false;
        fruitEaten = true;
      }
    }

    updateModeTimer();

    const gc = checkGhostCollision(pacman, ghosts);
    if (gc === 'eat') { score += 200 * ghostEatMult; ghostEatMult *= 2; }
    else if (gc === 'die') {
      gameState = 'dying';
      deathTimer = 90;
      sfxDeath();
    }

    // Sync frightened flag for next frame's mode timer
    syncFrightenedFlag();

    if (dotsEaten >= totalDots) {
      gameState = 'levelup';
      levelTimer = 90;
      sfxLevel();
    }
  } else if (gameState === 'dying') {
    deathTimer--;
    if (deathTimer <= 0) {
      lives--;
      if (lives <= 0) {
        gameState = 'gameover';
        if (score > highScore) { highScore = score; localStorage.setItem('pm_hi', highScore); }
        showOverlay('GAME OVER', `Score: ${score} — High: ${highScore}`, 'RETRY');
      } else {
        resetPositions();
        gameState = 'playing';
      }
    }
  } else if (gameState === 'levelup') {
    levelTimer--;
    if (levelTimer <= 0) { level++; initLevel(); gameState = 'playing'; }
  }

  if (tick !== lastRenderTick && gameState !== 'paused') {
    lastRenderTick = tick;
    render();
    updateHUD(score, highScore, level, lives, ghosts);
  }
}

// ── Responsive ──
function resize() {
  // Fit canvas inside viewport with padding for HUD
  const pad = window.innerWidth <= 600 ? 8 : 16;
  const hudH = window.innerWidth <= 600 ? 50 : 70;
  const maxW = window.innerWidth - pad * 2;
  const maxH = window.innerHeight - hudH - pad * 2;
  const s = Math.min(maxW / canvas.width, maxH / canvas.height, 1.5);
  canvas.style.width = Math.round(canvas.width * s) + 'px';
  canvas.style.height = Math.round(canvas.height * s) + 'px';
}

// ── Boot ──
function boot() {
  window.addEventListener('resize', resize);
  resize();
  initLevel();
  initInput(pacman);
  updateHUD(score, highScore, level, lives, ghosts);
  render();
  animHandle = requestAnimationFrame(loop);

  document.getElementById('go').onclick = () => {
    ensureAudio();
    startGame();
  };

  // Wallet connect button
  const walletBtn = document.getElementById('wallet-btn');
  walletBtn.onclick = async () => {
    const result = await connectWallet();
    if (result.success) {
      walletBtn.textContent = result.address.slice(0, 6) + '...' + result.address.slice(-4);
      walletBtn.style.background = '#2121de';
    } else {
      walletBtn.textContent = result.error || 'Connect Wallet';
    }
  };

  // Listen for wallet changes
  onWalletChange((event) => {
    if (event.type === 'account' && event.address) {
      walletBtn.textContent = event.address.slice(0, 6) + '...' + event.address.slice(-4);
    }
  });
}

boot();
