// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// MAIN — Entry point
// Called when all modules are loaded
// ═══════════════════════════════════════════════════════════════

function boot() {
    // Load saved settings
    loadSettings();

    // V1.8.0: load Rust→WASM physics module (async, non-blocking)
    if (typeof loadWasm === 'function') {
        loadWasm().then(ok => {
            if (ok) console.log('[V1.8.0] WASM physics hot path active');
            else console.log('[V1.8.0] WASM unavailable, using JS physics');
        });
    }

    // Background particles for website
    initBackgroundParticles();

    // Start the game
    start();

    // Scroll reveal for website sections
    initScrollReveal();

    // Footer build info
    console.log('%c🍄 SUPER MARIO GTA6 %c— V1.8.0 WASM Physics', 'color:#e63946;font-size:16px;font-weight:900', 'color:#ffd60a;font-size:12px');
    console.log('%c"Nothing is lost and everything is connected." — Hazem Soussi (HA)', 'color:#4ade80;font-size:10px;font-style:italic');
}

if (document.readyState === 'complete') {
    boot();
} else {
    document.addEventListener('DOMContentLoaded', boot);
}

function initBackgroundParticles() {
    var c = document.getElementById('bg-particles'), x = c.getContext('2d');
    var ps = [], m = { x: -999, y: -999 };
    var cs = ['#e63946', '#ffd60a', '#4ade80', '#00e5ff', '#ffffff'];

    function resize() { c.width = window.innerWidth; c.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);

    function P() { this.r(); }
    P.prototype.r = function() {
        this.x = Math.random() * c.width; this.y = Math.random() * c.height;
        this.s = Math.random() * 2.5 + 1; this.vx = (Math.random() - 0.5) * 0.4; this.vy = (Math.random() - 0.5) * 0.4;
        this.c = cs[Math.floor(Math.random() * cs.length)]; this.o = Math.random() * 0.4 + 0.1; this.l = Math.random() * 0.5 + 0.5;
    };
    P.prototype.u = function() {
        this.x += this.vx; this.y += this.vy; this.l -= 0.002;
        var dx = this.x - m.x, dy = this.y - m.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) { var f = (120 - d) / 120; this.x += dx * f * 0.03; this.y += dy * f * 0.03; }
        if (this.l <= 0 || this.x < -50 || this.x > c.width + 50 || this.y < -50 || this.y > c.height + 50) this.r();
    };
    P.prototype.d = function() {
        x.save(); x.globalAlpha = this.o * this.l; x.beginPath(); x.arc(this.x, this.y, this.s, 0, Math.PI * 2); x.fillStyle = this.c; x.fill(); x.restore();
    };
    for (var i = 0; i < 50; i++) ps.push(new P());
    window.addEventListener('mousemove', function(e) { m.x = e.clientX; m.y = e.clientY; });

    function drawConnections() {
        for (var i = 0; i < ps.length; i++) {
            for (var j = i + 1; j < ps.length; j++) {
                var dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y, d = Math.sqrt(dx * dx + dy * dy);
                if (d < 90) { x.save(); x.globalAlpha = (1 - d / 90) * 0.06; x.strokeStyle = '#e63946'; x.lineWidth = 0.5; x.beginPath(); x.moveTo(ps[i].x, ps[i].y); x.lineTo(ps[j].x, ps[j].y); x.stroke(); x.restore(); }
            }
        }
    }
    function loop() {
        x.clearRect(0, 0, c.width, c.height);
        for (var i = 0; i < ps.length; i++) { ps[i].u(); ps[i].d(); }
        drawConnections(); requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    var reveals = document.querySelectorAll('.reveal');
    var obs = new IntersectionObserver(function(entries) { entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('visible'); }); }, { threshold: 0.1 });
    reveals.forEach(function(el) { obs.observe(el); });
    document.querySelectorAll('a[href^="#"]').forEach(function(a) { a.addEventListener('click', function(e) { var t = document.querySelector(a.getAttribute('href')); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }); });
}
