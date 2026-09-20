/**
 * HAZOOM OS — Quantum Cryptography Layer
 * Wrapper around post-quantum crypto for OS-wide use:
 * - Key management & rotation
 * - Hybrid classical + PQC encryption
 * - Message signing & verification
 * - Secure channels (WebSocket, IPC, localStorage)
 */

class QuantumCrypto {
  constructor() {
    if (QuantumCrypto.instance) return QuantumCrypto.instance;
    QuantumCrypto.instance = this;

    this.version = '1.0.0';
    this.initialized = false;

    // Key stores
    this.kemKeys = new Map();      // ML-KEM keypairs
    this.dsaKeys = new Map();      // ML-DSA keypairs
    this.classicalKeys = new Map(); // X25519, Ed25519
    this.sharedSecrets = new Map(); // Derived shared secrets
    this.sessionKeys = new Map();  // Ephemeral session keys

    // Key metadata
    this.keyMetadata = new Map();  // keyId -> {created, expires, usage, algorithm}

    // Configuration
    this.config = {
      kemAlgorithm: 'ML-KEM-768',
      dsaAlgorithm: 'ML-DSA-65',
      classicalKem: 'X25519',
      classicalSig: 'Ed25519',
      keyRotationInterval: 24 * 60 * 60 * 1000, // 24 hours
      sessionTimeout: 60 * 60 * 1000, // 1 hour
      hybridMode: true
    };

    // PQC engine reference (will be set from postQuantumCrypto)
    this.pqcEngine = null;

    // Event callbacks
    this.onKeyRotation = null;
    this.onKeyCompromise = null;

    console.log('[QuantumCrypto] Initialized v' + this.version);
  }

  static getInstance() {
    if (!QuantumCrypto.instance) {
      QuantumCrypto.instance = new QuantumCrypto();
    }
    return QuantumCrypto.instance;
  }

  async init() {
    if (this.initialized) return;

    // Try to load post-quantum crypto engine
    if (typeof postQuantumCrypto !== 'undefined') {
      this.pqcEngine = postQuantumCrypto;
      console.log('[QuantumCrypto] Post-quantum engine loaded');
    } else if (typeof window !== 'undefined' && window.postQuantumCrypto) {
      this.pqcEngine = window.postQuantumCrypto;
    }

    // Generate initial identity keys (non-fatal if browser lacks modern KEM support)
    try {
      await this.generateIdentityKeys();
    } catch (e) {
      console.warn('[QuantumCrypto] Identity key generation unavailable:', e.message);
    }

    // Start key rotation timer
    this.startKeyRotation();

    this.initialized = true;
    console.log('[QuantumCrypto] Ready — hybrid mode:', this.config.hybridMode);
  }

  // ========== KEY GENERATION ==========
  async generateIdentityKeys() {
    // Classical identity key (long-term)
    const classicalKem = await crypto.subtle.generateKey(
      { name: 'X25519' }, false, ['deriveBits', 'deriveKey']
    );
    const classicalSig = await crypto.subtle.generateKey(
      { name: 'Ed25519' }, false, ['sign', 'verify']
    );

    this.classicalKeys.set('identity_kem', classicalKem);
    this.classicalKeys.set('identity_sig', classicalSig);

    // Post-quantum identity keys
    if (this.pqcEngine) {
      try {
        const kemIdentity = await this.pqcEngine.generateKEMKeyPair('identity_kem');
        const dsaIdentity = await this.pqcEngine.generateDSAKeyPair('identity_dsa');
        this.kemKeys.set('identity_kem', kemIdentity);
        this.dsaKeys.set('identity_dsa', dsaIdentity);
      } catch (e) {
        console.warn('[QuantumCrypto] PQC key gen failed:', e.message);
      }
    }

    // Export public keys for distribution
    this.identityPublicKeys = await this.exportPublicKeys();
    return this.identityPublicKeys;
  }

  async generateKEMKeyPair(keyId, options = {}) {
    const id = keyId || `kem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    let keypair;
    if (this.pqcEngine) {
      keypair = await this.pqcEngine.generateKEMKeyPair(id);
    } else {
      // Fallback: generate classical only
      const classical = await crypto.subtle.generateKey(
        { name: 'X25519' }, false, ['deriveBits', 'deriveKey']
      );
      keypair = {
        id,
        publicKey: await crypto.subtle.exportKey('raw', classical.publicKey),
        secretKey: await crypto.subtle.exportKey('raw', classical.privateKey),
        classical: true
      };
    }

    this.kemKeys.set(id, keypair);
    this.keyMetadata.set(id, {
      created: Date.now(),
      expires: Date.now() + this.config.keyRotationInterval,
      usage: options.usage || 'general',
      algorithm: this.config.kemAlgorithm
    });

    this.emit('key_generated', { keyId: id, type: 'kem' });
    return keypair;
  }

  async generateDSAKeyPair(keyId, options = {}) {
    const id = keyId || `dsa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    let keypair;
    if (this.pqcEngine) {
      keypair = await this.pqcEngine.generateDSAKeyPair(id);
    } else {
      const classical = await crypto.subtle.generateKey(
        { name: 'Ed25519' }, false, ['sign', 'verify']
      );
      keypair = {
        id,
        publicKey: await crypto.subtle.exportKey('raw', classical.publicKey),
        secretKey: await crypto.subtle.exportKey('raw', classical.privateKey),
        classical: true
      };
    }

    this.dsaKeys.set(id, keypair);
    this.keyMetadata.set(id, {
      created: Date.now(),
      expires: Date.now() + this.config.keyRotationInterval,
      usage: options.usage || 'signing',
      algorithm: this.config.dsaAlgorithm
    });

    this.emit('key_generated', { keyId: id, type: 'dsa' });
    return keypair;
  }

  // ========== HYBRID KEY EXCHANGE ==========
  async hybridKeyExchange(peerPublicKeys, keyId = null) {
    // peerPublicKeys: { kem: Uint8Array, classical: Uint8Array }
    const id = keyId || `session_${Date.now()}`;

    // 1. Classical X25519
    const classicalKem = await crypto.subtle.generateKey(
      { name: 'X25519' }, false, ['deriveBits']
    );
    const classicalShared = await crypto.subtle.deriveBits(
      { name: 'X25519', public: peerPublicKeys.classical },
      classicalKem.privateKey,
      256
    );

    // 2. Post-quantum ML-KEM
    let pqcShared = null;
    let kemCiphertext = null;
    if (this.pqcEngine && peerPublicKeys.kem) {
      const ourKem = await this.generateKEMKeyPair(`${id}_ephemeral`);
      const encapsulated = await this.pqcEngine.encapsulate(ourKem.id);
      kemCiphertext = encapsulated.ciphertext;
      pqcShared = encapsulated.sharedSecret;
    }

    // 3. Combine with HKDF
    const combined = new Uint8Array(classifiedShared.byteLength + (pqcShared?.byteLength || 0));
    combined.set(new Uint8Array(classicalShared), 0);
    if (pqcShared) combined.set(pqcShared, classicalShared.byteLength);

    const sessionKey = await this.hkdf(combined, 'session_key', 32);

    // Store session
    this.sessionKeys.set(id, {
      key: sessionKey,
      created: Date.now(),
      expires: Date.now() + this.config.sessionTimeout,
      peerKeys: peerPublicKeys,
      ourClassicalPublic: await crypto.subtle.exportKey('raw', classicalKem.publicKey),
      kemCiphertext
    });

    return {
      sessionId: id,
      ourClassicalPublic: await crypto.subtle.exportKey('raw', classicalKem.publicKey),
      kemCiphertext,
      sessionKey
    };
  }

  async deriveSessionKey(sessionId, peerKemCiphertext) {
    const session = this.sessionKeys.get(sessionId);
    if (!session) throw new Error('Session not found');

    let pqcShared = null;
    if (this.pqcEngine && peerKemCiphertext && session.kemKeypairId) {
      const decapsulated = await this.pqcEngine.decapsulate(session.kemKeypairId, peerKemCiphertext);
      pqcShared = decapsulated.sharedSecret;
    }

    const classicalShared = await crypto.subtle.deriveBits(
      { name: 'X25519', public: session.peerKeys.classical },
      session.ourClassicalPrivateKey,
      256
    );

    const combined = new Uint8Array(classicalShared.byteLength + (pqcShared?.byteLength || 0));
    combined.set(new Uint8Array(classicalShared), 0);
    if (pqcShared) combined.set(pqcShared, classicalShared.byteLength);

    return this.hkdf(combined, 'session_key', 32);
  }

  // ========== ENCRYPTION/DECRYPTION ==========
  async encrypt(message, sessionId, associatedData = null) {
    const session = this.sessionKeys.get(sessionId);
    if (!session) throw new Error('Session not found');
    if (Date.now() > session.expires) throw new Error('Session expired');

    const key = await crypto.subtle.importKey(
      'raw', session.key, { name: 'AES-GCM' }, false, ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(message);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: associatedData ? new TextEncoder().encode(associatedData) : undefined },
      key, encoded
    );

    return {
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(ciphertext)),
      sessionId
    };
  }

  async decrypt(encrypted, sessionId, associatedData = null) {
    const session = this.sessionKeys.get(sessionId);
    if (!session) throw new Error('Session not found');

    const key = await crypto.subtle.importKey(
      'raw', session.key, { name: 'AES-GCM' }, false, ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(encrypted.iv),
        additionalData: associatedData ? new TextEncoder().encode(associatedData) : undefined
      },
      key,
      new Uint8Array(encrypted.ciphertext)
    );

    return new TextDecoder().decode(decrypted);
  }

  // ========== SIGNING/VERIFICATION ==========
  async sign(message, keyId = 'identity_dsa') {
    const keypair = this.dsaKeys.get(keyId);
    if (!keypair) throw new Error('Signing key not found');

    if (this.pqcEngine && !keypair.classical) {
      return this.pqcEngine.sign(keyId, message);
    }

    // Classical Ed25519
    const key = await crypto.subtle.importKey(
      'raw', keypair.secretKey, { name: 'Ed25519' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign(
      { name: 'Ed25519' }, key, new TextEncoder().encode(message)
    );
    return { signature: new Uint8Array(signature), algorithm: 'Ed25519' };
  }

  async verify(message, signature, keyId = 'identity_dsa') {
    const keypair = this.dsaKeys.get(keyId);
    if (!keypair) throw new Error('Verification key not found');

    if (this.pqcEngine && !keypair.classical) {
      return this.pqcEngine.verify(keyId, message, signature);
    }

    const key = await crypto.subtle.importKey(
      'raw', keypair.publicKey, { name: 'Ed25519' }, false, ['verify']
    );
    const valid = await crypto.subtle.verify(
      { name: 'Ed25519' }, key, signature, new TextEncoder().encode(message)
    );
    return { valid, algorithm: 'Ed25519' };
  }

  // ========== SECURE CHANNELS ==========
  // WebSocket secure wrapper
  createSecureWebSocket(url, protocols = []) {
    const ws = new WebSocket(url, protocols);
    const sessionId = `ws_${Date.now()}`;

    ws.quantumEncrypt = async (message) => {
      return this.encrypt(JSON.stringify(message), sessionId);
    };

    ws.quantumDecrypt = async (encrypted) => {
      const decrypted = await this.decrypt(encrypted, sessionId);
      return JSON.parse(decrypted);
    };

    ws.quantumSign = async (message) => this.sign(message);
    ws.quantumVerify = async (msg, sig) => this.verify(msg, sig);

    return ws;
  }

  // IPC secure channel (for inter-window communication)
  createSecureChannel(targetWindow, channelName) {
    const port = new MessageChannel();
    const sessionId = `ipc_${channelName}_${Date.now()}`;

    // Generate ephemeral session
    this.generateKEMKeyPair(`${sessionId}_ephemeral`);

    const channel = {
      port: port.port1,
      sessionId,
      send: async (message) => {
        const encrypted = await this.encrypt(JSON.stringify(message), sessionId);
        port.port1.postMessage({ encrypted, sessionId });
      },
      onMessage: (handler) => {
        port.port1.onmessage = async (event) => {
          if (event.data.encrypted) {
            const decrypted = await this.decrypt(event.data.encrypted, sessionId);
            handler(JSON.parse(decrypted));
          }
        };
      }
    };

    // Send port to target
    targetWindow.postMessage({ type: 'quantum_channel_init', channelName, port: port.port2 }, '*');

    return channel;
  }

  // Secure localStorage
  async secureStore(key, value) {
    const sessionId = 'storage_master';
    let masterKey = this.sessionKeys.get(sessionId)?.key;

    if (!masterKey) {
      // Derive from identity
      const raw = await crypto.subtle.exportKey('raw', this.classicalKeys.get('identity_kem').privateKey);
      masterKey = await this.hkdf(raw, 'storage_master', 32);
      this.sessionKeys.set(sessionId, { key: masterKey, created: Date.now(), expires: 0 });
    }

    const encrypted = await this.encrypt(JSON.stringify(value), sessionId);
    localStorage.setItem(`quantum_${key}`, JSON.stringify(encrypted));
  }

  async secureRetrieve(key) {
    const stored = localStorage.getItem(`quantum_${key}`);
    if (!stored) return null;

    const sessionId = 'storage_master';
    const decrypted = await this.decrypt(JSON.parse(stored), sessionId);
    return JSON.parse(decrypted);
  }

  // ========== HKDF HELPER ==========
  async hkdf(inputKeyMaterial, info, length = 32) {
    const key = await crypto.subtle.importKey(
      'raw', inputKeyMaterial, { name: 'HKDF' }, false, ['deriveBits']
    );
    const derived = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(32), // Zero salt
        info: new TextEncoder().encode(info)
      },
      key, length * 8
    );
    return new Uint8Array(derived);
  }

  // ========== PUBLIC KEY EXPORT ==========
  async exportPublicKeys() {
    const keys = {};

    // Classical
    const classicalKem = this.classicalKeys.get('identity_kem');
    if (classicalKem) {
      keys.classical_kem = await crypto.subtle.exportKey('raw', classicalKem.publicKey);
    }
    const classicalSig = this.classicalKeys.get('identity_sig');
    if (classicalSig) {
      keys.classical_sig = await crypto.subtle.exportKey('raw', classicalSig.publicKey);
    }

    // Post-quantum
    if (this.pqcEngine) {
      const kemIdentity = this.kemKeys.get('identity_kem');
      if (kemIdentity) keys.pqc_kem = kemIdentity.publicKey;

      const dsaIdentity = this.dsaKeys.get('identity_dsa');
      if (dsaIdentity) keys.pqc_dsa = dsaIdentity.publicKey;
    }

    return keys;
  }

  // Import peer's public keys
  importPeerKeys(peerId, keys) {
    this.peerKeys = this.peerKeys || new Map();
    this.peerKeys.set(peerId, keys);
    this.emit('peer_keys_imported', { peerId });
  }

  // ========== KEY ROTATION ==========
  startKeyRotation() {
    setInterval(() => this.rotateKeys(), this.config.keyRotationInterval);
  }

  async rotateKeys() {
    console.log('[QuantumCrypto] Rotating keys...');

    // Generate new identity keys
    const oldIdentity = this.identityPublicKeys;
    await this.generateIdentityKeys();

    // Rotate session keys
    for (const [id, session] of this.sessionKeys) {
      if (Date.now() > session.expires) {
        this.sessionKeys.delete(id);
      }
    }

    // Rotate ephemeral keys
    for (const [id, keypair] of this.kemKeys) {
      const meta = this.keyMetadata.get(id);
      if (meta && Date.now() > meta.expires && !id.startsWith('identity')) {
        this.kemKeys.delete(id);
        this.keyMetadata.delete(id);
      }
    }
    for (const [id, keypair] of this.dsaKeys) {
      const meta = this.keyMetadata.get(id);
      if (meta && Date.now() > meta.expires && !id.startsWith('identity')) {
        this.dsaKeys.delete(id);
        this.keyMetadata.delete(id);
      }
    }

    this.emit('keys_rotated', { oldIdentity, newIdentity: this.identityPublicKeys });
    if (this.onKeyRotation) this.onKeyRotation(this.identityPublicKeys);
  }

  // Emergency key revocation
  revokeKey(keyId, reason = 'compromise') {
    this.kemKeys.delete(keyId);
    this.dsaKeys.delete(keyId);
    this.keyMetadata.delete(keyId);

    // Also revoke any sessions using this key
    for (const [id, session] of this.sessionKeys) {
      if (session.kemKeypairId === keyId) {
        this.sessionKeys.delete(id);
      }
    }

    this.emit('key_revoked', { keyId, reason });
    if (this.onKeyCompromise) this.onKeyCompromise(keyId, reason);
  }

  // ========== METRICS ==========
  getMetrics() {
    return {
      kemKeys: this.kemKeys.size,
      dsaKeys: this.dsaKeys.size,
      classicalKeys: this.classicalKeys.size,
      activeSessions: this.sessionKeys.size,
      sharedSecrets: this.sharedSecrets.size,
      config: this.config,
      pqcAvailable: !!this.pqcEngine
    };
  }

  // ========== EVENTS ==========
  on(event, callback) {
    if (!this.listeners) this.listeners = new Map();
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    this.listeners?.get(event)?.delete(callback);
  }

  emit(event, data) {
    this.listeners?.get(event)?.forEach(cb => {
      try { cb(data); } catch (e) { console.error('[QuantumCrypto] Event error:', e); }
    });
  }

  // ========== CLEANUP ==========
  destroy() {
    this.kemKeys.clear();
    this.dsaKeys.clear();
    this.classicalKeys.clear();
    this.sessionKeys.clear();
    this.sharedSecrets.clear();
    this.keyMetadata.clear();
    this.peerKeys?.clear();
    this.listeners?.clear();
    QuantumCrypto.instance = null;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuantumCrypto;
} else if (typeof window !== 'undefined') {
  window.QuantumCrypto = QuantumCrypto;
  window.HAZOOM_QUANTUM_CRYPTO = QuantumCrypto.getInstance();
}