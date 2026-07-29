/* =====================================================================
   PLANET EARTH HISTORY — GPU + ENGINE
   ---------------------------------------------------------------------
   GPU layer: a WebGL fragment shader (the GPU's own instruction stream)
   renders the living "aether / first nature" background. If WebGL is
   unavailable it degrades to a static CSS gradient (fail-soft).
   Engine: an OOP, dirty-flag Canvas2D time-map. Redraws only when
   something changes; static geometry is cached on an offscreen canvas.
   ===================================================================== */
const PEH_ENGINE = (function () {
  'use strict';

  /* ----------------------------- GPU -------------------------------- */
  // Minimal WebGL bootstrap; the interesting part is the fragment shader.
  const VERT = 'attribute vec2 p; void main(){ gl_Position=vec4(p,0.0,1.0); }';
  const FRAG =
  'precision highp float;' +
  'uniform vec2 u_res;' +
  'uniform float u_time;' +
  // hash / noise helpers
  'float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }' +
  'float noise(vec2 p){' +
  '  vec2 i=floor(p), f=fract(p);' +
  '  float a=hash(i), b=hash(i+vec2(1.0,0.0)), c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));' +
  '  vec2 u=f*f*(3.0-2.0*f);' +
  '  return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;' +
  '}' +
  'float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; } return v; }' +
  'void main(){' +
  '  vec2 uv=gl_FragCoord.xy/u_res.xy;' +
  '  float t=u_time*0.03;' +
  // flowing aether: domain-warped fbm
  '  vec2 q=vec2(fbm(uv*3.0+t), fbm(uv*3.0-t+5.2));' +
  '  float n=fbm(uv*4.0 + q*1.5 + t*0.5);' +
  // palette: deep night-green of "first nature"
  '  vec3 deep=vec3(0.02,0.06,0.05);' +
  '  vec3 mid =vec3(0.03,0.18,0.13);' +
  '  vec3 glow=vec3(0.10,0.55,0.35);' +
  '  vec3 col=mix(deep, mid, smoothstep(0.2,0.7,n));' +
  '  col+=glow*pow(n,3.0)*0.6;' +
  // faint vertical column light (the time axis)
  '  float col_axis=smoothstep(0.0,0.02,0.02-abs(uv.x-0.5));' +
  '  col+=vec3(0.05,0.12,0.09)*col_axis*0.4;' +
  '  gl_FragColor=vec4(col,1.0);' +
  '}';

  function initGPU(canvas) {
    let gl = null;
    try { gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl'); }
    catch (e) { gl = null; }
    if (!gl) return null;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        return null;
      return s;
    }
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    const t0 = performance.now();
    function frame() {
      gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return gl; // truth: GPU program is live
  }

  /* --------------------------- ENGINE ------------------------------- */
  // OOP node: every era/flood/people/bird is a Node with geo + time pos.
  class Node {
    constructor(d, project) {
      this.d = d;
      this.project = project;     // fn(lon,lat,age)->{x,y,r,alpha}
      this.x = 0; this.y = 0; this.r = 0;
      this.alpha = 1;
      this.hover = false;
    }
    layout(activeLayers) {
      const visible = activeLayers.has(this.d.layer);
      const pt = this.project(this.d.lon, this.d.lat, this.d.ageEnd);
      this.x = pt.x; this.y = pt.y; this.r = pt.r;
      this.alpha = visible ? 1 : 0;
    }
    hit(mx, my) {
      if (this.alpha < 0.5) return false;
      const dx = mx - this.x, dy = my - this.y;
      return dx * dx + dy * dy <= (this.r + 6) * (this.r + 6);
    }
  }

  class MapEngine {
    constructor(canvas, data, onSelect) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.data = data;
      this.onSelect = onSelect;
      this.nodes = data.ALL.map(d => new Node(d, this.project.bind(this)));
      this.byId = {};
      this.nodes.forEach(n => { this.byId[n.d.id] = n; });
      this.activeLayers = new Set(Object.keys(data.LAYERS));
      this.hoverNode = null;
      this.dirty = true;
      this.off = document.createElement('canvas');   // static cache
      this.offCtx = this.off.getContext('2d');
      this.pan = { x: 0, y: 0 };
      this.scale = 1;
      this._bind();
      this._loop();
    }

    project(lon, lat, age) {
      const G = this.data.GEO;
      const px = (lon - G.lonMin) / (G.lonMax - G.lonMin);   // 0..1
      const py = this.data.ageToT(age);                       // 0..1 (top=present)
      const W = this.c.width / (window.devicePixelRatio || 1);
      const H = this.c.height / (window.devicePixelRatio || 1);
      const padX = W * 0.12, padY = H * 0.08;
      const x = padX + px * (W - 2 * padX);
      const y = H - padY - py * (H - 2 * padY);  // invert: present at top
      const r = 6 + (this.data === this.data ? 3 : 3);
      return { x, y, r: 8, alpha: 1 };
    }

    setLayers(set) { this.activeLayers = set; this.dirty = true; }
    toggle(layerId) {
      if (this.activeLayers.has(layerId)) this.activeLayers.delete(layerId);
      else this.activeLayers.add(layerId);
      this.dirty = true;
    }

    // Hot-swap the entire dataset with a server-verified copy (used after the
    // SPA fetches the HMAC-signed bundle from /api/dataset). Keeps the current
    // active layer set so the user's toggles survive the swap.
    setData(data) {
      this.data = data;
      this.nodes = data.ALL.map(d => new Node(d, this.project.bind(this)));
      this.byId = {};
      this.nodes.forEach(n => { this.byId[n.d.id] = n; });
      this.activeLayers = new Set(
        Object.keys(data.LAYERS).filter(l => this.activeLayers.has(l))
      );
      this.dirty = true;
    }

    _bind() {
      const cv = this.c;
      const pos = (e) => {
        const rect = cv.getBoundingClientRect();
        const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        return { x: cx, y: cy };
      };
      let down = false, lx = 0, ly = 0;
      cv.addEventListener('mousedown', e => { down = true; const p = pos(e); lx = p.x; ly = p.y; });
      window.addEventListener('mouseup', () => down = false);
      cv.addEventListener('mousemove', e => {
        const p = pos(e);
        if (down) { this.pan.x += p.x - lx; this.pan.y += p.y - ly; lx = p.x; ly = p.y; this.dirty = true; }
        const hit = this.nodes.find(n => n.hit(p.x, p.y));
        if (hit !== this.hoverNode) { this.hoverNode = hit; this.dirty = true; cv.style.cursor = hit ? 'pointer' : 'grab'; }
        if (hit) { this.c.style.cursor = 'pointer'; }
      });
      cv.addEventListener('click', e => {
        const p = pos(e);
        const hit = this.nodes.find(n => n.hit(p.x, p.y));
        if (hit && this.onSelect) this.onSelect(hit.d);
      });
      cv.addEventListener('wheel', e => {
        e.preventDefault();
        const f = e.deltaY < 0 ? 1.08 : 0.92;
        this.scale = Math.max(0.4, Math.min(3, this.scale * f));
        this.dirty = true;
      }, { passive: false });
      // pinch-free: simple double-click reset
      cv.addEventListener('dblclick', () => { this.pan = { x: 0, y: 0 }; this.scale = 1; this.dirty = true; });
      window.addEventListener('resize', () => this.dirty = true);
    }

    _resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = window.innerWidth, H = window.innerHeight;
      this.c.width = W * dpr; this.c.height = H * dpr;
      this.c.style.width = W + 'px'; this.c.style.height = H + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    _loop() {
      if (this.dirty) { this._draw(); this.dirty = false; }
      requestAnimationFrame(() => this._loop());
    }

    _draw() {
      this._resize();
      const ctx = this.ctx;
      const W = this.c.width / (window.devicePixelRatio || 1);
      const H = this.c.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, W, H);

      ctx.save();
      ctx.translate(this.pan.x, this.pan.y);
      ctx.scale(this.scale, this.scale);

      // recompute layouts
      this.nodes.forEach(n => n.layout(this.activeLayers));

      // time axis ticks (log-ish: a few key ages)
      this._drawAxis(ctx, W, H);

      // links: connect each node to the central time column by layer color
      this._drawLinks(ctx);

      // nodes
      this.nodes.forEach(n => this._drawNode(ctx, n));

      ctx.restore();
    }

    _drawAxis(ctx, W, H) {
      const ticks = [
        { a: 0, label: 'NOW' },
        { a: 2.6e2, label: '260 y' },
        { a: 5.2e3, label: '5 kya' },
        { a: 1.2e4, label: '12 kya' },
        { a: 6.6e4, label: '66 kya' },  // note: illustrative
        { a: 66e6, label: '66 Ma' },
        { a: 252e6, label: '252 Ma' },
        { a: 541e6, label: '541 Ma' },
        { a: 2.5e9, label: '2.5 Ga' },
        { a: 4.0e9, label: '4.0 Ga' },
        { a: 4.54e9, label: '4.54 Ga' },
      ];
      ctx.textAlign = 'left';
      ctx.font = '11px "Courier New", monospace';
      ticks.forEach(t => {
        const pt = this.project(0, 0, t.a);
        const x = pt.x, y = pt.y;
        ctx.strokeStyle = 'rgba(120,200,160,0.12)';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(W - W * 0.12, y); ctx.stroke();
        ctx.fillStyle = 'rgba(140,210,170,0.5)';
        ctx.fillText(t.label, x + 6, y - 4);
      });
    }

    _drawLinks(ctx) {
      this.nodes.forEach(n => {
        if (n.alpha < 0.5) return;
        const col = this.data.LAYERS[n.d.layer].color;
        const axis = this.project(0, 0, n.d.ageEnd);
        ctx.strokeStyle = this._rgba(col, 0.18 * n.alpha);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(axis.x, axis.y); ctx.lineTo(n.x, n.y); ctx.stroke();
      });
      // Analysis edges: each INSIGHT node links to its `witnesses`.
      this.nodes.forEach(n => {
        if (n.alpha < 0.5 || n.d.layer !== 'insight' || !n.d.witnesses) return;
        const col = this.data.LAYERS.insight.color;
        n.d.witnesses.forEach(wid => {
          const w = this.byId[wid];
          if (!w || w.alpha < 0.5) return;
          ctx.strokeStyle = this._rgba(col, 0.10 * n.alpha);
          ctx.setLineDash([2, 4]);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(w.x, w.y); ctx.stroke();
          ctx.setLineDash([]);
        });
      });
    }

    _drawNode(ctx, n) {
      if (n.alpha < 0.5) return;
      const L = this.data.LAYERS[n.d.layer];
      const col = L.color;
      const sim = n.d.provenance === 'simulated';
      const insight = L.id === 'insight';
      const insp = insight && n.d.kind === 'inspiration';
      ctx.save();
      ctx.globalAlpha = n.alpha;
      // outer glow
      ctx.shadowColor = col;
      ctx.shadowBlur = n.hover ? 22 : 10;
      ctx.fillStyle = col;
      ctx.beginPath();
      if (insight) {
        // 5-point star for the insight layer (hollow outline for inspiration)
        const R = n.r + 3, r = (n.r + 3) / 2.4, spikes = 5;
        for (let i = 0; i < spikes * 2; i++) {
          const ang = (Math.PI / spikes) * i - Math.PI / 2;
          const rad = (i % 2 === 0) ? R : r;
          const px = n.x + Math.cos(ang) * rad;
          const py = n.y + Math.sin(ang) * rad;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        if (insp) {
          ctx.shadowBlur = n.hover ? 20 : 8;
          ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
        } else {
          ctx.fill();
        }
      } else if (L.id === 'birds') {
        // diamond for birds
        ctx.moveTo(n.x, n.y - n.r); ctx.lineTo(n.x + n.r, n.y);
        ctx.lineTo(n.x, n.y + n.r); ctx.lineTo(n.x - n.r, n.y); ctx.closePath();
        ctx.fill();
      } else {
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // simulated = dashed ring
      if (sim) {
        ctx.globalAlpha = n.alpha;
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 4, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
      if (n.hover) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#eafff2';
        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(L.glyph + ' ' + n.d.title, n.x, n.y - n.r - 8);
      }
      ctx.restore();
    }

    _rgba(hex, a) {
      const m = hex.replace('#', '');
      const r = parseInt(m.substr(0, 2), 16);
      const g = parseInt(m.substr(2, 2), 16);
      const b = parseInt(m.substr(4, 2), 16);
      return `rgba(${r},${g},${b},${a})`;
    }
  }

  return { initGPU, MapEngine };
})();
