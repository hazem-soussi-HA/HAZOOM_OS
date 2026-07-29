/**
 * js/designer.js — Design Studio: simple canvas-based product customizer.
 *
 * Features:
 *  - Pick a product (mockup) to print on.
 *  - Upload an image or add text layers.
 *  - Drag/select layers; change text color; delete layers.
 *  - Live preview rendered onto the product mockup.
 *  - "Add to cart" packages the composed design as a cart item.
 *
 * The composition is stored as a JSON `design` object attached to the cart
 * item, which the backend echoes into the order's designRef. (A real
 * integration would rasterize this for Printify's asset API.)
 */

async function renderDesigner(app) {
  // Load products so the user can pick a base product.
  let products = [];
  try {
    const data = await window.api.get('/api/products');
    products = data.products || [];
  } catch { /* ignore */ }

  const preselected = new URLSearchParams(location.search).get('product');
  const initial = products.find((p) => p.id === preselected) || products[0];

  app.innerHTML = `
    <section class="max-w-6xl mx-auto px-4 py-8 fade-in grid lg:grid-cols-2 gap-6">
      <div>
        <h1 class="text-2xl font-bold mb-4">Design Studio</h1>
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <select id="productPick" class="field max-w-xs">
            ${products.map((p) => `<option value="${p.id}" ${p.id===initial?.id?'selected':''}>${p.title}</option>`).join('')}
          </select>
          <button id="addText" class="btn-primary px-3 py-2 rounded-lg text-sm">+ Add text</button>
          <label class="btn-primary px-3 py-2 rounded-lg text-sm cursor-pointer">
            + Upload image<input id="uploadImg" type="file" accept="image/*" class="hidden" />
          </label>
        </div>

        <div class="flex flex-wrap items-center gap-2 mb-3">
          <div class="inline-flex rounded-lg overflow-hidden border border-[var(--border)] text-sm">
            <button id="view2d" class="px-3 py-1.5 bg-brand text-white">2D</button>
            <button id="view3d" class="px-3 py-1.5">3D</button>
          </div>
          <select id="shapePick" class="field max-w-[10rem] hidden">
            <option value="tshirt">T-shirt</option>
            <option value="mug">Mug</option>
            <option value="cap">Cap</option>
          </select>
          <label id="rotateWrap" class="text-sm items-center gap-1 hidden">
            <input id="autoRotate" type="checkbox" class="align-middle" /> Auto-rotate
          </label>
        </div>

        <div class="relative mx-auto" style="max-width:420px">
          <div id="stage2d" class="relative">
            <img id="mockup" src="${initial?.mockupUrl || 'https://placehold.co/400x500?text=Mockup'}" crossorigin="anonymous" class="w-full rounded-xl" />
            <div id="designCanvas" class="absolute inset-0"></div>
          </div>
          <div id="stage3d" class="hidden rounded-xl overflow-hidden bg-black/20" style="min-height:460px"></div>
        </div>

        <div class="mt-3 flex items-center gap-3">
          <label class="text-sm">Selected color:</label>
          <input id="colorPicker" type="color" value="#111827" class="w-10 h-10 rounded bg-transparent border-0" />
          <button id="deleteLayer" class="px-3 py-1.5 rounded-lg border border-red-500 text-red-500 text-sm">Delete layer</button>
        </div>
      </div>

      <div class="card rounded-xl p-5 h-fit">
        <h2 class="font-bold mb-2">Your design</h2>
        <p class="text-sm text-slate-500 mb-3">Drag layers to position. Add text or upload an image, pick a color, then add the design to your cart.</p>
        <div id="layerList" class="space-y-1 text-sm mb-4"></div>
        <div class="flex items-center gap-3">
          <span class="font-semibold" id="priceLabel">${initial ? '$' + (initial.basePrice/100).toFixed(2) : ''}</span>
          <button id="addToCart" class="btn-primary px-5 py-2.5 rounded-lg font-semibold ml-auto">Add to cart</button>
        </div>
      </div>
    </section>`;

  const canvas = app.querySelector('#designCanvas');
  const mockup = app.querySelector('#mockup');
  const colorPicker = app.querySelector('#colorPicker');
  const layerList = app.querySelector('#layerList');
  const priceLabel = app.querySelector('#priceLabel');
  const productPick = app.querySelector('#productPick');

  let layers = [];
  let selectedId = null;
  let idc = 0;

  // ---- 3D preview state ----
  let ctrl3d = null;
  let is3d = false;
  const stage2d = app.querySelector('#stage2d');
  const stage3d = app.querySelector('#stage3d');
  const view2dBtn = app.querySelector('#view2d');
  const view3dBtn = app.querySelector('#view3d');
  const shapePick = app.querySelector('#shapePick');
  const rotateWrap = app.querySelector('#rotateWrap');
  const autoRotate = app.querySelector('#autoRotate');

  // Composite the current design onto a square garment-surface texture.
  // The texture's chest window maps onto the 3D shirt via UVs, so we paint a
  // fabric-colored base (derived from the product swatch) and put the design
  // on top. We don't stamp the flat 2D mockup on the 3D garment.
  function fabricColorFromMockup() {
    // Seeded mockups use placehold.co/.../WxH/BGHEX/FGHEX — reuse the BG swatch.
    const m = (mockup.src || '').match(/placehold\.co\/\d+x\d+\/([0-9a-fA-F]{6})/);
    return m ? '#' + m[1] : '#e7e5e4';
  }
  function paintTexture(ctx, size) {
    // Fabric base color.
    ctx.fillStyle = fabricColorFromMockup();
    ctx.fillRect(0, 0, size, size);
    // Subtle vertical shading so the 3D shirt reads as fabric, not flat.
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, 'rgba(255,255,255,0.10)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.10)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // The 2D stage is ~420x525; map layer coords (px) into the texture.
    const stageW = 420, stageH = 525;
    const sx = size / stageW, sy = size / stageH;
    layers.forEach((layer) => {
      const x = layer.x * sx, y = layer.y * sy;
      if (layer.type === 'text') {
        ctx.fillStyle = layer.color || '#111827';
        ctx.font = `700 ${(layer.fontSize || 24) * sy}px system-ui, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(layer.text || '', x, y);
      } else if (layer.type === 'image' && layer._img && layer._img.complete) {
        const w = (layer.w || 120) * sx;
        const ratio = layer._img.naturalHeight / (layer._img.naturalWidth || 1);
        try { ctx.drawImage(layer._img, x, y, w, w * ratio); } catch { /* ignore */ }
      }
    });
  }

  function repaint3D() {
    if (is3d && ctrl3d) ctrl3d.paint(paintTexture);
  }

  function ensure3d() {
    if (ctrl3d || !window.hazoom3D) return;
    ctrl3d = window.hazoom3D.init(stage3d, { shape: shapePick.value, height: 460 });
    repaint3D();
  }

  function setView(threeD) {
    is3d = threeD;
    stage2d.classList.toggle('hidden', threeD);
    stage3d.classList.toggle('hidden', !threeD);
    shapePick.classList.toggle('hidden', !threeD);
    rotateWrap.classList.toggle('hidden', !threeD);
    rotateWrap.classList.toggle('flex', threeD);
    view3dBtn.classList.toggle('bg-brand', threeD);
    view3dBtn.classList.toggle('text-white', threeD);
    view2dBtn.classList.toggle('bg-brand', !threeD);
    view2dBtn.classList.toggle('text-white', !threeD);
    if (threeD) { ensure3d(); repaint3D(); }
  }

  view2dBtn.addEventListener('click', () => setView(false));
  view3dBtn.addEventListener('click', () => {
    if (!window.hazoom3D) return window.hazoomToast('3D engine still loading — try again in a moment', true);
    setView(true);
  });
  shapePick.addEventListener('change', () => { if (ctrl3d) ctrl3d.setShape(shapePick.value); repaint3D(); });
  autoRotate.addEventListener('change', () => { if (ctrl3d) ctrl3d.setAutoRotate(autoRotate.checked); });

  function renderMockup() {
    const p = products.find((x) => x.id === productPick.value);
    if (p) {
      mockup.src = p.mockupUrl || 'https://placehold.co/400x500?text=Mockup';
      priceLabel.textContent = '$' + (p.basePrice / 100).toFixed(2);
    }
  }
  productPick.addEventListener('change', renderMockup);
  mockup.addEventListener('load', repaint3D);

  function renderLayers() {
    canvas.querySelectorAll('.design-layer').forEach((el) => el.remove());
    layerList.innerHTML = '';
    layers.forEach((layer) => {
      const el = document.createElement('div');
      el.className = 'design-layer' + (layer.id === selectedId ? ' selected' : '');
      el.dataset.id = layer.id;
      el.style.left = layer.x + 'px';
      el.style.top = layer.y + 'px';
      el.style.color = layer.color;
      el.style.fontSize = (layer.fontSize || 24) + 'px';
      el.style.fontWeight = '700';
      el.style.maxWidth = '380px';
      el.style.textAlign = 'center';
      if (layer.type === 'text') {
        el.textContent = layer.text;
      } else {
        const img = document.createElement('img');
        img.src = layer.src;
        img.style.width = (layer.w || 120) + 'px';
        el.appendChild(img);
      }
      canvas.appendChild(el);
      attachDrag(el, layer);

      const li = document.createElement('div');
      li.className = 'flex items-center justify-between py-1 px-2 rounded ' + (layer.id === selectedId ? 'bg-slate-200 dark:bg-slate-700' : '');
      li.innerHTML = `<span>${layer.type === 'text' ? '“' + (layer.text||'Text') + '”' : 'Image'}</span>`;
      li.addEventListener('click', () => { selectedId = layer.id; renderLayers(); });
      layerList.appendChild(li);
    });
    repaint3D();
  }

  function attachDrag(el, layer) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      selectedId = layer.id;
      const rect = canvas.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - layer.x;
      const offsetY = e.clientY - rect.top - layer.y;
      el.setPointerCapture(e.pointerId);
      const move = (ev) => {
        layer.x = Math.max(0, Math.min(rect.width - 20, ev.clientX - rect.left - offsetX));
        layer.y = Math.max(0, Math.min(rect.height - 20, ev.clientY - rect.top - offsetY));
        el.style.left = layer.x + 'px';
        el.style.top = layer.y + 'px';
        repaint3D();
      };
      const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      renderLayers();
    });
  }

  app.querySelector('#addText').addEventListener('click', () => {
    const id = ++idc;
    layers.push({ id, type: 'text', text: 'Your text', x: 120, y: 180, color: colorPicker.value, fontSize: 28 });
    selectedId = id;
    renderLayers();
  });

  app.querySelector('#uploadImg').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const id = ++idc;
      const _img = new Image();
      _img.onload = repaint3D;
      _img.src = reader.result;
      layers.push({ id, type: 'image', src: reader.result, x: 130, y: 150, w: 140, _img });
      selectedId = id;
      renderLayers();
    };
    reader.readAsDataURL(file);
  });

  colorPicker.addEventListener('input', () => {
    const layer = layers.find((l) => l.id === selectedId);
    if (layer && layer.type === 'text') { layer.color = colorPicker.value; renderLayers(); }
  });

  app.querySelector('#deleteLayer').addEventListener('click', () => {
    layers = layers.filter((l) => l.id !== selectedId);
    selectedId = null;
    renderLayers();
  });

  app.querySelector('#addToCart').addEventListener('click', () => {
    const p = products.find((x) => x.id === productPick.value);
    if (!p) return window.hazoomToast('Pick a product first', true);
    const cleanLayers = layers.map(({ _img, ...rest }) => rest);
    window.cart.add({
      productId: p.id,
      title: p.title + ' (Custom)',
      price: p.basePrice,
      quantity: 1,
      color: '#custom',
      image: p.mockupUrl,
      design: { layers: cleanLayers, productId: p.id, view: is3d ? '3d' : '2d', shape: shapePick.value },
    });
    setTimeout(() => { location.hash = '/cart'; }, 400);
  });

  renderMockup();
  renderLayers();
}

window.designerView = { renderDesigner };
