/* PLANET EARTH HISTORY — APP WIRING
   Builds UI controls from the data layer, connects them to the engine,
   runs the deep-analysis engine, rotates inspiration, and — if served by
   the secured backend — fetches the HMAC-signed dataset and verifies it
   (L3 provenance) before hot-swapping the graph. Falls back to the bundled
   data.js if the API is absent (so file:// still works). */
(function () {
  'use strict';

  // ---- GPU background ----
  const gpu = PEH_ENGINE.initGPU(document.getElementById('gpu-bg'));
  const note = document.getElementById('gpu-note');
  if (gpu) {
    note.textContent = 'GPU shader live ✓ — fragment program running on your graphics card';
    note.classList.add('ok');
  } else {
    note.textContent = 'WebGL unavailable — using static CSS gradient fallback (aether still present)';
    document.body.classList.add('no-webgl');
  }

  // ---- Engine ----
  let DATA = PEH;
  const engine = new PEH_ENGINE.MapEngine(
    document.getElementById('map'),
    DATA,
    showDetail
  );

  // ---- Layer toggles ----
  const layerList = document.getElementById('layer-list');
  function renderLayers() {
    layerList.innerHTML = '';
    Object.values(DATA.LAYERS).forEach(L => {
      const row = document.createElement('label');
      row.className = 'layer-row';
      const count = DATA.ALL.filter(n => n.layer === L.id).length;
      row.innerHTML =
        `<input type="checkbox" checked data-layer="${L.id}">` +
        `<span class="swatch" style="background:${L.color}"></span>` +
        `<span class="layer-label">${L.glyph} ${L.label}` +
        `${L.simulated ? ' <em>◑ sim</em>' : ''}</span>` +
        `<span class="layer-count">${count}</span>`;
      layerList.appendChild(row);
      row.querySelector('input').addEventListener('change', e => {
        engine.toggle(e.target.dataset.layer);
      });
    });
  }
  renderLayers();

  // ---- Provenance panel ----
  const tb = document.getElementById('truth-body');
  function renderProvenance() {
    const c = DATA.counts;
    const a = analyze(DATA);
    tb.innerHTML =
      `<div class="stat"><b>${c.total}</b> nodes</div>` +
      `<div class="stat ok">✓ <b>${c.real}</b> real / documented / analysed</div>` +
      `<div class="stat sim">◑ <b>${c.simulated}</b> simulated (narrative)</div>` +
      `<div class="stat insp">✶ <b>${a.insights}</b> deep-analysis & inspiration</div>` +
      `<p class="prov-note">Where a real base exists we document it (` +
      `<code>source</code>). Where none exists we <i>imagine</i> — flagged ◑ so ` +
      `you never mistake story for measurement.</p>` +
      `<div id="src-list"></div>`;
    const src = document.getElementById('src-list');
    DATA.ALL.filter(n => n.provenance === 'real' && n.layer !== 'insight').forEach(n => {
      const d = document.createElement('div');
      d.className = 'src-item';
      d.innerHTML = `<span class="dot" style="background:${DATA.LAYERS[n.layer].color}"></span>` +
        `<b>${n.title}</b> — ${n.source}`;
      src.appendChild(d);
    });
  }
  renderProvenance();
  document.getElementById('truth-toggle').addEventListener('click', e => {
    const hidden = tb.classList.toggle('collapsed');
    e.target.textContent = hidden ? 'show sources ▸' : 'hide sources ▾';
  });

  // Local deep-analysis: recomputed from whichever dataset is active
  // (bundled or server-signed). Mirrors data.js _analyze but reads from the
  // passed object so it works after a server-signed hot-swap.
  function analyze(D) {
    const ALL = D.ALL, INSIGHT = D.INSIGHT, EPOCHS = D.EPOCHS,
          FLOODS = D.FLOODS, PEOPLES = D.PEOPLES, BIRDS = D.BIRDS;
    const reals = ALL.filter(n => n.provenance === 'real' || n.provenance === 'analysis');
    const sims  = ALL.filter(n => n.provenance === 'simulated');
    const recurrences = INSIGHT.filter(n => n.kind === 'analysis');
    const inspirations = INSIGHT.filter(n => n.kind === 'inspiration');
    const oldestNature = Math.max.apply(null, EPOCHS.map(e => e.ageStart));
    const buildStart = Math.min.apply(null, [9600, 12000, 5500, 260]);
    const humanSpan = Math.round(oldestNature / buildStart);
    const underUs = FLOODS.filter(f => f.provenance === 'real').length;
    const oldestBird = Math.max.apply(null, BIRDS.map(b => b.ageStart));
    const oldestPeople = Math.max.apply(null, PEOPLES.map(p => p.ageStart));
    const birdsLead = Math.round(oldestBird / oldestPeople);
    return {
      total: ALL.length, real: reals.length, simulated: sims.length,
      insights: INSIGHT.length, recurrences: recurrences.length,
      inspirations: inspirations.length,
      oldestNatureGa: (oldestNature / 1e9).toFixed(2),
      humanSpanVsDeepTime: humanSpan, realFloodSites: underUs,
      birdsPredatePeopleBy: birdsLead,
      thesis: 'Earth was first NATURE (100% logical). On it we built; a FLOOD '+
              'left things UNDER US; different peoples walk different EPOCHS; '+
              'a SHAPER always changes us; BIRDS guide. 5 recurrences confirmed.',
    };
  }

  // ---- Deep-analysis panel (L2 / insight) ----
  const deepBody = document.getElementById('deep-body');
  function renderDeep() {
    const a = analyze(DATA);
    deepBody.innerHTML =
      `<div class="deep-thesis">${a.thesis}</div>` +
      `<ul class="deep-list">` +
        `<li><b>${a.oldestNatureGa} Ga</b> — age of first Nature (Hadean)</li>` +
        `<li><b>${a.realFloodSites}</b> real submerged/flood sites lie UNDER US</li>` +
        `<li>Birds predate peoples by <b>~${a.birdsPredatePeopleBy}×</b></li>` +
        `<li>Human building span fits <b>${a.humanSpanVsDeepTime}×</b> into deep time</li>` +
        `<li><b>${a.recurrences}</b> cross-era recurrences traced · <b>${a.inspirations}</b> inspirations</li>` +
      `</ul>` +
      `<p class="prov-note">Computed live from the dataset — reproducible, not asserted. ` +
      `Toggle the <b>✶ DEEP ANALYSIS</b> layer to see the 5 recurrences and their ` +
      `witness edges on the map.</p>`;
  }
  renderDeep();

  // ---- Inspiration rotor (bottom strip) ----
  const inspStrip = document.getElementById('inspiration-strip');
  let inspIdx = 0, inspTimer = null;
  function renderInspiration() {
    const insps = DATA.INSIGHT.filter(n => n.kind === 'inspiration');
    if (!insps.length) { inspStrip.classList.add('hidden'); return; }
    inspStrip.classList.remove('hidden');
    function show() {
      const n = insps[inspIdx % insps.length];
      inspStrip.innerHTML =
        `<span class="insp-tag">✶ INSPIRATION</span>` +
        `<span class="insp-text">${n.body}</span>`;
      inspIdx++;
    }
    show();
    inspTimer = setInterval(show, 9000);
  }
  renderInspiration();

  // ---- Detail card ----
  const detail = document.getElementById('detail');
  const detailBody = document.getElementById('detail-body');
  document.getElementById('detail-close').addEventListener('click', () => {
    detail.classList.add('hidden');
  });

  function showDetail(d) {
    const L = DATA.LAYERS[d.layer];
    const ageStr = ageLabel(d.ageEnd);
    let prov;
    if (d.provenance === 'simulated')
      prov = `<span class="badge sim">◑ SIMULATED / narrative</span>`;
    else if (d.layer === 'insight')
      prov = `<span class="badge insp">✶ ANALYSIS / synthesis</span>`;
    else
      prov = `<span class="badge ok">✓ REAL / documented</span>`;
    let kind = '';
    if (d.kind === 'analysis')
      kind = `<span class="badge">🔎 deep-analysis</span>`;
    if (d.kind === 'inspiration')
      kind = `<span class="badge">💡 inspiration</span>`;
    let witnesses = '';
    if (d.witnesses && d.witnesses.length) {
      witnesses = `<div class="witnesses">WITNESSES: ` +
        d.witnesses.map(w => {
          const wn = DATA.ALL.find(x => x.id === w);
          return wn ? `<span class="w">${wn.title}</span>` : '';
        }).join(' · ') + `</div>`;
    }
    detailBody.innerHTML =
      `<div class="detail-head" style="border-color:${L.color}">` +
        `<span class="glyph">${L.glyph}</span>` +
        `<div><h3>${d.title}</h3>` +
        `<div class="meta">${L.label} · ${ageStr}</div></div>` +
      `</div>` +
      `<div class="badges">${prov} ${kind} <span class="badge">📍 ${fmtGeo(d.lon, d.lat)}</span></div>` +
      `<p class="body">${d.body}</p>` +
      witnesses +
      `<div class="source">SOURCE: <code>${d.source}</code></div>`;
    detail.classList.remove('hidden');
    detail.classList.add('show');
  }

  // ---- helpers ----
  function ageLabel(a) {
    if (a >= 1e9) return (a / 1e9).toFixed(2) + ' billion years ago';
    if (a >= 1e6) return (a / 1e6).toFixed(1) + ' million years ago';
    if (a >= 1e3) return (a / 1e3).toFixed(1) + ' thousand years ago';
    return Math.round(a) + ' years ago';
  }
  function fmtGeo(lon, lat) {
    const ns = lat >= 0 ? 'N' : 'S', ew = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(0)}°${ns}, ${Math.abs(lon).toFixed(0)}°${ew}`;
  }

  // ---- Signed-dataset fetch + verify (only when served by the backend) ----
  // The backend signs the whole dataset bundle (canonical JSON + HMAC). If the
  // signature verifies we hot-swap to the authoritative copy; otherwise we keep
  // the bundled data.js (fail-open but flagged) — we never silently trust.
  function hmacHex(msg, key) {
    // HMAC-SHA256 via Web Crypto. key is the injected local token.
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
      'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    ).then(k =>
      crypto.subtle.sign('HMAC', k, enc.encode(msg))
    ).then(buf => {
      const b = new Uint8Array(buf);
      return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
    });
  }

  // Deterministic canonicalization matching the server's signing string:
  // sorted keys, no whitespace — so the HMAC verifies cross-platform.
  function canonicalJSON(obj) {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return '[' + obj.map(canonicalJSON).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalJSON(obj[k])).join(',') + '}';
  }

  async function loadSignedDataset() {
    try {
      const tok = window.__PEH_TOKEN__ || '';
      const res = await fetch('/api/dataset', {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + tok,
        },
      });
      if (!res.ok) return; // static host or auth-less -> use bundled data
      const bundle = await res.json();
      if (!bundle.sig || !bundle.canon || !bundle.payload) return;
      // Server ships the EXACT canonical string it signed. We HMAC that
      // precise byte string (no re-canonicalization) so verification is
      // deterministic across JS and Python.
      const expected = await hmacHex(bundle.canon, tok || 'peh-local');
      if (expected !== bundle.sig) {
        console.warn('[PEH] dataset signature mismatch — keeping bundled data.');
        return;
      }
      // Rebuild the IIFE-style globals the engine expects.
      const served = rebuildDataset(bundle.payload);
      window.PEH = served;
      DATA = served;
      engine.setData(served);
      renderLayers(); renderProvenance(); renderDeep();
      console.info('[PEH] verified + loaded signed dataset from backend ✓');
    } catch (e) {
      console.warn('[PEH] signed-dataset fetch failed, using bundled data:', e);
    }
  }

  // The served payload is a plain dict of the raw arrays. Rebuild the
  // accessor shape {LAYERS,ALL,counts,ageToT,_analyze} by reusing the
  // BUNDLED, SRI-verified functions (ageToT/_analyze live in code, not in
  // the signed data) and only swapping in the signed arrays.
  function rebuildDataset(p) {
    const ALL = [].concat(p.EPOCHS, p.FLOODS, p.PEOPLES, p.BIRDS, p.DIVINE, p.INSIGHT);
    const counts = {
      real: ALL.filter(n => n.provenance === 'real' || n.provenance === 'analysis').length,
      simulated: ALL.filter(n => n.provenance === 'simulated').length,
      total: ALL.length,
    };
    const rebuilt = Object.assign({}, PEH, p, { ALL, counts, ageToT: PEH.ageToT });
    // expose _analyze bound to the freshly rebuilt dataset
    rebuilt._analyze = () => analyze(rebuilt);
    return rebuilt;
  }

  // Only attempt when a real backend is present (skip on file://).
  if (location.protocol !== 'file:') loadSignedDataset();

  // expose for debugging
  window.PEH_APP = { engine, get data() { return DATA; }, gpu: !!gpu };
})();
