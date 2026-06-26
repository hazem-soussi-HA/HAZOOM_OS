/**
 * HAZOOM OS v5.0 — Q-Learning System
 * 
 * Implements:
 *   Level 1: Tabular Q-Learning (Watkins & Dayan, 1992)
 *   Level 2: Deep Q-Network (Mnih & Kavukcuoglu, Patent US20150100530A1)
 *   Level 3: Double DQN (van Hasselt et al., 2016)
 * 
 * The OS learns optimal policies for scheduling, memory, security, and AI scaling.
 * Every system tick is a training step. Knowledge persists across reboots.
 * 
 * Copyright © 2024-2026 Hazem Soussi — All Rights Reserved
 */

'use strict';

// ─── BINNING HELPER ───────────────────────────────────────────────

function bin(value, maxVal, bins) {
    const normalized = Math.max(0, Math.min(maxVal, value)) / maxVal;
    return Math.min(bins - 1, Math.floor(normalized * bins));
}

// ─── OS STATE DEFINITION ─────────────────────────────────────────

const OSStateFields = {
    processCount:      { max: 1024, bins: 10 },
    cpuUtilization:    { max: 100,  bins: 10 },
    readyQueueLength:  { max: 1024, bins: 5  },
    memoryUtilization: { max: 100,  bins: 10 },
    pageFaultRate:     { max: 100,  bins: 5  },
    swapUsage:         { max: 100,  bins: 5  },
    diskIOPS:          { max: 1000, bins: 5  },
    networkBandwidth:  { max: 100,  bins: 5  },
    threatLevel:       { max: 4,    bins: 5  },
    failedLogins:      { max: 100,  bins: 5  },
    aiLatency:         { max: 10000,bins: 5  },
    aetherBusLoad:     { max: 100,  bins: 5  }
};

// ─── OS ACTIONS ──────────────────────────────────────────────────

const OSActions = Object.freeze([
    // Scheduler
    'adjust_quantum',
    'rebalance_priorities',
    'migrate_process',
    // Memory
    'compact_memory',
    'evict_cache',
    'swap_out',
    // Security
    'lockdown',
    'kill_suspicious',
    'rotate_keys',
    // AI
    'scale_ai_up',
    'scale_ai_down',
    'cache_model'
]);

// ─── TABULAR Q-TABLE ─────────────────────────────────────────────

class QTable {
    /**
     * Standard tabular Q-learning (Watkins, 1989)
     * Q_new(s,a) = (1-α)·Q(s,a) + α·[R + γ·max_a' Q(s',a')]
     */
    constructor(actions, config = {}) {
        this.actions = actions;
        this.alpha = config.alpha ?? 0.1;
        this.gamma = config.gamma ?? 0.95;
        this.epsilon = config.epsilon ?? 1.0;
        this.epsilonMin = config.epsilonMin ?? 0.01;
        this.epsilonDecay = config.epsilonDecay ?? 0.995;
        this.table = new Map();
        this.updateCount = 0;
    }

    /** Discretize state into a hashable key */
    stateKey(state) {
        const parts = [];
        for (const [field, { max, bins }] of Object.entries(OSStateFields)) {
            parts.push(bin(state[field] ?? 0, max, bins));
        }
        return parts.join(',');
    }

    /** Get Q(s, a) */
    get(state, action) {
        const key = this.stateKey(state);
        const row = this.table.get(key);
        if (!row) return 0;
        return row[action] ?? 0;
    }

    /** Set Q(s, a) */
    set(state, action, value) {
        const key = this.stateKey(state);
        if (!this.table.has(key)) {
            this.table.set(key, {});
        }
        this.table.get(key)[action] = value;
    }

    /** Bellman update: Q(s,a) ← (1-α)Q + α[R + γ max Q(s',a')] */
    update(state, action, reward, nextState) {
        const currentQ = this.get(state, action);
        
        let maxNextQ = -Infinity;
        for (const a of this.actions) {
            const q = this.get(nextState, a);
            if (q > maxNextQ) maxNextQ = q;
        }
        if (maxNextQ === -Infinity) maxNextQ = 0;

        const newQ = (1 - this.alpha) * currentQ
                   + this.alpha * (reward + this.gamma * maxNextQ);

        this.set(state, action, newQ);
        this.updateCount++;

        // Decay exploration
        this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);

        return newQ;
    }

    /** ε-greedy policy */
    chooseAction(state) {
        if (Math.random() < this.epsilon) {
            return this.actions[Math.floor(Math.random() * this.actions.length)];
        }
        return this.greedyAction(state);
    }

    /** Pure greedy: argmax_a Q(s,a) */
    greedyAction(state) {
        let bestAction = this.actions[0];
        let bestQ = -Infinity;
        for (const action of this.actions) {
            const q = this.get(state, action);
            if (q > bestQ) {
                bestQ = q;
                bestAction = action;
            }
        }
        return bestAction;
    }

    /** Get full Q-row for a state */
    getQRow(state) {
        const result = {};
        for (const action of this.actions) {
            result[action] = this.get(state, action);
        }
        return result;
    }

    /** Export table for persistence */
    toJSON() {
        const obj = {};
        for (const [key, row] of this.table) {
            obj[key] = { ...row };
        }
        return {
            alpha: this.alpha,
            gamma: this.gamma,
            epsilon: this.epsilon,
            epsilonMin: this.epsilonMin,
            epsilonDecay: this.epsilonDecay,
            updateCount: this.updateCount,
            table: obj
        };
    }

    /** Import table from persistence */
    fromJSON(data) {
        this.alpha = data.alpha ?? this.alpha;
        this.gamma = data.gamma ?? this.gamma;
        this.epsilon = data.epsilon ?? this.epsilon;
        this.epsilonMin = data.epsilonMin ?? this.epsilonMin;
        this.epsilonDecay = data.epsilonDecay ?? this.epsilonDecay;
        this.updateCount = data.updateCount ?? 0;
        this.table = new Map();
        if (data.table) {
            for (const [key, row] of Object.entries(data.table)) {
                this.table.set(key, { ...row });
            }
        }
    }

    /** Stats */
    getStats() {
        return {
            statesExplored: this.table.size,
            totalUpdates: this.updateCount,
            epsilon: this.epsilon,
            alpha: this.alpha,
            gamma: this.gamma
        };
    }
}

// ─── EXPERIENCE REPLAY BUFFER ────────────────────────────────────

class ReplayBuffer {
    /**
     * FIFO circular buffer (from DQN patent US20150100530A1)
     * Stores transitions (s, a, r, s', done) for decorrelated training
     */
    constructor(capacity = 100000) {
        this.capacity = capacity;
        this.buffer = new Array(capacity);
        this.position = 0;
        this.size = 0;
    }

    push(transition) {
        this.buffer[this.position] = transition;
        this.position = (this.position + 1) % this.capacity;
        if (this.size < this.capacity) this.size++;
    }

    sample(batchSize) {
        const batch = [];
        const len = this.size;
        for (let i = 0; i < batchSize; i++) {
            const idx = Math.floor(Math.random() * len);
            batch.push(this.buffer[idx]);
        }
        return batch;
    }

    getStats() {
        return {
            size: this.size,
            capacity: this.capacity,
            utilization: (this.size / this.capacity * 100).toFixed(1) + '%'
        };
    }
}

// ─── NEURAL NETWORK (Lightweight, no dependencies) ───────────────

class SimpleNeuralNet {
    /**
     * Minimal feedforward network for DQN.
     * Architecture: input → dense(128,relu) → dense(128,relu) → dense(64,relu) → dense(output,linear)
     * Uses Xavier initialization and SGD with momentum.
     */
    constructor(inputSize, outputSize, config = {}) {
        this.lr = config.learningRate ?? 0.00025;
        this.momentum = config.momentum ?? 0.9;
        
        // Layer sizes
        this.layers = [inputSize, 128, 128, 64, outputSize];
        this.weights = [];
        this.biases = [];
        this.velW = [];  // velocity for momentum
        this.velB = [];

        // Xavier initialization
        for (let l = 0; l < this.layers.length - 1; l++) {
            const fanIn = this.layers[l];
            const fanOut = this.layers[l + 1];
            const std = Math.sqrt(2 / (fanIn + fanOut));
            
            const w = [];
            const vW = [];
            for (let i = 0; i < fanOut; i++) {
                const row = [];
                const vRow = [];
                for (let j = 0; j < fanIn; j++) {
                    row.push(this._randn() * std);
                    vRow.push(0);
                }
                w.push(row);
                vW.push(vRow);
            }
            this.weights.push(w);
            this.velW.push(vW);

            const b = new Array(fanOut).fill(0);
            const vB = new Array(fanOut).fill(0);
            this.biases.push(b);
            this.velB.push(vB);
        }
    }

    _randn() {
        // Box-Muller transform for standard normal
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    _relu(x) { return Math.max(0, x); }
    _reluGrad(x) { return x > 0 ? 1 : 0; }

    /** Forward pass → [ activations per layer ] */
    forward(input) {
        const activations = [input.slice()];
        let current = input;

        for (let l = 0; l < this.weights.length; l++) {
            const w = this.weights[l];
            const b = this.biases[l];
            const isLast = l === this.weights.length - 1;
            const output = [];

            for (let i = 0; i < w.length; i++) {
                let sum = b[i];
                for (let j = 0; j < current.length; j++) {
                    sum += w[i][j] * current[j];
                }
                // ReLU for hidden layers, linear for output
                output.push(isLast ? sum : this._relu(sum));
            }
            activations.push(output);
            current = output;
        }
        return activations;
    }

    /** Predict: forward pass, return output layer only */
    predict(input) {
        const acts = this.forward(input);
        return acts[acts.length - 1];
    }

    /** Train on single (input, targetOutput) with backprop + momentum SGD */
    train(input, targetOutput) {
        const activations = this.forward(input);
        const numLayers = this.weights.length;

        // Compute output layer delta
        const output = activations[numLayers];
        const deltas = new Array(numLayers);

        deltas[numLayers - 1] = [];
        for (let i = 0; i < output.length; i++) {
            deltas[numLayers - 1][i] = (output[i] - targetOutput[i]); // MSE grad
        }

        // Backpropagate
        for (let l = numLayers - 2; l >= 0; l--) {
            deltas[l] = [];
            const nextDelta = deltas[l + 1];
            const nextW = this.weights[l + 1];
            const act = activations[l + 1];

            for (let i = 0; i < this.weights[l].length; i++) {
                let sum = 0;
                for (let k = 0; k < nextDelta.length; k++) {
                    sum += nextDelta[k] * nextW[k][i];
                }
                deltas[l][i] = sum * this._reluGrad(act[i]);
            }
        }

        // Update weights with momentum SGD
        for (let l = 0; l < numLayers; l++) {
            const prevAct = activations[l];
            const delta = deltas[l];

            for (let i = 0; i < this.weights[l].length; i++) {
                for (let j = 0; j < this.weights[l][i].length; j++) {
                    const grad = delta[i] * prevAct[j];
                    this.velW[l][i][j] = this.momentum * this.velW[l][i][j] + this.lr * grad;
                    this.weights[l][i][j] -= this.velW[l][i][j];
                }
                this.velB[l][i] = this.momentum * this.velB[l][i] + this.lr * delta[i];
                this.biases[l][i] -= this.velB[l][i];
            }
        }
    }

    /** Copy weights from another network */
    copyWeights(source) {
        for (let l = 0; l < this.weights.length; l++) {
            for (let i = 0; i < this.weights[l].length; i++) {
                for (let j = 0; j < this.weights[l][i].length; j++) {
                    this.weights[l][i][j] = source.weights[l][i][j];
                    this.biases[l][i] = source.biases[l][i];
                }
            }
        }
    }

    /** Serialize for persistence */
    toJSON() {
        return {
            layers: this.layers,
            weights: this.weights,
            biases: this.biases,
            lr: this.lr,
            momentum: this.momentum
        };
    }

    fromJSON(data) {
        this.layers = data.layers;
        this.weights = data.weights;
        this.biases = data.biases;
        this.lr = data.lr;
        this.momentum = data.momentum;
        // Re-init velocity
        this.velW = [];
        this.velB = [];
        for (let l = 0; l < this.weights.length; l++) {
            const vW = [];
            for (let i = 0; i < this.weights[l].length; i++) {
                const vRow = new Array(this.weights[l][i].length).fill(0);
                vW.push(vRow);
            }
            this.velW.push(vW);
            this.velB.push(new Array(this.biases[l].length).fill(0));
        }
    }
}

// ─── DEEP Q-NETWORK (DQN) ────────────────────────────────────────

class DeepQNetwork {
    /**
     * DQN from Patent US20150100530A1 (Mnih & Kavukcuoglu, Google DeepMind)
     * - Dual network: Q_online (action selection) + Q_target (stable targets)
     * - Experience replay buffer (breaks temporal correlations)
     * - Target network sync every L steps
     */
    constructor(actions, stateDim, config = {}) {
        this.actions = actions;
        this.stateDim = stateDim;

        // Dual networks
        this.qOnline = new SimpleNeuralNet(stateDim, actions.length, {
            learningRate: config.learningRate ?? 0.00025,
            momentum: config.momentum ?? 0.9
        });
        this.qTarget = new SimpleNeuralNet(stateDim, actions.length, {
            learningRate: config.learningRate ?? 0.00025,
            momentum: config.momentum ?? 0.9
        });
        this.qTarget.copyWeights(this.qOnline);

        // Experience replay
        this.replayBuffer = new ReplayBuffer(config.bufferSize ?? 100000);

        // Hyperparameters
        this.gamma = config.gamma ?? 0.99;
        this.epsilon = config.epsilon ?? 1.0;
        this.epsilonMin = config.epsilonMin ?? 0.01;
        this.epsilonDecay = config.epsilonDecay ?? 0.9999;
        this.batchSize = config.batchSize ?? 32;
        this.targetUpdateFreq = config.targetUpdateFreq ?? 1000;

        this.stepCount = 0;
        this.lossHistory = [];
    }

    /** ε-greedy action using Q_online only */
    chooseAction(stateVector) {
        if (Math.random() < this.epsilon) {
            return this.actions[Math.floor(Math.random() * this.actions.length)];
        }
        const qValues = this.qOnline.predict(stateVector);
        let bestIdx = 0;
        for (let i = 1; i < qValues.length; i++) {
            if (qValues[i] > qValues[bestIdx]) bestIdx = i;
        }
        return this.actions[bestIdx];
    }

    /** Store transition in replay buffer */
    storeTransition(state, actionIdx, reward, nextState, done) {
        this.replayBuffer.push({ state, actionIdx, reward, nextState, done });
    }

    /** Training step: sample minibatch, compute targets with Q_target, update Q_online */
    train() {
        if (this.replayBuffer.size < this.batchSize) return null;

        const batch = this.replayBuffer.sample(this.batchSize);
        let totalLoss = 0;

        for (const { state, actionIdx, reward, nextState, done } of batch) {
            // Target from FROZEN Q_target (patent's key innovation)
            // CRITICAL FIX: Use qOnline to SELECT action, qTarget to EVALUATE (Double DQN)
            const targetQ = this.qOnline.predict(state);
            let targetValue;
            if (done) {
                targetValue = reward;
            } else {
                // Double DQN: qOnline selects best action, qTarget evaluates it
                const onlineNextQ = this.qOnline.predict(nextState);
                let bestActionIdx = 0;
                for (let i = 1; i < onlineNextQ.length; i++) {
                    if (onlineNextQ[i] > onlineNextQ[bestActionIdx]) bestActionIdx = i;
                }
                const targetNextQ = this.qTarget.predict(nextState);
                targetValue = reward + this.gamma * targetNextQ[bestActionIdx];
            }

            const oldQ = targetQ[actionIdx];
            targetQ[actionIdx] = targetValue;

            // Backprop on Q_online
            this.qOnline.train(state, targetQ);

            totalLoss += (targetValue - oldQ) ** 2;
        }

        this.stepCount++;
        const avgLoss = totalLoss / this.batchSize;
        this.lossHistory.push(avgLoss);
        if (this.lossHistory.length > 1000) this.lossHistory.shift();

        // Sync Q_target ← Q_online every L steps
        if (this.stepCount % this.targetUpdateFreq === 0) {
            this.qTarget.copyWeights(this.qOnline);
        }

        // Decay exploration
        this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);

        return avgLoss;
    }

    getStats() {
        return {
            stepCount: this.stepCount,
            epsilon: this.epsilon,
            replayBuffer: this.replayBuffer.getStats(),
            avgLoss: this.lossHistory.length > 0
                ? this.lossHistory.reduce((a, b) => a + b, 0) / this.lossHistory.length
                : 0,
            targetSyncAge: this.stepCount % this.targetUpdateFreq
        };
    }

    toJSON() {
        return {
            qOnline: this.qOnline.toJSON(),
            gamma: this.gamma,
            epsilon: this.epsilon,
            epsilonMin: this.epsilonMin,
            epsilonDecay: this.epsilonDecay,
            stepCount: this.stepCount,
            batchSize: this.batchSize,
            targetUpdateFreq: this.targetUpdateFreq
        };
    }

    fromJSON(data) {
        this.qOnline.fromJSON(data.qOnline);
        this.qTarget.copyWeights(this.qOnline);
        this.gamma = data.gamma ?? this.gamma;
        this.epsilon = data.epsilon ?? this.epsilon;
        this.epsilonMin = data.epsilonMin ?? this.epsilonMin;
        this.epsilonDecay = data.epsilonDecay ?? this.epsilonDecay;
        this.stepCount = data.stepCount ?? 0;
    }
}

// ─── DOUBLE DQN ──────────────────────────────────────────────────

class DoubleDeepQNetwork extends DeepQNetwork {
    /**
     * Double DQN (van Hasselt et al., 2016)
     * Prevents overestimation bias:
     *   - Q_online selects best action: a* = argmax Q_online(s', a)
     *   - Q_target evaluates:         target = r + γ · Q_target(s', a*)
     */
    train() {
        if (this.replayBuffer.size < this.batchSize) return null;

        const batch = this.replayBuffer.sample(this.batchSize);
        let totalLoss = 0;

        for (const { state, actionIdx, reward, nextState, done } of batch) {
            const targetQ = this.qOnline.predict(state);
            let targetValue;

            if (done) {
                targetValue = reward;
            } else {
                // DOUBLE Q: Q_online selects, Q_target evaluates
                const onlineNextQ = this.qOnline.predict(nextState);
                let bestIdx = 0;
                for (let i = 1; i < onlineNextQ.length; i++) {
                    if (onlineNextQ[i] > onlineNextQ[bestIdx]) bestIdx = i;
                }

                const targetNextQ = this.qTarget.predict(nextState);
                targetValue = reward + this.gamma * targetNextQ[bestIdx];
            }

            const oldQ = targetQ[actionIdx];
            targetQ[actionIdx] = targetValue;

            this.qOnline.train(state, targetQ);
            totalLoss += (targetValue - oldQ) ** 2;
        }

        this.stepCount++;
        const avgLoss = totalLoss / this.batchSize;
        this.lossHistory.push(avgLoss);
        if (this.lossHistory.length > 1000) this.lossHistory.shift();

        if (this.stepCount % this.targetUpdateFreq === 0) {
            this.qTarget.copyWeights(this.qOnline);
        }

        this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);
        return avgLoss;
    }
}

// ─── REWARD FUNCTION ─────────────────────────────────────────────

function computeReward(prevState, action, nextState) {
    let reward = 0;

    // CPU: lower utilization after action = good (if was overloaded)
    if (prevState.cpuUtilization > 80) {
        reward += (prevState.cpuUtilization - nextState.cpuUtilization) * 0.1;
    }

    // Memory: fewer page faults = better
    reward += (prevState.pageFaultRate - nextState.pageFaultRate) * 0.2;

    // Security: threat level reduction = big positive reward
    reward += (prevState.threatLevel - nextState.threatLevel) * 1.0;

    // AI responsiveness: lower latency = better
    reward += (prevState.aiLatency - nextState.aiLatency) * 0.001;

    // Stability: sudden process loss = negative reward (crash indicator)
    if (nextState.processCount < prevState.processCount - 5) {
        reward -= 2.0;
    }

    // Swap pressure: reducing swap = good
    reward += (prevState.swapUsage - nextState.swapUsage) * 0.15;

    // Action-specific shaping
    if (action === 'lockdown' && prevState.threatLevel >= 3) {
        reward += 0.5;  // lockdown is correct when threat is high
    }
    if (action === 'lockdown' && prevState.threatLevel <= 1) {
        reward -= 0.5;  // unnecessary lockdown hurts usability
    }
    if (action === 'scale_ai_up' && prevState.aiLatency > 5000) {
        reward += 0.3;  // scaling up when latency is high is smart
    }

    return reward;
}

// ─── STATE VECTORIZER ────────────────────────────────────────────

function vectorizeState(state) {
    const vec = [];
    for (const [field, { max }] of Object.entries(OSStateFields)) {
        vec.push((state[field] ?? 0) / max);
    }
    return vec;
}

function actionToIndex(action) {
    return OSActions.indexOf(action);
}

// ─── HAZOOM Q-LEARNER (UNIFIED) ─────────────────────────────────

class HazoomQLearner {
    /**
     * Hybrid Q-learning system for HAZOOM OS.
     * Routes between tabular (simple states) and DQN (complex states).
     * 
     * Level 1: Tabular Q-learning — fast, converges, discrete micro-decisions
     * Level 2: Double DQN — generalizes, handles complex macro-decisions
     */
    constructor(config = {}) {
        // Tabular Q-learning
        this.tabular = new QTable(OSActions, config.tabular ?? {});

        // Double DQN
        const stateDim = Object.keys(OSStateFields).length; // 12
        this.dqn = new DoubleDeepQNetwork(OSActions, stateDim, config.dqn ?? {});

        // Mode: 'tabular', 'dqn', or 'hybrid' (route by complexity)
        this.mode = config.mode ?? 'hybrid';
        this.complexityThreshold = config.complexityThreshold ?? 0.5;

        // Decision history (audit trail)
        this.history = [];
        this.maxHistory = config.maxHistory ?? 10000;

        // Cumulative stats
        this.totalDecisions = 0;
        this.totalReward = 0;
        this.lastAction = null;
        this.lastState = null;
    }

    /** Assess state complexity for routing decision */
    assessComplexity(state) {
        const cpu = (state.cpuUtilization ?? 0) / 100;
        const mem = (state.memoryUtilization ?? 0) / 100;
        const threat = (state.threatLevel ?? 0) / 4;
        const swap = (state.swapUsage ?? 0) / 100;
        const ai = (state.aiLatency ?? 0) / 10000;
        return (cpu + mem + threat + swap + ai) / 5;
    }

    /** Choose action — routes between tabular and DQN */
    chooseAction(state) {
        switch (this.mode) {
            case 'tabular':
                return this.tabular.chooseAction(state);
            case 'dqn':
                return this.dqn.chooseAction(vectorizeState(state));
            case 'hybrid': {
                const complexity = this.assessComplexity(state);
                if (complexity < this.complexityThreshold) {
                    return this.tabular.chooseAction(state);
                }
                return this.dqn.chooseAction(vectorizeState(state));
            }
            default:
                return this.tabular.chooseAction(state);
        }
    }

    /** Called every kernel tick — observe, decide, learn */
    onTick(prevState, currentState, kernelActionExecutor) {
        // 1. If we have a previous action, compute reward and learn
        if (this.lastAction !== null && this.lastState !== null) {
            const reward = computeReward(this.lastState, this.lastAction, currentState);

            // Learn in both systems (even if hybrid routing)
            this.tabular.update(this.lastState, this.lastAction, reward, currentState);

            const stateVec = vectorizeState(this.lastState);
            const nextStateVec = vectorizeState(currentState);
            this.dqn.storeTransition(
                stateVec,
                actionToIndex(this.lastAction),
                reward,
                nextStateVec,
                false // not terminal
            );
            this.dqn.train();

            this.totalReward += reward;
        }

        // 2. Choose next action
        const action = this.chooseAction(currentState);

        // 3. Execute action if executor provided
        if (kernelActionExecutor) {
            try {
                kernelActionExecutor(action);
            } catch (e) {
                // Action execution failed — negative reward feedback
                // (handled on next tick when state doesn't improve)
            }
        }

        // 4. Record decision
        this.lastAction = action;
        this.lastState = { ...currentState };
        this.totalDecisions++;

        // Circular buffer: O(1) instead of O(n) shift
        if (this.history.length >= this.maxHistory) {
            this.history[this.history.length % this.maxHistory] = {
                tick: Date.now(),
                state: currentState,
                action,
                mode: this.mode === 'hybrid'
                    ? (this.assessComplexity(currentState) < this.complexityThreshold ? 'tabular' : 'dqn')
                    : this.mode,
                epsilon: this.mode === 'tabular' ? this.tabular.epsilon : this.dqn.epsilon
            };
        } else {
            this.history.push({
                tick: Date.now(),
                state: currentState,
                action,
                mode: this.mode === 'hybrid'
                    ? (this.assessComplexity(currentState) < this.complexityThreshold ? 'tabular' : 'dqn')
                    : this.mode,
                epsilon: this.mode === 'tabular' ? this.tabular.epsilon : this.dqn.epsilon
            });
        }

        return action;
    }

    /** Get current greedy policy (for dashboard) */
    getPolicy(state) {
        const tabularAction = this.tabular.greedyAction(state);
        const dqnQ = this.dqn.qOnline.predict(vectorizeState(state));
        let dqnBestIdx = 0;
        for (let i = 1; i < dqnQ.length; i++) {
            if (dqnQ[i] > dqnQ[dqnBestIdx]) dqnBestIdx = i;
        }

        return {
            tabularAction,
            tabularQ: this.tabular.getQRow(state),
            dqnAction: OSActions[dqnBestIdx],
            dqnQValues: Object.fromEntries(OSActions.map((a, i) => [a, dqnQ[i]])),
            complexity: this.assessComplexity(state),
            routing: this.mode === 'hybrid'
                ? (this.assessComplexity(state) < this.complexityThreshold ? 'tabular' : 'dqn')
                : this.mode
        };
    }

    /** Full status for API */
    getStatus() {
        return {
            mode: this.mode,
            totalDecisions: this.totalDecisions,
            totalReward: this.totalReward.toFixed(4),
            avgReward: this.totalDecisions > 0
                ? (this.totalReward / this.totalDecisions).toFixed(4)
                : 0,
            tabular: this.tabular.getStats(),
            dqn: this.dqn.getStats(),
            lastAction: this.lastAction
        };
    }

    /** Persist to disk */
    toJSON() {
        return {
            mode: this.mode,
            complexityThreshold: this.complexityThreshold,
            totalDecisions: this.totalDecisions,
            totalReward: this.totalReward,
            tabular: this.tabular.toJSON(),
            dqn: this.dqn.toJSON()
        };
    }

    fromJSON(data) {
        this.mode = data.mode ?? this.mode;
        this.complexityThreshold = data.complexityThreshold ?? this.complexityThreshold;
        this.totalDecisions = data.totalDecisions ?? 0;
        this.totalReward = data.totalReward ?? 0;
        if (data.tabular) this.tabular.fromJSON(data.tabular);
        if (data.dqn) this.dqn.fromJSON(data.dqn);
    }

    /** Reset all learning */
    reset() {
        this.tabular = new QTable(OSActions);
        this.dqn = new DoubleDeepQNetwork(
            OSActions,
            Object.keys(OSStateFields).length
        );
        this.history = [];
        this.totalDecisions = 0;
        this.totalReward = 0;
        this.lastAction = null;
        this.lastState = null;
    }
}

// ─── EXPORTS ──────────────────────────────────────────────────────

module.exports = {
    QTable,
    ReplayBuffer,
    SimpleNeuralNet,
    DeepQNetwork,
    DoubleDeepQNetwork,
    HazoomQLearner,
    OSActions,
    OSStateFields,
    computeReward,
    vectorizeState,
    bin
};
