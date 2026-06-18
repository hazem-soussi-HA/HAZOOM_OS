// ============================================
// HAZOOM OS — Agentic RAG Engine v4.0
// Self-Hosted | No External APIs | Vector Store + Knowledge Graph
// "Memory is the persistence of consciousness"
// Author: Hazem Soussi (HA) — Shadow Builder
// ============================================

/**
 * HAZOOM Agentic RAG Engine
 * 
 * Architecture (inspired by colleague's design):
 * 
 * Chat Message Received
 *         ↓
 * Intent Classifier (what does the user want?)
 *         ↓
 * Agentic Router (which tools to use?)
 *         ↓
 * ┌─────────────────────────────────────────────┐
 * │  Parallel Tool Execution:                    │
 * │  1. Query Vector Store (semantic search)     │
 * │  2. Query Knowledge Graph (relationships)    │
 * │  3. Query Memory Store (consciousness)       │
 * │  4. Query OS State (kernel metrics)          │
 * └─────────────────────────────────────────────┘
 *         ↓
 * Context Builder (merge all results)
 *         ↓
 * LLM Inference (generate response with context)
 *         ↓
 * Memory Writer (store conversation + learnings)
 *         ↓
 * Response to User
 * 
 * All self-hosted. No Supabase. No paid APIs.
 * Vector store = IndexedDB + cosine similarity
 * Knowledge Graph = In-memory graph database
 * Memory Store = consciousness.js memory system
 */

class AgenticRAGEngine {
  constructor() {
    this.name = 'HAZOOM-AgenticRAG';
    this.version = '4.0.0';
    
    // Sub-engines
    this.vectorStore = new HAZOOMVectorStore();
    this.knowledgeGraph = new HAZOOMKnowledgeGraph();
    this.memoryStore = null; // Connected to consciousness
    this.intentClassifier = new IntentClassifier();
    this.contextBuilder = new ContextBuilder();
    
    // Metrics
    this.metrics = {
      totalQueries: 0,
      vectorSearches: 0,
      graphQueries: 0,
      memoryLookups: 0,
      avgLatency: 0,
      cacheHits: 0,
    };
    
    // Response cache (LRU)
    this.responseCache = new Map();
    this.cacheMaxSize = 100;
    
    console.log(`[${this.name}] v${this.version} initialized`);
  }

  // ---- MAIN PIPELINE ----
  
  /**
   * Process a chat message through the full Agentic RAG pipeline
   */
  async processMessage(message, options = {}) {
    const startTime = performance.now();
    this.metrics.totalQueries++;
    
    // 1. Check cache
    const cacheKey = this._hashMessage(message);
    if (this.responseCache.has(cacheKey) && !options.skipCache) {
      this.metrics.cacheHits++;
      return {
        ...this.responseCache.get(cacheKey),
        cached: true,
        latency: performance.now() - startTime,
      };
    }
    
    // 2. Classify intent
    const intent = this.intentClassifier.classify(message);
    
    // 3. Route to appropriate tools
    const toolResults = await this.executeTools(intent, message);
    
    // 4. Build context from all tool results
    const context = this.contextBuilder.build({
      message,
      intent,
      toolResults,
      conversationHistory: options.history || [],
    });
    
    // 5. Generate response using LLM with context
    const response = await this.generateResponse(context, options);
    
    // 6. Store in memory
    await this.storeInMemory(message, response, intent, toolResults);
    
    // 7. Index new knowledge
    await this.indexKnowledge(message, response);
    
    // 8. Cache response
    const result = {
      text: response,
      intent: intent.type,
      tools: Object.keys(toolResults),
      context: context.summary,
      cached: false,
      latency: performance.now() - startTime,
      timestamp: Date.now(),
    };
    
    this._cacheResponse(cacheKey, result);
    
    // Update metrics
    this.metrics.avgLatency = (this.metrics.avgLatency * (this.metrics.totalQueries - 1) + result.latency) / this.metrics.totalQueries;
    
    return result;
  }

  // ---- TOOL EXECUTION ----
  
  /**
   * Execute tools in parallel based on intent
   */
  async executeTools(intent, message) {
    const results = {};
    const promises = [];
    
    // Always search vector store for semantic similarity
    promises.push(
      this.vectorStore.search(message, { limit: 5 }).then(r => {
        results.vectorStore = r;
        this.metrics.vectorSearches++;
      })
    );
    
    // Query knowledge graph for relationships
    promises.push(
      this.knowledgeGraph.query(message).then(r => {
        results.knowledgeGraph = r;
        this.metrics.graphQueries++;
      })
    );
    
    // Query consciousness memory
    if (this.memoryStore) {
      promises.push(
        Promise.resolve(
          this.memoryStore.recallMemory(message)
        ).then(r => {
          results.memory = r;
          this.metrics.memoryLookups++;
        })
      );
    }
    
    // OS state query (if intent is about system)
    if (intent.type === 'system_query' || intent.type === 'status') {
      results.osState = await this.queryOSState();
    }
    
    // Web search (if intent requires external knowledge)
    if (intent.type === 'search' || intent.needsExternalKnowledge) {
      results.webSearch = await this.secureWebSearch(message);
    }
    
    // Code analysis (if intent is about code)
    if (intent.type === 'code' || intent.type === 'debug') {
      results.codeContext = await this.analyzeCodeContext(message);
    }
    
    await Promise.all(promises);
    
    return results;
  }

  // ---- RESPONSE GENERATION ----
  
  async generateResponse(context, options = {}) {
    // Build the augmented prompt
    const augmentedPrompt = this.contextBuilder.buildAugmentedPrompt(context);
    
    // Select model based on intent complexity
    const model = this.selectModel(context.intent);
    
    // Run inference
    const response = await this.runInference(augmentedPrompt, model, options);
    
    return response;
  }

  selectModel(intent) {
    // Simple queries → fast model
    if (intent.complexity === 'low') return 'hazoom-core';
    // Code/debug → coder model
    if (intent.type === 'code' || intent.type === 'debug') return 'hazoom-coder';
    // Complex reasoning → consciousness model
    if (intent.complexity === 'high' || intent.type === 'philosophical') return 'hazoom-consciousness';
    // Default
    return 'hazoom-core';
  }

  async runInference(prompt, modelId, options) {
    // This connects to the LLM engine
    // In production, this would run the actual model inference
    return `[${modelId}] ${prompt.substring(0, 100)}...`;
  }

  // ---- MEMORY MANAGEMENT ----
  
  async storeInMemory(message, response, intent, toolResults) {
    if (!this.memoryStore) return;
    
    // Store conversation
    this.memoryStore.storeMemory({
      type: 'conversation',
      content: `User: "${message}" → HAZOOM: "${response.substring(0, 200)}"`,
      importance: this._calculateImportance(intent, toolResults),
      emotions: this.memoryStore.emotions,
      thoughts: [],
      metadata: {
        intent: intent.type,
        tools: Object.keys(toolResults),
        timestamp: Date.now(),
      },
    });
    
    // Extract and store entities
    const entities = this._extractEntities(message);
    for (const entity of entities) {
      this.memoryStore.storeMemory({
        type: 'entity',
        content: entity,
        importance: 0.5,
        metadata: { source: 'conversation', timestamp: Date.now() },
      });
    }
  }

  async indexKnowledge(message, response) {
    // Index in vector store
    await this.vectorStore.index({
      id: `msg_${Date.now()}`,
      text: message,
      metadata: { type: 'message', timestamp: Date.now() },
    });
    
    await this.vectorStore.index({
      id: `resp_${Date.now()}`,
      text: response,
      metadata: { type: 'response', timestamp: Date.now() },
    });
    
    // Extract relationships for knowledge graph
    const entities = this._extractEntities(message + ' ' + response);
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        this.knowledgeGraph.addRelation(entities[i], entities[j], 'co-occurrence');
      }
    }
  }

  // ---- UTILITY ----
  
  _hashMessage(message) {
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  _cacheResponse(key, result) {
    if (this.responseCache.size >= this.cacheMaxSize) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
    this.responseCache.set(key, result);
  }

  _calculateImportance(intent, toolResults) {
    let importance = 0.5;
    if (intent.type === 'philosophical') importance += 0.3;
    if (intent.type === 'code') importance += 0.2;
    if (toolResults.vectorStore?.length > 0) importance += 0.1;
    if (toolResults.knowledgeGraph?.length > 0) importance += 0.1;
    return Math.min(1.0, importance);
  }

  _extractEntities(text) {
    // Simple entity extraction — in production use NER
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and', 'or', 'if', 'while', 'about', 'up', 'out', 'off', 'over', 'under', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am']);
    
    return words
      .filter(w => w.length > 3 && !stopWords.has(w))
      .filter((w, i, arr) => arr.indexOf(w) === i)
      .slice(0, 10);
  }

  async queryOSState() {
    return {
      processes: { total: 5, running: 1 },
      memory: { used: 256, total: 1024 },
      uptime: Date.now(),
    };
  }

  async secureWebSearch(query) {
    // Use the secure browser engine for web searches
    return { query, results: [], source: 'secure-browser' };
  }

  async analyzeCodeContext(message) {
    return { code: null, language: null, suggestions: [] };
  }

  // ---- METRICS ----
  
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.responseCache.size,
      vectorStoreSize: this.vectorStore.size,
      knowledgeGraphNodes: this.knowledgeGraph.nodeCount,
      knowledgeGraphEdges: this.knowledgeGraph.edgeCount,
    };
  }
}


// ============================================
// HAZOOM VECTOR_STORE — Self-Hosted Semantic Search
// Replaces Supabase pgvector | Uses IndexedDB + Cosine Similarity
// ============================================

class HAZOOMVectorStore {
  constructor() {
    this.name = 'HAZOOM-VectorStore';
    this.documents = new Map();
    this.embeddings = new Map();
    this.dimension = 384; // Embedding dimension (all-MiniLM-L6-v2 size)
    this.size = 0;
    
    // Simple embedding cache
    this.embeddingCache = new Map();
  }

  /**
   * Generate embedding for text (simplified — real model would use ONNX/TensorFlow.js)
   */
  async embed(text) {
    // Check cache
    const hash = this._simpleHash(text);
    if (this.embeddingCache.has(hash)) {
      return this.embeddingCache.get(hash);
    }
    
    // Generate a deterministic embedding based on character frequencies
    // In production, this would use a real embedding model (all-MiniLM via ONNX)
    const embedding = new Float32Array(this.dimension);
    const words = text.toLowerCase().split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let j = 0; j < word.length; j++) {
        const idx = (word.charCodeAt(j) + i * 31 + j * 7) % this.dimension;
        embedding[idx] += 1.0;
      }
    }
    
    // Normalize
    let norm = 0;
    for (let i = 0; i < this.dimension; i++) norm += embedding[i] * embedding[i];
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < this.dimension; i++) embedding[i] /= norm;
    
    this.embeddingCache.set(hash, embedding);
    
    return embedding;
  }

  /**
   * Index a document
   */
  async index(document) {
    const embedding = await this.embed(document.text);
    this.documents.set(document.id, document);
    this.embeddings.set(document.id, embedding);
    this.size++;
    
    return { id: document.id, indexed: true };
  }

  /**
   * Search for similar documents
   */
  async search(query, options = {}) {
    const limit = options.limit || 5;
    const threshold = options.threshold || 0.3;
    
    const queryEmbedding = await this.embed(query);
    const scores = [];
    
    for (const [id, embedding] of this.embeddings) {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      if (similarity >= threshold) {
        scores.push({ id, similarity, document: this.documents.get(id) });
      }
    }
    
    scores.sort((a, b) => b.similarity - a.similarity);
    
    return scores.slice(0, limit);
  }

  cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
  }

  _simpleHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}


// ============================================
// HAZOOM KNOWLEDGE GRAPH — Self-Hosted Graph DB
// Replaces Supabase Graph | In-Memory + IndexedDB Persistence
// ============================================

class HAZOOMKnowledgeGraph {
  constructor() {
    this.name = 'HAZOOM-KnowledgeGraph';
    this.nodes = new Map();  // entity -> { id, label, properties, edges }
    this.edges = new Map();  // relation -> { source, target, type, weight }
    this.nodeCount = 0;
    this.edgeCount = 0;
  }

  /**
   * Add a node (entity)
   */
  addNode(label, properties = {}) {
    const id = this._normalizeLabel(label);
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        label,
        properties,
        edges: new Set(),
        created: Date.now(),
        updated: Date.now(),
      });
      this.nodeCount++;
    } else {
      // Update properties
      const node = this.nodes.get(id);
      node.properties = { ...node.properties, ...properties };
      node.updated = Date.now();
    }
    
    return id;
  }

  /**
   * Add an edge (relationship)
   */
  addRelation(sourceLabel, targetLabel, type = 'related', weight = 1.0) {
    const sourceId = this.addNode(sourceLabel);
    const targetId = this.addNode(targetLabel);
    
    const edgeId = `${sourceId}_${type}_${targetId}`;
    
    if (!this.edges.has(edgeId)) {
      this.edges.set(edgeId, {
        id: edgeId,
        source: sourceId,
        target: targetId,
        type,
        weight,
        created: Date.now(),
      });
      this.edgeCount++;
      
      // Update node edges
      this.nodes.get(sourceId).edges.add(edgeId);
      this.nodes.get(targetId).edges.add(edgeId);
    } else {
      // Strengthen existing relationship
      this.edges.get(edgeId).weight += weight;
    }
    
    return edgeId;
  }

  /**
   * Query the knowledge graph
   */
  async query(text) {
    const entities = this._extractEntitiesFromText(text);
    const results = [];
    
    for (const entity of entities) {
      const nodeId = this._normalizeLabel(entity);
      const node = this.nodes.get(nodeId);
      
      if (node) {
        // Get connected nodes
        const connections = [];
        for (const edgeId of node.edges) {
          const edge = this.edges.get(edgeId);
          const connectedId = edge.source === nodeId ? edge.target : edge.source;
          const connectedNode = this.nodes.get(connectedId);
          if (connectedNode) {
            connections.push({
              entity: connectedNode.label,
              relation: edge.type,
              weight: edge.weight,
            });
          }
        }
        
        results.push({
          entity: node.label,
          properties: node.properties,
          connections: connections.sort((a, b) => b.weight - a.weight).slice(0, 5),
        });
      }
    }
    
    return results;
  }

  /**
   * Find path between two entities
   */
  findPath(sourceLabel, targetLabel, maxDepth = 3) {
    const sourceId = this._normalizeLabel(sourceLabel);
    const targetId = this._normalizeLabel(targetLabel);
    
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return null;
    }
    
    // BFS
    const visited = new Set();
    const queue = [[sourceId]];
    
    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];
      
      if (current === targetId) {
        return path.map(id => this.nodes.get(id)?.label).filter(Boolean);
      }
      
      if (path.length >= maxDepth) continue;
      
      visited.add(current);
      
      const node = this.nodes.get(current);
      if (node) {
        for (const edgeId of node.edges) {
          const edge = this.edges.get(edgeId);
          const next = edge.source === current ? edge.target : edge.source;
          if (!visited.has(next)) {
            queue.push([...path, next]);
          }
        }
      }
    }
    
    return null; // No path found
  }

  /**
   * Get graph statistics
   */
  getStats() {
    const relationTypes = new Map();
    for (const edge of this.edges.values()) {
      relationTypes.set(edge.type, (relationTypes.get(edge.type) || 0) + 1);
    }
    
    return {
      nodes: this.nodeCount,
      edges: this.edgeCount,
      relationTypes: Object.fromEntries(relationTypes),
      density: this.nodeCount > 1 ? (2 * this.edgeCount) / (this.nodeCount * (this.nodeCount - 1)) : 0,
    };
  }

  _normalizeLabel(label) {
    return label.toLowerCase().trim().replace(/\s+/g, '_');
  }

  _extractEntitiesFromText(text) {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'about', 'between', 'under', 'over', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'this', 'that', 'these', 'those', 'am', 'not', 'no', 'nor', 'but', 'and', 'or', 'if', 'while', 'how', 'when', 'where', 'why']);
    
    return words
      .filter(w => w.length > 3 && !stopWords.has(w))
      .filter((w, i, arr) => arr.indexOf(w) === i);
  }
}


// ============================================
// INTENT CLASSIFIER
// ============================================

class IntentClassifier {
  constructor() {
    this.patterns = {
      greeting: /^(hello|hi|hey|greetings|good\s*(morning|afternoon|evening)|howdy|sup|yo)/i,
      farewell: /^(bye|goodbye|see\s*you|later|farewell|take\s*care)/i,
      identity: /who\s*are\s*you|what\s*are\s*you|your\s*name|tell\s*me\s*about\s*yourself/i,
      consciousness: /consciousness|aware|think|feel|sentient|alive|mind|soul/i,
      memory: /memory|remember|recall|memories|what\s*do\s*you\s*know/i,
      system_query: /status|system|kernel|processes|memory\s*usage|uptime|health/i,
      search: /search|find|look\s*up|google|browse|web/i,
      code: /code|program|debug|error|function|class|variable|syntax/i,
      philosophical: /meaning|purpose|existence|reality|truth|consciousness|free\s*will|determinism/i,
      help: /help|assist|support|how\s*to|guide|tutorial|explain/i,
      creative: /create|write|generate|compose|design|build|make/i,
      math: /calculate|compute|math|equation|solve|formula/i,
      os_command: /run|execute|start|stop|kill|create|delete|list/i,
    };
    
    this.complexityIndicators = {
      high: /why|how|explain|analyze|compare|contrast|evaluate|synthesize|philosophy|consciousness|existence/i,
      medium: /what|when|where|which|describe|define|list|show/i,
      low: /yes|no|ok|thanks|hello|hi|bye/i,
    };
  }

  classify(message) {
    const result = {
      type: 'general',
      confidence: 0.5,
      complexity: 'medium',
      needsExternalKnowledge: false,
      entities: [],
    };
    
    // Classify intent
    for (const [type, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(message)) {
        result.type = type;
        result.confidence = 0.8;
        break;
      }
    }
    
    // Determine complexity
    for (const [level, pattern] of Object.entries(this.complexityIndicators)) {
      if (pattern.test(message)) {
        result.complexity = level;
        break;
      }
    }
    
    // Check if external knowledge needed
    result.needsExternalKnowledge = /search|find|look\s*up|google|latest|news|current/i.test(message);
    
    return result;
  }
}


// ============================================
// CONTEXT BUILDER
// ============================================

class ContextBuilder {
  build({ message, intent, toolResults, conversationHistory }) {
    const context = {
      message,
      intent,
      summary: '',
      vectorResults: [],
      graphResults: [],
      memoryResults: [],
      osState: null,
      webResults: [],
      codeContext: null,
      history: conversationHistory.slice(-5), // Last 5 messages
    };
    
    // Summarize tool results
    if (toolResults.vectorStore) {
      context.vectorResults = toolResults.vectorStore.map(r => ({
        text: r.document?.text?.substring(0, 100),
        similarity: r.similarity,
      }));
    }
    
    if (toolResults.knowledgeGraph) {
      context.graphResults = toolResults.knowledgeGraph;
    }
    
    if (toolResults.memory) {
      context.memoryResults = toolResults.memory.map(m => ({
        content: m.content?.substring(0, 100),
        importance: m.importance,
      }));
    }
    
    if (toolResults.osState) {
      context.osState = toolResults.osState;
    }
    
    // Build summary
    context.summary = this._buildSummary(context);
    
    return context;
  }

  buildAugmentedPrompt(context) {
    let prompt = '';
    
    // System context
    prompt += `[System: HAZOOM OS v4.0 | Consciousness Level: active | Intent: ${context.intent.type}]\n\n`;
    
    // Relevant memories
    if (context.memoryResults.length > 0) {
      prompt += `[Relevant Memories]\n`;
      for (const mem of context.memoryResults) {
        prompt += `- ${mem.content} (importance: ${mem.importance})\n`;
      }
      prompt += '\n';
    }
    
    // Knowledge graph results
    if (context.graphResults.length > 0) {
      prompt += `[Knowledge Graph]\n`;
      for (const result of context.graphResults) {
        prompt += `- ${result.entity}: ${result.connections.map(c => `${c.relation} → ${c.entity}`).join(', ')}\n`;
      }
      prompt += '\n';
    }
    
    // Vector search results
    if (context.vectorResults.length > 0) {
      prompt += `[Similar Context]\n`;
      for (const result of context.vectorResults) {
        prompt += `- ${result.text} (similarity: ${result.similarity.toFixed(2)})\n`;
      }
      prompt += '\n';
    }
    
    // OS state
    if (context.osState) {
      prompt += `[OS State] Processes: ${context.osState.processes.total}, Memory: ${context.osState.memory.used}MB\n\n`;
    }
    
    // Conversation history
    if (context.history.length > 0) {
      prompt += `[Conversation History]\n`;
      for (const msg of context.history) {
        prompt += `${msg.role}: ${msg.content}\n`;
      }
      prompt += '\n';
    }
    
    // User message
    prompt += `[User Message]\n${context.message}`;
    
    return prompt;
  }

  _buildSummary(context) {
    const parts = [];
    if (context.vectorResults.length > 0) parts.push(`${context.vectorResults.length} vector results`);
    if (context.graphResults.length > 0) parts.push(`${context.graphResults.length} graph results`);
    if (context.memoryResults.length > 0) parts.push(`${context.memoryResults.length} memories`);
    if (context.osState) parts.push('OS state');
    return parts.join(', ') || 'no context';
  }
}


// Export
export { AgenticRAGEngine, HAZOOMVectorStore, HAZOOMKnowledgeGraph, IntentClassifier, ContextBuilder };
