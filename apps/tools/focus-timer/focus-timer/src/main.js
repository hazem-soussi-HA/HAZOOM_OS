// Focus Timer — Pomodoro with ambient WebGL visualization and stats export
(function() {
  'use strict';

  // ---------- DOM ----------
  var timerEl = document.getElementById('timer');
  var stateEl = document.getElementById('state');
  var btnStart = document.getElementById('btnStart');
  var btnPause = document.getElementById('btnPause');
  var btnReset = document.getElementById('btnReset');
  var statsEl = document.getElementById('stats');
  var modal = document.getElementById('exportModal');
  var exportData = document.getElementById('exportData');
  var toastEl = document.getElementById('toast');

  // ---------- WebGL ambient background ----------
  var canvas = document.getElementById('glCanvas');
  var gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false }) || null;
  var useGL = !!gl;

  function resizeGL() {
    canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
    canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resizeGL, false);
  resizeGL();

  // Simple procedural fragment shader for ambient vibes
  var vsSource = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
  `;
  var fsSource = `
    precision mediump float;
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uRes;
    void main(){
      vec2 uv = vUv;
      vec3 col = vec3(0.04, 0.05, 0.09);
      float glow = sin(uv.x * 8.0 + uTime * 0.5) * cos(uv.y * 6.0 + uTime * 0.3);
      col += vec3(0.0, 0.3, 0.5) * pow(glow * 0.5 + 0.5, 2.0) * 0.15;
      float ring = sin(length(uv - 0.5) * 10.0 - uTime * 1.2) * exp(-length(uv - 0.5) * 3.0);
      col += vec3(0.0, 0.2, 0.4) * pow(ring * 0.5 + 0.5, 3.0) * 0.08;
      // subtle particles
      float n = fract(sin(dot(uv * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
      col += vec3(0.02) * n * 0.3;
      gl_FragColor = vec4(col, 1.0);
    }
  `;
  var shaderProg = null;
  function compile(src, type) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
    return s;
  }
  function createProgram() {
    var p = gl.createProgram();
    gl.attachShader(p, compile(vsSource, gl.VERTEX_SHADER));
    gl.attachShader(p, compile(fsSource, gl.FRAGMENT_SHADER));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.warn('Program link warning');
    gl.useProgram(p);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(p, 'aPos');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(gl.getUniformLocation(p, 'uTime'), 0);
    gl.uniform1i(gl.getUniformLocation(p, 'uRes'), 1);
    return p;
  }
  function drawGL(t) {
    if (!gl) return;
    try {
      if (!shaderProg) shaderProg = createProgram();
      gl.uniform1f(gl.getUniformLocation(shaderProg, 'uTime'), t * 0.001);
      gl.uniform2f(gl.getUniformLocation(shaderProg, 'uRes'), canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } catch(e) { /* silent */ }
  }

  // ---------- Timer Logic ----------
  var SESSION = 25 * 60;   // 25 minutes
  var BREAK = 5 * 60;      // 5 minutes
  var state = 'ready';     // ready | work | break | paused
  var remaining = SESSION;
  var timerInterval = null;
  var totalSessionSeconds = 0;
  var sessionCount = 0;
  var startOffset = 0;     // for paused resume

  function format(t) {
    var m = Math.floor(t / 60) % 60, s = t % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function saveStats() {
    try { localStorage.setItem('focusTimerStats', JSON.stringify({ totalSeconds: totalSessionSeconds, sessions: sessionCount, ts: Date.now() })); } catch(e){}
  }
  function loadStats() {
    try {
      var raw = localStorage.getItem('focusTimerStats');
      if (raw) { var d = JSON.parse(raw); totalSessionSeconds = d.totalSeconds || 0; sessionCount = d.sessions || 0; updateStats(); }
    } catch(e){}
  }
  function updateStats() {
    statsEl.innerHTML = 'Sessions: ' + sessionCount + ' • Total: ' + format(totalSessionSeconds);
  }

  function setState(next) {
    state = next;
    if (state === 'work') { remaining = SESSION; timerEl.style.color = '#0ff'; stateEl.textContent = 'Focus'; } else
    if (state === 'break') { remaining = BREAK; timerEl.style.color = '#ff6'; stateEl.textContent = 'Rest'; } else
    if (state === 'paused') { timerEl.style.color = '#ff6'; stateEl.textContent = 'Paused'; } else
    if (state === 'ready') { remaining = SESSION; timerEl.style.color = '#0ff'; stateEl.textContent = 'Ready'; }
    timerEl.textContent = format(remaining);
    updateStats();
    saveStats();
  }

  function tick() {
    if (state === 'work' || state === 'break') {
      remaining--;
      timerEl.textContent = format(remaining);
      if (remaining <= 0) {
        sessionCount++; totalSessionSeconds += (state === 'work' ? SESSION : BREAK);
        setState('ready');
        try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=').play(); } catch(e){}
        showToast(state === 'work' ? 'Focus session complete!' : 'Break over!');
      }
    }
  }

  function startTimer() {
    if (state === 'work' || state === 'break') return;
    if (state === 'paused') { startOffset = Date.now(); state = 'work'; }
    else { remaining = (state === 'break' ? BREAK : SESSION); state = 'work'; }
    timerInterval = setInterval(tick, 1000);
    setState(state);
  }

  function pauseTimer() {
    if (state !== 'work' && state !== 'break') return;
    clearInterval(timerInterval); timerInterval = null;
    state = 'paused'; startOffset = 0; setState('paused');
  }

  function resetTimer() {
    clearInterval(timerInterval); timerInterval = null;
    setState('ready');
  }

  function showToast(msg) {
    toastEl.textContent = msg; toastEl.style.display = 'block';
    setTimeout(function(){ toastEl.style.display = 'none'; }, 2000);
  }

  // ---------- Export ----------
  function exportStats() {
    try {
      var raw = localStorage.getItem('focusTimerStats');
      var data = raw ? JSON.parse(raw) : { totalSeconds: 0, sessions: 0 };
      var out = 'Focus Timer Stats\n==================\n' +
        'Total Sessions: ' + data.sessions + '\n' +
        'Total Time: ' + format(data.totalSeconds) + '\n' +
        'Export Time: ' + new Date().toLocaleString() + '\n\n' +
        'Tip: Use the Pomodoro technique — 25 min focus, 5 min break.';
      exportData.value = out;
      modal.classList.add('show');
    } catch(e) { showToast('Export failed'); }
  }

  // ---------- Events ----------
  btnStart.addEventListener('click', startTimer);
  btnPause.addEventListener('click', pauseTimer);
  btnReset.addEventListener('click', function(){ resetTimer(); });
  document.getElementById('btnCloseExport').addEventListener('click', function(){ modal.classList.remove('show'); });
  document.getElementById('btnCopy').addEventListener('click', function(){ exportData.select(); document.execCommand('copy'); showToast('Copied to clipboard'); });
  document.getElementById('btnDownload').addEventListener('click', function() {
    var blob = new Blob([exportData.value], { type: 'text/plain' }); var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'focus-stats.txt'; a.click();
  });

  // ---------- Init ----------
  loadStats();
  updateStats();
  // start ambient GL render loop
  function glLoop(t) { drawGL(t); requestAnimationFrame(glLoop); }
  requestAnimationFrame(glLoop);
})();
