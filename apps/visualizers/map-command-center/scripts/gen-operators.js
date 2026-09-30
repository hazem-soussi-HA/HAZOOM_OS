#!/usr/bin/env node
'use strict';
// Generates config/operators.json with random scrypt-hashed passwords.
// Plaintext is printed ONCE to stdout and never written to disk.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
const KEYLEN = SCRYPT.keylen;

const ROLES = [
  { id: 'admin', role: 'commander', level: 5 },
  { id: 'operator', role: 'operator', level: 3 },
  { id: 'viewer', role: 'viewer', level: 1 }
];

function makePassword() {
  // 24 chars from an unambiguous alphabet
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(32);
  let out = '';
  for (let i = 0; i < 24; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

const outFile = process.argv[2]
  || path.join(__dirname, '..', 'config', 'operators.json');

const records = {};
const plaintext = {};

for (const { id, role, level } of ROLES) {
  const pass = makePassword();
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pass, salt, KEYLEN, {
    N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p
  });
  records[id] = {
    salt: salt.toString('hex'),
    hash: hash.toString('hex'),
    role,
    level
  };
  plaintext[id] = pass;
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(records, null, 2) + '\n', { mode: 0o600 });
fs.chmodSync(outFile, 0o600);

console.log(`Wrote ${outFile} (mode 0600)\n`);
console.log('Passwords - shown ONCE, store them in your password manager:\n');
for (const [id, pass] of Object.entries(plaintext)) {
  console.log(`  ${id.padEnd(10)} ${pass}`);
}
console.log('\nThese are not recoverable from the file. Re-run to regenerate.');
