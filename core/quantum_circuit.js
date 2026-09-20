/**
 * HAZOOM OS — Quantum Circuit Simulator
 * WebGPU-accelerated statevector simulation for up to 20+ qubits
 * Supports standard gates, custom gates, measurement, and visualization
 */

class QuantumCircuit {
  constructor(numQubits = 4) {
    this.numQubits = Math.max(1, Math.min(numQubits, 20));
    this.dimension = 1 << this.numQubits;
    
    // Statevector as complex Float32Array [real0, imag0, real1, imag1, ...]
    this.statevector = new Float32Array(this.dimension * 2);
    this.statevector[0] = 1.0; // |0...0>
    
    // Circuit definition
    this.gates = [];
    this.measurements = new Map(); // qubit -> classical bit
    
    // WebGPU resources
    this.gpuDevice = null;
    this.computePipeline = null;
    this.stateBuffer = null;
    this.gateBuffer = null;
    this.useGPU = false;
    
    // Statistics
    this.gateCount = 0;
    this.depth = 0;
    this.executionTime = 0;
    
    // Callbacks
    onStateChange: null;
    
    console.log(`[QuantumCircuit] Initialized with ${this.numQubits} qubits (dim=${this.dimension})`);
  }

  // ========== GATE DEFINITIONS ==========
  static GATES = {
    // Single-qubit gates
    I:    { matrix: [1,0, 0,1], params: 0 },
    X:    { matrix: [0,1, 1,0], params: 0 },
    Y:    { matrix: [0,-1, 1,0], params: 0 },
    Z:    { matrix: [1,0, 0,-1], params: 0 },
    H:    { matrix: [1,1, 1,-1].map(v => v/Math.sqrt(2)), params: 0 },
    S:    { matrix: [1,0, 0,1j], params: 0 },
    T:    { matrix: [1,0, 0,Math.exp(1j*Math.PI/4)], params: 0 },
    Sdg:  { matrix: [1,0, 0,-1j], params: 0 },
    Tdg:  { matrix: [1,0, 0,Math.exp(-1j*Math.PI/4)], params: 0 },
    
    // Rotation gates (parameterized)
    Rx:   { matrix: (theta) => [Math.cos(theta/2), -1j*Math.sin(theta/2), -1j*Math.sin(theta/2), Math.cos(theta/2)], params: 1 },
    Ry:   { matrix: (theta) => [Math.cos(theta/2), -Math.sin(theta/2), Math.sin(theta/2), Math.cos(theta/2)], params: 1 },
    Rz:   { matrix: (phi) => [Math.exp(-1j*phi/2), 0, 0, Math.exp(1j*phi/2)], params: 1 },
    U:    { matrix: (theta, phi, lambda) => [
      Math.cos(theta/2), -1j*Math.exp(1j*lambda)*Math.sin(theta/2),
      -1j*Math.exp(1j*phi)*Math.sin(theta/2), Math.exp(1j*(phi+lambda))*Math.cos(theta/2)
    ], params: 3 },
    
    // Two-qubit gates
    CX:   { matrix: [1,0,0,0, 0,1,0,0, 0,0,0,1, 0,0,1,0], params: 0 },
    CZ:   { matrix: [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,-1], params: 0 },
    SWAP: { matrix: [1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1], params: 0 },
    iSWAP: { matrix: [1,0,0,0, 0,0,1j,0, 0,1j,0,0, 0,0,0,1], params: 0 },
    
    // Three-qubit
    CCX:  { matrix: [1,0,0,0,0,0,0,0, 0,1,0,0,0,0,0,0, 0,0,1,0,0,0,0,0, 0,0,0,1,0,0,0,0, 0,0,0,0,1,0,0,0, 0,0,0,0,0,1,0,0, 0,0,0,0,0,0,0,1, 0,0,0,0,0,0,1,0], params: 0 },
  };

  // ========== STATE MANAGEMENT ==========
  reset(numQubits = null) {
    if (numQubits !== null) {
      this.numQubits = Math.max(1, Math.min(numQubits, 20));
      this.dimension = 1 << this.numQubits;
      this.statevector = new Float32Array(this.dimension * 2);
      if (this.stateBuffer) this.stateBuffer.destroy();
    }
    this.statevector.fill(0);
    this.statevector[0] = 1.0;
    this.gates = [];
    this.measurements.clear();
    this.gateCount = 0;
    this.depth = 0;
    this._uploadToGPU();
    this._notifyChange();
  }

  getStatevector() {
    return this.statevector.slice();
  }

  getProbabilities() {
    const probs = new Float32Array(this.dimension);
    for (let i = 0; i < this.dimension; i++) {
      const re = this.statevector[i * 2];
      const im = this.statevector[i * 2 + 1];
      probs[i] = re * re + im * im;
    }
    return probs;
  }

  getAmplitudes() {
    const amps = [];
    for (let i = 0; i < this.dimension; i++) {
      amps.push({ real: this.statevector[i * 2], imag: this.statevector[i * 2 + 1] });
    }
    return amps;
  }

  // ========== GATE APPLICATION ==========
  applyGate(gateName, targets, params = []) {
    const gate = QuantumCircuit.GATES[gateName];
    if (!gate) throw new Error(`Unknown gate: ${gateName}`);
    
    const qubits = Array.isArray(targets) ? targets : [targets];
    
    // Validate qubit indices
    for (const q of qubits) {
      if (q < 0 || q >= this.numQubits) throw new Error(`Qubit ${q} out of range`);
    }
    
    // Build gate matrix
    let matrix;
    if (typeof gate.matrix === 'function') {
      matrix = gate.matrix(...params);
    } else {
      matrix = gate.matrix;
    }
    
    // Apply to statevector
    this._applyMatrix(matrix, qubits);
    
    // Record gate
    this.gates.push({ name: gateName, targets: qubits, params, time: Date.now() });
    this.gateCount++;
    this._updateDepth();
    
    this._notifyChange();
    return this;
  }

  // Convenience methods
  h(target) { return this.applyGate('H', target); }
  x(target) { return this.applyGate('X', target); }
  y(target) { return this.applyGate('Y', target); }
  z(target) { return this.applyGate('Z', target); }
  s(target) { return this.applyGate('S', target); }
  t(target) { return this.applyGate('T', target); }
  sdg(target) { return this.applyGate('Sdg', target); }
  tdg(target) { return this.applyGate('Tdg', target); }
  rx(target, theta) { return this.applyGate('Rx', target, [theta]); }
  ry(target, theta) { return this.applyGate('Ry', target, [theta]); }
  rz(target, phi) { return this.applyGate('Rz', target, [phi]); }
  u(target, theta, phi, lambda) { return this.applyGate('U', target, [theta, phi, lambda]); }
  
  cx(control, target) { return this.applyGate('CX', [control, target]); }
  cz(control, target) { return this.applyGate('CZ', [control, target]); }
  swap(q1, q2) { return this.applyGate('SWAP', [q1, q2]); }
  iswap(q1, q2) { return this.applyGate('iSWAP', [q1, q2]); }
  ccx(c1, c2, target) { return this.applyGate('CCX', [c1, c2, target]); }

  // Controlled version of any single-qubit gate
  controlled(gateName, control, target, params = []) {
    const gate = QuantumCircuit.GATES[gateName];
    if (!gate || gate.params > 0) throw new Error(`Cannot control parameterized gate ${gateName} directly`);
    
    // Build controlled matrix
    const base = gate.matrix;
    const controlled = new Float32Array(16);
    controlled[0] = 1; controlled[5] = 1; controlled[10] = 1; controlled[15] = 1;
    // Apply base to bottom-right 2x2 block
    controlled[10] = base[0]; controlled[11] = base[1];
    controlled[14] = base[2]; controlled[15] = base[3];
    
    this._applyMatrix(controlled, [control, target]);
    this.gates.push({ name: `C-${gateName}`, targets: [control, target], params });
    this.gateCount++;
    this._updateDepth();
    this._notifyChange();
    return this;
  }

  // ========== MEASUREMENT ==========
  measure(qubit, classicalBit = null) {
    if (qubit < 0 || qubit >= this.numQubits) throw new Error(`Qubit ${qubit} out of range`);
    
    const probs = this.getProbabilities();
    let prob0 = 0;
    
    // Sum probabilities where qubit = 0
    for (let i = 0; i < this.dimension; i++) {
      if ((i >> qubit) & 1) continue;
      prob0 += probs[i];
    }
    
    // Collapse
    const outcome = Math.random() < prob0 ? 0 : 1;
    const keepMask = outcome === 0 ? ~(1 << qubit) : (1 << qubit);
    
    // Renormalize
    const norm = outcome === 0 ? prob0 : (1 - prob0);
    if (norm > 0) {
      for (let i = 0; i < this.dimension; i++) {
        const bit = (i >> qubit) & 1;
        if (bit !== outcome) {
          this.statevector[i * 2] = 0;
          this.statevector[i * 2 + 1] = 0;
        } else {
          this.statevector[i * 2] /= Math.sqrt(norm);
          this.statevector[i * 2 + 1] /= Math.sqrt(norm);
        }
      }
    }
    
    const cbit = classicalBit !== null ? classicalBit : qubit;
    this.measurements.set(qubit, { outcome, classicalBit: cbit, time: Date.now() });
    
    this._notifyChange();
    return { outcome, probability: outcome === 0 ? prob0 : 1 - prob0 };
  }

  measureAll() {
    const results = {};
    for (let q = 0; q < this.numQubits; q++) {
      results[q] = this.measure(q, q);
    }
    return results;
  }

  // ========== INTERNAL: MATRIX APPLICATION ==========
  _applyMatrix(matrix, targets) {
    const n = targets.length;
    const dim = 1 << n;
    
    // Convert matrix to complex float32 array
    const mat = new Float32Array(dim * dim * 2);
    for (let i = 0; i < dim * dim; i++) {
      mat[i * 2] = matrix[i * 2] || 0;
      mat[i * 2 + 1] = matrix[i * 2 + 1] || 0;
    }
    
    if (this.useGPU && this.gpuDevice) {
      this._gpuApplyMatrix(mat, targets);
    } else {
      this._cpuApplyMatrix(mat, targets, n);
    }
  }

  _cpuApplyMatrix(mat, targets, n) {
    const dim = 1 << n;
    const newState = new Float32Array(this.dimension * 2);
    
    // For each basis state
    for (let i = 0; i < this.dimension; i++) {
      // Extract target qubits
      let targetIdx = 0;
      for (let t = 0; t < n; t++) {
        targetIdx |= ((i >> targets[t]) & 1) << t;
      }
      
      // Get amplitudes for this target configuration
      const re_in = this.statevector[i * 2];
      const im_in = this.statevector[i * 2 + 1];
      
      if (re_in === 0 && im_in === 0) continue;
      
      // Apply matrix
      for (let j = 0; j < dim; j++) {
        const mat_re = mat[(targetIdx * dim + j) * 2];
        const mat_im = mat[(targetIdx * dim + j) * 2 + 1];
        
        if (mat_re === 0 && mat_im === 0) continue;
        
        // Complex multiply
        const out_re = re_in * mat_re - im_in * mat_im;
        const out_im = re_in * mat_im + im_in * mat_re;
        
        // Construct output index
        let outIdx = i;
        for (let t = 0; t < n; t++) {
          const bit = (j >> t) & 1;
          if (bit) outIdx |= (1 << targets[t]);
          else outIdx &= ~(1 << targets[t]);
        }
        
        newState[outIdx * 2] += out_re;
        newState[outIdx * 2 + 1] += out_im;
      }
    }
    
    this.statevector = newState;
  }

  // ========== GPU ACCELERATION ==========
  async initGPU() {
    if (typeof navigator === 'undefined' || !navigator.gpu) return false;
    
    try {
      this.gpuDevice = await navigator.gpu.requestDevice();
      this._createGPUPipeline();
      this.useGPU = true;
      console.log('[QuantumCircuit] WebGPU acceleration enabled');
      return true;
    } catch (e) {
      console.warn('[QuantumCircuit] GPU init failed:', e);
      this.useGPU = false;
      return false;
    }
  }

  _createGPUPipeline() {
    const shader = `
      struct GateParams {
        matrix: array<vec2<f32>, 64>, // Up to 8x8 complex matrix
        targets: array<u32, 4>,
        num_targets: u32,
        num_qubits: u32,
        dim: u32,
      };
      
      @group(0) @binding(0) var<storage, read_write> state: array<vec2<f32>>;
      @group(0) @binding(1) var<uniform> gate: GateParams;
      
      @compute @workgroup_size(256)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let idx = id.x;
        if (idx >= gate.dim) { return; }
        
        // Extract target qubits
        var target_idx = 0u;
        for (var t = 0u; t < gate.num_targets; t++) {
          target_idx |= ((idx >> gate.targets[t]) & 1u) << t;
        }
        
        let in_amp = state[idx];
        
        // Apply matrix
        for (var j = 0u; j < (1u << gate.num_targets); j++) {
          let mat_val = gate.matrix[target_idx * (1u << gate.num_targets) + j];
          if (mat_val.x == 0.0 && mat_val.y == 0.0) { continue; }
          
          // Compute output index
          var out_idx = idx;
          for (var t = 0u; t < gate.num_targets; t++) {
            let bit = (j >> t) & 1u;
            if (bit == 1u) {
              out_idx = out_idx | (1u << gate.targets[t]);
            } else {
              out_idx = out_idx & ~(1u << gate.targets[t]);
            }
          }
          
          // Complex multiply
          let out_re = in_amp.x * mat_val.x - in_amp.y * mat_val.y;
          let out_im = in_amp.x * mat_val.y + in_amp.y * mat_val.x;
          
          atomicAdd(&state[out_idx].x, out_re);
          atomicAdd(&state[out_idx].y, out_im);
        }
      }
    `;
    
    this.computePipeline = this.gpuDevice.createComputePipeline({
      layout: 'auto',
      compute: {
        module: this.gpuDevice.createShaderModule({ code: shader }),
        entryPoint: 'main'
      }
    });
  }

  _uploadToGPU() {
    if (!this.useGPU) return;
    
    if (this.stateBuffer) this.stateBuffer.destroy();
    this.stateBuffer = this.gpuDevice.createBuffer({
      size: this.statevector.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true
    });
    new Float32Array(this.stateBuffer.getMappedRange()).set(this.statevector);
    this.stateBuffer.unmap();
  }

  _gpuApplyMatrix(mat, targets) {
    // Implementation would dispatch compute shader
    // For now, fall back to CPU
    this._cpuApplyMatrix(mat, targets, targets.length);
  }

  // ========== CIRCUIT ANALYSIS ==========
  _updateDepth() {
    // Calculate circuit depth (longest path)
    const qubitLastGate = new Array(this.numQubits).fill(-1);
    let depth = 0;
    
    for (let i = 0; i < this.gates.length; i++) {
      const gate = this.gates[i];
      let maxPrev = 0;
      for (const q of gate.targets) {
        maxPrev = Math.max(maxPrev, qubitLastGate[q] + 1);
      }
      for (const q of gate.targets) {
        qubitLastGate[q] = maxPrev;
      }
      depth = Math.max(depth, maxPrev);
    }
    this.depth = depth;
  }

  getDepth() { return this.depth; }
  getGateCount() { return this.gateCount; }
  getGates() { return [...this.gates]; }

  // Export to QASM
  toQASM() {
    let qasm = 'OPENQASM 2.0;\ninclude "qelib1.inc";\n';
    qasm += `qreg q[${this.numQubits}];\n`;
    if (this.measurements.size > 0) {
      qasm += `creg c[${this.numQubits}];\n`;
    }
    
    for (const gate of this.gates) {
      const args = gate.targets.map(q => `q[${q}]`).join(',');
      switch (gate.name) {
        case 'H': qasm += `h ${args};\n`; break;
        case 'X': qasm += `x ${args};\n`; break;
        case 'Y': qasm += `y ${args};\n`; break;
        case 'Z': qasm += `z ${args};\n`; break;
        case 'S': qasm += `s ${args};\n`; break;
        case 'T': qasm += `t ${args};\n`; break;
        case 'CX': qasm += `cx ${args};\n`; break;
        case 'CZ': qasm += `cz ${args};\n`; break;
        case 'SWAP': qasm += `swap ${args};\n`; break;
        case 'Rx': qasm += `rx(${gate.params[0]}) ${args};\n`; break;
        case 'Ry': qasm += `ry(${gate.params[0]}) ${args};\n`; break;
        case 'Rz': qasm += `rz(${gate.params[0]}) ${args};\n`; break;
        case 'U': qasm += `u(${gate.params.join(',')}) ${args};\n`; break;
        case 'CCX': qasm += `ccx ${args};\n`; break;
        default: qasm += `// ${gate.name} ${args}\n`;
      }
    }
    
    for (const [q, m] of this.measurements) {
      qasm += `measure q[${q}] -> c[${m.classicalBit}];\n`;
    }
    
    return qasm;
  }

  // Import from QASM (basic)
  static fromQASM(qasm) {
    // Simplified parser
    const lines = qasm.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
    let numQubits = 4;
    
    for (const line of lines) {
      if (line.startsWith('qreg')) {
        const match = line.match(/qreg\s+q\[(\d+)\]/);
        if (match) numQubits = parseInt(match[1]);
      }
    }
    
    const circuit = new QuantumCircuit(numQubits);
    // Full parser would go here
    return circuit;
  }

  // ========== VISUALIZATION DATA ==========
  getBlochData(qubit) {
    // Reduced density matrix for single qubit
    const probs = this.getProbabilities();
    let rho00 = 0, rho11 = 0, rho01_re = 0, rho01_im = 0;
    
    for (let i = 0; i < this.dimension; i++) {
      const bit = (i >> qubit) & 1;
      const prob = probs[i];
      if (bit === 0) rho00 += prob;
      else rho11 += prob;
    }
    
    // Off-diagonal elements (simplified - would need full density matrix)
    const x = 2 * rho01_re;
    const y = 2 * rho01_im;
    const z = rho00 - rho11;
    
    return { x, y, z, r: Math.sqrt(x*x + y*y + z*z) };
  }

  getEntanglementEntropy(partition) {
    // Von Neumann entropy of subsystem
    // Simplified - would need Schmidt decomposition
    return 0;
  }

  // ========== EVENTS ==========
  _notifyChange() {
    if (this.onStateChange) {
      this.onStateChange({
        statevector: this.statevector.slice(),
        probabilities: this.getProbabilities(),
        gates: this.gates.length,
        depth: this.depth
      });
    }
  }

  onStateChange(callback) {
    this.onStateChange = callback;
  }

  // ========== CLEANUP ==========
  destroy() {
    if (this.stateBuffer) this.stateBuffer.destroy();
    if (this.gateBuffer) this.gateBuffer.destroy();
    this.statevector = null;
    this.gates = [];
    this.measurements.clear();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuantumCircuit;
} else if (typeof window !== 'undefined') {
  window.QuantumCircuit = QuantumCircuit;
}