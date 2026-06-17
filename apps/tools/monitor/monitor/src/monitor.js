// Sky Radar Monitor — browser-only, mockable, exportable
(function() {
  'use strict';

  // ---------- DOM refs ----------
  var radarCanvas = document.getElementById('radarCanvas');
  var rCtx = radarCanvas.getContext('2d');
  var metricsEl = document.getElementById('metrics');
  var toastEl = document.getElementById('toast');
  var btnStart = document.getElementById('btnStart');
  var btnPause = document.getElementById('btnPause');
  var btnReset = document.getElementById('btnReset');
  var btnJSON = document.getElementById('btnExportJSON');
  var btnCSV = document.getElementById('btnExportCSV');
  var glBgCanvas = document.getElementById('glBg');
  var glBg = glBgCanvas.getContext('2d');

  // ---------- Responsive resize ----------
  function fitCanvas(canv) {
    var parent = canv.parentElement;
    var size = Math.min(parent.clientWidth, parent.clientHeight);
    canv.width = size * (window.devicePixelRatio || 1);
    canv.height = size * (window.devicePixelRatio || 1);
    canv.style.width = size + 'px';
    canv.style.height = size + 'px';
    return size;
  }
  window.addEventListener('resize', function() {
    fitCanvas(radarCanvas);
    fitCanvas(glBgCanvas);
    drawGLBg(glBg, glBgCanvas.width, glBgCanvas.height);
  });
  fitCanvas(radarCanvas);
  fitCanvas(glBgCanvas);
  drawGLBg(glBg, glBgCanvas.width, glBgCanvas.height);

  // ---------- Ambient GL background (simple procedural) ----------
  function drawGLBg(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    // dark gradient
    var g = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(10,15,30,0)');
    g.addColorStop(1, 'rgba(6,8,16,0.9)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    // subtle circles
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2;
      var x = W/2 + Math.cos(a) * W * 0.18;
      var y = H/2 + Math.sin(a) * H * 0.18;
      ctx.beginPath();
      ctx.arc(x, y, Math.min(W,H) * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(60,140,200,0.03)';
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // ---------- Mock data generator ----------
  var METRICS = ['latency', 'packetLoss', 'jitter', 'throughput', 'errors', 'uptime'];
  var history = [];
  var running = false;
  var timerHandle = null;
  var sampleInterval = 2000; // ms

  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

  function generateSample() {
    var t = Date.now();
    return {
      timestamp: t,
      values: {
        latency: rand(5, 120),       // ms
        packetLoss: rand(0, 5),       // %
        jitter: rand(1, 30),          // ms
        throughput: rand(12, 95),     // Mbps
        errors: randInt(0, 12),
        uptime: Math.floor(t / 1000) // seconds
      }
    };
  }

  function addSample() {
    var s = generateSample();
    history.push(s);
    if (history.length > 120) history.shift(); // ~40 minutes at 2s
    renderMetrics(s);
    drawRadar(s.values);
  }

  // ---------- Metrics cards ----------
  function renderMetrics(sample) {
    var keys = METRICS;
    var html = '';
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var v = sample.values[k];
      var cls = '';
      if (k === 'latency' || k === 'jitter' || k === 'packetLoss' || k === 'errors') cls = 'warn';
      if (k === 'throughput') cls = 'good';
      var color = cls === 'warn' ? '#ff6' : '#4af';
      html += '<div class="card"><div class="label">' + k.toUpperCase() + '</div>' +
              '<div class="value" style="color:' + color + '">' + formatVal(k, v) + '</div></div>';
    }
    metricsEl.innerHTML = html;
  }

  function formatVal(key, val) {
    if (key === 'latency' || key === 'jitter') return val.toFixed(0) + ' ms';
    if (key === 'packetLoss') return val.toFixed(1) + ' %';
    if (key === 'throughput') return val.toFixed(0) + ' Mbps';
    if (key === 'errors') return val + '';
    if (key === 'uptime') return (val / 60).toFixed(0) + 'm';
    return String(val);
  }

  // ---------- Radar drawing ----------
  function drawRadar(data) {
    var W = radarCanvas.width, H = radarCanvas.height;
    var size = Math.min(W, H) / 2 - 20;
    var cx = W / 2, cy = H / 2;
    rCtx.clearRect(0, 0, W, H);

    var labels = METRICS;
    var len = labels.length;
    var maxValues = { latency: 150, packetLoss: 10, jitter: 60, throughput: 100, errors: 20, uptime: 86400 };

    // grid rings
    rCtx.strokeStyle = 'rgba(68,170,255,0.12)'; rCtx.lineWidth = 1;
    for (var r = 1; r <= 3; r++) {
      rCtx.beginPath();
      for (var a = 0; a <= 360; a += 6) {
        var rad = (a * Math.PI / 180);
        var rr = (size * r / 3);
        var px = cx + Math.cos(rad) * rr;
        var py = cy + Math.sin(rad) * rr;
        if (a === 0) rCtx.moveTo(px, py); else rCtx.lineTo(px, py);
      }
      rCtx.closePath(); rCtx.stroke();
    }
    // spokes + labels
    rCtx.fillStyle = '#667'; rCtx.font = '11px monospace';
    for (var i = 0; i < len; i++) {
      var ang = (i / len) * Math.PI * 2 - Math.PI / 2;
      var x = cx + Math.cos(ang) * size;
      var y = cy + Math.sin(ang) * size;
      rCtx.beginPath(); rCtx.moveTo(cx, cy); rCtx.lineTo(x, y); rCtx.strokeStyle = 'rgba(68,170,255,0.15)'; rCtx.lineWidth = 1; rCtx.stroke();
      // label
      rCtx.textAlign = (Math.cos(ang) > 0 ? 'left' : 'right');
      rCtx.fillText(labels[i].toUpperCase(), x + (Math.cos(ang) > 0 ? 14 : -14), y + 3);
    }
    // polygon / area
    rCtx.beginPath();
    for (var j = 0; j < len; j++) {
      var ang2 = (j / len) * Math.PI * 2 - Math.PI / 2;
      var mv = maxValues[labels[j]] || 100;
      var rr2 = size * (data[labels[j]] || 0) / mv;
      var px2 = cx + Math.cos(ang2) * rr2;
      var py2 = cy + Math.sin(ang2) * rr2;
      if (j === 0) rCtx.moveTo(px2, py2); else rCtx.lineTo(px2, py2);
    }
    rCtx.closePath();
    // fill gradient
    var pg = rCtx.createRadialGradient(cx, cy, 0, cx, cy, size);
    pg.addColorStop(0, 'rgba(68,170,255,0.18)');
    pg.addColorStop(1, 'rgba(68,170,255,0)');
    rCtx.fillStyle = pg; rCtx.fill();
    // stroke
    rCtx.strokeStyle = '#4af'; rCtx.lineWidth = 2; rCtx.stroke();
    // points
    for (var k = 0; k < len; k++) {
      var ang3 = (k / len) * Math.PI * 2 - Math.PI / 2;
      var mv2 = maxValues[labels[k]] || 100;
      var rr3 = size * (data[labels[k]] || 0) / mv2;
      var px3 = cx + Math.cos(ang3) * rr3, py3 = cy + Math.sin(ang3) * rr3;
      rCtx.beginPath(); rCtx.arc(px3, py3, 4, 0, Math.PI * 2); rCtx.fillStyle = '#0ff'; rCtx.fill();
    }
    // center dot
    rCtx.beginPath(); rCtx.arc(cx, cy, 3, 0, Math.PI * 2); rCtx.fillStyle = '#0ff'; rCtx.fill();
  }

  // ---------- Toast ----------
  function toast(msg) {
    toastEl.textContent = msg; toastEl.style.display = 'block';
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function(){ toastEl.style.display = 'none'; }, 2000);
  }

  // ---------- Export ----------
  function exportJSON() {
    var blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sky-radar-stats.json'; a.click();
    toast('JSON exported');
  }
  function exportCSV() {
    var lines = ['timestamp,' + METRICS.join(',')];
    for (var i = 0; i < history.length; i++) {
      var row = [history[i].timestamp];
      for (var j = 0; j < METRICS.length; j++) row.push(history[i].values[METRICS[j]]);
      lines.push(row.join(','));
    }
    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sky-radar-stats.csv'; a.click();
    toast('CSV exported');
  }

  // ---------- Controls ----------
  function start() {
    if (running) return;
    running = true; btnStart.textContent = 'Running';
    timerHandle = setInterval(addSample, sampleInterval);
    addSample(); // immediate first sample
  }
  function pause() {
    if (!running) return;
    running = false; clearInterval(timerHandle); btnStart.textContent = 'Start';
  }
  function reset() {
    pause(); history = []; metricsEl.innerHTML = ''; drawRadar({});
    toast('Reset complete');
  }

  btnStart.addEventListener('click', start);
  btnPause.addEventListener('click', pause);
  btnReset.addEventListener('click', reset);
  btnJSON.addEventListener('click', exportJSON);
  btnCSV.addEventListener('click', exportCSV);

  // ---------- Init with one sample so UI isn't empty ----------
  addSample();
})();
