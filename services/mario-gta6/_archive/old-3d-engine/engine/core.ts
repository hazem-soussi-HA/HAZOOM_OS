/**
 * SUPER MARIO GTA6 — TypeScript Engine Core
 * ═══════════════════════════════════════════════════════════════
 * 
 * Migrated from JavaScript with:
 * - Strict typing
 * - ES modules
 * - Interface definitions
 * - Class-based architecture
 * 
 * To compile: npx tsc --outDir dist/ src/*.ts
 */

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

interface Vector2 {
    x: number;
    y: number;
}

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface Sprite {
    surface: HTMLImageElement | null;
    layer: number;
    visible: boolean;
    alpha: number;
    flipX: boolean;
    flipY: boolean;
}

interface Entity {
    id: number;
    type: string;
    pos: Vector2;
    vel: Vector2;
    sprite: Sprite;
    active: boolean;
    data: Record<string, any>;
}

interface Tile {
    type: number;
    solid: boolean;
    animated: boolean;
}

interface LevelData {
    version: string;
    width: number;
    height: number;
    tiles: Tile[][];
    entities: Array<{ type: string; x: number; y: number; data?: any }>;
    spawnX: number;
    spawnY: number;
}

interface GameState {
    level: LevelData | null;
    entities: Entity[];
    particles: Particle[];
    camera: Vector2;
    score: number;
    coins: number;
    lives: number;
    time: number;
    paused: boolean;
    state: 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'RACING';
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    kind: string;
}

interface InputState {
    keys: Record<string, boolean>;
    justPressed: Record<string, boolean>;
    touch: {
        left: boolean;
        right: boolean;
        jump: boolean;
        fire: boolean;
    };
}

interface Camera {
    x: number;
    y: number;
    lookahead: number;
    smoothness: number;
    shakeIntensity: number;
    shakeDuration: number;
    shakeTimer: number;
    zoom: number;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const TILE_SIZE = 48;
const LEVEL_WIDTH = 200;
const LEVEL_HEIGHT = 15;
const GRAVITY = 2200;
const JUMP_VEL = -680;
const SHORT_JUMP = -420;
const MAX_FALL = 900;
const WALK_SPEED = 220;
const RUN_SPEED = 380;
const GROUND_ACCEL = 35;
const AIR_ACCEL = 22;
const GROUND_DECEL = 28;
const AIR_DECEL = 15;
const JUMP_BUFFER = 0.12;
const JUMP_HOLD = 0.15;
const COYOTE_TIME = 0.10;

const SOLID_TILES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 14]);

const TILE_NAMES: Record<number, string> = {
    0: 'Empty', 1: 'Ground', 2: 'Brick', 3: 'Question',
    4: 'Pipe L', 5: 'Pipe R', 6: 'Pipe TL', 7: 'Pipe TR',
    8: 'Used', 9: 'Dirt', 10: 'Spike', 11: 'Spring',
    12: 'Flag', 13: 'Checkpoint', 14: 'Platform', 15: 'Coin',
    16: 'Dash Panel', 17: 'Shield Zone', 18: 'Harmony Flower',
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function aabbOverlap(ax: number, ay: number, aw: number, ah: number,
                     bx: number, by: number, bw: number, bh: number): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

// ═══════════════════════════════════════════════════════════════
// CAMERA CLASS
// ═══════════════════════════════════════════════════════════════

class GameCamera implements Camera {
    x = 0;
    y = 0;
    lookahead = 200;
    smoothness = 8;
    shakeIntensity = 0;
    shakeDuration = 0;
    shakeTimer = 0;
    zoom = 1;
    
    private _offsetX = 0;
    private _offsetY = 0;
    
    update(targetX: number, targetVX: number, dt: number, levelWidth: number, screenWidth: number): void {
        const direction = targetVX > 0 ? 1 : targetVX < 0 ? -1 : 0;
        let desired = targetX - screenWidth / 3 + this.lookahead * direction;
        desired = clamp(desired, 0, levelWidth - screenWidth);
        this.x = lerp(this.x, desired, Math.min(this.smoothness * dt, 1));
        
        // Shake
        this._offsetX = 0;
        this._offsetY = 0;
        if (this.shakeTimer < this.shakeDuration) {
            this.shakeTimer += dt;
            const progress = this.shakeTimer / this.shakeDuration;
            const decay = 1 - progress;
            const t = this.shakeTimer * 30;
            this._offsetX = Math.sin(t * 7.3) * this.shakeIntensity * decay;
            this._offsetY = Math.cos(t * 5.7) * this.shakeIntensity * decay;
        }
    }
    
    shake(intensity: number, duration: number): void {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = 0;
    }
    
    get offsetX(): number { return Math.floor(this._offsetX); }
    get offsetY(): number { return Math.floor(this._offsetY); }
}

// ═══════════════════════════════════════════════════════════════
// PARTICLE SYSTEM
// ═══════════════════════════════════════════════════════════════

class ParticleSystem {
    particles: Particle[] = [];
    maxParticles = 1000;
    
    spawn(x: number, y: number, vx: number, vy: number,
           life: number, size: number, color: string, kind: string = 'dust'): void {
        if (this.particles.length >= this.maxParticles) return;
        this.particles.push({ x, y, vx, vy, life, maxLife: life, size, color, kind });
    }
    
    spawnSpark(x: number, y: number, n: number = 8): void {
        for (let i = 0; i < n; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 200;
            const colors = ['#ffdc00', '#ffb432', '#ff9664', '#ff6496', '#c864ff'];
            this.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 80,
                      0.3 + Math.random() * 0.5, 2 + Math.floor(Math.random() * 4),
                      colors[Math.floor(Math.random() * colors.length)], 'spark');
        }
    }
    
    spawnPeace(x: number, y: number, n: number = 12): void {
        for (let i = 0; i < n; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 150;
            const colors = ['#b464ff', '#ff96c8', '#ffdc32', '#64ffff'];
            this.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 60,
                      0.4 + Math.random() * 0.6, 2 + Math.floor(Math.random() * 5),
                      colors[Math.floor(Math.random() * colors.length)], 'peace');
        }
    }
    
    update(dt: number, playerX: number = 0, playerY: number = 0): number {
        let collectedCoins = 0;
        const alive: Particle[] = [];
        
        for (const p of this.particles) {
            // Coin magnet
            if (p.kind === 'coin') {
                const dx = playerX - p.x;
                const dy = (playerY - 24) - p.y;
                const d = Math.hypot(dx, dy);
                if (d < 110 && d > 1) {
                    const force = 1400 * (1 - d / 110);
                    p.vx += (dx / d) * force * dt;
                    p.vy += (dy / d) * force * dt - 300 * dt;
            } else {
                p.vy += 2200 * 0.6 * dt;
            }
        } else {
            p.vy += 2200 * 0.5 * dt;
            }
            
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            
            if (p.life <= 0) {
                if (p.kind === 'coin') collectedCoins++;
            } else {
                alive.push(p);
            }
        }
        
        this.particles = alive;
        return collectedCoins;
    }
}

// ═══════════════════════════════════════════════════════════════
// LEVEL PARSER
// ═══════════════════════════════════════════════════════════════

function parseLevelString(s: string): Tile[][] {
    const rows = s.trim().split('\n').filter(r => r.trim());
    const tiles: Tile[][] = [];
    const legend: Record<string, number> = {
        '.': 0, 'G': 1, 'B': 2, 'Q': 3, 'P': 4, 'p': 5,
        'T': 6, 't': 7, 'U': 8, 'D': 9, 'S': 10, 'K': 11,
        'F': 12, 'C': 13, 'M': 14, 'O': 15,
    };
    
    for (let y = 0; y < LEVEL_HEIGHT; y++) {
        tiles[y] = [];
        const row = rows[rows.length - LEVEL_HEIGHT + y] || '';
        for (let x = 0; x < LEVEL_WIDTH; x++) {
            const ch = row[x] || '.';
            const tileType = legend[ch.toUpperCase()] || 0;
            tiles[y][x] = {
                type: tileType,
                solid: SOLID_TILES.has(tileType),
                animated: tileType === 3,
            };
        }
    }
    return tiles;
}

function createEmptyLevel(): LevelData {
    const tiles: Tile[][] = [];
    for (let y = 0; y < LEVEL_HEIGHT; y++) {
        tiles[y] = [];
        for (let x = 0; x < LEVEL_WIDTH; x++) {
            tiles[y][x] = { type: 0, solid: false, animated: false };
        }
    }
    return {
        version: '4.0',
        width: LEVEL_WIDTH,
        height: LEVEL_HEIGHT,
        tiles,
        entities: [],
        spawnX: 3 * TILE_SIZE,
        spawnY: (LEVEL_HEIGHT - 3) * TILE_SIZE,
    };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
    // Types
    Vector2, Rect, Sprite, Entity, Tile, LevelData, GameState,
    Particle, InputState, Camera,
    // Constants
    TILE_SIZE, LEVEL_WIDTH, LEVEL_HEIGHT, GRAVITY, JUMP_VEL,
    WALK_SPEED, RUN_SPEED, SOLID_TILES, TILE_NAMES,
    // Functions
    aabbOverlap, lerp, clamp, randomRange,
    parseLevelString, createEmptyLevel,
    // Classes
    GameCamera, ParticleSystem,
};
