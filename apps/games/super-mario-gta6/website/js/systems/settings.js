// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// SYSTEMS: SETTINGS
// Configuration, key bindings
// ═══════════════════════════════════════════════════════════════

var Settings = {
    volume: 0.5,
    showFPS: false,
    showHitboxes: false,
    keyBindings: {
        left: ['ArrowLeft', 'a'],
        right: ['ArrowRight', 'd'],
        jump: [' ', 'w', 'ArrowUp'],
        run: ['Shift'],
        fire: ['e', 'x'],
        hat: ['h'],
        car: ['f'],
        camera: ['c'],
        pause: ['Escape']
    }
};

function loadSettings() {
    try {
        var raw = localStorage.getItem('mario_gta6_settings');
        if (raw) Object.assign(Settings, JSON.parse(raw));
    } catch(e) {}
}

function saveSettings() {
    try { localStorage.setItem('mario_gta6_settings', JSON.stringify(Settings)); } catch(e) {}
}
