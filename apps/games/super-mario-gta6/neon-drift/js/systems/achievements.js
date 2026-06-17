// ═══════════════════════════════════════════════════════════════
// SYSTEMS: ACHIEVEMENTS
// Persistent milestones, funny titles, persistent unlocks
// ═══════════════════════════════════════════════════════════════

const Achievements = {
  catalog: [
    { id: 'first_blood',    name: 'Wheels Up',          desc: 'Finish your first race',                   emoji: '🏁', check: (s) => s.racesFinished >= 1 },
    { id: 'first_win',      name: 'Glory Hound',        desc: 'Win a race',                               emoji: '🏆', check: (s) => s.wins >= 1 },
    { id: 'three_wins',     name: 'Hat Trick',          desc: 'Win 3 races',                              emoji: '🎩', check: (s) => s.wins >= 3 },
    { id: 'ten_wins',       name: 'Hall of Fame',       desc: 'Win 10 races',                             emoji: '🌟', check: (s) => s.wins >= 10 },
    { id: 'combo_5',        name: 'Slip Slider',        desc: 'Land a 5x drift combo',                    emoji: '🌀', check: (s) => s.bestComboEver >= 5 },
    { id: 'combo_20',       name: 'Tire Whisperer',     desc: 'Land a 20x drift combo',                   emoji: '🌪️', check: (s) => s.bestComboEver >= 20 },
    { id: 'combo_50',       name: 'Grip? Never Heard',  desc: '50x drift combo',                          emoji: '⚡', check: (s) => s.bestComboEver >= 50 },
    { id: 'speed_demon',    name: 'Speed Demon',        desc: 'Hit 400 km/h',                             emoji: '🚀', check: (s) => s.maxSpeed >= 400 },
    { id: 'collector',      name: 'Power-Hungry',       desc: 'Collect 10 power-ups',                     emoji: '🧲', check: (s) => s.powerupsCollected >= 10 },
    { id: 'magnet_lover',   name: 'Attraction Master',  desc: 'Collect 25 power-ups with magnet',         emoji: '🧲', check: (s) => s.magnetCollects >= 25 },
    { id: 'platinum',       name: 'Platinum Pulse',     desc: 'Earn a Platinum medal',                     emoji: '💎', check: (s) => s.platinumMedals >= 1 },
    { id: 'perfectionist',  name: 'Perfectionist',      desc: 'Score 50,000+ in a single race',           emoji: '💯', check: (s) => s.bestScoreEver >= 50000 },
    { id: 'survivor',       name: 'Bounce-Back',        desc: 'Recover from 5 crashes in one race',       emoji: '💪', check: (s) => s.crashesInOneRace >= 5 },
    { id: 'no_crash',       name: 'Smooth Operator',    desc: 'Finish a race with zero crashes',          emoji: '✨', check: (s) => s.cleanRace >= 1 },
    { id: 'comeback',       name: 'Comeback Kid',       desc: 'Go from last to first place',              emoji: '🔄', check: (s) => s.comebackWins >= 1 },
    { id: 'all_tracks',     name: 'Globe Trotter',      desc: 'Race on every track',                      emoji: '🌍', check: (s) => s.tracksRaced >= 3 },
    { id: 'veteran',        name: 'Veteran Racer',      desc: 'Complete 25 races',                        emoji: '🎖️', check: (s) => s.racesFinished >= 25 },
    { id: 'tireless',       name: 'Tireless',           desc: 'Complete 100 races',                       emoji: '♾️', check: (s) => s.racesFinished >= 100 },
  ],

  // Persistent stats
  stats: {
    racesFinished: 0,
    wins: 0,
    bestComboEver: 0,
    maxSpeed: 0,
    powerupsCollected: 0,
    magnetCollects: 0,
    platinumMedals: 0,
    bestScoreEver: 0,
    cleanRace: 0,
    comebackWins: 0,
    tracksRaced: 0,
    crashesInOneRace: 0,
    unlockedIds: [],  // list of achievement ids
  },

  // Per-race scratch
  session: {
    crashes: 0,
    nearMisses: 0,
    perfectCorners: 0,
    startedInPosition: null,
  },

  init() {
    this.load();
  },

  load() {
    const saved = Save.get('stats');
    if (saved) Object.assign(this.stats, saved);
  },

  save() {
    Save.set('stats', this.stats);
  },

  startRace(trackKey, startingPosition) {
    this.session.crashes = 0;
    this.session.nearMisses = 0;
    this.session.perfectCorners = 0;
    this.session.startedInPosition = startingPosition;
    this._markTrackRaced(trackKey);
  },

  _markTrackRaced(trackKey) {
    const tracks = Save.get('tracksRaced') || [];
    if (!tracks.includes(trackKey)) {
      tracks.push(trackKey);
      Save.set('tracksRaced', tracks);
      this.stats.tracksRaced = tracks.length;
    }
  },

  recordCrash() {
    this.session.crashes++;
  },

  onCrash() {
    this.session.crashes++;
  },

  onFinish(position, trackKey) {
    this.stats.racesFinished++;
    if (position === 1) {
      this.stats.wins++;
      if (this.session.startedInPosition > 1) this.stats.comebackWins++;
    }
    if (this.session.crashes === 0) this.stats.cleanRace++;
    if (this.session.crashes >= 5) this.stats.crashesInOneRace = Math.max(this.stats.crashesInOneRace, this.session.crashes);
    if (Combos.bestCombo > this.stats.bestComboEver) this.stats.bestComboEver = Combos.bestCombo;
    if (Player.topSpeed > this.stats.maxSpeed) this.stats.maxSpeed = Player.topSpeed;
    if (Combos.score > this.stats.bestScoreEver) this.stats.bestScoreEver = Combos.score;
    if (Combos.getMedal().name === 'PLATINUM') this.stats.platinumMedals++;
    this.save();
    return this._checkAll();
  },

  // Manually update a stat (called from other systems)
  onPowerupCollected(usedMagnet) {
    this.stats.powerupsCollected++;
    if (usedMagnet) this.stats.magnetCollects++;
  },

  _checkAll() {
    const newlyUnlocked = [];
    this.catalog.forEach(a => {
      if (!this.stats.unlockedIds.includes(a.id) && a.check(this.stats)) {
        this.stats.unlockedIds.push(a.id);
        newlyUnlocked.push(a);
      }
    });
    if (newlyUnlocked.length) {
      this.save();
      newlyUnlocked.forEach((a, i) => {
        setTimeout(() => this._celebrate(a), 800 + i * 1800);
      });
    }
    return newlyUnlocked;
  },

  _celebrate(achievement) {
    Messages.flash(`${achievement.emoji} ${achievement.name}!`, '#ff0');
    Messages.toast(achievement.desc, '#ff0');
    Audio.playAchievement();
    Confetti.burst(120);
  },

  // Returns array of unlocked achievements
  getUnlocked() {
    return this.catalog.filter(a => this.stats.unlockedIds.includes(a.id));
  },

  // Returns array of locked achievements
  getLocked() {
    return this.catalog.filter(a => !this.stats.unlockedIds.includes(a.id));
  },

  // Progress percent
  getProgress() {
    return Math.round((this.stats.unlockedIds.length / this.catalog.length) * 100);
  }
};
