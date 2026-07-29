// Headless verification of the Planet Earth app.
// Proves: (1) page loads with no JS/console errors,
//         (2) textures finished (loader hidden),
//         (3) something actually rendered (canvas pixels differ from clear),
//         (4) ZERO external network requests (offline / air-gapped).
// Run: node verify.mjs   (after: piped puppeteer install via install-verify.sh)
import puppeteer from 'puppeteer';

const URL = 'http://127.0.0.1:8080/index.html?capturable=1';
const external = [];
const errors = [];

const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--ignore-gpu-blocklist',
    '--window-size=1280,800',
  ],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));

  // Air-gap monitor: any request leaving 127.0.0.1 fails the build.
  page.on('request', (r) => {
    const host = (() => { try { return new URL(r.url()).hostname; } catch { return ''; } })();
    if (host && host !== '127.0.0.1' && host !== 'localhost') {
      external.push(r.url());
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for the loader to hide (all textures + module loaded).
  await page.waitForFunction(
    () => document.getElementById('loader').classList.contains('hidden'),
    { timeout: 20000 }
  );

  // Let a few frames render.
  await new Promise((r) => setTimeout(r, 1200));

  // Read back the WebGL canvas pixels and confirm non-empty render.
  const sample = await page.evaluate(() => {
    const c = document.getElementById('scene');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const w = c.width, h = c.height;
    const px = new Uint8Array(4 * 9);
    // sample a 3x3 block at the center (the planet)
    gl.readPixels((w / 2) | 0, (h / 2) | 0, 3, 3, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let nonClear = 0, lum = 0;
    for (let i = 0; i < px.length; i += 4) {
      lum += px[i] + px[i + 1] + px[i + 2];
      // clear color is ~ (5,7,15); count pixels clearly brighter than that
      if (px[i] + px[i + 1] + px[i + 2] > 80) nonClear++;
    }
    return { centerSum: lum, nonClear, w, h };
  });

  const fps = await page.$eval('#fps', (e) => e.textContent);
  const draws = await page.$eval('#draws', (e) => e.textContent);
  const tris = await page.$eval('#tris', (e) => e.textContent);

  // Color-palette proof: Earth's render must contain blue (oceans/atmosphere)
  // AND green/tan (land) pixels — not a flat or mis-colored image.
  const palette = await page.evaluate(() => {
    const c = document.getElementById('scene');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const w = c.width, h = c.height;
    const buf = new Uint8Array(4 * w * h);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    let blue = 0, green = 0, warm = 0;
    for (let i = 0; i < buf.length; i += 4) {
      const r = buf[i], g = buf[i + 1], b = buf[i + 2];
      if (b > 90 && b > r && b > g) blue++;
      if (g > 70 && g >= r && g > b * 0.8) green++;
      if (r > 80 && r > b) warm++;
    }
    return { blue, green, warm };
  });
  // count how many distinct-ish bright pixels exist across the captured PNG.
  const shot = await page.screenshot({ path: './_verify_shot.png', type: 'png' });
  let bright = 0;
  // Min PNG: sample raw decode is heavy; instead reuse canvas readback which
  // is now reliable because ?capturable=1 set preserveDrawingBuffer.
  const shotSample = await page.evaluate(() => {
    const c = document.getElementById('scene');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const w = c.width, h = c.height;
    const buf = new Uint8Array(4 * w * h);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    let nb = 0, sum = 0;
    for (let i = 0; i < buf.length; i += 4) {
      const l = buf[i] + buf[i + 1] + buf[i + 2];
      sum += l;
      if (l > 60) nb++;
    }
    return { brightPx: nb, totalPx: w * h, avgLum: sum / (w * h) };
  });
  await page.evaluate(() => {
    const el = document.getElementById('t-clouds');
    el.checked = !el.checked;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => {
    const el = document.getElementById('t-lights');
    el.checked = !el.checked;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 300));

  // ---- assertions ----
  const checks = [];
  checks.push(['no JS errors', errors.length === 0]);
  checks.push(['loader hidden (assets loaded)', true]);
  checks.push(['canvas rendered (bright pixels > 1% of frame)', shotSample.brightPx > shotSample.totalPx * 0.01]);
  checks.push(['Earth palette present (blue oceans + green/tan land)', palette.blue > 5000 && palette.green > 800]);
  checks.push(['zero external network calls', external.length === 0]);
  checks.push(['draw calls reported', draws !== '–' && draws !== '']);

  console.log('--- Planet Earth verification ---');
  console.log(`canvas: ${sample.w}x${sample.h}, center luminance sum=${sample.centerSum}, nonClear=${sample.nonClear}`);
  console.log(`full frame: brightPx=${shotSample.brightPx}/${shotSample.totalPx} (avgLum=${shotSample.avgLum.toFixed(1)}), screenshot=_verify_shot.png`);
  console.log(`palette: blue=${palette.blue} green=${palette.green} warm=${palette.warm}`);
  console.log(`live stats: fps=${fps} draws=${draws} tris=${tris}`);
  if (external.length) console.log('EXTERNAL REQUESTS:', external);
  if (errors.length) console.log('ERRORS:', errors);
  let ok = true;
  for (const [name, pass] of checks) {
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}`);
    if (!pass) ok = false;
  }
  await browser.close();
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error('VERIFY CRASHED:', e);
  if (errors.length) console.error('collected errors:', errors);
  await browser.close();
  process.exit(2);
}
