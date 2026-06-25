# HAZOOM Q-LEARNING SYSTEM — Design Specification

> "An OS that learns. Not just runs — adapts."

## 1. ARCHITECTURE

The HAZOOM Q-Learning system operates at TWO levels inside the OS:

```
┌─────────────────────────────────────────────────┐
│              HAZOOM OS v5.0                      │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  LEVEL 2: DQN (Deep Q-Network)           │   │
│  │  Patent: US20150100530A1 (Mnih/Kavukcuoglu)│   │
│  │                                          │   │
│  │  Q_online (θ) ───→ action selection      │   │
│  │  Q_target (θ⁻) ─→ stable training targets│   │
│  │  Replay Buffer D ─→ experience storage   │   │
│  │                                          │   │
│  │  Input: OS state vector (not pixels)     │   │
│  │  Output: optimal OS action policy         │   │
│  └──────────────────────────────────────────┘   │
│                    │                             │
│                    ▼                             │
│  ┌──────────────────────────────────────────┐   │
│  │  LEVEL 1: Tabular Q-Learning (Watkins)   │   │
│  │                                          │   │
│  │  Q(s,a) table for discrete OS decisions  │   │
│  │  Fast lookup, guaranteed convergence     │   │
│  │  Used for: scheduling, memory, security  │   │
│  └──────────────────────────────────────────┘   │
│                    │                             │
│                    ▼                             │
│  ┌──────────────────────────────────────────┐   │
│  │  KERNEL / STATE ENGINE                   │   │
│  │  Observes OS state → feeds Q-learner     │   │
│  │  Executes chosen actions → collects reward│   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 2. LEVEL 1: TABULAR Q-LEARNING (OS MICRO-DECISIONS)

For discrete, bounded OS decisions where the state-action space is small enough for a table.

### State Space (S)
The OS state is a tuple of observable properties:

```javascript
const OSState = {
    // Process state
    processCount: number,      // 0-1024
    cpuUtilization: number,    // 0-100 (%)
    readyQueueLength: number,  // 0-1024

    // Memory state
    memoryUtilization: number, // 0-100 (%)
    pageFaultRate: number,     // 0-100 (faults/sec)
    swapUsage: number,         // 0-100 (%)

    // I/O state
    diskIOPS: number,          // 0-1000
    networkBandwidth: number,  // 0-100 (%)

    // Security state
    threatLevel: number,       // 0-4 (none/low/medium/high/critical)
    failedLogins: number,      // 0-100

    // AI state
    aiLatency: number,         // 0-10000 (ms)
    aetherBusLoad: number      // 0-100 (%)
};
```

### Action Space (A)
Discrete actions the Q-learner can take:

```javascript
const OSActions = {
    // Scheduler actions
    ADJUST_QUANTUM: 'adjust_quantum',        // Change time quantum
    REBALANCE_PRIORITIES: 'rebalance',       // Re-prioritize processes
    MIGRATE_PROCESS: 'migrate',              // Move process between cores

    // Memory actions
    COMPACT_MEMORY: 'compact',               // Run compaction
    EVICT_CACHE: 'evict_cache',             // Free cache pages
    SWAP_OUT: 'swap_out',                   // Push to swap

    // Security actions
    LOCKDOWN: 'lockdown',                   // Restrict permissions
    KILL_SUSPICIOUS: 'kill_suspicious',     // Terminate suspect process
    ROTATE_KEYS: 'rotate_keys',            // Re-key encryption

    // AI actions
    SCALE_AI_UP: 'scale_ai_up',            // More AI resources
    SCALE_AI_DOWN: 'scale_ai_down',        // Less AI resources
    CACHE_MODEL: 'cache_model'             // Warm model cache
};
```

### Q-Table

```javascript
// Discretized state key: stringify binned state values
function stateKey(state) {
    return [
        bin(state.cpuUtilization, 10),        // 10 bins: 0-9
        bin(state.memoryUtilization, 10),
        bin(state.pageFaultRate, 5),
        bin(state.threatLevel, 5),            // already discrete
        bin(state.readyQueueLength, 5)
    ].join(',');
}

// Q-table: Map<stateKey, Map<action, qValue>>
class QTable {
    constructor(actions, config = {}) {
        this.actions = actions;
        this.alpha = config.alpha || 0.1;       // learning rate
        this.gamma = config.gamma || 0.95;      // discount factor
        this.epsilon = config.epsilon || 1.0;   // exploration rate
        this.epsilonMin = config.epsilonMin || 0.01;
        this.epsilonDecay = config.epsilonDecay || 0.995;
        this.table = new Map();
    }

    // Get Q(s, a)
    get(state, action) {
        const key = stateKey(state);
        const row = this.table.get(key);
        if (!row) return 0;
        return row.get(action) || 0;
    }

    // Set Q(s, a)
    set(state, action, value) {
        const key = stateKey(state);
        if (!this.table.has(key)) {
            this.table.set(key, new Map());
        }
        this.table.get(key).set(action, value);
    }

    // Bellman update
    update(state, action, reward, nextState) {
        const currentQ = this.get(state, action);
        const maxNextQ = Math.max(
            ...this.actions.map(a => this.get(nextState, a))
        );
        const newQ = (1 - this.alpha) * currentQ
                    + this.alpha * (reward + this.gamma * maxNextQ);
        this.set(state, action, newQ);

        // Decay exploration
        this.epsilon = Math.max(
            this.epsilonMin,
            this.epsilon * this.epsilonDecay
        );

        return newQ;
    }

    // Epsilon-greedy policy
    chooseAction(state) {
        if (Math.random() < this.epsilon) {
            // Explore: random action
            return this.actions[Math.floor(Math.random() * this.actions.length)];
        }
        // Exploit: best known action
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
}

function bin(value, bins) {
    return Math.min(bins - 1, Math.floor((value / 100) * bins));
}
```

### Reward Function

The OS reward encodes system health — the Q-learner optimizes for a **healthy, fast, secure** system:

```javascript
function computeReward(prevState, action, nextState) {
    let reward = 0;

    // CPU efficiency: lower utilization = better (when not overloaded)
    reward += (prevState.cpuUtilization - nextState.cpuUtilization) * 0.1;

    // Memory: fewer page faults = better
    reward += (prevState.pageFaultRate - nextState.pageFaultRate) * 0.2;

    // Security: threat level reduction = big reward
    reward += (prevState.threatLevel - nextState.threatLevel) * 1.0;

    // Responsiveness: lower AI latency = better
    reward += (prevState.aiLatency - nextState.aiLatency) * 0.01;

    // Stability penalty: if process count dropped suddenly (crash?)
    if (nextState.processCount < prevState.processCount - 5) {
        reward -= 2.0;  // penalty for instability
    }

    // Throughput: more completed processes = good
    // (tracked externally, passed as context)

    return reward;
}
```

---

## 3. LEVEL 2: DQN — DEEP Q-NETWORK (OS MACRO-POLICY)

For complex, high-dimensional OS state where tabular Q-learning can't generalize.

Based on US Patent US20150100530A1 (Mnih & Kavukcuoglu, Google DeepMind).

### Neural Network Architecture

Instead of Atari pixels, the DQN takes the OS state vector:

```
Input: OS State Vector (20 features)
    │
    ▼
Dense(128, ReLU) ─── Layer 1: pattern extraction
    │
    ▼
Dense(128, ReLU) ─── Layer 2: abstraction
    │
    ▼
Dense(64, ReLU)  ─── Layer 3: compression
    │
    ▼
Dense(|A|, Linear) ─ Output: one Q-value per action
```

### Dual Network System (from Patent)

```javascript
class DeepQNetwork {
    constructor(config = {}) {
        // Online network — used for action selection
        this.qOnline = this.buildNetwork(config);

        // Target network — provides stable training targets
        this.qTarget = this.buildNetwork(config);
        this.qTarget.copyWeights(this.qOnline);

        // Experience replay buffer (from patent: FIFO, capacity N)
        this.replayBuffer = new ReplayBuffer(config.bufferSize || 100000);

        // Hyperparameters
        this.gamma = config.gamma || 0.99;
        this.epsilon = config.epsilon || 1.0;
        this.epsilonMin = config.epsilonMin || 0.01;
        this.epsilonDecay = config.epsilonDecay || 0.9999;
        this.batchSize = config.batchSize || 32;
        this.targetUpdateFreq = config.targetUpdateFreq || 1000;
        this.learningRate = config.learningRate || 0.00025;

        this.stepCount = 0;
    }

    // Epsilon-greedy action selection (uses Q_online ONLY)
    chooseAction(stateVector) {
        if (Math.random() < this.epsilon) {
            return this.randomAction();
        }
        const qValues = this.qOnline.predict(stateVector);
        return argmax(qValues);
    }

    // Store transition in replay buffer
    storeTransition(state, action, reward, nextState, done) {
        this.replayBuffer.push({ state, action, reward, nextState, done });
    }

    // Training step (from patent: sample minibatch from D)
    train() {
        if (this.replayBuffer.size < this.batchSize) return;

        const batch = this.replayBuffer.sample(this.batchSize);

        for (const { state, action, reward, nextState, done } of batch) {
            // Target from FROZEN Q_target (patent key innovation)
            const targetQ = done
                ? reward
                : reward + this.gamma * max(this.qTarget.predict(nextState));

            // Update Q_online via gradient descent
            this.qOnline.update(state, action, targetQ);
        }

        this.stepCount++;

        // Sync Q_target ← Q_online every L steps (from patent)
        if (this.stepCount % this.targetUpdateFreq === 0) {
            this.qTarget.copyWeights(this.qOnline);
        }

        // Decay exploration
        this.epsilon = Math.max(
            this.epsilonMin,
            this.epsilon * this.epsilonDecay
        );
    }
}
```

### Experience Replay Buffer

```javascript
class ReplayBuffer {
    constructor(capacity) {
        this.capacity = capacity;
        this.buffer = [];
        this.position = 0;
    }

    push(transition) {
        if (this.buffer.length < this.capacity) {
            this.buffer.push(transition);
        } else {
            this.buffer[this.position] = transition;  // FIFO overwrite
        }
        this.position = (this.position + 1) % this.capacity;
    }

    sample(batchSize) {
        const batch = [];
        for (let i = 0; i < batchSize; i++) {
            const idx = Math.floor(Math.random() * this.buffer.length);
            batch.push(this.buffer[idx]);
        }
        return batch;
    }

    get size() {
        return this.buffer.length;
    }
}
```

---

## 4. DOUBLE Q-LEARNING INTEGRATION

To prevent overestimation bias (van Hasselt, 2011):

```javascript
class DoubleDeepQNetwork extends DeepQNetwork {
    train() {
        if (this.replayBuffer.size < this.batchSize) return;

        const batch = this.replayBuffer.sample(this.batchSize);

        for (const { state, action, reward, nextState, done } of batch) {
            // Double Q: select action with Q_online, evaluate with Q_target
            const onlineQNext = this.qOnline.predict(nextState);
            const bestAction = argmax(onlineQNext);           // Q_online selects
            const targetQ = this.qTarget.predict(nextState);
            const targetValue = targetQ[bestAction];          // Q_target evaluates

            const target = done ? reward : reward + this.gamma * targetValue;
            this.qOnline.update(state, action, target);
        }

        this.stepCount++;
        if (this.stepCount % this.targetUpdateFreq === 0) {
            this.qTarget.copyWeights(this.qOnline);
        }
        this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);
    }
}
```

---

## 5. HAZOOM INTEGRATION — Q-Learning as OS Service

The Q-learning system is a KERNEL SERVICE that continuously learns from OS state:

```javascript
// In kernel/kernel.js
class HazoomKernel {
    constructor() {
        // ... existing kernel ...

        // Q-Learning Service
        this.qLearner = new HazoomQLearner({
            mode: 'hybrid',  // uses both tabular + DQN
            tabularConfig: {
                alpha: 0.1,
                gamma: 0.95,
                epsilon: 1.0,
                epsilonMin: 0.01,
                epsilonDecay: 0.995
            },
            dqnConfig: {
                learningRate: 0.00025,
                gamma: 0.99,
                epsilon: 1.0,
                epsilonMin: 0.01,
                epsilonDecay: 0.9999,
                bufferSize: 100000,
                batchSize: 32,
                targetUpdateFreq: 1000
            }
        });

        // System tick drives Q-learning
        this.on('tick', () => this.qLearner.onTick(this.getState()));
    }
}

class HazoomQLearner {
    constructor(config) {
        // Tabular for fast micro-decisions
        this.tabular = new QTable(OS_ACTIONS, config.tabularConfig);

        // DQN for macro policy (complex state patterns)
        this.dqn = new DoubleDeepQNetwork(config.dqnConfig);

        // Decision router: use tabular for small state spaces, DQN for complex
        this.mode = config.mode;
        this.history = [];  // audit trail
    }

    onTick(currentState) {
        // 1. Choose action
        const action = this.chooseAction(currentState);

        // 2. Execute action in OS
        const result = this.executeAction(action);

        // 3. Observe next state + reward
        const nextState = currentState; // refreshed by kernel
        const reward = computeReward(currentState, action, nextState);

        // 4. Update both learners
        this.tabular.update(currentState, action, reward, nextState);
        this.dqn.storeTransition(
            this.vectorize(currentState), action, reward,
            this.vectorize(nextState), result.terminal
        );
        this.dqn.train();

        // 5. Audit
        this.history.push({
            tick: Date.now(),
            state: currentState,
            action,
            reward,
            epsilon: this.dqn.epsilon
        });

        return action;
    }

    chooseAction(state) {
        // Route: tabular for discrete, DQN for continuous/complex
        const complexity = this.assessComplexity(state);
        if (complexity < 0.5) {
            return this.tabular.chooseAction(state);
        }
        return this.dqn.chooseAction(this.vectorize(state));
    }

    assessComplexity(state) {
        // Higher complexity = more dimensions interacting
        const load = state.cpuUtilization / 100;
        const memPressure = state.memoryUtilization / 100;
        const threatPressure = state.threatLevel / 4;
        return (load + memPressure + threatPressure) / 3;
    }

    vectorize(state) {
        // Convert OS state to numeric vector for DQN input
        return [
            state.processCount / 1024,
            state.cpuUtilization / 100,
            state.readyQueueLength / 1024,
            state.memoryUtilization / 100,
            state.pageFaultRate / 100,
            state.swapUsage / 100,
            state.diskIOPS / 1000,
            state.networkBandwidth / 100,
            state.threatLevel / 4,
            state.failedLogins / 100,
            state.aiLatency / 10000,
            state.aetherBusLoad / 100
        ];
    }

    executeAction(action) {
        // Map Q-learning actions to kernel operations
        const actionMap = {
            'adjust_quantum': () => this.kernel.adjustTimeQuantum(),
            'rebalance': () => this.kernel.rebalancePriorities(),
            'compact': () => this.kernel.compactMemory(),
            'evict_cache': () => this.kernel.evictCache(),
            'lockdown': () => this.kernel.securityLockdown(),
            'kill_suspicious': () => this.kernel.killSuspiciousProcess(),
            'scale_ai_up': () => this.kernel.scaleAI(1),
            'scale_ai_down': () => this.kernel.scaleAI(-1),
            // ... all OSActions mapped
        };

        return actionMap[action] ? actionMap[action]() : { terminal: false };
    }
}
```

---

## 6. Q-LEARNING DASHBOARD APP

A visualization app at `apps/q-learner/` showing:

- Live Q-table heatmap (state × action values)
- Reward curve over time (convergence visualization)
- Epsilon decay graph
- Action frequency distribution
- DQN loss curve
- Experience replay buffer utilization
- Current policy: "In state X, the OS prefers action Y (Q=3.7)"

---

## 7. API ENDPOINTS (Q-Learning)

```
GET  /api/qlearner/status          → Q-learner state, epsilon, step count
GET  /api/qlearner/qtable          → Full Q-table dump
GET  /api/qlearner/policy          → Current greedy policy
GET  /api/qlearner/history?n=100   → Last N decisions
POST /api/qlearner/config          → Update hyperparameters
POST /api/qlearner/reset           → Reset Q-table and DQN
GET  /api/qlearner/stats           → Convergence stats
```

---

## 8. PERSISTENCE

Q-learning state is persisted so the OS learns ACROSS reboots:

```javascript
// Save Q-table + DQN weights on shutdown
kernel.on('shutdown', () => {
    fs.writeFileSync(
        'data/qlearner/qtable.json',
        JSON.stringify(qLearner.tabular.table)
    );
    qLearner.dqn.qOnline.save('data/qlearner/dqn_weights.bin');
});

// Restore on boot
kernel.on('boot', () => {
    if (fs.existsSync('data/qlearner/qtable.json')) {
        qLearner.tabular.table = new Map(
            Object.entries(JSON.parse(
                fs.readFileSync('data/qlearner/qtable.json')
            ))
        );
    }
    if (fs.existsSync('data/qlearner/dqn_weights.bin')) {
        qLearner.dqn.qOnline.load('data/qlearner/dqn_weights.bin');
        qLearner.dqn.qTarget.copyWeights(qLearner.dqn.qOnline);
    }
});
```

---

## 9. MATHEMATICAL FOUNDATION

| Algorithm | Source | Use Case | Convergence |
|-----------|--------|----------|-------------|
| Tabular Q-learning | Watkins & Dayan (1992) | Discrete OS decisions | Guaranteed (finite MDP) |
| DQN | Mnih et al. (2015), Patent US20150100530A1 | High-dimensional OS state | Stabilized (not guaranteed) |
| Double DQN | van Hasselt et al. (2016) | Reduce overestimation | Better than DQN |

---

*The OS does not just execute. It learns. Every tick is a training step. Every shutdown saves knowledge. Every boot resumes wisdom.*
