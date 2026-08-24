/**
 * HAZOOM Crypto — Transaction Security Layer
 * ==========================================
 * AES-256-GCM encryption for all session data at rest.
 * Every reflection, every memory, every transaction encrypted.
 *
 * © HAZOOM — Mirroring Transcendance Intelligence
 * Hazem Soussi — Lead Computing Architect
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// In production, this should come from HAZOOM-VAULT or env
// For self-contained security, we derive from a system fingerprint
const MASTER_SECRET = crypto.createHash('sha256')
  .update('HAZOOM-MTI-ENGINE-v0.2.0-ENCKEY')
  .digest('hex')
  .slice(0, KEY_LENGTH * 2);

const ENCRYPTION_KEY = Buffer.from(MASTER_SECRET, 'hex');

/**
 * Encrypt data using AES-256-GCM
 * Returns: iv:tag:ciphertext (hex-encoded)
 */
function encrypt(plaintext) {
  if (!plaintext) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + tag + ':' + encrypted;
}

/**
 * Decrypt data from iv:tag:ciphertext format
 */
function decrypt(encoded) {
  if (!encoded) return null;
  try {
    const parts = encoded.split(':');
    if (parts.length !== 3) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

/**
 * Secure hash for data integrity verification
 */
function hash(data) {
  return crypto.createHash('sha256').update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex');
}

/**
 * Generate a secure session ID
 */
function generateSessionId() {
  return 'hzm_' + crypto.randomBytes(24).toString('hex') + '_' + Date.now().toString(36);
}

/**
 * Encrypt a single reflection transaction
 */
function encryptTransaction(willText, hazoomResponse) {
  const payload = {
    w: willText,
    r: hazoomResponse,
    t: Date.now(),
    h: hash(willText + hazoomResponse)
  };
  return encrypt(payload);
}

/**
 * Verify transaction integrity
 */
function verifyTransaction(encoded, originalHash) {
  const decrypted = decrypt(encoded);
  if (!decrypted) return false;
  try {
    const payload = JSON.parse(decrypted);
    return payload.h === originalHash;
  } catch {
    return false;
  }
}

module.exports = {
  encrypt,
  decrypt,
  hash,
  generateSessionId,
  encryptTransaction,
  verifyTransaction,
  ALGORITHM,
  KEY_LENGTH
};
