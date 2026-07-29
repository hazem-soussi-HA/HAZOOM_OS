// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Hazem Soussi (HA)
// <https://github.com/hazem-soussi-HA>
//
// Part of SUPER MARIO GTA6 — unofficial, non-commercial fan project.
// Not affiliated with Nintendo® or Take-Two Interactive® / Rockstar Games®.
// See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md.

// ═══════════════════════════════════════════════════════════════
// UI: SETTINGS MENU
// In-game modal: volume, FPS toggle, hitbox toggle, key rebinding
// Settings persist to localStorage via Settings.loadSettings / saveSettings
// ═══════════════════════════════════════════════════════════════

var SettingsUI = {
    open: false,
    rebindingAction: null,

    ACTION_LABELS: {
        left:   'Move Left',
        right:  'Move Right',
        jump:   'Jump',
        run:    'Run',
        fire:   'Fire',
        hat:    'Switch Hat',
        car:    'Enter/Exit Car',
        camera: 'Cycle Camera',
        pause:  'Pause'
    },

    ACTION_ORDER: ['left', 'right', 'jump', 'run', 'fire', 'hat', 'car', 'camera', 'pause'],

    init() {
        if (typeof loadSettings === 'function') loadSettings();
        this.injectDOM();
        this.bindEvents();
    },

    injectDOM() {
        if (document.getElementById('settings-btn')) return;
        var btn = document.createElement('button');
        btn.id = 'settings-btn';
        btn.textContent = '⚙ SETTINGS';
        btn.style.cssText = 'position:fixed;top:8px;right:8px;z-index:9999;padding:8px 14px;background:rgba(0,0,0,0.6);color:#00e5ff;border:1px solid #00e5ff;border-radius:6px;font:bold 11px Inter,Arial,sans-serif;cursor:pointer;letter-spacing:1px;';
        btn.onmouseover = function() { btn.style.background = 'rgba(0,229,255,0.2)'; };
        btn.onmouseout  = function() { btn.style.background = 'rgba(0,0,0,0.6)'; };
        btn.onclick = () => this.toggle();
        document.body.appendChild(btn);

        var modal = document.createElement('div');
        modal.id = 'settings-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.85);display:none;align-items:center;justify-content:center;font-family:Inter,Arial,sans-serif;color:#fff;';
        modal.innerHTML = this.buildHTML();
        document.body.appendChild(modal);
    },

    buildHTML() {
        var rows = '';
        for (var i = 0; i < this.ACTION_ORDER.length; i++) {
            var action = this.ACTION_ORDER[i];
            var keys = (Settings.keyBindings && Settings.keyBindings[action]) || [];
            var label = this.ACTION_LABELS[action] || action;
            var display = keys.length ? keys.join(' / ') : '(unset)';
            rows += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">' +
                '<span style="color:#ccc;">' + label + '</span>' +
                '<button data-action="' + action + '" class="rebind-btn" style="padding:6px 12px;background:rgba(0,229,255,0.1);border:1px solid #00e5ff;color:#00e5ff;border-radius:4px;font:11px Inter,Arial,sans-serif;cursor:pointer;min-width:120px;">' + display + '</button>' +
                '</div>';
        }
        return '<div style="background:#0a0a18;padding:30px 40px;border:1px solid #00e5ff;border-radius:12px;width:520px;max-width:90vw;max-height:85vh;overflow-y:auto;box-shadow:0 0 40px rgba(0,229,255,0.3);">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
                '<h2 style="color:#00e5ff;margin:0;font-size:20px;letter-spacing:2px;">⚙ SETTINGS</h2>' +
                '<button id="settings-close" style="background:transparent;border:none;color:#fff;font-size:24px;cursor:pointer;">✕</button>' +
            '</div>' +
            '<div style="margin-bottom:20px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">' +
                '<label style="display:flex;justify-content:space-between;align-items:center;">' +
                    '<span style="color:#ccc;">Master Volume</span>' +
                    '<input type="range" id="set-volume" min="0" max="100" value="' + ((Settings.volume || 0.5) * 100) + '" style="width:200px;accent-color:#00e5ff;">' +
                '</label>' +
                '<label style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">' +
                    '<span style="color:#ccc;">Show FPS</span>' +
                    '<input type="checkbox" id="set-fps" ' + (Settings.showFPS ? 'checked' : '') + ' style="accent-color:#00e5ff;width:18px;height:18px;">' +
                '</label>' +
                '<label style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">' +
                    '<span style="color:#ccc;">Show Hitboxes</span>' +
                    '<input type="checkbox" id="set-hitboxes" ' + (Settings.showHitboxes ? 'checked' : '') + ' style="accent-color:#00e5ff;width:18px;height:18px;">' +
                '</label>' +
            '</div>' +
            '<div style="font-size:11px;letter-spacing:1px;color:#888;margin-bottom:8px;">KEY BINDINGS — click a key to rebind</div>' +
            rows +
            '<div style="margin-top:20px;display:flex;gap:10px;">' +
                '<button id="set-reset" style="flex:1;padding:10px;background:rgba(255,68,68,0.1);border:1px solid #ff4444;color:#ff4444;border-radius:4px;cursor:pointer;font:11px Inter,Arial,sans-serif;letter-spacing:1px;">RESET DEFAULTS</button>' +
                '<button id="set-save" style="flex:1;padding:10px;background:rgba(0,229,255,0.2);border:1px solid #00e5ff;color:#00e5ff;border-radius:4px;cursor:pointer;font:11px Inter,Arial,sans-serif;letter-spacing:1px;">SAVE & CLOSE</button>' +
            '</div>' +
        '</div>';
    },

    bindEvents() {
        var self = this;
        document.getElementById('settings-close').onclick = () => self.save();
        document.getElementById('set-save').onclick = () => self.save();
        document.getElementById('set-reset').onclick = () => self.resetDefaults();
        var rebinds = document.querySelectorAll('.rebind-btn');
        for (var i = 0; i < rebinds.length; i++) {
            rebinds[i].onclick = function(e) { self.startRebind(e.target.dataset.action, e.target); };
        }
        var vol = document.getElementById('set-volume');
        if (vol) vol.oninput = function(e) { Settings.volume = e.target.value / 100; };
        var fps = document.getElementById('set-fps');
        if (fps) fps.onchange = function(e) { Settings.showFPS = e.target.checked; };
        var hb = document.getElementById('set-hitboxes');
        if (hb) hb.onchange = function(e) { Settings.showHitboxes = e.target.checked; };

        // Esc closes / capture rebind
        window.addEventListener('keydown', function(e) {
            if (self.open && e.key === 'Escape' && !self.rebindingAction) {
                self.save();
            } else if (self.rebindingAction) {
                e.preventDefault();
                e.stopPropagation();
                self.captureKey(e);
            }
        }, true);
    },

    toggle() {
        if (this.open) this.save();
        else this.show();
    },

    show() {
        var modal = document.getElementById('settings-modal');
        if (!modal) return;
        modal.innerHTML = this.buildHTML();
        this.bindEvents();
        modal.style.display = 'flex';
        this.open = true;
    },

    save() {
        if (typeof saveSettings === 'function') saveSettings();
        var modal = document.getElementById('settings-modal');
        if (modal) modal.style.display = 'none';
        this.open = false;
        this.rebindingAction = null;
    },

    resetDefaults() {
        Settings.volume = 0.5;
        Settings.showFPS = false;
        Settings.showHitboxes = false;
        Settings.keyBindings = {
            left: ['ArrowLeft', 'a'],
            right: ['ArrowRight', 'd'],
            jump: [' ', 'w', 'ArrowUp'],
            run: ['Shift'],
            fire: ['e', 'x'],
            hat: ['h'],
            car: ['f'],
            camera: ['c'],
            pause: ['Escape']
        };
        if (typeof saveSettings === 'function') saveSettings();
        this.show();
    },

    startRebind(action, btn) {
        this.rebindingAction = action;
        btn.textContent = 'Press any key...';
        btn.style.background = 'rgba(255,200,0,0.2)';
        btn.style.borderColor = '#ffcc00';
        btn.style.color = '#ffcc00';
    },

    captureKey(e) {
        if (!this.rebindingAction) return;
        var key = e.key;
        // Avoid binding modifier-only
        if (key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta') {
            // Allow Shift for run
            if (this.rebindingAction !== 'run') return;
        }
        if (!Settings.keyBindings) Settings.keyBindings = {};
        Settings.keyBindings[this.rebindingAction] = [key];
        this.rebindingAction = null;
        // Refresh UI
        this.show();
    }
};
