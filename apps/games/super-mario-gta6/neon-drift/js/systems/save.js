// ═══════════════════════════════════════════════════════════════
// SYSTEMS: SAVE / LOAD
// localStorage persistence for settings, best times, keybinds
// ═══════════════════════════════════════════════════════════════

const Save = {
  prefix: 'neondrift_',

  get(key) {
    try {
      const data = localStorage.getItem(this.prefix + key);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  },

  set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (e) { /* quota exceeded, ignore */ }
  },

  remove(key) {
    try { localStorage.removeItem(this.prefix + key); } catch (e) {}
  },

  // Track records
  saveTrackRecord(trackKey, lapTime) {
    const records = this.get('records') || {};
    const prev = records[trackKey];
    if (!prev || lapTime < prev) {
      records[trackKey] = lapTime;
      this.set('records', records);
      return true; // new record
    }
    return false;
  },

  getTrackRecord(trackKey) {
    const records = this.get('records') || {};
    return records[trackKey] || null;
  },

  // Best lap times array
  saveLapTimes(trackKey, times) {
    const all = this.get('lapTimes') || {};
    all[trackKey] = times;
    this.set('lapTimes', all);
  },

  getLapTimes(trackKey) {
    const all = this.get('lapTimes') || {};
    return all[trackKey] || [];
  },

  clearAll() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
    keys.forEach(k => localStorage.removeItem(k));
  }
};
