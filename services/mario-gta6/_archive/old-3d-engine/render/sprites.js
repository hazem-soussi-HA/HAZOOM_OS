// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// RENDER: SPRITES
// High-quality sprite generation and caching
// ═══════════════════════════════════════════════════════════════

var marioCache = {};

function initSprites() {
    initTiles();
    // Pre-cache all Mario sprites
    for (var b = 0; b <= 1; b++) for (var f = 0; f <= 1; f++) for (var p = 0; p <= 3; p++) drawMarioSprite(b > 0, f > 0, p);
    // Pre-cache Koopa sprites
    for (var kp = 0; kp < 2; kp++) generateKoopaSprite(kp);
    getShellSprite();
}

function drawMarioSprite(big, fire, pose) {
    var key = (big ? 1 : 0) + '_' + (fire ? 1 : 0) + '_' + pose;
    if (marioCache[key]) return marioCache[key];
    var w = 64, h = big ? 128 : 96;
    var t = document.createElement('canvas'); t.width = w; t.height = h;
    var c = t.getContext('2d');
    var fC = fire;
    var cap = fC ? '#ffffff' : '#dd0000', capB = fC ? '#ffcccc' : '#ff2222', capS = fC ? '#cc9999' : '#aa0000';
    var body = fC ? '#ffffff' : BLU, bodyB = fC ? '#eeeeee' : '#3355dd', bodyS = fC ? '#bbbbbb' : '#112288';
    var shoe = '#553311', shoeB = '#774422', shoeS = '#332200';
    if (fC) { shoe = '#ffffff'; shoeB = '#dddddd'; shoeS = '#999999'; }
    var shirtCol = fC ? '#cc0000' : RED;

    function r(x, y, w2, h2, col) { c.fillStyle = col; c.fillRect(x, y, w2, h2); }
    function d(x, y, rad, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill(); }

    if (!big) {
      d(32, 14, 12, SKN);
      c.fillStyle = cap; c.beginPath(); c.ellipse(32, 10, 14, 10, 0, 0, Math.PI * 2); c.fill();
      d(32, 6, 8, capB);
      c.fillStyle = capS; c.beginPath(); c.ellipse(32, 16, 16, 4, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.2)'; c.beginPath(); c.ellipse(28, 5, 4, 3, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = fC ? '#ff4444' : YLW; c.font = 'bold 9px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('M', 32, 8);
      d(28, 13, 3, '#333'); d(36, 13, 3, '#333');
      d(27, 12, 1.5, WHT); d(35, 12, 1.5, WHT);
      d(28, 13, 1.5, BLK); d(36, 13, 1.5, BLK);
      d(32, 17, 4, SKN); c.fillStyle = '#d4a060'; d(34, 17, 2);
      c.fillStyle = '#2a1a00'; c.beginPath(); c.ellipse(32, 21, 8, 3, 0, 0, Math.PI * 2); c.fill();
      d(20, 14, 3, SKN); c.fillStyle = '#d4a060'; d(19, 14, 1.5);
      d(44, 14, 3, SKN); c.fillStyle = '#d4a060'; d(45, 14, 1.5);
      r(24, 28, 16, 8, shirtCol); r(22, 30, 20, 24, body); r(26, 28, 2, 12, body); r(36, 28, 2, 12, body);
      d(27, 39, 2, YLW); d(37, 39, 2, YLW); r(25, 46, 14, 1, bodyS);
      r(20, 28, 6, 10, shirtCol); r(38, 28, 6, 10, shirtCol);
      d(18, 38, 4, WHT); d(46, 38, 4, WHT);
      if (pose === 3) { r(18, 20, 6, 8, shirtCol); d(21, 19, 4, WHT); r(40, 20, 6, 8, shirtCol); d(43, 19, 4, WHT); }
      else if (pose === 1) { r(38, 29, 8, 6, shirtCol); d(47, 32, 4, WHT); }
      else if (pose === 2) { r(18, 29, 8, 6, shirtCol); d(17, 32, 4, WHT); }
      if (pose === 1) { r(22, 52, 8, 6, body); r(22, 58, 8, 2, SKN); r(20, 60, 10, 6, shoe); r(18, 66, 14, 2, shoeS); r(34, 52, 8, 6, body); r(34, 58, 8, 2, SKN); r(34, 60, 10, 6, shoe); r(34, 66, 14, 2, shoeS); }
      else if (pose === 2) { r(22, 52, 10, 6, body); r(22, 58, 10, 2, SKN); r(22, 60, 12, 6, shoe); r(22, 66, 16, 2, shoeS); r(32, 52, 8, 6, body); r(32, 58, 8, 2, SKN); r(30, 60, 10, 6, shoe); r(28, 66, 14, 2, shoeS); }
      else if (pose === 3) { r(22, 52, 10, 6, body); r(22, 58, 10, 4, bodyS); r(20, 62, 14, 4, shoe); r(18, 66, 18, 2, shoeS); r(32, 52, 10, 6, body); r(32, 58, 10, 4, bodyS); r(30, 62, 14, 4, shoe); r(28, 66, 18, 2, shoeS); }
      else { r(22, 54, 8, 6, body); r(22, 60, 8, 2, SKN); r(20, 62, 12, 6, shoe); r(18, 68, 16, 2, shoeS); r(34, 54, 8, 6, body); r(34, 60, 8, 2, SKN); r(34, 62, 12, 6, shoe); r(32, 68, 16, 2, shoeS); r(21, 62, 2, 2, shoeB); r(35, 62, 2, 2, shoeB); }
    } else {
      d(32, 18, 13, SKN);
      c.fillStyle = cap; c.beginPath(); c.ellipse(32, 12, 16, 12, 0, 0, Math.PI * 2); c.fill();
      d(32, 7, 9, capB);
      c.fillStyle = capS; c.beginPath(); c.ellipse(32, 19, 18, 5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(27, 6, 5, 3, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = fC ? '#ff4444' : YLW; c.font = 'bold 12px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('M', 32, 10);
      d(27, 17, 3.5, '#333'); d(37, 17, 3.5, '#333');
      d(26, 16, 1.5, WHT); d(36, 16, 1.5, WHT);
      d(27, 17, 1.5, BLK); d(37, 17, 1.5, BLK);
      d(32, 22, 4, SKN); c.fillStyle = '#d4a060'; d(34, 22, 2);
      c.fillStyle = '#2a1a00'; c.beginPath(); c.ellipse(32, 26, 10, 4, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#442200'; c.beginPath(); c.ellipse(24, 24, 3, 2, -0.3, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(40, 24, 3, 2, 0.3, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#d4a060'; c.beginPath(); c.ellipse(32, 29, 5, 2, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = BRN; c.beginPath(); c.ellipse(22, 15, 3, 2, 0.3, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(42, 15, 3, 2, -0.3, 0, Math.PI * 2); c.fill();
      d(18, 18, 3.5, SKN); d(46, 18, 3.5, SKN); c.fillStyle = '#d4a060'; d(17, 18, 2); d(47, 18, 2);
      r(22, 34, 20, 14, shirtCol); r(20, 36, 24, 36, body); r(24, 34, 3, 16, body); r(37, 34, 3, 16, body);
      d(26, 48, 2.5, YLW); d(38, 48, 2.5, YLW);
      d(25.5, 47.5, 1, 'rgba(255,255,200,0.6)'); d(37.5, 47.5, 1, 'rgba(255,255,200,0.6)');
      r(23, 54, 20, 1.5, bodyS); r(23, 35, 2, 10, shirtCol === '#cc0000' ? '#dd3333' : '#3355dd'); r(39, 35, 2, 10, shirtCol === '#cc0000' ? '#dd3333' : '#3355dd');
      r(26, 34, 12, 3, bodyS); r(16, 34, 8, 12, shirtCol); r(40, 34, 8, 12, shirtCol);
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.arc(20, 40, 5, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(44, 40, 5, 0, Math.PI * 2); c.fill();
      d(14, 46, 5, WHT); d(13, 44, 1.5, WHT); d(50, 46, 5, WHT); d(51, 44, 1.5, WHT);
      c.fillStyle = 'rgba(0,0,0,0.1)'; c.beginPath(); c.arc(14, 47, 3, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(50, 47, 3, 0, Math.PI * 2); c.fill();
      if (pose === 3) { r(14, 24, 8, 10, shirtCol); d(17, 22, 5, WHT); r(42, 24, 8, 10, shirtCol); d(45, 22, 5, WHT); }
      else if (pose === 1) { r(40, 35, 10, 8, shirtCol); d(52, 39, 5, WHT); }
      else if (pose === 2) { r(14, 35, 10, 8, shirtCol); d(12, 39, 5, WHT); }
      if (pose === 1) { r(22, 70, 10, 8, body); r(22, 78, 10, 3, SKN); r(20, 81, 12, 8, shoe); r(18, 89, 16, 2, shoeS); r(34, 70, 10, 8, body); r(34, 78, 10, 3, SKN); r(34, 81, 12, 8, shoe); r(32, 89, 16, 2, shoeS); }
      else if (pose === 2) { r(20, 70, 12, 8, body); r(20, 78, 12, 3, SKN); r(20, 81, 14, 8, shoe); r(18, 89, 18, 2, shoeS); r(34, 70, 10, 8, body); r(34, 78, 10, 3, SKN); r(32, 81, 12, 8, shoe); r(30, 89, 16, 2, shoeS); }
      else if (pose === 3) { r(20, 70, 12, 8, body); r(20, 78, 12, 5, bodyS); r(18, 83, 16, 5, shoe); r(16, 88, 20, 2, shoeS); r(32, 70, 12, 8, body); r(32, 78, 12, 5, bodyS); r(30, 83, 16, 5, shoe); r(28, 88, 20, 2, shoeS); }
      else { r(22, 72, 10, 8, body); r(22, 80, 10, 3, SKN); r(20, 83, 14, 8, shoe); r(18, 91, 18, 2, shoeS); r(34, 72, 10, 8, body); r(34, 80, 10, 3, SKN); r(32, 83, 14, 8, shoe); r(30, 91, 18, 2, shoeS); r(21, 83, 2, 2, shoeB); r(33, 83, 2, 2, shoeB); r(24, 86, 3, 2, YLW); r(37, 86, 3, 2, YLW); }
    }
    marioCache[key] = t; return t;
}

var koopaCache = {};
function generateKoopaSprite(pose) {
    var key = 'koopa_' + pose; if (koopaCache[key]) return koopaCache[key];
    var t = document.createElement('canvas'); t.width = TILE; t.height = TILE * 1.5;
    var tc = t.getContext('2d'); var cy = TILE * 0.6;
    tc.fillStyle = KOOPA_GREEN; tc.beginPath(); tc.ellipse(TILE / 2, cy, TILE * 0.45, TILE * 0.35, 0, 0, Math.PI * 2); tc.fill();
    tc.fillStyle = KOOPA_DARK; tc.beginPath(); tc.ellipse(TILE / 2, cy, TILE * 0.35, TILE * 0.25, 0, 0, Math.PI * 2); tc.fill();
    tc.strokeStyle = KOOPA_DARK; tc.lineWidth = 1.5; tc.beginPath(); tc.moveTo(TILE * 0.2, cy); tc.lineTo(TILE * 0.8, cy); tc.stroke();
    tc.fillStyle = 'rgba(255,255,255,0.12)'; tc.beginPath(); tc.ellipse(TILE / 2 - 3, cy - 5, TILE / 4, TILE / 5, 0, 0, Math.PI * 2); tc.fill();
    tc.fillStyle = KOOPA_SKIN; tc.beginPath(); tc.arc(TILE * 0.65, TILE * 0.2, TILE * 0.22, 0, Math.PI * 2); tc.fill();
    tc.fillStyle = WHT; tc.beginPath(); tc.arc(TILE * 0.68, TILE * 0.18, 5, 0, Math.PI * 2); tc.fill();
    tc.fillStyle = BLK; tc.beginPath(); tc.arc(TILE * 0.7, TILE * 0.18, 2.5, 0, Math.PI * 2); tc.fill();
    tc.fillStyle = WHT; tc.beginPath(); tc.arc(TILE * 0.69, TILE * 0.17, 1.2, 0, Math.PI * 2); tc.fill();
    var fo = pose % 2 === 0 ? -3 : 3;
    tc.fillStyle = KOOPA_SKIN;
    tc.beginPath(); tc.ellipse(TILE * 0.35 + fo, TILE * 0.82, TILE * 0.12, TILE * 0.06, 0, 0, Math.PI * 2); tc.fill();
    tc.beginPath(); tc.ellipse(TILE * 0.6 - fo, TILE * 0.82, TILE * 0.12, TILE * 0.06, 0, 0, Math.PI * 2); tc.fill();
    koopaCache[key] = t; return t;
}

function getShellSprite() {
    if (koopaCache['shell']) return koopaCache['shell'];
    var t = document.createElement('canvas'); t.width = TILE; t.height = TILE;
    var tc = t.getContext('2d');
    tc.fillStyle = KOOPA_GREEN; tc.beginPath(); tc.ellipse(TILE / 2, TILE / 2, TILE * 0.45, TILE * 0.4, 0, 0, Math.PI * 2); tc.fill();
    tc.fillStyle = KOOPA_DARK; tc.beginPath(); tc.ellipse(TILE / 2, TILE / 2, TILE * 0.35, TILE * 0.3, 0, 0, Math.PI * 2); tc.fill();
    tc.strokeStyle = KOOPA_DARK; tc.lineWidth = 2; tc.beginPath(); tc.moveTo(TILE * 0.15, TILE / 2); tc.lineTo(TILE * 0.85, TILE / 2); tc.stroke();
    tc.fillStyle = 'rgba(255,255,255,0.12)'; tc.beginPath(); tc.ellipse(TILE / 2 - 3, TILE / 2 - 4, TILE / 4, TILE / 6, 0, 0, Math.PI * 2); tc.fill();
    koopaCache['shell'] = t; return t;
}
