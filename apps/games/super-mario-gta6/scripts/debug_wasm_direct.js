#!/usr/bin/env node
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => console.error('PAGEERR:', e));
    await page.goto('http://localhost:8080/website/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.waitForFunction(() => WASM && WASM.ready, { timeout: 5000 });
    await page.evaluate(() => { STATE = 'PLAYING'; if (!game) initGame(); });
    await page.waitForTimeout(200);

    // Place player above goomba (don't wait — JS would undo it)
    await page.evaluate(() => {
        const g = game.enemies.find(e => e.type === 'goomba' && e.hp > 0);
        if (g) {
            // Pin both player and goomba in place
            game.px = g.x;
            game.py = g.y - 20;
            game.pvy = 250;
            g.vx = 0;  // freeze goomba
            g.t = 0;
        }
    });
    // Tiny delay — but the game loop will run 1-2 frames max
    await page.waitForTimeout(20);

    // Call step() and read events directly from WASM
    const direct = await page.evaluate(() => {
        // Override JS player physics for one frame by setting py manually
        // and re-syncing. The actual game loop already snapped py to 622 by now.
        // Force the values we want.
        const g = game.enemies.find(e => e.type === 'goomba' && e.hp > 0);
        if (g) {
            g.vx = 0;
            game.px = g.x;
            game.py = g.y - 20;
            game.pvy = 250;
        }
        // Sync
        syncEnemiesToWasm(game.enemies);
        syncPlayerToWasm(game);
        // CRITICAL: set dt in input buffer
        WASM.inputF32[4] = 0.016;
        // DEBUG: write a marker
        const marker = WASM.exports.debug_marker(99.0);
        const markerRead = WASM.exports.debug_read();
        // DEBUG: call step_enemies directly
        const n2 = WASM.exports.debug_step_enemies(0.016);
        const markerRead2 = WASM.exports.debug_read();
        // Verify WASM sees the right values
        const wasPy = WASM.playerF32[1];
        const wasPx = WASM.playerF32[0];
        const wasPvy = WASM.playerF32[3];
        // Read dt from input buffer to confirm
        const inputDt = WASM.inputF32[4];
        // Find the goomba in WASM memory
        const enemyDebug = [];
        for (let i = 0; i < 5; i++) {
            const fo = i * 8;
            const bo = i * 32;
            // Read raw bytes at E_SHELLVX offset to verify
            const rawBytes = [];
            for (let j = 0; j < 4; j++) rawBytes.push(new Uint8Array(WASM.memory.buffer)[20480 + i * 32 + 24 + j]);
            const rawFloat = new Float32Array(new Uint8Array(WASM.memory.buffer).slice(20480 + i * 32 + 24, 20480 + i * 32 + 28).buffer)[0];
            enemyDebug.push({
                x: WASM.enemiesF32[fo + 0],
                y: WASM.enemiesF32[fo + 1],
                t: WASM.enemiesF32[fo + 4],  // t field, should increase each frame
                hp: (WASM.enemiesBytes[bo + 20] << 24) >> 24,
                type: WASM.enemiesBytes[bo + 21],
                shellVx: WASM.enemiesF32[fo + 6],
                iter: WASM.enemiesF32[1 * 8 + 6],
                rawBytesAtShellVx: rawBytes,
                rawFloatAtShellVx: rawFloat,
            });
        }
        console.log('Enemy in WASM[0..5]:', JSON.stringify(enemyDebug));
        // Call step
        const n = WASM.exports.step();
        // Read goomba's HP after step
        const goombaHpAfter = (WASM.enemiesBytes[0 * 32 + 20] << 24) >> 24;
        // Read events
        const evs = [];
        for (let i = 0; i < n; i++) {
            const off = i * 16;
            evs.push({
                type: WASM.eventsBytes[off + 0],
                tx: WASM.mem.getInt32(4352 + off + 1, true),
                ty: WASM.mem.getInt32(4352 + off + 5, true),
                x: WASM.mem.getFloat32(4352 + off + 8, true),
                y: WASM.mem.getFloat32(4352 + off + 12, true),
            });
        }
        WASM.exports.clear_events();
        return { n, evs, wasPy, wasPx, wasPvy, pvy: WASM.playerF32[3], px: WASM.playerF32[0], py: WASM.playerF32[1], enemyDebug, goombaHpAfter, inputDt, marker, markerRead, n2, markerRead2 };
    });
    console.log('Direct WASM step result:');
    console.log(' ', JSON.stringify(direct, null, 2).split('\n').join('\n  '));

    await browser.close();
})();
