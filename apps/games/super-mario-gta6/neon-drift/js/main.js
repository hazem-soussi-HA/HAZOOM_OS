// ═══════════════════════════════════════════════════════════════
// GAME: MAIN CONTROLLER
// Game state machine, loop, initialization
// ═══════════════════════════════════════════════════════════════

const Game = {
  state: 'menu',        // menu, countdown, racing, gameover
  countdownActive: false,
  countdownValue: 3,
  countdownRAFId: null,
  aiMode: false,
  practiceMode: false,
  lastTime: 0,
  lastDriftSound: 0,

  init() {
    // Load saved settings
    Engine.loadSettings();
    Input.loadBindings();
    Audio.loadSettings();

    // Init systems
    Engine.init();
    Input.init();
    UI.init();
    HUD.init();
    Particles.init();
    Messages.init();
    Confetti.init();
    RewardModal.init();
    Achievements.init();
    Mascot.init();

    // Build initial track
    Environment.build('command-center');
    Powerups.spawn(Environment.getCurve());
    CarBuilder.create(0x00ffff);
    Engine.scene.add(CarBuilder.get());
    Opponents.init();

    // Position camera
    const curve = Environment.getCurve();
    if (curve) {
      const initPos = curve.getPointAt(0);
      Engine.camera.position.set(initPos.x, initPos.y + 10, initPos.z - 20);
      Engine.camera.lookAt(initPos);
    }

    // Event listeners
    this._setupEvents();

    // Initial render
    this._render();
  },

  _setupEvents() {
    // Track selection
    document.querySelectorAll('.track-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.track-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        Environment.selectedTrack = card.dataset.track;
      });
    });

    // Start button
    document.getElementById('start-btn').addEventListener('click', () => this.start());
    document.getElementById('restart-btn').addEventListener('click', () => this.start());

    // AI toggle
    document.getElementById('ai-btn').addEventListener('click', function() {
      this.classList.toggle('active');
    });

    // Practice toggle
    document.getElementById('practice-btn').addEventListener('click', function() {
      this.classList.toggle('active');
    });

    // Sound toggle
    document.getElementById('sound-toggle').addEventListener('click', function() {
      const enabled = Audio.toggle();
      UI.updateSoundToggle(enabled);
    });

    // Achievements panel
    const achBtn = document.getElementById('achievements-btn');
    if (achBtn) {
      achBtn.addEventListener('click', () => this._showAchievements());
    }
    const achClose = document.getElementById('achievements-close');
    if (achClose) {
      achClose.addEventListener('click', () => {
        document.getElementById('achievements-panel').style.display = 'none';
      });
    }

    // Start background particles
    this._createStartBackground();
    this._updateAchievementsBadge();
  },

  _updateAchievementsBadge() {
    const el = document.getElementById('achieve-count');
    if (el && typeof Achievements !== 'undefined') {
      el.textContent = `${Achievements.stats.unlockedIds.length}/${Achievements.catalog.length}`;
    }
  },

  _showAchievements() {
    const panel = document.getElementById('achievements-panel');
    const list = document.getElementById('achievements-list');
    const progress = document.getElementById('achievement-progress');
    if (!panel || !list) return;

    list.innerHTML = '';
    Achievements.catalog.forEach(a => {
      const unlocked = Achievements.stats.unlockedIds.includes(a.id);
      const card = document.createElement('div');
      card.style.cssText = `padding:12px;border:1px solid ${unlocked ? '#ff0' : '#444'};background:${unlocked ? 'rgba(255,255,0,0.08)' : 'rgba(50,50,50,0.3)'};border-radius:6px;opacity:${unlocked ? '1' : '0.55'}`;
      card.innerHTML = `
        <div style="font-size:24px;margin-bottom:4px">${a.emoji}</div>
        <div style="color:${unlocked ? '#ff0' : '#888'};font-size:12px;font-weight:700;letter-spacing:1px;margin-bottom:4px">${a.name}</div>
        <div style="color:#aaa;font-size:10px;line-height:1.4">${a.desc}</div>
        <div style="color:${unlocked ? '#0f0' : '#666'};font-size:9px;letter-spacing:2px;margin-top:6px">${unlocked ? '✓ UNLOCKED' : '○ LOCKED'}</div>
      `;
      list.appendChild(card);
    });
    progress.textContent = `PROGRESS: ${Achievements.getProgress()}%`;
    panel.style.display = 'flex';
    this._updateAchievementsBadge();
  },

  start() {
    Audio.init();
    Audio.resume();

    UI.hide('start-screen');
    UI.hide('game-over');
    RewardModal.hide();

    Combos.reset();
    Powerups.reset();
    Achievements.startRace();

    Environment.build(Environment.selectedTrack);
    Powerups.spawn(Environment.getCurve());
    if (CarBuilder.get()) Engine.scene.remove(CarBuilder.get());
    CarBuilder.create(0x00ffff);
    Engine.scene.add(CarBuilder.get());
    Opponents.init();

    Player.reset();
    Physics.reset();

    const curve = Environment.getCurve();
    if (curve) {
      const startPos = curve.getPointAt(0);
      Player.x = startPos.x;
      Player.y = startPos.y + 2;
      Player.z = startPos.z;
    }

    this.aiMode = document.getElementById('ai-btn').classList.contains('active');
    this.practiceMode = document.getElementById('practice-btn').classList.contains('active');
    this.state = 'countdown';

    UI.resizeHud();
    this._startCountdown();
  },

  _startCountdown() {
    this.countdownActive = true;
    this.countdownValue = 3;
    const el = UI.elements.countdown;
    const instruction = UI.elements.countdownInstr;
    const flash = UI.elements.goFlash;
    if (el) el.style.display = 'block';
    if (instruction) instruction.style.display = 'block';

    const countdownRender = () => {
      if (!this.countdownActive) return;
      this._render();
      this.countdownRAFId = requestAnimationFrame(countdownRender);
    };
    countdownRender();

    const tick = () => {
      if (!this.countdownActive) return;
      if (this.countdownValue > 0) {
        if (el) {
          el.textContent = this.countdownValue;
          el.style.color = this.countdownValue === 1 ? '#f00' : '#0ff';
          el.style.textShadow = this.countdownValue === 1 ? '0 0 50px #f00,0 0 100px #f00' : '0 0 50px #0ff,0 0 100px #0ff';
        }
        Audio.playCountdownBeep(this.countdownValue === 1 ? 300 : 440, 0.2);
        this.countdownValue--;
        setTimeout(tick, 1000);
      } else {
        if (el) {
          el.textContent = 'GO!';
          el.style.color = '#0f0';
          el.style.textShadow = '0 0 50px #0f0,0 0 100px #0f0';
        }
        if (instruction) instruction.style.display = 'none';
        if (flash) flash.style.display = 'block';
        Audio.playCountdownBeep(660, 0.3);
        setTimeout(() => {
          if (flash) flash.style.display = 'none';
        }, 300);
        setTimeout(() => {
          if (el) el.style.display = 'none';
          this.countdownActive = false;
          if (this.countdownRAFId) cancelAnimationFrame(this.countdownRAFId);
          this.state = 'racing';
          this.lastTime = performance.now();
          Mascot.show();
          Mascot.say("Let's goooo! 🚀", 2500);
          setTimeout(() => Messages.onStart(), 1500);
          requestAnimationFrame((t) => this._gameLoop(t));
        }, 500);
      }
    };
    tick();
  },

  _gameLoop(timestamp) {
    if (this.state !== 'racing') return;

    const dt = Math.min((timestamp - this.lastTime) / 16.67, 3);
    this.lastTime = timestamp;

    this._update(dt);
    this._render();

    Input.clearJustPressed();
    requestAnimationFrame((t) => this._gameLoop(t));
  },

  _update(dt) {
    Player.gameTime += dt / 60;

    // AI mode
    if (this.aiMode) {
      AIDriver.drivePlayer();
    } else {
      clearAIKeys();
    }

    // Input state for physics
    const input = {
      accelerate: Input.isDown('accelerate'),
      brake: Input.isDown('brake'),
      left: Input.isDown('left'),
      right: Input.isDown('right'),
      nitro: Input.isDown('nitro') && Player.nitro > 0,
    };

    // Physics
    Physics.update(dt, input);

    // Powerups (effect timers + magnet pull)
    Powerups.tick(dt);
    if (Powerups.active.magnet > 0) {
      Powerups.attractToPlayer(Player.x, Player.y, Player.z, dt);
    }
    if (Powerups.active.boost > 0) {
      Physics.v = Math.min(Physics.v + 1.5 * dt, 380);
    }

    // Track position
    Player.updateTrackPosition(Environment.getCurve(), Environment.getWidth(), dt);

    // Drift
    if (Player.drifting) {
      Player.driftAngle += (Physics.steerAngle * 0.3 + Physics.angularVel * 0.1 - Player.driftAngle) * 0.05 * dt;
      if (Date.now() - this.lastDriftSound > 300) {
        Audio.playDrift();
        this.lastDriftSound = Date.now();
      }
      Particles.spawnDriftSparks(Player.x, Player.y, Player.z, Physics.totalAngle);
      Particles.spawnTireSmoke(Player.x, Player.y, Player.z, Physics.totalAngle);
    } else {
      Player.driftAngle *= 0.9;
    }

    // Combos & scoring
    const trackCurve = Environment.getCurve();
    const slip = Math.abs(Player.driftAngle) + Math.abs(Physics.angularVel) * 0.5;
    const driftState = Player.drifting && slip > 0.4;
    Combos.tick(driftState, slip, Physics.v, dt);

    // Near-miss detection
    const nearMiss = this._detectNearMiss(trackCurve);
    if (nearMiss) {
      Combos.recordNearMiss(nearMiss.x, nearMiss.z);
      Achievements.session.nearMisses++;
      Audio.playCheer();
    }

    // Perfect corner (smooth turn through a curve)
    const perfect = Combos.checkPerfectCorner(Player.x, Player.z, trackCurve);
    if (perfect) {
      Achievements.session.perfectCorners++;
    }

    // Powerup pickup detection
    const pickup = Powerups.checkPickup(Player.x, Player.z);
    if (pickup) {
      Powerups.applyEffect(pickup);
      Audio.playPowerup();
      Messages.onPowerup(pickup);
    }

    // Speed comments
    Messages.speedComment(Physics.v);

    // Nitro particles
    if (input.nitro && Player.nitro > 0) {
      Particles.spawnNitro(Player.x, Player.y, Player.z, Physics.totalAngle, Player.nitro);
      if (Math.random() > 0.7) Audio.playNitro();
    }

    // Opponents
    if (!this.practiceMode) {
      Opponents.update(dt, Player.progress, Environment.getCurve(), Environment.getWidth());

      // Collision
      if (Opponents.checkCollision(Player.x, Player.z, Player.invincible)) {
        Physics.v *= 0.5;
        Player.invincible = 2;
        Player.collisionCooldown = 1;
        Audio.playCollision();
        Achievements.recordCrash();
        if (!this.aiMode) Messages.onCrash();
        Audio.playBoo();
      }
    }

    // Particles
    Particles.update();

    // Lap check
    if (!this.practiceMode) {
      const raceOver = Player.checkLap(Player.gameTime);
      if (raceOver) {
        this.end();
        return;
      }
    }

    // Invincibility timer
    if (Player.invincible > 0) Player.invincible -= dt / 60;

    // Car visual effects
    CarBuilder.update(
      Player.gameTime,
      Input.isDown('nitro') && Player.nitro > 0,
      Physics.brakeGlow,
      Player.invincible
    );

    // Car position
    const curve2 = Environment.getCurve();
    if (curve2) {
      const tan = curve2.getTangentAt(Player.progress);
      const trackAngle = Math.atan2(tan.z, tan.x);
      const totalAngle = trackAngle + Physics.totalAngle + Player.driftAngle;
      const car = CarBuilder.get();
      if (car) {
        car.position.set(Player.x, Player.y + Math.sin(Player.gameTime * 3) * 0.2, Player.z);
        car.rotation.y = totalAngle;
      }
    }

    // Camera
    Camera.update(Player, curve2, Player.gameTime);

    // Beacons
    this._updateBeacons();

    // Effects systems
    Confetti.update(dt);
    Mascot.update(dt);
    Powerups.updateVisuals(dt);

    // HUD
    UI.updateHUD();
    HUD.render();
  },

  _detectNearMiss(curve) {
    if (!curve || !Opponents.list) return null;
    const minDist = 4.5;
    for (const opp of Opponents.list) {
      if (!opp) continue;
      const dx = opp.x - Player.x;
      const dz = opp.z - Player.z;
      const d = Math.hypot(dx, dz);
      if (d < minDist && !opp._nearMissTriggered && Physics.v > 100) {
        opp._nearMissTriggered = true;
        setTimeout(() => { opp._nearMissTriggered = false; }, 1500);
        return { x: opp.x, z: opp.z, dist: d };
      }
    }
    return null;
  },

  _render() {
    Engine.composer.render();
  },

  _updateBeacons() {
    const curve = Environment.getCurve();
    if (!curve) return;
    Environment.trackMeshes.forEach(m => {
      if (m.userData && m.userData.phase !== undefined) {
        const pulse = 1 + Math.sin(Player.gameTime * 1.8 + m.userData.phase) * 0.12;
        m.scale.setScalar(pulse);
        m.material.opacity = 0.6 + Math.sin(Player.gameTime * 1.8 + m.userData.phase) * 0.3;
      }
    });
  },

  end() {
    this.state = 'gameover';
    Audio.playRaceEnd();
    Mascot.hide();

    const isNewRecord = Save.saveTrackRecord(Environment.selectedTrack, Player.bestLapTime);
    Save.saveLapTimes(Environment.selectedTrack, Player.lapTimes);
    Save.set('tracksRaced', Array.from(new Set([...(Save.get('tracksRaced') || []), Environment.selectedTrack])));

    const unlocks = Achievements.onFinish();
    const finalScore = Combos.score;
    const position = Opponents.getRank ? Opponents.getRank(Player.lap, Player.progress) : 1;

    const timeStr = formatTime(Player.gameTime);
    const bestLapStr = Player.bestLapTime < 9999 ? formatTime(Player.bestLapTime) : '—';
    const topSpeed = Player.topSpeed || 0;

    // Brief settle then show reward modal
    setTimeout(() => {
      Audio.playFanfare();
      RewardModal.show(position, timeStr, bestLapStr, topSpeed, isNewRecord);
    }, 800);
  },

  returnToMenu() {
    this.state = 'menu';
    Mascot.hide();
    Combos.reset();
    Powerups.reset();
    RewardModal.hide();
    UI.show('start-screen');
    if (typeof document.getElementById('ui') !== 'undefined') {
      const go = document.getElementById('game-over');
      if (go) go.style.display = 'none';
    }
  },

  _createStartBackground() {
    const container = document.getElementById('start-bg');
    if (!container) return;
    for (let i = 0; i < 50; i++) {
      const p = document.createElement('div');
      p.className = 'start-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (3 + Math.random() * 7) + 's';
      p.style.animationDelay = Math.random() * 5 + 's';
      p.style.width = p.style.height = (1 + Math.random() * 3) + 'px';
      p.style.background = ['#0ff', '#f0f', '#ff0', '#f80'][Math.floor(Math.random() * 4)];
      container.appendChild(p);
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
  window.__neon = { Game, Engine, Input, Audio, Player, Physics, UI, HUD,
    Particles, Environment, CarBuilder, Opponents, Camera, Save, AIDriver,
    Combos, Powerups, Messages, Achievements, Confetti, Mascot, RewardModal,
    TRACKS, formatTime, getRankSuffix, clearAIKeys, latLngTo3D };
}
try {
  Game.init();
} catch (e) {
  console.error('Game init failed:', e);
  const ui = document.getElementById('ui');
  if (ui) {
    const err = document.createElement('div');
    err.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#f00;font-family:monospace;text-align:center;z-index:9999;background:rgba(0,0,0,0.9);padding:30px;border:1px solid #f00;border-radius:8px;max-width:600px';
    err.innerHTML = '<h2 style="color:#f00;margin-bottom:15px">⚠ GAME FAILED TO START</h2>' +
      '<p style="color:#fff;margin-bottom:10px">' + (e.message || e) + '</p>' +
      '<p style="color:#888;font-size:12px">Try updating your browser or enabling hardware acceleration.</p>';
    ui.appendChild(err);
  }
}
