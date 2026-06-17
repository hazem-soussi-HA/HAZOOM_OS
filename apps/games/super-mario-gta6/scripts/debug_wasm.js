#!/usr/bin/env node
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on('pageerror', e => console.error('PAGEERR:', e));
    page.on('console', m => console.log('CONSOLE', m.type() + ':', m.text()));
    await page.goto('http://localhost:8080/website/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => {
        return {
            typeofWASM: typeof WASM,
            ready: WASM ? WASM.ready : null,
            failed: WASM ? WASM.failed : null,
            hasExports: !!(WASM && WASM.exports),
            hasMemory: !!(WASM && WASM.memory),
            mapBytes: WASM && WASM.mapBytes ? WASM.mapBytes.length : 0,
            stepWasm: typeof stepWasm,
            loadWasm: typeof loadWasm,
        };
    });
    console.log(JSON.stringify(info, null, 2));
    await browser.close();
})();
