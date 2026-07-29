// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// ENGINE: AUDIO
// Sound synthesis, BGM, mixer — all procedural
// ═══════════════════════════════════════════════════════════════

var AudioCtx = window.AudioContext || window.webkitAudioContext;
var audioCtx = null, audioEnabled = false;
var bgmInterval = null, bgmPlaying = false, bgmStep = 0;

function initAudio() {
    if (!audioCtx) { audioCtx = new AudioCtx(); audioEnabled = true; }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, dur, type, vol) {
    if (!audioEnabled || !audioCtx) return;
    try {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = type || 'square';
        o.frequency.setValueAtTime(freq, audioCtx.currentTime);
        g.gain.setValueAtTime(vol || 0.08, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(audioCtx.currentTime);
        o.stop(audioCtx.currentTime + dur);
    } catch(e) {}
}

function playNotes(notes, tempo) {
    if (!audioEnabled) return;
    notes.forEach(function(n, i) {
        setTimeout(function() {
            if (n.f) playTone(n.f, n.d || 0.1, n.type || 'square', n.v || 0.04);
        }, i * tempo);
    });
}

var SFX = {
    jump: function() { playTone(400, 0.12, 'square', 0.06); setTimeout(function() { playTone(600, 0.08, 'square', 0.04); }, 40); },
    coin: function() { playTone(988, 0.08, 'square', 0.05); setTimeout(function() { playTone(1319, 0.15, 'square', 0.05); }, 80); },
    stomp: function() { playTone(523, 0.08, 'sine', 0.05); setTimeout(function() { playTone(659, 0.08, 'sine', 0.04); }, 40); },
    koopaStomp: function() { playTone(440, 0.1, 'sine', 0.05); setTimeout(function() { playTone(523, 0.08, 'sine', 0.04); }, 50); },
    shellKick: function() { playTone(330, 0.06, 'sine', 0.04); playTone(440, 0.06, 'sine', 0.04); },
    shellBounce: function() { playTone(220, 0.05, 'sine', 0.03); setTimeout(function() { playTone(330, 0.05, 'sine', 0.03); }, 30); },
    mushroom: function() { playNotes([{ f: 262 }, { f: 330 }, { f: 392 }, { f: 523 }], 80); },
    fireball: function() { playTone(600, 0.05, 'triangle', 0.04); playTone(400, 0.05, 'triangle', 0.03); },
    star: function() { var f = 523; [0,1,2,3,4,5,6,7].forEach(function(i) { setTimeout(function() { playTone(f + i * 40, 0.08, 'square', 0.03); }, i * 50); }); },
    die: function() { playNotes([{ f: 523 }, { f: 494 }, { f: 440 }, { f: 392 }, { f: 349 }, { f: 330 }, { f: 262 }], 180); },
    hurt: function() { playTone(330, 0.08, 'sine', 0.04); playTone(262, 0.1, 'sine', 0.03); },
    breakBrick: function() { playTone(523, 0.08, 'sine', 0.04); },
    combo: function(v) { playTone(600 + v * 50, 0.05, 'square', 0.03); },
    start: function() { playNotes([{ f: 523 }, { f: 659 }, { f: 784 }, { f: 1047 }], 100); },
    enterCar: function() { playTone(300, 0.1, 'triangle', 0.05); setTimeout(function() { playTone(200, 0.15, 'triangle', 0.06); }, 80); playTone(500, 0.08, 'triangle', 0.03); },
    exitCar: function() { playTone(400, 0.06, 'triangle', 0.04); setTimeout(function() { playTone(250, 0.12, 'triangle', 0.05); }, 60); playTone(180, 0.1, 'triangle', 0.03); },
    powerDown: function() { playNotes([{ f: 400 }, { f: 300 }, { f: 200 }], 100); },
    hat: function() { playNotes([{ f: 660 }, { f: 880 }, { f: 1100 }], 60); },
    level: function() { playNotes([{ f: 523 }, { f: 659 }, { f: 784 }, { f: 1047 }, { f: 1319 }, { f: 1568 }, { f: 1319 }], 80); },
    recruit: function() { playNotes([{ f: 523, d: 0.08, type: 'sine' }, { f: 659, d: 0.08, type: 'sine' }, { f: 784, d: 0.12, type: 'sine' }, { f: 1047, d: 0.18, type: 'sine' }], 50); },
    recruitBye: function() { playNotes([{ f: 784, d: 0.08, type: 'sine' }, { f: 659, d: 0.08, type: 'sine' }, { f: 523, d: 0.12, type: 'sine' }], 70); },
    policeSiren: function(freq, vol) {
        try {
            if (!audioEnabled || !audioCtx) return;
            var o = audioCtx.createOscillator();
            var g = audioCtx.createGain();
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(freq || 750, audioCtx.currentTime);
            g.gain.setValueAtTime(vol || 0.06, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            o.connect(g);
            g.connect(audioCtx.destination);
            o.start(audioCtx.currentTime);
            o.stop(audioCtx.currentTime + 0.3);
        } catch(e) {}
    },
    policeSirenFast: function() {
        playTone(700, 0.15, 'sawtooth', 0.04);
        setTimeout(function() { playTone(900, 0.15, 'sawtooth', 0.04); }, 150);
    },
    levelComplete: function() {
        var notes = [
            { f: 523, d: 0.1 }, { f: 523, d: 0.1 }, { f: 523, d: 0.1 }, { f: 523, d: 0.3 },
            { f: 415, d: 0.1 }, { f: 466, d: 0.1 }, { f: 523, d: 0.2 },
            { f: 466, d: 0.1 }, { f: 523, d: 0.4 }
        ];
        playNotes(notes, 80);
    }
};

var bgmMelody = [
    // Section A — main theme (variation 1)
    { f: 659, d: 0.12 }, { f: 659, d: 0.12 }, { f: 0, d: 0.12 }, { f: 659, d: 0.12 }, { f: 0, d: 0.12 }, { f: 523, d: 0.12 }, { f: 659, d: 0.24 },
    { f: 784, d: 0.24 }, { f: 0, d: 0.24 }, { f: 392, d: 0.24 }, { f: 0, d: 0.12 }, { f: 523, d: 0.24 }, { f: 0, d: 0.12 }, { f: 392, d: 0.24 }, { f: 0, d: 0.12 }, { f: 330, d: 0.24 },
    // Section B — bridge with chord changes
    { f: 440, d: 0.12 }, { f: 494, d: 0.12 }, { f: 466, d: 0.12 }, { f: 440, d: 0.12 }, { f: 392, d: 0.18 }, { f: 659, d: 0.18 }, { f: 784, d: 0.18 }, { f: 880, d: 0.18 },
    { f: 698, d: 0.12 }, { f: 784, d: 0.12 }, { f: 0, d: 0.12 }, { f: 659, d: 0.12 }, { f: 0, d: 0.12 }, { f: 523, d: 0.12 }, { f: 587, d: 0.12 }, { f: 494, d: 0.12 },
    // Section A' — main theme (variation 2, higher energy)
    { f: 523, d: 0.24 }, { f: 0, d: 0.12 }, { f: 392, d: 0.24 }, { f: 0, d: 0.12 }, { f: 330, d: 0.24 }, { f: 0, d: 0.12 }, { f: 440, d: 0.24 },
    { f: 494, d: 0.12 }, { f: 466, d: 0.12 }, { f: 440, d: 0.12 }, { f: 392, d: 0.18 }, { f: 659, d: 0.18 }, { f: 784, d: 0.18 }, { f: 880, d: 0.18 },
    { f: 698, d: 0.12 }, { f: 784, d: 0.12 }, { f: 0, d: 0.12 }, { f: 659, d: 0.12 }, { f: 0, d: 0.12 }, { f: 523, d: 0.12 }, { f: 587, d: 0.12 }, { f: 494, d: 0.12 },
    // Section C — new melodic phrase with chord progression feel
    { f: 523, d: 0.18 }, { f: 587, d: 0.12 }, { f: 659, d: 0.24 }, { f: 523, d: 0.12 }, { f: 659, d: 0.12 }, { f: 784, d: 0.36 },
    { f: 784, d: 0.12 }, { f: 698, d: 0.12 }, { f: 659, d: 0.12 }, { f: 587, d: 0.12 }, { f: 523, d: 0.24 }, { f: 494, d: 0.12 }, { f: 440, d: 0.24 },
    // Section D — resolution back to tonic
    { f: 392, d: 0.18 }, { f: 440, d: 0.12 }, { f: 494, d: 0.18 }, { f: 523, d: 0.24 }, { f: 587, d: 0.12 }, { f: 659, d: 0.36 },
    { f: 523, d: 0.12 }, { f: 587, d: 0.12 }, { f: 659, d: 0.12 }, { f: 784, d: 0.12 }, { f: 880, d: 0.24 }, { f: 784, d: 0.12 }, { f: 659, d: 0.24 }
];

var bgmChordProgression = [
    [262, 330, 392],  // C major
    [220, 262, 330],  // A minor
    [294, 370, 440],  // D major
    [196, 247, 294],  // G major
    [262, 330, 392],  // C major
    [220, 262, 330],  // A minor
    [294, 370, 440],  // D major
    [196, 247, 294]   // G major
];

function startBGM() {
    if (bgmPlaying) return; bgmPlaying = true; bgmStep = 0;
    bgmInterval = setInterval(function() {
        if (!audioEnabled || !audioCtx) return;
        var n = bgmMelody[bgmStep % bgmMelody.length];
        if (n.f) {
            var oscType = (bgmStep % 16 < 8) ? 'square' : 'triangle';
            playTone(n.f, n.d * 0.9, oscType, 0.025);
        }
        var chordIdx = Math.floor(bgmStep / 4) % bgmChordProgression.length;
        var chord = bgmChordProgression[chordIdx];
        if (bgmStep % 2 === 0) {
            playTone(chord[0], n.d * 0.9, 'triangle', 0.018);
            if (bgmStep % 4 === 0) {
                playTone(chord[1], n.d * 0.7, 'sine', 0.012);
            }
        }
        if (bgmStep % 8 === 0 && chord) {
            playTone(chord[2], n.d * 0.5, 'sine', 0.008);
        }
        if (game && game.wanted > 0 && bgmStep % 3 === 0) {
            var tensionNote = 110 + game.wanted * 20;
            playTone(tensionNote, n.d * 0.3, 'sawtooth', 0.006);
        }
        bgmStep++;
    }, 125);
}

function stopBGM() {
    if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
    bgmPlaying = false;
}
