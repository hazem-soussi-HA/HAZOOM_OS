#!/usr/bin/env node
// Real game loop test with WASM physics
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error' || m.text().includes('WASM')) console.log('  ' + m.type() + ':', m.text()); });

    await page.goto('http://localhost:8080/website/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Start game
    await page.evaluate(() => { STATE = 'PLAYING'; if (!game) initGame(); });
    await page.waitForTimeout(500);

    // Hold right + jump for 3 seconds
    for (let i = 0; i < 30; i++) {
        await page.keyboard.down('ArrowRight');
        if (i % 6 < 3) await page.keyboard.down(' ');
        await page.waitForTimeout(100);
        if (i % 6 < 3) await page.keyboard.up(' ');
    }
    await page.keyboard.up('ArrowRight');

    const after = await page.evaluate(() => ({
        state: STATE,
        px: game.px, py: game.py,
        coins: game.coins, score: game.score, lives: game.lives,
        enemies: game.enemies.length,
        particles: game.particles.length,
        popups: game.scorePopups.length,
        cam: game.cam,
    }));
    console.log('After 3s of play:');
    console.log('  ', JSON.stringify(after, null, 2).split('\n').join('\n  '));

    await page.screenshot({ path: '/tmp/v18_gameplay.png' });

    if (errors.length) {
        console.error('Errors:');
        errors.forEach(e => console.error('  ' + e));
        await browser.close();
        process.exit(1);
    }
    console.log('No errors. Game ran cleanly with WASM physics.');
    await browser.close();
})();
