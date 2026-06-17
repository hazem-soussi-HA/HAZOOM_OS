// Quick diagnostic test for V1.8.2 stomp path
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    const logs = [];
    page.on('console', m => {
        const t = m.text();
        if (t.includes('STOMP') || t.includes('RECRUIT') || t.includes('PATH') || t.includes('BUDDY')) {
            logs.push(t);
        }
    });

    // Inject path-tracking + recruit-tracking hooks
    await page.addInitScript(() => {
        window._STOMP_PATH = '';
        window._RECRUIT_CALLS = [];
    });

    await page.goto('http://localhost:8080/website/index.html');
    await page.waitForFunction(() => typeof WASM !== 'undefined' && WASM.ready, { timeout: 5000 });

    // Wrap recruitEnemy and updateEnemies to log
    await page.evaluate(() => {
        const _r = window.recruitEnemy || (typeof recruitEnemy === 'function' ? recruitEnemy : null);
        // Hook into the global namespace
        window.__origRecruit = _r;
        // The function is in module scope; we need to hook via direct call
    });

    await page.evaluate(() => { STATE = 'PLAYING'; });
    await page.waitForTimeout(300);

    // Stomp at goomba x=14
    await page.evaluate(() => {
        game.px = 14 * TILE;
        game.py = (WH - 3) * TILE - 30;
        game.pvy = 500;
        console.log('PATH: before stomp, WASM.ready=' + WASM.ready);
    });

    await page.waitForTimeout(300);

    const state = await page.evaluate(() => {
        const buddies = (game.enemies || []).filter(e => e.isBuddy);
        return {
            buddyCount: buddies.length,
            buddies: buddies.map(b => ({ kind: b.buddyKind, slot: b.buddySlot, x: b.x })),
            goomba0: game.enemies.find(e => Math.abs(e.x - 14 * TILE) < 10),
            wasmReady: typeof WASM !== 'undefined' && WASM.ready
        };
    });

    console.log('State after stomp:', JSON.stringify(state, null, 2));
    console.log('Logs:', logs);

    await browser.close();
})();
