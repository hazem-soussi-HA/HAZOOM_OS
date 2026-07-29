/**
 * js/products.js — Catalog, product detail, and cart views.
 *
 * Renders:
 *  - renderShop(app)        : grid + category filter + search box
 *  - renderProduct(app, id) : detail page w/ image gallery + "add to cart"
 *  - renderCart(app)        : cart view + checkout button
 */

const CATEGORY_LABELS = {
  tshirt: 'T-Shirt', mug: 'Mug', hoodie: 'Hoodie', phonecase: 'Phone Case',
};

function money(cents) {
  return '$' + (cents / 100).toFixed(2);
}

function productCard(p) {
  const img = (p.images && p.images[0]) || p.mockupUrl || 'https://placehold.co/400x400?text=Hazoom';
  return `
    <a href="/product/${p.id}" data-link class="card product-card">
      <div class="thumb"><span class="badge">${CATEGORY_LABELS[p.category] || p.category}</span><img src="${img}" alt="${p.title}" loading="lazy" /></div>
      <div class="p-4">
        <h3 class="font-semibold truncate">${p.title}</h3>
        <div class="flex items-center justify-between mt-2">
          <span class="font-bold gradient-text">${money(p.basePrice)}</span>
          <span class="text-xs text-[var(--text-dim)]">Customize →</span>
        </div>
      </div>
    </a>`;
}

async function renderShop(app) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const initialCat = params.get('category') || '';
  app.innerHTML = `
    <section class="container-x py-10 fade-in">
      <div class="reveal text-center mb-8">
        <p class="section-title-sm">The collection</p>
        <h1 class="display text-3xl md:text-4xl font-bold mt-2">Shop every canvas</h1>
      </div>
      <div class="reveal flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <input id="search" placeholder="Search products…" class="field md:max-w-xs" />
        <select id="category" class="field md:ml-auto md:max-w-[200px]">
          <option value="">All categories</option>
          <option value="tshirt" ${initialCat==='tshirt'?'selected':''}>T-Shirts</option>
          <option value="mug" ${initialCat==='mug'?'selected':''}>Mugs</option>
          <option value="hoodie" ${initialCat==='hoodie'?'selected':''}>Hoodies</option>
          <option value="phonecase" ${initialCat==='phonecase'?'selected':''}>Phone Cases</option>
        </select>
      </div>
      <div id="grid" class="grid-products">
        <div class="col-span-full flex justify-center py-12"><div class="spinner"></div></div>
      </div>
    </section>`;

  const grid = app.querySelector('#grid');
  const load = async () => {
    const cat = app.querySelector('#category').value;
    const q = app.querySelector('#search').value.trim();
    grid.innerHTML = `<div class="col-span-full flex justify-center py-12"><div class="spinner"></div></div>`;
    try {
      const params = new URLSearchParams();
      if (cat) params.set('category', cat);
      if (q) params.set('search', q);
      const { products } = await window.api.get(`/api/products?${params}`);  // same-origin
      if (!products.length) {
        grid.innerHTML = `<p class="col-span-full text-center text-slate-500 py-12">No products found.</p>`;
        return;
      }
      grid.innerHTML = products.map(productCard).join('');
    } catch (err) {
      grid.innerHTML = `<p class="col-span-full text-center text-red-500 py-12">${err.message}</p>`;
    }
  };

  app.querySelector('#category').addEventListener('change', load);
  app.querySelector('#search').addEventListener('input', debounce(load, 300));
  if (window.__lastShop) { /* keep */ }
  load();
}

async function renderProduct(app, id) {
  app.innerHTML = `<div class="flex justify-center py-20"><div class="spinner"></div></div>`;
  try {
    const { product } = await window.api.get(`/api/products/${id}`);
    const gallery = (product.images && product.images.length ? product.images : [product.mockupUrl]).filter(Boolean);

    app.innerHTML = `
      <section class="max-w-5xl mx-auto px-4 py-8 fade-in grid md:grid-cols-2 gap-8">
        <div>
          <div class="card rounded-xl overflow-hidden aspect-square bg-slate-100 dark:bg-slate-800">
            <img id="mainImg" src="${gallery[0]}" alt="${product.title}" class="w-full h-full object-cover" />
          </div>
          <div class="flex gap-2 mt-3">
            ${gallery.map((g, i) => `<img src="${g}" data-i="${i}" class="thumb w-16 h-16 rounded-lg object-cover cursor-pointer border-2 ${i===0?'border-brand-600':'border-transparent'}" />`).join('')}
          </div>
        </div>
        <div>
          <span class="text-xs uppercase tracking-wide text-brand-600 dark:text-brand-300">${CATEGORY_LABELS[product.category] || product.category}</span>
          <h1 class="text-3xl font-bold mt-1">${product.title}</h1>
          <p class="text-2xl font-bold mt-3">${money(product.basePrice)}</p>
          <p class="text-slate-600 dark:text-slate-300 mt-3">${product.description || ''}</p>

          <div class="mt-5" id="colorWrap">
            <p class="text-sm font-semibold mb-2">Color</p>
            <div class="flex gap-2">
              ${(product.colors && product.colors.length ? product.colors : ['#000000']).map((c) =>
                `<button class="w-8 h-8 rounded-full border-2 border-slate-300 color-btn" style="background:${c}" data-color="${c}"></button>`).join('')}
            </div>
          </div>

          <div class="mt-5 flex items-center gap-3">
            <label class="text-sm font-semibold">Qty</label>
            <input id="qty" type="number" min="1" value="1" class="field w-20" />
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <button id="addCart" class="btn-primary px-6 py-3 rounded-lg font-semibold">Add to cart</button>
            <a href="/designer?product=${product.id}" data-link class="px-6 py-3 rounded-lg border border-brand-600 text-brand-600 dark:text-brand-300 font-semibold hover:bg-brand-600 hover:text-white">Customize</a>
          </div>
        </div>
      </section>`;

    let selectedColor = product.colors?.[0] || '#000000';
    app.querySelectorAll('.color-btn').forEach((b) => {
      b.addEventListener('click', () => {
        selectedColor = b.dataset.color;
        app.querySelectorAll('.color-btn').forEach((x) => x.classList.remove('border-brand-600'));
        b.classList.add('border-brand-600');
      });
    });
    app.querySelectorAll('.thumb').forEach((t) => {
      t.addEventListener('click', () => {
        app.querySelector('#mainImg').src = t.src;
        app.querySelectorAll('.thumb').forEach((x) => x.classList.remove('border-brand-600'));
        t.classList.add('border-brand-600');
      });
    });
    app.querySelector('#addCart').addEventListener('click', () => {
      const qty = Math.max(1, parseInt(app.querySelector('#qty').value, 10) || 1);
      window.cart.add({
        productId: product.id,
        title: product.title,
        price: product.basePrice,
        quantity: qty,
        color: selectedColor,
        image: gallery[0],
        design: null,
      });
    });
  } catch (err) {
    app.innerHTML = `<p class="text-center text-red-500 py-20">${err.message}</p>`;
  }
}

function renderCart(app) {
  const items = window.cart.items;
  app.innerHTML = `
    <section class="max-w-3xl mx-auto px-4 py-8 fade-in">
      <h1 class="text-2xl font-bold mb-6">Your cart</h1>
      <div id="cartBody"></div>
    </section>`;
  const body = app.querySelector('#cartBody');

  if (!items.length) {
    body.innerHTML = `<div class="card rounded-xl p-8 text-center text-slate-500">Your cart is empty. <a href="/" data-link class="text-brand-600">Go shopping →</a></div>`;
    return;
  }

  body.innerHTML = `
    <div class="space-y-3">
      ${items.map((i, idx) => `
        <div class="card rounded-xl p-4 flex items-center gap-4">
          <img src="${i.image || 'https://placehold.co/80x80'}" class="w-16 h-16 rounded-lg object-cover" />
          <div class="flex-1">
            <p class="font-semibold">${i.title}</p>
            <p class="text-sm text-slate-500">Color: <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${i.color};vertical-align:middle"></span></p>
            ${i.design ? '<p class="text-xs text-brand-600">Custom design ✓</p>' : ''}
          </div>
          <div class="flex items-center gap-2">
            <button class="qty-dec px-2 py-1 rounded bg-slate-200 dark:bg-slate-700" data-i="${idx}">−</button>
            <span class="w-6 text-center">${i.quantity}</span>
            <button class="qty-inc px-2 py-1 rounded bg-slate-200 dark:bg-slate-700" data-i="${idx}">+</button>
          </div>
          <p class="w-20 text-right font-semibold">${money(i.price * i.quantity)}</p>
          <button class="rm text-red-500 px-2" data-i="${idx}">✕</button>
        </div>`).join('')}
    </div>
    <div class="card rounded-xl p-4 mt-4 flex items-center justify-between">
      <span class="text-lg font-bold">Subtotal: ${money(window.cart.subtotal())}</span>
      <a href="/checkout" data-link class="btn-primary px-6 py-3 rounded-lg font-semibold">Checkout</a>
    </div>`;

  body.querySelectorAll('.qty-dec').forEach((b) => b.addEventListener('click', () => window.cart.setQty(+b.dataset.i, items[+b.dataset.i].quantity - 1)));
  body.querySelectorAll('.qty-inc').forEach((b) => b.addEventListener('click', () => window.cart.setQty(+b.dataset.i, items[+b.dataset.i].quantity + 1)));
  body.querySelectorAll('.rm').forEach((b) => b.addEventListener('click', () => window.cart.remove(+b.dataset.i)));
}

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

window.productsView = { renderShop, renderProduct, renderCart, CATEGORY_LABELS, money };
