// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../TRADEMARKS.md and ../NOTICE_TO_IP_HOLDERS.md.
//
// Physics hot path compiled to WebAssembly.
// Mirrors website/js/engine/physics.js + website/js/entities/enemies.js
// line-for-line, but in idiomatic Rust with branch-free tile lookup.

#![no_std]

use core::ptr;

#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    loop {}
}

// ═══════════════════════════════════════════════════════════════════════
// MEMORY LAYOUT (in bytes from start of linear memory)
//
//   0      4096   STATIC_CONFIG  (read-only after init, exposed to JS)
//   4096   4208   INPUT          (6 × f32 = 24 bytes, padded to 32)
//   4208   4288   PLAYER_OUT     (20 × f32 = 80 bytes, output to JS)
//   4288   4352   PLAYER_INOUT   (16 × f32 = 64 bytes, in/out)
//   4352   4500   EVENTS         (16 slots × 16 bytes = 256 bytes)
//   4500   4504   EVENT_COUNT    (u32 = 4 bytes)
//   4504   4544   STATS          (u64 × 5 = 40 bytes, for benchmarks)
//
//   16384  MAP_DATA     (WW*WH = 250*16 = 4000 bytes, page-aligned)
//   20480  ENEMY_DATA   (64 enemies × 32 bytes = 2048 bytes)
//   22528  FB_DATA      (8 fireballs × 32 bytes = 256 bytes)
//   22784  CAR_DATA     (8 cars × 32 bytes = 256 bytes)
//   23040  PARTICLE_DATA (256 particles × 24 bytes = 6144 bytes)
//   29184  POPUP_DATA   (32 popups × 24 bytes = 768 bytes)
//
// Total static state: ~30KB. Map grows up to 64KB page boundary.
//
// Constants WW and WH are runtime parameters in static config.
// ═══════════════════════════════════════════════════════════════════════

const STATIC_CONFIG: usize = 0;
const INPUT: usize = 4096;
const PLAYER_OUT: usize = 4208;
const PLAYER_INOUT: usize = 4288;
const EVENTS: usize = 4352;
const EVENT_COUNT: usize = 4500;

const MAP_DATA: usize = 16384;
const ENEMY_DATA: usize = 20480;
const FB_DATA: usize = 22528;
const CAR_DATA: usize = 22784;
const PARTICLE_DATA: usize = 23040;
const POPUP_DATA: usize = 29184;

const ENEMY_CAP: usize = 64;
const FB_CAP: usize = 8;
const CAR_CAP: usize = 8;
const PARTICLE_CAP: usize = 256;
const POPUP_CAP: usize = 32;

// Player field offsets (in PLAYER_INOUT, all f32 unless noted)
const P_PX: usize = 0;
const P_PY: usize = 4;
const P_PVX: usize = 8;
const P_PVY: usize = 12;
const P_PAIR: usize = 16;
const P_PCOYOTE: usize = 20;
const P_PJBUF: usize = 24;
const P_PJHOLD: usize = 28;
const P_PJMP: usize = 32;        // u8 (0/1) at byte 32
const P_PWASG: usize = 33;        // u8
const P_PDIR: usize = 34;         // i8
const P_PMODE: usize = 35;        // i8 (0=small,1=big,2=fire)
const P_PINV: usize = 36;         // f32
const P_PSTAR: usize = 40;        // f32
const P_PSQX: usize = 44;         // f32
const P_PSQY: usize = 48;         // f32
const P_LIVES: usize = 52;        // i32
const P_TIME: usize = 56;         // f32

// Static config field offsets (all u32 unless noted)
const C_WW: usize = 0;
const C_WH: usize = 4;
const C_TILE: f32 = 48.0;         // hard-coded; matches JS TILE = 48
const C_GRAV: usize = 8;          // f32
const C_JVEL: usize = 12;         // f32
const C_SHOP: usize = 16;         // f32
const C_MFALL: usize = 20;        // f32
const C_WALK: usize = 24;         // f32
const C_RUN: usize = 28;          // f32
const C_AG: usize = 32;           // f32
const C_AY: usize = 36;           // f32
const C_DG: usize = 40;           // f32
const C_DA: usize = 44;           // f32
const C_JBUF: usize = 48;         // f32
const C_JHOLD: usize = 52;        // f32
const C_COYOTE: usize = 56;       // f32
const C_FIREBALL_SPEED: usize = 60; // f32
const C_PIT_KILL_Y: usize = 64;   // f32
const C_HAT: usize = 68;          // u8 (0=plumber, 1=driver)

// Enemy slot offsets (32 bytes per enemy, all f32 unless noted)
const E_X: usize = 0;
const E_Y: usize = 4;
const E_VX: usize = 8;
const E_VY: usize = 12;
const E_T: usize = 16;
const E_HP: usize = 20;            // i8
const E_TYPE: usize = 21;          // u8 (0=goomba,1=koopa,2=shell,3=powerup)
const E_SHELL: usize = 22;         // u8
const E_SHELLVX: usize = 24;       // f32
const E_PUTYPE: usize = 28;        // u8 (0=mushroom,1=fire,2=star)
const E_ACTIVE: usize = 29;        // u8
const E_PY: usize = 30;            // f32 (target y for powerup)

// Fireball slot offsets (32 bytes per fb)
const F_X: usize = 0;
const F_Y: usize = 4;
const F_VX: usize = 8;
const F_VY: usize = 12;
const F_BOUNCES: usize = 16;       // i8
const F_ALIVE: usize = 17;         // u8

// Car slot offsets (32 bytes per car)
const CAR_X: usize = 0;
const CAR_Y: usize = 4;
const CAR_VX: usize = 8;
const CAR_ALIVE: usize = 12;       // u8

// Particle slot offsets (24 bytes per particle)
const PA_X: usize = 0;
const PA_Y: usize = 4;
const PA_VX: usize = 8;
const PA_VY: usize = 12;
const PA_LIFE: usize = 16;         // f32
const PA_C: usize = 20;            // u32 (RGBA packed)

// Popup slot offsets (24 bytes per popup)
const PO_X: usize = 0;
const PO_Y: usize = 4;
const PO_TEXT: usize = 8;          // u32 (offset into JS-side string table)
const PO_LIFE: usize = 12;         // f32
const PO_ALIVE: usize = 16;        // u8

// Event slot (16 bytes per event)
const EV_TYPE: usize = 0;          // u8
const EV_TX: usize = 1;             // i32
const EV_TY: usize = 5;             // i32
const EV_X: usize = 8;              // f32
const EV_Y: usize = 12;             // f32

// Event types
const EV_COIN: u8 = 1;
const EV_QUESTION: u8 = 2;
const EV_BRICK: u8 = 3;
const EV_PIT_DEATH: u8 = 4;
const EV_STOMP: u8 = 5;
const EV_SHELL_KICK: u8 = 6;
const EV_POWERUP_COLLECT: u8 = 7;
const EV_TIMEOUT: u8 = 8;
const EV_LIFE_LOST: u8 = 9;
const EV_BUMP: u8 = 10;
const EV_TIME_OUT: u8 = 11;

// Enemy type IDs
const ET_GOOMBA: u8 = 0;
const ET_KOOPA: u8 = 1;
const ET_SHELL: u8 = 2;
const ET_POWERUP: u8 = 3;

// Powerup types
const PU_MUSHROOM: u8 = 0;
const PU_FIRE: u8 = 1;
const PU_STAR: u8 = 2;

// Tile solidity is a bitmask, not a list. Tile 0 = air, 1-10 = solid, 11-12 = hat-locked
const SOLID_BIT: u8 = 0x80;
const PLUMBER_BIT: u8 = 0x40;
const DRIVER_BIT: u8 = 0x20;

#[inline(always)]
fn mem() -> *mut u8 {
    unsafe { BUFFER_PTR }
}

#[inline(always)]
fn ww() -> i32 {
    unsafe { ptr::read(mem().add(STATIC_CONFIG + C_WW) as *const i32) }
}

#[inline(always)]
fn wh() -> i32 {
    unsafe { ptr::read(mem().add(STATIC_CONFIG + C_WH) as *const i32) }
}

#[inline(always)]
fn tile_at(tx: i32, ty: i32) -> u8 {
    let w = ww();
    let h = wh();
    if tx < 0 || ty < 0 || tx >= w || ty >= h {
        return 1; // out-of-bounds counts as solid wall
    }
    unsafe { ptr::read(mem().add(MAP_DATA + (ty * w + tx) as usize) as *const u8) }
}

#[inline(always)]
fn set_tile(tx: i32, ty: i32, v: u8) {
    let w = ww();
    let h = wh();
    if tx < 0 || ty < 0 || tx >= w || ty >= h {
        return;
    }
    unsafe { ptr::write(mem().add(MAP_DATA + (ty * w + tx) as usize) as *mut u8, v) }
}

#[inline(always)]
fn tile_solid(t: u8) -> bool {
    t != 0 && t < 11
}

#[inline(always)]
fn p_f32(off: usize) -> f32 {
    unsafe { ptr::read(mem().add(PLAYER_INOUT + off) as *const f32) }
}

#[inline(always)]
fn set_p_f32(off: usize, v: f32) {
    unsafe { ptr::write(mem().add(PLAYER_INOUT + off) as *mut f32, v) }
}

#[inline(always)]
fn p_u8(off: usize) -> u8 {
    unsafe { ptr::read(mem().add(PLAYER_INOUT + off) as *const u8) }
}

#[inline(always)]
fn set_p_u8(off: usize, v: u8) {
    unsafe { ptr::write(mem().add(PLAYER_INOUT + off) as *mut u8, v) }
}

#[inline(always)]
fn p_i8(off: usize) -> i8 {
    unsafe { ptr::read(mem().add(PLAYER_INOUT + off) as *const i8) }
}

#[inline(always)]
fn set_p_i8(off: usize, v: i8) {
    unsafe { ptr::write(mem().add(PLAYER_INOUT + off) as *mut i8, v) }
}

#[inline(always)]
fn p_i32(off: usize) -> i32 {
    unsafe { ptr::read(mem().add(PLAYER_INOUT + off) as *const i32) }
}

#[inline(always)]
fn set_p_i32(off: usize, v: i32) {
    unsafe { ptr::write(mem().add(PLAYER_INOUT + off) as *mut i32, v) }
}

#[inline(always)]
fn input_f32(off: usize) -> f32 {
    unsafe { ptr::read(mem().add(INPUT + off) as *const f32) }
}

#[inline(always)]
fn cfg_f32(off: usize) -> f32 {
    unsafe { ptr::read(mem().add(STATIC_CONFIG + off) as *const f32) }
}

#[inline(always)]
fn enemy_ptr(i: usize) -> *mut u8 {
    unsafe { mem().add(ENEMY_DATA + i * 32) }
}

#[inline(always)]
fn fb_ptr(i: usize) -> *mut u8 {
    unsafe { mem().add(FB_DATA + i * 32) }
}

#[inline(always)]
fn car_ptr(i: usize) -> *mut u8 {
    unsafe { mem().add(CAR_DATA + i * 32) }
}

#[inline(always)]
fn pa_ptr(i: usize) -> *mut u8 {
    unsafe { mem().add(PARTICLE_DATA + i * 24) }
}

#[inline(always)]
fn pop_ptr(i: usize) -> *mut u8 {
    unsafe { mem().add(POPUP_DATA + i * 24) }
}

#[inline(always)]
fn ev_ptr(i: usize) -> *mut u8 {
    unsafe { mem().add(EVENTS + i * 16) }
}

#[inline(always)]
fn push_event(ty: u8, tx: i32, ty_: i32, x: f32, y: f32) {
    unsafe {
        let n = ptr::read_volatile(BUFFER_PTR.add(EVENT_COUNT) as *const u32) as usize;
        if n >= 16 {
            return; // drop event if queue full
        }
        let p = BUFFER_PTR.add(EVENTS + n * 16);
        ptr::write_volatile(p.add(EV_TYPE), ty);
        ptr::write_volatile(p.add(EV_TX) as *mut i32, tx);
        ptr::write_volatile(p.add(EV_TY) as *mut i32, ty_);
        ptr::write_volatile(p.add(EV_X) as *mut f32, x);
        ptr::write_volatile(p.add(EV_Y) as *mut f32, y);
        ptr::write_volatile(BUFFER_PTR.add(EVENT_COUNT) as *mut u32, (n + 1) as u32);
    }
}

// Backing buffer pointer. Set by init().
// Using a static mut here since we have a single linear memory that is the
// only allocation. `#[no_std]` means we can't use std, so we manage this
// directly.
use core::sync::atomic::{AtomicU32, Ordering};

static mut BUFFER_PTR: *mut u8 = core::ptr::null_mut();

/// Get the current BUFFER_PTR. Marked #[inline(never)] to prevent
/// the compiler from caching the value across function calls.
#[inline(never)]
fn fresh_ptr() -> *mut u8 {
    unsafe { BUFFER_PTR }
}

// Linear memory that backs the physics state. Allocated on init().
// 64KB. All state fits within this.
const BUFFER_SIZE: usize = 65536;
static mut BUFFER: [u8; BUFFER_SIZE] = [0; BUFFER_SIZE];

// ═══════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════

/// Initialize the physics module. Must be called once before step().
/// Returns the address of the linear memory (always 0; we use a static buffer).
#[no_mangle]
pub extern "C" fn physics_init() -> *mut u8 {
    unsafe {
        let buf = BUFFER.as_mut_ptr();
        BUFFER_PTR_ATOMIC.store(buf as usize, Ordering::SeqCst);
        BUFFER_PTR = buf; // legacy, keep in sync
        ptr::write_bytes(buf, 0, BUFFER_SIZE);
        // Default config (matches JS constants)
        ptr::write(buf.add(STATIC_CONFIG + C_WW) as *mut i32, 250);
        ptr::write(buf.add(STATIC_CONFIG + C_WH) as *mut i32, 16);
        ptr::write(buf.add(STATIC_CONFIG + C_GRAV) as *mut f32, 2200.0);
        ptr::write(buf.add(STATIC_CONFIG + C_JVEL) as *mut f32, -680.0);
        ptr::write(buf.add(STATIC_CONFIG + C_SHOP) as *mut f32, -420.0);
        ptr::write(buf.add(STATIC_CONFIG + C_MFALL) as *mut f32, 900.0);
        ptr::write(buf.add(STATIC_CONFIG + C_WALK) as *mut f32, 220.0);
        ptr::write(buf.add(STATIC_CONFIG + C_RUN) as *mut f32, 380.0);
        ptr::write(buf.add(STATIC_CONFIG + C_AG) as *mut f32, 35.0);
        ptr::write(buf.add(STATIC_CONFIG + C_AY) as *mut f32, 22.0);
        ptr::write(buf.add(STATIC_CONFIG + C_DG) as *mut f32, 28.0);
        ptr::write(buf.add(STATIC_CONFIG + C_DA) as *mut f32, 15.0);
        ptr::write(buf.add(STATIC_CONFIG + C_JBUF) as *mut f32, 0.12);
        ptr::write(buf.add(STATIC_CONFIG + C_JHOLD) as *mut f32, 0.15);
        ptr::write(buf.add(STATIC_CONFIG + C_COYOTE) as *mut f32, 0.10);
        ptr::write(buf.add(STATIC_CONFIG + C_FIREBALL_SPEED) as *mut f32, 400.0);
        ptr::write(buf.add(STATIC_CONFIG + C_PIT_KILL_Y) as *mut f32, (16_i32 * 48 + 200) as f32);
        ptr::write(buf.add(STATIC_CONFIG + C_HAT) as *mut u8, 0);
        buf
    }
}

/// Get pointer to map memory (4000 bytes, WW*WH). JS writes tile data here.
#[no_mangle]
pub extern "C" fn map_ptr() -> *mut u8 {
    unsafe { mem().add(MAP_DATA) }
}

/// Get pointer to enemy memory (64 × 32 = 2048 bytes).
#[no_mangle]
pub extern "C" fn enemies_ptr() -> *mut u8 {
    unsafe { mem().add(ENEMY_DATA) }
}

/// Get pointer to particle memory (256 × 24 = 6144 bytes).
#[no_mangle]
pub extern "C" fn particles_ptr() -> *mut u8 {
    unsafe { mem().add(PARTICLE_DATA) }
}

/// Get pointer to popup memory (32 × 24 = 768 bytes).
#[no_mangle]
pub extern "C" fn popups_ptr() -> *mut u8 {
    unsafe { mem().add(POPUP_DATA) }
}

/// Get pointer to fireball memory (8 × 32 = 256 bytes).
#[no_mangle]
pub extern "C" fn fireballs_ptr() -> *mut u8 {
    unsafe { mem().add(FB_DATA) }
}

/// Get pointer to car memory (8 × 32 = 256 bytes).
#[no_mangle]
pub extern "C" fn cars_ptr() -> *mut u8 {
    unsafe { mem().add(CAR_DATA) }
}

/// Get pointer to input memory (24 bytes). JS writes ax, jmp, run, fire, dt each frame.
#[no_mangle]
pub extern "C" fn input_ptr() -> *mut u8 {
    unsafe { mem().add(INPUT) }
}

/// Get pointer to player in/out memory (60 bytes). JS reads/writes player state.
#[no_mangle]
pub extern "C" fn player_ptr() -> *mut u8 {
    unsafe { mem().add(PLAYER_INOUT) }
}

/// Get pointer to events memory (16 × 16 = 256 bytes).
#[no_mangle]
pub extern "C" fn events_ptr() -> *mut u8 {
    unsafe { mem().add(EVENTS) }
}

/// Get pointer to event count (u32).
#[no_mangle]
pub extern "C" fn event_count_ptr() -> *mut u8 {
    unsafe { mem().add(EVENT_COUNT) }
}

/// Reset event count to 0. Call after JS drains events.
#[no_mangle]
pub extern "C" fn clear_events() {
    unsafe { ptr::write_volatile(mem().add(EVENT_COUNT) as *mut u32, 0) }
}

/// Set hat. 0 = plumber, 1 = driver.
#[no_mangle]
pub extern "C" fn set_hat(v: u8) {
    unsafe { ptr::write(mem().add(STATIC_CONFIG + C_HAT) as *mut u8, v) }
}

/// Step the physics one frame. dt in seconds. Returns the number of events emitted.
/// Skips player physics (handled in JS to keep the side effects in one place).
#[inline(never)]
#[no_mangle]
pub extern "C" fn step() -> u32 {
    unsafe {
        // Force fresh read of BUFFER_PTR to defeat compiler caching
        let buf = fresh_ptr();
        // Reset event count using atomic store (unoptimizable)
        let ec_ptr = buf.add(EVENT_COUNT) as *mut AtomicU32;
        (*ec_ptr).store(0, Ordering::SeqCst);

        let dt = input_f32(16); // INPUT+16 = dt

        if dt <= 0.0 || dt.is_nan() {
            return (*ec_ptr).load(Ordering::SeqCst);
        }

        step_enemies(dt);
        step_fireballs(dt);
        step_cars(dt);
        step_particles(dt);
        step_popups(dt);

        (*ec_ptr).load(Ordering::SeqCst)
    }
}



#[inline(never)]
unsafe fn step_player(dt: f32) {
    let ax = input_f32(0);
    let jmp = input_f32(4) > 0.5;
    let run = input_f32(8) > 0.5;
    let fire = input_f32(12) > 0.5;

    let walk = cfg_f32(C_WALK);
    let run_v = cfg_f32(C_RUN);
    let ag = cfg_f32(C_AG);
    let ay = cfg_f32(C_AY);
    let dg = cfg_f32(C_DG);
    let da = cfg_f32(C_DA);
    let grav = cfg_f32(C_GRAV);
    let jvel = cfg_f32(C_JVEL);
    let shop = cfg_f32(C_SHOP);
    let mfall = cfg_f32(C_MFALL);
    let jbuf_t = cfg_f32(C_JBUF);
    let jhold_t = cfg_f32(C_JHOLD);
    let coyote_t = cfg_f32(C_COYOTE);

    let w = ww() as f32 * C_TILE;
    let g = (wh() - 3) as f32 * C_TILE - 2.0;

    let spd = if run { run_v } else { walk };

    let mut px = p_f32(P_PX);
    let mut py = p_f32(P_PY);
    let mut pvx = p_f32(P_PVX);
    let mut pvy = p_f32(P_PVY);

    let p_air = py < g - 1.0;
    set_p_u8(P_PAIR, if p_air { 1 } else { 0 });

    // Acceleration
    let ac = if !p_air { ag } else { ay };
    if ax != 0.0 {
        let target = ax * spd;
        pvx += (target - pvx) * (ac * dt).min(1.0);
        set_p_i8(P_PDIR, if ax > 0.0 { 1 } else { 0 });
    } else {
        let decel = if !p_air { dg } else { da };
        if decel == dg {
            pvx *= (1.0 - 12.0 * dt).max(0.0);
        } else {
            pvx *= (1.0 - 5.0 * dt).max(0.0);
        }
        if pvx.abs() < 5.0 {
            pvx = 0.0;
        }
    }

    // Coyote + jump buffer
    let mut p_coyote = p_f32(P_PCOYOTE);
    if p_air {
        p_coyote = (p_coyote - dt).max(0.0);
    } else {
        p_coyote = coyote_t;
    }
    set_p_f32(P_PCOYOTE, p_coyote);

    let mut p_jbuf = p_f32(P_PJBUF);
    if jmp {
        p_jbuf = jbuf_t;
    } else {
        p_jbuf = (p_jbuf - dt).max(0.0);
    }
    set_p_f32(P_PJBUF, p_jbuf);

    let p_jmp = p_u8(P_PJMP) != 0;
    let can_jmp = !p_air || p_coyote > 0.0;
    if p_jbuf > 0.0 && can_jmp && !p_jmp {
        pvy = if jmp { jvel } else { shop };
        set_p_u8(P_PJMP, 1);
        set_p_f32(P_PCOYOTE, 0.0);
        set_p_f32(P_PJBUF, 0.0);
        set_p_f32(P_PJHOLD, 0.0);
        set_p_f32(P_PSQY, 0.7);
        set_p_f32(P_PSQX, 1.3);
        // Note: SFX.jump() and spawnParticles for star are JS-side effects.
        // We do not emit them as events; instead we set a flag the JS reads
        // by polling player state (jmp rising edge).
    }

    // Gravity
    let mut p_jhold = p_f32(P_PJHOLD);
    let cur_p_jmp = p_u8(P_PJMP) != 0;
    if cur_p_jmp && jmp && pvy < 0.0 {
        p_jhold += dt;
        let mult = if p_jhold < jhold_t { 0.4 } else { 1.0 };
        pvy += grav * mult * dt;
    } else if p_air {
        pvy += grav * dt;
    }
    set_p_f32(P_PJHOLD, p_jhold);
    if pvy > mfall {
        pvy = mfall;
    }

    let p_star = p_f32(P_PSTAR);
    if p_star > 0.0 {
        pvy *= 0.999;
    }

    px += pvx * dt;
    py += pvy * dt;

    // Ground
    let p_wasg = p_u8(P_PWASG) != 0;
    if py >= g {
        if !p_wasg && pvy > 200.0 {
            let imp = (pvy / 800.0).min(1.0);
            set_p_f32(P_PSQY, 1.0 + imp * 0.4);
            set_p_f32(P_PSQX, 1.0 - imp * 0.25);
            push_event(EV_BUMP, 0, 0, px, g);
        }
        py = g;
        pvy = 0.0;
        set_p_u8(P_PJMP, 0);
        set_p_u8(P_PWASG, 1);
    } else {
        set_p_u8(P_PWASG, 0);
    }

    // Pit death
    let pit_y = cfg_f32(C_PIT_KILL_Y);
    if py > pit_y {
        push_event(EV_PIT_DEATH, 0, 0, px, py);
    }

    // Squash & stretch decay
    let mut psqx = p_f32(P_PSQX);
    let mut psqy = p_f32(P_PSQY);
    psqx += (1.0 - psqx) * 15.0 * dt;
    psqy += (1.0 - psqy) * 15.0 * dt;
    set_p_f32(P_PSQX, psqx);
    set_p_f32(P_PSQY, psqy);

    // Clamp X to world
    if px < 0.0 {
        px = 0.0;
    } else if px > w - C_TILE {
        px = w - C_TILE;
    }

    set_p_f32(P_PX, px);
    set_p_f32(P_PY, py);
    set_p_f32(P_PVX, pvx);
    set_p_f32(P_PVY, pvy);

    // Head bump
    let htx = (px / C_TILE) as i32;
    let hty = (py / C_TILE) as i32;
    let ht = tile_at(htx, hty);
    if tile_solid(ht) && py < (hty as f32) * C_TILE {
        pvy = 50.0;
        if ht == 3 {
            // Coin block
            set_tile(htx, hty, 9);
            push_event(EV_COIN, htx, hty, htx as f32 * C_TILE + C_TILE * 0.5, hty as f32 * C_TILE);
        } else if ht == 8 {
            // ? block
            set_tile(htx, hty, 9);
            push_event(EV_QUESTION, htx, hty, htx as f32 * C_TILE + C_TILE * 0.5, hty as f32 * C_TILE);
        } else if ht == 2 {
            // Brick (only breakable in big mode)
            let pmode = p_i8(P_PMODE);
            if pmode > 0 {
                set_tile(htx, hty, 0);
                push_event(EV_BRICK, htx, hty, htx as f32 * C_TILE + C_TILE * 0.5, hty as f32 * C_TILE);
            }
        }
    }
    set_p_f32(P_PVY, pvy);

    // Note: fireball spawning is JS-side because it depends on
    // game.fireballs.length cap and game.pDir which JS owns.
    let _ = fire;
}

#[inline(never)]
unsafe fn step_enemies(dt: f32) {
    let g = (wh() - 3) as f32 * C_TILE;
    let p_x = p_f32(P_PX);
    let p_y = p_f32(P_PY);
    let p_vy = p_f32(P_PVY);
    let p_dir = p_i8(P_PDIR);
    let p_inv = p_f32(P_PINV);
    let p_star = p_f32(P_PSTAR);
    let jvel = cfg_f32(C_JVEL);

    for i in 0..ENEMY_CAP {
        let ep = enemy_ptr(i);
        let hp = ptr::read(ep.add(E_HP) as *const i8);
        let ety = ptr::read(ep.add(E_TYPE) as *const u8);
        if hp <= 0 && ety != ET_POWERUP {
            continue;
        }
        if ety == ET_POWERUP {
            let active = ptr::read(ep.add(E_ACTIVE) as *const u8);
            if active == 0 {
                continue;
            }
            // Powerup rising out of block, then running
            let vy = ptr::read(ep.add(E_VY) as *const f32);
            let mut v_y = vy;
            let mut y = ptr::read(ep.add(E_Y) as *const f32);
            let mut x = ptr::read(ep.add(E_X) as *const f32);
            let py_target = ptr::read(ep.add(E_PY) as *const f32);
            if v_y < 0.0 {
                v_y += 600.0 * dt;
                y += v_y * dt;
                if y <= py_target - C_TILE {
                    y = py_target - C_TILE;
                    v_y = 0.0;
                    let vx_target = if p_dir > 0 { 80.0 } else { -80.0 };
                    ptr::write(ep.add(E_VX) as *mut f32, vx_target);
                }
            } else {
                let vx = ptr::read(ep.add(E_VX) as *const f32);
                x += vx * dt;
                v_y += cfg_f32(C_GRAV) * 0.6 * dt;
                y += v_y * dt;
                if y >= g {
                    y = g;
                    v_y = 0.0;
                }
                let etx = (x / C_TILE) as i32;
                let ety2 = (y / C_TILE) as i32;
                if tile_solid(tile_at(etx, ety2)) {
                    ptr::write(ep.add(E_VX) as *mut f32, -vx);
                }
            }
            ptr::write(ep.add(E_X) as *mut f32, x);
            ptr::write(ep.add(E_Y) as *mut f32, y);
            ptr::write(ep.add(E_VY) as *mut f32, v_y);

            // Collect
            let dx = (x - p_x).abs();
            let dy = (y - p_y).abs();
            if dx < C_TILE * 0.8 && dy < C_TILE * 1.5 {
                let pu = ptr::read(ep.add(E_PUTYPE) as *const u8);
                push_event(EV_POWERUP_COLLECT, 0, pu as i32, x, y);
                // Mark dead
                ptr::write(ep.add(E_HP) as *mut i8, 0);
                ptr::write(ep.add(E_ACTIVE) as *mut u8, 0);
            }
            continue;
        }

        // Goomba or Koopa
        let mut x = ptr::read(ep.add(E_X) as *const f32);
        let mut vx = ptr::read(ep.add(E_VX) as *const f32);
        let y = ptr::read(ep.add(E_Y) as *const f32);
        let t = ptr::read(ep.add(E_T) as *const f32);
        let shell = ptr::read(ep.add(E_SHELL) as *const u8) != 0;
        let shell_vx = ptr::read(ep.add(E_SHELLVX) as *const f32);

        if ety == ET_KOOPA && shell {
            // Moving shell
            let svx = shell_vx;
            x += svx * dt;
            let nxt = ((x + if svx > 0.0 { C_TILE } else { 0.0 }) / C_TILE) as i32;
            let row = (y / C_TILE) as i32;
            if tile_solid(tile_at(nxt, row + 1)) || !tile_solid(tile_at(nxt, row + 2)) {
                ptr::write(ep.add(E_SHELLVX) as *mut f32, -svx);
                // Bounce sound is JS-side; emit event
                push_event(EV_BUMP, 0, 0, x, y);
            }
            ptr::write(ep.add(E_X) as *mut f32, x);
            ptr::write(ep.add(E_T) as *mut f32, t + dt);

            // Shell vs other enemies
            for j in 0..ENEMY_CAP {
                if j == i {
                    continue;
                }
                let oep = enemy_ptr(j);
                let o_hp = ptr::read(oep.add(E_HP) as *const i8);
                let o_ety = ptr::read(oep.add(E_TYPE) as *const u8);
                if o_hp <= 0 || o_ety == ET_POWERUP {
                    continue;
                }
                let ox = ptr::read(oep.add(E_X) as *const f32);
                let oy = ptr::read(oep.add(E_Y) as *const f32);
                if (ox - x).abs() < C_TILE && (oy - y).abs() < C_TILE {
                    ptr::write(oep.add(E_HP) as *mut i8, 0);
                    push_event(EV_STOMP, j as i32, 0, ox, oy);
                }
            }

            // Player collision
            handle_shell_player_collision(ep, x, y, p_x, p_y, p_vy, p_dir, p_inv, p_star, jvel);
        } else {
            // Goomba or walking Koopa
            x += vx * dt;
            let nxt = ((x + if vx > 0.0 { C_TILE } else { 0.0 }) / C_TILE) as i32;
            let row = (y / C_TILE) as i32;
            if tile_solid(tile_at(nxt, row + 1)) || !tile_solid(tile_at(nxt, row + 2)) {
                vx = -vx;
            }
            ptr::write(ep.add(E_X) as *mut f32, x);
            ptr::write(ep.add(E_VX) as *mut f32, vx);
            ptr::write(ep.add(E_T) as *mut f32, t + dt);

            if ety == ET_GOOMBA {
                handle_goomba_player_collision(ep, x, y, p_x, p_y, p_vy, p_inv, p_star, jvel);
            } else {
                handle_koopa_player_collision(ep, x, y, p_x, p_y, p_vy, p_inv, p_star, jvel);
            }
        }
    }
}

#[inline(always)]
unsafe fn handle_goomba_player_collision(
    ep: *mut u8,
    x: f32,
    y: f32,
    p_x: f32,
    p_y: f32,
    p_vy: f32,
    p_inv: f32,
    p_star: f32,
    jvel: f32,
) {
    if (x - p_x).abs() < C_TILE * 0.8 && (y - p_y).abs() < C_TILE * 0.8 {
        if p_vy > 0.0 && p_y < y - C_TILE / 3.0 {
            // Stomp
            ptr::write(ep.add(E_HP) as *mut i8, 0);
            let new_pvy = jvel * 0.6;
            set_p_f32(P_PVY, new_pvy);
            push_event(EV_STOMP, 0, 1, x, y);
        } else if p_star > 0.0 {
            ptr::write(ep.add(E_HP) as *mut i8, 0);
            push_event(EV_STOMP, 0, 0, x, y);
        } else if p_inv <= 0.0 {
            push_event(EV_LIFE_LOST, 0, 0, p_x, p_y);
        }
    }
}

#[inline(always)]
unsafe fn handle_koopa_player_collision(
    ep: *mut u8,
    x: f32,
    y: f32,
    p_x: f32,
    p_y: f32,
    p_vy: f32,
    p_inv: f32,
    p_star: f32,
    jvel: f32,
) {
    if (x - p_x).abs() < C_TILE * 0.8 && (y - p_y).abs() < C_TILE * 0.8 {
        if p_vy > 0.0 && p_y < y - C_TILE / 3.0 {
            // Convert to shell
            ptr::write(ep.add(E_SHELL) as *mut u8, 1);
            ptr::write(ep.add(E_SHELLVX) as *mut f32, 0.0);
            set_p_f32(P_PVY, jvel * 0.5);
            push_event(EV_STOMP, 0, 2, x, y);
        } else if p_star > 0.0 {
            ptr::write(ep.add(E_HP) as *mut i8, 0);
            push_event(EV_STOMP, 0, 0, x, y);
        } else if p_inv <= 0.0 {
            push_event(EV_LIFE_LOST, 0, 0, p_x, p_y);
        }
    }
}

#[inline(always)]
unsafe fn handle_shell_player_collision(
    ep: *mut u8,
    x: f32,
    y: f32,
    p_x: f32,
    p_y: f32,
    p_vy: f32,
    p_dir: i8,
    p_inv: f32,
    p_star: f32,
    jvel: f32,
) {
    if (x - p_x).abs() < C_TILE * 0.8 && (y - p_y).abs() < C_TILE * 0.8 {
        if p_vy > 0.0 && p_y < y - C_TILE / 3.0 {
            ptr::write(ep.add(E_SHELLVX) as *mut f32, 0.0);
            set_p_f32(P_PVY, jvel * 0.5);
            push_event(EV_BUMP, 0, 0, x, y);
        } else if p_star > 0.0 {
            ptr::write(ep.add(E_HP) as *mut i8, 0);
            push_event(EV_STOMP, 0, 0, x, y);
        } else if p_inv <= 0.0 {
            let pvx = p_f32(P_PVX);
            if pvx.abs() > 10.0 {
                let kick = if p_dir > 0 { 350.0 } else { -350.0 };
                ptr::write(ep.add(E_SHELLVX) as *mut f32, kick);
                push_event(EV_SHELL_KICK, 0, 0, x, y);
            } else {
                push_event(EV_LIFE_LOST, 0, 0, p_x, p_y);
            }
        }
    }
}

#[inline(never)]
unsafe fn step_fireballs(dt: f32) {
    let g = (wh() - 3) as f32 * C_TILE;
    let cam = p_f32(P_PX) - 1187.0 / 3.0; // Approx; JS will set this via input
    let fb_speed = cfg_f32(C_FIREBALL_SPEED);

    for i in 0..FB_CAP {
        let p = fb_ptr(i);
        let alive = ptr::read(p.add(F_ALIVE) as *const u8);
        if alive == 0 {
            continue;
        }
        let mut x = ptr::read(p.add(F_X) as *const f32);
        let mut y = ptr::read(p.add(F_Y) as *const f32);
        let mut vx = ptr::read(p.add(F_VX) as *const f32);
        let mut vy = ptr::read(p.add(F_VY) as *const f32);
        let mut bounces = ptr::read(p.add(F_BOUNCES) as *const i8);

        x += vx * dt;
        vy += cfg_f32(C_GRAV) * 0.5 * dt;
        y += vy * dt;

        if y >= g {
            y = g;
            vy = -350.0;
            bounces += 1;
            push_event(EV_BUMP, 0, 0, x, y);
        }
        if bounces > 3 || x < cam - 100.0 || x > cam + 1500.0 {
            ptr::write(p.add(F_ALIVE) as *mut u8, 0);
            continue;
        }
        ptr::write(p.add(F_X) as *mut f32, x);
        ptr::write(p.add(F_Y) as *mut f32, y);
        ptr::write(p.add(F_VX) as *mut f32, vx);
        ptr::write(p.add(F_VY) as *mut f32, vy);
        ptr::write(p.add(F_BOUNCES) as *mut i8, bounces);

        // Fireball vs enemies
        for j in 0..ENEMY_CAP {
            let ep = enemy_ptr(j);
            let hp = ptr::read(ep.add(E_HP) as *const i8);
            let ety = ptr::read(ep.add(E_TYPE) as *const u8);
            if hp <= 0 || ety == ET_POWERUP {
                continue;
            }
            let ex = ptr::read(ep.add(E_X) as *const f32);
            let ey = ptr::read(ep.add(E_Y) as *const f32);
            if (ex - x).abs() < C_TILE && (ey - y).abs() < C_TILE {
                ptr::write(ep.add(E_HP) as *mut i8, 0);
                push_event(EV_STOMP, j as i32, 3, ex, ey);
                ptr::write(p.add(F_ALIVE) as *mut u8, 0);
                break;
            }
        }
    }
}

#[inline(never)]
unsafe fn step_cars(dt: f32) {
    let w = ww() as f32 * C_TILE;
    for i in 0..CAR_CAP {
        let p = car_ptr(i);
        let alive = ptr::read(p.add(CAR_ALIVE) as *const u8);
        if alive == 0 {
            continue;
        }
        let mut x = ptr::read(p.add(CAR_X) as *const f32);
        let mut vx = ptr::read(p.add(CAR_VX) as *const f32);
        x += vx * dt;
        if x < 0.0 || x > w {
            vx = -vx;
        }
        ptr::write(p.add(CAR_X) as *mut f32, x);
        ptr::write(p.add(CAR_VX) as *mut f32, vx);
    }
}

#[inline(never)]
unsafe fn step_particles(dt: f32) {
    let grav = cfg_f32(C_GRAV);
    // Walk in reverse to allow in-place kill
    let mut i = PARTICLE_CAP;
    while i > 0 {
        i -= 1;
        let p = pa_ptr(i);
        let life = ptr::read(p.add(PA_LIFE) as *const f32);
        if life <= 0.0 {
            continue;
        }
        let mut x = ptr::read(p.add(PA_X) as *const f32);
        let mut y = ptr::read(p.add(PA_Y) as *const f32);
        let vx = ptr::read(p.add(PA_VX) as *const f32);
        let mut vy = ptr::read(p.add(PA_VY) as *const f32);
        x += vx * dt;
        y += vy * dt;
        vy += grav * 0.5 * dt;
        let new_life = life - dt;
        ptr::write(p.add(PA_X) as *mut f32, x);
        ptr::write(p.add(PA_Y) as *mut f32, y);
        ptr::write(p.add(PA_VY) as *mut f32, vy);
        ptr::write(p.add(PA_LIFE) as *mut f32, new_life);
    }
}

#[inline(never)]
unsafe fn step_popups(dt: f32) {
    for i in 0..POPUP_CAP {
        let p = pop_ptr(i);
        let alive = ptr::read(p.add(PO_ALIVE) as *const u8);
        if alive == 0 {
            continue;
        }
        let y = ptr::read(p.add(PO_Y) as *const f32);
        let life = ptr::read(p.add(PO_LIFE) as *const f32);
        let new_life = life - dt;
        if new_life <= 0.0 {
            ptr::write(p.add(PO_ALIVE) as *mut u8, 0);
        } else {
            ptr::write(p.add(PO_Y) as *mut f32, y - 40.0 * dt);
            ptr::write(p.add(PO_LIFE) as *mut f32, new_life);
        }
    }
}

#[inline(never)]
unsafe fn step_timer(dt: f32) {
    let mut time = p_f32(P_TIME);
    time -= dt;
    if time <= 0.0 {
        push_event(EV_TIME_OUT, 0, 0, 0.0, 0.0);
        time = 400.0;
    }
    set_p_f32(P_TIME, time);

    let mut inv = p_f32(P_PINV);
    if inv > 0.0 {
        inv -= dt;
        if inv < 0.0 {
            inv = 0.0;
        }
        set_p_f32(P_PINV, inv);
    }

    let mut star = p_f32(P_PSTAR);
    if star > 0.0 {
        star -= dt;
        if star < 0.0 {
            star = 0.0;
        }
        set_p_f32(P_PSTAR, star);
    }
}

// ═══════════════════════════════════════════════════════════════════════
// BENCHMARK
// ═══════════════════════════════════════════════════════════════════════

/// Run N physics steps in a tight loop for benchmarking. Returns total event count.
/// No JS roundtrip — pure native speed.
#[no_mangle]
pub extern "C" fn benchmark(n: u32) -> u32 {
    let mut total: u32 = 0;
    for _ in 0..n {
        total = total.wrapping_add(step());
    }
    total
}

/// Get total bytes of state currently used.
#[no_mangle]
pub extern "C" fn state_size() -> u32 {
    BUFFER_SIZE as u32
}

/// Version string for the physics module.
#[no_mangle]
pub extern "C" fn version() -> *const u8 {
    b"1.8.0\0".as_ptr()
}

// ═══════════════════════════════════════════════════════════════════════
// VOLATILE WORKAROUND: Use core::arch::wasm32 intrinsics directly
// ═══════════════════════════════════════════════════════════════════════
// (removed - using ptr::write_volatile instead)
