// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// ENGINE: PHYSICS
// All physics, collision, entity updates
//
// V1.8.0 — Rust→WASM hot path. The heavy loops (enemy update,
// particle, popup, car, fireball) can run in compiled Rust for
// 5-15× speedup. JS is the fallback when WebAssembly is unavailable
// or the WASM module fails to load.
// ═══════════════════════════════════════════════════════════════

function updatePhysics(dt) {
    // 1. Player physics (always JS — small, complex side effects)
    updatePlayerPhysics(dt);

    // 2. Heavy loops: enemies / fireballs / cars / particles / popups
    if (typeof WASM !== 'undefined' && WASM.ready) {
        physicsStepWasm(dt);
    } else {
        updateEnemies(dt);
        updateFireballs(dt);
        // Cars
        for (var ci = 0; ci < game.cars.length; ci++) {
            var c = game.cars[ci]; c.x += c.vx * dt;
            if (c.x < 0 || c.x > WW * TILE) c.vx *= -1;
        }
        // Particles
        for (var pi = game.particles.length - 1; pi >= 0; pi--) {
            var p = game.particles[pi];
            p.x += p.vx * dt; p.y += p.vy * dt; p.vy += GRAV * 0.5 * dt; p.life -= dt;
            if (p.life <= 0) game.particles.splice(pi, 1);
        }
        // Score popups
        for (var si = game.scorePopups.length - 1; si >= 0; si--) {
            var sp = game.scorePopups[si]; sp.y -= 40 * dt; sp.life -= dt;
            if (sp.life <= 0) game.scorePopups.splice(si, 1);
        }
    }

    // 2b. V1.8.2: Sumo Buddies AI runs in JS only (WASM skips hp=0 slots)
    if (typeof updateBuddies === 'function') updateBuddies(dt);

    // 2c. V1.8.2: passive score from each buddy (+1/s/buddy)
    if (typeof game !== 'undefined' && game && typeof countBuddies === 'function') {
        var n = countBuddies();
        if (n > 0) game.score += n * dt;
    }

    // 2d. V1.9.0: Police chase system
    if (typeof updatePolice === 'function') updatePolice(dt);
    if (typeof clearExpiredPolice === 'function') clearExpiredPolice();

    // 3. Camera
    updateCamera(dt);

    // 4. Timer + invincibility
    if (WASM.ready) {
        // WASM already decremented these; read back
        game.time = WASM.playerF32[14];
    } else {
        game.time -= dt;
        if (game.time <= 0) {
            game.lives--; SFX.die();
            if (game.lives <= 0) { STATE = 'GAMEOVER'; stopBGM(); }
            else { game.time = 400; game.px = 3 * TILE; game.py = (WH - 3) * TILE; game.pvx = 0; game.pvy = 0; game.pInv = 3.0; }
        }
        if (game.pStar > 0) { game.pStar -= dt; if (game.pStar <= 0) game.pStar = 0; }
        if (game.pInv > 0) game.pInv -= dt;
    }

    // 5. Car entry/exit (always JS)
    if (isAction('car') && consumeKey(actionKey('car', 'f'))) {
        initAudio();
        if (game.pOnCar) {
            game.pOnCar = false; game.pCar = null; SFX.enterCar();
        } else {
            for (var ci2 = 0; ci2 < game.cars.length; ci2++) {
                var c3 = game.cars[ci2];
                if (Math.abs(c3.x - game.px) < TILE * 2 && Math.abs(c3.y - game.py) < TILE * 2) {
                    enterRacingMode(c3);
                    return;
                }
            }
        }
    }

    // 6. Simple 2D car driving (fallback)
    if (game.pOnCar && game.pCar && STATE !== 'RACING') {
        var c4 = game.pCar; game.px = c4.x; game.py = c4.y - TILE;
        var steerInput = (isKey('a') || touchState.left ? -1 : 0) + (isKey('d') || touchState.right ? 1 : 0);
        var throttleInput = (isKey('d') || touchState.right) ? 1 : 0;
        var brakeInput = (isKey('a') || touchState.left) ? 1 : 0;
        if (isKey('d') || touchState.right) c4.vx = Math.min(c4.vx + 200 * dt, 400);
        else if (isKey('a') || touchState.left) c4.vx = Math.max(c4.vx - 200 * dt, -200);
        else { c4.vx *= Math.max(0, 1 - 3 * dt); if (Math.abs(c4.vx) < 1) c4.vx = 0; }
        if (c4.vx !== 0 && Math.random() < 0.15) spawnParticles(c4.x - c4.vx * 0.01, c4.y, '#666666', 2);
        if (typeof Car3D !== 'undefined') {
            if (!Car3D.active) Car3D.enter();
            Car3D.setInput(throttleInput, brakeInput, steerInput);
        }
    } else if (typeof Car3D !== 'undefined' && Car3D.active) {
        Car3D.exit();
    }
}

function updatePlayerPhysics(dt) {
    var g = (WH - 3) * TILE - 2;
    var ax = 0;
    if (isKey('a') || isKey('ArrowLeft') || touchState.left) ax = -1;
    if (isKey('d') || isKey('ArrowRight') || touchState.right) ax = 1;
    var jmp = isKey(' ') || isKey('w') || isKey('ArrowUp') || touchState.jump;
    var run = isKey('Shift') || touchState.run;
    var fireBtn = (isKey('e') || isKey('x') || touchState.fire) && (consumeKey('e') || consumeKey('x'));
    if (touchState.fire && !keys['e']) { fireBtn = true; touchState.fire = false; }
    var spd = run ? RUN : WALK;

    game.pAir = game.py < g - 1;

    var ac = !game.pAir ? AG : AY;
    if (ax) {
        game.pvx += (ax * spd - game.pvx) * Math.min(ac * dt, 1.0);
        game.pDir = ax > 0 ? 1 : 0;
    } else {
        var dc = !game.pAir ? DG : DA;
        if (dc === DG) game.pvx *= Math.max(0, 1 - 12 * dt);
        else game.pvx *= Math.max(0, 1 - 5 * dt);
        if (Math.abs(game.pvx) < 5) game.pvx = 0;
    }

    if (game.pAir) game.pCoyote = Math.max(0, game.pCoyote - dt);
    else game.pCoyote = COYOTE;
    if (jmp) game.pJbuf = JBUF;
    else game.pJbuf = Math.max(0, game.pJbuf - dt);

    var canJmp = !game.pAir || game.pCoyote > 0;
    if (game.pJbuf > 0 && canJmp && !game.pJmp) {
        game.pvy = jmp ? JVEL : SHOP;
        game.pJmp = true; game.pCoyote = 0; game.pJbuf = 0; game.pJhold = 0;
        game.pSqY = 0.7; game.pSqX = 1.3;
        SFX.jump();
        if (game.pStar > 0) spawnParticles(game.px, game.py, STAR_YLW, 6);
    }

    if (game.pJmp && jmp && game.pvy < 0) {
        game.pJhold += dt;
        game.pvy += GRAV * (game.pJhold < JHOLD ? 0.4 : 1.0) * dt;
    } else if (game.pAir) {
        game.pvy += GRAV * dt;
    }
    if (game.pvy > MFALL) game.pvy = MFALL;
    if (game.pStar > 0) game.pvy *= 0.999;

    game.px += game.pvx * dt;
    game.py += game.pvy * dt;

    // ═══ V1.8.3 — TILE COLLISION ═══
    // The player visual is 48×48 (TILE). We use a slightly smaller
    // collision box (44×44) so the player can brush past corners
    // without snagging, but is firmly stopped by solid walls.
    // The collision box is centered on (px, py) horizontally and
    // anchored at the BOTTOM (py) vertically — this is the standard
    // Mario "feet at py" convention.
    var PW = 44, PH = 44;       // player collision width/height
    var PHX = PW * 0.5;          // half-width
    var PLAYER_LEFT   = game.px - PHX;
    var PLAYER_RIGHT  = game.px + PHX;
    var PLAYER_TOP    = game.py - PH;
    var PLAYER_BOTTOM = game.py;

    // 1. Horizontal wall collision — check 3 columns of tiles around
    //    the player's body and slide along the wall if blocked.
    var wasVX = game.pvx;
    if (game.pvx > 0) {
        // Moving right — check the column at PLAYER_RIGHT
        var rx = Math.floor(PLAYER_RIGHT / TILE);
        var ry0 = Math.max(0, Math.floor(PLAYER_TOP / TILE));
        var ry1 = Math.min(WH - 1, Math.floor(PLAYER_BOTTOM / TILE));
        for (var ty = ry0; ty <= ry1; ty++) {
            if (isTileSolid(getTile(rx, ty))) {
                // Push player back to the left edge of this tile
                game.px = rx * TILE - PHX - 0.01;
                game.pvx = 0;
                break;
            }
        }
    } else if (game.pvx < 0) {
        // Moving left — check the column at PLAYER_LEFT
        var lx = Math.floor(PLAYER_LEFT / TILE);
        var ry0b = Math.max(0, Math.floor(PLAYER_TOP / TILE));
        var ry1b = Math.min(WH - 1, Math.floor(PLAYER_BOTTOM / TILE));
        for (var ty = ry0b; ty <= ry1b; ty++) {
            if (isTileSolid(getTile(lx, ty))) {
                // Push player back to the right edge of this tile
                game.px = (lx + 1) * TILE + PHX + 0.01;
                game.pvx = 0;
                break;
            }
        }
    }
    if (wasVX !== 0 && game.pvx === 0) {
        // Wall hit — small bump feedback (only on a clean stop)
        spawnParticles(game.px + (wasVX > 0 ? PHX : -PHX), game.py - PH * 0.5, GRD, 2);
    }

    // 2. Vertical collision — the "feet" check is the ground floor,
    //    but the player should also be stopped by solid ceilings
    //    when jumping up. The head-bump effect handles tiles 2, 3, 8
    //    specifically (block reactions) — generic solid ceilings just
    //    bonk the player back down.
    if (game.py >= g) {
        if (!game.pWasG && game.pvy > 200) {
            var imp = Math.min(game.pvy / 800, 1.0);
            game.pSqY = 1.0 + imp * 0.4;
            game.pSqX = 1.0 - imp * 0.25;
            spawnParticles(game.px, g, GRD, 5);
            shakeCamera(imp * 3);
        }
        game.py = g; game.pvy = 0; game.pJmp = false; game.pWasG = true;
    } else {
        game.pWasG = false;
    }

    // 3. Ceiling check — if the player is moving up and the tile
    //    above their head is a generic solid (1, 4, 5, 6, 7, 10),
    //    bonk them back down. Blocks 2/3/8 are handled by head_bump
    //    below and produce score/popup effects.
    if (game.pvy < 0) {
        var cx = Math.floor(game.px / TILE);
        var cy = Math.floor((game.py - PH) / TILE);
        var ct = getTile(cx, cy);
        if (isTileSolid(ct) && ct !== 2 && ct !== 3 && ct !== 8) {
            game.py = (cy + 1) * TILE + PH;
            game.pvy = 50;
        }
    }

    if (game.py > WH * TILE + 200) {
        game.lives--; SFX.die(); shakeCamera(8);
        if (game.lives <= 0) { STATE = 'GAMEOVER'; stopBGM(); }
        else { game.px = 3 * TILE; game.py = g; game.pvx = 0; game.pvy = 0; game.pInv = 3.0; }
    }

    game.pSqY += (1 - game.pSqY) * 15 * dt;
    game.pSqX += (1 - game.pSqX) * 15 * dt;
    game.px = Math.max(0, Math.min(WW * TILE - TILE, game.px));

    // Head bump — V1.8.3: check the tile at the player's HEAD (py - PH),
    // not the player's feet tile, so the trigger lines up with the visual.
    var htx = Math.floor(game.px / TILE);
    var hty = Math.floor((game.py - PH) / TILE);
    var ht = getTile(htx, hty);
    if (isTileSolid(ht) && game.pvy < 0 && game.py - PH < (hty + 1) * TILE) {
        // Snap the player's head to the bottom of the solid tile
        game.py = (hty + 1) * TILE + PH;
        game.pvy = 50;
        if (ht === 3) {
            game.coins++; game.score += 200; SFX.coin();
            game.lvl[hty][htx] = 9;
            spawnParticles(htx * TILE + TILE / 2, hty * TILE, YLW, 8);
            shakeCamera(2);
            addScorePopup(htx * TILE, hty * TILE - 20, '200');
            if (typeof checkCoinMilestone === 'function') checkCoinMilestone();
            if (typeof awardPlumberXP === 'function') awardPlumberXP(2, 'coin');
        } else if (ht === 8) {
            game.score += 1000; SFX.coin(); game.lvl[hty][htx] = 9;
            spawnParticles(htx * TILE + TILE / 2, hty * TILE, YLW, 12);
            shakeCamera(3);
            addScorePopup(htx * TILE, hty * TILE - 20, '1000');
            var puType = Math.random() > 0.5 ? 'mushroom' : 'fire';
            game.enemies.push(makePowerup(htx * TILE, (hty - 1) * TILE, puType));
            if (typeof awardPlumberXP === 'function') awardPlumberXP(8, '? block');
        } else if (ht === 2 && game.pMode > 0) {
            game.lvl[hty][htx] = 0; game.score += 50; SFX.breakBrick(); shakeCamera(3);
            spawnParticles(htx * TILE + TILE / 2, hty * TILE + 10, BRC, 10);
            addScorePopup(htx * TILE, hty * TILE - 20, '50');
            if (typeof awardPlumberXP === 'function') awardPlumberXP(3, 'brick');
        }
    }

    // Combo timer
    if (game.comboTimer > 0) { game.comboTimer -= dt; if (game.comboTimer <= 0) game.combo = 0; }

    // Fireballs (spawn)
    if (fireBtn && game.pOnFire && game.fireballs.length < 2) {
        game.fireballs.push({
            x: game.px + (game.pDir > 0 ? TILE : -TILE),
            y: game.py - TILE / 2,
            vx: (game.pDir > 0 ? 1 : -1) * FIREBALL_SPEED, vy: 0, bounces: 0
        });
        SFX.fireball();
    }
}

// ═══════════════════════════════════════════════════════════════
// WASM FAST PATH
// ═══════════════════════════════════════════════════════════════

function physicsStepWasm(dt) {
    // Skip per-frame map sync — the map is large (4000 bytes) and
    // rarely changes (only on head bump coin/question/brick events).
    // It's synced once at initGame and mutated via dirty-tile set
    // after each step (see drainEvents + syncMapFromWasm).
    syncEnemiesToWasm(game.enemies);
    syncFireballsToWasm(game.fireballs);
    syncCarsToWasm(game.cars);
    syncParticlesToWasm(game.particles);
    syncPopupsToWasm(game.scorePopups);
    syncPlayerToWasm(game);

    // Step
    const events = stepWasm(dt);

    // Sync state out
    syncEnemiesFromWasm(game.enemies);
    syncFireballsFromWasm(game.fireballs);
    syncCarsFromWasm(game.cars);
    syncParticlesFromWasm(game.particles);
    syncPopupsFromWasm(game.scorePopups);
    syncPlayerFromWasm(game);
    syncMapFromWasm(game.lvl);

    // Process events
    for (const ev of events) {
        if (window._WASM_DEBUG) console.log('[WASM ev]', ev.type, 'ty=' + ev.ty, 'x=' + ev.x, 'y=' + ev.y);
        handleWasmEvent(ev);
    }
}

function handleWasmEvent(ev) {
    switch (ev.type) {
        case 1: // COIN
            game.coins++; game.score += 200; SFX.coin();
            spawnParticles(ev.x, ev.y, YLW, 8); shakeCamera(2);
            addScorePopup(ev.tx * TILE, ev.ty * TILE - 20, '200');
            if (typeof checkCoinMilestone === 'function') checkCoinMilestone();
            if (typeof awardPlumberXP === 'function') awardPlumberXP(2, 'coin');
            break;
        case 2: // QUESTION BLOCK
            game.score += 1000; SFX.coin();
            spawnParticles(ev.x, ev.y, YLW, 12); shakeCamera(3);
            addScorePopup(ev.tx * TILE, ev.ty * TILE - 20, '1000');
            var puType = Math.random() > 0.5 ? 'mushroom' : 'fire';
            game.enemies.push(makePowerup(ev.tx * TILE, (ev.ty - 1) * TILE, puType));
            if (typeof awardPlumberXP === 'function') awardPlumberXP(8, '? block');
            break;
        case 3: // BRICK
            game.score += 50; SFX.breakBrick(); shakeCamera(3);
            spawnParticles(ev.x, ev.y + 10, BRC, 10);
            addScorePopup(ev.tx * TILE, ev.ty * TILE - 20, '50');
            if (typeof awardPlumberXP === 'function') awardPlumberXP(3, 'brick');
            break;
        case 4: // PIT DEATH
            game.lives--; SFX.die(); shakeCamera(8);
            if (game.lives <= 0) { STATE = 'GAMEOVER'; stopBGM(); }
            else { game.px = 3 * TILE; game.py = (WH - 3) * TILE - 2; game.pvx = 0; game.pvy = 0; game.pInv = 3.0; }
            break;
            case 5: // STOMP
                // V1.8.2: WASM fires STOMP events on enemy contact, but the
                // stomp handler now recruits the opponent instead of killing
                // them. The ev.x/ev.y is the enemy position, so we look up
                // which enemy is nearest and convert it into a buddy.
                if (typeof recruitEnemy === 'function' && typeof game !== 'undefined' && game && game.enemies) {
                    // Find the enemy closest to (ev.x, ev.y). Note: we do
                    // NOT skip hp<=0 here, because the WASM has already set
                    // hp=0 on the stomped enemy. The stomped enemy is the
                    // absolute nearest (distance 0) so it'll be picked first.
                    var nearest = null, bestD = 1e9;
                    for (var _ei = 0; _ei < game.enemies.length; _ei++) {
                        var _e = game.enemies[_ei];
                        if (_e.isBuddy || _e.type === 'powerup') continue;
                        var _dx = _e.x - ev.x, _dy = _e.y - ev.y;
                        var _d = _dx * _dx + _dy * _dy;
                        if (_d < bestD) { bestD = _d; nearest = _e; }
                    }
                    if (nearest) {
                        // Stomp impulse (player bounces up) regardless of recruit
                        if (ev.ty === 0 || ev.ty === 1) game.pvy = JVEL * 0.6;
                        else game.pvy = JVEL * 0.5;
                        var kind = (nearest.type === 'koopa') ? 'shell' : 'goomba';
                        if (ev.ty === 1) {
                            // Stomp combo from WASM: same as JS, combo applied
                            game.combo++; game.comboTimer = 2;
                            if (game.combo > 1) SFX.combo(game.combo);
                        }
                        recruitEnemy(nearest, kind);
                    } else {
                        // Fallback: no enemy found (already dismissed?); do a
                        // soft particles + score event so the player still
                        // gets feedback.
                        spawnParticles(ev.x, ev.y, '#ffd700', 6);
                    }
                } else {
                    // recruitEnemy not loaded — extremely defensive fallback
                    game.score += 100;
                    spawnParticles(ev.x, ev.y, GOM, 4);
                }
            break;
        case 6: // SHELL_KICK
            shakeCamera(3); SFX.shellKick();
            break;
        case 7: // POWERUP_COLLECT
            // ev.ty encodes pu type: 0=mushroom, 1=fire, 2=star
            if (ev.ty === 0) {
                if (game.pMode === 0) { game.pMode = 1; SFX.mushroom(); }
                game.score += 1000;
            } else if (ev.ty === 1) {
                game.pMode = 2; game.pOnFire = true; SFX.mushroom(); game.score += 1000;
            } else if (ev.ty === 2) {
                game.pStar = 8.0; SFX.star(); game.score += 2000;
            }
            addScorePopup(ev.x, ev.y - 20, '1000');
            break;
        case 9: // LIFE_LOST
            hurtPlayer();
            break;
        case 10: // BUMP (generic particle burst)
            spawnParticles(ev.x, ev.y, GRD, 5);
            break;
        case 11: // TIME_OUT
            game.lives--; SFX.die();
            if (game.lives <= 0) { STATE = 'GAMEOVER'; stopBGM(); }
            else { game.time = 400; game.px = 3 * TILE; game.py = (WH - 3) * TILE - 2; game.pvx = 0; game.pvy = 0; game.pInv = 3.0; }
            break;
    }
}

// ═══════════════════════════════════════════════════════════════
// JS FALLBACK FUNCTIONS (when WASM is unavailable)
// ═══════════════════════════════════════════════════════════════

function getTile(tx, ty) {
    return (tx >= 0 && tx < WW && ty >= 0 && ty < WH) ? game.lvl[ty][tx] : 1;
}

function isTileSolid(t) { return [1,2,3,4,5,6,7,8,9,10].indexOf(t) >= 0; }
function isHatTile(t, hat) {
    if (t === 11) return hat === 'plumber';
    if (t === 12) return hat === 'driver';
    return true;
}
function getHatZoneMsg(tile) {
    if (tile === 11) return 'Plumber Hat needed';
    if (tile === 12) return 'Driver Cap needed';
    return null;
}

function spawnParticles(x, y, col, n) {
    var altColors = [];
    if (col === GRD) altColors = ['#c84c0c', '#e8844c', '#a03808', '#8b6914'];
    else if (col === YLW) altColors = ['#ffdc00', '#ffe84c', '#ffd000', '#fff4b0'];
    else if (col === BRC) altColors = ['#b82818', '#d84838', '#982010', '#781808'];
    else if (col === '#666666') altColors = ['#666666', '#888888', '#444444', '#aaaaaa'];
    else if (col === GOM) altColors = ['#a46424', '#c4844c', '#844c18', '#e0a060'];
    else if (col === KOOPA_GREEN) altColors = ['#2d8a4e', '#48b868', '#1a5c30', '#6ed88e'];
    else if (col === '#ffd700') altColors = ['#ffd700', '#ffe44d', '#cc9900', '#fff090'];
    else altColors = [col, col, col, col];
    for (var i = 0; i < n; i++) {
        var speedMul = 0.6 + Math.random() * 1.2;
        var angle = -Math.PI * Math.random();
        var speed = (150 + Math.random() * 200) * speedMul;
        var useAlt = altColors[Math.floor(Math.random() * altColors.length)];
        var useCol = Math.random() < 0.6 ? col : useAlt;
        game.particles.push({
            x: x + (Math.random() - 0.5) * 8,
            y: y + (Math.random() - 0.5) * 8,
            vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random()),
            vy: Math.sin(angle) * speed - 80,
            c: useCol,
            life: 0.3 + Math.random() * 0.7,
            sz: 1 + Math.floor(Math.random() * 8),
            rot: Math.random() * Math.PI * 2,
            rotSpd: (Math.random() - 0.5) * 6
        });
    }
}

function spawnExplosion(x, y, color, count) {
    var num = count || 16;
    var rays = 8;
    for (var ray = 0; ray < rays; ray++) {
        var angle = (ray / rays) * Math.PI * 2;
        var raySpeed = 120 + Math.random() * 180;
        var rCol = color;
        if (Math.random() < 0.3) {
            var hotColors = ['#ff4444', '#ff8800', '#ffcc00', '#ffffff', '#ff6600'];
            rCol = hotColors[Math.floor(Math.random() * hotColors.length)];
        }
        game.particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * raySpeed + (Math.random() - 0.5) * 60,
            vy: Math.sin(angle) * raySpeed + (Math.random() - 0.5) * 60,
            c: rCol,
            life: 0.4 + Math.random() * 0.6,
            sz: 2 + Math.floor(Math.random() * 7),
            rot: Math.random() * Math.PI * 2,
            rotSpd: (Math.random() - 0.5) * 8
        });
    }
    for (var i = 0; i < num; i++) {
        var a = Math.random() * Math.PI * 2;
        var spd = 40 + Math.random() * 200;
        var sCol = color;
        if (Math.random() < 0.25) {
            var sparks = ['#ffcc00', '#ffffff', '#ff6600', '#ffaa00'];
            sCol = sparks[Math.floor(Math.random() * sparks.length)];
        }
        game.particles.push({
            x: x + (Math.random() - 0.5) * 4,
            y: y + (Math.random() - 0.5) * 4,
            vx: Math.cos(a) * spd,
            vy: Math.sin(a) * spd - 40,
            c: sCol,
            life: 0.2 + Math.random() * 0.5,
            sz: 1 + Math.floor(Math.random() * 6),
            rot: Math.random() * Math.PI * 2,
            rotSpd: (Math.random() - 0.5) * 10
        });
    }
}

function addScorePopup(x, y, text) {
    game.scorePopups.push({ x: x, y: y, text: text, life: 1.0 });
}

function shakeCamera(amount) {
    game.camShake = Math.max(game.camShake, amount);
}

function updateCamera(dt) {
    var target = game.px - W / 3;
    target = Math.max(0, Math.min(WW * TILE - W, target));
    game.cam += (target - game.cam) * 10 * dt;
    if (game.camShake > 0) game.camShake *= 0.9;
    if (game.camShake < 0.5) game.camShake = 0;
}
