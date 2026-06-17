// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// SYSTEMS: DEBUG
// FPS counter, hitbox overlay, console commands
// ═══════════════════════════════════════════════════════════════

var fps = 0, fpsCount = 0, fpsTimer = 0;

function updateDebug(dt) {
    fpsCount++; fpsTimer += dt;
    if (fpsTimer >= 1) { fps = fpsCount; fpsCount = 0; fpsTimer = 0; }
}

function drawDebug() {
    if (!Settings.showFPS) return;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(W - 80, 5, 75, 20);
    ctx.fillStyle = fps >= 55 ? '#00ff00' : fps >= 30 ? '#ffff00' : '#ff0000';
    ctx.font = '12px monospace'; ctx.textAlign = 'right';
    ctx.fillText('FPS: ' + fps, W - 10, 19);
}

function drawHitboxes() {
    if (!Settings.showHitboxes) return;
    ctx.strokeStyle = 'rgba(255,0,0,0.5)'; ctx.lineWidth = 1;
    var cx = Math.floor(game.cam);
    // Player
    ctx.strokeRect(game.px - 20 - cx, game.py - (game.pMode > 0 ? 80 : 60), 40, game.pMode > 0 ? 80 : 60);
    // Enemies
    game.enemies.forEach(function(e) {
        if (e.hp <= 0 && e.type !== 'powerup') return;
        ctx.strokeRect(e.x - TILE / 2 - cx, e.y - TILE, TILE, TILE * 1.5);
    });
}
