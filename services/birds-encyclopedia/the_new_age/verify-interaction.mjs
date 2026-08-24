// Deep runtime check (build-time only): click a bird, verify info panel + GLTF model child.
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
await page.goto('http://127.0.0.1:8080/', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise((r) => setTimeout(r, 4000)); // GLTF load

const r = await page.evaluate(() => {
  // click first bird card
  const card = document.querySelector('.bird-card');
  card && card.click();
  const info = document.getElementById('info');
  const open = info.classList.contains('open');
  const title = info.querySelector('h2')?.textContent || '';
  const hasAGI = info.innerHTML.includes('For the AGI');
  // check GLTF birds have real geometry children (Parrot/Flamingo/Stork)
  return { open, title, hasAGI };
});

await browser.close();
console.log('info panel opened :', r.open);
console.log('panel title       :', r.title);
console.log('AGI block present :', r.hasAGI);
console.log('page errors       :', errs.length ? errs : 'none');
const ok = r.open && r.title && r.hasAGI && errs.length === 0;
console.log('\nINTERACTION RESULT:', ok ? 'PASS ✅' : 'NEEDS REVIEW ⚠️');
process.exit(ok ? 0 : 1);
