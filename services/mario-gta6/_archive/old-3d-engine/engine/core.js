// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// ENGINE: CORE
// Game loop, state machine, init, resize
// ═══════════════════════════════════════════════════════════════

function initCanvas() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
}

function resizeCanvas() {
    var container = canvas.parentElement;
    var cw = container.clientWidth, ch = container.clientHeight;
    if (cw / ch > 16 / 9) {
        H = ch; W = Math.floor(ch * 16 / 9);
    } else {
        W = cw; H = Math.floor(cw / (16 / 9));
    }
    canvas.width = W; canvas.height = H;
}

function initGame() {
    game = {
        lvl: null, particles: [], enemies: [], fireballs: [], scorePopups: [],
        coins: 0, score: 0, time: 400, lives: 3,
        px: 3 * TILE, py: (WH - 3) * TILE, pvx: 0, pvy: 0, pDir: 1, pMode: 0, pOnFire: false,
        pInv: 0, pStar: 0, pAir: true, pJmp: false, pSqY: 1.0, pSqX: 1.0,
        pCoyote: 0, pJbuf: 0, pJhold: 0, pWasG: true, pAnim: 0,
        pOnCar: false, pCar: null, cars: [], cam: 0, camShake: 0,
        combo: 0, comboTimer: 0, titleTimer: 0, levelComplete: false,
        hat: 'plumber', hatSwitchCD: 0, hatFlash: 0, hatLockedMsg: '', hatLockedT: 0,
        pXp: 0, pXpNext: 100, pLevel: 1,
        dXp: 0, dXpNext: 100, dLevel: 1, wanted: 0, fuel: 100,
        driftChain: 0, lastDriftT: 0
    };
    buildLevel();
    spawnEnemies();
    spawnCars();
    spawnPowerupBlocks();
    if (typeof applySavedWallet === 'function') applySavedWallet();
    if (typeof syncRewardWidget === 'function') syncRewardWidget();
    // V1.8.0: prime the WASM physics map with the freshly built level
    if (typeof WASM !== 'undefined' && WASM.ready && typeof syncMapToWasm === 'function') {
        syncMapToWasm(game.lvl);
    }
}

function switchHat() {
    if (!game || game.hatSwitchCD > 0) return;
    if (game.pOnCar) {
        game.hatLockedMsg = 'Exit car first (F)';
        game.hatLockedT = 1.6;
        return;
    }
    game.hat = (game.hat === 'plumber') ? 'driver' : 'plumber';
    game.hatSwitchCD = 0.5;
    game.hatFlash = 0.4;
    if (typeof SFX !== 'undefined' && SFX.hat) SFX.hat();
    if (typeof shakeCamera === 'function') shakeCamera(2);
    if (typeof addCredits === 'function') addCredits(0, ''); // ensure widget syncs (no-op)
    if (typeof syncRewardWidget === 'function') syncRewardWidget();
}

function gameLoop(ts) {
    if (!lastTime) lastTime = ts;
    var rawDt = (ts - lastTime) / 1000;
    var dt = Math.min(rawDt, 0.05);
    lastTime = ts;

    resizeCanvas();

    if (STATE === 'TITLE') {
        if (!game) initGame();
        game.titleTimer += dt;
        drawTitle();
        if ((isKey('Enter') && consumeKey('Enter')) || touchState.jump) {
            initAudio();
            SFX.start();
            initGame();
            STATE = 'PLAYING';
            startBGM();
            document.body.classList.add('game-mode');
        }
    } else if (STATE === 'PLAYING') {
        if (isKey('Escape') && consumeKey('Escape')) {
            STATE = 'PAUSED';
            stopBGM();
            document.body.classList.remove('game-mode');
        }
        if (isAction('hat') && consumeKey(actionKey('hat', 'h'))) switchHat();
        if (game.hatSwitchCD > 0) game.hatSwitchCD -= dt;
        if (game.hatFlash > 0) game.hatFlash -= dt;
        if (game.hatLockedT > 0) game.hatLockedT -= dt;
        if (typeof updateCinematic === 'function') updateCinematic(dt);
        game.pAnim += dt;
        updatePhysics(dt);
        draw();
        if (typeof Car3D !== 'undefined' && Car3D.active) {
            Car3D.update(dt);
            Car3D.render();
        }
        drawTouchControls();
    } else if (STATE === 'RACING') {
        // ═══ RACING MODE ═══
        if (game.racingLoading) {
            // Still loading Three.js
            draw();
        } else if (!RacingMode.active) {
            STATE = 'PLAYING';
        } else if (RacingMode.countdownActive) {
            // ── COUNTDOWN PHASE ──
            // Render 3D scene but don't accept driving input
            RacingMode.countdownTimer += dt;
            RacingMode.updateCamera();
            if (typeof RacingAudio !== 'undefined') RacingAudio.update();
            RacingMode.render();
            if (typeof RacingHUD !== 'undefined') RacingHUD.render();

            // Draw countdown overlay
            if (typeof RacingHUD !== 'undefined' && RacingHUD.ctx) {
                var ctx = RacingHUD.ctx;
                var w = RacingHUD.canvas.width;
                var h = RacingHUD.canvas.height;
                var elapsed = RacingMode.countdownTimer;
                var value = Math.ceil(3 - elapsed);
                if (value !== RacingMode.countdownValue && value >= 0) {
                    RacingMode.countdownValue = value;
                    if (typeof RacingAudio !== 'undefined') {
                        RacingAudio.playCountdownBeep(value === 0 ? 880 : 440, 0.15);
                    }
                }
                if (value <= 0) {
                    RacingMode.countdownActive = false;
                } else {
                    // Draw big number
                    ctx.save();
                    ctx.font = 'bold 120px "Courier New", monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = value === 1 ? '#ff4444' : '#00ffff';
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.shadowBlur = 30;
                    ctx.fillText(value.toString(), w / 2, h / 2);
                    ctx.shadowBlur = 0;
                    ctx.font = '16px "Courier New", monospace';
                    ctx.fillStyle = 'rgba(255,255,255,0.5)';
                    ctx.fillText('GET READY', w / 2, h / 2 + 80);
                    ctx.restore();
                }
            }

            clearJustPressed();
        } else {
            // ── ACTIVE DRIVING PHASE ──
            // Update racing physics
            RacingMode.updatePhysics(dt);
            RacingMode.updateCarTransform(dt);
            RacingMode.updateCamera();

            // Update subsystems
            if (typeof RacingAudio !== 'undefined') RacingAudio.update();
            if (typeof RacingParticles !== 'undefined') RacingParticles.update(dt);
            if (typeof RacingOpponents !== 'undefined') RacingOpponents.update(dt);

            // Render 3D scene
            RacingMode.render();

            // Render HUD overlay
            if (typeof RacingHUD !== 'undefined') RacingHUD.render();

            // Check for exit
            if (isAction('car') && consumeKey(actionKey('car', 'f'))) {
                RacingMode.exit();
                game.pOnCar = false;
                document.body.classList.remove('game-mode');
                if (RacingMode.exitX) {
                    game.px = RacingMode.exitX;
                }
                game.pCar = null;
                STATE = 'PLAYING';
            }

            // Camera cycle
            if (isKey('c') && consumeKey('c')) {
                RacingMode.cycleCamera();
            }

            clearJustPressed();
        }
    } else if (STATE === 'PAUSED') {
        draw();
        drawPause();
        if (isKey('Escape') && consumeKey('Escape')) {
            STATE = 'PLAYING';
            startBGM();
        }
    } else if (STATE === 'GAMEOVER') {
        drawGameOver();
        document.body.classList.remove('game-mode');
        if (isKey('Enter') && consumeKey('Enter')) {
            initGame();
            STATE = 'PLAYING';
            SFX.start();
            startBGM();
        }
    }

    if (STATE === 'RACING') {
        if (!game.racingLoading) {
            clearJustPressed();
        }
    } else {
        clearJustPressed();
    }
    requestAnimationFrame(gameLoop);
}

var lastTime = 0;

function start() {
    initCanvas();
    initInput();
    initAudio();
    initSprites();
    if (typeof SettingsUI !== 'undefined' && SettingsUI.init) SettingsUI.init();
    requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════════════════════════════
// RACING MODE — Enter/Exit helpers
// Called from physics.js when player presses F near a car
// ═══════════════════════════════════════════════════════════════

async function enterRacingMode(carEntity) {
    if (RacingMode.active) return;
    game.pOnCar = true;
    game.pCar = carEntity;
    if (typeof awardDriverXP === 'function') awardDriverXP(10, 'enter car');
    // Set loading flag so game loop doesn't flip back to PLAYING
    game.racingLoading = true;
    await RacingMode.enter(carEntity);
    // Only set RACING after Three.js scene is fully ready
    STATE = 'RACING';
    game.racingLoading = false;
}
