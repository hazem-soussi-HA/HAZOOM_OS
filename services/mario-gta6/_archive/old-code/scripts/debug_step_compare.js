#!/usr/bin/env node
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => console.error('PAGEERR:', e));
    await page.goto('http://localhost:8080/website/index.html?nocache=' + Date.now(), { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => WASM && WASM.ready, { timeout: 5000 });

    // Run a single step and check event count via WASM
    const r = await page.evaluate(() => {
        // Reset state
        syncEnemiesToWasm(game.enemies);
        syncPlayerToWasm(game);
        WASM.inputF32[4] = 0.016;
        // Check event count before
        const before = WASM.eventCountU32[0];
        // Run step
        const ret = WASM.exports.step();
        // Check event count after (raw WASM memory)
        const afterRaw = WASM.eventCountU32[0];
        // Check enemy 0 state
        const e0 = {
            x: WASM.enemiesF32[0],
            y: WASM.enemiesF32[1],
            t: WASM.enemiesF32[4],
            hp: (WASM.enemiesBytes[20] << 24) >> 24,
        };
        return { before, afterRaw, ret, e0 };
    });
    console.log(JSON.stringify(r, null, 2));

    // Now also run with the JS path (force fallback)
    const r2 = await page.evaluate(() => {
        // Force JS path
        const orig = WASM.ready;
        WASM.ready = false;
        // Run a step
        const t0 = performance.now();
        updateEnemies(0.016);
        const t1 = performance.now();
        // Count dead enemies
        const dead = game.enemies.filter(e => e.hp <= 0).length;
        WASM.ready = orig;
        return { dead, tookMs: t1 - t0 };
    });
    console.log('JS path:', JSON.stringify(r2));

    await browser.close();
})();
