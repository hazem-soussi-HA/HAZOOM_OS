// Visual diagnosis: hitboxes + racing mode
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    page.on('pageerror', e => console.log('ERR:', e.message));

    await page.goto('http://localhost:8080/website/index.html');
    await page.waitForFunction(() => typeof WASM !== 'undefined' && WASM.ready, { timeout: 5000 });
    await page.waitForTimeout(300);

    // 1. Plumber mode: enable hitbox drawing via the settings key
    await page.evaluate(() => { STATE = 'PLAYING'; });
    await page.waitForTimeout(200);

    // Enable hitbox visualization (F8 or similar)
    await page.evaluate(() => {
        // Force the hitbox render path
        if (typeof game !== 'undefined') game._drawHitboxes = true;
        // The game has showHitboxes in settings
        if (typeof settings !== 'undefined') settings.showHitboxes = true;
    });
    await page.waitForTimeout(100);

    // Walk a few enemies to land on
    await page.evaluate(() => {
        game.px = 5 * TILE; game.py = (WH - 3) * TILE;
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/opencode/diag_plumber_1.png' });
    console.log('Plumber mode 1 saved');

    // Stand on a goomba
    await page.evaluate(() => {
        game.px = 14 * TILE - 20; game.py = (WH - 3) * TILE;
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/opencode/diag_plumber_stomp.png' });
    console.log('Plumber mode stomp pose saved');

    // Look at the car near the start (cars are at x={50,90,130,170,210}*TILE)
    await page.evaluate(() => {
        game.px = 48 * TILE; game.py = (WH - 3) * TILE;
        game.cam = game.px - W / 3;
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/opencode/diag_car.png' });
    console.log('Car area saved');

    // Now switch to racing mode
    await page.evaluate(async () => {
        // Enter a car
        if (game.cars.length > 0) {
            const c = game.cars[0];
            game.px = c.x;
            game.py = c.y - TILE;
            game.pOnCar = true;
            game.pCar = c;
            // Wait for racing to start
            if (typeof enterRacingMode === 'function') {
                await enterRacingMode(c);
            }
        }
    });
    await page.waitForTimeout(2000);  // give time for racing to load
    await page.screenshot({ path: '/tmp/opencode/diag_racing.png' });
    console.log('Racing mode saved');

    // Get some racing mode metrics
    const racingState = await page.evaluate(() => {
        if (typeof RacingMode === 'undefined') return null;
        return {
            active: RacingMode.active,
            carX: RacingMode.car ? RacingMode.car.position.x : null,
            carZ: RacingMode.car ? RacingMode.car.position.z : null,
            opponents: typeof RacingOpponents !== 'undefined' ? RacingOpponents.list.length : 0
        };
    });
    console.log('Racing state:', JSON.stringify(racingState));

    await browser.close();
})();
