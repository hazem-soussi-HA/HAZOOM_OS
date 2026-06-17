#!/usr/bin/env node
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => console.error('PAGEERR:', e));
    await page.goto('http://localhost:8080/website/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { STATE = 'PLAYING'; if (!game) initGame(); });
    await page.waitForTimeout(500);

    const results = await page.evaluate(() => {
        const N = 1000;
        const measure = (name, fn) => {
            const t0 = performance.now();
            for (let i = 0; i < N; i++) fn();
            return { name, ms: performance.now() - t0 };
        };
        return [
            measure('syncEnemiesToWasm', () => syncEnemiesToWasm(game.enemies)),
            measure('syncEnemiesFromWasm', () => syncEnemiesFromWasm(game.enemies)),
            measure('syncParticlesToWasm', () => syncParticlesToWasm(game.particles)),
            measure('syncParticlesFromWasm', () => syncParticlesFromWasm(game.particles)),
            measure('syncCarsToWasm', () => syncCarsToWasm(game.cars)),
            measure('syncCarsFromWasm', () => syncCarsFromWasm(game.cars)),
            measure('syncMapToWasm', () => syncMapToWasm(game.lvl)),
            measure('syncMapFromWasm', () => syncMapFromWasm(game.lvl)),
            measure('syncPlayerToWasm', () => syncPlayerToWasm(game)),
            measure('syncPlayerFromWasm', () => syncPlayerFromWasm(game)),
            measure('drainEvents', () => drainEvents()),
            measure('stepWasm', () => stepWasm()),
        ];
    });

    console.log('--- Bridge overhead (per 1000 calls) ---');
    results.sort((a, b) => b.ms - a.ms);
    for (const r of results) {
        const per = r.ms / 1000;
        console.log(r.name.padEnd(28), r.ms.toFixed(2).padStart(8) + 'ms total,', per.toFixed(4).padStart(7) + 'ms/call');
    }
    const total = results.reduce((a, b) => a + b.ms, 0);
    console.log('---');
    console.log('TOTAL:', total.toFixed(2) + 'ms per 1000 frames =', (total/1000).toFixed(4) + 'ms/frame');

    await browser.close();
})();
