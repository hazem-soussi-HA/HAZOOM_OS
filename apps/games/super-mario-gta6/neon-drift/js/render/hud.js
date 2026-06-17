// ═══════════════════════════════════════════════════════════════
// RENDER: HUD
// Canvas-based HUD overlay — tachometer, G-force, speed, minimap
//              + Augmented Reality (AR) layer — horizon, speed tape,
//                RPM tape, heading strip, pedal bars, G-trail,
//                waypoint arrow, vignette, redline indicator.
// ═══════════════════════════════════════════════════════════════

const HUD = {
  canvas: null,
  ctx: null,
  minimapCtx: null,

  // ── AR state (smoothed each frame) ─────────────────────────
  _smooth: {
    leanRoll: 0,        // smoothed roll (rad) from angular velocity
    pitch:    0,        // smoothed pitch offset from longitudinal accel
    gTrail:   [],       // recent G samples {lat, lon, t}
    lastGT:   0,
    redlinePulse: 0,    // 0..1 redline flash intensity
    offTrackPulse: 0,   // 0..1 off-track flash intensity
    // FPS tracking
    _fpsFrames: 0,
    _fpsLast:   0,
    _fpsValue:  0,
  },

  init() {
    this.canvas = document.getElementById('hud-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();

    const minimap = document.getElementById('minimap');
    if (minimap) {
      minimap.width = 130;
      minimap.height = 130;
      this.minimapCtx = minimap.getContext('2d');
    }
  },

  resize() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  },

  render() {
    if (!this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    const speedKmh = Math.floor(Physics.v);
    const rpm = Math.floor(Physics.rpm);
    const rpmPct = rpm / PHYS.maxRpm;

    // ── AR layer (under glass) ───────────────────────────────
    this._drawVignette(w, h);
    this._drawHeadingStrip(w, h);
    this._drawHorizon(w, h);
    this._drawWaypointArrow(w, h);
    this._drawSpeedTape(w, h, speedKmh);
    this._drawRpmTape(w, h, rpm, rpmPct);
    this._drawPedalBars(w, h);
    this._drawGTrail(w, h);
    this._drawRedlineIndicator(w, h, rpmPct);

    // ── existing instruments ────────────────────────────────
    this._drawTachometer(w, h, rpm, rpmPct);
    this._drawGForce(w, h);
    this._drawTireTemp(w, h, speedKmh);
    this._drawSpeed(w, h, speedKmh);
    this._drawMinimap();

    // ── telemetry (FPS, draw calls) ─────────────────────────
    this._drawTelemetry(w, h);
  },

  // ───────────────────────────────────────────────────────────
  // TELEMETRY: small FPS / draw call readout in the bottom-left
  // ───────────────────────────────────────────────────────────
  _drawTelemetry(w, h) {
    const ctx = this.ctx;
    const s = this._smooth;
    const nowT = performance.now();
    s._fpsFrames++;
    if (nowT - s._fpsLast >= 500) {
      s._fpsValue = Math.round((s._fpsFrames * 1000) / (nowT - s._fpsLast));
      s._fpsFrames = 0;
      s._fpsLast = nowT;
    }
    const x = 16;
    const y = h - 110;

    ctx.save();
    ctx.font = '9px "Courier New"';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = s._fpsValue >= 50 ? '#0f0' : s._fpsValue >= 30 ? '#ff0' : '#f55';
    ctx.fillText('FPS  ' + s._fpsValue, x, y);
    ctx.fillStyle = 'rgba(0,255,255,0.55)';
    ctx.fillText('GL   ' + (Engine.renderer ? 'OK' : '--'), x, y + 12);
    ctx.fillText('SCE  ' + (Engine.scene && Engine.scene.children.length), x, y + 24);
    ctx.restore();
  },

  // ───────────────────────────────────────────────────────────
  // AR: ARTIFICIAL HORIZON / PITCH LADDER
  // ───────────────────────────────────────────────────────────
  _drawHorizon(w, h) {
    const ctx = this.ctx;
    const cx = w * 0.5;
    const cy = h * 0.5;

    // Smooth roll from angular velocity (turn rate -> lean)
    const targetRoll = -Physics.angularVel * 0.12;
    this._smooth.leanRoll += (targetRoll - this._smooth.leanRoll) * 0.12;

    // Smooth pitch from longitudinal acceleration (brake dives forward, accel pitches back)
    const targetPitch = Physics.longitudinalAccel * 18;
    this._smooth.pitch += (targetPitch - this._smooth.pitch) * 0.08;

    const roll  = this._smooth.leanRoll;
    const pitch = this._smooth.pitch;
    const horizonR = 110;

    ctx.save();
    ctx.translate(cx, cy + pitch);
    ctx.rotate(roll);

    // Sky (above horizon)
    ctx.fillStyle = 'rgba(0, 200, 255, 0.04)';
    ctx.beginPath();
    ctx.rect(-w, -h, w * 2, h);
    ctx.fill();

    // Ground (below horizon) — subtle warm tint
    ctx.fillStyle = 'rgba(255, 100, 30, 0.05)';
    ctx.beginPath();
    ctx.rect(-w, 0, w * 2, h);
    ctx.fill();

    // Horizon line
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(0, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(-w, 0); ctx.lineTo(w, 0);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Pitch ladder ticks (degrees up / down)
    const tickDegs = [-30, -20, -10, 10, 20, 30];
    const degToY = 4.2; // pixels per degree
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.45)';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.55)';
    ctx.font = '8px "Courier New"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    tickDegs.forEach(deg => {
      const y = deg * degToY;
      const w0 = 28;
      const w1 = 50;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-w1, y); ctx.lineTo(-w0, y);
      ctx.moveTo( w0, y); ctx.lineTo( w1, y);
      ctx.stroke();
      if (Math.abs(deg) === 10 || Math.abs(deg) === 30) {
        const lbl = (deg > 0 ? ' ' : '') + deg + '°';
        ctx.fillText(lbl, 0, y);
      }
    });

    ctx.restore();

    // Center reticle (drawn un-rotated so it always reads as "forward")
    ctx.save();
    ctx.translate(cx, cy + pitch);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(0, 255, 255, 0.7)';

    // Diamond / crosshair
    ctx.beginPath();
    ctx.moveTo(cx, cy + pitch - 12); ctx.lineTo(cx + 8, cy + pitch);
    ctx.lineTo(cx, cy + pitch + 12); ctx.lineTo(cx - 8, cy + pitch);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy + pitch); ctx.lineTo(cx - 12, cy + pitch);
    ctx.moveTo(cx + 12, cy + pitch); ctx.lineTo(cx + 24, cy + pitch);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  },

  // ───────────────────────────────────────────────────────────
  // AR: SPEED TAPE (left edge, vertical)
  // ───────────────────────────────────────────────────────────
  _drawSpeedTape(w, h, speedKmh) {
    const ctx = this.ctx;
    const tapeX = 14;
    const tapeW = 44;
    const tapeH = 220;
    const cy = h * 0.5;
    const top = cy - tapeH / 2;
    const bottom = cy + tapeH / 2;

    // Backplate
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(tapeX, top, tapeW, tapeH);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tapeX + 0.5, top + 0.5, tapeW - 1, tapeH - 1);

    // Speed scale: 1 px = 0.7 km/h
    const scale = 0.7;
    const minV = Math.max(0, speedKmh - (cy - top) / scale);
    const maxV = speedKmh + (bottom - cy) / scale;
    const step = (speedKmh < 80) ? 10 : (speedKmh < 200 ? 20 : 40);

    const firstTick = Math.ceil(minV / step) * step;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.55)';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
    ctx.font = '9px "Courier New"';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let v = firstTick; v <= maxV; v += step) {
      const y = cy - (v - speedKmh) * scale;
      const major = v % (step * 2) === 0;
      const tlen = major ? 10 : 5;
      ctx.lineWidth = major ? 1.2 : 0.8;
      ctx.beginPath();
      ctx.moveTo(tapeX + tapeW - tlen, y);
      ctx.lineTo(tapeX + tapeW, y);
      ctx.stroke();
      if (major) ctx.fillText(v.toString(), tapeX + 3, y);
    }

    // Big current-speed readout (in window to the left of tape)
    ctx.fillStyle = 'rgba(255, 0, 255, 0.95)';
    ctx.font = 'bold 28px "Courier New"';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(255, 0, 255, 0.7)';
    ctx.fillText(speedKmh.toString(), tapeX - 4, cy - 8);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '8px "Courier New"';
    ctx.fillText('KM/H', tapeX - 4, cy + 12);

    // Pointer (►) on the right side of the tape, pointing at current speed
    ctx.fillStyle = '#f0f';
    ctx.shadowBlur = 8; ctx.shadowColor = '#f0f';
    ctx.beginPath();
    ctx.moveTo(tapeX + tapeW, cy);
    ctx.lineTo(tapeX + tapeW - 8, cy - 5);
    ctx.lineTo(tapeX + tapeW - 8, cy + 5);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  },

  // ───────────────────────────────────────────────────────────
  // AR: RPM TAPE (right edge, vertical)
  // ───────────────────────────────────────────────────────────
  _drawRpmTape(w, h, rpm, rpmPct) {
    const ctx = this.ctx;
    const tapeW = 38;
    const tapeH = 180;
    const tapeX = w - tapeW - 14;
    const cy = h * 0.5;
    const top = cy - tapeH / 2;
    const bottom = cy + tapeH / 2;

    // Backplate
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(tapeX, top, tapeW, tapeH);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tapeX + 0.5, top + 0.5, tapeW - 1, tapeH - 1);

    // RPM bars (filling from bottom up)
    const fillH = tapeH * rpmPct;
    const grad = ctx.createLinearGradient(0, bottom, 0, top);
    grad.addColorStop(0.0, 'rgba(0, 255, 255, 0.35)');
    grad.addColorStop(0.7, 'rgba(0, 255, 255, 0.35)');
    grad.addColorStop(0.85, 'rgba(255, 200, 0, 0.5)');
    grad.addColorStop(1.0, 'rgba(255, 0, 0, 0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(tapeX + 1, bottom - fillH, tapeW - 2, fillH);

    // Redline band
    const rlTop = top + tapeH * 0.15; // top 15% is redline
    ctx.fillStyle = 'rgba(255, 0, 0, 0.18)';
    ctx.fillRect(tapeX + 1, rlTop, tapeW - 2, tapeH * 0.15 - 0);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(tapeX, rlTop); ctx.lineTo(tapeX + tapeW, rlTop);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pointer (◄) on the left side
    ctx.fillStyle = rpmPct > 0.9 ? '#ff0033' : '#0ff';
    ctx.shadowBlur = rpmPct > 0.9 ? 14 : 8;
    ctx.shadowColor = rpmPct > 0.9 ? '#ff0033' : '#0ff';
    ctx.beginPath();
    ctx.moveTo(tapeX, cy);
    ctx.lineTo(tapeX + 8, cy - 5);
    ctx.lineTo(tapeX + 8, cy + 5);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // RPM x1000 readout
    ctx.fillStyle = rpmPct > 0.9 ? '#ff5555' : '#0ff';
    ctx.font = 'bold 14px "Courier New"';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText((rpm / 1000).toFixed(1), tapeX + 4, bottom + 14);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '7px "Courier New"';
    ctx.fillText('x1000', tapeX + 4, bottom + 26);
  },

  // ───────────────────────────────────────────────────────────
  // AR: PEDAL BARS (throttle = left of speed tape, brake = right of rpm tape)
  // ───────────────────────────────────────────────────────────
  _drawPedalBars(w, h) {
    const ctx = this.ctx;
    const barH = 160;
    const barW = 6;
    const cy = h * 0.5;
    const top = cy - barH / 2;
    const bottom = cy + barH / 2;

    // THROTTLE — left of speed tape
    const tX = 14 - barW - 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(tX, top, barW, barH);
    const tFill = barH * Physics.throttle;
    const tGrad = ctx.createLinearGradient(0, bottom, 0, top);
    tGrad.addColorStop(0.0, 'rgba(0, 255, 100, 0.15)');
    tGrad.addColorStop(1.0, 'rgba(0, 255, 100, 0.7)');
    ctx.fillStyle = tGrad;
    ctx.shadowBlur = Physics.throttle > 0.5 ? 8 : 0;
    ctx.shadowColor = '#00ff66';
    ctx.fillRect(tX, bottom - tFill, barW, tFill);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0, 255, 100, 0.7)';
    ctx.font = '7px "Courier New"';
    ctx.textAlign = 'right';
    ctx.fillText('THR', tX - 2, top - 4);

    // BRAKE — right of RPM tape
    const bX = w - 14 + 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(bX, top, barW, barH);
    const bFill = barH * Physics.brake;
    const bGrad = ctx.createLinearGradient(0, bottom, 0, top);
    bGrad.addColorStop(0.0, 'rgba(255, 60, 60, 0.15)');
    bGrad.addColorStop(1.0, 'rgba(255, 60, 60, 0.75)');
    ctx.fillStyle = bGrad;
    ctx.shadowBlur = Physics.brake > 0.5 ? 8 : 0;
    ctx.shadowColor = '#ff3333';
    ctx.fillRect(bX, bottom - bFill, barW, bFill);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 80, 80, 0.7)';
    ctx.font = '7px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText('BRK', bX + barW + 2, top - 4);
  },

  // ───────────────────────────────────────────────────────────
  // AR: HEADING STRIP (top-center compass)
  // ───────────────────────────────────────────────────────────
  _drawHeadingStrip(w, h) {
    const ctx = this.ctx;
    const stripW = 360;
    const stripH = 22;
    const cx = w * 0.5;
    const top = 44;

    // World heading (same math as minimap player heading)
    let heading = 0;
    try {
      const curve = Environment.getCurve();
      if (curve) {
        const tan = curve.getTangentAt(Player.progress);
        const trackAngle = Math.atan2(tan.z, tan.x);
        heading = (trackAngle + Physics.totalAngle + Player.driftAngle) * 180 / Math.PI;
      }
    } catch (e) { /* fall back to totalAngle only */ }
    // Normalize to (-180, 180]
    heading = ((heading + 180) % 360 + 360) % 360 - 180;

    // Backplate
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(cx - stripW / 2, top, stripW, stripH);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - stripW / 2 + 0.5, top + 0.5, stripW - 1, stripH - 1);

    // Ticks: 2.5 px per degree, ±90° visible
    const pxPerDeg = stripW / 180;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
    ctx.font = '8px "Courier New"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let d = -90; d <= 90; d += 5) {
      const absD = (heading + d + 540) % 360 - 180; // nearest visible
      if (Math.abs(absD - (heading + d)) > 0.001) continue;
      const x = cx + d * pxPerDeg;
      const isMajor = d % 30 === 0;
      const isCardinal = d % 90 === 0;
      ctx.lineWidth = isMajor ? 1.2 : 0.6;
      ctx.beginPath();
      ctx.moveTo(x, top + stripH - (isMajor ? 8 : 4));
      ctx.lineTo(x, top + stripH);
      ctx.stroke();
      if (isMajor) {
        const lbl = isCardinal
          ? (d === 0 ? 'N' : d === 90 ? 'E' : d === -90 ? 'W' : 'S')
          : (heading + d).toFixed(0) + '°';
        ctx.fillText(lbl, x, top + 8);
      }
    }

    // Center caret (▼) pointing down at current heading
    ctx.fillStyle = '#ff0';
    ctx.shadowBlur = 10; ctx.shadowColor = '#ff0';
    ctx.beginPath();
    ctx.moveTo(cx, top - 4);
    ctx.lineTo(cx - 4, top - 10);
    ctx.lineTo(cx + 4, top - 10);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Digital readout (top of strip)
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 10px "Courier New"';
    ctx.textAlign = 'center';
    const norm = ((heading % 360) + 360) % 360;
    ctx.fillText('HDG ' + norm.toFixed(0).padStart(3, '0') + '°', cx, top - 2);
  },

  // ───────────────────────────────────────────────────────────
  // AR: G-FORCE TRAIL (extending the G-meter with a history line)
  // ───────────────────────────────────────────────────────────
  _drawGTrail(w, h) {
    const ctx = this.ctx;
    const gmX = w * 0.07;
    const gmY = h * 0.42;
    const gmRad = 35;

    // Append current G sample (capped at 60 samples)
    const now = performance.now();
    if (now - this._smooth.lastGT > 33) { // ~30 Hz
      this._smooth.gTrail.push({
        lat: Physics.lateralAccel,
        lon: Physics.longitudinalAccel,
        t:   now,
      });
      if (this._smooth.gTrail.length > 60) this._smooth.gTrail.shift();
      this._smooth.lastGT = now;
    }
    // Expire old samples (faster fade)
    const cutoff = now - 1500;
    while (this._smooth.gTrail.length > 0 && this._smooth.gTrail[0].t < cutoff) {
      this._smooth.gTrail.shift();
    }

    if (this._smooth.gTrail.length < 2) return;

    ctx.save();
    ctx.translate(gmX, gmY);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < this._smooth.gTrail.length; i++) {
      const s = this._smooth.gTrail[i];
      const age = (now - s.t) / 1500;
      const x = -s.lat * gmRad * 0.6;
      const y =  s.lon * gmRad * 0.6;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.55)';
    ctx.shadowBlur = 4; ctx.shadowColor = 'rgba(0, 255, 255, 0.6)';
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  },

  // ───────────────────────────────────────────────────────────
  // AR: TRACK-AHEAD CHEVRON — points toward the racing line 5% ahead
  // Shows as a pulsing edge-of-screen arrow when the curve ahead
  // diverges from the player's current heading.
  // ───────────────────────────────────────────────────────────
  _drawWaypointArrow(w, h) {
    const ctx = this.ctx;
    let curve = null;
    try { curve = Environment.getCurve(); } catch (e) { return; }
    if (!curve) return;

    const lookahead = 0.05; // 5% of lap ahead
    const ahead = (Player.progress + lookahead) % 1;
    const target = curve.getPointAt(ahead);
    const dx = target.x - Player.x;
    const dz = target.z - Player.z;
    const dist = Math.hypot(dx, dz) || 1;

    // Car forward in world XZ (matches the minimap player heading math)
    let carAngle = Physics.totalAngle + Player.driftAngle;
    try {
      const tan = curve.getTangentAt(Player.progress);
      carAngle += Math.atan2(tan.z, tan.x);
    } catch (e) { /* ignore */ }
    const carFx = Math.cos(carAngle);
    const carFz = Math.sin(carAngle);

    // Relative angle from car-forward to (target - player)
    const cross = carFx * dz - carFz * dx;
    const dot   = carFx * dx + carFz * dz;
    const rel   = Math.atan2(cross, dot);

    // Don't draw if we're already pointing roughly the right way
    if (Math.abs(rel) < 0.18) return;

    const cy = h * 0.5;
    const margin = 70;
    const isLeft = rel < 0;
    const x = isLeft ? margin : w - margin;
    const dir = isLeft ? -1 : 1;
    const intensity = Math.min(1, Math.abs(rel) / 1.2);
    const pulse = 0.6 + 0.4 * Math.sin(now() * 0.008);

    ctx.save();
    ctx.translate(x, cy);

    // Double-chevron for stronger signal at sharper turns
    const chevrons = intensity > 0.6 ? 2 : 1;
    for (let c = 0; c < chevrons; c++) {
      const ox = dir * (c * 10);
      ctx.fillStyle = `rgba(255, 0, 255, ${(0.55 + 0.35 * intensity) * pulse})`;
      ctx.shadowBlur = 14; ctx.shadowColor = '#f0f';
      ctx.beginPath();
      ctx.moveTo(ox + dir * 12, 0);
      ctx.lineTo(ox - dir *  4, -9);
      ctx.lineTo(ox - dir *  4,  9);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Distance label inside the chevron
    ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * pulse})`;
    ctx.font = 'bold 9px "Courier New"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(dist) + 'm', dir * -2, 0);
    ctx.restore();
  },

  // ───────────────────────────────────────────────────────────
  // AR: REDLINE / SHIFT WARNING INDICATOR (centered, just below reticle)
  // ───────────────────────────────────────────────────────────
  _drawRedlineIndicator(w, h, rpmPct) {
    const ctx = this.ctx;
    if (rpmPct < 0.9) return;
    const cx = w * 0.5;
    const y = h * 0.5 + 40;
    const pulse = 0.5 + 0.5 * Math.sin(now() * 0.02);
    ctx.save();
    ctx.fillStyle = `rgba(255, 0, 50, ${0.55 + 0.4 * pulse})`;
    ctx.font = 'bold 12px "Courier New"';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 14 + 8 * pulse; ctx.shadowColor = '#ff0033';
    ctx.fillText('▲ SHIFT ▲', cx, y);
    ctx.shadowBlur = 0;
    ctx.restore();
  },

  // ───────────────────────────────────────────────────────────
  // AR: VIGNETTE — subtle full-screen frame for the AR glass look
  // ───────────────────────────────────────────────────────────
  _drawVignette(w, h) {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35,
                                          w / 2, h / 2, Math.max(w, h) * 0.75);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Thin inner border
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  },

  // ───────────────────────────────────────────────────────────
  // EXISTING: TACHOMETER (bottom-center RPM arc) — unchanged
  // ───────────────────────────────────────────────────────────
  _drawTachometer(w, h, rpm, rpmPct) {
    const cx = w * 0.5;
    const cy = h - 130;
    const rad = 90;
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(cx, cy);

    // Background arc
    ctx.beginPath();
    ctx.arc(0, 0, rad, -Math.PI * 0.75, Math.PI * 0.75);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 12;
    ctx.stroke();

    // RPM segments
    const startAngle = -Math.PI * 0.75;
    for (let i = 0; i < 60; i++) {
      const t = i / 60;
      const segStart = startAngle + t * Math.PI * 1.5;
      const segEnd = segStart + (Math.PI * 1.5) / 60 - 0.02;
      ctx.beginPath();
      ctx.arc(0, 0, rad, segStart, segEnd);
      ctx.lineWidth = 7;
      if (t < 0.7) ctx.strokeStyle = rpmPct > t ? 'rgba(0,255,255,0.9)' : 'rgba(0,255,255,0.08)';
      else if (t < 0.85) ctx.strokeStyle = rpmPct > t ? 'rgba(255,200,0,0.9)' : 'rgba(255,200,0,0.1)';
      else ctx.strokeStyle = rpmPct > t ? 'rgba(255,0,0,0.9)' : 'rgba(255,0,0,0.1)';
      ctx.stroke();
    }

    // Redline zone
    ctx.beginPath();
    ctx.arc(0, 0, rad - 4, -Math.PI * 0.75 + 0.85 * Math.PI * 1.5, -Math.PI * 0.75 + 1.5 * Math.PI);
    ctx.strokeStyle = 'rgba(255,0,0,0.12)';
    ctx.lineWidth = 16;
    ctx.stroke();

    // Redline LEDs
    if (rpmPct > 0.85) {
      for (let i = 0; i < 5; i++) {
        const lit = rpmPct > 0.85 + (i / 5) * 0.15;
        const la = -Math.PI * 0.75 + Math.PI * 1.5 * (0.85 + (i / 5) * 0.15);
        const lx = Math.cos(la) * (rad + 12);
        const ly = Math.sin(la) * (rad + 12);
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        ctx.fillStyle = lit ? '#ff0033' : 'rgba(255,0,51,0.12)';
        ctx.shadowBlur = lit ? 12 : 0;
        ctx.shadowColor = '#ff0033';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // RPM text
    ctx.fillStyle = `rgba(255,255,255,${0.4 + rpmPct * 0.6})`;
    ctx.font = 'bold 22px "Courier New"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((rpm / 1000).toFixed(1), 0, -14);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '9px "Courier New"';
    ctx.fillText('RPM x1000', 0, 10);

    // Shift indicator
    if (rpmPct > 0.92 && Physics.throttle > 0.3) {
      ctx.fillStyle = '#ff0033';
      ctx.font = 'bold 14px "Courier New"';
      ctx.shadowBlur = 20; ctx.shadowColor = '#ff0033';
      ctx.fillText('SHIFT ▲', 0, 46);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  },

  // ───────────────────────────────────────────────────────────
  // EXISTING: G-FORCE METER (left of center)
  // ───────────────────────────────────────────────────────────
  _drawGForce(w, h) {
    const gmX = w * 0.07;
    const gmY = h * 0.42;
    const gmRad = 35;
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(gmX, gmY);

    ctx.beginPath();
    ctx.arc(0, 0, gmRad, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, gmRad * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-gmRad, 0); ctx.lineTo(gmRad, 0);
    ctx.moveTo(0, -gmRad); ctx.lineTo(0, gmRad);
    ctx.stroke();

    const gx = Math.max(-gmRad + 5, Math.min(gmRad - 5, -Physics.lateralAccel * gmRad * 0.6));
    const gy = Math.max(-gmRad + 5, Math.min(gmRad - 5, Physics.longitudinalAccel * gmRad * 0.6));
    const gMag = Math.sqrt(Physics.lateralAccel ** 2 + Physics.longitudinalAccel ** 2);

    ctx.beginPath();
    ctx.arc(gx, gy, 5, 0, Math.PI * 2);
    ctx.fillStyle = gMag > 0.8 ? `rgba(255,50,50,${0.5 + gMag * 0.4})` : `rgba(0,255,255,${0.3 + gMag * 0.5})`;
    ctx.shadowBlur = 12;
    ctx.shadowColor = gMag > 0.8 ? '#ff3333' : '#00ffff';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '7px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('G', 0, gmRad + 12);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 11px "Courier New"';
    ctx.fillText(gMag.toFixed(2), 0, gmRad + 24);
    ctx.restore();
  },

  // ───────────────────────────────────────────────────────────
  // EXISTING: TIRE TEMPERATURE
  // ───────────────────────────────────────────────────────────
  _drawTireTemp(w, h, speedKmh) {
    const gmX = w * 0.07;
    const gmY = h * 0.42;
    const gmRad = 35;
    const ctx = this.ctx;

    const tireTemp = Math.floor(30 + speedKmh * 0.15 + Math.abs(Physics.lateralAccel) * 10);
    const tirePct = Math.min(1, tireTemp / 120);

    ctx.save();
    ctx.translate(gmX, gmY + gmRad + 36);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '7px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('TIRES', 0, 0);
    const barW = 50;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW / 2, 5, barW, 3);
    const tColor = tirePct > 0.85 ? '#ff3333' : tirePct > 0.6 ? '#ffaa00' : '#00ccff';
    ctx.fillStyle = tColor;
    ctx.shadowBlur = 5; ctx.shadowColor = tColor;
    ctx.fillRect(-barW / 2, 5, barW * tirePct, 3);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '7px "Courier New"';
    ctx.fillText(tireTemp + '°C', 0, 16);
    ctx.restore();
  },

  // ───────────────────────────────────────────────────────────
  // EXISTING: BIG SPEED NUMBER (bottom-right)
  // ───────────────────────────────────────────────────────────
  _drawSpeed(w, h, speedKmh) {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    const spdX = w - 100;
    const spdY = h - 100;

    ctx.fillStyle = 'rgba(255,0,255,0.9)';
    ctx.font = 'bold 48px "Courier New"';
    ctx.shadowBlur = 25; ctx.shadowColor = '#f0f';
    ctx.fillText(speedKmh.toString(), spdX, spdY);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '10px "Courier New"';
    ctx.fillText('KM/H', spdX, spdY + 5);
    ctx.restore();
  },

  // ───────────────────────────────────────────────────────────
  // EXISTING: MINIMAP
  // ───────────────────────────────────────────────────────────
  _drawMinimap() {
    if (!this.minimapCtx || !Environment.getCurve()) return;
    const ctx = this.minimapCtx;
    const mmScale = 0.1;
    const curve = Environment.getCurve();

    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, 130, 130);

    // Track outline
    ctx.strokeStyle = 'rgba(0,255,255,0.35)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const p = curve.getPointAt(i / 120);
      const x = 65 + p.x * mmScale, y = 65 + p.z * mmScale;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Waypoints
    const td = TRACKS[Environment.selectedTrack];
    const sc = td.scale;
    td.waypoints.forEach((w, i) => {
      const p = latLngTo3D(w.lat, w.lng, sc);
      ctx.fillStyle = i === 0 ? '#00ff00' : '#ff00ff';
      ctx.shadowBlur = 6; ctx.shadowColor = i === 0 ? '#00ff00' : '#ff00ff';
      ctx.beginPath();
      ctx.arc(65 + p.x * mmScale, 65 + p.z * mmScale, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Opponents
    Opponents.data.forEach(opp => {
      const p = curve.getPointAt(opp.progress);
      ctx.fillStyle = '#' + opp.color.toString(16).padStart(6, '0');
      ctx.beginPath();
      ctx.arc(65 + p.x * mmScale, 65 + p.z * mmScale, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player
    const totalAngle = Math.atan2(
      curve.getTangentAt(Player.progress).z,
      curve.getTangentAt(Player.progress).x
    ) + Physics.totalAngle + Player.driftAngle;

    ctx.fillStyle = '#f0f';
    ctx.shadowBlur = 8; ctx.shadowColor = '#f0f';
    ctx.beginPath();
    ctx.arc(65 + Player.x * mmScale, 65 + Player.z * mmScale, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f0f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(65 + Player.x * mmScale, 65 + Player.z * mmScale);
    ctx.lineTo(
      65 + Player.x * mmScale + Math.cos(totalAngle) * 8,
      65 + Player.z * mmScale + Math.sin(totalAngle) * 8
    );
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
};

// Small helper for the AR layer — wraps performance.now() so the waypoint
// pulse stays in sync with the rest of the frame loop.
function now() { return performance.now(); }
