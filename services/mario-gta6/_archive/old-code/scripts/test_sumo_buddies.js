// Headless test for V1.8.2 Sumo Buddies
// Stomps goombas and verifies they become buddies, not kills

const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    const errors = [];
    page.on('pageerror', e => errors.push('PAGEERR: ' + e.message));
    page.on('console', m => {
        if (m.type() === 'error') errors.push('CONSOLE: ' + m.text());
        if (m.type() === 'log' && m.text().includes('WASM')) console.log('  >', m.text());
    });

    await page.goto('http://localhost:8080/website/index.html');
    await page.waitForFunction(() => typeof WASM !== 'undefined' && WASM.ready, { timeout: 5000 });
    await page.waitForTimeout(500);

    // Start the game
    await page.evaluate(() => { STATE = 'PLAYING'; });
    await page.waitForTimeout(200);

    // Helper: read game state
    const snap = async () => await page.evaluate(() => {
        const buddies = (game.enemies || []).filter(e => e.isBuddy);
        return {
            score: game.score,
            lives: game.lives,
            px: game.px,
            py: game.py,
            buddyCount: buddies.length,
            buddyKinds: buddies.map(b => b.buddyKind),
            buddySlots: buddies.map(b => b.buddySlot).sort(),
            activeEnemies: game.enemies.filter(e => e.hp > 0 && !e.isBuddy && e.type !== 'powerup').length
        };
    });

    console.log('=== INITIAL ===');
    console.log(JSON.stringify(await snap(), null, 2));

    // Teleport player next to first goomba (ep[0]=14) and stomp it
    await page.evaluate(() => {
        game.px = 14 * TILE;
        game.py = (WH - 3) * TILE - 30;
        game.pvy = 500;  // falling down
    });

    await page.waitForTimeout(500);
    console.log('=== AFTER 1ST STOMP (goomba at x=14) ===');
    console.log(JSON.stringify(await snap(), null, 2));

    // Stomp the second goomba
    await page.evaluate(() => {
        game.px = 24 * TILE;
        game.py = (WH - 3) * TILE - 30;
        game.pvy = 500;
    });
    await page.waitForTimeout(500);
    console.log('=== AFTER 2ND STOMP (goomba at x=24) ===');
    console.log(JSON.stringify(await snap(), null, 2));

    // Stomp a third
    await page.evaluate(() => {
        game.px = 32 * TILE;
        game.py = (WH - 3) * TILE - 30;
        game.pvy = 500;
    });
    await page.waitForTimeout(500);
    console.log('=== AFTER 3RD STOMP (goomba at x=32) ===');
    console.log(JSON.stringify(await snap(), null, 2));

    // Stomp a 4th — should dismiss the oldest
    await page.evaluate(() => {
        game.px = 46 * TILE;
        game.py = (WH - 3) * TILE - 30;
        game.pvy = 500;
    });
    await page.waitForTimeout(500);
    console.log('=== AFTER 4TH STOMP (overflow check) ===');
    console.log(JSON.stringify(await snap(), null, 2));

    // Take a screenshot
    await page.screenshot({ path: '/tmp/opencode/v182_buddies.png', fullPage: false });
    console.log('Screenshot: /tmp/opencode/v182_buddies.png');

    // Test dismissal: take a hit to lose a life
    await page.evaluate(() => {
        // Force a life loss by setting pMode=0 and calling hurtPlayer directly
        if (typeof hurtPlayer === 'function' && game.pMode === 0) {
            hurtPlayer();
        } else {
            game.pMode = 0; game.pOnFire = false;
            if (typeof hurtPlayer === 'function') hurtPlayer();
        }
    });
    await page.waitForTimeout(500);
    console.log('=== AFTER LIFE LOST (buddies should be dismissed) ===');
    console.log(JSON.stringify(await snap(), null, 2));

    if (errors.length) {
        console.log('=== ERRORS ===');
        errors.forEach(e => console.log(e));
    } else {
        console.log('=== NO ERRORS ===');
    }

    await browser.close();
    process.exit(errors.length > 0 ? 1 : 0);
})();
