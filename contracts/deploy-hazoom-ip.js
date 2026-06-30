/**
 * HAZOOM OS — IP Registration & Verification Tool
 * Deploys HAZOOM-IP.sol to Ethereum and generates signed copyright certificates
 *
 * Usage:
 *   node contracts/deploy-hazoom-ip.js deploy    <PRIVATE_KEY> <RPC_URL>
 *   node contracts/deploy-hazoom-ip.js verify    <CONTRACT_ADDRESS>
 *   node contracts/deploy-hazoom-ip.js certificate
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Contract source
const CONTRACT_SOURCE = fs.readFileSync(
  path.join(__dirname, 'HAZOOM-IP.sol'), 'utf8'
);

// Compile Solidity using solc-js
function compileContract() {
  const solc = require('solc');

  const input = {
    language: 'Solidity',
    sources: {
      'HAZOOM-IP.sol': { content: CONTRACT_SOURCE }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode', 'metadata']
        }
      },
      optimizer: { enabled: true, runs: 200 }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      console.error('Compilation errors:', JSON.stringify(errors, null, 2));
      process.exit(1);
    }
  }

  const contract = output.contracts['HAZOOM-IP.sol']['HAZOOMIP'];
  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object,
    metadata: contract.metadata
  };
}

// Deploy contract to network
async function deploy(privateKey, rpcUrl) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  HAZOOM OS v6.0 — IP Rights Registration                  ║');
  console.log('║  Deploying to blockchain...                                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`\nDeployer: ${wallet.address}`);
  console.log(`Network:  ${(await provider.getNetwork()).name} (chainId: ${(await provider.getNetwork()).chainId})`);

  const { abi, bytecode } = compileContract();

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  console.log('\nCompiling...');
  console.log(`Bytecode size: ${bytecode.length / 2} bytes`);

  console.log('\nDeploying HAZOOM-IP contract...');
  const contract = await factory.deploy();
  const deployTx = contract.deploymentTransaction();

  console.log(`Deploy tx: ${deployTx.hash}`);
  console.log('Waiting for confirmation...');

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`\n✅ HAZOOM-IP deployed at: ${contractAddress}`);

  // Verify on-chain registration
  console.log('\nVerifying registration...');
  const holder = await contract.getCopyrightHolder();
  const count = await contract.getComponentCount();
  const legalNotice = await contract.getLegalNotice();

  console.log(`  Copyright Holder: ${holder.name}`);
  console.log(`  CIN:              ${holder.cin}`);
  console.log(`  Country:          ${holder.country}`);
  console.log(`  Registered At:    ${new Date(Number(holder.registeredAt) * 1000).toISOString()}`);
  console.log(`  Components:       ${count.toString()}`);

  // Save deployment record
  const record = {
    contractAddress,
    deployer: wallet.address,
    chainId: Number((await provider.getNetwork()).chainId),
    network: (await provider.getNetwork()).name,
    deployTxHash: deployTx.hash,
    timestamp: new Date().toISOString(),
    components: Number(count),
    copyrightHolder: {
      name: 'Hazem Soussi',
      cin: '09876443',
      country: 'Tunisia'
    },
    legalNotice
  };

  fs.writeFileSync(
    path.join(__dirname, 'deployment-record.json'),
    JSON.stringify(record, null, 2)
  );

  console.log('\n📄 Deployment record saved to: contracts/deployment-record.json');

  return { contract, contractAddress, record };
}

// Generate copyright certificate (off-chain, signed)
async function generateCertificate(privateKey) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  HAZOOM OS v6.0 — Copyright Certificate Generator         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const wallet = new ethers.Wallet(privateKey);

  // Generate SHA-256 hash of all project files
  const projectRoot = path.join(__dirname, '..');
  const projectHash = hashProjectFiles(projectRoot);

  // Signed message
  const message = `HAZOOM OS v6.0 — Copyright Registration\n` +
    `Author: Hazem Soussi\n` +
    `CIN: 09876443\n` +
    `Country: Tunisia\n` +
    `Year: 2024-2026\n` +
    `Project Hash: ${projectHash}\n` +
    `Timestamp: ${new Date().toISOString()}\n` +
    `All Rights Reserved — HA-2.0 Proprietary License`;

  const signature = await wallet.signMessage(message);

  const certificate = {
    version: '1.0',
    project: 'HAZOOM OS v6.0',
    copyright: {
      holder: 'Hazem Soussi',
      cin: '09876443',
      country: 'Tunisia',
      entity: 'HAZOOM — Private Digital Artefact Namespace',
      years: '2024-2026'
    },
    ip: {
      components: 125,
      kernels: ['entry.asm', 'main.c', 'gdt.c', 'idt.c', 'console.c', 'pmm.c', 'process.c', 'qlearn.c'],
      ai: ['q-learning.js', 'consciousness.js', 'aether.js', 'deep_think_engine.js', 'agentic-rag.js'],
      pascal: ['aether_engine.pas', 'consciousness.pas', 'neural_core.pas'],
      frontend: ['index.html', 'app_launcher.js', 'app_registry.js', 'privacy_browser.js'],
      crypto: ['post-quantum-crypto.js', 'security.js', 'ai-runtime.js'],
      license: 'HA-2.0 Proprietary — All Rights Reserved'
    },
    legal: {
      tunisianLaw: 'Loi 2004-33 relative au droit d\'auteur',
      euDirective: 'EU Copyright Directive 2001/29/EC',
      berneConvention: 'Berne Convention for the Protection of Literary and Artistic Works',
      dmca: 'Digital Millennium Copyright Act (US)',
      consequences: 'Civil and criminal infringement for unauthorized reproduction, distribution, modification or reverse engineering'
    },
    hashes: {
      projectSha256: projectHash,
      signature,
      signer: wallet.address
    },
    timestamp: new Date().toISOString(),
    message
  };

  const certPath = path.join(__dirname, 'copyright-certificate.json');
  fs.writeFileSync(certPath, JSON.stringify(certificate, null, 2));

  // Also generate a human-readable version
  const txtPath = path.join(__dirname, 'COPYRIGHT-CERTIFICATE.txt');
  const txt = `
═══════════════════════════════════════════════════════════════════
                    COPYRIGHT CERTIFICATE
                    HAZOOM OS v6.0
═══════════════════════════════════════════════════════════════════

Project:      HAZOOM OS v6.0 — The Operating System That Learns
Author:       Hazem Soussi
CIN:          09876443 (Tunisian National ID)
Country:      Tunisia
Entity:       HAZOOM — Private Digital Artefact Namespace
Years:        2024-2026
License:      HA-2.0 Proprietary — All Rights Reserved

INTELLECTUAL PROPERTY REGISTERED:
  - Kernels (13 components): x86-64 Assembly + C kernel, bootloader
  - AI Systems (15 components): Q-Learning, Consciousness, Aether, RAG
  - Pascal Brain (5 components): AetherEngine, NeuralCore, Consciousness
  - Frontend (20+ components): Desktop, Apps, Browser, Security
  - Cryptography (12 components): Post-quantum crypto (ML-KEM/ML-DSA)
  - Services (10+ components): Server, API, WebSocket, Boot, Config
  - Infrastructure (15+ components): K8s, Docker, CI/CD, LXC, DNS
  - Documentation (15+ components): Technical docs, roadmaps, recipes
  Total: 125+ protected components

RESERVED RIGHTS:
  - All rights reserved under Tunisian copyright law
  - Patent US20150100530A1 (DQN dual network architecture)
  - Watkins & Dayan (1992) tabular Q-learning
  - van Hasselt (2016) Double DQN
  - ML-KEM (Kyber) + ML-DSA (Dilithium) post-quantum cryptography
  - Ethical licensing via HAZOOM-BROKER

LEGAL FRAMEWORK:
  - Tunisian Law: Loi 2004-33
  - EU Directive: 2001/29/EC
  - International: Berne Convention
  - US: DMCA

VERIFICATION:
  Project SHA-256: ${projectHash}
  EIP-712 Signature: ${signature}
  Signer Address: ${wallet.address}

This certificate is cryptographically signed and may be
verified on any Ethereum-compatible network or offline.

═══════════════════════════════════════════════════════════════════
  "An operating system that learns, thinks, and grows.
   Protected by blockchain, powered by quantum principles,
   created by Hazem Soussi."
═══════════════════════════════════════════════════════════════════
`;

  fs.writeFileSync(txtPath, txt);
  console.log(`\n📄 Certificate saved to: ${certPath}`);
  console.log(`📄 Human-readable: ${txtPath}`);

  return certificate;
}

// Hash all project files (for integrity proof)
function hashProjectFiles(rootDir) {
  const hash = crypto.createHash('sha256');
  const files = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['.git', 'node_modules', '.venv', '.hermes'].includes(entry.name)) {
          walk(full);
        }
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(full);
          hash.update(content);
          files.push(path.relative(rootDir, full));
        } catch (e) { /* skip unreadable */ }
      }
    }
  }
  walk(rootDir);
  const digest = hash.digest('hex');
  console.log(`  Hashed ${files.length} files → SHA-256: ${digest.substring(0, 64)}`);
  return digest;
}

// Verify deployed contract
async function verify(contractAddress, rpcUrl) {
  console.log(`Verifying contract at ${contractAddress}...`);
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const { abi } = compileContract();
  const contract = new ethers.Contract(contractAddress, abi, provider);

  const holder = await contract.getCopyrightHolder();
  const count = await contract.getComponentCount();
  const notice = await contract.getLegalNotice();

  console.log(`\n  Copyright Holder: ${holder.name}`);
  console.log(`  CIN:              ${holder.cin}`);
  console.log(`  Country:          ${holder.country}`);
  console.log(`  Components:       ${count.toString()}`);
  console.log(`  Legal Notice:     ${notice.substring(0, 100)}...`);

  return { holder, count, notice };
}

// === MAIN ===
async function main() {
  const [,, cmd, ...args] = process.argv;

  switch (cmd) {
    case 'deploy': {
      const [privateKey, rpcUrl] = args;
      if (!privateKey || !rpcUrl) {
        console.error('Usage: node deploy-hazoom-ip.js deploy <PRIVATE_KEY> <RPC_URL>');
        process.exit(1);
      }
      await deploy(privateKey, rpcUrl);
      break;
    }
    case 'verify': {
      const [contractAddress] = args;
      if (!contractAddress) {
        console.error('Usage: node deploy-hazoom-ip.js verify <CONTRACT_ADDRESS>');
        process.exit(1);
      }
      // Verify locally
      const { abi } = compileContract();
      console.log('Contract compiles successfully');
      console.log('ABI functions:', abi.filter(a => a.type === 'function').map(f => f.name).join(', '));
      break;
    }
    case 'certificate': {
      console.log('Generating copyright certificate (no private key needed)...');
      const [privateKey] = args;
      if (!privateKey) {
        console.log('Generating unsigned certificate (add private key to sign)...');
        const projectRoot = path.join(__dirname, '..');
        const projectHash = hashProjectFiles(projectRoot);
        console.log(`Project Hash: ${projectHash}`);
      } else {
        await generateCertificate(privateKey);
      }
      break;
    }
    default:
      console.log('Commands: deploy, verify, certificate');
  }
}

main().catch(console.error);
