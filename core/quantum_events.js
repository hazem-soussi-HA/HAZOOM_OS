/**
 * HAZOOM OS — Quantum Event Bus
 * Central event system for quantum state changes, measurements, entanglement events
 * Provides reactive streams, event replay, and cross-window synchronization
 */

class QuantumEventBus {
  constructor() {
    if (QuantumEventBus.instance) return QuantumEventBus.instance;
    QuantumEventBus.instance = this;

    this.version = '1.0.0';
    this.listeners = new Map();           // event -> Set({callback, filter, once, context})
    this.eventHistory = [];               // Recent events for replay/debugging
    this.maxHistory = 1000;
    this.middleware = [];                 // Event middleware pipeline
    this.namespaces = new Map();          // namespace -> EventBus (child buses)

    // Event categories for filtering
    this.categories = {
      state: ['coherence_change', 'tick', 'initialized', 'noise_injected'],
      entanglement: ['entanglement_created', 'entanglement_broken', 'entanglement_swapped', 'entanglement_degraded'],
      superposition: ['superposition_created', 'superposition_collapsed', 'interference'],
      measurement: ['measured', 'bell_measurement', 'tomography'],
      network: ['qkd_key_generated', 'qkd_eavesdropper_detected', 'entanglement_distributed', 'teleportation_complete'],
      crypto: ['key_generated', 'keys_rotated', 'key_revoked', 'session_created', 'session_expired'],
      algorithm: ['grover_started', 'grover_complete', 'qaoa_iteration', 'vqe_converged'],
      system: ['error', 'warning', 'debug', 'metrics_update']
    };

    // Flatten for quick lookup
    this.eventToCategory = {};
    for (const [cat, events] of Object.entries(this.categories)) {
      events.forEach(e => this.eventToCategory[e] = cat);
    }

    // Cross-window sync
    this.syncChannels = new Map();        // channelName -> BroadcastChannel
    this.windowId = this.generateWindowId();

    console.log('[QuantumEvents] Initialized v' + this.version);
  }

  static getInstance() {
    if (!QuantumEventBus.instance) {
      QuantumEventBus.instance = new QuantumEventBus();
    }
    return QuantumEventBus.instance;
  }

  generateWindowId() {
    return `win_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // ========== CORE EVENT METHODS ==========
  on(event, callback, options = {}) {
    const { filter, once = false, context = null, priority = 0 } = options;

    if (!this.listeners.has(event)) this.listeners.set(event, []);

    const listener = {
      callback,
      filter: filter || (() => true),
      once,
      context,
      priority,
      id: `lst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    };

    this.listeners.get(event).push(listener);
    // Sort by priority (higher first)
    this.listeners.get(event).sort((a, b) => b.priority - a.priority);

    return listener.id;
  }

  off(event, listenerId) {
    const listeners = this.listeners.get(event);
    if (!listeners) return false;

    const idx = listeners.findIndex(l => l.id === listenerId);
    if (idx >= 0) {
      listeners.splice(idx, 1);
      return true;
    }
    return false;
  }

  offAll(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  emit(event, data = {}, meta = {}) {
    const eventObj = {
      event,
      data,
      meta: {
        ...meta,
        timestamp: Date.now(),
        windowId: this.windowId,
        category: this.eventToCategory[event] || 'custom'
      }
    };

    // Run middleware pipeline
    let processed = eventObj;
    for (const mw of this.middleware) {
      processed = mw(processed);
      if (!processed) return; // Middleware can suppress
    }

    // Add to history
    this.eventHistory.push(processed);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }

    // Emit to listeners
    const listeners = this.listeners.get(event) || [];
    for (const listener of listeners) {
      if (!listener.filter(processed.data, processed.meta)) continue;

      try {
        listener.callback.call(listener.context, processed.data, processed.meta);
      } catch (e) {
        console.error(`[QuantumEvents] Listener error for ${event}:`, e);
        this.emit('system:error', { source: 'listener', event, error: e.message });
      }

      if (listener.once) {
        this.off(event, listener.id);
      }
    }

    // Also emit to wildcard listeners
    const wildcard = this.listeners.get('*') || [];
    for (const listener of wildcard) {
      if (!listener.filter(processed.data, processed.meta)) continue;
      try {
        listener.callback.call(listener.context, processed.event, processed.data, processed.meta);
      } catch (e) {
        console.error('[QuantumEvents] Wildcard listener error:', e);
      }
    }

    // Sync to other windows
    this.syncToWindows(processed);

    return processed;
  }

  once(event, callback, options = {}) {
    return this.on(event, callback, { ...options, once: true });
  }

  // ========== MIDDLEWARE ==========
  use(middleware) {
    this.middleware.push(middleware);
    return () => {
      const idx = this.middleware.indexOf(middleware);
      if (idx >= 0) this.middleware.splice(idx, 1);
    };
  }

  // Built-in middleware
  static loggingMiddleware() {
    return (event) => {
      console.log(`[Q-Event] ${event.event}`, event.data);
      return event;
    };
  }

  static metricsMiddleware(metricsCollector) {
    return (event) => {
      if (metricsCollector) metricsCollector.record(event);
      return event;
    };
  }

  // ========== EVENT HISTORY & REPLAY ==========
  getHistory(filter = {}) {
    let events = [...this.eventHistory];

    if (filter.category) {
      events = events.filter(e => e.meta.category === filter.category);
    }
    if (filter.event) {
      events = events.filter(e => e.event === filter.event);
    }
    if (filter.since) {
      events = events.filter(e => e.meta.timestamp >= filter.since);
    }
    if (filter.until) {
      events = events.filter(e => e.meta.timestamp <= filter.until);
    }
    if (filter.windowId) {
      events = events.filter(e => e.meta.windowId === filter.windowId);
    }

    return events;
  }

  replay(events, delay = 0) {
    events.forEach((event, i) => {
      setTimeout(() => this.emit(event.event, event.data, event.meta), i * delay);
    });
  }

  clearHistory() {
    this.eventHistory = [];
  }

  // ========== NAMESPACED BUSES ==========
  namespace(name) {
    if (!this.namespaces.has(name)) {
      const nsBus = new QuantumEventBus();
      nsBus.parent = this;
      nsBus.namespaceName = name;

      // Forward events to parent with namespace prefix
      nsBus.use((event) => {
        if (event) {
          this.emit(`${name}:${event.event}`, event.data, { ...event.meta, namespace: name });
        }
        return event;
      });

      this.namespaces.set(name, nsBus);
    }
    return this.namespaces.get(name);
  }

  getNamespace(name) {
    return this.namespaces.get(name);
  }

  // ========== CROSS-WINDOW SYNC ==========
  enableWindowSync(channelName = 'hazoom_quantum_sync') {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('[QuantumEvents] BroadcastChannel not available');
      return;
    }

    if (this.syncChannels.has(channelName)) return;

    const channel = new BroadcastChannel(channelName);
    this.syncChannels.set(channelName, channel);

    channel.onmessage = (message) => {
      if (message.data.sourceWindowId === this.windowId) return;

      const { event, data, meta } = message.data;
      // Re-emit locally without re-syncing
      const listeners = this.listeners.get(event) || [];
      for (const listener of listeners) {
        if (!listener.filter(data, meta)) continue;
        try {
          listener.callback.call(listener.context, data, meta);
        } catch (e) {
          console.error('[QuantumEvents] Sync listener error:', e);
        }
      }
    };

    console.log('[QuantumEvents] Window sync enabled on', channelName);
  }

  disableWindowSync(channelName = 'hazoom_quantum_sync') {
    const channel = this.syncChannels.get(channelName);
    if (channel) {
      channel.close();
      this.syncChannels.delete(channelName);
    }
  }

  syncToWindows(eventObj) {
    for (const channel of this.syncChannels.values()) {
      try {
        channel.postMessage({
          sourceWindowId: this.windowId,
          event: eventObj.event,
          data: eventObj.data,
          meta: eventObj.meta
        });
      } catch (e) {
        console.debug('[QuantumEvents] Sync failed:', e);
      }
    }
  }

  // ========== CONVENIENCE METHODS ==========
  // State events
  onCoherenceChange(callback, filter) {
    return this.on('coherence_change', callback, { filter });
  }

  onEntanglementCreated(callback, filter) {
    return this.on('entanglement_created', callback, { filter });
  }

  onSuperpositionCollapsed(callback, filter) {
    return this.on('superposition_collapsed', callback, { filter });
  }

  onQKDKeyGenerated(callback, filter) {
    return this.on('qkd_key_generated', callback, { filter });
  }

  onKeysRotated(callback, filter) {
    return this.on('keys_rotated', callback, { filter });
  }

  // Category subscription
  onCategory(category, callback) {
    const events = this.categories[category] || [];
    return events.map(e => this.on(e, callback));
  }

  // Pattern matching (e.g., 'entanglement_*')
  onPattern(pattern, callback) {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    const matching = Array.from(this.listeners.keys()).filter(k => regex.test(k));
    return matching.map(e => this.on(e, callback));
  }

  // ========== DEBUGGING ==========
  getStats() {
    let totalListeners = 0;
    for (const listeners of this.listeners.values()) {
      totalListeners += listeners.length;
    }

    const byCategory = {};
    for (const [cat, events] of Object.entries(this.categories)) {
      let count = 0;
      for (const e of events) {
        count += this.listeners.get(e)?.length || 0;
      }
      byCategory[cat] = count;
    }

    return {
      totalEvents: this.listeners.size,
      totalListeners,
      historySize: this.eventHistory.length,
      namespaces: this.namespaces.size,
      syncChannels: this.syncChannels.size,
      byCategory,
      windowId: this.windowId
    };
  }

  // Debug: log all events
  startDebugLog() {
    return this.on('*', (event, data, meta) => {
      console.log(`[Q-Debug] ${meta.timestamp} ${event}`, data);
    });
  }

  // ========== CLEANUP ==========
  destroy() {
    this.offAll();
    this.eventHistory = [];
    this.middleware = [];
    for (const ns of this.namespaces.values()) {
      ns.destroy();
    }
    this.namespaces.clear();
    for (const channel of this.syncChannels.values()) {
      channel.close();
    }
    this.syncChannels.clear();
    QuantumEventBus.instance = null;
  }
}

// Reactivity helper — create reactive quantum state
QuantumEventBus.createReactive = function(initialState, bus = QuantumEventBus.getInstance()) {
  const state = { ...initialState };
  const proxies = new Map();

  const handler = {
    get(target, prop) {
      if (!proxies.has(prop)) {
        proxies.set(prop, {
          value: target[prop],
          subscribers: new Set()
        });
      }
      return proxies.get(prop).value;
    },
    set(target, prop, value) {
      const old = target[prop];
      target[prop] = value;

      if (!proxies.has(prop)) {
        proxies.set(prop, { value, subscribers: new Set() });
      }
      proxies.get(prop).value = value;

      // Emit change event
      bus.emit(`state:${prop}_change`, { key: prop, old, current: value });
      bus.emit('state:change', { key: prop, old, current: value, state: { ...target } });

      return true;
    }
  };

  const reactive = new Proxy(state, handler);

  // Subscribe to specific key
  reactive.subscribe = (key, callback) => {
    const id = bus.on(`state:${key}_change`, callback);
    return () => bus.off(`state:${key}_change`, id);
  };

  reactive.subscribeAll = (callback) => {
    const id = bus.on('state:change', callback);
    return () => bus.off('state:change', id);
  };

  return reactive;
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuantumEventBus;
} else if (typeof window !== 'undefined') {
  window.QuantumEventBus = QuantumEventBus;
  window.HAZOOM_QUANTUM_EVENTS = QuantumEventBus.getInstance();
}