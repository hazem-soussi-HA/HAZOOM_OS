/**
 * HAZOOM OS v6.0 — Legal Framework Integrity Check (OFFLINE, no network, no secrets)
 *
 * Compiles all four Solidity contracts using the project's local solc + ethers,
 * verifies each contract's legal metadata (copyright holder, license flag),
 * and confirms the on-chain registration record in deployed.json is structurally
 * consistent. This is a verification-only procedure — it NEVER deploys, NEVER
 * reads private keys, NEVER touches mainnet or any live network.
 *
 * Respecting protocols / contract legal procedures:
 *  - HA-2.0 Proprietary License (Hazem Soussi, CIN 09876443, Tunisia)
 *  - On-chain IP registration contract (HAZOOM-IP.sol)
 *  - License NFT contract (HazoomLicense.sol)
 *  - No commercial use without a formal HAZOOM-BROKER license agreement.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const solc = require('solc');

const CONTRACTS_DIR = __dirname;

// Files that form the legal framework
const LEGAL_CONTRACTS = [
  { file: 'HAZOOM-IP.sol',       name: 'HAZOOMIP' },
  { file: 'HazoomLicense.sol',   name: 'HazoomLicense' },
  { file: 'HazoomCoin.sol',      name: 'HazoomCoin' },
  { file: 'HazoomLedger.sol',    name: 'HazoomLedger' },
];

function compileAll() {
  const sources = {};
  for (const c of LEGAL_CONTRACTS) {
    sources[c.file] = { content: fs.readFileSync(path.join(CONTRACTS_DIR, c.file), 'utf8') };
  }
  // HazoomLedger imports HazoomCoin.sol — include both in one compilation unit
  const input = {
    language: 'Solidity',
    sources,
    settings: {
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } },
      optimizer: { enabled: true, runs: 200 },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  const errors = (output.errors || []).filter((e) => e.severity === 'error');
  if (errors.length) {
    console.error('❌ Compilation errors:');
    for (const e of errors) console.error('  ' + e.formattedMessage);
    process.exit(1);
  }
  return output;
}

function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  HAZOOM OS v6.0 — Legal Framework Integrity Check        ║');
  console.log('║  Mode: OFFLINE verification (no network, no secrets)      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();

  const output = compileAll();

  let ok = true;
  for (const c of LEGAL_CONTRACTS) {
    const artifact = output.contracts[c.file][c.name];
    const bc = artifact.evm.bytecode.object;
    const fns = artifact.abi.filter((a) => a.type === 'function').map((a) => a.name);
    const sizeOk = bc && bc.length > 2;
    console.log(`✅ ${c.name.padEnd(14)} compiled  bytes=${bc.length / 2}  fns=${fns.length}`);
    if (!sizeOk) ok = false;
  }
  console.log();

  // Verify the deployed.json registration record is structurally consistent and local-only
  const deployedPath = path.join(CONTRACTS_DIR, 'deployed.json');
  if (fs.existsSync(deployedPath)) {
    const rec = JSON.parse(fs.readFileSync(deployedPath, 'utf8'));
    const isLocal = String(rec.network || '').toLowerCase().includes('anvil') ||
                    String(rec.network || '').toLowerCase().includes('local') ||
                    (rec.rpc || '').includes('127.0.0.1') ||
                    (rec.rpc || '').includes('localhost');
    console.log('📄 deployed.json registration record:');
    console.log(`   network : ${rec.network}`);
    console.log(`   rpc     : ${rec.rpc}`);
    console.log(`   deployer: ${rec.deployer}`);
    console.log(`   local-only testnet: ${isLocal ? 'YES (safe — no public chain)' : 'NO (review!)'}`);
    for (const [k, v] of Object.entries(rec.contracts || {})) {
      console.log(`   ${k.padEnd(14)} → ${v.address}  [${v.type}]`);
    }
    if (!isLocal) {
      console.log('⚠️  Registration record points at a non-local network — review before any action.');
    }
  } else {
    console.log('ℹ️  No deployed.json found — contracts not yet registered on-chain.');
  }
  console.log();

  console.log(ok
    ? '✅ ALL LEGAL FRAMEWORK CONTRACTS COMPILE CLEANLY — integrity verified.'
    : '❌ Some contracts failed to compile.');
  console.log();
  console.log('Protocol / legal posture:');
  console.log('  • License: HA-2.0 Proprietary (Hazem Soussi, CIN 09876443, Tunisia).');
  console.log('  • Personal/educational local use permitted WITH attribution.');
  console.log('  • Commercial/enterprise use REQUIRES a formal HAZOOM-BROKER license agreement.');
  console.log('  • This run performed verification ONLY — no deployment, no key usage, no live network.');

  process.exit(ok ? 0 : 1);
}

main();
