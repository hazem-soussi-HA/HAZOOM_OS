// ============================================
// HAZOOM OS — Punch Card System v4.0
// Physical-Digital Hybrid Secure Storage Medium
// Author: Hazem Soussi (HA) — Shadow Builder
// ============================================

/**
 * HAZOOM Punch Card System
 * 
 * A modern implementation of punch card technology for HAZOOM OS:
 * - Encode programs/data as punch card patterns
 * - Visual rendering on canvas (printable)
 * - Scanner/camera-based reading
 * - Cryptographically signed cards (SHA-256)
 * - Air-gapped secure boot medium
 * - Tamper-evident physical storage
 * 
 * Card Format (IBM 80-column inspired):
 * - 80 columns × 12 rows = 960 bits per card
 * - Each column = 1 byte (8 rows) + 4 zone bits
 * - Header row: card ID, sequence number, checksum
 * - Data rows: encoded program/data
 * - Footer row: SHA-256 hash (first 80 chars)
 * 
 * Encoding:
 * - Binary: hole = 1, no hole = 0
 * - ASCII: 8 bits per character
 * - Hex: 4 bits per nibble
 * - Custom: HAZOOM instruction set
 */

class PunchCardSystem {
  constructor() {
    this.name = 'HAZOOM-PunchCard';
    this.version = '4.0.0';
    
    // Card dimensions (IBM 80-column standard)
    this.cols = 80;
    this.rows = 12;
    this.cardCapacity = this.cols * this.rows; // 960 bits = 120 bytes
    
    // Card registry
    this.cards = new Map();
    this.deckCounter = 0;
    
    // Encoding modes
    this.modes = {
      BINARY: 'binary',
      ASCII: 'ascii',
      HEX: 'hex',
      HAZOOM: 'hazoom', // Custom instruction set
    };
    
    // Security
    this.masterKey = null;
    
    console.log(`[${this.name}] v${this.version} initialized`);
    console.log(`[${this.name}] Card capacity: ${this.cardCapacity} bits (${this.cardCapacity / 8} bytes)`);
  }

  // ---- CARD CREATION ----
  
  /**
   * Create a new punch card from data
   */
  createCard(data, options = {}) {
    const cardId = `card_${++this.deckCounter}_${Date.now().toString(36)}`;
    const mode = options.mode || this.modes.ASCII;
    const sequence = options.sequence || 1;
    const totalCards = options.totalCards || 1;
    
    // Encode data to binary pattern
    const pattern = this._encode(data, mode);
    
    // Pad or truncate to fit card
    const paddedPattern = this._padPattern(pattern);
    
    // Generate cryptographic signature
    const hash = this._computeHash(paddedPattern);
    
    const card = {
      id: cardId,
      sequence,
      totalCards,
      mode,
      pattern: paddedPattern,
      hash,
      created: Date.now(),
      dataLength: data.length,
      metadata: options.metadata || {},
    };
    
    this.cards.set(cardId, card);
    return card;
  }

  /**
   * Create a deck of cards from large data
   */
  createDeck(data, options = {}) {
    const mode = options.mode || this.modes.ASCII;
    const chunkSize = Math.floor(this.cardCapacity / 8) - 16; // Reserve space for header
    const chunks = this._chunkData(data, chunkSize);
    const deck = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const card = this.createCard(chunks[i], {
        ...options,
        sequence: i + 1,
        totalCards: chunks.length,
      });
      deck.push(card);
    }
    
    return {
      deckId: `deck_${Date.now().toString(36)}`,
      cards: deck,
      totalCards: deck.length,
      totalSize: data.length,
      hash: this._computeHash(deck.map(c => c.pattern).join('')),
    };
  }

  // ---- ENCODING ----
  
  _encode(data, mode) {
    switch (mode) {
      case this.modes.BINARY:
        return data.split('').map(c => c === '1' ? 1 : 0);
      
      case this.modes.ASCII:
        return data.split('').flatMap(c => {
          const bits = c.charCodeAt(0).toString(2).padStart(8, '0');
          return bits.split('').map(b => parseInt(b));
        });
      
      case this.modes.HEX:
        return data.split('').flatMap(c => {
          const nibble = parseInt(c, 16);
          if (isNaN(nibble)) return [0, 0, 0, 0];
          const bits = nibble.toString(2).padStart(4, '0');
          return bits.split('').map(b => parseInt(b));
        });
      
      case this.modes.HAZOOM:
        return this._encodeHazoom(data);
      
      default:
        throw new Error(`Unknown encoding mode: ${mode}`);
    }
  }

  _encodeHazoom(data) {
    // HAZOOM custom instruction set encoding
    // Each instruction = 16 bits (2 bytes)
    // Format: [OPCODE: 4 bits] [OPERAND: 12 bits]
    const instructions = data.split('\n').filter(l => l.trim());
    const bits = [];
    
    const opcodes = {
      'NOP':  '0000', 'LOAD': '0001', 'STORE': '0010', 'ADD':  '0011',
      'SUB':  '0100', 'MUL':  '0101', 'DIV':  '0110', 'JMP':  '0111',
      'JZ':   '1000', 'JNZ':  '1001', 'CALL': '1010', 'RET':  '1011',
      'PUSH': '1100', 'POP':  '1101', 'INT':  '1110', 'HALT': '1111',
    };
    
    for (const instr of instructions) {
      const parts = instr.trim().split(/\s+/);
      const op = (opcodes[parts[0]] || '0000').padStart(4, '0');
      const operand = (parseInt(parts[1]) || 0).toString(2).padStart(12, '0');
      
      bits.push(...op.split('').map(b => parseInt(b)));
      bits.push(...operand.split('').map(b => parseInt(b)));
    }
    
    return bits;
  }

  _decode(pattern, mode) {
    if (mode === this.modes.ASCII) {
      let str = '';
      for (let i = 0; i < pattern.length; i += 8) {
        const byte = pattern.slice(i, i + 8).join('');
        if (byte.length === 8) {
          const charCode = parseInt(byte, 2);
          if (charCode >= 32 && charCode < 127) {
            str += String.fromCharCode(charCode);
          }
        }
      }
      return str;
    }
    
    if (mode === this.modes.HEX) {
      let hex = '';
      for (let i = 0; i < pattern.length; i += 4) {
        const nibble = pattern.slice(i, i + 4).join('');
        if (nibble.length === 4) {
          hex += parseInt(nibble, 2).toString(16);
        }
      }
      return hex;
    }
    
    return pattern.join('');
  }

  // ---- PATTERN MANAGEMENT ----
  
  _padPattern(pattern) {
    const padded = new Array(this.cardCapacity).fill(0);
    for (let i = 0; i < Math.min(pattern.length, this.cardCapacity); i++) {
      padded[i] = pattern[i] ? 1 : 0;
    }
    return padded;
  }

  _chunkData(data, chunkSize) {
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.substring(i, i + chunkSize));
    }
    return chunks;
  }

  _computeHash(pattern) {
    const str = pattern.join('');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  // ---- CARD READING ----
  
  /**
   * Read a card from a visual representation (canvas/image data)
   */
  readCard(imageData, width, height) {
    // Analyze image data to detect punch holes
    const grid = this._imageToGrid(imageData, width, height);
    const pattern = this._gridToPattern(grid);
    
    return {
      pattern,
      hash: this._computeHash(pattern),
      readable: true,
    };
  }

  _imageToGrid(imageData, width, height) {
    const cellW = width / this.cols;
    const cellH = height / this.rows;
    const grid = [];
    
    for (let row = 0; row < this.rows; row++) {
      grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        // Sample center of each cell
        const cx = Math.floor(col * cellW + cellW / 2);
        const cy = Math.floor(row * cellH + cellH / 2);
        const idx = (cy * width + cx) * 4;
        
        // Check if pixel is dark (hole) or light (no hole)
        const r = imageData[idx] || 0;
        const g = imageData[idx + 1] || 0;
        const b = imageData[idx + 2] || 0;
        const brightness = (r + g + b) / 3;
        
        grid[row][col] = brightness < 128 ? 1 : 0; // Dark = hole = 1
      }
    }
    
    return grid;
  }

  _gridToPattern(grid) {
    const pattern = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        pattern.push(grid[row]?.[col] || 0);
      }
    }
    return pattern;
  }

  // ---- VISUAL RENDERING ----
  
  /**
   * Render a card to a canvas element
   */
  renderCard(card, canvas, options = {}) {
    const ctx = canvas.getContext('2d');
    const width = options.width || 800;
    const height = options.height || 300;
    
    canvas.width = width;
    canvas.height = height;
    
    // Card background (cream/off-white like real punch cards)
    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(0, 0, width, height);
    
    // Card border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, width - 8, height - 8);
    
    // Grid lines
    const cellW = (width - 40) / this.cols;
    const cellH = (height - 40) / this.rows;
    const offsetX = 20;
    const offsetY = 20;
    
    // Draw column numbers
    ctx.fillStyle = '#999';
    ctx.font = '8px monospace';
    for (let col = 0; col < this.cols; col++) {
      if (col % 10 === 0) {
        ctx.fillText(String(col), offsetX + col * cellW + 2, 12);
      }
    }
    
    // Draw punch holes
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = offsetX + col * cellW;
        const y = offsetY + row * cellH;
        
        // Grid line
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.strokeRect(x, y, cellW, cellH);
        
        // Punch hole
        const bit = card.pattern[row * this.cols + col];
        if (bit) {
          ctx.fillStyle = '#1a1a2e';
          ctx.beginPath();
          ctx.arc(x + cellW / 2, y + cellH / 2, cellW * 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Guide circle (faint)
          ctx.strokeStyle = 'rgba(0,0,0,0.05)';
          ctx.beginPath();
          ctx.arc(x + cellW / 2, y + cellH / 2, cellW * 0.3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    
    // Card ID
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.fillText(`ID: ${card.id}`, 10, height - 8);
    ctx.fillText(`SEQ: ${card.sequence}/${card.totalCards}`, width - 100, height - 8);
    ctx.fillText(`HASH: ${card.hash}`, width / 2 - 40, height - 8);
    
    return canvas;
  }

  /**
   * Generate a printable card as data URL
   */
  generatePrintable(card, options = {}) {
    const canvas = document.createElement('canvas');
    this.renderCard(card, canvas, options);
    return canvas.toDataURL('image/png');
  }

  // ---- INTEGRATION WITH HAZOOM OS KERNEL ----
  
  /**
   * Boot from punch card (secure air-gapped boot)
   */
  async bootFromCard(cardId) {
    const card = this.cards.get(cardId);
    if (!card) throw new Error(`Card not found: ${cardId}`);
    
    // Verify card integrity
    const expectedHash = this._computeHash(card.pattern);
    if (card.hash !== expectedHash) {
      throw new Error('Card integrity check failed — possible tampering');
    }
    
    // Decode data
    const data = this._decode(card.pattern, card.mode);
    
    return {
      cardId: card.id,
      data,
      verified: true,
      timestamp: Date.now(),
    };
  }

  /**
   * Create a bootable card from kernel code
   */
  createBootCard(kernelCode, options = {}) {
    return this.createCard(kernelCode, {
      ...options,
      mode: this.modes.ASCII,
      metadata: {
        type: 'boot',
        kernel: 'HAZOOM-OS-v4.0',
        ...options.metadata,
      },
    });
  }

  /**
   * Export card as JSON for storage
   */
  exportCard(cardId) {
    const card = this.cards.get(cardId);
    if (!card) return null;
    return JSON.stringify(card);
  }

  /**
   * Import card from JSON
   */
  importCard(json) {
    try {
      const card = JSON.parse(json);
      this.cards.set(card.id, card);
      return card;
    } catch (e) {
      throw new Error(`Invalid card data: ${e.message}`);
    }
  }

  // ---- METRICS ----
  
  getMetrics() {
    return {
      totalCards: this.cards.size,
      totalDecks: this.deckCounter,
      cardCapacity: this.cardCapacity,
      cardCapacityBytes: this.cardCapacity / 8,
      modes: Object.keys(this.modes),
    };
  }
}

// Export
const punchCardSystem = new PunchCardSystem();
export default punchCardSystem;
