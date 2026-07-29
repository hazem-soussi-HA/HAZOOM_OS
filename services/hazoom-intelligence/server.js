const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT || '5002');
const GIT_TIMEOUT = 5000;

const PROJECTS = [
  { name: 'HAZOOM OS', path: '/home/hazem/HAZOOM_OS', type: 'os', url: 'http://hazoom.local', desc: 'Full-stack intelligent OS — C kernel, Pascal engine, AI fabric, smart contracts, deployed on k3s' },
  { name: 'HAZOOM Intelligence', path: '/home/hazem/hazoom-intelligence', type: 'web', url: 'http://intelligence.local:5002', desc: 'Unified command center — monitor, AI chat, blockchain, projects' },
  { name: 'Portfolio v3', path: '/home/hazem/portfolio_final', type: 'web', url: 'https://hazem-soussi-ha.github.io/portfolio_final', desc: 'React/Vite portfolio with infra telemetry — public face' },
  { name: 'DeepSeek Knowledge', path: '/home/hazem/HAZOOM_OS/deepseek-knowledge', type: 'ai', url: 'http://127.0.0.1:3001', desc: 'FastAPI knowledge system + React frontend on port 3001' },
  { name: 'DESCER', path: '/home/hazem/descer', type: 'web', url: 'http://127.0.0.1:5000', desc: 'Drum machine & synth web server — make music, enjoy life' },
  { name: 'Mario GTA6', path: '/home/hazem/mario_gta6', type: 'game', desc: 'Super Mario × GTA6 hybrid engine — original IP' },
  { name: 'HAZOOM DNS', path: '/home/hazoom-dns', type: 'infra', desc: 'Rust authoritative DNS server — RFC 1035 compliant' },
  { name: 'Mirror Transcendance', path: '/root/mirror-transcendance', type: 'ai', desc: 'Consciousness reflection interface' },
  { name: 'HAZOOM Vault', path: '/root/hazoom-vault', type: 'infra', desc: 'Security vault — IDS/IPS, email gateway, crypto engine' },
];

const CONTRACTS = [
  { name: 'HazoomCoin.sol', path: '/home/hazem/HAZOOM_OS/contracts/HazoomCoin.sol', network: 'Ethereum', desc: 'ERC-20 token — ecosystem currency' },
  { name: 'HazoomLedger.sol', path: '/home/hazem/HAZOOM_OS/contracts/HazoomLedger.sol', network: 'Ethereum', desc: 'Ledger & accounting — transaction tracking' },
  { name: 'HazoomLicense.sol', path: '/home/hazem/HAZOOM_OS/contracts/HazoomLicense.sol', network: 'Ethereum', desc: 'License management — IP & software licensing' },
  { name: 'HAZOOM-IP.sol', path: '/home/hazem/HAZOOM_OS/contracts/HAZOOM-IP.sol', network: 'Ethereum', desc: 'IP registration & proof-of-ownership' },
];

const SERVICE_NAMES = {
  '22': 'SSH', '53': 'DNS', '5355': 'mDNS/LLMNR',
  '80': 'Traefik HTTP', '443': 'Traefik HTTPS', '6443': 'k3s API',
  '11434': 'Ollama AI', '8545': 'Anvil Testnet',
  '5002': 'HAZOOM Intelligence', '5000': 'DESCER Synth',
  '8000': 'Copilot App', '8001': 'MCP Server',
  '3001': 'DeepSeek Frontend', '8888': 'Legacy OS Server',
  '9090': 'HAZOOM WebSocket', '9000': 'HAZOOM MCP',
  '9004': 'Alpha Pony Chat', '5001': 'Python Service',
  '6444': 'k3s API (internal)', '10248': 'k3s etcd',
  '10249': 'k3s etcd', '10250': 'k3s kubelet',
  '10256': 'k3s proxy', '10257': 'k3s scheduler',
  '10258': 'k3s controller', '10259': 'k3s controller',
  '10010': 'containerd', '39755': 'containerd',
};

function safeExec(cmd, timeout = 5000) {
  try { return execSync(cmd, { timeout, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).toString(); }
  catch { return ''; }
}

function safeStat(p) {
  try { return fs.statSync(p); } catch { return null; }
}

app.use(express.json());

app.get('/api/status', (req, res) => {
  const services = [];
  const running = safeExec('/usr/bin/ss -tlnp 2>/dev/null', 3000);
  const seen = new Set();
  for (const line of running.split('\n').filter(l => l.includes('LISTEN'))) {
    const m = line.match(/:(\d+)\s+/);
    if (m) {
      const port = m[1];
      if (seen.has(port)) continue;
      seen.add(port);
      services.push({
        port: parseInt(port),
        name: SERVICE_NAMES[port] || `Port :${port}`,
        local: line.includes('127.0.0.1'),
      });
    }
  }
  services.sort((a, b) => a.port - b.port);

  const docker = safeExec('/usr/bin/docker ps --format "{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null', 3000)
    .trim().split('\n').filter(Boolean).map(l => {
      const [name, image, status, ports] = l.split('\t');
      return { name, image, status, ports: ports || '' };
    });

  const k3s = safeExec('/usr/local/bin/kubectl get pods -A -o wide 2>/dev/null', 5000)
    .trim().split('\n').slice(1).filter(Boolean).map(l => {
      const cols = l.split(/\s+/);
      return { namespace: cols[0], name: cols[1], ready: cols[2], status: cols[3], ip: cols[6] || '', node: cols[7] || '' };
    });

  let ollama = [];
  try {
    const ollamaOut = execSync('/usr/local/bin/ollama list', {timeout:5000,encoding:'utf-8',stdio:['pipe','pipe','pipe']});
    if (ollamaOut) {
      ollama = ollamaOut.toString().trim().split('\n').slice(1).filter(Boolean).map(l => {
        const c = l.split(/\s+/); return {name:c[0],size:(c[2]||'')+' '+(c[3]||'')};
      });
    }
  } catch(e) { /* ollama not available */ }

  const disk = safeExec("df -h / | tail -1", 2000).trim().split(/\s+/);
  const mem = safeExec("free -h | grep Mem", 2000).trim().split(/\s+/);
  const uptime = safeExec("uptime -p", 2000).trim().replace('up ', '');

  res.json({
    services, docker, k3s, ollama,
    system: {
      disk: disk[4] || '?', disk_total: disk[1] || '?',
      mem_used: mem[2] || '?', mem_total: mem[1] || '?',
      uptime, hostname: safeExec('hostname', 1000).trim(),
    },
    timestamp: Date.now(),
  });
});

app.get('/api/projects', (req, res) => {
  const enriched = PROJECTS.map(p => {
    try {
      const desc = safeStat(p.path);
      if (!desc) return { ...p, exists: false, git: false, branch: '', remotes: [] };
      const hasGit = fs.existsSync(path.join(p.path, '.git'));
      let branch = '', remotes = [];
      if (hasGit) {
        branch = safeExec(`git -C "${p.path}" rev-parse --abbrev-ref HEAD 2>/dev/null`, GIT_TIMEOUT).trim();
        const r = safeExec(`git -C "${p.path}" remote -v 2>/dev/null`, GIT_TIMEOUT).trim();
        remotes = r.split('\n').filter(Boolean).map(l => { const p2 = l.split(/\s+/); return { name: p2[0], url: p2[1] }; });
      }
      return { ...p, exists: true, git: hasGit, branch, remotes, size: desc.size, modified: desc.mtime };
    } catch (_) {
      return { ...p, exists: false, git: false, branch: '', remotes: [] };
    }
  });
  res.json(enriched);
});

const DEPLOYED_OMEGA = safeExec('cat /home/hazem/HAZOOM_OS/contracts/deployed.json 2>/dev/null', 1000);
const DEPLOYMENT_OMEGA = DEPLOYED_OMEGA ? (() => { try { return JSON.parse(DEPLOYED_OMEGA); } catch { return null; } })() : null;

app.get('/api/contracts', (req, res) => {
  const enriched = CONTRACTS.map(c => {
    const deployedAddr = DEPLOYMENT_OMEGA?.contracts?.[c.name.replace('.sol', '')]?.address || null;
    try {
      const content = fs.readFileSync(c.path, 'utf-8');
      const licenseMatch = content.match(/SPDX-License-Identifier:\s*(\S+)/);
      return {
        ...c, exists: true, lines: content.split('\n').length,
        hasPragma: content.includes('pragma solidity'),
        hasContract: content.includes('contract '),
        deployedAddress: deployedAddr,
        license: licenseMatch ? licenseMatch[1] : 'MIT',
      };
    } catch (_) { return { ...c, exists: false, deployedAddress: null }; }
  });
  res.json({ contracts: enriched, deployment: DEPLOYMENT_OMEGA });
});

app.get('/api/git-stats', (req, res) => {
  const repos = [
    '/home/hazem/HAZOOM_OS', '/home/hazem/hazoom-intelligence', '/home/hazem/portfolio_final',
    '/home/hazem/descer', '/root/mirror-transcendance', '/home/hazem/mario_gta6'
  ];
  const all = repos.map(p => {
    const gitPath = path.join(p, '.git');
    if (!fs.existsSync(gitPath)) return null;
    try {
      const branch = safeExec(`git -C "${p}" rev-parse --abbrev-ref HEAD 2>/dev/null`, 3000).trim();
      const remote = safeExec(`git -C "${p}" remote -v 2>/dev/null`, 3000).trim();
      const log = safeExec(`git -C "${p}" log --oneline -3 2>/dev/null`, 3000).trim();
      const total = safeExec(`git -C "${p}" rev-list --count HEAD 2>/dev/null`, 3000).trim();
      return { name: path.basename(p), branch, total: total || '?', remote: remote.split('\n').filter(Boolean), log: log.split('\n').filter(Boolean) };
    } catch { return null; }
  }).filter(Boolean);
  res.json(all);
});

app.get('/api/ollama/chat', express.json(), (req, res) => {
  const { message, model = 'hermes3' } = req.body || {};
  if (!message) return res.json({ response: 'Message required' });
  try {
    const r = execSync(`/usr/local/bin/ollama run ${model} -- "${message.replace(/"/g, '\\"')}"`, { timeout: 30000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    res.json({ response: r.toString().trim() });
  } catch (e) {
    res.json({ response: `Ollama error: ${e.message.substring(0, 100)}` });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HAZOOM Intelligence running on http://0.0.0.0:${PORT}`);
});
