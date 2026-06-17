// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.
//
// ENGINE: PHYSICS WASM BRIDGE (V1.8.0)
// Loads the Rust-compiled WebAssembly physics module and exposes a
// JS-friendly API. Falls back to a JS shim (no-ops + warning) if the
// WASM binary fails to load or WebAssembly is not supported.
//
// Bridge design: each frame we copy enemy / fireball / car / particle /
// popup data into the WASM linear memory, call step(), and read state back.
// To minimize per-frame marshalling cost, the JS-side arrays are kept as
// plain Float32Array / Uint8Array views over the same buffer that the
// WASM reads, so syncing is a single .set() per frame.

const PHYSICS_WASM_URL = 'mario_gta6_physics_bg.wasm?v=' + Date.now();

const WASM = {
    ready: false,
    failed: false,
    exports: null,
    memory: null,
    mem: null,
    // Views into WASM memory
    mapBytes: null,       // Uint8Array, 4000 bytes
    playerBytes: null,    // Uint8Array, 64 bytes
    playerF32: null,      // Float32Array, 16 floats
    inputF32: null,       // Float32Array, 6 floats
    eventsBytes: null,    // Uint8Array, 256 bytes
    eventCountU32: null,  // Uint32Array, 1
    enemiesF32: null,     // Float32Array, 64*8 = 512 floats
    enemiesBytes: null,   // Uint8Array, 64*32 = 2048
    fireballsF32: null,   // Float32Array, 8*8 = 64 floats
    fireballsBytes: null, // Uint8Array, 8*32 = 256
    carsF32: null,        // Float32Array, 8*8 = 64 floats
    carsBytes: null,      // Uint8Array, 8*32 = 256
    particlesF32: null,   // Float32Array, 256*6 = 1536 floats
    particlesBytes: null, // Uint8Array, 256*24 = 6144
    popupsF32: null,      // Float32Array, 32*6 = 192 floats
    popupsBytes: null,    // Uint8Array, 32*24 = 768
};

const EV = {
    COIN: 1, QUESTION: 2, BRICK: 3, PIT_DEATH: 4, STOMP: 5, SHELL_KICK: 6,
    POWERUP_COLLECT: 7, TIMEOUT: 8, LIFE_LOST: 9, BUMP: 10, TIME_OUT: 11,
};

async function loadWasm() {
    if (typeof WebAssembly === 'undefined') {
        console.warn('[WASM] WebAssembly not supported, using JS physics');
        WASM.failed = true;
        return false;
    }
    try {
        const response = await fetch(PHYSICS_WASM_URL);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const bytes = await response.arrayBuffer();
        const module = await WebAssembly.compile(bytes);
        const instance = await WebAssembly.instantiate(module, {});
        WASM.exports = instance.exports;
        WASM.memory = instance.exports.memory;
        WASM.mem = new DataView(WASM.memory.buffer);

        instance.exports.physics_init();

        // The Rust `BUFFER` static is dynamically allocated by the compiler
        // (it's a 64KB static, which rustc places in grown memory).
        // physics_init() returns the actual base address. ALL typed array views
        // must be offset by this base, otherwise JS reads/writes go to the
        // initial 1MB (which is always zero) instead of the real BUFFER.
        const BASE = instance.exports.physics_init() | 0;
        WASM.base = BASE;

        // Bind typed array views once, offset by BASE.
        const b = WASM.memory.buffer;
        WASM.mapBytes       = new Uint8Array(b, BASE + 16384, 4000);
        WASM.playerBytes    = new Uint8Array(b, BASE + 4288, 64);
        WASM.playerF32      = new Float32Array(b, BASE + 4288, 16);
        WASM.inputF32       = new Float32Array(b, BASE + 4096, 6);
        WASM.eventsBytes    = new Uint8Array(b, BASE + 4352, 256);
        WASM.eventCountU32  = new Uint32Array(b, BASE + 4500, 1);
        WASM.enemiesF32     = new Float32Array(b, BASE + 20480, 64 * 8);
        WASM.enemiesBytes   = new Uint8Array(b, BASE + 20480, 2048);
        WASM.fireballsF32   = new Float32Array(b, BASE + 22528, 8 * 8);
        WASM.fireballsBytes = new Uint8Array(b, BASE + 22528, 256);
        WASM.carsF32        = new Float32Array(b, BASE + 22784, 8 * 8);
        WASM.carsBytes      = new Uint8Array(b, BASE + 22784, 256);
        WASM.particlesF32   = new Float32Array(b, BASE + 23040, 256 * 6);
        WASM.particlesBytes = new Uint8Array(b, BASE + 23040, 6144);
        WASM.popupsF32      = new Float32Array(b, BASE + 29184, 32 * 6);
        WASM.popupsBytes    = new Uint8Array(b, BASE + 29184, 768);

        // Read version string
        const verPtr = instance.exports.version();
        const verBytes = new Uint8Array(b, verPtr, 8);
        let ver = '';
        for (let i = 0; i < 8 && verBytes[i] !== 0; i++) ver += String.fromCharCode(verBytes[i]);
        console.log('[WASM] Physics module v' + ver + ' loaded');

        WASM.ready = true;
        return true;
    } catch (e) {
        console.warn('[WASM] Failed to load physics WASM:', e);
        WASM.failed = true;
        return false;
    }
}

// One-time initial map sync (called from initGame)
function syncMapToWasm(lvl) {
    if (!WASM.ready) return;
    const w = lvl.length ? lvl[0].length : 0;
    const h = lvl.length;
    const buf = WASM.mapBytes;
    let k = 0;
    for (let y = 0; y < h; y++) {
        const row = lvl[y];
        for (let x = 0; x < w; x++) buf[k++] = row[x] | 0;
    }
    // Write WW/WH via the typed arrays (which are BASE-offset) not the DataView
    // (which is at offset 0 and would clobber the wrong memory).
    const cfg = new Int32Array(WASM.memory.buffer, WASM.base + 0, 2);
    cfg[0] = w; cfg[1] = h;
}

// Sync player state to WASM. Player physics stays in JS, so this is mostly
// a write of the values JS just produced.
function syncPlayerToWasm(g) {
    if (!WASM.ready) return;
    const f = WASM.playerF32;
    const b = WASM.playerBytes;
    f[0] = g.px; f[1] = g.py; f[2] = g.pvx; f[3] = g.pvy;
    f[4] = g.pAir ? 1 : 0;
    f[5] = g.pCoyote; f[6] = g.pJbuf; f[7] = g.pJhold;
    b[32] = g.pJmp ? 1 : 0;
    b[33] = g.pWasG ? 1 : 0;
    b[34] = g.pDir > 0 ? 1 : 0xFF;
    b[35] = (g.pMode | 0) & 0xFF;
    f[9] = g.pInv; f[10] = g.pStar;
    f[11] = g.pSqX; f[12] = g.pSqY;
    f[14] = g.time;
}

function syncPlayerFromWasm(g) {
    if (!WASM.ready) return;
    const f = WASM.playerF32;
    const b = WASM.playerBytes;
    g.pInv = f[9];
    g.pStar = f[10];
    g.time = f[14];
}

// Enemy sync: write JS object arrays into the WASM flat buffer.
// Per-enemy layout: 8 floats (x, y, vx, vy, t, hp_as_float, shellvx, py)
// + 6 bytes (hp, type, shell, _, putype, active)
function syncEnemiesToWasm(enemies) {
    if (!WASM.ready) return;
    const f = WASM.enemiesF32;
    const b = WASM.enemiesBytes;
    // Zero out HP for unused slots
    const n = enemies.length;
    for (let i = 0; i < 64; i++) {
        const fo = i * 8;
        const bo = i * 32;
        const e = i < n ? enemies[i] : null;
        if (!e) {
            b[bo + 20] = 0; // hp = 0
            b[bo + 21] = 0; // type
            b[bo + 22] = 0; // shell
            b[bo + 29] = 0; // active
            continue;
        }
        f[fo + 0] = e.x || 0;
        f[fo + 1] = e.y || 0;
        f[fo + 2] = e.vx || 0;
        f[fo + 3] = e.vy || 0;
        f[fo + 4] = e.t || 0;
        f[fo + 6] = e.shellVx || 0;
        f[fo + 7] = e.py != null ? e.py : (e.y || 0);
        b[bo + 20] = (e.hp || 0) & 0xFF;
        let ety = 0;
        if (e.type === 'goomba') ety = 0;
        else if (e.type === 'koopa') ety = 1;
        else if (e.type === 'shell') ety = 2;
        else if (e.type === 'powerup') ety = 3;
        b[bo + 21] = ety;
        b[bo + 22] = e.shell ? 1 : 0;
        b[bo + 28] = e.puType === 'fire' ? 1 : (e.puType === 'star' ? 2 : 0);
        b[bo + 29] = e.active ? 1 : 0;
    }
}

function syncEnemiesFromWasm(enemies) {
    if (!WASM.ready) return;
    const f = WASM.enemiesF32;
    const b = WASM.enemiesBytes;
    for (let i = 0; i < enemies.length && i < 64; i++) {
        const e = enemies[i];
        const fo = i * 8;
        const bo = i * 32;
        e.x = f[fo + 0];
        e.y = f[fo + 1];
        e.vx = f[fo + 2];
        e.vy = f[fo + 3];
        e.t = f[fo + 4];
        e.hp = (b[bo + 20] << 24) >> 24; // sign-extend i8
        e.shell = b[bo + 22] !== 0;
        e.shellVx = f[fo + 6];
        const pu = b[bo + 28];
        e.puType = pu === 1 ? 'fire' : pu === 2 ? 'star' : 'mushroom';
        e.active = b[bo + 29] !== 0;
        e.py = f[fo + 7];
    }
}

// Tile-mutation dirty set: skip the 4000-byte scan unless something changed
const _dirtyTiles = new Set();
function markTileDirty(tx, ty) { _dirtyTiles.add(ty * 4096 + tx); }

function syncMapFromWasm(lvl) {
    if (!WASM.ready || _dirtyTiles.size === 0) return;
    const w = lvl.length ? lvl[0].length : 0;
    const buf = WASM.mapBytes;
    for (const k of _dirtyTiles) {
        const ty = (k / 4096) | 0;
        const tx = k - ty * 4096;
        if (tx >= 0 && ty >= 0 && tx < w && ty < lvl.length) {
            lvl[ty][tx] = buf[ty * w + tx];
        }
    }
    _dirtyTiles.clear();
}

function syncFireballsToWasm(fireballs) {
    if (!WASM.ready) return;
    const f = WASM.fireballsF32;
    const b = WASM.fireballsBytes;
    for (let i = 0; i < 8; i++) {
        const fo = i * 8;
        const bo = i * 32;
        const fb = i < fireballs.length ? fireballs[i] : null;
        if (!fb) { b[bo + 17] = 0; continue; }
        f[fo + 0] = fb.x || 0;
        f[fo + 1] = fb.y || 0;
        f[fo + 2] = fb.vx || 0;
        f[fo + 3] = fb.vy || 0;
        b[bo + 16] = (fb.bounces || 0) & 0xFF;
        b[bo + 17] = 1;
    }
}

function syncFireballsFromWasm(fireballs) {
    if (!WASM.ready) return;
    const f = WASM.fireballsF32;
    const b = WASM.fireballsBytes;
    for (let i = fireballs.length - 1; i >= 0 && i < 8; i--) {
        const fb = fireballs[i];
        const fo = i * 8;
        const bo = i * 32;
        if (b[bo + 17] === 0) { fireballs.splice(i, 1); continue; }
        fb.x = f[fo + 0];
        fb.y = f[fo + 1];
        fb.vx = f[fo + 2];
        fb.vy = f[fo + 3];
        fb.bounces = (b[bo + 16] << 24) >> 24;
    }
}

function syncCarsToWasm(cars) {
    if (!WASM.ready) return;
    const f = WASM.carsF32;
    const b = WASM.carsBytes;
    for (let i = 0; i < 8; i++) {
        const fo = i * 8;
        const bo = i * 32;
        const c = i < cars.length ? cars[i] : null;
        if (!c) { b[bo + 12] = 0; continue; }
        f[fo + 0] = c.x || 0;
        f[fo + 1] = c.y || 0;
        f[fo + 2] = c.vx || 0;
        b[bo + 12] = 1;
    }
}

function syncCarsFromWasm(cars) {
    if (!WASM.ready) return;
    const f = WASM.carsF32;
    for (let i = 0; i < cars.length && i < 8; i++) {
        const fo = i * 8;
        const c = cars[i];
        c.x = f[fo + 0];
        c.y = f[fo + 1];
        c.vx = f[fo + 2];
    }
}

function syncParticlesToWasm(particles) {
    if (!WASM.ready) return;
    const f = WASM.particlesF32;
    const b = WASM.particlesBytes;
    // Mark all slots dead (life = 0)
    for (let i = 0; i < 256; i++) b[i * 24 + 0] = 0;
    const n = Math.min(particles.length, 256);
    for (let i = 0; i < n; i++) {
        const p = particles[i];
        const fo = i * 6;
        f[fo + 0] = p.x;
        f[fo + 1] = p.y;
        f[fo + 2] = p.vx;
        f[fo + 3] = p.vy;
        f[fo + 4] = p.life;
    }
}

function syncParticlesFromWasm(particles) {
    if (!WASM.ready) return;
    const f = WASM.particlesF32;
    const n = Math.min(particles.length, 256);
    for (let i = 0; i < n; i++) {
        const p = particles[i];
        const fo = i * 6;
        p.x = f[fo + 0];
        p.y = f[fo + 1];
        p.vx = f[fo + 2];
        p.vy = f[fo + 3];
        p.life = f[fo + 4];
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}

function syncPopupsToWasm(popups) {
    if (!WASM.ready) return;
    const f = WASM.popupsF32;
    const b = WASM.popupsBytes;
    for (let i = 0; i < 32; i++) b[i * 24 + 16] = 0;
    const n = Math.min(popups.length, 32);
    for (let i = 0; i < n; i++) {
        const p = popups[i];
        const fo = i * 6;
        f[fo + 0] = p.x;
        f[fo + 1] = p.y;
        f[fo + 4] = p.life;
        b[i * 24 + 16] = 1;
    }
}

function syncPopupsFromWasm(popups) {
    if (!WASM.ready) return;
    const f = WASM.popupsF32;
    for (let i = 0; i < popups.length && i < 32; i++) {
        const fo = i * 6;
        popups[i].y = f[fo + 1];
        popups[i].life = f[fo + 4];
    }
    for (let i = popups.length - 1; i >= 0; i--) {
        if (popups[i].life <= 0) popups.splice(i, 1);
    }
}

// Drain events
function drainEvents() {
    if (!WASM.ready) return [];
    const n = WASM.eventCountU32[0];
    if (n === 0) return [];
    const out = new Array(n);
    const b = WASM.eventsBytes;
    // Use BASE-offset views to read tx/ty/x/y (the DataView at offset 0 is wrong)
    const evI32 = new Int32Array(WASM.memory.buffer, WASM.base + 4352, n * 4);
    const evF32 = new Float32Array(WASM.memory.buffer, WASM.base + 4352, n * 4);
    for (let i = 0; i < n; i++) {
        const off = i * 4; // in i32/f32 units (4 bytes per unit)
        const type = b[i * 16 + 0];
        const tx = evI32[off + 0];
        const ty = evI32[off + 1];
        const x = evF32[off + 2];
        const y = evF32[off + 3];
        out[i] = { type, tx, ty, x, y };
        if (type === 1 || type === 2 || type === 3) markTileDirty(tx, ty);
    }
    WASM.exports.clear_events();
    return out;
}

function stepWasm(dt) {
    if (!WASM.ready) return [];
    // dt must be set before step() or it returns early
    WASM.inputF32[4] = dt;
    WASM.exports.step();
    return drainEvents();
}

function setInput(ax, jmp, run, fire, dt) {
    if (!WASM.ready) return;
    const f = WASM.inputF32;
    f[0] = ax;
    f[1] = jmp ? 1.0 : 0.0;
    f[2] = run ? 1.0 : 0.0;
    f[3] = fire ? 1.0 : 0.0;
    f[4] = dt;
}
