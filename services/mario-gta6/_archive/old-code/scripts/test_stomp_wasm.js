#!/usr/bin/env node
// Stomp a goomba to verify WASM events flow correctly
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://localhost:8080/website/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { STATE = 'PLAYING'; if (!game) initGame(); });
    await page.waitForTimeout(300);

    // Position player near a goomba and stomp it
    const setup = await page.evaluate(() => {
        // Move player next to first goomba
        if (game.enemies.length > 0) {
            const g = game.enemies[0];
            game.px = g.x - 30;
            game.py = (WH - 3) * TILE - 2;
            game.pvy = 0;
            return { enemyX: g.x, type: g.type, hp: g.hp };
        }
        return null;
    });
    console.log('Setup:', JSON.stringify(setup));

    // Now jump on it
    await page.keyboard.down('ArrowRight');
    await page.keyboard.press(' ');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');

    const result = await page.evaluate(() => {
        const alive = game.enemies.filter(e => e.hp > 0).length;
        const dead = game.enemies.filter(e => e.hp <= 0).length;
        return { alive, dead, score: game.score, particles: game.particles.length };
    });
    console.log('After stomp:', JSON.stringify(result));

    await page.screenshot({ path: '/tmp/v18_stomp.png' });
    if (errors.length) {
        console.error('Errors:', errors);
        process.exit(1);
    }
    console.log('No errors. WASM stomp events flowed correctly.');
    await browser.close();
})();
