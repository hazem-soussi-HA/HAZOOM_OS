// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// WORLD: TILES
// Tile definitions and pre-rendering
// ═══════════════════════════════════════════════════════════════

var tileCanvases = {};

function initTiles() {
    for (var k = 0; k < 16; k++) tileCanvases[k] = null;
    [1, 2, 3, 6, 7, 8, 9, 10, 13, 14, 15].forEach(function(k) { tileCanvases[k] = renderTileCanvas(k); });
}

function renderTileCanvas(key) {
    var t = document.createElement('canvas'); t.width = TILE; t.height = TILE;
    var tc = t.getContext('2d');

    if (key === 1) { // Ground — improved with grass tufts and dirt texture
        // Base dirt
        tc.fillStyle = GRD; tc.fillRect(0, 0, TILE, TILE);
        // Dirt texture patches
        tc.fillStyle = '#a05808'; tc.fillRect(8, 16, 16, 12); tc.fillRect(28, 20, 10, 8); tc.fillRect(6, 28, 14, 10);
        tc.fillStyle = '#b06818'; tc.fillRect(10, 18, 4, 4); tc.fillRect(30, 22, 3, 3);
        tc.fillStyle = '#8a4008'; tc.fillRect(16, 24, 8, 6);
        tc.fillStyle = '#c07828'; tc.fillRect(4, 22, 2, 2); tc.fillRect(22, 18, 2, 2); tc.fillRect(38, 26, 2, 2); tc.fillRect(14, 32, 2, 2);
        // Dirt cracks
        tc.strokeStyle = 'rgba(0,0,0,0.1)'; tc.lineWidth = 1;
        tc.beginPath(); tc.moveTo(12, 20); tc.lineTo(20, 28); tc.stroke();
        tc.beginPath(); tc.moveTo(30, 30); tc.lineTo(38, 36); tc.stroke();
        // Grass top layer
        tc.fillStyle = '#009900'; tc.fillRect(0, 0, TILE, 8);
        tc.fillStyle = '#007800'; tc.fillRect(0, 6, TILE, 4);
        // Grass stripe pattern
        for (var i = 0; i < 8; i++) { tc.fillStyle = i % 2 === 0 ? '#00aa00' : '#008800'; tc.fillRect(i * 6, 0, 3, 10); }
        // Grass tufts
        tc.fillStyle = '#4a8a2a'; tc.fillRect(2, 8, 4, 3); tc.fillRect(36, 10, 3, 2);
        tc.fillStyle = '#5ca03a'; tc.fillRect(14, 9, 3, 2); tc.fillRect(26, 8, 4, 3); tc.fillRect(42, 10, 3, 2);
        // Small flowers/pebbles
        tc.fillStyle = '#e8e860'; tc.fillRect(8, 12, 2, 2);
        tc.fillStyle = '#d0d0d0'; tc.fillRect(40, 14, 2, 2);
    } else if (key === 2) { // Brick — more 3D with highlights and shadows
        tc.fillStyle = BRC; tc.fillRect(0, 0, TILE, TILE);
        // Shadow on bottom and right of each brick
        tc.fillStyle = 'rgba(0,0,0,0.18)';
        tc.fillRect(0, TILE - 2, TILE, 2);  // bottom edge
        tc.fillRect(TILE - 2, 0, 2, TILE);  // right edge
        // Highlight on top and left
        tc.fillStyle = 'rgba(255,200,120,0.25)';
        tc.fillRect(0, 0, TILE, 2);  // top edge
        tc.fillRect(0, 0, 2, TILE);  // left edge
        // Mortar lines
        tc.strokeStyle = '#881c10'; tc.lineWidth = 2;
        for (var j = 0; j < 4; j++) { tc.beginPath(); tc.moveTo(0, j * 12 + 12); tc.lineTo(TILE, j * 12 + 12); tc.stroke(); }
        tc.beginPath(); tc.moveTo(TILE / 2, 0); tc.lineTo(TILE / 2, TILE); tc.stroke();
        // Inner brick highlights
        tc.fillStyle = 'rgba(255,120,60,0.2)';
        for (var jj = 0; jj < 4; jj++) { tc.fillRect(0, jj * 12 + 12, TILE / 2, 2); tc.fillRect(TILE / 2, jj * 12, TILE / 2, 1); }
        // Brick surface detail
        tc.fillStyle = '#a02010'; tc.fillRect(6, 18, 2, 2); tc.fillRect(20, 6, 2, 2); tc.fillRect(34, 30, 2, 2); tc.fillRect(14, 42, 2, 2);
        // Specular highlight
        tc.fillStyle = 'rgba(255,255,255,0.1)'; tc.fillRect(4, 4, 8, 4); tc.fillRect(28, 16, 6, 3);
    } else if (key === 3) { // Question block — animated shimmer
        tc.fillStyle = BLK2; tc.fillRect(0, 0, TILE, TILE);
        tc.strokeStyle = '#b48020'; tc.lineWidth = 3; tc.strokeRect(2, 2, TILE - 4, TILE - 4);
        // Inner shadow
        tc.fillStyle = 'rgba(0,0,0,0.1)'; tc.fillRect(3, 3, TILE - 6, 2); tc.fillRect(3, 3, 2, TILE - 6);
        // Shimmer highlight (top-left)
        tc.fillStyle = 'rgba(255,255,220,0.5)'; tc.fillRect(4, 4, TILE - 8, 3);
        // Question mark
        tc.fillStyle = '#aa8800'; tc.font = 'bold 22px Arial'; tc.textAlign = 'center'; tc.textBaseline = 'middle';
        tc.fillText('?', TILE / 2 + 1, TILE / 2 + 3);
        tc.fillStyle = YLW; tc.fillText('?', TILE / 2, TILE / 2 + 1);
        // Specular dot
        tc.fillStyle = 'rgba(255,255,200,0.4)'; tc.fillRect(TILE / 2 - 4, TILE / 2 - 6, 3, 2);
        // Corner bolts
        tc.fillStyle = '#8a6810';
        tc.beginPath(); tc.arc(5, 5, 3, 0, Math.PI * 2); tc.fill();
        tc.beginPath(); tc.arc(TILE - 5, 5, 3, 0, Math.PI * 2); tc.fill();
        tc.beginPath(); tc.arc(5, TILE - 5, 3, 0, Math.PI * 2); tc.fill();
        tc.beginPath(); tc.arc(TILE - 5, TILE - 5, 3, 0, Math.PI * 2); tc.fill();
        tc.fillStyle = '#dac820';
        tc.beginPath(); tc.arc(4, 4, 1.5, 0, Math.PI * 2); tc.fill();
        tc.beginPath(); tc.arc(TILE - 6, 4, 1.5, 0, Math.PI * 2); tc.fill();
    } else if (key === 6) { // Bush (decorative)
        tc.clearRect(0, 0, TILE, TILE);
        tc.fillStyle = '#1a7a2a';
        tc.beginPath(); tc.arc(TILE / 2, TILE / 2 + 4, TILE / 2.5, 0, Math.PI * 2); tc.fill();
        tc.fillStyle = '#2d9a4e';
        tc.beginPath(); tc.arc(TILE / 2 - 6, TILE / 2, TILE / 3.5, 0, Math.PI * 2); tc.fill();
        tc.beginPath(); tc.arc(TILE / 2 + 8, TILE / 2 + 2, TILE / 4, 0, Math.PI * 2); tc.fill();
        tc.fillStyle = '#4ab06a';
        tc.beginPath(); tc.arc(TILE / 2, TILE / 2 - 2, TILE / 5, 0, Math.PI * 2); tc.fill();
    } else if (key === 7) { // Cloud (decorative)
        tc.clearRect(0, 0, TILE, TILE);
        tc.fillStyle = 'rgba(255,255,255,0.85)';
        tc.beginPath(); tc.arc(TILE / 2, TILE / 2 + 4, TILE / 3, 0, Math.PI * 2); tc.fill();
        tc.beginPath(); tc.arc(TILE / 2 - 10, TILE / 2 + 6, TILE / 4.5, 0, Math.PI * 2); tc.fill();
        tc.beginPath(); tc.arc(TILE / 2 + 10, TILE / 2 + 6, TILE / 4, 0, Math.PI * 2); tc.fill();
        tc.fillStyle = 'rgba(255,255,255,0.5)';
        tc.beginPath(); tc.arc(TILE / 2, TILE / 2, TILE / 5, 0, Math.PI * 2); tc.fill();
    } else if (key === 8) { // Coin (floating collectible)
        tc.clearRect(0, 0, TILE, TILE);
        // Outer glow
        tc.fillStyle = 'rgba(255,220,0,0.2)';
        tc.beginPath(); tc.arc(TILE / 2, TILE / 2, TILE / 2.2, 0, Math.PI * 2); tc.fill();
        // Coin body
        tc.fillStyle = '#ffd60a';
        tc.beginPath(); tc.arc(TILE / 2, TILE / 2, TILE / 3, 0, Math.PI * 2); tc.fill();
        // Inner ring
        tc.strokeStyle = '#b89600'; tc.lineWidth = 2;
        tc.beginPath(); tc.arc(TILE / 2, TILE / 2, TILE / 4.5, 0, Math.PI * 2); tc.stroke();
        // Dollar sign
        tc.fillStyle = '#b89600'; tc.font = 'bold 16px Arial'; tc.textAlign = 'center'; tc.textBaseline = 'middle';
        tc.fillText('$', TILE / 2, TILE / 2 + 1);
        // Highlight
        tc.fillStyle = 'rgba(255,255,255,0.5)';
        tc.beginPath(); tc.arc(TILE / 2 - 3, TILE / 2 - 4, 3, 0, Math.PI * 2); tc.fill();
    } else if (key === 9) { // Spikes (hazard)
        tc.fillStyle = '#5a5a6a'; tc.fillRect(0, 0, TILE, TILE);
        tc.fillStyle = '#8a8a9a';
        // Draw spike triangles
        for (var si = 0; si < 4; si++) {
            var sx = si * 12 + 2;
            tc.beginPath();
            tc.moveTo(sx, TILE);
            tc.lineTo(sx + 6, TILE / 3);
            tc.lineTo(sx + 12, TILE);
            tc.closePath(); tc.fill();
            // Highlight on spike
            tc.fillStyle = '#aaaabc';
            tc.beginPath();
            tc.moveTo(sx + 4, TILE * 0.7);
            tc.lineTo(sx + 6, TILE / 3 + 2);
            tc.lineTo(sx + 8, TILE * 0.7);
            tc.closePath(); tc.fill();
            tc.fillStyle = '#8a8a9a';
        }
        // Base
        tc.fillStyle = '#4a4a5a'; tc.fillRect(0, TILE - 6, TILE, 6);
    } else if (key === 10) { // Dark/underground brick
        tc.fillStyle = '#3a3a4a'; tc.fillRect(0, 0, TILE, TILE);
        tc.fillStyle = '#2a2a3a'; tc.fillRect(0, 0, TILE, 4);
        tc.fillStyle = '#4a4a5a'; tc.fillRect(TILE - 4, 0, 4, TILE);
        tc.strokeStyle = 'rgba(0,0,0,0.2)'; tc.lineWidth = 1;
        tc.beginPath(); tc.moveTo(10, 10); tc.lineTo(30, 15); tc.lineTo(40, 8); tc.stroke();
        tc.beginPath(); tc.moveTo(5, 35); tc.lineTo(25, 38); tc.stroke();
        tc.fillStyle = 'rgba(50,100,50,0.15)'; tc.fillRect(2, 0, 6, 4); tc.fillRect(36, 0, 8, 3);
        // 3D edge highlights
        tc.fillStyle = 'rgba(255,255,255,0.05)'; tc.fillRect(0, 0, TILE, 1); tc.fillRect(0, 0, 1, TILE);
        tc.fillStyle = 'rgba(0,0,0,0.3)'; tc.fillRect(0, TILE - 1, TILE, 1); tc.fillRect(TILE - 1, 0, 1, TILE);
    } else if (key === 13) { // Police car placeholder
        tc.clearRect(0, 0, TILE, TILE);
        // Car body
        tc.fillStyle = '#1a1a3a'; tc.fillRect(4, 14, 40, 18);
        tc.fillStyle = '#2a2a5a'; tc.fillRect(8, 10, 24, 12);
        // Windows
        tc.fillStyle = '#6ab0d0'; tc.fillRect(10, 12, 8, 8); tc.fillRect(22, 12, 8, 8);
        // Siren
        tc.fillStyle = '#ff2020'; tc.fillRect(14, 8, 4, 3);
        tc.fillStyle = '#2060ff'; tc.fillRect(22, 8, 4, 3);
        // Wheels
        tc.fillStyle = '#1a1a1a';
        tc.beginPath(); tc.arc(12, 34, 5, 0, Math.PI * 2); tc.fill();
        tc.beginPath(); tc.arc(36, 34, 5, 0, Math.PI * 2); tc.fill();
        // Highlight
        tc.fillStyle = 'rgba(255,255,255,0.15)'; tc.fillRect(8, 10, 24, 2);
    } else if (key === 14) { // Flag top (finish line)
        tc.clearRect(0, 0, TILE, TILE);
        // Flag pole top ornament
        tc.fillStyle = '#ffd60a';
        tc.beginPath(); tc.arc(TILE / 2, 8, 6, 0, Math.PI * 2); tc.fill();
        tc.fillStyle = '#b89600';
        tc.beginPath(); tc.arc(TILE / 2, 8, 4, 0, Math.PI * 2); tc.fill();
        tc.fillStyle = '#ffd60a';
        tc.beginPath(); tc.arc(TILE / 2, 8, 2, 0, Math.PI * 2); tc.fill();
    } else if (key === 15) { // Flag pole (finish line)
        tc.clearRect(0, 0, TILE, TILE);
        // Pole
        tc.fillStyle = '#8a8a8a'; tc.fillRect(TILE / 2 - 3, 0, 6, TILE);
        tc.fillStyle = '#aaaaca'; tc.fillRect(TILE / 2 - 1, 0, 2, TILE);
        // Flag (waving)
        tc.fillStyle = '#e63946';
        tc.beginPath();
        tc.moveTo(TILE / 2 + 3, 4);
        tc.lineTo(TILE - 2, 10);
        tc.lineTo(TILE / 2 + 3, 20);
        tc.closePath(); tc.fill();
        // Flag highlight
        tc.fillStyle = 'rgba(255,255,255,0.2)';
        tc.beginPath();
        tc.moveTo(TILE / 2 + 3, 4);
        tc.lineTo(TILE / 2 + 10, 8);
        tc.lineTo(TILE / 2 + 3, 12);
        tc.closePath(); tc.fill();
    }
    return t;
}

function renderPipeCanvas(top, color) {
    var key = (top ? 'pipe_top_' : 'pipe_body_') + (color || 'green');
    if (tileCanvases[key]) return tileCanvases[key];
    var t = document.createElement('canvas'); t.width = TILE; t.height = TILE;
    var tc = t.getContext('2d');
    var c1 = color === 'dark' ? '#006800' : PIL, c2 = PIP, c3 = color === 'dark' ? '#004000' : PI2;
    if (top) {
        tc.fillStyle = c2; tc.fillRect(0, 0, TILE, TILE);
        tc.fillStyle = c1; tc.fillRect(0, 0, Math.floor(TILE / 6), TILE);
        tc.fillStyle = c3; tc.fillRect(TILE - Math.floor(TILE / 6), 0, Math.floor(TILE / 6), TILE);
        tc.strokeStyle = '#004000'; tc.lineWidth = 2; tc.strokeRect(1, 1, TILE - 2, TILE - 2);
        tc.fillStyle = 'rgba(255,255,255,0.12)'; tc.fillRect(4, 2, 8, TILE - 4);
    } else {
        tc.fillStyle = c2; tc.fillRect(TILE * 0.1, 0, TILE * 0.8, TILE);
        tc.fillStyle = c1; tc.fillRect(TILE * 0.1, 0, Math.floor(TILE / 8), TILE);
        tc.fillStyle = c3; tc.fillRect(TILE - TILE * 0.1 - Math.floor(TILE / 8), 0, Math.floor(TILE / 8), TILE);
        tc.strokeStyle = '#004000'; tc.lineWidth = 2; tc.strokeRect(TILE * 0.1, 1, TILE * 0.8 - 1, TILE - 2);
        tc.fillStyle = 'rgba(255,255,255,0.08)'; tc.fillRect(TILE * 0.15, 2, 6, TILE - 4);
    }
    tileCanvases[key] = t; return t;
}
