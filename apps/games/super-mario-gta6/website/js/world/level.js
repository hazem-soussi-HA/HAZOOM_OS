// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// WORLD: LEVEL
// Tilemap parser, level builder, spawning
// ═══════════════════════════════════════════════════════════════

function buildLevel() {
    var lvl = [];
    for (var y = 0; y < WH; y++) { lvl[y] = []; for (var x = 0; x < WW; x++) { lvl[y][x] = 0; } }

    // Ground with gaps — varied terrain heights (hills & valleys)
    // We build ground in segments with different base heights
    var groundSegments = [
        { start: 0, end: 39, base: WH - 1 },
        { start: 42, end: 67, base: WH - 1 },
        { start: 42, end: 50, raise: 0 },
        { start: 71, end: 94, base: WH - 1 },
        { start: 97, end: 129, base: WH - 1 },
        { start: 133, end: 169, base: WH - 1 },
        { start: 172, end: 209, base: WH - 1 },
        { start: 213, end: 260, base: WH - 1 },
        { start: 261, end: 280, base: WH - 2 },  // hill: ground is 1 tile higher
        { start: 281, end: 300, base: WH - 1 }
    ];

    // Default ground fill
    for (var x = 0; x < WW; x++) {
        if ((x >= 40 && x <= 41) || (x >= 68 && x <= 70) || (x >= 95 && x <= 96) ||
            (x >= 130 && x <= 132) || (x >= 170 && x <= 171) || (x >= 210 && x <= 212) ||
            (x >= 250 && x <= 252)) continue;
        lvl[WH - 1][x] = 1; lvl[WH - 2][x] = 1;
    }

    // Hill: raise ground at x=261-280 (2 tiles higher)
    for (var hx = 261; hx <= 280; hx++) {
        lvl[WH - 1][hx] = 0; lvl[WH - 2][hx] = 0;
        lvl[WH - 3][hx] = 1; lvl[WH - 4][hx] = 1;
    }
    // Smooth hill entry
    lvl[WH - 3][260] = 1; lvl[WH - 3][281] = 1;

    // Valley: lower ground at x=145-155 (1 tile lower, so 3 deep)
    for (var vx = 145; vx <= 155; vx++) {
        lvl[WH - 1][vx] = 1; lvl[WH - 2][vx] = 1; lvl[WH - 3][vx] = 1;
    }

    // Platforms, question blocks, pipes, coins, spikes, decorative elements
    var pd = [
        // Section 1: x 0-50 — intro area
        { x: 12, y: 5, t: 'b', n: 2 }, { x: 18, y: 4, t: 'q', w: 1, h: 2 }, { x: 22, y: 6, t: 'b', n: 4 },
        { x: 30, y: 4, t: 'q', n: 3 }, { x: 35, y: 7, t: 'b', n: 2 },
        { x: 44, y: 5, t: 'b', n: 3 }, { x: 48, y: 7, t: 'q', n: 1 }, { x: 52, y: 4, t: 'b', n: 4 }, { x: 55, y: 8, t: 'q', n: 2 },
        { x: 60, y: 3, t: 'p' }, { x: 62, y: 6, t: 'b', n: 5 }, { x: 64, y: 9, t: 'b', n: 2 },

        // Section 2: x 50-100 — pipe gauntlet
        { x: 73, y: 4, t: 'q', w: 4, h: 1 }, { x: 75, y: 7, t: 'b', n: 3 },
        { x: 80, y: 3, t: 'p', c: 'dark' }, { x: 82, y: 5, t: 'b', n: 4 },
        { x: 88, y: 4, t: 'q', n: 2 }, { x: 88, y: 7, t: 'b', n: 2 },
        { x: 92, y: 6, t: 'b', n: 3 }, { x: 98, y: 3, t: 'p' },

        // Section 3: x 100-150 — multi-level platforms
        { x: 100, y: 5, t: 'b', n: 2 }, { x: 100, y: 8, t: 'b', n: 2 }, { x: 100, y: 11, t: 'b', n: 2 },
        { x: 104, y: 6, t: 'q', n: 1 }, { x: 104, y: 9, t: 'q', n: 1 },
        { x: 108, y: 4, t: 'b', n: 5 }, { x: 112, y: 7, t: 'q', w: 3, h: 1 },
        { x: 118, y: 4, t: 'b', n: 1 }, { x: 119, y: 5, t: 'b', n: 1 }, { x: 120, y: 6, t: 'b', n: 1 }, { x: 121, y: 7, t: 'b', n: 1 },
        { x: 124, y: 5, t: 'b', n: 3 }, { x: 126, y: 8, t: 'q', n: 2 },
        { x: 135, y: 3, t: 'p' }, { x: 137, y: 3, t: 'p', c: 'dark' }, { x: 139, y: 3, t: 'p' },
        { x: 136, y: 7, t: 'b', n: 6 }, { x: 142, y: 5, t: 'q', n: 3 },

        // Section 4: x 150-200 — valley + hidden bonus
        { x: 148, y: 5, t: 'b', n: 2 }, { x: 152, y: 7, t: 'b', n: 2 }, { x: 156, y: 4, t: 'b', n: 2 },
        { x: 160, y: 6, t: 'q', n: 2 }, { x: 160, y: 9, t: 'b', n: 2 },
        { x: 165, y: 3, t: 'p', c: 'dark' }, { x: 167, y: 5, t: 'b', n: 6 },
        { x: 170, y: 7, t: 'b', n: 3 }, { x: 168, y: 9, t: 'b', n: 5 },
        { x: 175, y: 4, t: 'q', w: 5, h: 1 }, { x: 177, y: 7, t: 'b', n: 2 },
        { x: 182, y: 6, t: 'b', n: 4 }, { x: 188, y: 4, t: 'q', n: 3 }, { x: 188, y: 7, t: 'q', n: 3 },
        { x: 192, y: 5, t: 'b', n: 6 }, { x: 195, y: 8, t: 'b', n: 2 },

        // Section 5: x 200-250 — highway + spikes
        { x: 200, y: 4, t: 'b', n: 3 }, { x: 204, y: 6, t: 'b', n: 2 }, { x: 207, y: 4, t: 'b', n: 2 },
        { x: 210, y: 7, t: 'q', n: 2 }, { x: 214, y: 5, t: 'b', n: 4 },
        { x: 218, y: 3, t: 'p' }, { x: 220, y: 6, t: 'b', n: 5 },
        { x: 225, y: 4, t: 'q', w: 3, h: 1 }, { x: 230, y: 5, t: 'b', n: 6 },
        { x: 235, y: 3, t: 'p', c: 'dark' }, { x: 238, y: 4, t: 'b', n: 5 }, { x: 242, y: 6, t: 'q', n: 2 },
        { x: 246, y: 8, t: 'b', n: 3 }, { x: 255, y: 5, t: 'q', n: 2 },
        { x: 258, y: 3, t: 'p' },

        // Section 6: x 260-300 — hill climb + finish
        { x: 263, y: 6, t: 'b', n: 3 }, { x: 266, y: 8, t: 'b', n: 2 },
        { x: 270, y: 5, t: 'q', n: 2 }, { x: 274, y: 7, t: 'b', n: 4 },
        { x: 278, y: 4, t: 'b', n: 2 }, { x: 282, y: 6, t: 'q', n: 3 },
        { x: 286, y: 3, t: 'p' }, { x: 288, y: 5, t: 'b', n: 3 },
        { x: 292, y: 7, t: 'b', n: 2 }, { x: 295, y: 4, t: 'q', n: 2 }
    ];

    pd.forEach(function(p) {
        if (p.t === 'b') { for (var i = 0; i < (p.n || 1); i++) if (p.x + i < WW && p.y < WH) lvl[p.y][p.x + i] = (p.c === 'dark') ? 10 : 2; }
        else if (p.t === 'q') { for (var dx = 0; dx < (p.w || 1); dx++) for (var dy = 0; dy < (p.h || 1); dy++) if (p.x + dx < WW && p.y + dy < WH) lvl[p.y + dy][p.x + dx] = 3; }
        else if (p.t === 'p') { if (p.x < WW && p.y + 1 < WH) { lvl[p.y][p.x] = 4; lvl[p.y + 1][p.x] = 5; } }
    });

    // ── Floating coins (tile type 8) ──
    var coinPositions = [
        14, 15, 20, 21, 28, 29, 33, 34, 36, 37, 46, 47, 50, 51, 53, 54,
        56, 57, 58, 63, 65, 66, 74, 76, 77, 78, 84, 85, 86, 89, 90,
        93, 94, 102, 103, 105, 106, 109, 110, 111, 113, 114, 115,
        125, 127, 128, 138, 140, 143, 144, 149, 150, 153, 154, 157, 158,
        161, 162, 168, 169, 176, 178, 179, 180, 183, 184, 185, 189, 190, 191,
        193, 194, 196, 197, 201, 202, 205, 206, 208, 209, 211, 215, 216, 217,
        221, 222, 223, 226, 227, 228, 231, 232, 233, 239, 240, 241, 243, 244,
        247, 248, 256, 257, 264, 265, 267, 268, 271, 272, 275, 276, 277,
        279, 280, 283, 284, 285, 289, 290, 291, 293, 296, 297
    ];
    coinPositions.forEach(function(cx) {
        // Place coins at various heights above ground
        var row = 3 + (cx % 5);  // rows 3-7
        if (row < WH && lvl[row][cx] === 0) lvl[row][cx] = 8;
    });

    // ── Spikes (tile type 9) ──
    var spikePositions = [
        38, 39, 69, 70, 71, 96, 97, 131, 132, 133, 171, 172, 211, 212, 213, 251, 252, 253
    ];
    spikePositions.forEach(function(sx) {
        if (sx < WW) lvl[WH - 3][sx] = 9;
    });

    // ── Hidden bonus areas (secret rooms via pipes) ──
    // Secret room 1: accessible via dark pipe at x=80
    // Place hidden blocks (type 8) in a cluster above the pipe
    var secretRoom1 = [
        { x: 78, y: 1 }, { x: 79, y: 1 }, { x: 80, y: 1 }, { x: 81, y: 1 },
        { x: 78, y: 2 }, { x: 79, y: 2 }, { x: 80, y: 2 }, { x: 81, y: 2 }
    ];
    secretRoom1.forEach(function(s) { if (s.x < WW && s.y < WH) lvl[s.y][s.x] = 8; });

    // Secret room 2: accessible via dark pipe at x=165
    var secretRoom2 = [
        { x: 163, y: 1 }, { x: 164, y: 1 }, { x: 165, y: 1 }, { x: 166, y: 1 },
        { x: 163, y: 2 }, { x: 164, y: 2 }, { x: 165, y: 2 }, { x: 166, y: 2 }
    ];
    secretRoom2.forEach(function(s) { if (s.x < WW && s.y < WH) lvl[s.y][s.x] = 8; });

    // Secret room 3: accessible via dark pipe at x=235
    var secretRoom3 = [
        { x: 233, y: 1 }, { x: 234, y: 1 }, { x: 235, y: 1 }, { x: 236, y: 1 },
        { x: 233, y: 2 }, { x: 234, y: 2 }, { x: 235, y: 2 }, { x: 236, y: 2 }
    ];
    secretRoom3.forEach(function(s) { if (s.x < WW && s.y < WH) lvl[s.y][s.x] = 8; });

    // ── Decorative: bushes (tile type 6) ──
    var bushPositions = [5, 25, 45, 65, 85, 105, 125, 145, 165, 185, 205, 225, 245, 265, 285];
    bushPositions.forEach(function(bx) {
        if (bx < WW && lvl[WH - 3][bx] === 0) lvl[WH - 3][bx] = 6;
    });

    // ── Decorative: clouds (tile type 7) ──
    var cloudPositions = [3, 15, 35, 55, 75, 95, 115, 135, 155, 175, 195, 215, 235, 255, 275, 295];
    cloudPositions.forEach(function(cx) {
        if (cx < WH && cx < WW) {
            var row = 1 + (cx % 2);
            if (row < WH && lvl[row][cx] === 0) lvl[row][cx] = 7;
        }
    });

    // ── Finish line: flagpole (tile types 14=flag top, 15=flag pole) ──
    var finishX = 297;
    for (var fy = WH - 3; fy >= 3; fy--) {
        lvl[fy][finishX] = 15;  // pole
    }
    lvl[3][finishX] = 14;  // flag top
    // Flag base
    lvl[WH - 3][finishX] = 2;
    lvl[WH - 3][finishX - 1] = 2;

    // Plumber-only rooftop platforms (high in the sky)
    var rooftops = [
        { x: 80, y: 3, n: 3 }, { x: 86, y: 4, n: 2 }, { x: 92, y: 3, n: 4 },
        { x: 160, y: 2, n: 3 }, { x: 165, y: 3, n: 2 }, { x: 170, y: 2, n: 5 },
        { x: 215, y: 3, n: 3 }, { x: 270, y: 2, n: 4 }
    ];
    rooftops.forEach(function(r) {
        for (var i = 0; i < r.n; i++) {
            if (r.x + i < WW && r.y < WH) lvl[r.y][r.x + i] = 11;
        }
    });

    // Driver-only highway strip (ground row, but tagged)
    for (var hx = 30; hx < 50; hx++) lvl[WH - 1][hx] = 12;
    for (var hx2 = 110; hx2 < 130; hx2++) lvl[WH - 1][hx2] = 12;
    for (var hx3 = 200; hx3 < 220; hx3++) lvl[WH - 1][hx3] = 12;
    for (var hx4 = 260; hx4 < 275; hx4++) lvl[WH - 3][hx4] = 12;  // highway on hill

    // Police car placeholders (tile type 13)
    var policePositions = [35, 115, 205, 265];
    policePositions.forEach(function(px) {
        if (px < WW && lvl[WH - 3][px] === 0) lvl[WH - 3][px] = 13;
    });

    game.lvl = lvl;
}
