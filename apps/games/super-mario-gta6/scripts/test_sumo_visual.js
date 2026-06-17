// Better visual test: simulate movement + take screenshot
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    page.on('pageerror', e => console.log('PAGEERR:', e.message));
    page.on('console', m => {
        if (m.type() === 'error') console.log('CONSOLE:', m.text());
    });

    await page.goto('http://localhost:8080/website/index.html');
    await page.waitForFunction(() => typeof WASM !== 'undefined' && WASM.ready, { timeout: 5000 });
    await page.waitForTimeout(300);
    await page.evaluate(() => { STATE = 'PLAYING'; });
    await page.waitForTimeout(200);

    // Teleport + stomp to recruit 3 buddies at known positions
    const positions = [14, 24, 32];
    for (const x of positions) {
        await page.evaluate((tx) => {
            game.px = tx * TILE;
            game.py = (WH - 3) * TILE - 30;
            game.pvy = 500;
        }, x);
        await page.waitForTimeout(400);
    }

    // Now position the player in a visible area with the conga behind
    // We'll set pDir=0 (facing left) so buddies trail to the right
    await page.evaluate(() => {
        // Center the camera
        game.cam = game.px - W / 3;
        // Face left so buddies go to the right
        game.pDir = 0;
        game.pvx = 0;
        game.pvy = 0;
        game.py = (WH - 3) * TILE - 2;
    });
    await page.waitForTimeout(300);

    // Read state
    const state = await page.evaluate(() => {
        const buddies = (game.enemies || []).filter(e => e.isBuddy);
        return {
            pDir: game.pDir,
            px: game.px,
            buddies: buddies.map(b => ({
                slot: b.buddySlot,
                x: b.x,
                dx: b.x - game.px
            })).sort((a, b) => a.slot - b.slot)
        };
    });
    console.log('pDir:', state.pDir, 'px:', state.px);
    console.log('Buddies:', JSON.stringify(state.buddies, null, 2));

    await page.screenshot({ path: '/tmp/opencode/v182_final.png', fullPage: false });
    console.log('Screenshot: /tmp/opencode/v182_final.png');

    await browser.close();
})();
