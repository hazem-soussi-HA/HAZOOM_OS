/**
 * HAZOOM SEROTONIN ENGINE — Visualizer
 * Mandala + Aura + Particles — all respond to frequency data
 */

class SerotoninVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.W = 0;
        this.H = 0;
        this.frame = 0;
        this.mode = 'mandala';
        this.color = '#00ff88';
        this.bands = { sub: 0, bass: 0, mid: 0, high: 0, presence: 0 };
        this.particles = [];
        this.mandala = { rotation: 0, layers: 6 };
        this.aura = { rings: [], pulse: 0 };
        this.running = false;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.W = this.canvas.width = window.innerWidth;
        this.H = this.canvas.height = window.innerHeight;
        this.cx = this.W / 2;
        this.cy = this.H / 2;
        this.radius = Math.min(this.W, this.H) * 0.35;
    }

    setMode(mode) { this.mode = mode; }
    setColor(color) { this.color = color; }
    setBands(bands) { this.bands = bands; }

    start() { this.running = true; this.loop(); }
    stop() { this.running = false; }

    loop() {
        if (!this.running) return;
        this.frame++;
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
        this.ctx.fillRect(0, 0, this.W, this.H);

        switch (this.mode) {
            case 'mandala': this.drawMandala(); break;
            case 'aura': this.drawAura(); break;
            case 'particles': this.drawParticles(); break;
            case 'sacred': this.drawSacred(); break;
        }

        requestAnimationFrame(() => this.loop());
    }

    /* ── Parse hex color to rgb ── */
    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    /* ── MANDALA MODE ── */
    drawMandala() {
        const { bass, mid, high, sub } = this.bands;
        const ctx = this.ctx;
        const cx = this.cx;
        const cy = this.cy;
        const rgb = this.hexToRgb(this.color);

        this.mandala.rotation += 0.003 + bass * 0.01;
        const rot = this.mandala.rotation;

        for (let layer = 0; layer < this.mandala.layers; layer++) {
            const layerProgress = layer / this.mandala.layers;
            const petals = 6 + layer * 2;
            const r = this.radius * (0.3 + layerProgress * 0.7) * (1 + bass * 0.2);
            const angleStep = (Math.PI * 2) / petals;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rot * (layer % 2 === 0 ? 1 : -1));

            for (let i = 0; i < petals; i++) {
                const angle = i * angleStep;
                const petalR = r * 0.3 * (1 + mid * 0.5);

                ctx.save();
                ctx.rotate(angle);

                ctx.beginPath();
                ctx.ellipse(r * 0.5, 0, petalR, petalR * 0.4, 0, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.15 + high * 0.2})`;
                ctx.lineWidth = 1 + bass;
                ctx.stroke();

                ctx.restore();
            }

            ctx.beginPath();
            ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.05 + sub * 0.1})`;
            ctx.fill();

            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, 4 + bass * 8, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20 + bass * 30;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    /* ── AURA MODE ── */
    drawAura() {
        const { bass, mid, high, sub } = this.bands;
        const ctx = this.ctx;
        const rgb = this.hexToRgb(this.color);

        this.aura.pulse += 0.02 + bass * 0.05;

        const bodyX = this.cx;
        const bodyY = this.cy + this.radius * 0.1;

        for (let i = 0; i < 7; i++) {
            const r = this.radius * (0.3 + i * 0.12) * (1 + Math.sin(this.aura.pulse + i * 0.5) * 0.1 + bass * 0.15);
            const alpha = 0.04 + (7 - i) * 0.008 + mid * 0.03;

            ctx.beginPath();
            ctx.arc(bodyX, bodyY, r, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(bodyX, bodyY, 0, bodyX, bodyY, r);
            grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 1.5})`);
            grad.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
            grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
            ctx.fillStyle = grad;
            ctx.fill();
        }

        const spineY1 = bodyY - this.radius * 0.4;
        const spineY2 = bodyY + this.radius * 0.3;

        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.15 + high * 0.15})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bodyX, spineY1);
        ctx.lineTo(bodyX, spineY2);
        ctx.stroke();

        for (let i = 0; i < 7; i++) {
            const t = i / 6;
            const y = spineY1 + (spineY2 - spineY1) * t;
            const dotR = 3 + bass * 4 + Math.sin(this.aura.pulse * 2 + i) * 2;

            ctx.beginPath();
            ctx.arc(bodyX, y, dotR, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10 + bass * 15;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(bodyX, spineY1 - 20, 12 + high * 10, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.3 + high * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    /* ── PARTICLES MODE ── */
    drawParticles() {
        const { bass, mid, high, sub } = this.bands;
        const ctx = this.ctx;
        const rgb = this.hexToRgb(this.color);

        if (Math.random() < 0.3 + bass * 0.5) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + bass * 3;
            this.particles.push({
                x: this.cx + (Math.random() - 0.5) * 100,
                y: this.cy + (Math.random() - 0.5) * 100,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.5,
                life: 1,
                decay: 0.003 + Math.random() * 0.008,
                size: 1 + Math.random() * 3 + bass * 2,
                hueShift: Math.random() * 30 - 15,
            });
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.01;
            p.vx *= 0.995;
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            const alpha = p.life * (0.3 + mid * 0.4);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
            ctx.fill();

            if (p.size > 2) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life * 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.2})`;
                ctx.fill();
            }
        }

        while (this.particles.length > 300) this.particles.shift();

        ctx.beginPath();
        ctx.arc(this.cx, this.cy, 2 + bass * 6, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15 + bass * 25;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    /* ── SACRED GEOMETRY MODE ── */
    drawSacred() {
        const { bass, mid, high, sub } = this.bands;
        const ctx = this.ctx;
        const rgb = this.hexToRgb(this.color);

        this.mandala.rotation += 0.002 + bass * 0.008;

        const S = this.radius;
        const cx = this.cx;
        const cy = this.cy;
        const rot = this.mandala.rotation;

        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + rot;
            points.push({
                x: cx + Math.cos(angle) * S * 0.6 * (1 + bass * 0.15),
                y: cy + Math.sin(angle) * S * 0.6 * (1 + bass * 0.15)
            });
        }

        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.1 + high * 0.15})`;
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 6; i++) {
            for (let j = i + 1; j < 6; j++) {
                ctx.beginPath();
                ctx.moveTo(points[i].x, points[i].y);
                ctx.lineTo(points[j].x, points[j].y);
                ctx.stroke();
            }
        }

        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + rot;
            const r = S * 0.35 * (1 + mid * 0.3);
            ctx.beginPath();
            ctx.arc(
                cx + Math.cos(angle) * S * 0.3,
                cy + Math.sin(angle) * S * 0.3,
                r * 0.5,
                0, Math.PI * 2
            );
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.08 + mid * 0.1})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, S * 0.8 * (1 + sub * 0.1), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.06 + bass * 0.08})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, S * 0.4 * (1 + mid * 0.15), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.1 + mid * 0.12})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 3 + bass * 6, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20 + bass * 25;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

window.SerotoninVisualizer = SerotoninVisualizer;
