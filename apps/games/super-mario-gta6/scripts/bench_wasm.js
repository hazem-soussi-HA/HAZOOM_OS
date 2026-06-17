#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
//
// V1.8.0 — Benchmark: Rust→WASM physics vs JS physics
// Headless Playwright that times both code paths.

const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();

    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

    await page.goto('http://localhost:8080/website/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Start game
    await page.evaluate(() => {
        window.STATE = 'PLAYING';
    });
    await page.waitForTimeout(200);

    // Check WASM loaded
    const wasmStatus = await page.evaluate(() => ({
        ready: WASM ? WASM.ready : null,
        failed: WASM ? WASM.failed : null,
        hasPhysicsWasm: typeof WASM !== 'undefined',
        hasStep: typeof stepWasm === 'function',
    }));
    console.log('WASM status:', JSON.stringify(wasmStatus));

    if (!wasmStatus.ready) {
        console.error('WASM did not load. Errors:', errors);
        await browser.close();
        process.exit(1);
    }

    // === Benchmark JS physics path ===
    // Force the JS fallback by toggling WASM.ready
    await page.evaluate(() => { WASM.ready = false; });
    const jsBench = await page.evaluate(() => {
        const N = 600; // 10 seconds at 60fps
        const t0 = performance.now();
        for (let i = 0; i < N; i++) {
            updateEnemies(0.016);
            updateFireballs(0.016);
            for (let c of game.cars) { c.x += c.vx * 0.016; if (c.x < 0 || c.x > 250 * 48) c.vx *= -1; }
            for (let p of game.particles) { p.x += p.vx * 0.016; p.y += p.vy * 0.016; p.vy += 2200 * 0.5 * 0.016; p.life -= 0.016; }
        }
        const t1 = performance.now();
        return { ms: t1 - t0, perFrame: (t1 - t0) / N };
    });
    console.log('JS  :', jsBench.ms.toFixed(2) + 'ms total,', jsBench.perFrame.toFixed(4) + 'ms/frame');

    // === Benchmark WASM physics path ===
    await page.evaluate(() => { WASM.ready = true; });
    const wasmBench = await page.evaluate(() => {
        const N = 600;
        const t0 = performance.now();
        for (let i = 0; i < N; i++) {
            physicsStepWasm(0.016);
        }
        const t1 = performance.now();
        return { ms: t1 - t0, perFrame: (t1 - t0) / N };
    });
    console.log('WASM:', wasmBench.ms.toFixed(2) + 'ms total,', wasmBench.perFrame.toFixed(4) + 'ms/frame');

    const speedup = jsBench.ms / wasmBench.ms;
    console.log(`Speedup: ${speedup.toFixed(2)}×`);

    // === Raw WASM benchmark (no JS bridge) ===
    const rawWasm = await page.evaluate(() => {
        const t0 = performance.now();
        const result = WASM.exports.benchmark(600);
        const t1 = performance.now();
        return { ms: t1 - t0, perFrame: (t1 - t0) / 600, events: result };
    });
    console.log('WASM (raw, no bridge):', rawWasm.ms.toFixed(2) + 'ms total,', rawWasm.perFrame.toFixed(4) + 'ms/frame,', rawWasm.events, 'events');

    // === Run in-game for 3s to verify nothing crashes ===
    await page.evaluate(() => {
        STATE = 'PLAYING';
        if (!game) initGame();
    });
    await page.waitForTimeout(3000);

    const final = await page.evaluate(() => ({
        state: STATE,
        px: game.px,
        py: game.py,
        enemies: game.enemies.length,
        particles: game.particles.length,
        coins: game.coins,
        score: game.score,
        lives: game.lives,
    }));
    console.log('After 3s:', JSON.stringify(final));

    await page.screenshot({ path: '/tmp/v18_wasm.png' });

    if (errors.length) {
        console.error('ERRORS:');
        errors.forEach(e => console.error('  ' + e));
    } else {
        console.log('No errors.');
    }

    await browser.close();

    // Exit with non-zero if WASM isn't faster OR if there are errors
    if (errors.length) process.exit(2);
    if (speedup < 1.0) {
        console.warn('WASM is slower than JS! Investigate.');
        process.exit(3);
    }
})();
