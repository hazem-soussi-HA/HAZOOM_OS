#!/usr/bin/env node
// Verify WASM is being used during gameplay
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://localhost:8080/website/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Wrap physicsStepWasm to count calls
    await page.evaluate(() => {
        window._wasmCallCount = 0;
        window._jsEnemyCount = 0;
        const orig = window.physicsStepWasm;
        if (orig) {
            window.physicsStepWasm = function(dt) {
                window._wasmCallCount++;
                return orig.call(this, dt);
            };
        }
        const orig2 = window.updateEnemies;
        if (orig2) {
            window.updateEnemies = function(dt) {
                window._jsEnemyCount++;
                return orig2.call(this, dt);
            };
        }
    });

    await page.evaluate(() => { STATE = 'PLAYING'; if (!game) initGame(); });
    await page.waitForTimeout(2000);

    const counts = await page.evaluate(() => ({
        wasmCalls: window._wasmCallCount,
        jsEnemyCalls: window._jsEnemyCount,
        wasmReady: WASM.ready,
        usingWasm: window._wasmCallCount > window._jsEnemyCalls,
    }));
    console.log('Counts after 2s of gameplay:');
    console.log(' ', JSON.stringify(counts, null, 2).split('\n').join('\n  '));

    if (!counts.usingWasm) {
        console.error('WASM path not active in the real game loop!');
        process.exit(1);
    }
    console.log('✓ WASM physics hot path is active');
    await browser.close();
})();
