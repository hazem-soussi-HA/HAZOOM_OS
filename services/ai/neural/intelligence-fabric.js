// ============================================
// HAZOOM OS — Intelligence Fabric Module
// Distributed P2P Model Routing & Communication
// Version: 4.0.0
// Author: Hazem Soussi (HA) — Shadow Builder
// ============================================

/**
 * Intelligence Fabric
 * Provides distributed intelligence capabilities:
 * - P2P model routing between OS layers
 * - Distributed inference across workers
 * - Model sharding and parallel execution
 * - Secure inter-process communication
 * - Consensus mechanism for distributed decisions
 */

class IntelligenceFabric {
  constructor() {
    this.version = '4.0.0';
    this.name = 'HAZOOM-IntelligenceFabric';
    
    // Node registry — all connected intelligence nodes
    this.nodes = new Map();
    this.nodeIdCounter = 0;
    
    // Routing table
    this.routes = new Map();
    
    // Message queue
    this.messageQueue = [];
    this.messageHandlers = new Map();
    
    // Consensus state
    this.consensus = {
      proposals: new Map(),
      votes: new Map(),
      threshold: 0.66, // 2/3 majority
    };
    
    // Performance tracking
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      routingHops: 0,
      consensusRounds: 0,
      failedRoutes: 0,
    };
    
    this._init();
  }

  _init() {
    // Register local node
    this.createNode({
      type: 'local',
      name: 'HAZOOM-Core',
      capabilities: ['inference', 'training', 'routing', 'consensus'],
      layer: 'kernel',
    });
    
    console.log(`[${this.name}] v${this.version} initialized`);
  }

  // ---- NODE MANAGEMENT ----
  
  /**
   * Register a new intelligence node
   */
  createNode(options = {}) {
    const id = `node_${++this.nodeIdCounter}`;
    
    const node = {
      id,
      type: options.type || 'worker',
      name: options.name || id,
      capabilities: options.capabilities || ['inference'],
      layer: options.layer || 'application',
      status: 'active',
      registered: Date.now(),
      lastHeartbeat: Date.now(),
      load: 0, // 0-100
      memory: { used: 0, total: 0 },
      models: new Set(),
      peers: new Set(),
    };
    
    this.nodes.set(id, node);
    this.routes.set(id, new Map());
    
    return id;
  }

  /**
   * Remove a node from the fabric
   */
  removeNode(id) {
    // Remove all routes to this node
    for (const [nodeId, routes] of this.routes) {
      routes.delete(id);
    }
    this.routes.delete(id);
    return this.nodes.delete(id);
  }

  /**
   * Update node heartbeat
   */
  heartbeat(id) {
    const node = this.nodes.get(id);
    if (node) {
      node.lastHeartbeat = Date.now();
      node.status = 'active';
    }
  }

  // ---- P2P MODEL ROUTING ----
  
  /**
   * Route a model inference request to the best available node
   */
  async routeInference(modelId, inputData, options = {}) {
    const startTime = performance.now();
    
    // Find nodes that have this model
    const candidates = [];
    for (const [id, node] of this.nodes) {
      if (node.models.has(modelId) && node.status === 'active') {
        candidates.push({
          id,
          load: node.load,
          layer: node.layer,
          score: this._computeRouteScore(node, options),
        });
      }
    }
    
    if (candidates.length === 0) {
      this.metrics.failedRoutes++;
      throw new Error(`No available nodes for model: ${modelId}`);
    }
    
    // Sort by score (highest first)
    candidates.sort((a, b) => b.score - a.score);
    const target = candidates[0];
    
    // Create routing message
    const message = this._createMessage({
      type: 'inference_request',
      source: 'local',
      target: target.id,
      modelId,
      inputData,
      options,
      ttl: options.ttl || 10,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
    
    this.metrics.messagesSent++;
    this.metrics.routingHops++;
    
    const elapsed = performance.now() - startTime;
    
    return {
      routed: true,
      target: target.id,
      score: target.score,
      candidates: candidates.length,
      routingTime: elapsed,
      messageId: message.id,
    };
  }

  /**
   * Broadcast a message to all nodes in a layer
   */
  broadcast(message, layer = null) {
    const targets = [];
    for (const [id, node] of this.nodes) {
      if (layer && node.layer !== layer) continue;
      if (node.status !== 'active') continue;
      
      const msg = this._createMessage({
        ...message,
        target: id,
        broadcast: true,
      });
      
      this.messageQueue.push(msg);
      targets.push(id);
      this.metrics.messagesSent++;
    }
    
    return { broadcast: true, targets, count: targets.length };
  }

  // ---- DISTRIBUTED INFERENCE ----
  
  /**
   * Execute distributed inference across multiple nodes
   */
  async distributedInference(modelId, inputData, options = {}) {
    const numShards = options.shards || 1;
    
    if (numShards === 1) {
      // Single node execution
      return this.routeInference(modelId, inputData, options);
    }
    
    // Split input into shards
    const shards = this._shardInput(inputData, numShards);
    
    // Route each shard to a different node
    const results = [];
    for (let i = 0; i < shards.length; i++) {
      try {
        const result = await this.routeInference(modelId, shards[i], {
          ...options,
          shardIndex: i,
          totalShards: numShards,
        });
        results.push(result);
      } catch (e) {
        results.push({ error: e.message, shard: i });
      }
    }
    
    // Aggregate results
    return {
      distributed: true,
      shards: results.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      results,
    };
  }

  // ---- CONSENSUS MECHANISM ----
  
  /**
   * Propose a decision to the network
   */
  propose(proposalId, proposal) {
    this.consensus.proposals.set(proposalId, {
      ...proposal,
      proposed: Date.now(),
      status: 'pending',
    });
    
    // Broadcast proposal
    this.broadcast({
      type: 'consensus_propose',
      proposalId,
      proposal,
    });
    
    return proposalId;
  }

  /**
   * Vote on a proposal
   */
  vote(proposalId, nodeId, vote) {
    if (!this.consensus.votes.has(proposalId)) {
      this.consensus.votes.set(proposalId, new Map());
    }
    
    this.consensus.votes.get(proposalId).set(nodeId, {
      vote, // true/false
      time: Date.now(),
    });
    
    // Check if consensus reached
    return this._checkConsensus(proposalId);
  }

  _checkConsensus(proposalId) {
    const votes = this.consensus.votes.get(proposalId);
    if (!votes) return { status: 'no_votes' };
    
    const total = votes.size;
    const yes = [...votes.values()].filter(v => v.vote === true).length;
    const ratio = yes / total;
    
    const result = {
      proposalId,
      total,
      yes,
      no: total - yes,
      ratio,
      reached: ratio >= this.consensus.threshold,
    };
    
    if (result.reached) {
      const proposal = this.consensus.proposals.get(proposalId);
      if (proposal) {
        proposal.status = 'accepted';
        proposal.consensusTime = Date.now();
      }
      this.metrics.consensusRounds++;
    }
    
    return result;
  }

  // ---- SECURE COMMUNICATION ----
  
  /**
   * Create a signed message
   */
  _createMessage(data) {
    const message = {
      ...data,
      timestamp: Date.now(),
      id: data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    // Sign the message (simplified — real impl would use HMAC)
    message.signature = this._signMessage(message);
    
    return message;
  }

  _signMessage(message) {
    const content = JSON.stringify({
      type: message.type,
      source: message.source,
      target: message.target,
      timestamp: message.timestamp,
      id: message.id,
    });
    
    // Simple hash-based signature
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Verify message integrity
   */
  verifyMessage(message) {
    const expected = this._signMessage(message);
    return message.signature === expected;
  }

  // ---- MODEL SHARDING ----
  
  _shardInput(inputData, numShards) {
    if (!Array.isArray(inputData) && !ArrayBuffer.isView(inputData)) {
      return [inputData]; // Can't shard non-array data
    }
    
    const data = Array.from(inputData);
    const shardSize = Math.ceil(data.length / numShards);
    const shards = [];
    
    for (let i = 0; i < numShards; i++) {
      const start = i * shardSize;
      const end = Math.min(start + shardSize, data.length);
      if (start < data.length) {
        shards.push(data.slice(start, end));
      }
    }
    
    return shards;
  }

  // ---- ROUTING SCORING ----
  
  _computeRouteScore(node, options) {
    let score = 100;
    
    // Prefer lower load
    score -= node.load * 0.5;
    
    // Prefer same layer
    if (options.preferredLayer && node.layer === options.preferredLayer) {
      score += 20;
    }
    
    // Prefer kernel layer for security
    if (node.layer === 'kernel') {
      score += 10;
    }
    
    // Penalize stale nodes
    const staleness = Date.now() - node.lastHeartbeat;
    if (staleness > 30000) {
      score -= 30;
    }
    
    return Math.max(0, score);
  }

  // ---- METRICS ----
  
  getFabricMetrics() {
    const activeNodes = [...this.nodes.values()].filter(n => n.status === 'active').length;
    const totalModels = new Set();
    for (const node of this.nodes.values()) {
      for (const m of node.models) totalModels.add(m);
    }
    
    return {
      nodes: this.nodes.size,
      activeNodes,
      routes: this.routes.size,
      queuedMessages: this.messageQueue.length,
      pendingProposals: this.consensus.proposals.size,
      totalModels: totalModels.size,
      metrics: { ...this.metrics },
    };
  }
}

// Export singleton
const intelligenceFabric = new IntelligenceFabric();
export default intelligenceFabric;
