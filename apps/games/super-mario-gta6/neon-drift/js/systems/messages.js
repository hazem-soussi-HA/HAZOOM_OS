// ═══════════════════════════════════════════════════════════════
// SYSTEMS: MESSAGES
// Toast notifications, race-engineer encouragement, funny crash messages
// ═══════════════════════════════════════════════════════════════

const Messages = {
  container: null,
  flashEl: null,
  queue: [],
  lastFlash: 0,
  lastRaceComment: 0,

  // Encouraging phrases for the race engineer voice
  positive: [
    "You've got this!",
    "Smooth operator!",
    "Line looks perfect!",
    "Beautiful apex!",
    "Send it!",
    "That's the line!",
    "Keep it pinned!",
    "Textbook corner!",
    "Drift like you mean it!",
    "Neon poetry!",
    "Car's singing!",
    "Feel the grip!",
    "Trust the machine!",
    "Surgical precision!",
  ],

  speedComments: [
    { min: 100, msg: "Warming up!" },
    { min: 200, msg: "Now we're talking!" },
    { min: 300, msg: "Speed demon!" },
    { min: 400, msg: "Light speed! Hold on!" },
  ],

  funnyCrash: [
    "Ouch! That'll buff out! 🤕",
    "Dents are just memories! 💪",
    "Rubber side down next time!",
    "Plot armor engaged!",
    "Hey, even pros crash!",
    "Friendly fender kiss! 💋",
    "Sparks = extra style points! ✨",
    "Tape it up and keep going!",
    "Physics said 'no'. You said 'yes'!",
    "Your paint job sends its regards!",
  ],

  funnySlow: [
    "Coffee break? ☕",
    "Turtles race too!",
    "Scenic route champion!",
    "Slow and steady... nah, just slow!",
    "Honk if you need help!",
  ],

  init() {
    // Create toast container
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = 'position:absolute;top:35%;left:50%;transform:translateX(-50%);z-index:25;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:6px';
    document.getElementById('ui').appendChild(this.container);

    // Create big flash element (for combo tier messages)
    this.flashEl = document.createElement('div');
    this.flashEl.id = 'big-flash';
    this.flashEl.style.cssText = 'position:absolute;top:18%;left:50%;transform:translateX(-50%);font-family:"Courier New",monospace;font-size:42px;font-weight:900;letter-spacing:6px;opacity:0;transition:opacity 0.3s,transform 0.4s;z-index:30;pointer-events:none;text-shadow:0 0 20px currentColor,0 0 40px currentColor';
    document.getElementById('ui').appendChild(this.flashEl);
  },

  // Small toast at the top (for power-ups, etc.)
  toast(text, color) {
    if (!this.container) return;
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.textContent = text;
    el.style.cssText = `background:rgba(0,0,0,0.7);color:${color || '#fff'};padding:6px 16px;border-radius:14px;font-family:'Courier New',monospace;font-size:12px;letter-spacing:1px;border:1px solid ${color || '#fff'}55;animation:toastPop 2.4s ease-out forwards`;
    this.container.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  },

  // Big centered flash (for combo tier announcements)
  flash(text, color) {
    if (!this.flashEl) return;
    const now = performance.now();
    if (now - this.lastFlash < 600) return; // throttle
    this.lastFlash = now;
    this.flashEl.textContent = text;
    this.flashEl.style.color = color || '#fff';
    this.flashEl.style.opacity = '1';
    this.flashEl.style.transform = 'translateX(-50%) scale(1.15)';
    setTimeout(() => {
      this.flashEl.style.opacity = '0';
      this.flashEl.style.transform = 'translateX(-50%) scale(0.85)';
    }, 400);
  },

  // Periodic race engineer commentary (positive vibes)
  raceComment(force) {
    const now = performance.now();
    if (!force && now - this.lastRaceComment < 8000) return;
    if (Math.random() > 0.4 && !force) return;
    this.lastRaceComment = now;
    const msg = this.positive[Math.floor(Math.random() * this.positive.length)];
    this.toast('💬 ' + msg, '#0ff');
  },

  speedComment(kmh) {
    for (let i = this.speedComments.length - 1; i >= 0; i--) {
      if (kmh >= this.speedComments[i].min) {
        const tier = this.speedComments[i];
        const last = Player._lastSpeedComment || 0;
        if (tier.min !== last) {
          Player._lastSpeedComment = tier.min;
          this.flash(tier.msg, '#0f0');
          Audio.playCheer();
        }
        break;
      }
    }
  },

  onCrash() {
    const msg = this.funnyCrash[Math.floor(Math.random() * this.funnyCrash.length)];
    this.flash(msg, '#f80');
    Audio.playBoo();
  },

  onSlow() {
    if (Math.random() < 0.05) { // rare so it doesn't spam
      const msg = this.funnySlow[Math.floor(Math.random() * this.funnySlow.length)];
      this.toast('💬 ' + msg, '#888');
    }
  },

  // At race start
  onStart() {
    this.flash("LET'S GOOO!", '#0f0');
    setTimeout(() => this.toast("💬 You're doing great — trust the line!", '#0ff'), 1500);
  },

  // At race end
  onFinish(position) {
    const positionComments = {
      1: "CHAMPION! You absolute legend! 🏆",
      2: "Silver! So close to gold — you've got this! 🥈",
      3: "Podium finish! Bronze brilliance! 🥉",
      4: "Top half finish! The comeback is real!",
      5: "P4 or P5 — still proud of you!",
    };
    const msg = positionComments[position] || "You finished! That's what matters! 🎉";
    setTimeout(() => this.flash(msg, '#0f0'), 1500);
  },

  onPersonalBest() {
    this.flash('NEW PERSONAL BEST! 🎉', '#ff0');
    Audio.playFanfare();
  },

  onPowerup(pickupInfo) {
    if (!pickupInfo || !pickupInfo.info) return;
    const type = pickupInfo.info;
    this.toast(`${type.emoji} ${type.name} acquired!`, '#' + type.color.toString(16).padStart(6, '0'));
    setTimeout(() => this.toast(type.desc, '#fff'), 600);
  }
};
