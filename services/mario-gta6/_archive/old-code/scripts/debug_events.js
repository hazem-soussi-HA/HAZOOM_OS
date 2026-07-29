#!/usr/bin/env node
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    page.on('console', m => {
        if (m.text().includes('WASM') || m.text().includes('event') || m.text().includes('ev')) {
            console.log(' ', m.text());
        }
    });
    await page.goto('http://localhost:8080/website/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
        window._WASM_DEBUG = true;
        window._calls = 0;
        window._events = [];
        const orig = window.physicsStepWasm;
        if (orig) {
            window.physicsStepWasm = function(dt) {
                window._calls++;
                const evs = orig.call(this, dt);
                if (evs && evs.length) window._events.push(...evs);
                return evs;
            };
        }
    });
    await page.evaluate(() => { STATE = 'PLAYING'; if (!game) initGame(); });
    await page.waitForTimeout(200);

    // Wait for WASM ready
    await page.waitForFunction(() => WASM && WASM.ready, { timeout: 5000 });
    console.log('WASM ready');

    // Force player to stomp a goomba directly
    await page.evaluate(() => {
        // Find nearest goomba and put player right on top
        const g = game.enemies.find(e => e.type === 'goomba' && e.hp > 0);
        if (g) {
            game.px = g.x;
            game.py = g.y - 20;  // within 0.8 * TILE
            game.pvy = 250;  // moving down
        }
    });
    await page.waitForTimeout(100);

    const r1 = await page.evaluate(() => ({
        calls: window._calls,
        events: window._events.slice(0, 5),
        score: game.score,
        lives: game.lives,
    }));
    console.log('After 100ms:', JSON.stringify(r1, null, 2));

    // Let it run 1s more
    await page.waitForTimeout(1000);
    const r2 = await page.evaluate(() => ({
        calls: window._calls,
        eventCount: window._events.length,
        lastEvents: window._events.slice(-5),
        score: game.score,
        lives: game.lives,
    }));
    console.log('After 1s more:', JSON.stringify(r2, null, 2));

    if (errs.length) {
        console.error('Errors:', errs);
    }
    await browser.close();
})();
