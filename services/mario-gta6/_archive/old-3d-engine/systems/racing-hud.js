// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.

// ═══════════════════════════════════════════════════════════════
// RACING HUD — Canvas 2D overlay for 3D racing mode
// Speed, RPM, gear, nitro bar, camera label
// Renders on a transparent canvas overlaid on the Three.js canvas
// ═══════════════════════════════════════════════════════════════

var RacingHUD = {
    canvas: null,
    ctx: null,
    visible: false,

    // Smoothing
    _smoothSpeed: 0,
    _smoothRpm: 800,
    _gearDisplay: 0,
    _nitroFlash: 0,

    init() {
        var container = document.getElementById('game-container');
        if (!container) return;

        var existing = document.getElementById('racing-hud-canvas');
        if (existing) {
            this.canvas = existing;
            this.ctx = this.canvas.getContext('2d');
            return;
        }

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'racing-hud-canvas';
        this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:none;z-index:3;pointer-events:none;';
        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    show() {
        this.visible = true;
        if (this.canvas) this.canvas.style.display = 'block';
    },

    // V1.8.3 — Camera shake. Each call adds energy; render() decays it.
    _shakeEnergy: 0,
    shake(amount) {
        this._shakeEnergy = Math.min(2.0, this._shakeEnergy + amount);
    },

    hide() {
        this.visible = false;
        if (this.canvas) this.canvas.style.display = 'none';
    },

    render() {
        if (!this.visible || !this.ctx) return;
        var ctx = this.ctx;
        var w = this.canvas.width;
        var h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);

        var rm = RacingMode;
        if (!rm) return;

        // V1.8.3 — Apply camera-shake offset to the entire HUD overlay.
        // We shake the HUD rather than the 3D camera (cheaper; doesn't
        // break perspective). The energy decays each frame.
        var shakeX = 0, shakeY = 0;
        if (this._shakeEnergy > 0.01) {
            shakeX = (Math.random() - 0.5) * this._shakeEnergy * 14;
            shakeY = (Math.random() - 0.5) * this._shakeEnergy * 14;
            this._shakeEnergy *= 0.85;
            if (this._shakeEnergy < 0.01) this._shakeEnergy = 0;
        }
        ctx.save();
        if (shakeX || shakeY) ctx.translate(shakeX, shakeY);

        // Smooth values
        this._smoothSpeed += (rm.speed - this._smoothSpeed) * 0.15;
        this._smoothRpm += (rm.rpm - this._smoothRpm) * 0.12;
        this._gearDisplay += (rm.gear - this._gearDisplay) * 0.1;

        var speedKmh = Math.max(0, Math.floor(this._smoothSpeed));
        var rpm = Math.floor(this._smoothRpm);
        var rpmPct = rpm / RACING_PHYS.maxRpm;
        var gear = Math.round(this._gearDisplay);
        var nitroPct = rm.nitro / NITRO_MAX;

        // ── Bottom-left: Speed + Gear ──
        this._drawSpeedGear(ctx, w, h, speedKmh, gear);

        // ── Bottom-right: RPM bar ──
        this._drawRpmBar(ctx, w, h, rpm, rpmPct);

        // ── Bottom-center: Nitro bar ──
        this._drawNitroBar(ctx, w, h, nitroPct, rm.nitroActive);

        // ── Top-center: Camera label ──
        this._drawCameraLabel(ctx, w, h);

        // ── Top-left: Throttle/Brake bars ──
        this._drawPedalBars(ctx, w, h, rm.throttle, rm.brake);

        // Close the shake transform opened at the top of render()
        if (shakeX || shakeY) ctx.restore();
        else ctx.restore();
    },

    _drawSpeedGear(ctx, w, h, speedKmh, gear) {
        var x = 30;
        var y = h - 80;

        // Gear indicator
        var gearLabel = gear <= 0 ? (gear < 0 ? 'R' : 'N') : gear.toString();
        var gearColor = gear <= 0 ? '#888' : '#0ff';
        ctx.save();
        ctx.font = 'bold 42px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = gearColor;
        ctx.shadowColor = gearColor;
        ctx.shadowBlur = 12;
        ctx.fillText(gearLabel, x + 30, y);
        ctx.shadowBlur = 0;

        // Speed
        ctx.font = 'bold 56px "Courier New", monospace';
        ctx.fillStyle = speedKmh > 300 ? '#ff4444' : speedKmh > 200 ? '#ffaa00' : '#ffffff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;
        ctx.fillText(speedKmh.toString(), x + 30, y + 55);
        ctx.shadowBlur = 0;

        // KM/H label
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText('KM/H', x + 30, y + 82);

        ctx.restore();
    },

    _drawRpmBar(ctx, w, h, rpm, rpmPct) {
        var barW = 28;
        var barH = 200;
        var x = w - 50;
        var y = h - 40 - barH;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(x, y, barW, barH);

        // Border
        ctx.strokeStyle = 'rgba(0,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, barW - 1, barH - 1);

        // RPM fill (bottom to top)
        var fillH = barH * rpmPct;
        var grad = ctx.createLinearGradient(0, y + barH, 0, y);
        grad.addColorStop(0, 'rgba(0,255,255,0.35)');
        grad.addColorStop(0.7, 'rgba(0,255,255,0.35)');
        grad.addColorStop(0.85, 'rgba(255,200,0,0.5)');
        grad.addColorStop(1.0, 'rgba(255,0,0,0.6)');
        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y + barH - fillH, barW - 2, fillH);

        // Redline zone
        var rlY = y + barH * 0.15;
        ctx.fillStyle = 'rgba(255,0,0,0.15)';
        ctx.fillRect(x + 1, y, barW - 2, rlY - y);
        ctx.strokeStyle = 'rgba(255,0,0,0.5)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, rlY);
        ctx.lineTo(x + barW, rlY);
        ctx.stroke();
        ctx.setLineDash([]);

        // RPM text
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = rpmPct > 0.9 ? '#ff5555' : '#0ff';
        ctx.fillText((rpm / 1000).toFixed(1), x + barW / 2, y + barH + 16);
        ctx.font = '8px "Courier New", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillText('x1000 RPM', x + barW / 2, y + barH + 28);
    },

    _drawNitroBar(ctx, w, h, nitroPct, nitroActive) {
        var barW = 200;
        var barH = 14;
        var x = w / 2 - barW / 2;
        var y = h - 35;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 4);
        ctx.fill();

        // Border
        ctx.strokeStyle = nitroActive ? 'rgba(255,136,0,0.6)' : 'rgba(0,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x + 0.5, y + 0.5, barW - 1, barH - 1, 4);
        ctx.stroke();

        // Fill
        if (nitroPct > 0.01) {
            var fillW = (barW - 2) * nitroPct;
            var grad = ctx.createLinearGradient(x, 0, x + barW, 0);
            grad.addColorStop(0, nitroActive ? 'rgba(255,136,0,0.7)' : 'rgba(0,200,255,0.5)');
            grad.addColorStop(1, nitroActive ? 'rgba(255,200,0,0.8)' : 'rgba(0,255,255,0.6)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, fillW, barH - 2, 3);
            ctx.fill();
        }

        // Label
        ctx.font = 'bold 9px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = nitroActive ? '#ff8800' : 'rgba(255,255,255,0.5)';
        ctx.fillText(nitroActive ? '🔥 NITRO' : 'NITRO', x + barW / 2, y - 5);

        // Flash effect when active
        if (nitroActive) {
            this._nitroFlash = Math.min(1, this._nitroFlash + 0.1);
        } else {
            this._nitroFlash *= 0.95;
        }
        if (this._nitroFlash > 0.01) {
            ctx.fillStyle = 'rgba(255,136,0,' + (this._nitroFlash * 0.08) + ')';
            ctx.fillRect(0, 0, w, h);
        }
    },

    _drawCameraLabel(ctx, w, h) {
        var view = CAM_VIEWS[RacingMode.camView];
        var label = CAM_LABELS[view];

        ctx.save();
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,255,255,0.5)';
        ctx.shadowColor = 'rgba(0,255,255,0.3)';
        ctx.shadowBlur = 6;
        ctx.fillText('[ ' + label + ' ]', w / 2, 60);
        ctx.shadowBlur = 0;

        // Controls hint
        ctx.font = '9px "Courier New", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillText('↑↓ Gas/Brake  ←→ Steer  SPACE Nitro  C Camera  F Exit', w / 2, h - 10);
        ctx.restore();
    },

    _drawPedalBars(ctx, w, h, throttle, brake) {
        var barW = 8;
        var barH = 100;
        var y = h - 40 - barH;

        // Throttle (left)
        var tx = 8;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(tx, y, barW, barH);
        var tFill = barH * throttle;
        ctx.fillStyle = throttle > 0.5 ? 'rgba(0,255,100,0.7)' : 'rgba(0,255,100,0.3)';
        ctx.fillRect(tx, y + barH - tFill, barW, tFill);
        ctx.font = '7px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,255,100,0.6)';
        ctx.fillText('T', tx + barW / 2, y - 6);

        // Brake (left + 12)
        var bx = tx + barW + 4;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(bx, y, barW, barH);
        var bFill = barH * brake;
        ctx.fillStyle = brake > 0.5 ? 'rgba(255,60,60,0.7)' : 'rgba(255,60,60,0.3)';
        ctx.fillRect(bx, y + barH - bFill, barW, bFill);
        ctx.fillStyle = 'rgba(255,80,80,0.6)';
        ctx.fillText('B', bx + barW / 2, y - 6);
    }
};
