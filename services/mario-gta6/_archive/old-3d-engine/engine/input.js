// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// ENGINE: INPUT
// Keyboard, touch, gamepad input handling
// ═══════════════════════════════════════════════════════════════

var keys = {};
var justPressed = {};

function initInput() {
    window.addEventListener('keydown', function(e) {
        var block = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Tab'];
        if (block.indexOf(e.key) >= 0) e.preventDefault();
        if (!keys[e.key]) justPressed[e.key] = true;
        keys[e.key] = true;
    });
    window.addEventListener('keyup', function(e) {
        keys[e.key] = false;
    });

    // Touch
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchState.left = false; touchState.right = false;
        touchState.jump = false; touchState.fire = false;
    }, { passive: false });
}

function isKey(key) { return keys[key] || false; }

// Check if any key bound to this action is currently held.
// Reads from Settings.keyBindings (loadSettings populates it).
function isAction(action) {
    if (typeof Settings === 'undefined' || !Settings.keyBindings) return false;
    var bindings = Settings.keyBindings[action];
    if (!bindings) return false;
    for (var i = 0; i < bindings.length; i++) {
        if (keys[bindings[i]]) return true;
    }
    return false;
}

// Return the first key bound to this action, or the given fallback.
function actionKey(action, fallback) {
    if (typeof Settings !== 'undefined' && Settings.keyBindings && Settings.keyBindings[action]) {
        return Settings.keyBindings[action][0] || fallback;
    }
    return fallback;
}

function consumeKey(key) {
    if (justPressed[key]) { justPressed[key] = false; return true; }
    return false;
}

function clearJustPressed() {
    for (var k in justPressed) delete justPressed[k];
}

function handleTouch(e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    touchState.left = false; touchState.right = false;
    touchState.jump = false; touchState.fire = false;
    for (var i = 0; i < e.touches.length; i++) {
        var t = e.touches[i];
        var tx = (t.clientX - rect.left) / rect.width * W;
        var ty = (t.clientY - rect.top) / rect.height * H;
        if (tx < W * 0.25 && ty > H * 0.5) touchState.left = true;
        if (tx > W * 0.25 && tx < W * 0.5 && ty > H * 0.5) touchState.right = true;
        if (tx > W * 0.7 && ty > H * 0.5) touchState.jump = true;
        if (tx > W * 0.5 && tx < W * 0.7 && ty > H * 0.5) touchState.fire = true;
    }
}
