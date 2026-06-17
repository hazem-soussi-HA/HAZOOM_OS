// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// ENGINE: CONSTANTS
// All game constants in one place (like Python module-level vars)
// ═══════════════════════════════════════════════════════════════

var TILE = 48;
var WW = 300, WH = 16;

// Physics
var GRAV = 2200, JVEL = -680, SHOP = -420, MFALL = 900;
var WALK = 220, RUN = 380;
var AG = 35, AY = 22, DG = 28, DA = 15;
var JBUF = 0.12, JHOLD = 0.15, COYOTE = 0.10;
var FIREBALL_SPEED = 400;

// Colors
var SKY = [92, 148, 252];
var RED = "#c81e1e", SKN = "#f8b878", BRN = "#804000", BLU = "#1e3cc8";
var GRN = "#00a800", YLW = "#ffdc00", GRD = "#c84c0c", BRC = "#b82818";
var BLK2 = "#e4a020", GOM = "#a46424", WHT = "#ffffff", BLK = "#000000";
var PIP = "#00a800", PI2 = "#007800", PIL = "#64dc64";
var KOOPA_GREEN = "#2d8a4e", KOOPA_DARK = "#1a5c30", KOOPA_SKIN = "#f8d878";
var STAR_YLW = "#ffe040";

// Game state
var STATE = 'TITLE';

// Canvas
var canvas, ctx, W, H;

// Game object (the "self" of our engine)
var game = null;

// Touch state
var touchState = { left: false, right: false, jump: false, run: false, fire: false };

// ═══════════════════════════════════════════════════════════════
// RACING MODE CONSTANTS (from Neon Drift)
// ═══════════════════════════════════════════════════════════════

// Racing physics
var RACING_PHYS = {
    mass: 1350,           // kg
    enginePower: 650,     // HP
    maxRpm: 9000,
    idleRpm: 800,
    brakeTorque: 18000,   // Nm
    dragCoeff: 0.32,
    frontalArea: 2.1,     // m²
    downforceCoeff: 0.45,
    tireGrip: 1.05,
    weightDistFront: 0.48,
    aeroFront: 0.32,
    aeroRear: 0.38,
    maxSpeed: 480,        // km/h
    gearRatios: [3.5, 2.3, 1.7, 1.3, 1.05, 0.85],
    finalDrive: 3.2,
    wheelRadius: 0.33,    // m
    shiftTime: 0.3        // seconds
};

var AIR_DENSITY = 1.225;

var NITRO_MAX = 100;
var NITRO_REGEN_RATE = 0.3;
var NITRO_CONSUME_RATE = 1.2;
var NITRO_BOOST = 5;

// Racing camera views
var CAM_VIEWS = ['chase', 'cockpit', 'hood', 'bumper'];
var CAM_LABELS = { chase: 'CHASE CAM', cockpit: 'COCKPIT CAM', hood: 'HOOD CAM', bumper: 'BUMPER CAM' };

// Racing key bindings (extend input.js)
var RACING_KEYS = {
    accelerate: ['ArrowUp', 'w', 'W'],
    brake:      ['ArrowDown', 's', 'S'],
    left:       ['ArrowLeft', 'a', 'A'],
    right:      ['ArrowRight', 'd', 'D'],
    nitro:      [' '],
    camera:     ['c', 'C'],
    escape:     ['Escape']
};

// Three.js: vendored at js/vendor/three.min.js — exposes window.THREE
var THREE_LOADING = false;
