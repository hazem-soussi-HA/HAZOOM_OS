// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// ENTITIES: ENEMIES
// Goomba, Koopa, and shared enemy logic
// ═══════════════════════════════════════════════════════════════

function spawnEnemies() {
    game.enemies = [];
    // Goombas
    var ep = [14,24,32,46,54,63,72,83,90,102,110,122,138,149,154,162,174,184,196,205,216,228,236];
    ep.forEach(function(ex) {
        game.enemies.push({ x: ex * TILE, y: (WH - 3) * TILE, vx: -(35 + Math.random() * 45), t: 0, hp: 1, type: 'goomba' });
    });
    // Koopas
    var kp = [50,76,93,115,136,158,180,200,222,240];
    kp.forEach(function(ex) {
        game.enemies.push({ x: ex * TILE, y: (WH - 3) * TILE, vx: -(30 + Math.random() * 30), t: 0, hp: 1, type: 'koopa', shell: false, shellVx: 0 });
    });
}

function spawnCars() {
    game.cars = [];
    var cc = ['#dc2828','#2864dc','#ffc828','#28b450','#b43cb4','#ff6428'];
    for (var i = 0; i < 5; i++) {
        game.cars.push({ x: (50 + i * 40) * TILE, y: (WH - 3) * TILE, vx: 30 + Math.random() * 20, color: cc[i % cc.length] });
    }
}

function spawnPowerupBlocks() {
    var pu = [
        { x: 18, y: 7, type: 'mushroom' }, { x: 75, y: 8, type: 'mushroom' },
        { x: 112, y: 8, type: 'fire' }, { x: 142, y: 6, type: 'mushroom' },
        { x: 177, y: 8, type: 'star' }, { x: 195, y: 9, type: 'fire' },
        { x: 214, y: 6, type: 'mushroom' }, { x: 230, y: 5, type: 'fire' }
    ];
    pu.forEach(function(p) {
        game.enemies.push({ x: p.x * TILE, y: p.y * TILE, t: 0, type: 'powerup', puType: p.type, active: true, vy: 0, py: p.y * TILE });
    });
}

function updateEnemies(dt) {
    for (var ei = game.enemies.length - 1; ei >= 0; ei--) {
        var e = game.enemies[ei];
        if (e.isBuddy) continue;  // buddies are updated in updateBuddies()
        if (e.hp <= 0 && e.type !== 'powerup') continue;
        if (e.type === 'powerup' && !e.active) continue;

        if (e.type === 'powerup') {
            updatePowerup(e, dt);
            continue;
        }

        if (e.type === 'goomba') {
            updateGoomba(e, dt);
        } else if (e.type === 'koopa') {
            updateKoopa(e, dt);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// SUMO BUDDIES (V1.8.2)
// In a friendly Ring Sport, a "stomp" is a legal move that recruits
// the opponent into the player's team instead of defeating them.
// Each recruited opponent joins a conga line behind the player and
// grants a small passive score. Max 3 buddies; if a 4th would be
// recruited, the oldest "wishes you well" and exits with a sparkle.
// ═══════════════════════════════════════════════════════════════

const MAX_BUDDIES = 3;
const BUDDY_LAG = 40;  // pixels between buddies in the conga line

function countBuddies() {
    var n = 0;
    for (var i = 0; i < game.enemies.length; i++) {
        if (game.enemies[i].isBuddy) n++;
    }
    return n;
}

function getBuddies() {
    var out = [];
    for (var i = 0; i < game.enemies.length; i++) {
        if (game.enemies[i].isBuddy) out.push(game.enemies[i]);
    }
    return out;
}

function recruitEnemy(e, kind) {
    if (!e || e.isBuddy) return;

    // Capture the slot count BEFORE marking this enemy as a buddy.
    // (countBuddies includes isBuddy, so calling it after setting the
    // flag would always return the post-recruit count.)
    var slot = countBuddies();

    // If at cap, dismiss the oldest buddy first
    var current = getBuddies();
    if (current.length >= MAX_BUDDIES) {
        current.sort(function(a, b) { return a.buddySlot - b.buddySlot; });
        dismissBuddy(current[0], 'overflow');
        // After dismiss, slot count is one less
        slot = Math.min(slot, MAX_BUDDIES - 1);
    }

    // Recruit: freeze the enemy, mark as buddy, slot in the conga line
    e.isBuddy = true;
    e.buddyKind = kind;  // 'goomba' or 'shell' — drives the visual
    e.buddySlot = Math.min(slot, MAX_BUDDIES - 1);
    e.buddyT = 0;
    e.buddyBobY = 0;
    e.hp = 0;           // skip physics update in WASM/JS
    e.vx = 0;
    e.vy = 0;
    e.shellVx = 0;
    if (kind === 'shell') { e.shell = true; e.type = 'koopa'; }

    // Audio + visual reward
    SFX.recruit();
    spawnParticles(e.x, e.y, '#ffd700', 12);
    spawnParticles(e.x, e.y - 8, '#fff8a0', 6);
    addScorePopup(e.x, e.y - 20, '+1 BUDDY');
    shakeCamera(1.5);
    game.score += 200;

    if (typeof awardPlumberXP === 'function') awardPlumberXP(10, 'recruit');
}

function dismissBuddy(e, reason) {
    if (!e || !e.isBuddy) return;
    e.isBuddy = false;
    e.buddySlot = -1;
    // Farewell: gold puff + descending sine "bye"
    spawnParticles(e.x, e.y, '#fff8a0', 8);
    spawnParticles(e.x, e.y - 16, '#ffd700', 6);
    SFX.recruitBye();
    // Decrement slot indices on remaining buddies so the line stays packed
    var buddies = getBuddies();
    buddies.sort(function(a, b) { return a.buddySlot - b.buddySlot; });
    for (var i = 0; i < buddies.length; i++) buddies[i].buddySlot = i;
}

function dismissAllBuddies() {
    var buddies = getBuddies();
    for (var i = 0; i < buddies.length; i++) {
        buddies[i].isBuddy = false;
        buddies[i].buddySlot = -1;
        spawnParticles(buddies[i].x, buddies[i].y, '#fff8a0', 5);
    }
}

function updateBuddies(dt) {
    var buddies = getBuddies();
    if (buddies.length === 0) return;

    // Sort by slot so the conga order is stable even after dismiss
    buddies.sort(function(a, b) { return a.buddySlot - b.buddySlot; });

    var groundY = (WH - 3) * TILE;
    for (var i = 0; i < buddies.length; i++) {
        var b = buddies[i];
        b.buddyT += dt;
        // Target X: lag behind player by (slot+1) * BUDDY_LAG,
        // slightly biased by player direction so the line stretches
        // out when running and packs tight when standing still.
        var lag = (i + 1) * BUDDY_LAG;
        var targetX = game.px - lag * (game.pDir > 0 ? 1 : -1);
        // Proportional chase (snappier than the enemy walk)
        var dx = targetX - b.x;
        b.vx = dx * 5;
        b.x += b.vx * dt;
        // Lock to ground
        b.y = groundY;
        // Vertical bob (idle animation)
        b.buddyBobY = Math.sin(b.buddyT * 4 + i * 0.7) * 3;
    }
}

function updatePowerup(e, dt) {
    if (e.vy < 0) {
        e.vy += 600 * dt; e.y += e.vy * dt;
        if (e.y <= e.py - TILE) { e.y = e.py - TILE; e.vy = 0; e.vx = game.pDir > 0 ? 80 : -80; }
    } else {
        e.x += e.vx * dt; e.vy += GRAV * 0.6 * dt; e.y += e.vy * dt;
        var eg = (WH - 3) * TILE;
        if (e.y >= eg) { e.y = eg; e.vy = 0; }
        var etx = Math.floor(e.x / TILE);
        if (isTileSolid(getTile(etx, Math.floor(e.y / TILE)))) e.vx *= -1;
    }
    // Collect
    if (Math.abs(e.x - game.px) < TILE * 0.8 && Math.abs(e.y - game.py) < TILE * 1.5) {
        if (e.puType === 'mushroom') {
            if (game.pMode === 0) { game.pMode = 1; SFX.mushroom(); }
            game.score += 1000;
        } else if (e.puType === 'fire') {
            game.pMode = 2; game.pOnFire = true; SFX.mushroom(); game.score += 1000;
        } else if (e.puType === 'star') {
            game.pStar = 8.0; SFX.star(); game.score += 2000;
        }
        addScorePopup(e.x, e.y - 20, '1000');
        game.enemies.splice(ei, 1);
    }
}

function updateGoomba(e, dt) {
    e.x += e.vx * dt; e.t += dt;
    var nxt = Math.floor((e.x + (e.vx > 0 ? TILE : 0)) / TILE);
    if (isTileSolid(getTile(nxt, Math.floor(e.y / TILE) + 1)) || !isTileSolid(getTile(nxt, Math.floor(e.y / TILE) + 2))) e.vx *= -1;
    handlePlayerEnemyCollision(e);
}

function updateKoopa(e, dt) {
    if (e.shell) {
        e.x += e.shellVx * dt; e.t += dt;
        var ns = Math.floor((e.x + (e.shellVx > 0 ? TILE : 0)) / TILE);
        if (isTileSolid(getTile(ns, Math.floor(e.y / TILE) + 1)) || !isTileSolid(getTile(ns, Math.floor(e.y / TILE) + 2))) {
            e.shellVx *= -1; SFX.shellBounce();
        }
        // Shell hits other enemies
        for (var ej = 0; ej < game.enemies.length; ej++) {
            var oe = game.enemies[ej];
            if (oe === e || oe.hp <= 0 || oe.type === 'powerup') continue;
            if (Math.abs(oe.x - e.x) < TILE && Math.abs(oe.y - e.y) < TILE) {
                oe.hp = 0; game.score += 200;
                spawnParticles(oe.x, oe.y, oe.type === 'goomba' ? GOM : KOOPA_GREEN, 8);
                SFX.shellBounce();
            }
        }
        handlePlayerShellCollision(e);
    } else {
        e.x += e.vx * dt; e.t += dt;
        var nxt2 = Math.floor((e.x + (e.vx > 0 ? TILE : 0)) / TILE);
        if (isTileSolid(getTile(nxt2, Math.floor(e.y / TILE) + 1)) || !isTileSolid(getTile(nxt2, Math.floor(e.y / TILE) + 2))) e.vx *= -1;
        handlePlayerKoopaCollision(e);
    }
}

function handlePlayerEnemyCollision(e) {
    if (e.isBuddy) return;  // can't stomp a teammate
    if (Math.abs(e.x - game.px) < TILE * 0.8 && Math.abs(e.y - game.py) < TILE * 0.8) {
        if (game.pvy > 0 && game.py < e.y - TILE / 3) {
            // V1.8.2: stomp recruits the opponent (legal "tap" in sumo)
            game.pvy = JVEL * 0.6;
            game.combo++; game.comboTimer = 2;
            if (game.combo > 1) SFX.combo(game.combo);
            recruitEnemy(e, 'goomba');
        } else if (game.pStar > 0) {
            // Star power still dispatches enemies cleanly
            e.hp = 0; game.score += 200; spawnParticles(e.x, e.y, STAR_YLW, 6);
        } else if (game.pInv <= 0) {
            hurtPlayer();
        }
    }
}

function handlePlayerKoopaCollision(e) {
    if (e.isBuddy) return;
    if (Math.abs(e.x - game.px) < TILE * 0.8 && Math.abs(e.y - game.py) < TILE * 0.8) {
        if (game.pvy > 0 && game.py < e.y - TILE / 3) {
            // V1.8.2: recruit the koopa (recruits as shell-buddy)
            game.pvy = JVEL * 0.5;
            recruitEnemy(e, 'shell');
        } else if (game.pStar > 0) {
            e.hp = 0; game.score += 200; spawnParticles(e.x, e.y, STAR_YLW, 6);
        } else if (game.pInv <= 0) {
            hurtPlayer();
        }
    }
}

function handlePlayerShellCollision(e) {
    if (e.isBuddy) return;
    if (Math.abs(e.x - game.px) < TILE * 0.8 && Math.abs(e.y - game.py) < TILE * 0.8) {
        if (game.pvy > 0 && game.py < e.y - TILE / 3) {
            // V1.8.2: recruit the shell
            e.shellVx = 0; game.pvy = JVEL * 0.5;
            recruitEnemy(e, 'shell');
        } else if (game.pStar > 0) {
            e.hp = 0; game.score += 200;
        } else if (game.pInv <= 0) {
            if (Math.abs(game.pvx) > 10) {
                e.shellVx = game.pDir > 0 ? 350 : -350; SFX.shellKick(); shakeCamera(3);
            } else {
                hurtPlayer();
            }
        }
    }
}

function hurtPlayer() {
    if (game.pMode > 0) {
        game.pMode = 0; game.pOnFire = false; game.pInv = 2.0; SFX.hurt(); shakeCamera(5);
    } else {
        // V1.8.2: a life-lost sends the buddies home with sparkles
        dismissAllBuddies();
        game.lives--; SFX.hurt(); shakeCamera(6);
        if (game.lives <= 0) { STATE = 'GAMEOVER'; stopBGM(); SFX.die(); }
        else game.pInv = 2.0;
    }
}

function updateFireballs(dt) {
    for (var fi = game.fireballs.length - 1; fi >= 0; fi--) {
        var fb = game.fireballs[fi];
        fb.x += fb.vx * dt; fb.vy += GRAV * 0.5 * dt; fb.y += fb.vy * dt;
        if (fb.y >= (WH - 3) * TILE) { fb.y = (WH - 3) * TILE; fb.vy = -350; fb.bounces++; spawnParticles(fb.x, fb.y, '#fff4b0', 3); }
        if (fb.bounces > 3 || fb.x < game.cam - 100 || fb.x > game.cam + W + 100) { game.fireballs.splice(fi, 1); continue; }
        for (var ei = 0; ei < game.enemies.length; ei++) {
            var e2 = game.enemies[ei];
            if (e2.isBuddy || e2.hp <= 0 || e2.type === 'powerup') continue;
            if (Math.abs(e2.x - fb.x) < TILE && Math.abs(e2.y - fb.y) < TILE) {
                // V1.8.2: fireball also recruits (not kills) the opponent
                var kind = e2.type === 'koopa' ? 'shell' : 'goomba';
                recruitEnemy(e2, kind);
                game.fireballs.splice(fi, 1); break;
            }
        }
    }
}

function makePowerup(x, y, type) {
    return { x: x, y: y, t: 0, type: 'powerup', puType: type, active: true, vy: -200, py: y };
}
