#!/usr/bin/env node
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    // Disable cache
    await ctx.route('**/*', route => route.continue());
    const page = await ctx.newPage();
    page.on('pageerror', e => console.error('PAGEERR:', e));
    await page.goto('http://localhost:8080/website/index.html?nocache=' + Date.now(), { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.waitForFunction(() => WASM && WASM.ready, { timeout: 5000 });
    await page.evaluate(() => { STATE = 'PLAYING'; if (!game) initGame(); });
    await page.waitForTimeout(200);

    // Now do the test
    const r = await page.evaluate(() => {
        const g = game.enemies.find(e => e.type === 'goomba' && e.hp > 0);
        if (g) {
            g.vx = 0;
            game.px = g.x;
            game.py = g.y - 20;
            game.pvy = 250;
        }
        syncEnemiesToWasm(game.enemies);
        syncPlayerToWasm(game);
        WASM.inputF32[4] = 0.016;
        // Verify dt is set
        const dt = WASM.mem.getFloat32(4096 + 16, true);
        // Now call step
        const n = WASM.exports.step();
        // Read after
        const after = {
            n,
            shellVx: WASM.enemiesF32[0 * 8 + 6],
            t: WASM.enemiesF32[0 * 8 + 4],
            x: WASM.enemiesF32[0 * 8 + 0],
            rawBytes: new Uint8Array(WASM.memory.buffer).slice(20504, 20508),
        };
        return { dt, after };
    });
    console.log('Result:', JSON.stringify(r, null, 2));
    await browser.close();
})();
