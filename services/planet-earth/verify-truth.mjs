// Focused verification of the "Verify the truth" overlay + real-sun model.
import puppeteer from 'puppeteer';

const URL = 'http://127.0.0.1:8080/index.html?capturable=1';
const external = [];
const errors = [];

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle',
         '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--window-size=1280,800'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('request', (r) => {
    const h = (() => { try { return new URL(r.url()).hostname; } catch { return ''; } })();
    if (h && h !== '127.0.0.1' && h !== 'localhost') external.push(r.url());
  });

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForFunction(() => document.getElementById('loader').classList.contains('hidden'), { timeout: 20000 });
  await new Promise((r) => setTimeout(r, 800));

  // Open the Truth overlay.
  await page.evaluate(() => document.getElementById('btn-truth').click());
  await new Promise((r) => setTimeout(r, 400));

  const overlay = await page.evaluate(() => {
    const t = document.getElementById('truth');
    const facts = document.querySelectorAll('#truth-facts .fact').length;
    const live = document.getElementById('truth-live').textContent;
    const firstFact = document.querySelector('#truth-facts .fact .v')?.textContent || '';
    return {
      visible: !t.hidden,
      facts,
      live,
      firstFact,
      hasUTC: /UTC/.test(live),
      hasSubpoint: /Sun sub-point/.test(live),
    };
  });

  // Verify the real-sun math produces a sane subsolar point (within bounds).
  const math = await page.evaluate(() => {
    // recompute independently via the page's exposure (not directly accessible)
    // so instead sanity-check the displayed sub-point string.
    const live = document.getElementById('truth-live').textContent;
    const m = live.match(/Sun sub-point:\s*([\d.]+)°[EW],\s*([\d.]+)°[NS]/);
    if (!m) return { ok: false };
    const lon = parseFloat(m[1]), lat = parseFloat(m[2]);
    return { ok: lon >= 0 && lon <= 180 && lat >= 0 && lat <= 90, lon, lat };
  });

  const checks = [];
  checks.push(['no JS errors', errors.length === 0]);
  checks.push(['truth overlay opens', overlay.visible]);
  checks.push(['12 fact cards rendered', overlay.facts === 12]);
  checks.push(['first fact = Oblate spheroid', /Oblate/.test(overlay.firstFact)]);
  checks.push(['live readout has UTC + sub-point', overlay.hasUTC && overlay.hasSubpoint]);
  checks.push(['subsolar point within bounds', math.ok]);
  checks.push(['zero external network calls', external.length === 0]);

  console.log('--- Truth overlay verification ---');
  console.log('facts rendered:', overlay.facts, '| firstFact:', overlay.firstFact);
  console.log('live readout:', overlay.live.replace(/\n/g, ' | '));
  console.log('subsolar math bounds:', JSON.stringify(math));
  if (external.length) console.log('EXTERNAL:', external);
  if (errors.length) console.log('ERRORS:', errors);
  let ok = true;
  for (const [n, p] of checks) { console.log(`${p ? 'PASS' : 'FAIL'}  ${n}`); if (!p) ok = false; }
  await browser.close();
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error('CRASH:', e);
  if (errors.length) console.error('errors:', errors);
  await browser.close();
  process.exit(2);
}
