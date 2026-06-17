// ═══════════════════════════════════════════════════════════════
// UI: DOM MANAGEMENT
// All DOM queries centralized — no getElementById in game loop
// ═══════════════════════════════════════════════════════════════

const UI = {
  elements: {},

  init() {
    // Cache all DOM references once
    this.elements = {
      startScreen:   document.getElementById('start-screen'),
      gameOver:      document.getElementById('game-over'),
      countdown:     document.getElementById('countdown'),
      countdownInstr:document.getElementById('countdown-instruction'),
      goFlash:       document.getElementById('go-flash'),
      soundToggle:   document.getElementById('sound-toggle'),
      camIndicator:  document.getElementById('cam-indicator'),
      // HUD
      rankBadge:     document.getElementById('rank-badge'),
      trackName:     document.getElementById('track-name'),
      deltaDisplay:  document.getElementById('delta-display'),
      lapDisplay:    document.getElementById('lap-display'),
      sessionTime:   document.getElementById('session-time'),
      currentLap:    document.getElementById('current-lap'),
      bestLap:       document.getElementById('best-lap-display'),
      lastLap:       document.getElementById('last-lap-display'),
      gearDisplay:   document.getElementById('gear-display'),
      rpmDisplay:    document.getElementById('rpm-display'),
      simSpeed:      document.getElementById('sim-speed'),
      tcDisplay:     document.getElementById('tc-display'),
      boostDisplay:  document.getElementById('boost-display'),
      // Game over
      finalTime:     document.getElementById('final-time'),
      finalBestLap:  document.getElementById('best-lap'),
      finalTopSpeed: document.getElementById('top-speed'),
      finalPosition: document.getElementById('final-position'),
      lapBreakdown:  document.getElementById('lap-breakdown'),
      // Speed lines
      speedLines:    document.getElementById('speed-lines'),
      // Telemetry rows
      telGear:       document.getElementById('gear-display'),
      telRpm:        document.getElementById('rpm-display'),
      telSpeed:      document.getElementById('sim-speed'),
      telTc:         document.getElementById('tc-display'),
      telBoost:      document.getElementById('boost-display'),
      // Combo / score / effects
      comboDisplay:  document.getElementById('combo-display'),
      comboNum:      document.getElementById('combo-num'),
      comboMulti:    document.getElementById('combo-multi'),
      scoreDisplay:  document.getElementById('score-display'),
      scoreNum:      document.getElementById('score-num'),
      activeEffects: document.getElementById('active-effects'),
      // AR HUD overlays
      redlineFlash:  document.getElementById('hud-redline-flash'),
      offtrackFlash: document.getElementById('hud-offtrack-flash'),
      deltaBar:      document.getElementById('hud-delta-bar'),
      deltaFill:     document.getElementById('hud-delta-fill'),
      boostReady:    document.getElementById('hud-boost-ready'),
    };

    // Instrument panels (lazy init for gameplay HUD)
    if (!this.elements.instrumentPanel) {
      this._createInstrumentPanel();
    }
  },

  _createInstrumentPanel() {
    // Combined bottom-center HUD panel for speed, gear, nitro
    const panel = document.createElement('div');
    panel.id = 'instrument-panel';
    panel.style.cssText = 'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:20;pointer-events:none;display:flex;gap:20px;align-items:flex-end;background:rgba(0,0,0,0.4);padding:8px 16px;border:1px solid rgba(0,255,255,0.1);border-radius:6px;';
    panel.innerHTML = `
      <div style="text-align:center">
        <div style="color:#f0f;font-size:36px;font-weight:700;font-family:'Courier New',monospace;text-shadow:0 0 15px #f0f" id="hud-speed">0</div>
        <div style="color:rgba(255,255,255,0.25);font-size:9px;font-family:'Courier New',monospace">KM/H</div>
      </div>
      <div style="text-align:center">
        <div style="color:#f80;font-size:24px;font-weight:700;font-family:'Courier New',monospace" id="hud-gear">N</div>
        <div style="color:rgba(255,255,255,0.25);font-size:9px;font-family:'Courier New',monospace">GEAR</div>
      </div>
      <div style="text-align:center;width:80px">
        <div style="color:rgba(255,255,255,0.25);font-size:9px;font-family:'Courier New',monospace;margin-bottom:3px">NITRO</div>
        <div style="width:100%;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden">
          <div id="hud-nitro" style="height:100%;width:100%;background:linear-gradient(90deg,#0ff,#f0f);border-radius:3px;transition:width 0.1s"></div>
        </div>
      </div>
      <div style="text-align:center">
        <div style="color:#0cf;font-size:14px;font-weight:700;font-family:'Courier New',monospace" id="hud-rpm">0</div>
        <div style="color:rgba(255,255,255,0.25);font-size:9px;font-family:'Courier New',monospace">RPM</div>
      </div>
    `;
    document.getElementById('ui').appendChild(panel);
    this.elements.instSpeed = document.getElementById('hud-speed');
    this.elements.instGear = document.getElementById('hud-gear');
    this.elements.instNitro = document.getElementById('hud-nitro');
    this.elements.instRpm = document.getElementById('hud-rpm');
  },

  show(id) {
    const el = this._resolve(id);
    if (el) el.style.display = 'flex';
  },
  hide(id) {
    const el = this._resolve(id);
    if (el) el.style.display = 'none';
  },
  _resolve(id) {
    // Accept either kebab-case DOM id (e.g. 'start-screen') or camelCase cache key (e.g. 'startScreen')
    return this.elements[id] || this.elements[this._camel(id)] || document.getElementById(id);
  },
  _camel(id) {
    return id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  },

  setTrackName(name) {
    if (this.elements.trackName) this.elements.trackName.textContent = name;
  },

  setCameraLabel(label) {
    if (this.elements.camIndicator) {
      this.elements.camIndicator.textContent = label;
      this.elements.camIndicator.style.opacity = '1';
      setTimeout(() => { this.elements.camIndicator.style.opacity = '0'; }, 1500);
    }
  },

  resizeHud() { HUD.resize(); },

  // Batched HUD update (called once per frame)
  updateHUD() {
    const e = this.elements;
    const speedKmh = Math.floor(Physics.v);
    const rpm = Math.floor(Physics.rpm);
    const gearStr = Physics.gear > 0 ? Physics.gear.toString() : Physics.gear < 0 ? 'R' : 'N';

    // Instrument panel
    if (e.instSpeed) e.instSpeed.textContent = speedKmh;
    if (e.instGear) e.instGear.textContent = gearStr;
    if (e.instNitro) e.instNitro.style.width = (Player.nitro / Player.maxNitro * 100) + '%';
    if (e.instRpm) e.instRpm.textContent = rpm;

    // Telemetry panel
    if (e.telGear) e.telGear.textContent = gearStr;
    if (e.telRpm) e.telRpm.textContent = rpm;
    if (e.telSpeed) e.telSpeed.textContent = speedKmh;
    if (e.telBoost) e.telBoost.textContent = (Player.nitro / Player.maxNitro * 2.5).toFixed(1);
    const tc = Math.floor(30 + speedKmh * 0.15 + Math.abs(Physics.lateralAccel) * 10);
    if (e.telTc) e.telTc.textContent = tc;

    // Timer
    if (e.lapDisplay) e.lapDisplay.textContent = Game.practiceMode ? '∞' : Player.lap;
    if (e.sessionTime) e.sessionTime.textContent = formatTime(Player.gameTime);
    if (e.currentLap) e.currentLap.textContent = formatTime(Player.gameTime - Player.lapStartTime);
    if (e.bestLap) e.bestLap.textContent = Player.bestLapTime === Infinity ? '--' : formatTime(Player.bestLapTime);
    if (e.lastLap) e.lastLap.textContent = Player.lapTimes.length > 0 ? formatTime(Player.lapTimes[Player.lapTimes.length - 1]) : '--';

    // Rank & delta
    if (!Game.practiceMode) {
      const rank = Opponents.getRank(Player.lap, Player.progress);
      if (e.rankBadge) e.rankBadge.textContent = getRankSuffix(rank);
      const currentLapTime = Player.gameTime - Player.lapStartTime;
      if (Player.bestLapTime !== Infinity && currentLapTime > 0) {
        const delta = currentLapTime - Player.bestLapTime;
        if (e.deltaDisplay) {
          e.deltaDisplay.textContent = (delta > 0 ? '+' : '') + delta.toFixed(3);
          e.deltaDisplay.style.color = delta > 0 ? '#f80' : '#0f0';
        }
      }
    } else {
      if (e.rankBadge) e.rankBadge.textContent = 'PRACTICE';
      if (e.deltaDisplay) { e.deltaDisplay.textContent = 'FREE DRIVE'; e.deltaDisplay.style.color = '#f80'; }
    }

    // Speed lines
    const container = e.speedLines;
    if (container) {
      const speedRatio = Physics.v / 300;
      if (speedRatio > 0.5) {
        container.style.opacity = (speedRatio - 0.5) * 2;
        if (container.children.length === 0) {
          for (let i = 0; i < 20; i++) {
            const line = document.createElement('div');
            line.className = 'speed-line';
            line.style.left = Math.random() * 100 + '%';
            line.style.height = (20 + Math.random() * 40) + 'px';
            line.style.animationDuration = (0.15 + Math.random() * 0.2) + 's';
            line.style.animationDelay = Math.random() * 0.5 + 's';
            container.appendChild(line);
          }
        }
      } else { container.style.opacity = 0; container.innerHTML = ''; }
    }

    // Combo display
    if (e.comboDisplay) {
      if (typeof Combos !== 'undefined' && Combos.count > 0) {
        e.comboDisplay.style.display = 'block';
        if (e.comboNum) {
          e.comboNum.textContent = Combos.count + 'x';
          e.comboNum.style.setProperty('--combo-scale', 1 + Math.min(Combos.count / 20, 0.6));
        }
        if (e.comboMulti) {
          const multi = 1 + Math.sqrt(Combos.count) * 0.4;
          e.comboMulti.textContent = 'x' + multi.toFixed(1) + ' SCORE';
        }
      } else {
        e.comboDisplay.style.display = 'none';
      }
    }

    // Score display
    if (e.scoreDisplay) {
      if (typeof Combos !== 'undefined' && Combos.score > 0) {
        e.scoreDisplay.style.display = 'block';
        if (e.scoreNum) e.scoreNum.textContent = Combos.score.toLocaleString();
      } else {
        e.scoreDisplay.style.display = 'none';
      }
    }

    // Active power-up effects
    if (e.activeEffects && typeof Powerups !== 'undefined') {
      const effects = [];
      if (Powerups.active.boost > 0)  effects.push({ key: 'boost',  color: '#ff8800', emoji: '🔥', name: 'BOOST',  time: Powerups.active.boost,  max: Powerups.types.boost.duration });
      if (Powerups.active.shield > 0) effects.push({ key: 'shield', color: '#00ffff', emoji: '🛡️', name: 'SHIELD', time: Powerups.active.shield, max: Powerups.types.shield.duration });
      if (Powerups.active.magnet > 0) effects.push({ key: 'magnet', color: '#ff00ff', emoji: '🧲', name: 'MAGNET', time: Powerups.active.magnet, max: Powerups.types.magnet.duration });
      if (effects.length > 0) {
        e.activeEffects.style.display = 'flex';
        const html = effects.map(eff => {
          const pct = Math.max(0, Math.min(1, eff.time / eff.max)) * 100;
          return `<div class="active-effect" style="border-color:${eff.color}">
            <span>${eff.emoji}</span>
            <span class="label" style="color:${eff.color}">${eff.name}</span>
            <div class="bar"><div class="bar-fill" style="width:${pct}%;background:${eff.color}"></div></div>
            <span style="color:#888">${eff.time.toFixed(1)}s</span>
          </div>`;
        }).join('');
        if (e.activeEffects._lastHtml !== html) {
          e.activeEffects.innerHTML = html;
          e.activeEffects._lastHtml = html;
        }
      } else {
        e.activeEffects.style.display = 'none';
      }
    }

    // ── AR HUD: redline flash ──────────────────────────────
    if (e.redlineFlash) {
      const redlining = (Physics.rpm / PHYS.maxRpm) > 0.9;
      e.redlineFlash.classList.toggle('active', redlining);
    }

    // ── AR HUD: off-track flash ────────────────────────────
    if (e.offtrackFlash) {
      let offTrack = false;
      try {
        const trackWidth = Environment.getWidth ? Environment.getWidth() : 24;
        const offRatio = Math.abs(Player.lateralOffset) / (trackWidth * 0.7);
        offTrack = offRatio > 0.9;
      } catch (err) { offTrack = false; }
      e.offtrackFlash.classList.toggle('active', offTrack);
    }

    // ── AR HUD: lap delta bar ──────────────────────────────
    if (e.deltaFill && !Game.practiceMode) {
      const currentLapTime = Player.gameTime - Player.lapStartTime;
      if (Player.bestLapTime !== Infinity && currentLapTime > 0.5) {
        const delta = currentLapTime - Player.bestLapTime;
        // 2 s of delta fills the half-bar
        const halfWidth = 50;
        const pct = Math.max(-1, Math.min(1, delta / 2)) * halfWidth;
        if (delta >= 0) {
          e.deltaFill.style.left = '50%';
          e.deltaFill.style.width = pct + '%';
          e.deltaFill.classList.add('positive');
          e.deltaFill.classList.remove('negative');
        } else {
          e.deltaFill.style.left = (50 + pct) + '%';
          e.deltaFill.style.width = (-pct) + '%';
          e.deltaFill.classList.add('negative');
          e.deltaFill.classList.remove('positive');
        }
      } else {
        e.deltaFill.style.width = '0%';
        e.deltaFill.classList.remove('positive', 'negative');
      }
    } else if (e.deltaFill) {
      e.deltaFill.style.width = '0%';
      e.deltaFill.classList.remove('positive', 'negative');
    }

    // ── AR HUD: boost ready indicator ──────────────────────
    if (e.boostReady) {
      const ready = Player.nitro >= Player.maxNitro - 0.5;
      e.boostReady.classList.toggle('active', ready);
    }
  },

  showGameOver() {
    this.show('gameOver');
    const e = this.elements;
    if (e.finalTime) e.finalTime.textContent = formatTime(Player.gameTime);
    if (e.finalBestLap) e.finalBestLap.textContent = formatTime(Player.bestLapTime === Infinity ? Player.gameTime : Player.bestLapTime);
    if (e.finalTopSpeed) e.finalTopSpeed.textContent = Player.topSpeed;

    let pos = 1;
    Opponents.data.forEach(opp => {
      if ((opp.lap - 1) + opp.progress > (Player.lap - 1) + Player.progress) pos++;
    });
    if (e.finalPosition) e.finalPosition.textContent = getRankSuffix(pos);

    if (e.lapBreakdown && Player.lapTimes.length > 0) {
      let html = '<div style="margin-bottom:5px;color:#f80">LAP TIMES:</div>';
      Player.lapTimes.forEach((t, i) => {
        const isBest = t === Player.bestLapTime;
        html += `<div style="margin:3px 0">${i + 1}. <span style="color:${isBest ? '#0f0' : '#0ff'}">${formatTime(t)}</span>${isBest ? ' ⭐' : ''}</div>`;
      });
      e.lapBreakdown.innerHTML = html;
    }
  },

  updateSoundToggle(enabled) {
    if (this.elements.soundToggle) {
      this.elements.soundToggle.textContent = enabled ? '\uD83D\uDD0A' : '\uD83D\uDD07';
      this.elements.soundToggle.classList.toggle('muted', !enabled);
    }
  }
};

function formatTime(t) {
  if (isNaN(t) || t === Infinity) return '--:--.--';
  const m = Math.floor(t / 60);
  const s = t % 60;
  return m + ':' + Math.floor(s).toString().padStart(2, '0') + '.' + Math.floor((s % 1) * 100).toString().padStart(2, '0');
}

function getRankSuffix(p) {
  return ['1st', '2nd', '3rd', '4th', '5th'][p - 1] || '1st';
}
