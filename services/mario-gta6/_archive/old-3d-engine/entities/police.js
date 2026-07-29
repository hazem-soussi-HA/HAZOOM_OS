// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// ENTITIES: POLICE
// GTA-style police chase system with wanted level
// ═══════════════════════════════════════════════════════════════

var policeList = [];
var policeSirenTimer = 0;
var policeSirenPhase = 0;
var policeTickTimer = 0;

function spawnPolice() {
    if (!game || game.wanted <= 0) return;
    var count = Math.min(game.wanted, 4);
    while (policeList.length < count) {
        var spawnX, spawnSide = Math.random() > 0.5;
        if (spawnSide) {
            spawnX = game.cam - 80 - Math.random() * 200;
        } else {
            spawnX = game.cam + W + 80 + Math.random() * 200;
        }
        policeList.push({
            x: spawnX,
            y: (WH - 3) * TILE,
            vx: 0,
            maxSpeed: 180 + game.wanted * 30 + Math.random() * 40,
            hp: 2,
            active: true,
            lightTimer: Math.random() * 2,
            lightPhase: Math.random() > 0.5 ? 0 : Math.PI,
            dir: spawnX < game.px ? 1 : -1,
            sirenOn: true,
            tireSmoke: 0,
            bumpCooldown: 0
        });
    }
}

function updatePolice(dt) {
    if (!game || game.wanted <= 0) {
        if (policeList.length > 0) {
            for (var di = 0; di < policeList.length; di++) {
                policeList[di].sirenOn = false;
                policeList[di].maxSpeed = 60;
            }
        }
        return;
    }
    spawnPolice();
    policeSirenTimer += dt;
    policeTickTimer += dt;
    if (policeSirenTimer > 0.35) {
        policeSirenTimer -= 0.35;
        policeSirenPhase = (policeSirenPhase + 1) % 2;
        if (typeof SFX !== 'undefined' && SFX.siren) {
            var sirenDist = getClosestPoliceDist();
            if (sirenDist < W * 1.5) {
                var vol = Math.max(0.01, 0.06 * (1 - sirenDist / (W * 1.5)));
                SFX.siren(policeSirenPhase === 0 ? 650 : 850, vol);
            }
        }
    }
    for (var i = policeList.length - 1; i >= 0; i--) {
        var cop = policeList[i];
        if (!cop.active) continue;
        var dx = game.px - cop.x;
        var dist = Math.abs(dx);
        cop.dir = dx > 0 ? 1 : -1;
        var targetVx = cop.dir * cop.maxSpeed;
        if (dist < TILE * 0.5) {
            targetVx = cop.dir * cop.maxSpeed * 0.3;
        }
        var accel = dist > TILE * 3 ? 120 : 80;
        cop.vx += (targetVx - cop.vx) * Math.min(accel * dt, 1.0);
        if (Math.abs(cop.vx) > cop.maxSpeed) cop.vx = cop.dir * cop.maxSpeed;
        cop.x += cop.vx * dt;
        cop.y = (WH - 3) * TILE;
        cop.lightTimer += dt;
        if (cop.bumpCooldown > 0) cop.bumpCooldown -= dt;
        cop.tireSmoke = Math.max(0, cop.tireSmoke - dt * 3);
        if (Math.abs(cop.vx) > cop.maxSpeed * 0.8 && Math.random() < 0.3) {
            cop.tireSmoke = 1;
            spawnParticles(cop.x - cop.dir * TILE, cop.y, '#888888', 1);
        }
        if (dist < TILE * 0.9 && Math.abs(game.py - cop.y) < TILE && cop.bumpCooldown <= 0) {
            handlePolicePlayerCollision(cop, i);
        }
        if (cop.x < game.cam - 600 || cop.x > game.cam + W + 600) {
            if ((cop.dir < 0 && cop.x < game.cam) || (cop.dir > 0 && cop.x > game.cam + W)) {
                cop.x = cop.dir < 0 ? game.cam - 100 : game.cam + W + 100;
            }
        }
    }
}

function handlePolicePlayerCollision(cop, idx) {
    if (!game) return;
    if (game.pInv > 0) {
        if (Math.abs(game.pvx) > 10) {
            cop.x += game.pDir * TILE * 0.5;
            cop.vx = game.pDir * 300;
            spawnExplosion(cop.x, cop.y - TILE / 2, '#ffcc00', 8);
            cop.bumpCooldown = 0.5;
            shakeCamera(3);
        }
        return;
    }
    if (game.pvy > 0 && game.py < cop.y - TILE / 3) {
        cop.hp--;
        game.pvy = JVEL * 0.5;
        if (cop.hp <= 0) {
            cop.active = false;
            spawnExplosion(cop.x, cop.y - TILE / 2, '#ff4400', 20);
            spawnExplosion(cop.x, cop.y - TILE / 2, '#ffcc00', 12);
            shakeCamera(6);
            game.score += 500;
            addScorePopup(cop.x, cop.y - TILE, '500 COP CRUSHED');
            game.wanted = Math.max(0, game.wanted - 1);
        } else {
            spawnExplosion(cop.x, cop.y - TILE / 2, '#ffffff', 6);
            shakeCamera(3);
            addScorePopup(cop.x, cop.y - TILE, 'DAMAGED COP');
        }
        cop.bumpCooldown = 0.8;
        if (cop.hp <= 0) {
            policeList.splice(idx, 1);
        }
        return;
    }
    game.lives--;
    game.wanted = Math.max(0, game.wanted - 1);
    spawnExplosion(game.px, game.py - TILE / 2, '#ff0000', 15);
    shakeCamera(8);
    SFX.hurt();
    cop.bumpCooldown = 2.0;
    if (game.lives <= 0) {
        STATE = 'GAMEOVER';
        stopBGM();
        SFX.die();
    } else {
        game.pInv = 3.0;
        if (game.pMode > 0) {
            game.pMode = 0;
            game.pOnFire = false;
        }
    }
    if (cop.hp <= 0) {
        policeList.splice(idx, 1);
    }
}

function getClosestPoliceDist() {
    var best = 999999;
    for (var i = 0; i < policeList.length; i++) {
        if (!policeList[i].active) continue;
        var d = Math.abs(policeList[i].x - game.px);
        if (d < best) best = d;
    }
    return best;
}

function drawPolice() {
    if (!policeList || policeList.length === 0) return;
    for (var i = 0; i < policeList.length; i++) {
        var cop = policeList[i];
        if (!cop.active) continue;
        var copScreenX = Math.floor(cop.x - Math.floor(game.cam));
        var copScreenY = Math.floor(cop.y);
        if (copScreenX < -TILE * 3 || copScreenX > W + TILE * 3) continue;
        ctx.save();
        if (cop.dir < 0) {
            ctx.translate(copScreenX + TILE, copScreenY - TILE / 2);
            ctx.scale(-1, 1);
            ctx.translate(-(copScreenX + TILE), -(copScreenY - TILE / 2));
        }
        ctx.fillStyle = '#0a0a1a';
        ctx.beginPath();
        ctx.roundRect(copScreenX, copScreenY - TILE / 2, TILE * 2, TILE / 2, 6);
        ctx.fill();
        ctx.fillStyle = '#111128';
        ctx.strokeStyle = '#222244';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(copScreenX, copScreenY - TILE / 2, TILE * 2, TILE / 2, 6);
        ctx.stroke();
        ctx.fillStyle = '#1a1a30';
        ctx.beginPath();
        ctx.roundRect(copScreenX + TILE / 2, copScreenY - TILE, TILE, TILE / 2, 4);
        ctx.fill();
        ctx.fillStyle = '#1a2a50';
        ctx.beginPath();
        ctx.roundRect(copScreenX + TILE / 2 + 4, copScreenY - TILE + 4, TILE - 8, TILE / 3, 2);
        ctx.fill();
        ctx.fillStyle = '#0d0d0d';
        ctx.beginPath();
        ctx.arc(copScreenX + TILE / 3, copScreenY, TILE / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(copScreenX + TILE * 5 / 3, copScreenY, TILE / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(copScreenX + TILE / 3, copScreenY, TILE / 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(copScreenX + TILE * 5 / 3, copScreenY, TILE / 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(copScreenX + TILE * 2 - 4, copScreenY - TILE / 2 + 6, 4, 8);
        ctx.fillRect(copScreenX, copScreenY - TILE / 2 + 6, 4, 8);
        if (cop.sirenOn) {
            var flashPhase = Math.floor(cop.lightTimer * 6) % 3;
            if (flashPhase === 0) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
                ctx.beginPath();
                ctx.arc(copScreenX + TILE / 2, copScreenY - TILE - 2, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(copScreenX + TILE / 2, copScreenY - TILE - 2, 10, 0, Math.PI * 2);
                ctx.fill();
            } else if (flashPhase === 1) {
                ctx.fillStyle = 'rgba(0, 50, 255, 0.9)';
                ctx.beginPath();
                ctx.arc(copScreenX + TILE * 3 / 4, copScreenY - TILE - 2, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(0, 50, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(copScreenX + TILE * 3 / 4, copScreenY - TILE - 2, 10, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                ctx.beginPath();
                ctx.arc(copScreenX + TILE / 2, copScreenY - TILE - 2, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(0, 50, 255, 0.7)';
                ctx.beginPath();
                ctx.arc(copScreenX + TILE * 3 / 4, copScreenY - TILE - 2, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        if (cop.hp < 2) {
            ctx.fillStyle = 'rgba(255, 60, 0, 0.15)';
            ctx.beginPath();
            ctx.arc(copScreenX + TILE, copScreenY - TILE / 3, TILE * 0.7, 0, Math.PI * 2);
            ctx.fill();
            if (Math.random() < 0.1) {
                ctx.fillStyle = 'rgba(255, 100, 0, ' + (Math.random() * 0.5 + 0.3) + ')';
                ctx.beginPath();
                ctx.arc(copScreenX + TILE + (Math.random() - 0.5) * TILE, copScreenY - TILE * 0.6 - Math.random() * TILE, 2 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.font = 'bold 7px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('POLICE', copScreenX + TILE, copScreenY - TILE / 2 + 4);
        ctx.restore();
    }
}

function clearExpiredPolice() {
    var margin = W * 2;
    for (var i = policeList.length - 1; i >= 0; i--) {
        var cop = policeList[i];
        if (Math.abs(cop.x - game.px) > margin && !cop.sirenOn) {
            policeList.splice(i, 1);
        }
    }
}
