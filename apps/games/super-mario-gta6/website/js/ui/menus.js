// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// UI: MENUS
// Title screen, pause, game over
// ═══════════════════════════════════════════════════════════════

function drawTitle() {
    var grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#0a0a1a'); grd.addColorStop(0.3, '#1a1a2e'); grd.addColorStop(0.6, '#16213e'); grd.addColorStop(1, '#0f3460');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

    var t = game ? game.titleTimer : 0;

    // Parallax layer 1: distant city silhouette
    ctx.fillStyle = 'rgba(20, 20, 40, 0.6)';
    for (var b1 = 0; b1 < 12; b1++) {
        var bx1 = ((b1 * 160 + 40) - t * 15) % (W + 300) - 150;
        var bh1 = 40 + (b1 * 37 % 80);
        ctx.fillRect(bx1, H * 0.55 - bh1, 60 + (b1 * 23 % 40), bh1);
        ctx.fillStyle = 'rgba(25, 25, 50, 0.5)';
        for (var w1 = 0; w1 < 3; w1++) {
            for (var w2 = 0; w2 < Math.floor(bh1 / 12); w2++) {
                if (Math.sin(b1 * 7 + w1 * 3 + w2 * 5) > 0.2) {
                    ctx.fillStyle = 'rgba(255, 220, 80, ' + (0.3 + Math.sin(t * 2 + b1 + w1 + w2) * 0.2) + ')';
                    ctx.fillRect(bx1 + 8 + w1 * 18, H * 0.55 - bh1 + 6 + w2 * 12, 6, 6);
                }
            }
        }
        ctx.fillStyle = 'rgba(20, 20, 40, 0.6)';
    }

    // Parallax layer 2: mid-ground buildings
    ctx.fillStyle = 'rgba(30, 30, 55, 0.7)';
    for (var b2 = 0; b2 < 18; b2++) {
        var bx2 = ((b2 * 120 + 20) - t * 35) % (W + 300) - 150;
        var bh2 = 25 + (b2 * 53 % 60);
        ctx.fillRect(bx2, H * 0.62 - bh2, 45 + (b2 * 17 % 30), bh2);
    }

    // Parallax layer 3: near-ground road markings
    ctx.fillStyle = 'rgba(255, 220, 0, 0.15)';
    for (var rm = 0; rm < 20; rm++) {
        var rx = ((rm * 100) - t * 80) % (W + 200) - 100;
        ctx.fillRect(rx, H * 0.78, 40, 3);
    }

    // Stars
    for (var i = 0; i < 60; i++) {
        var sx = (Math.sin(i * 127.1 + t * 0.3) * 0.5 + 0.5) * W;
        var sy = (Math.cos(i * 311.7 + t * 0.2) * 0.5 + 0.5) * H * 0.5;
        ctx.fillStyle = 'rgba(255,255,255,' + (Math.sin(t * 3 + i) * 0.3 + 0.7) * 0.4 + ')';
        ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    if (!game) return;
    var ts = Math.min(W / 800, H / 600), ty = H * 0.22;
    ctx.save(); ctx.translate(W / 2, ty); ctx.scale(ts, ts);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = 'bold 64px "Press Start 2P", Arial Black, Impact, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SUPER MARIO', 3, 3);
    var rg = ctx.createLinearGradient(-200, -30, 200, 30);
    rg.addColorStop(0, '#ff4444'); rg.addColorStop(0.5, '#ff6666'); rg.addColorStop(1, '#cc0000');
    ctx.fillStyle = rg; ctx.fillText('SUPER MARIO', 0, 0);
    ctx.strokeStyle = WHT; ctx.lineWidth = 2; ctx.strokeText('SUPER MARIO', 0, 0);
    var sy2 = 65;
    ctx.font = 'bold 32px "Press Start 2P", Arial Black, Impact, sans-serif'; ctx.fillStyle = YLW;
    ctx.fillText('×', 0, sy2 - 12);
    ctx.font = 'bold 44px "Press Start 2P", Arial Black, Impact, sans-serif'; ctx.fillStyle = '#00e5ff';
    ctx.fillText('GTA', 0, sy2 + 22);
    ctx.shadowColor = '#e040fb'; ctx.shadowBlur = 20; ctx.fillStyle = '#e040fb';
    ctx.font = 'bold 52px "Press Start 2P", Arial Black, Impact, sans-serif';
    ctx.fillText('6', 95, sy2 + 22); ctx.shadowBlur = 0;
    ctx.restore();

    // HAZOOM OS subtitle
    var subAlpha = Math.min(1, t * 0.8);
    ctx.save();
    ctx.globalAlpha = subAlpha;
    ctx.font = Math.floor(11 * ts) + 'px "Press Start 2P", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 10;
    ctx.fillText('HAZOOM OS', W / 2, ty + 55 * ts);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Animated Mario running across screen
    var marioRunX = ((t * 120) % (W + 200)) - 100;
    var marioRunY = H * 0.62;
    var marioBob = Math.abs(Math.sin(t * 12)) * 6;
    var marioFrame = Math.floor(t * 10) % 3;
    var marioSpr = marioFrame === 0 ? marioCache['1_0_1'] : (marioFrame === 1 ? marioCache['1_0_0'] : marioCache['1_0_2']);
    if (!marioSpr) marioSpr = marioCache['1_0_0'];
    if (marioSpr) {
        ctx.save();
        ctx.translate(marioRunX, marioRunY - marioBob);
        ctx.drawImage(marioSpr, -marioSpr.width / 2, -marioSpr.height, marioSpr.width * 1.5, marioSpr.height * 1.5);
        ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(marioRunX, marioRunY + 5, 20, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        if (Math.random() < 0.3) {
            spawnParticles(marioRunX - 10, marioRunY - 5, '#c84c0c', 1);
        }
    }

    // Koopa following behind
    var koopaX = marioRunX - 55;
    var ks = koopaCache['koopa_0'];
    if (ks) {
        ctx.save();
        ctx.translate(koopaX, marioRunY - marioBob * 0.5 + 5);
        ctx.drawImage(ks, -ks.width / 2, -ks.height, TILE * 1.2, TILE * 1.8);
        ctx.restore();
    }

    // Animated coin counter / high score
    var savedHigh = 0;
    try { savedHigh = parseInt(localStorage.getItem('smg6_highscore') || '0'); } catch(e) {}
    var displayCoins = Math.floor(Math.min(game.coins || 0, savedHigh));
    var coinPulse = 1 + Math.sin(t * 4) * 0.05;
    ctx.save();
    ctx.translate(W / 2, H * 0.44);
    ctx.scale(coinPulse, coinPulse);
    ctx.font = Math.floor(13 * ts) + 'px "Press Start 2P", monospace';
    ctx.fillStyle = YLW;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffdc00'; ctx.shadowBlur = 8;
    ctx.fillText('🪙 ' + displayCoins + ' HIGH: ' + savedHigh, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Version display
    ctx.font = Math.floor(9 * ts) + 'px "Press Start 2P", monospace';
    ctx.fillStyle = '#445566';
    ctx.textAlign = 'left';
    ctx.fillText('V1.9.0', 10, H - 30);

    if (Math.floor(t * 2) % 2 === 0) {
        ctx.font = Math.floor(14 * ts) + 'px "Press Start 2P", monospace';
        ctx.fillStyle = WHT; ctx.textAlign = 'center';
        ctx.fillText('PRESS ENTER OR TAP TO START', W / 2, H * 0.74);
    }
    ctx.font = Math.floor(10 * ts) + 'px Inter, Arial, sans-serif'; ctx.fillStyle = '#667788'; ctx.textAlign = 'center';
    ctx.fillText('← → Move | ↑ Space Jump | ⇧ Run | F Car | E/X Fire | Esc Pause', W / 2, H * 0.83);
    ctx.font = Math.floor(9 * ts) + 'px monospace'; ctx.fillStyle = '#445566';
    ctx.textAlign = 'right'; ctx.fillText('© 2026 Hazem Soussi (HA)', W - 10, H - 12);
    ctx.textAlign = 'left'; ctx.fillText('Nano Engine — MIT License', 10, H - 12);
}

function drawPause() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
    var bw = 380, bh = 320, bx = (W - bw) / 2, by = (H - bh) / 2;
    ctx.fillStyle = 'rgba(17,17,24,0.95)'; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 16); ctx.fill();
    ctx.strokeStyle = 'rgba(230,57,70,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = 'bold 32px Inter, Arial Black, sans-serif'; ctx.fillStyle = RED; ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, by + 55);
    ctx.font = '15px Inter, Arial, sans-serif'; ctx.fillStyle = '#8888aa';
    var sy = by + 110, lh = 28;
    ctx.fillText('Score: ' + game.score, W / 2, sy); ctx.fillText('Coins: ' + game.coins, W / 2, sy + lh);
    ctx.fillText('Time: ' + Math.floor(game.time), W / 2, sy + lh * 2); ctx.fillText('Lives: ' + game.lives, W / 2, sy + lh * 3);
    if (game.combo > 1) { ctx.fillStyle = YLW; ctx.fillText('Combo: x' + game.combo, W / 2, sy + lh * 4); }
    if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.font = '13px monospace'; ctx.fillStyle = YLW; ctx.fillText('Press ESC to Resume', W / 2, by + bh - 35);
    }
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, W, H);
    var gs = Math.min(W / 800, H / 600);
    ctx.font = Math.floor(44 * gs) + 'px "Press Start 2P", Arial Black, Impact, sans-serif';
    ctx.fillStyle = RED; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 30; ctx.fillText('GAME OVER', W / 2, H * 0.28); ctx.shadowBlur = 0;
    ctx.font = Math.floor(15 * gs) + 'px Inter, Arial, sans-serif'; ctx.fillStyle = WHT;
    ctx.fillText('Final Score: ' + game.score, W / 2, H * 0.42); ctx.fillText('Coins: ' + game.coins, W / 2, H * 0.49);
    if (game.combo > 1) ctx.fillText('Best Combo: x' + game.combo, W / 2, H * 0.56);
    if (Math.floor(Date.now() / 600) % 2 === 0) {
        ctx.font = Math.floor(13 * gs) + 'px monospace'; ctx.fillStyle = YLW; ctx.fillText('Press ENTER to Restart', W / 2, H * 0.7);
    }
    ctx.font = Math.floor(9 * gs) + 'px monospace'; ctx.fillStyle = '#445566';
    ctx.fillText('© 2026 Hazem Soussi (HA)', W / 2, H * 0.9);
}
