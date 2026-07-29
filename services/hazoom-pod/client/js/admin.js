/**
 * js/admin.js — Admin dashboard: orders, products, analytics.
 *
 * Mounted by the SPA router when visiting #/admin. Requires an admin JWT;
 * non-admins are redirected to the shop.
 */

async function renderAdmin(app) {
  if (!window.auth.isAdmin()) {
    app.innerHTML = `<div class="max-w-md mx-auto px-4 py-20 text-center text-slate-500">Admins only. <a href="/login" data-link class="text-brand-600">Log in</a>.</div>`;
    return;
  }

  app.innerHTML = `
    <section class="max-w-6xl mx-auto px-4 py-8 fade-in">
      <h1 class="text-2xl font-bold mb-2">Admin dashboard</h1>

      <div id="stats" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"></div>

      <div class="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-4">
        <button class="tab-btn px-4 py-2 font-semibold border-b-2 border-brand-600" data-tab="orders">Orders</button>
        <button class="tab-btn px-4 py-2 font-semibold" data-tab="products">Products</button>
      </div>

      <div id="tabOrders"></div>
      <div id="tabProducts" class="hidden"></div>
    </section>`;

  // ---- Stats ----
  try {
    const stats = await window.api.get('/api/orders/analytics/metrics');
    app.querySelector('#stats').innerHTML = `
      <div class="card rounded-xl p-4"><p class="text-xs text-slate-500">Total orders</p><p class="text-2xl font-bold">${stats.totalOrders}</p></div>
      <div class="card rounded-xl p-4"><p class="text-xs text-slate-500">Revenue</p><p class="text-2xl font-bold">$${(stats.totalRevenue/100).toFixed(2)}</p></div>
      <div class="card rounded-xl p-4"><p class="text-xs text-slate-500">Fulfilled</p><p class="text-2xl font-bold">${stats.byStatus.find(s=>s.status==='fulfilled')?.count||0}</p></div>
      <div class="card rounded-xl p-4"><p class="text-xs text-slate-500">Pending</p><p class="text-2xl font-bold">${stats.byStatus.find(s=>s.status==='pending')?.count||0}</p></div>`;
  } catch (err) { /* non-fatal */ }

  // ---- Tabs ----
  const tabOrders = app.querySelector('#tabOrders');
  const tabProducts = app.querySelector('#tabProducts');
  app.querySelectorAll('.tab-btn').forEach((b) => {
    b.addEventListener('click', () => {
      app.querySelectorAll('.tab-btn').forEach((x) => x.classList.remove('border-brand-600'));
      b.classList.add('border-brand-600');
      const tab = b.dataset.tab;
      tabOrders.classList.toggle('hidden', tab !== 'orders');
      tabProducts.classList.toggle('hidden', tab !== 'products');
    });
  });

  // ---- Orders tab ----
  async function loadOrders() {
    tabOrders.innerHTML = `<div class="flex justify-center py-8"><div class="spinner"></div></div>`;
    try {
      const { orders } = await window.api.get('/api/orders/all/list');
      if (!orders.length) { tabOrders.innerHTML = `<p class="text-slate-500 py-6">No orders yet.</p>`; return; }
      tabOrders.innerHTML = `
        <div class="overflow-x-auto">
        <table class="w-full text-sm card rounded-xl overflow-hidden">
          <thead class="bg-slate-100 dark:bg-slate-800 text-left">
            <tr><th class="p-3">Order</th><th class="p-3">Customer</th><th class="p-3">Total</th><th class="p-3">Status</th><th class="p-3">Action</th></tr>
          </thead>
          <tbody>
            ${orders.map((o) => `
              <tr class="border-t border-slate-200 dark:border-slate-700">
                <td class="p-3 font-mono text-xs">${o.id.slice(0,8)}</td>
                <td class="p-3">${o.email || '—'}</td>
                <td class="p-3">$${(o.total/100).toFixed(2)}</td>
                <td class="p-3"><select class="status-sel field py-1" data-id="${o.id}">
                  ${['pending','paid','fulfilled','shipped','delivered','cancelled'].map((s)=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}
                </select></td>
                <td class="p-3"><button class="fulfill-btn btn-primary px-3 py-1 rounded text-xs" data-id="${o.id}">Fulfill</button></td>
              </tr>`).join('')}
          </tbody>
        </table></div>`;

      tabOrders.querySelectorAll('.status-sel').forEach((sel) => {
        sel.addEventListener('change', async () => {
          try {
            await window.api.patch(`/api/orders/${sel.dataset.id}/status`, { status: sel.value });
            window.hazoomToast('Status updated');
          } catch (e) { window.hazoomToast(e.message, true); }
        });
      });
      tabOrders.querySelectorAll('.fulfill-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          btn.disabled = true; btn.textContent = '…';
          try {
            await window.api.post(`/api/orders/${btn.dataset.id}/fulfill`);
            window.hazoomToast('Sent to Printify');
            loadOrders(); loadStats();
          } catch (e) { window.hazoomToast(e.message, true); btn.disabled=false; btn.textContent='Fulfill'; }
        });
      });
    } catch (err) { tabOrders.innerHTML = `<p class="text-red-500 py-6">${err.message}</p>`; }
  }

  // ---- Products tab ----
  async function loadProducts() {
    tabProducts.innerHTML = `<div class="flex justify-center py-8"><div class="spinner"></div></div>`;
    try {
      const { products } = await window.api.get('/api/products');
      tabProducts.innerHTML = `
        <div class="mb-3"><button id="addProd" class="btn-primary px-4 py-2 rounded-lg text-sm">+ New product</button></div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          ${products.map((p) => `
            <div class="card rounded-xl p-3">
              <img src="${p.images?.[0]||p.mockupUrl}" class="w-full h-32 object-cover rounded-lg" />
              <p class="font-semibold mt-2">${p.title}</p>
              <p class="text-xs text-slate-500">$${(p.basePrice/100).toFixed(2)} · ${p.category}</p>
              <div class="flex gap-2 mt-2">
                <button class="del-prod text-red-500 text-xs" data-id="${p.id}">Delete</button>
              </div>
            </div>`).join('')}
        </div>`;
      tabProducts.querySelector('#addProd').addEventListener('click', () => openProductModal());
      tabProducts.querySelectorAll('.del-prod').forEach((b) => {
        b.addEventListener('click', async () => {
          if (!confirm('Delete this product?')) return;
          try { await window.api.del(`/api/products/${b.dataset.id}`); window.hazoomToast('Deleted'); loadProducts(); }
          catch (e) { window.hazoomToast(e.message, true); }
        });
      });
    } catch (err) { tabProducts.innerHTML = `<p class="text-red-500 py-6">${err.message}</p>`; }
  }

  function openProductModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="card rounded-xl p-5 w-full max-w-md space-y-3">
        <h3 class="font-bold">New product</h3>
        <input id="pTitle" class="field" placeholder="Title" />
        <textarea id="pDesc" class="field" placeholder="Description"></textarea>
        <select id="pCat" class="field">
          <option value="tshirt">T-Shirt</option><option value="mug">Mug</option>
          <option value="hoodie">Hoodie</option><option value="phonecase">Phone Case</option>
        </select>
        <input id="pPrice" type="number" step="0.01" class="field" placeholder="Price (USD)" />
        <input id="pImg" class="field" placeholder="Image URL" />
        <div class="flex gap-2 justify-end">
          <button id="pCancel" class="px-4 py-2 rounded-lg">Cancel</button>
          <button id="pSave" class="btn-primary px-4 py-2 rounded-lg">Save</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#pCancel').addEventListener('click', () => modal.remove());
    modal.querySelector('#pSave').addEventListener('click', async () => {
      try {
        await window.api.post('/api/products', {
          title: modal.querySelector('#pTitle').value,
          description: modal.querySelector('#pDesc').value,
          category: modal.querySelector('#pCat').value,
          basePrice: Math.round(parseFloat(modal.querySelector('#pPrice').value||'0')*100),
          images: [modal.querySelector('#pImg').value].filter(Boolean),
          mockupUrl: modal.querySelector('#pImg').value,
        });
        modal.remove(); window.hazoomToast('Product created'); loadProducts();
      } catch (e) { window.hazoomToast(e.message, true); }
    });
  }

  loadOrders();
  loadProducts();
}

window.renderAdmin = renderAdmin;
