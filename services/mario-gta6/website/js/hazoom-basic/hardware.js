// HAZOOM BASIC — Virtual Hardware Layer
// Simulates an 8-bit console: screen, sprites, sound, input, storage

const SCREEN_W = 160;
const SCREEN_H = 192;
const TILE_SIZE = 8;
const TILE_COLS = SCREEN_W / TILE_SIZE;  // 20
const TILE_ROWS = SCREEN_H / TILE_SIZE;  // 24
const MAX_SPRITES = 8;
const MAX_TILES = 256;
const PALETTE_SIZE = 16;

// HAZOOM Brand Palette — 16 colors optimized for retro gaming
// Primary: HAZOOM Red (#E63946), HAZOOM Gold (#FFD60A), HAZOOM Cyan (#00F5D4)
const PALETTE = [
  '#0A0A0F', // 0  HAZOOM Dark (near-black with blue tint)
  '#FFFFFF', // 1  White
  '#E63946', // 2  HAZOOM Red (hero color — HAZOOM himself)
  '#06D6A0', // 3  Emerald Green
  '#118AB2', // 4  Ocean Blue
  '#FFD60A', // 5  HAZOOM Gold (coins, stars, power-ups)
  '#F77F00', // 6  Orange
  '#9B5DE5', // 7  Purple (shadow agents / enemies)
  '#00F5D4', // 8  HAZOOM Cyan (sky, water)
  '#F15BB5', // 9  Pink/Magenta
  '#8B4513', // 10 Brown (ground, wood)
  '#6B8E23', // 11 Olive (bushes, nature)
  '#4A4A4A', // 12 Dark Gray (buildings, roads)
  '#808080', // 13 Light Gray (sidewalks)
  '#2D6A4F', // 14 Dark Green (pipes, nature)
  '#E76F51', // 15 Coral (accent)
];

class VirtualHardware {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    // Memory: 32KB
    this.ram = new Uint8Array(32768);

    // Screen buffers (double buffered)
    this.frameBuffer = new Uint8Array(SCREEN_W * SCREEN_H);  // pixel data (palette index)
    this.backBuffer = new Uint8Array(SCREEN_W * SCREEN_H);

    // Tile layers: background (0) and foreground (1)
    this.tileLayers = [
      new Uint8Array(TILE_COLS * TILE_ROWS),
      new Uint8Array(TILE_COLS * TILE_ROWS),
    ];
    this.tileDirty = [true, true];

    // Tile definitions: 256 tiles x 8x8 pixels (1 bit per pixel = 8 bytes per tile)
    this.tileData = new Uint8Array(MAX_TILES * TILE_SIZE * TILE_SIZE);

    // Sprite system
    this.sprites = [];
    for (let i = 0; i < MAX_SPRITES; i++) {
      this.sprites.push({ x: 0, y: 0, tile: 0, color: 1, enabled: false, flipX: false, flipY: false });
    }

    // Player state
    this.playerX = 80;
    this.playerY = 100;
    this.playerTile = 0;
    this.playerColor = 2;

    // Enemy state (4 enemies)
    this.enemies = [];
    for (let i = 0; i < 4; i++) {
      this.enemies.push({ x: 0, y: 0, tile: 0, color: 0, active: false, dx: 0, dy: 0 });
    }

    // Game state
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.frameCount = 0;

    // Current draw color
    this.drawColor = 1;
    this.bgColor = 0;
    this.activeLayer = 0;

    // Input state
    this.keys = {};
    this.prevKeys = {};
    this.buttonState = 0;

    // Sound
    this.audioCtx = null;
    this.soundQueue = [];

    // Storage (cartridge save)
    this.cartridge = new Uint8Array(8192);

    // Input tracking
    this._setupInput();

    // Initialize screen
    this.clearScreen();
  }

  _setupInput() {
    const keyMap = {
      'ArrowUp': 'UP', 'ArrowDown': 'DOWN', 'ArrowLeft': 'LEFT', 'ArrowRight': 'RIGHT',
      'KeyW': 'UP', 'KeyS': 'DOWN', 'KeyA': 'LEFT', 'KeyD': 'RIGHT',
      'Space': 'SPACE', 'Enter': 'ENTER', 'Escape': 'ESC',
      'KeyZ': 'A', 'KeyX': 'B', 'KeyC': 'C',
    };

    window.addEventListener('keydown', (e) => {
      const key = keyMap[e.code] || e.code;
      this.keys[key] = true;
      e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
      const key = keyMap[e.code] || e.code;
      this.keys[key] = false;
      e.preventDefault();
    });
  }

  // --- Screen Operations ---

  clearScreen() {
    this.backBuffer.fill(this.bgColor);
    for (let i = 0; i < this.tileLayers.length; i++) {
      this.tileLayers[i].fill(0);
      this.tileDirty[i] = true;
    }
  }

  setColor(color, bg) {
    this.drawColor = ((color % PALETTE_SIZE) + PALETTE_SIZE) % PALETTE_SIZE;
    if (bg !== undefined && bg !== null) {
      this.bgColor = ((bg % PALETTE_SIZE) + PALETTE_SIZE) % PALETTE_SIZE;
    }
  }

  setPixel(x, y, color) {
    x = x | 0; y = y | 0;
    if (x < 0 || x >= SCREEN_W || y < 0 || y >= SCREEN_H) return;
    this.backBuffer[y * SCREEN_W + x] = color !== undefined ? color : this.drawColor;
  }

  getPixel(x, y) {
    x = x | 0; y = y | 0;
    if (x < 0 || x >= SCREEN_W || y < 0 || y >= SCREEN_H) return 0;
    return this.backBuffer[y * SCREEN_W + x];
  }

  drawLine(x1, y1, x2, y2) {
    x1 = x1 | 0; y1 = y1 | 0; x2 = x2 | 0; y2 = y2 | 0;
    const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      this.setPixel(x1, y1);
      if (x1 === x2 && y1 === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x1 += sx; }
      if (e2 < dx) { err += dx; y1 += sy; }
    }
  }

  drawRect(x, y, w, h) {
    x = x | 0; y = y | 0; w = w | 0; h = h | 0;
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.setPixel(px, py);
      }
    }
  }

  drawCircle(cx, cy, r) {
    cx = cx | 0; cy = cy | 0; r = r | 0;
    let x = r, y = 0, d = 1 - r;
    while (x >= y) {
      this.setPixel(cx + x, cy + y); this.setPixel(cx - x, cy + y);
      this.setPixel(cx + x, cy - y); this.setPixel(cx - x, cy - y);
      this.setPixel(cx + y, cy + x); this.setPixel(cx - y, cy + x);
      this.setPixel(cx + y, cy - x); this.setPixel(cx - y, cy - x);
      y++;
      if (d < 0) { d += 2 * y + 1; }
      else { x--; d += 2 * (y - x) + 1; }
    }
  }

  // --- Tile Operations ---

  setTile(layer, tx, ty, tile) {
    layer = layer | 0; tx = tx | 0; ty = ty | 0; tile = tile | 0;
    if (tx < 0 || tx >= TILE_COLS || ty < 0 || ty >= TILE_ROWS) return;
    this.tileLayers[layer][ty * TILE_COLS + tx] = tile;
    this.tileDirty[layer] = true;
  }

  getTile(layer, tx, ty) {
    tx = tx | 0; ty = ty | 0;
    if (tx < 0 || tx >= TILE_COLS || ty < 0 || ty >= TILE_ROWS) return 0;
    return this.tileLayers[layer][ty * TILE_COLS + tx];
  }

  // Define a tile's pixel data (8x8, 1-bit: 0=transparent, 1=drawColor)
  defineTile(tileIndex, pixels) {
    tileIndex = tileIndex | 0;
    if (tileIndex < 0 || tileIndex >= MAX_TILES) return;
    const base = tileIndex * TILE_SIZE * TILE_SIZE;
    for (let i = 0; i < Math.min(pixels.length, TILE_SIZE * TILE_SIZE); i++) {
      this.tileData[base + i] = pixels[i] ? 1 : 0;
    }
    this.tileDirty[0] = true;
    this.tileDirty[1] = true;
  }

  // --- Sprite Operations ---

  setSprite(n, x, y, tile, color) {
    n = n | 0;
    if (n < 0 || n >= MAX_SPRITES) return;
    this.sprites[n].x = x | 0;
    this.sprites[n].y = y | 0;
    if (tile !== undefined) this.sprites[n].tile = tile | 0;
    if (color !== undefined) this.sprites[n].color = ((color % PALETTE_SIZE) + PALETTE_SIZE) % PALETTE_SIZE;
    this.sprites[n].enabled = true;
  }

  disableSprite(n) {
    if (n >= 0 && n < MAX_SPRITES) this.sprites[n].enabled = false;
  }

  // --- Player Operations ---

  setPlayer(x, y) {
    this.playerX = x | 0;
    this.playerY = y | 0;
  }

  movePlayer(dx, dy) {
    this.playerX = (this.playerX + dx) | 0;
    this.playerY = (this.playerY + dy) | 0;
    // Clamp to screen
    if (this.playerX < 0) this.playerX = 0;
    if (this.playerX >= SCREEN_W - TILE_SIZE) this.playerX = SCREEN_W - TILE_SIZE;
    if (this.playerY < 0) this.playerY = 0;
    if (this.playerY >= SCREEN_H - TILE_SIZE) this.playerY = SCREEN_H - TILE_SIZE;
  }

  // --- Enemy Operations ---

  setEnemy(n, x, y, tile, color) {
    n = n | 0;
    if (n < 0 || n >= this.enemies.length) return;
    this.enemies[n].x = x | 0;
    this.enemies[n].y = y | 0;
    this.enemies[n].tile = tile | 0;
    this.enemies[n].color = ((color % PALETTE_SIZE) + PALETTE_SIZE) % PALETTE_SIZE;
    this.enemies[n].active = true;
  }

  moveEnemy(n, dx, dy) {
    n = n | 0;
    if (n < 0 || n >= this.enemies.length || !this.enemies[n].active) return;
    this.enemies[n].x = (this.enemies[n].x + dx) | 0;
    this.enemies[n].y = (this.enemies[n].y + dy) | 0;
  }

  disableEnemy(n) {
    if (n >= 0 && n < this.enemies.length) this.enemies[n].active = false;
  }

  // --- Collision Detection ---

  collide(a, b) {
    // Simple AABB collision between sprite indices
    // a,b: 0=player, 1-4=enemies, 5-7=objects
    let ax, ay, bx, by;
    if (a === 0) { ax = this.playerX; ay = this.playerY; }
    else if (a >= 1 && a <= 4) { ax = this.enemies[a - 1].x; ay = this.enemies[a - 1].y; }
    else { ax = this.sprites[a - 5].x; ay = this.sprites[a - 5].y; }
    if (b === 0) { bx = this.playerX; by = this.playerY; }
    else if (b >= 1 && b <= 4) { bx = this.enemies[b - 1].x; by = this.enemies[b - 1].y; }
    else { bx = this.sprites[b - 5].x; by = this.sprites[b - 5].y; }

    const size = TILE_SIZE;
    return (ax < bx + size && ax + size > bx && ay < by + size && ay + size > by) ? 1 : 0;
  }

  // --- Input ---

  isKeyDown(key) { return !!this.keys[key]; }
  isKeyPressed(key) { return !!this.keys[key] && !this.prevKeys[key]; }
  updateInput() { this.prevKeys = { ...this.keys }; }

  // --- Sound ---

  initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playSound(freq, duration) {
    this.initAudio();
    if (!this.audioCtx) return;
    try {
      const dur = Math.max(0.05, duration / 60); // minimum 50ms to avoid clicks
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = Math.max(20, Math.min(20000, freq));
      gain.gain.value = 0.08;
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + dur);
    } catch (e) { /* ignore audio errors */ }
  }

  playMusic(pattern) {
    // Simple music patterns
    const patterns = [
      [262, 330, 392, 523],  // C-E-G-C ascending
      [523, 392, 330, 262],  // Descending
      [262, 294, 330, 349, 392, 440, 494, 523], // C major scale
      [392, 392, 440, 392, 523, 494], // Happy birthday start
    ];
    const notes = patterns[pattern % patterns.length];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playSound(freq, 8), i * 150);
    });
  }

  // --- Storage ---

  saveCartridge(name) {
    try {
      const data = {};
      for (let i = 0; i < this.cartridge.length; i++) {
        if (this.cartridge[i] !== 0) data[i] = this.cartridge[i];
      }
      data.score = this.score;
      data.lives = this.lives;
      data.level = this.level;
      localStorage.setItem('HAZOOM_' + name, JSON.stringify(data));
      return true;
    } catch (e) { return false; }
  }

  loadCartridge(name) {
    try {
      const raw = localStorage.getItem('HAZOOM_' + name);
      if (!raw) return false;
      const data = JSON.parse(raw);
      this.cartridge.fill(0);
      for (const [k, v] of Object.entries(data)) {
        if (!isNaN(k)) this.cartridge[parseInt(k)] = v;
      }
      this.score = data.score || 0;
      this.lives = data.lives || 3;
      this.level = data.level || 1;
      return true;
    } catch (e) { return false; }
  }

  // --- Memory Access ---

  poke(address, value) {
    address = address & 0x7FFF; // 32KB
    if (address < 32768) this.ram[address] = value & 0xFF;
  }

  peek(address) {
    address = address & 0x7FFF;
    if (address < 32768) return this.ram[address];
    return 0;
  }

  // --- Rendering ---

  render() {
    // Clear to background
    this.frameBuffer.fill(this.bgColor);

    // Draw tile layers
    for (let layer = 0; layer < 2; layer++) {
      for (let ty = 0; ty < TILE_ROWS; ty++) {
        for (let tx = 0; tx < TILE_COLS; tx++) {
          const tile = this.tileLayers[layer][ty * TILE_COLS + tx];
          if (tile === 0) continue;
          this._drawTile(tx * TILE_SIZE, ty * TILE_SIZE, tile);
        }
      }
    }

    // Draw sprites
    for (let i = 0; i < MAX_SPRITES; i++) {
      const s = this.sprites[i];
      if (!s.enabled) continue;
      this._drawTile(s.x, s.y, s.tile, s.color);
    }

    // Draw player
    this._drawTile(this.playerX, this.playerY, this.playerTile, this.playerColor);

    // Draw enemies
    for (const e of this.enemies) {
      if (!e.active) continue;
      this._drawTile(e.x, e.y, e.tile, e.color);
    }

    // Blit to canvas
    const imageData = this.ctx.createImageData(SCREEN_W, SCREEN_H);
    for (let i = 0; i < SCREEN_W * SCREEN_H; i++) {
      const colorIdx = this.frameBuffer[i] % PALETTE_SIZE;
      const hex = PALETTE[colorIdx];
      const r = parseInt(hex.substr(1, 2), 16);
      const g = parseInt(hex.substr(3, 2), 16);
      const b = parseInt(hex.substr(5, 2), 16);
      imageData.data[i * 4] = r;
      imageData.data[i * 4 + 1] = g;
      imageData.data[i * 4 + 2] = b;
      imageData.data[i * 4 + 3] = 255;
    }
    this.ctx.putImageData(imageData, 0, 0);

    this.frameCount++;
  }

  _drawTile(x, y, tileIndex, color) {
    const base = (tileIndex % MAX_TILES) * TILE_SIZE * TILE_SIZE;
    const c = color !== undefined ? (color % PALETTE_SIZE) : this.drawColor;
    for (let py = 0; py < TILE_SIZE; py++) {
      for (let px = 0; px < TILE_SIZE; px++) {
        if (this.tileData[base + py * TILE_SIZE + px]) {
          const sx = (x | 0) + px, sy = (y | 0) + py;
          if (sx >= 0 && sx < SCREEN_W && sy >= 0 && sy < SCREEN_H) {
            this.frameBuffer[sy * SCREEN_W + sx] = c;
          }
        }
      }
    }
  }

  // --- Frame ---

  frame() {
    this.updateInput();
    this.render();
  }

  // --- Pre-loaded Tile Definitions (firmware) ---
  // Called once at boot to populate tile data
  loadDefaultTiles() {
    // These will be populated by the BASIC program's tile definitions
    // For now, provide minimal fallback tiles
    const tiles = [];

    // Tile 0: Empty (all zeros - already default)

    // Tile 1: Brick pattern
    tiles[1] = [
      1,1,1,1,1,1,1,1,
      1,0,0,1,1,0,0,1,
      1,0,0,1,1,0,0,1,
      1,1,1,1,1,1,1,1,
      1,0,0,1,1,0,0,1,
      1,0,0,1,1,0,0,1,
      1,1,1,1,1,1,1,1,
      1,0,0,1,1,0,0,1,
    ];

    // Tile 2: Ground
    tiles[2] = [
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,1,1,1,
      1,1,0,1,1,1,0,1,
      1,1,1,1,1,1,1,1,
      0,1,1,1,0,1,1,1,
      1,1,1,1,1,1,1,1,
      1,0,1,1,1,0,1,1,
      1,1,1,1,1,1,1,1,
    ];

    // Tile 3: Question Block
    tiles[3] = [
      0,1,1,1,1,1,1,0,
      1,1,1,1,1,1,1,1,
      1,1,0,1,1,0,1,1,
      1,1,1,1,1,1,0,1,
      1,1,1,1,1,0,1,1,
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,0,1,1,
      1,1,1,1,1,1,1,1,
    ];

    // Tile 4: Pipe Top
    tiles[4] = [
      0,0,1,1,1,1,0,0,
      0,1,1,1,1,1,1,0,
      1,1,0,0,0,0,1,1,
      1,1,0,0,0,0,1,1,
      1,1,0,0,0,0,1,1,
      1,1,0,0,0,0,1,1,
      1,1,0,0,0,0,1,1,
      1,1,0,0,0,0,1,1,
    ];

    // Tile 5: Pipe Body
    tiles[5] = [
      1,1,0,0,0,0,1,1,
      1,1,0,0,0,0,1,1,
      1,1,0,0,0,0,1,1,
      1,1,0,0,0,0,1,1,
      1,1,0,0,0,0,1,1,
      1,1,0,0,0,0,1,1,
      1,1,0,0,0,0,1,1,
      1,1,0,0,0,0,1,1,
    ];

    // Tile 6: Coin
    tiles[6] = [
      0,0,1,1,1,1,0,0,
      0,1,1,1,1,1,1,0,
      1,1,0,0,0,0,1,1,
      1,1,0,1,1,0,1,1,
      1,1,0,1,1,0,1,1,
      1,1,0,0,0,0,1,1,
      0,1,1,1,1,1,1,0,
      0,0,1,1,1,1,0,0,
    ];

    // Tile 7: Cloud
    tiles[7] = [
      0,0,0,0,0,0,0,0,
      0,0,0,1,1,0,0,0,
      0,0,1,1,1,1,0,0,
      0,1,1,1,1,1,1,0,
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,1,1,1,
      0,1,1,1,1,1,1,0,
      0,0,0,0,0,0,0,0,
    ];

    // Tile 8: Bush
    tiles[8] = [
      0,0,0,0,0,0,0,0,
      0,0,0,1,1,0,0,0,
      0,0,1,1,1,1,0,0,
      0,1,1,1,1,1,1,0,
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,1,1,1,
      0,1,1,1,1,1,1,0,
    ];

    // Tile 9: Building
    tiles[9] = [
      1,1,1,1,1,1,1,1,
      1,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,1,
      1,1,1,1,1,1,1,1,
    ];

    // Tile 10: Window
    tiles[10] = [
      1,1,1,1,1,1,1,1,
      1,0,0,1,1,0,0,1,
      1,0,0,1,1,0,0,1,
      1,1,1,1,1,1,1,1,
      1,0,0,1,1,0,0,1,
      1,0,0,1,1,0,0,1,
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,1,1,1,
    ];

    // Tile 11: Road
    tiles[11] = [
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
      1,1,0,0,0,0,1,1,
      1,1,0,0,0,0,1,1,
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
    ];

    // Tile 12: Sidewalk
    tiles[12] = [
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,1,1,1,
    ];

    // Tile 13: Car
    tiles[13] = [
      0,0,0,0,0,0,0,0,
      0,0,1,1,1,1,0,0,
      0,1,1,1,1,1,1,0,
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,1,1,1,
      1,0,1,0,0,1,0,1,
      1,0,1,0,0,1,0,1,
      1,1,1,1,1,1,1,1,
    ];

    // Tile 14: Police Car
    tiles[14] = [
      0,0,0,0,0,0,0,0,
      0,0,1,1,1,1,0,0,
      0,1,1,1,1,1,1,0,
      1,1,1,1,1,1,1,1,
      1,0,1,0,1,0,1,1,
      1,1,1,1,1,1,1,1,
      1,0,1,0,0,1,0,1,
      1,0,1,0,0,1,0,1,
    ];

    // Tile 15: Star
    tiles[15] = [
      0,0,0,1,1,0,0,0,
      0,0,0,1,1,0,0,0,
      1,1,1,1,1,1,1,1,
      0,1,1,1,1,1,1,0,
      0,0,1,1,1,1,0,0,
      0,1,1,0,0,1,1,0,
      0,1,0,0,0,0,1,0,
      1,1,0,0,0,0,1,1,
    ];

    // Load all tiles into hardware
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i]) this.defineTile(i, tiles[i]);
    }
  }
}

if (typeof module !== 'undefined') module.exports = { VirtualHardware, SCREEN_W, SCREEN_H, PALETTE };
