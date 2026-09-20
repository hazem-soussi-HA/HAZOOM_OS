/**
 * HAZOOM OS — Service Constellation Overlay
 * Cosmic inspiration: every backend service becomes a STAR in the desktop sky.
 * Stars are drawn on a dedicated sibling canvas (not desktop-canvas) so the
 * 3D universe background and 2D fallback remain untouched.
 *
 * Read-only: this layer only observes GET /api/services/constellation.
 * It never starts, stops or toggles services.
 */
(function () {
    'use strict';

    const REFRESH_MS = 30000;
    const TWINKLE_MS = 90;

    const STATUS_STYLE = {
        online:   { core: '#aef3ff', halo: 'rgba(0,232,255,',  ring: 'rgba(0,232,255,0.55)' },
        offline:  { core: '#ffb3a0', halo: 'rgba(255,61,113,', ring: 'rgba(255,61,113,0.45)' },
        disabled: { core: '#8a8aa8', halo: 'rgba(139,139,168,', ring: 'rgba(139,139,168,0.3)' }
    };

    function createLayer() {
        const desktop = document.getElementById('desktop');
        if (!desktop) return null;
        let canvas = document.getElementById('service-constellation-canvas');
        if (canvas) return canvas;
        canvas = document.createElement('canvas');
        canvas.id = 'service-constellation-canvas';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.cssText = [
            'position:absolute', 'inset:0', 'z-index:2',
            'pointer-events:none', 'opacity:0', 'transition:opacity 1.6s ease'
        ].join(';');
        desktop.insertBefore(canvas, desktop.firstChild);
        return canvas;
    }

    const state = { stars: [], links: [], phase: 0, timer: null, renderTimer: null };

    function computePositions() {
        const w = window.innerWidth, h = window.innerHeight;
        // Keep stars inside a comfortable sky band (below topbar, above dock)
        const top = Math.round(h * 0.12), bottom = Math.round(h * 0.78);
        for (const s of state.stars) {
            s.px = Math.round(w * 0.06 + s.x * (w * 0.88));
            s.py = Math.round(top + s.y * (bottom - top));
            s.r = (s.magnitude || 2) * 2.2;
        }
    }

    function draw() {
        const canvas = document.getElementById('service-constellation-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        state.phase += 0.035;

        // Constellation lines between linked stars
        ctx.lineWidth = 1;
        for (const link of state.links) {
            const a = state.stars[link.from], b = state.stars[link.to];
            if (!a || !b || a.px === undefined) continue;
            const style = (a.status === 'online' && b.status === 'online')
                ? 'rgba(0,232,255,0.22)'
                : 'rgba(139,139,168,0.10)';
            ctx.strokeStyle = style;
            ctx.setLineDash([2, 6]);
            ctx.beginPath();
            ctx.moveTo(a.px, a.py);
            ctx.lineTo(b.px, b.py);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Stars
        for (const s of state.stars) {
            if (s.px === undefined) continue;
            const st = STATUS_STYLE[s.status] || STATUS_STYLE.disabled;
            const pulse = 0.75 + 0.25 * Math.sin(state.phase + s.order * 1.7);
            const scale = s.status === 'online' ? pulse : 0.85;

            // Halo
            const grad = ctx.createRadialGradient(s.px, s.py, 0, s.px, s.py, s.r * 5 * scale);
            grad.addColorStop(0, st.halo + (0.35 * scale) + ')');
            grad.addColorStop(1, st.halo + '0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(s.px, s.py, s.r * 5 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = st.core;
            ctx.globalAlpha = s.status === 'online' ? 0.95 : 0.6;
            ctx.beginPath();
            ctx.arc(s.px, s.py, s.r * scale * 0.55, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Ring
            ctx.strokeStyle = st.ring;
            ctx.globalAlpha = s.status === 'online' ? 0.7 : 0.35;
            ctx.beginPath();
            ctx.arc(s.px, s.py, s.r * scale + 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Label
            ctx.font = '10px JetBrains Mono, monospace';
            ctx.fillStyle = 'rgba(234,234,255,0.75)';
            ctx.textAlign = 'center';
            ctx.fillText(s.name + ' :' + s.port, s.px, s.py + s.r * scale + 16);
        }
    }

    async function refresh() {
        try {
            const res = await fetch('/api/services/constellation', { signal: AbortSignal.timeout(5000) });
            if (!res.ok) return;
            const data = await res.json();
            if (!Array.isArray(data.stars)) return;
            state.stars = data.stars;
            state.links = Array.isArray(data.links) ? data.links : [];
            computePositions();
            const canvas = document.getElementById('service-constellation-canvas');
            if (canvas && canvas.style.opacity !== '1') {
                canvas.style.opacity = '0.9';
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                computePositions();
            }
        } catch (e) {
            // Offline-safe: keep last known sky, just keep twinkling
        }
    }

    window.HAZOOM_CONSTELLATION = {
        init() {
            if (state.timer) return;
            if (!createLayer()) return;
            refresh();
            state.timer = setInterval(refresh, REFRESH_MS);
            state.renderTimer = setInterval(draw, TWINKLE_MS);
            window.addEventListener('resize', () => {
                const canvas = document.getElementById('service-constellation-canvas');
                if (canvas) {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    computePositions();
                }
            });
            console.log('[Constellation] Service sky initialized');
        },
        refreshNow: refresh
    };
})();
