#!/usr/bin/env node
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => console.error('PAGEERR:', e));
    await page.goto('http://localhost:8080/website/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Inject instrumentation
    await page.evaluate(() => {
        window._frameTimes = [];
        window._lastT = performance.now();
        const orig = gameLoop;
        window.gameLoop = function(ts) {
            const t0 = performance.now();
            const realDt = (ts - (window._lastFrame || ts)) / 1000;
            window._lastFrame = ts;
            const tPhysStart = performance.now();
            updatePhysics(Math.min(realDt, 0.05));
            const tPhysEnd = performance.now();
            draw();
            const tDrawEnd = performance.now();
            if (window._frameTimes.length < 300) {
                window._frameTimes.push({
                    phys: tPhysEnd - tPhysStart,
                    draw: tDrawEnd - tPhysEnd,
                    frame: tDrawEnd - t0,
                    dt: realDt,
                });
            }
            orig.call(this, ts);
        };
        // Replace the rAF loop too — actually we just override the global function
    });

    // Trigger game start
    await page.evaluate(() => { STATE = 'PLAYING'; if (!game) initGame(); });
    await page.waitForTimeout(3000);

    const samples = await page.evaluate(() => window._frameTimes);
    if (samples.length === 0) {
        console.log('No frame samples captured. Let me try a different approach.');
    } else {
        const phys = samples.map(s => s.phys).sort((a, b) => a - b);
        const draw = samples.map(s => s.draw).sort((a, b) => a - b);
        const total = samples.map(s => s.frame).sort((a, b) => a - b);
        const dts = samples.map(s => s.dt);
        const fps = 1 / (dts.reduce((a, b) => a + b, 0) / dts.length);
        const med = a => a[Math.floor(a.length / 2)];
        const p95 = a => a[Math.floor(a.length * 0.95)];
        const p99 = a => a[Math.floor(a.length * 0.99)];

        console.log('--- Real frame timings (' + samples.length + ' frames) ---');
        console.log('FPS (avg):', fps.toFixed(1));
        console.log('phase  median   p95      p99      max');
        console.log('phys :', med(phys).toFixed(2).padStart(7), p95(phys).toFixed(2).padStart(7), p99(phys).toFixed(2).padStart(7), Math.max(...phys).toFixed(2).padStart(7));
        console.log('draw :', med(draw).toFixed(2).padStart(7), p95(draw).toFixed(2).padStart(7), p99(draw).toFixed(2).padStart(7), Math.max(...draw).toFixed(2).padStart(7));
        console.log('total:', med(total).toFixed(2).padStart(7), p95(total).toFixed(2).padStart(7), p99(total).toFixed(2).padStart(7), Math.max(...total).toFixed(2).padStart(7));
    }

    await browser.close();
})();
