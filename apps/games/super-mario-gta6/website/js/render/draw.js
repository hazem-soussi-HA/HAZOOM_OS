// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// RENDER: DRAW
// Main render pipeline — sky, tiles, entities, player, HUD
// ═══════════════════════════════════════════════════════════════

function draw() {
    ctx.save();
    if (game.camShake > 0) ctx.translate((Math.random() - 0.5) * game.camShake * 2, (Math.random() - 0.5) * game.camShake);

    drawSky();
    drawBackground();
    if (typeof drawBuildingDepth === 'function') drawBuildingDepth();
    drawTiles();
    drawEnemies();
    drawFireballs();
    drawCars();
    if (typeof drawWeatherMotes === 'function') drawWeatherMotes(0.016);
    drawParticles();
    if (typeof drawPolice === 'function') drawPolice();
    if (typeof drawHeadlightCone === 'function') drawHeadlightCone();
    drawPlayer();
    if (typeof drawDroneCompanion === 'function') drawDroneCompanion();
    drawScorePopups();
    if (typeof drawSpeedLines === 'function') drawSpeedLines();
    if (typeof drawAtmosphericTint === 'function') drawAtmosphericTint();
    drawHUD();
    if (typeof drawCinematicTransition === 'function') drawCinematicTransition();
    ctx.restore();
}

function drawSky() {
    for (var b = 0; b < 4; b++) {
        var r = b / 4;
        ctx.fillStyle = 'rgb(' + (SKY[0] + (180 - SKY[0]) * r) + ',' + (SKY[1] + (220 - SKY[1]) * r) + ',' + (SKY[2] + (255 - SKY[2]) * r) + ')';
        ctx.fillRect(0, b * H / 4, W, H / 4 + 1);
    }
    if (game.pStar > 0) {
        ctx.globalAlpha = 0.08 + Math.sin(Date.now() * 0.01) * 0.04;
        ctx.fillStyle = STAR_YLW; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
    }
}

function drawBackground() {
    var px = game.cam * 0.1;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (var i = 0; i < 20; i++) {
        var cx = ((i * 220 + 80) - px) % (W + 200) - 100;
        var cy = 30 + (i % 6) * 50, sz = 25 + (i % 4) * 12;
        ctx.beginPath(); ctx.arc(cx, cy, sz * 0.5, 0, Math.PI * 2);
        ctx.arc(cx + sz * 0.4, cy - sz * 0.2, sz * 0.4, 0, Math.PI * 2);
        ctx.arc(cx + sz * 0.8, cy, sz * 0.35, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#2d8a4e';
    for (var j = 0; j < 25; j++) {
        var hx = ((j * 280) - game.cam * 0.2) % (W + 300) - 150;
        var hy = H * 0.72, hs = 50 + (j % 5) * 25;
        ctx.beginPath(); ctx.moveTo(hx - hs, hy); ctx.quadraticCurveTo(hx, hy - hs, hx + hs, hy); ctx.fill();
    }
    ctx.fillStyle = '#1a6830';
    for (var j2 = 0; j2 < 18; j2++) {
        var hx2 = ((j2 * 380 + 100) - game.cam * 0.1) % (W + 400) - 200;
        var hy2 = H * 0.75, hs2 = 70 + (j2 % 4) * 35;
        ctx.beginPath(); ctx.moveTo(hx2 - hs2, hy2); ctx.quadraticCurveTo(hx2, hy2 - hs2 * 0.8, hx2 + hs2, hy2); ctx.fill();
    }
}

function drawTiles() {
    var cx = Math.floor(game.cam);
    var stx = Math.max(0, Math.floor(cx / TILE) - 1);
    var etx = Math.min(WW, Math.floor(cx / TILE) + Math.ceil(W / TILE) + 2);
    for (var tx = stx; tx < etx; tx++) {
        for (var ty = 0; ty < WH; ty++) {
            var t = game.lvl[ty][tx]; if (t === 0) continue;
            var sx = Math.floor(tx * TILE - cx);
            if (t === 4) { ctx.drawImage(renderPipeCanvas(true), sx, ty * TILE); }
            else if (t === 5) { ctx.drawImage(renderPipeCanvas(false), sx, ty * TILE); }
            else if (t === 6) { drawBushes(sx, ty * TILE); }
            else if (t === 7) { drawClouds(sx, ty * TILE); }
            else if (t === 8) { drawCoinsInAir(sx, ty * TILE, tx, ty); }
            else if (t === 9) { drawSpikes(sx, ty * TILE); }
            else if (t === 11) drawRooftopTile(sx, ty * TILE);
            else if (t === 12) drawHighwayTile(sx, ty * TILE);
            else if (t === 13) { drawPoliceCar(sx, ty * TILE, tx); }
            else if (t === 14) { drawFlagpole(sx, ty * TILE, true); }
            else if (t === 15) { drawFlagpole(sx, ty * TILE, false); }
            else if (tileCanvases[t]) { if (-TILE < sx < W + TILE) ctx.drawImage(tileCanvases[t], sx, ty * TILE); }
        }
    }
}

function drawRooftopTile(sx, sy) {
    ctx.fillStyle = '#3a4a5a'; ctx.fillRect(sx + 2, sy + 8, TILE - 4, TILE - 10);
    ctx.fillStyle = '#5a7a9a'; ctx.fillRect(sx + 4, sy + 10, TILE - 8, 6);
    ctx.fillStyle = '#7ab0d0'; ctx.fillRect(sx + 6, sy + 12, TILE - 12, 3);
    ctx.fillStyle = '#e63946'; ctx.font = 'bold 14px "Press Start 2P", Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🔧', sx + TILE / 2, sy + TILE / 2 + 4);
}

function drawHighwayTile(sx, sy) {
    ctx.fillStyle = '#1a1a25'; ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#2a2a35';
    ctx.fillRect(sx, sy + 4, TILE, 4);
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(sx, sy + TILE - 8, TILE, 4);
    ctx.fillStyle = '#ffd60a';
    ctx.fillRect(sx + TILE / 2 - 8, sy + TILE / 2 - 2, 16, 3);
    ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 14px "Press Start 2P", Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🪖', sx + TILE / 2, sy + 12);
}

// ═══════════════════════════════════════════════════════════════
// NEW DRAW FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function drawClouds(sx, sy) {
    // Soft parallax cloud — drawn with transparency
    var px = game.cam * 0.15;
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx + TILE / 2 - px * 0.1, sy + TILE / 2, TILE / 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + TILE / 2 - 10 - px * 0.1, sy + TILE / 2 + 4, TILE / 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + TILE / 2 + 12 - px * 0.1, sy + TILE / 2 + 2, TILE / 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(200,220,255,0.5)';
    ctx.beginPath();
    ctx.arc(sx + TILE / 2 - px * 0.1, sy + TILE / 2 - 2, TILE / 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawBushes(sx, sy) {
    // Foreground decorative bush
    ctx.save();
    ctx.fillStyle = '#1a7a2a';
    ctx.beginPath(); ctx.arc(sx + TILE / 2, sy + TILE / 2 + 8, TILE / 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2d9a4e';
    ctx.beginPath(); ctx.arc(sx + TILE / 2 - 8, sy + TILE / 2 + 10, TILE / 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + TILE / 2 + 10, sy + TILE / 2 + 10, TILE / 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4ab06a';
    ctx.beginPath(); ctx.arc(sx + TILE / 2, sy + TILE / 2 + 4, TILE / 4.5, 0, Math.PI * 2); ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.arc(sx + TILE / 2 - 4, sy + TILE / 2 + 2, TILE / 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawCoinsInAir(sx, sy, tx, ty) {
    // Animated floating coin with bob and shimmer
    var time = Date.now() * 0.003;
    var bob = Math.sin(time + tx * 0.5) * 4;
    var shimmer = 0.7 + Math.sin(time * 2 + tx) * 0.3;
    ctx.save();
    ctx.globalAlpha = shimmer;
    // Glow
    ctx.fillStyle = 'rgba(255,220,0,0.15)';
    ctx.beginPath(); ctx.arc(sx + TILE / 2, sy + TILE / 2 + bob, TILE / 2, 0, Math.PI * 2); ctx.fill();
    // Coin body
    ctx.fillStyle = '#ffd60a';
    ctx.beginPath(); ctx.arc(sx + TILE / 2, sy + TILE / 2 + bob, TILE / 3, 0, Math.PI * 2); ctx.fill();
    // Inner ring
    ctx.strokeStyle = '#b89600'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sx + TILE / 2, sy + TILE / 2 + bob, TILE / 4.5, 0, Math.PI * 2); ctx.stroke();
    // Dollar sign
    ctx.fillStyle = '#b89600'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('$', sx + TILE / 2, sy + TILE / 2 + bob + 1);
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(sx + TILE / 2 - 3, sy + TILE / 2 + bob - 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawSpikes(sx, sy) {
    // Hazard spikes
    ctx.save();
    ctx.fillStyle = '#5a5a6a'; ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#8a8a9a';
    for (var si = 0; si < 4; si++) {
        var spx = si * 12 + 2;
        ctx.beginPath();
        ctx.moveTo(spx, sy + TILE);
        ctx.lineTo(spx + 6, sy + TILE / 3);
        ctx.lineTo(spx + 12, sy + TILE);
        ctx.closePath(); ctx.fill();
        // Highlight
        ctx.fillStyle = '#aaaabc';
        ctx.beginPath();
        ctx.moveTo(spx + 4, sy + TILE * 0.7);
        ctx.lineTo(spx + 6, sy + TILE / 3 + 2);
        ctx.lineTo(spx + 8, sy + TILE * 0.7);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8a8a9a';
    }
    ctx.fillStyle = '#4a4a5a'; ctx.fillRect(sx, sy + TILE - 6, TILE, 6);
    ctx.restore();
}

function drawPoliceCar(sx, sy, tx) {
    // Animated police car placeholder
    var time = Date.now() * 0.005;
    ctx.save();
    // Car body
    ctx.fillStyle = '#1a1a3a'; ctx.fillRect(sx + 4, sy + 14, TILE - 8, 18);
    ctx.fillStyle = '#2a2a5a'; ctx.fillRect(sx + 8, sy + 10, TILE - 16, 12);
    // Windows
    ctx.fillStyle = '#6ab0d0'; ctx.fillRect(sx + 10, sy + 12, 10, 8); ctx.fillRect(sx + 24, sy + 12, 10, 8);
    // Flashing siren
    var flash = Math.sin(time * 3 + tx) > 0;
    ctx.fillStyle = flash ? '#ff2020' : '#2060ff';
    ctx.fillRect(sx + 14, sy + 8, 6, 3);
    ctx.fillStyle = flash ? '#2060ff' : '#ff2020';
    ctx.fillRect(sx + 28, sy + 8, 6, 3);
    // Wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(sx + 12, sy + 34, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 36, sy + 34, 5, 0, Math.PI * 2); ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(sx + 8, sy + 10, TILE - 16, 2);
    ctx.restore();
}

function drawFlagpole(sx, sy, isTop) {
    // Finish line flagpole
    ctx.save();
    if (isTop) {
        // Flag top ornament
        ctx.fillStyle = '#ffd60a';
        ctx.beginPath(); ctx.arc(sx + TILE / 2, sy + 8, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b89600';
        ctx.beginPath(); ctx.arc(sx + TILE / 2, sy + 8, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd60a';
        ctx.beginPath(); ctx.arc(sx + TILE / 2, sy + 8, 2, 0, Math.PI * 2); ctx.fill();
    } else {
        // Pole
        ctx.fillStyle = '#8a8a8a'; ctx.fillRect(sx + TILE / 2 - 3, sy, 6, TILE);
        ctx.fillStyle = '#aaaaca'; ctx.fillRect(sx + TILE / 2 - 1, sy, 2, TILE);
        // Flag (waving animation)
        var wave = Math.sin(Date.now() * 0.004) * 3;
        ctx.fillStyle = '#e63946';
        ctx.beginPath();
        ctx.moveTo(sx + TILE / 2 + 3, sy + 4);
        ctx.lineTo(sx + TILE - 2 + wave, sy + 10);
        ctx.lineTo(sx + TILE - 2 - wave, sy + 18);
        ctx.lineTo(sx + TILE / 2 + 3, sy + 20);
        ctx.closePath(); ctx.fill();
        // Flag highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(sx + TILE / 2 + 3, sy + 4);
        ctx.lineTo(sx + TILE / 2 + 10 + wave * 0.5, sy + 8);
        ctx.lineTo(sx + TILE / 2 + 3, sy + 12);
        ctx.closePath(); ctx.fill();
        // Star on flag
        ctx.fillStyle = '#ffd60a'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('★', sx + TILE / 2 + 14, sy + 12);
    }
    ctx.restore();
}

function drawEnemies() {
    for (var ei = 0; ei < game.enemies.length; ei++) {
        var e = game.enemies[ei];
        // V1.8.2: buddies have hp=0 but isBuddy=true — keep them visible
        if (!e.isBuddy && e.hp <= 0 && e.type !== 'powerup') continue;
        if (e.type === 'powerup' && !e.active) continue;
        var ex = Math.floor(e.x - Math.floor(game.cam)), ey = Math.floor(e.y);
        if (ex < -TILE * 2 || ex > W + TILE * 2) continue;
        var bobY = e.buddyBobY || 0;
        var eyBob = ey + bobY;

        if (e.type === 'powerup') {
            if (e.puType === 'mushroom') {
                ctx.fillStyle = '#e63946';
                ctx.beginPath(); ctx.ellipse(ex + TILE / 2, ey - TILE / 3, TILE * 0.4, TILE * 0.3, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = WHT; ctx.beginPath(); ctx.arc(ex + TILE / 3, ey - TILE / 2, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = SKN; ctx.fillRect(ex + TILE * 0.35, ey - TILE * 0.1, TILE * 0.3, TILE * 0.25);
            } else if (e.puType === 'fire') {
                ctx.fillStyle = '#ff6600';
                ctx.beginPath(); ctx.ellipse(ex + TILE / 2, ey - TILE / 3, TILE * 0.4, TILE * 0.3, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = YLW; ctx.beginPath(); ctx.arc(ex + TILE / 3, ey - TILE / 2, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = SKN; ctx.fillRect(ex + TILE * 0.35, ey - TILE * 0.1, TILE * 0.3, TILE * 0.25);
            } else if (e.puType === 'star') {
                var ss = Math.sin(Date.now() * 0.008) * 0.3 + 1;
                ctx.save(); ctx.translate(ex + TILE / 2, ey - TILE / 2); ctx.scale(ss, ss);
                ctx.fillStyle = STAR_YLW; ctx.beginPath();
                for (var si = 0; si < 5; si++) {
                    var a = si * Math.PI * 2 / 5 - Math.PI / 2, a2 = a + Math.PI / 5;
                    ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
                    ctx.lineTo(Math.cos(a2) * 6, Math.sin(a2) * 6);
                }
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = WHT; ctx.beginPath(); ctx.arc(-3, -3, 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = BLK; ctx.beginPath(); ctx.arc(-2, -3, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
            continue;
        }

        if (e.type === 'goomba') {
            ctx.fillStyle = GOM;
            ctx.beginPath(); ctx.ellipse(ex + TILE / 2, eyBob - TILE / 4, TILE / 2, TILE / 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,200,100,0.2)';
            ctx.beginPath(); ctx.ellipse(ex + TILE / 2 - 4, eyBob - TILE / 3, TILE / 4, TILE / 6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#8b5e34';
            ctx.beginPath(); ctx.ellipse(ex + TILE / 2, eyBob - TILE / 2.5, TILE * 0.35, TILE * 0.25, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = BLK;
            ctx.save(); ctx.translate(ex + TILE / 3, eyBob - TILE / 3); ctx.rotate(-0.3); ctx.fillRect(0, 0, TILE / 5, TILE / 12); ctx.restore();
            ctx.save(); ctx.translate(ex + TILE / 2, eyBob - TILE / 3); ctx.rotate(0.3); ctx.fillRect(0, 0, TILE / 5, TILE / 12); ctx.restore();
            ctx.fillStyle = WHT;
            ctx.beginPath(); ctx.arc(ex + TILE / 3, eyBob - TILE / 2.8, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(ex + TILE * 2 / 3, eyBob - TILE / 2.8, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = BLK;
            ctx.beginPath(); ctx.arc(ex + TILE / 3 + 1, eyBob - TILE / 2.8, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(ex + TILE * 2 / 3 + 1, eyBob - TILE / 2.8, 1.5, 0, Math.PI * 2); ctx.fill();
            var fo = Math.floor(e.t * 4) % 2 === 0 ? 0 : 4;
            ctx.fillStyle = BLK;
            ctx.beginPath(); ctx.ellipse(ex + TILE / 5 + fo, eyBob - TILE / 2 + 2, TILE / 5, TILE / 8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(ex + TILE * 3 / 5 - fo, eyBob - TILE / 2 + 2, TILE / 5, TILE / 8, 0, 0, Math.PI * 2); ctx.fill();
        }

        if (e.type === 'koopa') {
            if (e.shell) {
                ctx.drawImage(getShellSprite(), ex, eyBob - TILE, TILE, TILE);
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.beginPath(); ctx.ellipse(ex + TILE / 2, eyBob - TILE / 2, TILE / 3, TILE / 4, 0, 0, Math.PI * 2); ctx.fill();
            } else {
                ctx.fillStyle = KOOPA_GREEN;
                ctx.beginPath(); ctx.ellipse(ex + TILE / 2, eyBob - TILE * 0.45, TILE * 0.45, TILE * 0.35, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = KOOPA_DARK;
                ctx.beginPath(); ctx.ellipse(ex + TILE / 2, eyBob - TILE * 0.45, TILE * 0.35, TILE * 0.25, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.12)';
                ctx.beginPath(); ctx.ellipse(ex + TILE / 2 - 3, eyBob - TILE * 0.55, TILE / 4, TILE / 5, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = KOOPA_SKIN;
                ctx.beginPath(); ctx.arc(ex + TILE * 0.65, eyBob - TILE * 0.8, TILE * 0.22, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = WHT; ctx.beginPath(); ctx.arc(ex + TILE * 0.68, eyBob - TILE * 0.82, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = BLK; ctx.beginPath(); ctx.arc(ex + TILE * 0.7, eyBob - TILE * 0.82, 2, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = WHT; ctx.beginPath(); ctx.arc(ex + TILE * 0.69, eyBob - TILE * 0.83, 1, 0, Math.PI * 2); ctx.fill();
                var kfo = Math.floor(e.t * 3) % 2 === 0 ? -3 : 3;
                ctx.fillStyle = KOOPA_SKIN;
                ctx.beginPath(); ctx.ellipse(ex + TILE * 0.35 + kfo, eyBob - TILE * 0.18, TILE * 0.12, TILE * 0.06, 0, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(ex + TILE * 0.6 - kfo, eyBob - TILE * 0.18, TILE * 0.12, TILE * 0.06, 0, 0, Math.PI * 2); ctx.fill();
            }
        }

        // V1.8.2: Buddy overlay (gold tint + pulsing star badge)
        if (e.isBuddy) drawBuddyOverlay(e, ex, ey);
    }
}

function drawBuddyOverlay(e, ex, ey) {
    // Gold tint wash over the body
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(ex + TILE / 2, ey - TILE / 3, TILE * 0.55, TILE * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Pulsing gold star badge above the head
    var t = (e.buddyT || 0);
    var pulse = 1 + Math.sin(t * 5) * 0.18;
    var rot = t * 0.6;
    var bx = ex + TILE / 2;
    var by = ey - TILE - 14;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(rot);
    ctx.scale(pulse, pulse);

    // Soft glow
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12;

    // 5-point gold star
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    for (var si = 0; si < 5; si++) {
        var a = si * Math.PI * 2 / 5 - Math.PI / 2;
        var a2 = a + Math.PI / 5;
        ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
        ctx.lineTo(Math.cos(a2) * 4, Math.sin(a2) * 4);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // White inner highlight
    ctx.fillStyle = '#fff8a0';
    ctx.beginPath();
    ctx.arc(-2, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Slot number (1, 2, or 3) above the star — shows team order
    ctx.save();
    ctx.fillStyle = '#5a3e00';
    ctx.font = 'bold 10px "Press Start 2P", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String((e.buddySlot || 0) + 1), bx, by + 1);
    ctx.restore();
}

function drawFireballs() {
    for (var fi = 0; fi < game.fireballs.length; fi++) {
        var fb = game.fireballs[fi];
        var fbx = Math.floor(fb.x - Math.floor(game.cam)), fby = Math.floor(fb.y);
        ctx.fillStyle = '#ff4400'; ctx.beginPath(); ctx.arc(fbx, fby, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = YLW; ctx.beginPath(); ctx.arc(fbx, fby, 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.4; ctx.fillStyle = '#ff6600';
        ctx.beginPath(); ctx.arc(fbx - fb.vx * 0.01, fby, 4, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function drawCars() {
    // Don't draw 2D cars when in racing mode (3D car is rendered by Three.js)
    if (STATE === 'RACING') return;
    for (var ci = 0; ci < game.cars.length; ci++) {
        var c = game.cars[ci], csx = Math.floor(c.x - Math.floor(game.cam));
        if (-TILE * 2 < csx < W + TILE * 2) {
            var csy = Math.floor(c.y - TILE / 2);
            ctx.fillStyle = c.color; ctx.beginPath(); ctx.roundRect(csx, csy, TILE * 2, TILE / 2, 6); ctx.fill();
            ctx.fillStyle = '#3c3c46'; ctx.beginPath(); ctx.roundRect(csx + TILE / 2, csy - TILE / 2, TILE, TILE / 2, 4); ctx.fill();
            ctx.fillStyle = '#96c8f0'; ctx.fillRect(csx + TILE / 2 + 4, csy - TILE / 2 + 4, TILE - 8, TILE / 3);
            ctx.fillStyle = '#1e1e1e';
            ctx.beginPath(); ctx.arc(csx + TILE / 3, csy + TILE / 2, TILE / 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(csx + TILE * 5 / 3, csy + TILE / 2, TILE / 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#555555';
            ctx.beginPath(); ctx.arc(csx + TILE / 3, csy + TILE / 2, TILE / 8, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(csx + TILE * 5 / 3, csy + TILE / 2, TILE / 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = YLW; ctx.fillRect(csx + TILE * 2 - 4, csy + 6, 4, 8); ctx.fillRect(csx, csy + 6, 4, 8);
        }
    }
}

function drawParticles() {
    for (var pi = 0; pi < game.particles.length; pi++) {
        var p = game.particles[pi];
        var psz = Math.max(1, Math.floor(p.sz * p.life / 0.5));
        ctx.globalAlpha = Math.min(1, p.life * 2);
        if (p.rot !== undefined) {
            ctx.save();
            ctx.translate(p.x - Math.floor(game.cam), p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.c;
            ctx.fillRect(-psz / 2, -psz / 2, psz, psz);
            ctx.restore();
            p.rot += (p.rotSpd || 0) * 0.016;
        } else {
            ctx.fillStyle = p.c;
            ctx.beginPath();
            ctx.arc(p.x - Math.floor(game.cam), p.y, psz, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
}

function drawPlayer() {
    if (game.pOnCar || STATE === 'RACING') return;
    var psx = Math.floor(game.px - Math.floor(game.cam)), psy = Math.floor(game.py);
    var big = game.pMode > 0, fire = game.pMode === 2;
    var pose;
    if (game.pAir) pose = 3;
    else if (Math.abs(game.pvx) > 20) pose = Math.floor(game.pAnim * 8) % 2 === 0 ? 1 : 2;
    else pose = 0;
    var sprKey = (big ? 1 : 0) + '_' + (fire ? 1 : 0) + '_' + pose;
    var spr = marioCache[sprKey];
    if (spr) {
        var sw = spr.width * game.pSqX, sh = spr.height * game.pSqY;
        ctx.save();
        if (game.pStar > 0) { ctx.shadowColor = STAR_YLW; ctx.shadowBlur = 15 + Math.sin(Date.now() * 0.01) * 5; }
        if (game.pDir === 0) { ctx.translate(psx, 0); ctx.scale(-1, 1); ctx.drawImage(spr, -sw / 2, psy - sh, sw, sh); }
        else ctx.drawImage(spr, psx - sw / 2, psy - sh, sw, sh);
        ctx.restore(); ctx.shadowBlur = 0;
        // Improved invincibility flicker — more visible Rainbow flash
        if (game.pInv > 0) {
            var invPhase = Math.floor(game.pInv * 12) % 3;
            if (invPhase === 0) {
                ctx.globalAlpha = 0.4; ctx.fillStyle = WHT;
                ctx.fillRect(psx - sw / 2 - 2, psy - sh - 2, sw + 4, sh + 4);
            } else if (invPhase === 1) {
                ctx.globalAlpha = 0.3; ctx.fillStyle = '#ff6666';
                ctx.fillRect(psx - sw / 2 - 4, psy - sh - 4, sw + 8, sh + 8);
                ctx.globalAlpha = 0.2; ctx.fillStyle = '#66ff66';
                ctx.fillRect(psx - sw / 2 - 2, psy - sh - 2, sw + 4, sh + 4);
            } else {
                ctx.globalAlpha = 0.3; ctx.fillStyle = '#6666ff';
                ctx.fillRect(psx - sw / 2 - 3, psy - sh - 3, sw + 6, sh + 6);
            }
            ctx.globalAlpha = 1;
        }
        drawPlayerHat(psx, psy - sh, game.pDir === 0);
    }
    // Speed lines when running fast
    if (Math.abs(game.pvx) > 200 && !game.pAir) {
        drawPlayerSpeedLines(psx, psy, sh);
    }
}

function drawPlayerSpeedLines(psx, psy, sh) {
    var speed = Math.abs(game.pvx);
    var intensity = Math.min(1, (speed - 200) / 200);
    var dir = game.pDir === 0 ? 1 : -1;
    ctx.save();
    ctx.globalAlpha = intensity * 0.6;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    var time = Date.now() * 0.01;
    for (var li = 0; li < 5; li++) {
        var ly = psy - sh + 4 + (li * sh / 5);
        var lx = psx + dir * (10 + Math.sin(time + li) * 5);
        var ll = 15 + Math.sin(time * 2 + li * 0.7) * 8;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + dir * ll, ly + (Math.random() - 0.5) * 4);
        ctx.stroke();
    }
    ctx.restore();
}

function drawPlayerHat(centerX, topY, flipped) {
    var cx = centerX, cy = topY + 6, r = 14;
    ctx.save();
    if (flipped) { ctx.translate(cx, 0); ctx.scale(-1, 1); cx = 0; }
    if (game.hat === 'plumber') {
        ctx.fillStyle = '#e63946';
        ctx.beginPath(); ctx.ellipse(cx, cy, r, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#9b1c2e';
        ctx.beginPath(); ctx.ellipse(cx - r * 0.3, cy, r * 0.55, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff8a0';
        ctx.font = 'bold 11px "Press Start 2P", Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('M', cx, cy);
    } else {
        ctx.fillStyle = '#1a1a25';
        ctx.beginPath(); ctx.ellipse(cx, cy, r, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2a2a3a';
        ctx.beginPath(); ctx.ellipse(cx - r * 0.2, cy, r * 0.5, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8888aa';
        ctx.font = 'bold 9px "Press Start 2P", Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('D', cx, cy);
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath(); ctx.arc(cx + r * 0.7, cy - 2, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

function drawScorePopups() {
    for (var si = 0; si < game.scorePopups.length; si++) {
        var sp = game.scorePopups[si];
        ctx.globalAlpha = sp.life; ctx.fillStyle = YLW;
        ctx.font = 'bold 14px "Press Start 2P", Arial'; ctx.textAlign = 'center';
        ctx.fillText(sp.text, sp.x - Math.floor(game.cam), sp.y);
    }
    ctx.globalAlpha = 1;
}

function drawHUD() {
    var topH = 56;
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, W, topH);
    var headerColor = (game.hat === 'plumber') ? '#ffd60a' : '#00e5ff';
    ctx.fillStyle = headerColor;
    ctx.fillRect(0, topH - 3, W, 3);
    ctx.font = 'bold 16px Inter, Arial, sans-serif'; ctx.textBaseline = 'middle';
    var hy = 22;
    ctx.fillStyle = headerColor; ctx.textAlign = 'center';
    ctx.fillText(game.hat === 'plumber' ? '🔧 PLUMBER HAT' : '🪖 DRIVER CAP', W / 2, hy);
    if (game.hat === 'plumber') drawPlumberHUD(topH);
    else drawDriverHUD(topH);
    if (game.combo > 1) {
        ctx.fillStyle = YLW; ctx.textAlign = 'center';
        ctx.font = 'bold 12px "Press Start 2P", Arial';
        ctx.fillText('COMBO x' + game.combo, W / 2, topH + 15);
    }
    // V1.8.2: Buddy count chip (rendered on row 2 of the HUD bar)
    if (typeof drawBuddyBadge === 'function') drawBuddyBadge();
    if (game.pOnFire) { ctx.fillStyle = '#ff6600'; ctx.font = '12px Inter'; ctx.textAlign = 'left'; ctx.fillText('🔥 FIRE', 15, topH + 15); }
    if (game.pStar > 0) { ctx.fillStyle = STAR_YLW; ctx.font = '12px Inter'; ctx.textAlign = 'left'; ctx.fillText('⭐ STAR', 80, topH + 15); }
    if (game.pOnCar) { ctx.fillStyle = 'rgba(255,200,0,0.8)'; ctx.textAlign = 'center'; ctx.font = '12px Inter'; ctx.fillText('🚗 [F] Exit', W / 2, topH + 15); }
    drawXPBar(W - 220, H - 28, 200, 10, game.pXp, game.pXpNext, game.hat === 'plumber' ? '#e63946' : 'rgba(255,255,255,0.2)', 'PLUMBER XP', game.pLevel);
    if (game.hat === 'driver') drawXPBar(W - 220, H - 14, 200, 6, game.dXp, game.dXpNext, '#00e5ff', '', 0, true);
    if (game.hatFlash > 0) {
        var a = Math.max(0, game.hatFlash / 0.4) * 0.75;
        ctx.fillStyle = (game.hat === 'plumber' ? 'rgba(255,214,10,' : 'rgba(0,229,255,') + a + ')';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px "Press Start 2P", Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(game.hat === 'plumber' ? '🔧 PLUMBER HAT' : '🪖 DRIVER CAP', W / 2, H / 2);
    }
    if (game.hatLockedT > 0 && game.hatLockedMsg) {
        var la = Math.min(1, game.hatLockedT / 0.3);
        ctx.globalAlpha = la;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        var bw = 460, bh = 56, bx = (W - bw) / 2, by = topH + 50;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#ff9e3d'; ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = '#ff9e3d';
        ctx.font = 'bold 13px "Press Start 2P", Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🔒 ' + game.hatLockedMsg, W / 2, by + bh / 2);
        ctx.fillStyle = '#ffd60a';
        ctx.font = '10px "Press Start 2P", Arial';
        ctx.fillText('Press [H] to switch hat', W / 2, by + bh / 2 + 18);
        ctx.globalAlpha = 1;
    }
}

function drawPlumberHUD(topH) {
    var hy = 22;
    ctx.textAlign = 'left';
    ctx.fillStyle = YLW; ctx.fillText('🪙 ' + game.coins, 15, hy);
    ctx.fillStyle = WHT; ctx.fillText('SCORE ' + game.score, 100, hy);
    ctx.fillStyle = game.time < 50 ? RED : WHT; ctx.fillText('⏱ ' + Math.max(0, Math.floor(game.time)), 270, hy);
    // V1.8.2: Buddy count sits on a second row under the HUD bar, so it
    // never fights with the centered PLUMBER HAT title.
    ctx.textAlign = 'right';
    ctx.fillStyle = WHT; ctx.fillText('♥ x' + game.lives, W - 15, hy);
}

function drawBuddyBadge() {
    // Rendered as a small dedicated chip on row 2 of the HUD bar so it
    // doesn't fight with the centered PLUMBER HAT title on row 1.
    var bc = (typeof countBuddies === 'function') ? countBuddies() : 0;
    var max = (typeof MAX_BUDDIES !== 'undefined') ? MAX_BUDDIES : 3;
    var x = 15, y = 56 - 4 - 18;  // inside the top HUD bar, top-right corner area
    var w = 88, h = 18;
    // Use the same row as COMBO so we don't introduce a 3rd row
    x = 200; y = 56 + 15;
    if (typeof game !== 'undefined' && game.combo > 1) x = 240;  // shift right of COMBO
    ctx.save();
    // Background pill
    ctx.fillStyle = bc > 0 ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.roundRect(x, y - 12, w, h, 4); ctx.fill();
    // Border
    ctx.strokeStyle = bc > 0 ? '#ffd700' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y - 12, w, h, 4); ctx.stroke();
    // Text
    ctx.fillStyle = bc > 0 ? '#ffd700' : 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 11px "Press Start 2P", Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('TEAM ' + bc + '/' + max, x + 6, y - 3);
    // Tiny dots showing each buddy slot
    for (var i = 0; i < max; i++) {
        ctx.fillStyle = i < bc ? '#ffd700' : 'rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.arc(x + w - 14 - i * 10, y - 3, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

function drawDriverHUD(topH) {
    var hy = 22;
    ctx.textAlign = 'left';
    var spd = Math.abs(Math.round(game.pvx));
    var spdCol = spd > 350 ? '#ff4d4d' : (spd > 200 ? '#ffd60a' : '#7fff7f');
    ctx.fillStyle = spdCol; ctx.font = 'bold 16px "Press Start 2P", Arial';
    ctx.fillText(spd + ' km/h', 15, hy);
    ctx.fillStyle = WHT; ctx.font = '12px Inter, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('FUEL', 200, hy - 6);
    var fw = 80, fh = 8, fx = 200, fy = hy;
    ctx.fillStyle = '#1a1a25'; ctx.fillRect(fx, fy, fw, fh);
    var fp = Math.max(0, game.fuel) / 100;
    var fcol = fp < 0.25 ? '#ff4d4d' : (fp < 0.5 ? '#ff9e3d' : '#76ff03');
    ctx.fillStyle = fcol; ctx.fillRect(fx, fy, fw * fp, fh);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
    ctx.strokeRect(fx, fy, fw, fh);
    var wx = 300;
    for (var i = 0; i < 5; i++) {
        var starColor = (i < game.wanted) ? '#ff4d4d' : 'rgba(255,255,255,0.15)';
        ctx.fillStyle = starColor;
        drawStar(wx + i * 22, hy, 7);
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 12px "Press Start 2P", Arial';
    ctx.fillText('WANTED ' + game.wanted + '/5', W - 15, hy);
}

function drawStar(cx, cy, r) {
    ctx.beginPath();
    for (var i = 0; i < 5; i++) {
        var a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        var x = cx + Math.cos(a) * r;
        var y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        var ai = a + Math.PI / 5;
        var x2 = cx + Math.cos(ai) * (r * 0.4);
        var y2 = cy + Math.sin(ai) * (r * 0.4);
        ctx.lineTo(x2, y2);
    }
    ctx.closePath(); ctx.fill();
}

function drawXPBar(x, y, w, h, val, max, color, label, lvl, isSecondary) {
    if (isSecondary && game.hat !== 'driver') return;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, y, w, h);
    var p = Math.max(0, Math.min(1, val / max));
    if (isSecondary) {
        ctx.fillStyle = color; ctx.fillRect(x, y, w * p, h);
        return;
    }
    var grad = ctx.createLinearGradient(x, 0, x + w * p, 0);
    grad.addColorStop(0, color); grad.addColorStop(1, '#fff8a0');
    ctx.fillStyle = grad; ctx.fillRect(x, y, w * p, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    if (label) {
        ctx.fillStyle = color; ctx.font = 'bold 9px "Press Start 2P", Arial';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(label + '  L' + lvl, x, y - 1);
    }
}

function drawTouchControls() {
    if (window.innerWidth > 768) return;
    ctx.globalAlpha = 0.5;
    var dpadX = 60, dpadY = H - 100, dpadR = 40;
    ctx.fillStyle = touchState.left ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(dpadX - dpadR, dpadY, dpadR * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = WHT; ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('←', dpadX - dpadR, dpadY);
    ctx.fillStyle = touchState.right ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(dpadX + dpadR, dpadY, dpadR * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = WHT; ctx.fillText('→', dpadX + dpadR, dpadY);
    var jbX = W - 100, jbY = H - 100, jbR = 45;
    ctx.fillStyle = touchState.jump ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(jbX, jbY, jbR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = WHT; ctx.font = 'bold 14px Arial'; ctx.fillText('JUMP', jbX, jbY);
    var fbX = W - 200, fbY = H - 100, fbR = 30;
    ctx.fillStyle = touchState.fire ? 'rgba(255,100,0,0.5)' : 'rgba(255,100,0,0.2)';
    ctx.beginPath(); ctx.arc(fbX, fbY, fbR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = WHT; ctx.font = 'bold 11px Arial'; ctx.fillText('FIRE', fbX, fbY);
    ctx.globalAlpha = 1;
}
