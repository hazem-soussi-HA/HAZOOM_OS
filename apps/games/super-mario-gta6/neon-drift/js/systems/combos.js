// ═══════════════════════════════════════════════════════════════
// SYSTEMS: COMBO & SCORING
// Drift chain multiplier, total score, rewards for skill
// ═══════════════════════════════════════════════════════════════

const Combos = {
  // Current state
  count: 0,           // consecutive drift ticks
  score: 0,           // accumulated session score
  bestCombo: 0,       // best combo this race
  bestScore: 0,       // best total score ever
  scoreThisLap: 0,    // resets per lap
  bestLapScore: 0,    // best single-lap score
  lastDriftTime: 0,   // for combo timeout
  comboTimeout: 1500, // ms without drift before combo breaks
  perfectCorners: 0,  // tight drifts
  nearMisses: 0,      // close calls with opponents

  // Thresholds for messages
  msgTiers: [
    { min: 2,  text: 'NICE DRIFT!',  color: '#0ff' },
    { min: 5,  text: 'SMOOTH!',      color: '#0f0' },
    { min: 10, text: 'DRIFT KING!',  color: '#ff0' },
    { min: 20, text: 'NEON LEGEND!', color: '#f0f' },
    { min: 35, text: 'GODLIKE!',     color: '#f80' },
  ],

  reset() {
    this.count = 0;
    this.score = 0;
    this.bestCombo = 0;
    this.scoreThisLap = 0;
    this.lastDriftTime = 0;
    this.perfectCorners = 0;
    this.nearMisses = 0;
  },

  newLap() {
    if (this.scoreThisLap > this.bestLapScore) this.bestLapScore = this.scoreThisLap;
    this.scoreThisLap = 0;
  },

  // Called every frame the player is drifting
  tick(drifting, slipAngle, speedKmh, dt) {
    const now = performance.now();

    // Break combo if too much time passed
    if (this.count > 0 && now - this.lastDriftTime > this.comboTimeout) {
      this.breakCombo();
    }

    if (!drifting || speedKmh < 8) return;

    this.count++;
    this.lastDriftTime = now;

    // Score formula: speed * slip * sqrt(combo) — rewards long chains
    const base = Math.abs(slipAngle) * speedKmh * 0.5;
    const multiplier = 1 + Math.sqrt(this.count) * 0.4;
    const points = Math.floor(base * multiplier);

    this.score += points;
    this.scoreThisLap += points;

    if (this.count > this.bestCombo) this.bestCombo = this.count;

    // Tier messages every few combo milestones
    const tier = this.msgTiers.filter(t => this.count === t.min)[0];
    if (tier) {
      Messages.flash(tier.text, tier.color);
      if (this.count >= 10) Audio.playCheer();
    }
  },

  breakCombo() {
    if (this.count >= 3) {
      const pts = this.count * 50;
      this.score += pts;
      this.scoreThisLap += pts;
      Messages.flash(`COMBO +${pts}!`, '#ff0');
    }
    this.count = 0;
  },

  recordNearMiss(x, z) {
    this.nearMisses++;
    this.score += 250;
    this.scoreThisLap += 250;
    Messages.flash('NEAR MISS! +250', '#f0f');
  },

  perfectCorner() {
    this.perfectCorners++;
    this.score += 500;
    this.scoreThisLap += 500;
    Messages.flash('PERFECT CORNER! +500', '#0f0');
  },

  // Called every frame to detect smooth turns (low-slip drift at apex)
  checkPerfectCorner(playerX, playerZ, trackCurve) {
    if (!trackCurve || !Player.drifting) return false;
    // Detect apex of a curve: when lateral acceleration is high but slip is low
    const slip = Math.abs(Player.driftAngle);
    const speed = Physics.v;
    if (slip < 0.25 && slip > 0.05 && speed > 80 && Physics.angularVel * Physics.steerInput > 0) {
      // throttle to avoid spamming
      if (performance.now() - (this._lastPerfect || 0) < 5000) return false;
      this._lastPerfect = performance.now();
      this.perfectCorner();
      return true;
    }
    return false;
  },

  // Returns medal based on score for race end
  getMedal() {
    if (this.score >= 50000) return { name: 'PLATINUM',   color: '#f0f', emoji: '💎' };
    if (this.score >= 25000) return { name: 'GOLD',       color: '#ff0', emoji: '🥇' };
    if (this.score >= 10000) return { name: 'SILVER',     color: '#c0c0c0', emoji: '🥈' };
    if (this.score >= 3000)  return { name: 'BRONZE',     color: '#cd7f32', emoji: '🥉' };
    return { name: 'PARTICIPANT', color: '#0ff', emoji: '⭐' };
  },

  // Returns a fun title based on best combo
  getTitle() {
    if (this.bestCombo >= 35) return 'NEON DEITY';
    if (this.bestCombo >= 20) return 'DRIFT SAGE';
    if (this.bestCombo >= 10) return 'SLIP ANGLE SPECIALIST';
    if (this.bestCombo >= 5)  return 'ROAD DANCER';
    if (this.bestCombo >= 2)  return 'TIRE WARMER';
    return 'LAP TIME LEARNER';
  }
};
