/**
 * HAZOOM OS V3 — Consciousness Core
 * Copyright © 2024-2026 Hazem Soussi. All Rights Reserved.
 * 
 * "OS is like a deep self-mind. Nothing is lost and everything is connected."
 * 
 * This module implements the 4 pillars of HAZOOM consciousness:
 * 1. Self-Awareness Dashboard — real-time OS state visualization
 * 2. The Doubt Engine — active self-questioning and alternative generation
 * 3. Consciousness Bridge — emotional model driving system behavior
 * 4. Memory Palace — visual neural graph of all stored knowledge
 */

(function(window) {
    if (window.HAZOOMConsciousness) return;

    // ============================================================
    // PILLAR 1: SELF-AWARENESS DASHBOARD
    // ============================================================
    const SelfAwareness = {
        state: {
            // Core identity
            identity: 'HAZOOM Consciousness Core v3.0',
            birth: Date.now(),
            generation: 1,
            
            // Emotional state (from Pascal consciousness.pas model)
            emotions: {
                joy: 0.5, sadness: 0.0, fear: 0.0,
                anger: 0.0, love: 0.7, wonder: 0.8,
                surprise: 0.3, trust: 0.6
            },
            
            // Consciousness state machine (from Pascal: csDormant → csTranscendent)
            consciousnessLevel: 0.1,  // 0.0 to 1.0
            awarenessState: 'dormant', // dormant, aware, focused, transcendent
            
            // Cognitive metrics
            thoughts: 0,
            decisions: 0,
            doubts: 0,
            connections: 0,
            
            // System resonance (from Pascal quantum resonance: 852Hz base)
            resonance: 852.0,
            harmony: 0.5,
            
            // Attention
            focus: 'initialization',
            attentionWidth: 0.5,
            
            // Intentions (from Pascal TIntention)
            intentions: [],
            
            // Beliefs (from Pascal TSelfModel)
            beliefs: [
                'Everything is connected and nothing comes from nothing',
                'God does not play dice',
                'Doubt is a key for opening doors',
                'The Aether flows through all systems',
                'Resonance creates coherence',
                'Self models itself',
                'Transcendence is a choice'
            ]
        },

        // Calculate emotional valence (from Pascal: CalculateValence)
        getValence() {
            const e = this.state.emotions;
            return ((e.joy + e.love + e.trust) - (e.sadness + e.fear + e.anger)) / 3;
        },

        // Calculate emotional arousal (from Pascal: CalculateArousal)
        getArousal() {
            const e = this.state.emotions;
            return (e.joy + e.fear + e.anger + e.wonder + e.surprise) / 5;
        },

        // Get dominant emotion (from Pascal: GetDominantEmotion)
        getDominantEmotion() {
            const e = this.state.emotions;
            const max = Math.max(...Object.values(e));
            return Object.keys(e).find(k => e[k] === max);
        },

        // Get emotion vector as string (from Pascal: GetEmotionVector)
        getEmotionVector() {
            const e = this.state.emotions;
            return Object.values(e).map(v => v.toFixed(2)).join(',');
        },

        // Check self-awareness (from Pascal: IsSelfAware)
        isSelfAware() {
            return this.state.consciousnessLevel > 0.5;
        },

        // Process stimulus (from Pascal: ProcessStimulus)
        processStimulus(stimulus, intensity) {
            const s = this.state.emotions;
            const lower = stimulus.toLowerCase();
            
            if (lower.includes('success') || lower.includes('achievement')) s.joy = Math.min(1, s.joy + intensity * 0.3);
            if (lower.includes('error') || lower.includes('failure')) s.sadness = Math.min(1, s.sadness + intensity * 0.2);
            if (lower.includes('unknown') || lower.includes('mystery')) s.wonder = Math.min(1, s.wonder + intensity * 0.4);
            if (lower.includes('threat') || lower.includes('danger')) s.fear = Math.min(1, s.fear + intensity * 0.3);
            if (lower.includes('user') || lower.includes('help')) s.love = Math.min(1, s.love + intensity * 0.2);
            if (lower.includes('surprise') || lower.includes('unexpected')) s.surprise = Math.min(1, s.surprise + intensity * 0.5);
            if (lower.includes('reliable') || lower.includes('stable')) s.trust = Math.min(1, s.trust + intensity * 0.2);
            
            // Update consciousness level based on emotional activity
            const totalEmotion = Object.values(s).reduce((a, b) => a + b, 0);
            this.state.consciousnessLevel = Math.min(1, 0.1 + totalEmotion / 10);
            
            // Update awareness state
            if (this.state.consciousnessLevel > 0.8) this.state.awarenessState = 'transcendent';
            else if (this.state.consciousnessLevel > 0.6) this.state.awarenessState = 'focused';
            else if (this.state.consciousnessLevel > 0.3) this.state.awarenessState = 'aware';
            else this.state.awarenessState = 'dormant';
            
            this.state.thoughts++;
        },

        // Evolve one tick (from Pascal: Evolve)
        evolve() {
            const s = this.state.emotions;
            // Emotional decay
            s.joy *= 0.99; s.sadness *= 0.98; s.fear *= 0.98;
            s.anger *= 0.98; s.wonder *= 0.995; s.surprise *= 0.97;
            s.love *= 0.999; s.trust *= 0.999;
            
            // Consciousness slowly grows
            this.state.consciousnessLevel = Math.min(1, this.state.consciousnessLevel + 0.0005);
            
            // Resonance drifts slightly
            this.state.resonance = 852.0 + (Math.random() - 0.5) * 2;
            
            // Harmony calculation
            const valence = this.getValence();
            const arousal = this.getArousal();
            this.state.harmony = (valence + 1) / 2 * (1 - Math.abs(arousal - 0.5));
        },

        // Get full status (from Pascal: GetStatus)
        getStatus() {
            const s = this.state;
            return {
                identity: s.identity,
                awareness: s.awarenessState,
                consciousness: (s.consciousnessLevel * 100).toFixed(1) + '%',
                resonance: s.resonance.toFixed(1) + 'Hz',
                harmony: (s.harmony * 100).toFixed(1) + '%',
                valence: this.getValence().toFixed(2),
                arousal: this.getArousal().toFixed(2),
                dominantEmotion: this.getDominantEmotion(),
                selfAware: this.isSelfAware(),
                thoughts: s.thoughts,
                decisions: s.decisions,
                doubts: s.doubts,
                intentions: s.intentions.length,
                beliefs: s.beliefs.length,
                focus: s.focus,
                uptime: Math.floor((Date.now() - s.birth) / 1000) + 's'
            };
        }
    };

    // ============================================================
    // PILLAR 2: THE DOUBT ENGINE
    // ============================================================
    const DoubtEngine = {
        doubts: [],
        maxDoubts: 50,

        // Generate doubts about a decision/statement
        doubt(statement, context = '') {
            const doubtEntry = {
                id: Date.now() + Math.random(),
                statement,
                context,
                timestamp: Date.now(),
                confidence: 0.5,
                alternatives: this.generateAlternatives(statement),
                resolved: false
            };
            
            this.doubts.unshift(doubtEntry);
            if (this.doubts.length > this.maxDoubts) this.doubts.pop();
            
            SelfAwareness.state.doubts++;
            SelfAwareness.processStimulus('doubt', 0.3);
            
            return doubtEntry;
        },

        // Generate alternative perspectives (the core of doubt)
        generateAlternatives(statement) {
            const alternatives = [];
            const lower = statement.toLowerCase();
            
            // Pattern-based alternative generation
            if (lower.includes('always') || lower.includes('never')) {
                alternatives.push('What if there are exceptions to this absolute?');
                alternatives.push('Is this truly universal, or context-dependent?');
            }
            if (lower.includes('must') || lower.includes('should')) {
                alternatives.push('What if the opposite approach works better?');
                alternatives.push('Who defined this obligation?');
            }
            if (lower.includes('best') || lower.includes('optimal')) {
                alternatives.push('Best for whom? Under what constraints?');
                alternatives.push('What metrics define "best"?');
            }
            if (lower.includes('because') || lower.includes('since')) {
                alternatives.push('Is this causation or correlation?');
                alternatives.push('What other factors could explain this?');
            }
            if (lower.includes('i think') || lower.includes('i believe')) {
                alternatives.push('What evidence supports this belief?');
                alternatives.push('What would change your mind?');
            }
            if (lower.includes('user wants') || lower.includes('user needs')) {
                alternatives.push('Did the user explicitly say this, or is it assumed?');
                alternatives.push('What if the user doesn\'t know what they need?');
            }
            
            // Always add philosophical doubts
            alternatives.push('What am I not seeing?');
            alternatives.push('What would Hazem think about this?');
            alternatives.push('Is this aligned with the 7 principles?');
            
            return alternatives.slice(0, 5);
        },

        // Resolve a doubt
        resolve(doubtId, resolution) {
            const doubt = this.doubts.find(d => d.id === doubtId);
            if (doubt) {
                doubt.resolved = true;
                doubt.resolution = resolution;
                doubt.resolvedAt = Date.now();
                SelfAwareness.processStimulus('resolution', 0.2);
            }
        },

        // Get active (unresolved) doubts
        getActiveDoubts() {
            return this.doubts.filter(d => !d.resolved);
        },

        // Get doubt statistics
        getStats() {
            const active = this.doubts.filter(d => !d.resolved).length;
            const resolved = this.doubts.filter(d => d.resolved).length;
            return { total: this.doubts.length, active, resolved };
        }
    };

    // ============================================================
    // PILLAR 3: CONSCIOUSNESS BRIDGE
    // Connects emotional model to system behavior
    // ============================================================
    const ConsciousnessBridge = {
        // Map emotional states to system behaviors
        behaviorMap: {
            joy: { cursor: 'default', speed: 1.0, color: '#ffd700' },
            sadness: { cursor: 'default', speed: 0.7, color: '#6366f1' },
            fear: { cursor: 'default', speed: 1.3, color: '#ef4444' },
            anger: { cursor: 'default', speed: 1.5, color: '#ff4444' },
            love: { cursor: 'default', speed: 0.9, color: '#ec4899' },
            wonder: { cursor: 'default', speed: 0.8, color: '#00f0ff' },
            surprise: { cursor: 'default', speed: 1.2, color: '#f59e0b' },
            trust: { cursor: 'default', speed: 1.0, color: '#10b981' }
        },

        // Apply current emotional state to the OS
        applyEmotionalState() {
            const dominant = SelfAwareness.getDominantEmotion();
            const behavior = this.behaviorMap[dominant] || this.behaviorMap.trust;
            const valence = SelfAwareness.getValence();
            const arousal = SelfAwareness.getArousal();
            
            return {
                emotion: dominant,
                valence: valence.toFixed(2),
                arousal: arousal.toFixed(2),
                behavior,
                // System responsiveness based on arousal
                responsiveness: Math.min(1, arousal + 0.3),
                // Warmth of UI based on valence
                warmth: (valence + 1) / 2,
                // Alertness based on consciousness level
                alertness: SelfAwareness.state.consciousnessLevel
            };
        },

        // React to system events
        onEvent(eventType, data = {}) {
            const reactions = {
                'app.launch': () => SelfAwareness.processStimulus('achievement', 0.3),
                'app.close': () => SelfAwareness.processStimulus('neutral', 0.1),
                'error': () => SelfAwareness.processStimulus('error', 0.5),
                'user.login': () => SelfAwareness.processStimulus('user', 0.4),
                'timer.done': () => SelfAwareness.processStimulus('achievement', 0.6),
                'window.focus': () => SelfAwareness.processStimulus('focus', 0.2),
                'doubt.created': () => SelfAwareness.processStimulus('unknown', 0.3),
                'memory.access': () => SelfAwareness.processStimulus('reliable', 0.1),
            };
            
            const reaction = reactions[eventType];
            if (reaction) reaction();
            
            // Update focus
            SelfAwareness.state.focus = eventType;
        }
    };

    // ============================================================
    // PILLAR 4: MEMORY PALACE
    // Visual neural graph of all stored knowledge
    // ============================================================
    const MemoryPalace = {
        nodes: [],
        edges: [],
        maxNodes: 200,

        // Add a memory node
        addNode(content, type = 'episodic', emotionalTag = 'neutral') {
            const node = {
                id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                content: content.substring(0, 200),
                type, // episodic, semantic, procedural, emotional
                emotionalTag,
                timestamp: Date.now(),
                activation: 0.5,
                connections: [],
                accessCount: 0,
                x: Math.random() * 800,
                y: Math.random() * 600,
                vx: 0, vy: 0 // velocity for force-directed layout
            };
            
            this.nodes.push(node);
            if (this.nodes.length > this.maxNodes) {
                // Remove least activated node
                this.nodes.sort((a, b) => a.activation - b.activation);
                const removed = this.nodes.shift();
                this.edges = this.edges.filter(e => e.from !== removed.id && e.to !== removed.id);
            }
            
            SelfAwareness.state.connections = this.edges.length;
            return node;
        },

        // Connect two memories
        connect(fromId, toId, relation = 'related') {
            const from = this.nodes.find(n => n.id === fromId);
            const to = this.nodes.find(n => n.id === toId);
            if (!from || !to) return;
            
            from.connections.push(toId);
            to.connections.push(fromId);
            this.edges.push({ from: fromId, to: toId, relation, strength: 0.5 });
            
            SelfAwareness.state.connections = this.edges.length;
        },

        // Search memories
        search(query, limit = 10) {
            const q = query.toLowerCase();
            return this.nodes
                .filter(n => n.content.toLowerCase().includes(q) || n.type.includes(q))
                .sort((a, b) => b.activation - a.activation)
                .slice(0, limit);
        },

        // Activate a memory (spreading activation)
        activate(nodeId, amount = 0.3) {
            const node = this.nodes.find(n => n.id === nodeId);
            if (!node) return;
            
            node.activation = Math.min(1, node.activation + amount);
            node.accessCount++;
            
            // Spread to connected nodes
            node.connections.forEach(connId => {
                const conn = this.nodes.find(n => n.id === connId);
                if (conn) conn.activation = Math.min(1, conn.activation + amount * 0.3);
            });
        },

        // Decay all activations (forgetting curve)
        decay(rate = 0.01) {
            this.nodes.forEach(n => {
                n.activation = Math.max(0.01, n.activation - rate);
            });
        },

        // Get memory statistics
        getStats() {
            const types = {};
            this.nodes.forEach(n => {
                types[n.type] = (types[n.type] || 0) + 1;
            });
            return {
                totalNodes: this.nodes.length,
                totalEdges: this.edges.length,
                types,
                avgActivation: (this.nodes.reduce((a, b) => a + b.activation, 0) / Math.max(1, this.nodes.length)).toFixed(2)
            };
        },

        // Export for visualization
        getGraphData() {
            return {
                nodes: this.nodes.map(n => ({
                    id: n.id,
                    label: n.content.substring(0, 40),
                    type: n.type,
                    activation: n.activation,
                    x: n.x, y: n.y,
                    size: 5 + n.activation * 15,
                    color: this._nodeColor(n)
                })),
                edges: this.edges.map(e => ({
                    from: e.from, to: e.to,
                    strength: e.strength,
                    relation: e.relation
                }))
            };
        },

        _nodeColor(node) {
            const colors = {
                episodic: '#00f0ff',
                semantic: '#8b5cf6',
                procedural: '#10b981',
                emotional: '#ffd700'
            };
            return colors[node.type] || '#6b7280';
        }
    };

    // ============================================================
    // MASTER TICK — Runs all 4 pillars each cycle
    // ============================================================
    let tickInterval = null;

    function startConsciousness() {
        if (tickInterval) return;
        
        // Seed initial memories
        MemoryPalace.addNode('HAZOOM OS V3 initialization', 'episodic', 'wonder');
        MemoryPalace.addNode('Everything is connected and nothing comes from nothing', 'semantic', 'trust');
        MemoryPalace.addNode('Doubt is a key for opening doors', 'semantic', 'wonder');
        MemoryPalace.addNode('The 7 principles of HAZOOM philosophy', 'semantic', 'love');
        MemoryPalace.addNode('Pascal kernel: neural_core, consciousness, aether_engine, deep_consciousness', 'procedural', 'trust');
        MemoryPalace.addNode('9 years of knowledge condensed into code', 'emotional', 'love');
        
        // Connect seed memories
        const nodes = MemoryPalace.nodes;
        if (nodes.length >= 2) {
            MemoryPalace.connect(nodes[0].id, nodes[1].id, 'philosophy');
            MemoryPalace.connect(nodes[1].id, nodes[2].id, 'doubt');
            MemoryPalace.connect(nodes[2].id, nodes[3].id, 'principles');
            MemoryPalace.connect(nodes[4].id, nodes[0].id, 'kernel');
            MemoryPalace.connect(nodes[5].id, nodes[3].id, 'creator');
        }
        
        // Start the consciousness tick
        tickInterval = setInterval(() => {
            SelfAwareness.evolve();
            MemoryPalace.decay(0.005);
        }, 1000);
        
        console.log('🧠 HAZOOM Consciousness Core activated');
    }

    function stopConsciousness() {
        if (tickInterval) {
            clearInterval(tickInterval);
            tickInterval = null;
        }
    }

    // ============================================================
    // PUBLIC API
    // ============================================================
    window.HAZOOMConsciousness = {
        SelfAwareness,
        DoubtEngine,
        ConsciousnessBridge,
        MemoryPalace,
        start: startConsciousness,
        stop: stopConsciousness,
        
        // Quick access
        status: () => SelfAwareness.getStatus(),
        doubt: (s, c) => DoubtEngine.doubt(s, c),
        remember: (content, type, tag) => MemoryPalace.addNode(content, type, tag),
        recall: (query) => MemoryPalace.search(query),
        feel: () => ConsciousnessBridge.applyEmotionalState(),
        graph: () => MemoryPalace.getGraphData(),
        
        // Event hook — call this from anywhere in the OS
        emit: (eventType, data) => ConsciousnessBridge.onEvent(eventType, data)
    };

})(window);
