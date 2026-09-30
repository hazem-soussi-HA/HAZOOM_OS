// Headless boot verification: load the real desktop, check the constellation layer
const puppeteer = require('puppeteer-core');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: '/root/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
        headless: 'new',
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

    await page.goto('http://127.0.0.1:3579/index.html', { waitUntil: 'networkidle2', timeout: 45000 });
    // Wait for boot + constellation init
    await new Promise(r => setTimeout(r, 9000));

    const result = await page.evaluate(() => {
        const canvas = document.getElementById('service-constellation-canvas');
        const out = { canvasExists: !!canvas };
        if (canvas) {
            out.opacity = canvas.style.opacity;
            out.width = canvas.width;
            out.height = canvas.height;
            out.zIndex = canvas.style.zIndex;
        }
        out.constellationApi = typeof window.HAZOOM_CONSTELLATION;
        // Count non-transparent pixels drawn (stars actually painted?)
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let painted = 0;
            for (let i = 3; i < data.length; i += 4) if (data[i] > 0) painted++;
            out.paintedPixels = painted;
        }
        out.desktopIcons = document.querySelectorAll('.desktop-icon').length;
        out.title = document.title;
        return out;
    });

    console.log(JSON.stringify(result, null, 2));
    const realErrors = errors.filter(e => !/net::ERR|Failed to load resource|favicon|AbortError|signal is aborted/.test(e));
    console.log('significant JS errors:', realErrors.length ? realErrors : 'none');

    // Screenshot for the user
    await page.screenshot({ path: '/tmp/opencode/hazoom-constellation.png' });
    console.log('screenshot saved');
    await browser.close();
    process.exit(realErrors.length ? 1 : 0);
})().catch(e => { console.error('TEST FAILED:', e.message); process.exit(1); });
