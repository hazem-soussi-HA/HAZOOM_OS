/**
 * js/home.js — Marketing landing page for Hazoom.
 *
 * A futuristic, conversion-focused storefront home: hero with aurora + CTA,
 * "how it works", featured products (live from the API), category tiles, and
 * a closing call-to-action. Uses window.hazoom.ui.reveal() for scroll motion.
 */

const CATEGORIES = [
  { key: 'tshirt',  label: 'T-Shirts',  emoji: '👕', blurb: 'Soft combed cotton, every fit.' },
  { key: 'hoodie',  label: 'Hoodies',   emoji: '🧥', blurb: 'Fleece-lined, all weather.' },
  { key: 'mug',     label: 'Mugs',      emoji: '☕', blurb: 'Ceramic, gift-ready.' },
  { key: 'phonecase', label: 'Phone Cases', emoji: '📱', blurb: 'Slim, snap-on protection.' },
];

function productCard(p) {
  const img = (p.images && p.images[0]) || p.mockupUrl || 'https://placehold.co/400x400?text=Hazoom';
  const catLabel = { tshirt: 'T-Shirt', mug: 'Mug', hoodie: 'Hoodie', phonecase: 'Phone Case' }[p.category] || p.category;
  return `
    <a href="/product/${p.id}" data-link class="card product-card">
      <div class="thumb"><span class="badge">${catLabel}</span><img src="${img}" alt="${p.title}" loading="lazy" /></div>
      <div class="p-4">
        <h3 class="font-semibold truncate">${p.title}</h3>
        <div class="flex items-center justify-between mt-2">
          <span class="font-bold gradient-text">${window.hazoom.ui.money(p.basePrice)}</span>
          <span class="text-xs text-[var(--text-dim)]">Customize →</span>
        </div>
      </div>
    </a>`;
}

async function renderHome(app) {
  app.innerHTML = `
    <!-- HERO -->
    <section class="relative overflow-hidden">
      <div class="container-x pt-20 pb-16 text-center">
        <div class="reveal inline-flex chip mb-5">🎨 Futuristic print-on-demand studio</div>
        <h1 class="reveal display text-4xl md:text-6xl font-bold leading-[1.05] max-w-3xl mx-auto">
          Your ideas, <span class="gradient-text">beautifully printed</span> & shipped worldwide.
        </h1>
        <p class="reveal text-[var(--text-dim)] mt-5 max-w-xl mx-auto text-lg">
          Design premium custom apparel and merch in seconds. Hazoom handles production and
          drop-shipping — you keep creating.
        </p>
        <div class="reveal flex flex-wrap gap-3 justify-center mt-7">
          <a href="/designer" data-link class="btn-primary btn-lg">Start designing</a>
          <a href="/shop" data-link class="btn-ghost btn-lg">Browse the shop</a>
        </div>
        <div class="reveal mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-dim)]">
          <span>✓ No upfront cost</span><span>✓ Worldwide shipping</span><span>✓ Eco-friendly inks</span>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="container-x py-12">
      <div class="reveal text-center mb-8">
        <p class="section-title-sm">How it works</p>
        <h2 class="display text-2xl md:text-3xl font-bold mt-2">From spark to shipped in three steps</h2>
      </div>
      <div class="grid md:grid-cols-3 gap-4">
        ${[
          ['1', 'Create', 'Use the Studio to add art, text, and colors on a live mockup.'],
          ['2', 'Customize', 'Pick products and finishes. We render a true-to-life preview.'],
          ['3', 'Drop-ship', 'Check out and we print + ship it to your customer, everywhere.'],
        ].map(([n, t, d]) => `
          <div class="reveal card p-6">
            <div class="w-10 h-10 rounded-full grid place-items-center btn-primary font-bold mb-3">${n}</div>
            <h3 class="font-semibold text-lg">${t}</h3>
            <p class="text-[var(--text-dim)] mt-1 text-sm">${d}</p>
          </div>`).join('')}
      </div>
    </section>

    <!-- FEATURED -->
    <section class="container-x py-10">
      <div class="reveal flex items-end justify-between mb-6">
        <div>
          <p class="section-title-sm">Trending now</p>
          <h2 class="display text-2xl md:text-3xl font-bold mt-2">Featured drops</h2>
        </div>
        <a href="/shop" data-link class="text-sm text-[var(--brand)] hover:underline hidden md:inline">View all →</a>
      </div>
      <div id="featured" class="grid-products">
        <div class="col-span-full flex justify-center py-12"><div class="spinner"></div></div>
      </div>
    </section>

    <!-- CATEGORIES -->
    <section class="container-x py-10">
      <div class="reveal text-center mb-6">
        <p class="section-title-sm">Collections</p>
        <h2 class="display text-2xl md:text-3xl font-bold mt-2">Find your canvas</h2>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${CATEGORIES.map((c) => `
          <a href="/shop?category=${c.key}" data-link class="reveal card p-6 text-center hover:border-[var(--brand)]">
            <div class="text-4xl mb-2">${c.emoji}</div>
            <h3 class="font-semibold">${c.label}</h3>
            <p class="text-[var(--text-dim)] text-sm mt-1">${c.blurb}</p>
          </a>`).join('')}
      </div>
    </section>

    <!-- CTA -->
    <section class="container-x py-14">
      <div class="reveal card p-10 text-center relative overflow-hidden">
        <div class="aurora" style="position:absolute;opacity:.5"></div>
        <h2 class="display text-2xl md:text-4xl font-bold relative">Ready to make something?</h2>
        <p class="text-[var(--text-dim)] mt-3 relative">Join Hazoom and turn your creativity into products people love.</p>
        <div class="relative mt-6 flex gap-3 justify-center">
          <a href="/designer" data-link class="btn-primary btn-lg">Open the Studio</a>
          <a href="/register" data-link class="btn-ghost btn-lg">Create account</a>
        </div>
      </div>
    </section>`;

  // Load featured products (first 8).
  try {
    const { products } = await window.api.get('/api/products');
    const grid = app.querySelector('#featured');
    const featured = (products || []).slice(0, 8);
    grid.innerHTML = featured.length
      ? featured.map(productCard).join('')
      : `<p class="col-span-full text-center text-[var(--text-dim)] py-12">No products yet.</p>`;
  } catch (err) {
    const grid = app.querySelector('#featured');
    if (grid) grid.innerHTML = `<p class="col-span-full text-center text-red-400 py-12">${err.message}</p>`;
  }
}

window.homeView = { renderHome };
