// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// SYSTEMS: REWARDS
// Coins (in-run) + Credits (persistent premium currency)
// ═══════════════════════════════════════════════════════════════

var _lastCoinMilestone = 0;

function addCredits(n, reason) {
    if (!game) return;
    if (typeof n !== 'number' || n <= 0) return;
    game.credits = (game.credits || 0) + n;
    game.totalCreditsEarned = (game.totalCreditsEarned || 0) + n;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({
        credits: game.credits,
        totalCreditsEarned: game.totalCreditsEarned
    })); } catch(e) {}
    if (typeof addScorePopup === 'function') addScorePopup(game.px, game.py - TILE - 18, '+' + n + ' CR');
    if (typeof updateCreditsWidget === 'function') updateCreditsWidget(true);
    if (reason) console.log('[Rewards] +' + n + ' credits — ' + reason);
}

function checkCoinMilestone() {
    if (!game) return;
    var hundreds = Math.floor(game.coins / 100);
    if (hundreds > _lastCoinMilestone) {
        var gained = hundreds - _lastCoinMilestone;
        _lastCoinMilestone = hundreds;
        addCredits(gained, 'Coin milestone: ' + (hundreds * 100) + ' coins');
    }
}

function syncRewardWidget() {
    if (!game) return;
    try {
        var elC = document.getElementById('rw-credits-val');
        var elK = document.getElementById('rw-coins-val');
        var elS = document.getElementById('rw-score-val');
        if (elC) elC.textContent = game.credits || 0;
        if (elK) elK.textContent = game.coins || 0;
        if (elS) {
            var ls = loadGame();
            elS.textContent = ls && ls.highScore ? ls.highScore : (game.score || 0);
        }
    } catch(e) {}
}

function updateCreditsWidget(pulse) {
    var elC = document.getElementById('rw-credits-val');
    var pill = document.getElementById('rw-credits');
    if (elC && game) elC.textContent = game.credits || 0;
    if (pill && pulse) {
        pill.classList.remove('pulse');
        void pill.offsetWidth;
        pill.classList.add('pulse');
    }
}

function updateHighScoreWidget() {
    var elS = document.getElementById('rw-score-val');
    if (!elS) return;
    var ls = loadGame();
    elS.textContent = ls && ls.highScore ? ls.highScore : 0;
}

function awardPickupCredits(kind) {
    if (!game) return;
    switch (kind) {
        case 'mushroom': addCredits(2, 'Mushroom power-up'); break;
        case 'fire':     addCredits(3, 'Fire Flower power-up'); break;
        case 'star':     addCredits(5, 'Star power'); break;
        case 'koopa':    addCredits(1, 'Koopa stomp'); break;
        case 'combo5':   addCredits(2, 'x5 combo'); break;
        case 'combo10':  addCredits(5, 'x10 combo'); break;
    }
}

function applySavedWallet() {
    var ls = loadGame();
    if (!game) return;
    if (ls && typeof ls.credits === 'number') {
        game.credits = ls.credits;
        game.totalCreditsEarned = ls.totalCreditsEarned || ls.credits;
        _lastCoinMilestone = Math.floor((ls.coins || 0) / 100);
    } else {
        game.credits = 0;
        game.totalCreditsEarned = 0;
        _lastCoinMilestone = 0;
    }
}

// ═══════════════════════════════════════════════════════════════
// HAT XP — Two Hats progression
// Plumber XP: from coins, stomps, ? blocks, fire, star, mushrooms
// Driver XP: from time-in-car, drifts, near-misses, cars entered
// Both feed the same wallet; each level unlocks new verbs
// ═══════════════════════════════════════════════════════════════

function awardPlumberXP(n, reason) {
    if (!game) return;
    game.pXp = (game.pXp || 0) + n;
    while (game.pXp >= game.pXpNext) {
        game.pXp -= game.pXpNext;
        game.pLevel = (game.pLevel || 1) + 1;
        game.pXpNext = Math.floor(game.pXpNext * 1.35);
        if (typeof addCredits === 'function') addCredits(5, 'Plumber L' + game.pLevel);
        if (typeof SFX !== 'undefined' && SFX.level) SFX.level();
    }
    if (reason && typeof console !== 'undefined') console.log('[Plumber XP] +' + n + ' — ' + reason);
}

function awardDriverXP(n, reason) {
    if (!game) return;
    game.dXp = (game.dXp || 0) + n;
    while (game.dXp >= game.dXpNext) {
        game.dXp -= game.dXpNext;
        game.dLevel = (game.dLevel || 1) + 1;
        game.dXpNext = Math.floor(game.dXpNext * 1.35);
        if (typeof addCredits === 'function') addCredits(5, 'Driver L' + game.dLevel);
        if (typeof SFX !== 'undefined' && SFX.level) SFX.level();
    }
    if (reason && typeof console !== 'undefined') console.log('[Driver XP] +' + n + ' — ' + reason);
}

function getHat() { return game ? game.hat : 'plumber'; }
