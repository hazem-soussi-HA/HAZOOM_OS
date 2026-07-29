#!/usr/bin/env node
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => console.error('PAGEERR:', e));
    page.on('console', m => {
        if (m.text().includes('WASM ev') || m.text().includes('STOMP')) {
            console.log(' ', m.text());
        }
    });
    await page.goto('http://localhost:8080/website/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { window._WASM_DEBUG = true; STATE = 'PLAYING'; if (!game) initGame(); });
    await page.waitForTimeout(200);

    // Wait for WASM ready
    await page.waitForFunction(() => WASM && WASM.ready, { timeout: 5000 });

    // Place player right above a goomba
    await page.evaluate(() => {
        const g = game.enemies.find(e => e.type === 'goomba');
        if (!g) return;
        game.px = g.x;
        game.py = g.y - TILE;
        game.pvy = 200;  // moving down
    });
    console.log('Setup: player placed above goomba, pvy=200');

    // Wait a few frames for collision
    await page.waitForTimeout(300);

    const r = await page.evaluate(() => ({
        score: game.score,
        combo: game.combo,
        lives: game.lives,
        firstGoombaHp: game.enemies[0]?.hp,
    }));
    console.log('Result:', JSON.stringify(r));

    await browser.close();
})();
