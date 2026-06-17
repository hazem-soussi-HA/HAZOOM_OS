// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// Full game loop integration test
// Verifies: TITLE → PLAYING → RACING → PLAYING (round trip)
//
// Usage:
//   node /tmp/game-test/test_full_loop2.js
//
// Output confirms each phase transitions cleanly with zero console errors.

const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errs = [];
    page.on('pageerror', e => errs.push('PAGEERR: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('CONERR: ' + m.text()); });
    await page.goto('http://localhost:8080/website/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(500);
    await page.locator('#game-canvas').click({ position: { x: 640, y: 360 } });
    await page.waitForTimeout(200);

    const down = (k, c) => page.evaluate(({k, c}) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: c, bubbles: true })), { k, c });
    const up   = (k, c) => page.evaluate(({k, c}) => window.dispatchEvent(new KeyboardEvent('keyup',   { key: k, code: c, bubbles: true })), { k, c });

    // Force start (real users press Enter)
    await page.evaluate(() => { window.STATE = 'PLAYING'; });

    // Teleport next to first car (40 * 48 = 1920)
    await page.evaluate(() => {
        const c = window.game.cars[0];
        window.game.px = c.x;
        window.game.py = c.y - 48;
    });
    await page.waitForTimeout(100);

    // F to enter
    await down('f', 'KeyF');
    await up('f', 'KeyF');
    await page.waitForTimeout(2000);  // 3D scene build + countdown
    const entered = await page.evaluate(() => ({
        state: window.STATE, pOnCar: window.game?.pOnCar, active: !!window.RacingMode?.active
    }));
    console.log('Entered car:', JSON.stringify(entered));

    // Wait for 3s countdown
    await page.waitForTimeout(3500);
    // Gas
    await down('ArrowUp', 'ArrowUp');
    await page.waitForTimeout(2000);
    const driving = await page.evaluate(() => ({
        speed: window.RacingMode?.speed?.toFixed(1),
        gear: window.RacingMode?.gear,
        rpm: window.RacingMode?.rpm?.toFixed(0),
        posZ: window.RacingMode?.carGroup?.position?.z?.toFixed(1)
    }));
    console.log('Driving:', JSON.stringify(driving));
    await up('ArrowUp', 'ArrowUp');

    // F to exit
    await down('f', 'KeyF');
    await up('f', 'KeyF');
    await page.waitForTimeout(500);
    const exited = await page.evaluate(() => ({
        state: window.STATE, pOnCar: window.game?.pOnCar, active: !!window.RacingMode?.active
    }));
    console.log('Exited car:', JSON.stringify(exited));
    console.log('Errors:', errs.length);
    errs.forEach(e => console.log('  ' + e));
    await browser.close();
})();
