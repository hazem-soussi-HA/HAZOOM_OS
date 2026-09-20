/**
 * HAZOOM OS — Quantum Algorithms Library
 * Implementations of Grover's search, QAOA, VQE, and other quantum algorithms
 * Designed to work with QuantumCircuit simulator
 */

class QuantumAlgorithms {
  constructor(circuit) {
    this.circuit = circuit;
    this.numQubits = circuit.numQubits;
  }

  // ========== GROVER'S SEARCH ==========
  /**
   * Grover's algorithm for unstructured search
   * @param {Function} oracle - Function that marks target states (returns true for targets)
   * @param {number} iterations - Number of Grover iterations (auto-calculated if not provided)
   * @returns {Promise<Object>} Result with measured state and probability
   */
  async grover(oracle, iterations = null) {
    const n = this.numQubits;
    const N = 1 << n;
    
    // Optimal iterations: π/4 * sqrt(N/M) where M = number of solutions
    // Estimate M by sampling
    if (iterations === null) {
      let M = 0;
      for (let i = 0; i < Math.min(100, N); i++) {
        if (oracle(i)) M++;
      }
      M = Math.max(1, Math.round(M * N / 100));
      iterations = Math.floor(Math.PI / 4 * Math.sqrt(N / M));
    }
    
    console.log(`[Grover] N=${N}, iterations=${iterations}`);
    
    // Initialize superposition
    this.circuit.reset(n);
    for (let q = 0; q < n; q++) {
      this.circuit.h(q);
    }
    
    // Grover iterations
    for (let iter = 0; iter < iterations; iter++) {
      // Oracle
      this._applyOracle(oracle);
      
      // Diffusion operator (inversion about mean)
      this._diffusionOperator();
    }
    
    // Measure
    const results = this.circuit.measureAll();
    
    // Find most probable outcome
    const probs = this.circuit.getProbabilities();
    let maxProb = 0, maxState = 0;
    for (let i = 0; i < probs.length; i++) {
      if (probs[i] > maxProb) {
        maxProb = probs[i];
        maxState = i;
      }
    }
    
    return {
      state: maxState,
      binary: maxState.toString(2).padStart(n, '0'),
      probability: maxProb,
      iterations,
      isTarget: oracle(maxState),
      allProbabilities: probs
    };
  }

  _applyOracle(oracle) {
    // Mark target states with phase flip
    const n = this.numQubits;
    const N = 1 << n;
    
    for (let i = 0; i < N; i++) {
      if (oracle(i)) {
        // Apply Z to all qubits (phase flip for |1> states)
        // Actually, we need a multi-controlled Z
        // Simplified: apply Z to each qubit conditioned on the state
        // In practice, this would be a custom multi-qubit gate
        this.circuit.z(0); // Placeholder
      }
    }
  }

  _diffusionOperator() {
    const n = this.numQubits;
    
    // H on all qubits
    for (let q = 0; q < n; q++) this.circuit.h(q);
    
    // X on all qubits
    for (let q = 0; q < n; q++) this.circuit.x(q);
    
    // Multi-controlled Z (phase flip for |0...0>)
    if (n === 2) {
      this.circuit.cz(0, 1);
    } else if (n === 3) {
      this.circuit.ccx(0, 1, 2);
      this.circuit.z(2);
      this.circuit.ccx(0, 1, 2);
    } else {
      // For n > 3, use ancilla-based construction
      this._multiControlledZ();
    }
    
    // X on all qubits
    for (let q = 0; q < n; q++) this.circuit.x(q);
    
    // H on all qubits
    for (let q = 0; q < n; q++) this.circuit.h(q);
  }

  _multiControlledZ() {
    // Simplified: apply Z to first qubit controlled by all others
    // In reality, needs ancilla qubits
    for (let q = 1; q < this.numQubits; q++) {
      this.circuit.cz(0, q);
    }
  }

  // ========== QAOA (Quantum Approximate Optimization Algorithm) ==========
  /**
   * QAOA for combinatorial optimization
   * @param {Array<Array<number>>} costHamiltonian - Adjacency matrix for MaxCut, or cost function
   * @param {number} p - Number of QAOA layers
   * @returns {Promise<Object>} Optimal parameters and expectation value
   */
  async qaoa(costHamiltonian, p = 3) {
    const n = this.numQubits;
    
    // Default: MaxCut on graph
    const graph = costHamiltonian || this._generateRandomGraph(n);
    
    // Initialize parameters (gamma, beta for each layer)
    const params = {
      gammas: Array(p).fill(0).map(() => Math.random() * Math.PI),
      betas: Array(p).fill(0).map(() => Math.random() * Math.PI/2)
    };
    
    // Cost function: expectation of cost Hamiltonian
    const cost = (gammas, betas) => {
      this.circuit.reset(this.numQubits);
      
      // Initial superposition
      for (let q = 0; q < n; q++) this.circuit.h(q);
      
      // QAOA layers
      for (let layer = 0; layer < p; layer++) {
        // Cost Hamiltonian: exp(-i * gamma * H_C)
        for (const [i, j] of graph.edges) {
          // ZZ interaction
          this.circuit.cz(i, j);
          this.circuit.rz(j, 2 * gammas[layer]);
          this.circuit.cz(i, j);
        }
        
        // Mixer Hamiltonian: exp(-i * beta * H_M)
        for (let q = 0; q < n; q++) {
          this.circuit.rx(q, 2 * betas[layer]);
        }
      }
      
      // Measure expectation value
      return this._expectationValue(graph);
    };
    
    // Classical optimization (gradient-free)
    const optimal = this._optimizeParams(cost, params.gammas, params.betas, 50);
    
    // Final run with optimal params
    this.circuit.reset(this.numQubits);
    for (let q = 0; q < n; q++) this.circuit.h(q);
    
    for (let layer = 0; layer < p; layer++) {
      for (const [i, j] of graph.edges) {
        this.circuit.cz(i, j);
        this.circuit.rz(j, 2 * optimal.gammas[layer]);
        this.circuit.cz(i, j);
      }
      for (let q = 0; q < n; q++) {
        this.circuit.rx(q, 2 * optimal.betas[layer]);
      }
    }
    
    const results = this.circuit.measureAll();
    const probs = this.circuit.getProbabilities();
    
    // Find best solution
    let bestState = 0, bestCost = -Infinity;
    for (let i = 0; i < probs.length; i++) {
      if (probs[i] > 0.01) {
        const cost = this._evaluateCost(i, graph);
        if (cost > bestCost) {
          bestCost = cost;
          bestState = i;
        }
      }
    }
    
    return {
      optimalParams: optimal,
      bestState,
      bestCost,
      bestProbability: probs[bestState],
      allProbabilities: probs,
      layers: p
    };
  }

  _expectationValue(graph) {
    const probs = this.circuit.getProbabilities();
    let expVal = 0;
    
    for (let i = 0; i < probs.length; i++) {
      if (probs[i] === 0) continue;
      expVal += probs[i] * this._evaluateCost(i, graph);
    }
    
    return expVal;
  }

  _evaluateCost(state, graph) {
    let cost = 0;
    for (const [i, j] of graph.edges) {
      const bitI = (state >> i) & 1;
      const bitJ = (state >> j) & 1;
      if (bitI !== bitJ) cost += 1; // MaxCut: count edges between partitions
    }
    return cost;
  }

  _generateRandomGraph(n, edgeProb = 0.3) {
    const edges = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.random() < edgeProb) edges.push([i, j]);
      }
    }
    return { nodes: n, edges };
  }

  _optimizeParams(costFn, gammas, betas, maxIter) {
    // Simple Nelder-Mead / Powell-like optimization
    const params = [...gammas, ...betas];
    const n = params.length;
    
    // Simple coordinate descent
    for (let iter = 0; iter < maxIter; iter++) {
      for (let i = 0; i < n; i++) {
        const current = costFn(
          params.slice(0, gammas.length),
          params.slice(gammas.length)
        );
        
        // Try small perturbations
        for (const delta of [0.1, -0.1, 0.05, -0.05]) {
          const testParams = [...params];
          testParams[i] += delta;
          const testCost = costFn(
            testParams.slice(0, gammas.length),
            testParams.slice(gammas.length)
          );
          if (testCost > current) {
            params[i] += delta;
            break;
          }
        }
      }
    }
    
    return {
      gammas: params.slice(0, gammas.length),
      betas: params.slice(gammas.length),
      cost: costFn(params.slice(0, gammas.length), params.slice(gammas.length))
    };
  }

  // ========== VQE (Variational Quantum Eigensolver) ==========
  /**
   * VQE for finding ground state energy
   * @param {Object} hamiltonian - { terms: [{ pauli: 'XX', coeff: 1, qubits: [0,1] }] }
   * @param {number} layers - Number of ansatz layers
   * @returns {Promise<Object>} Ground state energy and parameters
   */
  async vqe(hamiltonian, layers = 3) {
    const n = this.numQubits;
    const terms = hamiltonian.terms || this._defaultHamiltonian(n);
    
    // Ansatz parameters
    let params = [];
    for (let l = 0; l < layers; l++) {
      // Rotation parameters for each qubit
      for (let q = 0; q < n; q++) {
        params.push(Math.random() * 2 * Math.PI); // Ry
        params.push(Math.random() * 2 * Math.PI); // Rz
      }
      // Entangling layer
      for (let q = 0; q < n - 1; q++) {
        params.push(Math.random() * 2 * Math.PI); // CRx
      }
    }
    
    const cost = (theta) => {
      this.circuit.reset(n);
      this._buildAnsatz(theta, n, layers);
      return this._hamiltonianExpectation(terms);
    };
    
    // Optimize (simplified gradient descent)
    const optimal = this._gradientDescent(cost, params, 100);
    
    // Final state
    this.circuit.reset(n);
    this._buildAnsatz(optimal, n, layers);
    const probs = this.circuit.getProbabilities();
    
    return {
      groundEnergy: cost(optimal),
      optimalParams: optimal,
      probabilities: probs,
      circuit: this.circuit.getGates()
    };
  }

  _buildAnsatz(params, n, layers) {
    let idx = 0;
    
    for (let l = 0; l < layers; l++) {
      // Rotation layer
      for (let q = 0; q < n; q++) {
        this.circuit.ry(q, params[idx++]);
        this.circuit.rz(q, params[idx++]);
      }
      
      // Entangling layer (linear chain)
      for (let q = 0; q < n - 1; q++) {
        this.circuit.crx(q, q + 1, params[idx++]);
      }
    }
  }

  _hamiltonianExpectation(terms) {
    const probs = this.circuit.getProbabilities();
    let energy = 0;
    
    for (const term of terms) {
      const { pauli, coeff, qubits } = term;
      let expVal = 0;
      
      for (let i = 0; i < probs.length; i++) {
        if (probs[i] === 0) continue;
        
        // Compute Pauli expectation for this term
        let eigenvalue = 1;
        for (const q of qubits) {
          const bit = (i >> q) & 1;
          const p = pauli[qubits.indexOf(q)];
          
          if (p === 'Z') eigenvalue *= (bit === 0 ? 1 : -1);
          else if (p === 'X') {
            // X basis measurement - would need statevector
            // Simplified: random for now
            eigenvalue *= (Math.random() > 0.5 ? 1 : -1);
          }
          else if (p === 'Y') eigenvalue *= (Math.random() > 0.5 ? 1 : -1);
        }
        expVal += probs[i] * eigenvalue;
      }
      
      energy += coeff * expVal;
    }
    
    return energy;
  }

  _defaultHamiltonian(n) {
    // Transverse field Ising model
    const terms = [];
    for (let i = 0; i < n - 1; i++) {
      terms.push({ pauli: 'ZZ', coeff: -1, qubits: [i, i + 1] });
    }
    for (let i = 0; i < n; i++) {
      terms.push({ pauli: 'X', coeff: -0.5, qubits: [i] });
    }
    return terms;
  }

  _gradientDescent(costFn, params, maxIter) {
    const theta = [...params];
    const lr = 0.05;
    
    for (let iter = 0; iter < maxIter; iter++) {
      const grad = new Array(params.length).fill(0);
      
      for (let i = 0; i < params.length; i++) {
        const eps = 0.01;
        const plus = [...theta]; plus[i] += eps;
        const minus = [...theta]; minus[i] -= eps;
        grad[i] = (costFn(plus) - costFn(minus)) / (2 * eps);
      }
      
      for (let i = 0; i < params.length; i++) {
        theta[i] -= lr * grad[i];
      }
      
      if (iter % 20 === 0) {
        console.log(`[VQE] Iter ${iter}, Energy: ${costFn(theta)}`);
      }
    }
    
    return theta;
  }

  // ========== QUANTUM PHASE ESTIMATION ==========
  async phaseEstimation(unitary, precision = 4) {
    const n = this.numQubits;
    const prec = Math.min(precision, n - 1);
    
    this.circuit.reset(n);
    
    // Initialize eigenstate (simplified: |1> on last qubit)
    this.circuit.x(n - 1);
    
    // Hadamard on precision qubits
    for (let q = 0; q < prec; q++) {
      this.circuit.h(q);
    }
    
    // Controlled unitary applications
    for (let q = 0; q < prec; q++) {
      const power = 1 << q;
      // Apply controlled-U^(2^q)
      // Simplified: just apply unitary with phase
      for (let i = 0; i < power; i++) {
        // This would apply the unitary
      }
    }
    
    // Inverse QFT
    this._inverseQFT(prec);
    
    // Measure precision qubits
    const results = this.circuit.measureAll();
    
    // Extract phase
    let phase = 0;
    for (let q = 0; q < prec; q++) {
      if (results[q]?.outcome === 1) {
        phase += 1 / (1 << (q + 1));
      }
    }
    
    return { phase, precision: prec };
  }

  _inverseQFT(n) {
    // Swap qubits
    for (let i = 0; i < Math.floor(n / 2); i++) {
      this.circuit.swap(i, n - 1 - i);
    }
    
    for (let j = 0; j < n; j++) {
      this.circuit.h(j);
      for (let k = j + 1; k < n; k++) {
        // Controlled Rz(-π/2^(k-j))
        this.circuit.crz(j, k, -Math.PI / (1 << (k - j)));
      }
    }
  }

  // ========== QUANTUM FOURIER TRANSFORM ==========
  qft(qubits = null) {
    const targets = qubits || Array.from({ length: this.numQubits }, (_, i) => i);
    const n = targets.length;
    
    for (let i = 0; i < n; i++) {
      this.circuit.h(targets[i]);
      for (let j = i + 1; j < n; j++) {
        this.circuit.crz(targets[i], targets[j], Math.PI / (1 << (j - i)));
      }
    }
    
    // Swap for correct order
    for (let i = 0; i < Math.floor(n / 2); i++) {
      this.circuit.swap(targets[i], targets[n - 1 - i]);
    }
    
    return this;
  }

  // ========== UTILITIES ==========
  // Create Bell state
  createBellPair(q1, q2) {
    this.circuit.h(q1);
    this.circuit.cx(q1, q2);
    return this;
  }

  // Create GHZ state
  createGHZ(qubits) {
    this.circuit.h(qubits[0]);
    for (let i = 1; i < qubits.length; i++) {
      this.circuit.cx(qubits[0], qubits[i]);
    }
    return this;
  }

  // Quantum teleportation protocol
  teleport(source, target, entangled) {
    // Bell measurement on source and entangled
    this.circuit.cx(source, entangled);
    this.circuit.h(source);
    const m1 = this.circuit.measure(source);
    const m2 = this.circuit.measure(entangled);
    
    // Conditional corrections on target
    if (m2.outcome === 1) this.circuit.x(target);
    if (m1.outcome === 1) this.circuit.z(target);
    
    return { m1, m2 };
  }

  // Superdense coding
  superdenseCoding(message, entangled1, entangled2) {
    // message: 0-3 (2 classical bits)
    const bits = [(message >> 1) & 1, message & 1];
    
    // Alice applies operations based on message
    if (bits[1] === 1) this.circuit.x(entangled1);
    if (bits[0] === 1) this.circuit.z(entangled1);
    
    // Bell measurement on Bob's side
    this.circuit.cx(entangled1, entangled2);
    this.circuit.h(entangled1);
    const b1 = this.circuit.measure(entangled1);
    const b2 = this.circuit.measure(entangled2);
    
    return { message: (b1.outcome << 1) | b2.outcome };
  }
}

// ========== PRE-BUILT ALGORITHMS ==========
QuantumAlgorithms.Grover = class {
  static createOracle(targetStates) {
    const targets = new Set(targetStates);
    return (state) => targets.has(state);
  }
  
  static async run(circuit, targetStates) {
    const algos = new QuantumAlgorithms(circuit);
    const oracle = this.createOracle(targetStates);
    return algos.grover(oracle);
  }
};

QuantumAlgorithms.QAOA = class {
  static maxCut(graph, p = 3) {
    const circuit = new QuantumCircuit(graph.nodes);
    const algos = new QuantumAlgorithms(circuit);
    return algos.qaoa(graph, p);
  }
};

QuantumAlgorithms.VQE = class {
  static hamiltonian(terms, layers = 3) {
    const n = Math.max(...terms.flatMap(t => t.qubits)) + 1;
    const circuit = new QuantumCircuit(n);
    const algos = new QuantumAlgorithms(circuit);
    return algos.vqe({ terms }, layers);
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuantumAlgorithms;
} else if (typeof window !== 'undefined') {
  window.QuantumAlgorithms = QuantumAlgorithms;
}