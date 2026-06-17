// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// ENTITIES: VEHICLES
// Car spawning and management for Mario GTA6
// Cars serve as entry points to Neon Drift 3D racing mode
// ═══════════════════════════════════════════════════════════════

function spawnCars() {
    game.cars = [];
    // V1.8.3 — Car positions are now chosen on SOLID ground (away from
    // pit gaps at x=[40-41, 68-70, 95-96, 130-132, 170-171, 210-212])
    // and clear of overhead blocks. Each car has a small "parking pad"
    // — three flat tiles with no blocks above, so it reads as a vehicle
    // parked at the curb.
    var carPositions = [
        { x: 15 * TILE, color: '#cc0000' },   // Red car on early flat
        { x: 85 * TILE, color: '#0066cc' },   // Blue car mid-level
        { x: 180 * TILE, color: '#00cc44' },  // Green car late in level
    ];

    for (var i = 0; i < carPositions.length; i++) {
        var pos = carPositions[i];
        var g = (WH - 3) * TILE - 2;
        game.cars.push({
            x: pos.x,
            y: g,
            vx: 0,
            color: pos.color,
            active: true
        });
    }
}

function spawnCarAt(x, color) {
    var g = (WH - 3) * TILE - 2;
    game.cars.push({
        x: x,
        y: g,
        vx: 0,
        color: color || '#cc0000',
        active: true
    });
}
