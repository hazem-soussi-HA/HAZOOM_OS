// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// RENDER: CINEMATIC
// 3D-feel effects for the Driver Cap mode
//  - atmospheric tint (time-of-day + driver cap mood)
//  - radial speed lines
//  - 2.5D building depth (extruded side faces + cast shadows)
//  - headlight cone
//  - drone companion (Driver Cap only)
//  - weather motes
//  - cinematic hat-switch radial cut
// ═══════════════════════════════════════════════════════════════

var _cinematicTime = 0;
var _droneBob = 0;
var _motes = [];
var _motesInit = false;

function getTimeOfDay() {
    var t = game && game.titleTimer ? game.titleTimer : 0;
    var phase = (Math.sin(t * 0.05) + 1) * 0.5;
    if (phase < 0.25) return { name: 'dawn',  tint: 'rgba(255, 180, 100, ', top: [255, 170, 130], bot: [120, 130, 200] };
    if (phase < 0.5)  return { name: 'day',   tint: 'rgba(255, 255, 220, ', top: [180, 220, 255], bot: [200, 240, 255] };
    if (phase < 0.75) return { name: 'dusk',  tint: 'rgba(255, 100, 80, ',  top: [255, 130, 100], bot: [80,  60,  120] };
    return                    { name: 'night', tint: 'rgba(20, 30, 80, ',   top: [10,  15,  50],  bot: [30,  20,  60]  };
}

function initMotes() {
    if (_motesInit) return;
    _motesInit = true;
    for (var i = 0; i < 60; i++) {
        _motes.push({
            x: Math.random() * 2000,
            y: Math.random() * 800,
            z: Math.random() * 3 + 0.5,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 2.5 + 0.8,
            color: ['#ffd60a', '#00e5ff', '#76ff03', '#ffffff', '#e040fb'][Math.floor(Math.random() * 5)]
        });
    }
}

function drawAtmosphericTint() {
    var tod = getTimeOfDay();
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(' + tod.top[0] + ',' + tod.top[1] + ',' + tod.top[2] + ',0.18)');
    grad.addColorStop(0.6, 'rgba(' + tod.top[0] + ',' + tod.top[1] + ',' + tod.top[2] + ',0.06)');
    grad.addColorStop(1, 'rgba(' + tod.bot[0] + ',' + tod.bot[1] + ',' + tod.bot[2] + ',0.12)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    if (game.hat === 'driver') {
        var pulse = 0.04 + Math.sin(_cinematicTime * 1.2) * 0.015;
        ctx.fillStyle = 'rgba(0, 229, 255,' + pulse + ')';
        ctx.fillRect(0, 0, W, H);
    } else {
        var pulse2 = 0.03 + Math.sin(_cinematicTime * 0.8) * 0.012;
        ctx.fillStyle = 'rgba(255, 214, 10,' + pulse2 + ')';
        ctx.fillRect(0, 0, W, H);
    }
}

function drawBuildingDepth() {
    if (!game || !game.lvl) return;
    var cx = Math.floor(game.cam);
    var stx = Math.max(0, Math.floor(cx / TILE) - 1);
    var etx = Math.min(WW, Math.floor(cx / TILE) + Math.ceil(W / TILE) + 2);
    var lightAngle = (game.hat === 'driver') ? -0.5 : 0.4;
    ctx.save();
    for (var tx = stx; tx < etx; tx++) {
        for (var ty = 0; ty < WH; ty++) {
            var t = game.lvl[ty][tx];
            if (t === 0 || t === 4 || t === 5 || t === 11 || t === 12) continue;
            if (t !== 1 && t !== 2 && t !== 3 && t !== 10) continue;
            var sx = Math.floor(tx * TILE - cx);
            if (sx < -TILE || sx > W + TILE) continue;
            var depth = 6;
            var dx = lightAngle * depth;
            var dy = -depth;
            var baseShade = (t === 1 || t === 10) ? '#5a3010' : (t === 2 ? '#7a1a1a' : '#a67c00');
            ctx.fillStyle = baseShade;
            ctx.beginPath();
            ctx.moveTo(sx + dx, ty * TILE + dy);
            ctx.lineTo(sx + dx + TILE, ty * TILE + dy);
            ctx.lineTo(sx + TILE, ty * TILE);
            ctx.lineTo(sx, ty * TILE);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            ctx.beginPath();
            ctx.moveTo(sx + TILE, ty * TILE);
            ctx.lineTo(sx + dx + TILE, ty * TILE + dy);
            ctx.lineTo(sx + dx + TILE, ty * TILE + dy + TILE);
            ctx.lineTo(sx + TILE, ty * TILE + TILE);
            ctx.closePath();
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawSpeedLines() {
    var speed = Math.abs(game.pvx || 0);
    if (speed < 280) return;
    var intensity = Math.min(1, (speed - 280) / 250);
    var cx = (W * 0.5) - 60;
    var cy = H * 0.55;
    var color = (game.hat === 'driver') ? '0, 229, 255' : '255, 214, 10';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 22; i++) {
        var a = (i / 22) * Math.PI * 2 + _cinematicTime * 2;
        var r1 = 80 + (i % 3) * 30;
        var r2 = r1 + 60 + intensity * 100;
        var sw = 2 + (i % 4);
        ctx.strokeStyle = 'rgba(' + color + ',' + (0.25 + intensity * 0.4) + ')';
        ctx.lineWidth = sw;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
}

function drawHeadlightCone() {
    if (game.hat !== 'driver' || game.pOnCar) return;
    var px = game.px - game.cam;
    var py = game.py - TILE * 0.3;
    var dir = (game.pDir === 0) ? -1 : 1;
    var coneLen = 240;
    var coneW = 140;
    var grad = ctx.createRadialGradient(px, py, 8, px + dir * coneLen * 0.5, py, coneLen);
    grad.addColorStop(0, 'rgba(255, 240, 180, 0.55)');
    grad.addColorStop(0.4, 'rgba(255, 220, 120, 0.20)');
    grad.addColorStop(1, 'rgba(255, 200, 80, 0)');
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(dir, 1);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(coneLen, -coneW * 0.5);
    ctx.lineTo(coneLen, coneW * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    var bulbGlow = ctx.createRadialGradient(px, py, 0, px, py, 14);
    bulbGlow.addColorStop(0, 'rgba(255,255,200,0.9)');
    bulbGlow.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = bulbGlow;
    ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2); ctx.fill();
}

function drawDroneCompanion() {
    if (game.hat !== 'driver' || game.pOnCar) return;
    _droneBob += 0.06;
    var px = game.px - game.cam;
    var py = game.py - TILE * 1.1 + Math.sin(_droneBob) * 6;
    var hoverX = px + 38;
    var hoverY = py + Math.cos(_droneBob * 0.7) * 4;
    ctx.save();
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 14 + Math.sin(_droneBob * 2) * 4;
    ctx.fillStyle = '#1a1a25';
    ctx.beginPath();
    ctx.moveTo(hoverX, hoverY - 4);
    ctx.lineTo(hoverX - 8, hoverY + 2);
    ctx.lineTo(hoverX - 4, hoverY + 6);
    ctx.lineTo(hoverX + 4, hoverY + 6);
    ctx.lineTo(hoverX + 8, hoverY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath(); ctx.arc(hoverX, hoverY, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff4d4d';
    ctx.fillRect(hoverX - 9, hoverY + 1, 2, 2);
    ctx.fillRect(hoverX + 7, hoverY + 1, 2, 2);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
    ctx.beginPath(); ctx.arc(hoverX, hoverY + 4, 4, 0, Math.PI * 2); ctx.fill();
    if (_cinematicTime % 1.0 < 0.05) {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.3)';
        ctx.beginPath(); ctx.arc(hoverX, hoverY + 4, 12, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

function drawWeatherMotes(dt) {
    if (game.hat !== 'driver') return;
    initMotes();
    var baseSpeed = 40;
    var spdMul = 1 + Math.abs(game.pvx || 0) / 600;
    for (var i = 0; i < _motes.length; i++) {
        var m = _motes[i];
        m.x += (m.vx * spdMul - (game.pvx || 0) * 0.3) * (dt || 0.016);
        m.y += m.vy * (dt || 0.016);
        if (m.x < game.cam - 100) m.x = game.cam + W + 100;
        if (m.x > game.cam + W + 100) m.x = game.cam - 100;
        if (m.y < -20) m.y = H + 20;
        if (m.y > H + 20) m.y = -20;
        var sx = m.x - game.cam * (0.3 + m.z * 0.2);
        var alpha = 0.3 + m.z * 0.2;
        ctx.fillStyle = m.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(sx, m.y, m.size * m.z * 0.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawCinematicTransition() {
    if (game.hatFlash <= 0) return;
    var t = game.hatFlash / 0.4;
    var r = (1 - t) * Math.max(W, H) * 1.4;
    var cx = W / 2, cy = H / 2;
    var color1 = (game.hat === 'plumber') ? '#ffd60a' : '#00e5ff';
    var color2 = (game.hat === 'plumber') ? '#ff9e3d' : '#7a5cff';
    ctx.save();
    var grad = ctx.createRadialGradient(cx, cy, r * 0.05, cx, cy, r);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0)');
    grad.addColorStop(0.62, color1);
    grad.addColorStop(0.78, color2);
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    var sw = (1 - t) * 30 + 4;
    ctx.strokeStyle = color1;
    ctx.lineWidth = sw;
    ctx.globalAlpha = t;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    var splitY = cy + (t - 0.5) * H * 0.3;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, W, splitY - 3);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, splitY + 3, W, H - splitY - 3);
    ctx.fillStyle = color1;
    ctx.fillRect(0, splitY - 1, W, 2);
    var caT = 1 - Math.abs(t - 0.5) * 2;
    if (caT > 0) {
        var shift = caT * 7;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = (game.hat === 'plumber') ? 'rgba(255,80,40,0.22)' : 'rgba(255,40,80,0.22)';
        ctx.fillRect(shift, 0, W, H);
        ctx.fillStyle = (game.hat === 'plumber') ? 'rgba(40,200,255,0.22)' : 'rgba(40,255,200,0.22)';
        ctx.fillRect(-shift, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
}

function updateCinematic(dt) {
    _cinematicTime += dt;
}
