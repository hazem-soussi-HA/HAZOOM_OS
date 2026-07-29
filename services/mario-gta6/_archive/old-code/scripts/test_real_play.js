#!/usr/bin/env node
// Real game test: run for 5s, capture frames, check stomp events
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.text().includes('WASM')) console.log('  ', m.text()); });

    await page.goto('http://localhost:8080/website/index.html?nocache=' + Date.now(), { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.waitForFunction(() => WASM && WASM.ready, { timeout: 5000 });
    await page.evaluate(() => {
        STATE = 'PLAYING';
        if (!game) initGame();
        // Wrap stepWasm to count events
        window._events = [];
        const orig = window.stepWasm;
        window.stepWasm = function() {
            const evs = orig.call(this);
            if (evs && evs.length) window._events.push(...evs);
            return evs;
        };
    });
    await page.waitForTimeout(500);

    // Start playing
    await page.keyboard.down('ArrowRight');
    await page.keyboard.press(' ');
    await page.waitForTimeout(3000);
    await page.keyboard.up('ArrowRight');

    const r = await page.evaluate(() => {
        const types = {};
        for (const e of window._events) {
            types[e.type] = (types[e.type] || 0) + 1;
        }
        return {
            eventCount: window._events.length,
            types,
            score: game.score,
            coins: game.coins,
            lives: game.lives,
            enemies: game.enemies.length,
            px: game.px,
        };
    });
    console.log('3s of gameplay:');
    console.log(' ', JSON.stringify(r, null, 2).split('\n').join('\n  '));

    if (errors.length) {
        console.error('Errors:');
        errors.forEach(e => console.error('  ' + e));
    }
    await page.screenshot({ path: '/tmp/v18_real_play.png' });
    await browser.close();
})();
