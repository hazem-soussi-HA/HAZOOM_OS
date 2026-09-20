/**
 * HAZOOM OS — Quantum State Manager
 * Central singleton for quantum state: coherence, entanglement, superposition, decoherence
 * Provides reactive state with event emission for UI synchronization
 */

class QuantumStateManager {
  constructor() {
    if (QuantumStateManager.instance) {
      return QuantumStateManager.instance;
    }
    QuantumStateManager.instance = this;

    this.version = '1.0.0';
    this.initialized = false;

    // Core quantum properties
    this.coherence = 100;           // 0-100 global coherence
    this.decoherenceRate = 0.01;    // per tick decay
    this.entanglementGraph = new Map();  // nodeId -> Set(entangledNodeIds)
    this.superpositionRegistry = new Map(); // key -> {amplitudes, basis, collapsed}
    this.measurementHistory = [];   // recent measurements
    this.quantumNoise = 0;          // environmental noise factor

    // Component-level coherence (from heat monitor)
    this.componentCoherence = new Map(); // componentName -> 0-100

    // Event system
    this.listeners = new Map();
    this.tickInterval = null;
    this.tickRate = 100; // ms

    // Performance metrics
    this.metrics = {
      totalEntanglements: 0,
      totalSuperpositions: 0,
      totalCollapses: 0,
      avgCoherence: 100,
      decoherenceEvents: 0
    };

    // Persistence
    this.storageKey = 'hazoom_quantum_state';
    this.persistInterval = null;

    console.log('[QuantumState] Initialized v' + this.version);
  }

  // ========== SINGLETON ==========
  static getInstance() {
    if (!QuantumStateManager.instance) {
      QuantumStateManager.instance = new QuantumStateManager();
    }
    return QuantumStateManager.instance;
  }

  // ========== INITIALIZATION ==========
  async init() {
    if (this.initialized) return;

    // Load persisted state
    this.loadState();

    // Start decoherence tick
    this.startTick();

    // Start persistence
    this.startPersistence();

    // Initialize component coherence from heat monitor if available
    await this.syncWithHeatMonitor().catch(() => {});

    this.initialized = true;
    this.emit('initialized', { coherence: this.coherence });

    console.log('[QuantumState] Ready — coherence:', this.coherence);
  }

  // ========== COHERENCE MANAGEMENT ==========
  getCoherence() {
    return this.coherence;
  }

  setCoherence(value, source = 'manual') {
    const old = this.coherence;
    this.coherence = Math.max(0, Math.min(100, value));

    if (Math.abs(this.coherence - old) > 0.5) {
      this.emit('coherence_change', {
        old,
        current: this.coherence,
        delta: this.coherence - old,
        source
      });
      this.updateMetrics();
    }
    return this.coherence;
  }

  adjustCoherence(delta, source = 'adjustment') {
    return this.setCoherence(this.coherence + delta, source);
  }

  // Decoherence tick — called automatically
  _decoherenceTick() {
    // Base decoherence
    const decay = this.decoherenceRate * (1 + this.quantumNoise * 0.5);
    this.coherence = Math.max(0, this.coherence - decay);

    // Component decoherence
    for (const [comp, coh] of this.componentCoherence) {
      this.componentCoherence.set(comp, Math.max(0, coh - decay * 0.5));
    }

    // Entanglement degradation
    if (this.coherence < 30) {
      this._degradeEntanglements();
    }

    this.updateMetrics();
    this.emit('tick', { coherence: this.coherence, timestamp: Date.now() });
  }

  _degradeEntanglements() {
    for (const [node, entangled] of this.entanglementGraph) {
      // Randomly break entanglements under low coherence
      if (Math.random() < (1 - this.coherence / 100) * 0.01) {
        const toRemove = [];
        for (const other of entangled) {
          if (Math.random() < 0.3) {
            this.removeEntanglement(node, other);
            toRemove.push(other);
          }
        }
      }
    }
  }

  // Quantum noise injection (environmental)
  injectNoise(amount) {
    this.quantumNoise = Math.min(1, this.quantumNoise + amount);
    this.emit('noise_injected', { level: this.quantumNoise });
    // Noise decays over time
    setTimeout(() => {
      this.quantumNoise = Math.max(0, this.quantumNoise - amount * 0.5);
    }, 5000);
  }

  // ========== ENTANGLEMENT GRAPH ==========
  createEntanglement(nodeA, nodeB, strength = 1.0) {
    if (!this.entanglementGraph.has(nodeA)) this.entanglementGraph.set(nodeA, new Map());
    if (!this.entanglementGraph.has(nodeB)) this.entanglementGraph.set(nodeB, new Map());

    this.entanglementGraph.get(nodeA).set(nodeB, { strength, created: Date.now() });
    this.entanglementGraph.get(nodeB).set(nodeA, { strength, created: Date.now() });

    this.metrics.totalEntanglements++;
    this.emit('entanglement_created', { nodeA, nodeB, strength });
    return true;
  }

  removeEntanglement(nodeA, nodeB) {
    const aMap = this.entanglementGraph.get(nodeA);
    const bMap = this.entanglementGraph.get(nodeB);
    if (aMap) aMap.delete(nodeB);
    if (bMap) bMap.delete(nodeA);

    this.emit('entanglement_broken', { nodeA, nodeB });
    return true;
  }

  getEntanglements(node) {
    return this.entanglementGraph.get(node) || new Map();
  }

  getAllEntanglements() {
    const result = [];
    const seen = new Set();
    for (const [node, entangled] of this.entanglementGraph) {
      for (const [other, data] of entangled) {
        const key = [node, other].sort().join('-');
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ nodeA: node, nodeB: other, ...data });
        }
      }
    }
    return result;
  }

  getEntanglementStrength(nodeA, nodeB) {
    return this.entanglementGraph.get(nodeA)?.get(nodeB)?.strength || 0;
  }

  // Entanglement swapping (for quantum network)
  swapEntanglement(nodeA, nodeB, nodeC) {
    // A-B and B-C entangled -> create A-C
    const ab = this.getEntanglementStrength(nodeA, nodeB);
    const bc = this.getEntanglementStrength(nodeB, nodeC);
    if (ab > 0 && bc > 0) {
      const newStrength = Math.min(ab, bc) * 0.8; // Swapping reduces fidelity
      this.removeEntanglement(nodeA, nodeB);
      this.removeEntanglement(nodeB, nodeC);
      this.createEntanglement(nodeA, nodeC, newStrength);
      this.emit('entanglement_swapped', { nodeA, nodeB, nodeC, newStrength });
      return true;
    }
    return false;
  }

  // ========== SUPERPOSITION REGISTRY ==========
  createSuperposition(key, basisStates, amplitudes = null) {
    // basisStates: array of basis state labels (e.g., ['0', '1'] or ['up', 'down'])
    // amplitudes: array of complex amplitudes (default: equal superposition)
    const n = basisStates.length;
    const amps = amplitudes || Array(n).fill(1 / Math.sqrt(n));

    // Normalize
    const norm = Math.sqrt(amps.reduce((sum, a) => sum + a * a, 0));
    const normalized = amps.map(a => a / norm);

    const superposition = {
      key,
      basis: basisStates,
      amplitudes: normalized,
      collapsed: false,
      created: Date.now(),
      measurements: 0
    };

    this.superpositionRegistry.set(key, superposition);
    this.metrics.totalSuperpositions++;

    this.emit('superposition_created', { key, basis: basisStates, amplitudes: normalized });
    return superposition;
  }

  measureSuperposition(key) {
    const sp = this.superpositionRegistry.get(key);
    if (!sp || sp.collapsed) return sp?.collapsedValue || null;

    // Probabilistic collapse based on Born rule
    const rand = Math.random();
    let cumulative = 0;
    let outcome = sp.basis[0];

    for (let i = 0; i < sp.amplitudes.length; i++) {
      cumulative += sp.amplitudes[i] ** 2;
      if (rand < cumulative) {
        outcome = sp.basis[i];
        break;
      }
    }

    sp.collapsed = true;
    sp.collapsedValue = outcome;
    sp.measurements++;

    this.metrics.totalCollapses++;
    this.measurementHistory.push({ key, outcome, timestamp: Date.now() });
    if (this.measurementHistory.length > 1000) this.measurementHistory.shift();

    this.emit('superposition_collapsed', { key, outcome, previous: sp });
    return outcome;
  }

  getSuperposition(key) {
    return this.superpositionRegistry.get(key);
  }

  // Quantum interference — combine superpositions
  interfere(keyA, keyB, newKey, operation = 'add') {
    const a = this.superpositionRegistry.get(keyA);
    const b = this.superpositionRegistry.get(keyB);
    if (!a || !b) return null;

    // Simple amplitude addition (for same basis)
    if (JSON.stringify(a.basis) !== JSON.stringify(b.basis)) {
      console.warn('[QuantumState] Cannot interfere: different basis');
      return null;
    }

    let newAmplitudes;
    if (operation === 'add') {
      newAmplitudes = a.amplitudes.map((amp, i) => amp + b.amplitudes[i]);
    } else if (operation === 'subtract') {
      newAmplitudes = a.amplitudes.map((amp, i) => amp - b.amplitudes[i]);
    } else if (operation === 'hadamard') {
      // Hadamard-like mixing
      newAmplitudes = a.amplitudes.map((amp, i) => (amp + b.amplitudes[i]) / Math.sqrt(2));
    }

    return this.createSuperposition(newKey, a.basis, newAmplitudes);
  }

  // ========== COMPONENT COHERENCE (Heat Monitor Integration) ==========
  async syncWithHeatMonitor() {
    try {
      const response = await fetch('/heat');
      if (response.ok) {
        const data = await response.json();
        if (data.components && data.heat_vector) {
          data.components.forEach((comp, i) => {
            const coherence = Math.max(0, 100 - data.heat_vector[i]);
            this.componentCoherence.set(comp, coherence);
          });
          this.emit('components_synced', { components: Object.fromEntries(this.componentCoherence) });
        }
      }
    } catch (e) {
      console.debug('[QuantumState] Heat monitor not available:', e.message);
    }
  }

  getComponentCoherence(component) {
    return this.componentCoherence.get(component) || 100;
  }

  setComponentCoherence(component, coherence) {
    this.componentCoherence.set(component, Math.max(0, Math.min(100, coherence)));
    this.emit('component_coherence_change', { component, coherence });
  }

  // ========== QUANTUM OPERATIONS ==========
  // Quantum teleportation protocol (simulated)
  async teleportState(sourceNode, targetNode, stateKey) {
    // Requires: source-target entanglement + classical channel
    const entangled = this.getEntanglementStrength(sourceNode, targetNode) > 0;
    if (!entangled) {
      throw new Error('No entanglement channel between nodes');
    }

    const state = this.superpositionRegistry.get(stateKey);
    if (!state) throw new Error('State not found');

    // Bell measurement on source
    const bellOutcome = this.measureSuperposition(`bell_${sourceNode}_${stateKey}`);

    // Apply correction on target (simulated)
    const correctionKey = `correction_${targetNode}_${stateKey}`;
    this.createSuperposition(correctionKey, state.basis, state.amplitudes);

    this.emit('teleportation_complete', { sourceNode, targetNode, stateKey, bellOutcome });
    return { success: true, bellOutcome };
  }

  // Quantum error correction (3-qubit bit-flip code)
  encodeLogicalQubit(key, logicalState) {
    // |0>_L = |000>, |1>_L = |111>
    const physicalStates = logicalState === 0 ? ['0','0','0'] : ['1','1','1'];
    return this.createSuperposition(`${key}_encoded`, physicalStates, [1, 0, 0, 0, 0, 0, 0, 0]);
  }

  decodeLogicalQubit(encodedKey) {
    // Majority vote decoding
    const sp = this.superpositionRegistry.get(encodedKey);
    if (!sp) return null;

    // Simplified: measure and majority vote
    const measurements = sp.basis.map(b => this.measureSuperposition(`${encodedKey}_${b}`));
    const zeros = measurements.filter(m => m === '0').length;
    return zeros >= 2 ? 0 : 1;
  }

  // ========== METRICS & MONITORING ==========
  updateMetrics() {
    this.metrics.avgCoherence = this.coherence;
    this.metrics.decoherenceEvents = this.measurementHistory.filter(
      m => Date.now() - m.timestamp < 60000
    ).length;
  }

  getMetrics() {
    return {
      ...this.metrics,
      coherence: this.coherence,
      entanglements: this.getAllEntanglements().length,
      superpositions: this.superpositionRegistry.size,
      componentCoherence: Object.fromEntries(this.componentCoherence),
      quantumNoise: this.quantumNoise
    };
  }

  // ========== EVENT SYSTEM ==========
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach(cb => {
      try { cb(data); } catch (e) { console.error('[QuantumState] Event error:', e); }
    });
  }

  // ========== TICK LOOP ==========
  startTick() {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(() => this._decoherenceTick(), this.tickRate);
  }

  stopTick() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = null;
  }

  // ========== PERSISTENCE ==========
  saveState() {
    const state = {
      coherence: this.coherence,
      decoherenceRate: this.decoherenceRate,
      entanglements: this.getAllEntanglements(),
      superpositions: Object.fromEntries(
        Array.from(this.superpositionRegistry.entries()).map(([k, v]) => [
          k, { ...v, amplitudes: Array.from(v.amplitudes) }
        ])
      ),
      componentCoherence: Object.fromEntries(this.componentCoherence),
      metrics: this.metrics,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (e) {
      console.warn('[QuantumState] Persistence failed:', e);
    }
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const state = JSON.parse(saved);
        this.coherence = state.coherence || 100;
        this.decoherenceRate = state.decoherenceRate || 0.01;
        this.metrics = { ...this.metrics, ...state.metrics };

        // Restore entanglements
        if (state.entanglements) {
          state.entanglements.forEach(e => this.createEntanglement(e.nodeA, e.nodeB, e.strength));
        }

        // Restore superpositions
        if (state.superpositions) {
          Object.entries(state.superpositions).forEach(([k, v]) => {
            this.superpositionRegistry.set(k, { ...v, amplitudes: new Float32Array(v.amplitudes) });
          });
        }

        // Restore component coherence
        if (state.componentCoherence) {
          Object.entries(state.componentCoherence).forEach(([k, v]) => {
            this.componentCoherence.set(k, v);
          });
        }

        console.log('[QuantumState] Restored from persistence');
      }
    } catch (e) {
      console.warn('[QuantumState] Load failed:', e);
    }
  }

  startPersistence() {
    this.persistInterval = setInterval(() => this.saveState(), 30000);
  }

  stopPersistence() {
    if (this.persistInterval) clearInterval(this.persistInterval);
  }

  // ========== CLEANUP ==========
  destroy() {
    this.stopTick();
    this.stopPersistence();
    this.saveState();
    this.listeners.clear();
    this.entanglementGraph.clear();
    this.superpositionRegistry.clear();
    this.componentCoherence.clear();
    QuantumStateManager.instance = null;
  }
}

// Export for both module and global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuantumStateManager;
} else if (typeof window !== 'undefined') {
  window.QuantumStateManager = QuantumStateManager;
  window.HAZOOM_QUANTUM_STATE = QuantumStateManager.getInstance();
}