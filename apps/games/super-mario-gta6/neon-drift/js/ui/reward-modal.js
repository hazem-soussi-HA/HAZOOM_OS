// ═══════════════════════════════════════════════════════════════
// UI: REWARD MODAL
// Shown at end of race with score, medal, title, achievements
// ═══════════════════════════════════════════════════════════════

const RewardModal = {
  el: null,
  isPersonalBest: false,

  init() {
    this.el = document.createElement('div');
    this.el.id = 'reward-modal';
    this.el.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.92);display:none;align-items:center;justify-content:center;flex-direction:column;pointer-events:all;z-index:60;animation:rewardFadeIn 0.6s ease-out';
    document.getElementById('ui').appendChild(this.el);
  },

  show(position, timeStr, bestLapStr, topSpeed, isNewRecord) {
    if (!this.el) this.init();

    // Hide the legacy game-over overlay so it doesn't bleed through
    const legacy = document.getElementById('game-over');
    if (legacy) legacy.style.display = 'none';

    const medal = Combos.getMedal();
    const title = Combos.getTitle();
    const unlocks = Achievements._checkAll(); // any pending unlocks from this race
    const stats = Achievements.stats;
    const wasFirstRace = stats.racesFinished === 1;

    this.isPersonalBest = isNewRecord;

    let html = `
      <div style="text-align:center;max-width:600px;padding:30px;animation:rewardSlideUp 0.5s ease-out">
        <div style="color:#0ff;font-size:14px;letter-spacing:6px;margin-bottom:8px">RACE COMPLETE</div>
        <div style="font-size:80px;margin-bottom:10px;filter:drop-shadow(0 0 20px ${medal.color})">${medal.emoji}</div>
        <div style="color:${medal.color};font-size:32px;font-weight:900;letter-spacing:8px;margin-bottom:8px;text-shadow:0 0 20px ${medal.color}">${medal.name}</div>
        ${isNewRecord ? '<div style="color:#ff0;font-size:18px;letter-spacing:4px;margin-bottom:15px;animation:starPulse 1.2s ease-in-out infinite">⭐ NEW PERSONAL BEST ⭐</div>' : '<div style="height:20px"></div>'}
        <div style="color:#f0f;font-size:14px;letter-spacing:3px;margin-bottom:25px;font-style:italic">"${title}"</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:25px;text-align:left">
          <div style="background:rgba(0,255,255,0.08);padding:12px;border-radius:6px;border-left:3px solid #0ff">
            <div style="color:#888;font-size:10px;letter-spacing:2px">FINAL POSITION</div>
            <div style="color:#0ff;font-size:24px;font-weight:700">${['1st','2nd','3rd','4th','5th'][position-1] || position+'th'}</div>
          </div>
          <div style="background:rgba(255,0,255,0.08);padding:12px;border-radius:6px;border-left:3px solid #f0f">
            <div style="color:#888;font-size:10px;letter-spacing:2px">TOTAL SCORE</div>
            <div style="color:#f0f;font-size:24px;font-weight:700">${Combos.score.toLocaleString()}</div>
          </div>
          <div style="background:rgba(0,255,0,0.08);padding:12px;border-radius:6px;border-left:3px solid #0f0">
            <div style="color:#888;font-size:10px;letter-spacing:2px">RACE TIME</div>
            <div style="color:#0f0;font-size:24px;font-weight:700">${timeStr}</div>
          </div>
          <div style="background:rgba(255,255,0,0.08);padding:12px;border-radius:6px;border-left:3px solid #ff0">
            <div style="color:#888;font-size:10px;letter-spacing:2px">BEST LAP</div>
            <div style="color:#ff0;font-size:24px;font-weight:700">${bestLapStr}</div>
          </div>
          <div style="background:rgba(255,128,0,0.08);padding:12px;border-radius:6px;border-left:3px solid #f80">
            <div style="color:#888;font-size:10px;letter-spacing:2px">TOP SPEED</div>
            <div style="color:#f80;font-size:24px;font-weight:700">${Math.floor(topSpeed)} km/h</div>
          </div>
          <div style="background:rgba(0,255,128,0.08);padding:12px;border-radius:6px;border-left:3px solid #0f8">
            <div style="color:#888;font-size:10px;letter-spacing:2px">BEST COMBO</div>
            <div style="color:#0f8;font-size:24px;font-weight:700">${Combos.bestCombo}x</div>
          </div>
        </div>
        <div style="display:flex;gap:20px;justify-content:center;margin-bottom:25px;flex-wrap:wrap">
          <div style="text-align:center">
            <div style="color:#888;font-size:9px;letter-spacing:2px">NEAR MISSES</div>
            <div style="color:#f0f;font-size:18px;font-weight:700">${Combos.nearMisses}</div>
          </div>
          <div style="text-align:center">
            <div style="color:#888;font-size:9px;letter-spacing:2px">PERFECT CORNERS</div>
            <div style="color:#0f0;font-size:18px;font-weight:700">${Combos.perfectCorners}</div>
          </div>
          <div style="text-align:center">
            <div style="color:#888;font-size:9px;letter-spacing:2px">CRASHES</div>
            <div style="color:#f80;font-size:18px;font-weight:700">${Achievements.session.crashes}</div>
          </div>
          <div style="text-align:center">
            <div style="color:#888;font-size:9px;letter-spacing:2px">ACHIEVEMENTS</div>
            <div style="color:#ff0;font-size:18px;font-weight:700">${stats.unlockedIds.length}/${Achievements.catalog.length}</div>
          </div>
        </div>
    `;

    if (unlocks.length > 0) {
      html += '<div style="margin-bottom:20px"><div style="color:#ff0;font-size:12px;letter-spacing:3px;margin-bottom:10px">🎉 ACHIEVEMENTS UNLOCKED 🎉</div>';
      unlocks.forEach(a => {
        html += `<div style="background:rgba(255,255,0,0.1);border:1px solid #ff0;padding:8px 12px;border-radius:6px;margin:6px 0;color:#ff0;font-size:13px">${a.emoji} <b>${a.name}</b> — <span style="color:#888">${a.desc}</span></div>`;
      });
      html += '</div>';
    }

    html += `
        <div style="display:flex;gap:12px;justify-content:center;margin-top:20px">
          <button id="reward-restart" style="padding:12px 30px;background:rgba(0,255,255,0.15);border:2px solid #0ff;color:#0ff;font-size:14px;cursor:pointer;letter-spacing:3px;border-radius:6px;font-family:inherit;transition:all 0.2s" onmouseover="this.style.background='rgba(0,255,255,0.3)'" onmouseout="this.style.background='rgba(0,255,255,0.15)'">⚡ RACE AGAIN</button>
          <button id="reward-menu" style="padding:12px 30px;background:rgba(255,0,255,0.1);border:1px solid #f0f;color:#f0f;font-size:14px;cursor:pointer;letter-spacing:3px;border-radius:6px;font-family:inherit;transition:all 0.2s" onmouseover="this.style.background='rgba(255,0,255,0.2)'" onmouseout="this.style.background='rgba(255,0,255,0.1)'">🏠 MAIN MENU</button>
        </div>
      </div>
    `;

    this.el.innerHTML = html;
    this.el.style.display = 'flex';

    document.getElementById('reward-restart').addEventListener('click', () => this._onRestart());
    document.getElementById('reward-menu').addEventListener('click', () => this._onMenu());

    // Show confetti for good performance
    if (medal.name === 'PLATINUM' || isNewRecord || unlocks.length > 0) {
      Confetti.burst(200);
    }
    if (isNewRecord) {
      Messages.onPersonalBest();
    }
  },

  _onRestart() {
    this.hide();
    Game.start();
  },

  _onMenu() {
    this.hide();
    Game.returnToMenu();
  },

  hide() {
    if (this.el) this.el.style.display = 'none';
  }
};
