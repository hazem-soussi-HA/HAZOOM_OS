// ═══════════════════════════════════════════════════════════════
// ENGINE: INPUT
// Keyboard input handling with key rebinding support
// ═══════════════════════════════════════════════════════════════

const Input = {
  keys: {},
  justPressed: {},
  bindings: JSON.parse(JSON.stringify(KEY_BINDINGS)),

  init() {
    document.addEventListener('keydown', (e) => {
      const k = e.key;
      if (!this.keys[k]) this.justPressed[k] = true;
      this.keys[k] = true;
      this._handleSpecial(k, e);
    });
    document.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
    this._setupRebindHandlers();
  },

  _handleSpecial(key, e) {
    if (this._match(key, 'escape')) {
      if (Game.state === 'countdown') {
        Game.state = 'menu';
        Game.countdownActive = false;
        UI.show('start-screen');
        UI.hide('countdown');
      } else if (Game.state === 'racing') {
        Game.end();
      }
      e.preventDefault();
    }
    if (this._match(key, 'camera') && Game.state === 'racing') {
      Camera.cycle();
    }
  },

  _match(key, action) {
    return this.bindings[action] && this.bindings[action].includes(key);
  },

  isDown(action) {
    return this.bindings[action] && this.bindings[action].some(k => this.keys[k]);
  },

  isPressed(action) {
    return this.bindings[action] && this.bindings[action].some(k => this.justPressed[k]);
  },

  clearJustPressed() {
    this.justPressed = {};
  },

  consume(action) {
    if (this.isPressed(action)) {
      this.bindings[action].forEach(k => { this.justPressed[k] = false; });
      return true;
    }
    return false;
  },

  _setupRebindHandlers() {
    // Key rebinding via data-rebind attribute on settings UI
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-rebind]');
      if (!btn) return;
      const action = btn.dataset.rebind;
      btn.textContent = 'Press a key...';
      const handler = (ev) => {
        if (ev.key === 'Escape') {
          btn.textContent = this.bindings[action].join(' / ');
        } else {
          this.bindings[action] = [ev.key];
          btn.textContent = ev.key;
          Save.set('keybinds', this.bindings);
        }
        document.removeEventListener('keydown', handler);
      };
      document.addEventListener('keydown', handler);
    });
  },

  loadBindings() {
    const saved = Save.get('keybinds');
    if (saved) Object.assign(this.bindings, saved);
  }
};
