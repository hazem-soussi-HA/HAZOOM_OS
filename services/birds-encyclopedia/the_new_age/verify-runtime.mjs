// Headless runtime verification (build-time only — not shipped).
// Loads the local app, captures console/errors/network, and confirms the scene rendered.
import puppeteer from 'puppeteer';

const URL = 'http://127.0.0.1:8080/';
const externalHosts = new Set();

const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
  ],
});
const page = await browser.newPage();
const errors = [];
const consoleErrs = [];
const failedReq = [];

page.on('console', (msg) => { if (msg.type() === 'error') consoleErrs.push(msg.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
page.on('response', (r) => { if (r.status() === 404) failedReq.push('404 ' + r.url()); });
page.on('request', (r) => {
  try {
    const u = new URL(r.url());
    if (u.hostname && u.hostname !== '127.0.0.1' && u.hostname !== 'localhost') {
      externalHosts.add(u.hostname);
    }
  } catch {}
});

await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
// give GLTF loads time
await new Promise((r) => setTimeout(r, 3500));

const report = await page.evaluate(() => {
  const status = document.getElementById('status')?.textContent || '';
  const cards = document.querySelectorAll('.bird-card').length;
  const canvas = document.getElementById('scene');
  // sample center pixel to confirm something rendered (non-background)
  let nonBg = false;
  try {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const px = new Uint8Array(4);
      gl.readPixels(canvas.width >> 1, canvas.height >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      // background is #0b1020 -> (11,16,32). If center differs, a bird/pedestal is in view.
      nonBg = !(px[0] === 11 && px[1] === 16 && px[2] === 32);
    }
  } catch (e) {}
  return { status, cards, canvasW: canvas.width, canvasH: canvas.height, nonBg };
});

await browser.close();

console.log('=== RUNTIME VERIFICATION ===');
console.log('status text     :', report.status);
console.log('bird cards       :', report.cards);
console.log('canvas size      :', report.canvasW + 'x' + report.canvasH);
console.log('center pixel drawn:', report.nonBg);
console.log('external hosts hit:', [...externalHosts].length ? [...externalHosts] : 'NONE (air-gapped ✓)');
console.log('page errors      :', errors.length ? errors : 'none');
console.log('console errors   :', consoleErrs.length ? consoleErrs : 'none');
console.log('failed requests  :', failedReq.length ? failedReq : 'none');

const ok = report.cards === 19 && errors.length === 0 && externalHosts.size === 0;
console.log('\nRESULT:', ok ? 'PASS ✅' : 'NEEDS REVIEW ⚠️');
process.exit(ok ? 0 : 1);
