// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// SYSTEMS: SAVE
// LocalStorage save/load with credits currency
// ═══════════════════════════════════════════════════════════════

var SAVE_KEY = 'mario_gta6_save';

function saveGame() {
    if (!game) return;
    var data = {
        score: game.score,
        coins: game.coins,
        credits: game.credits || 0,
        totalCreditsEarned: game.totalCreditsEarned || 0,
        highScore: Math.max(game.score, (loadGame() || {}).highScore || 0),
        lives: game.lives,
        time: game.time,
        pMode: game.pMode,
        level: currentLevel || 1
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch(e) {}
    if (typeof updateCreditsWidget === 'function') updateCreditsWidget();
    if (typeof updateHighScoreWidget === 'function') updateHighScoreWidget();
}

function loadGame() {
    try {
        var raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch(e) { return null; }
}

function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
    if (typeof updateCreditsWidget === 'function') updateCreditsWidget();
    if (typeof updateHighScoreWidget === 'function') updateHighScoreWidget();
}

var currentLevel = 1;
