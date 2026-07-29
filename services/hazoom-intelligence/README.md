# HAZOOM Intelligence

Unified system dashboard for the HAZOOM OS ecosystem — discovers, monitors, and provides access to every project, service, and blockchain contract across the system in real time.

## Features

- **Live System Discovery** — Automatically detects running services, Docker containers, k3s pods, and Ollama models
- **Project Catalog** — 15+ projects indexed with git status, remote URLs, and live links
- **Blockchain Dashboard** — Track compiled Solidity contracts deployed to Anvil testnet (Chain 31337)
- **Ollama AI Chat** — Built-in chat interface powered by local LLMs (Hermes 3, TinyLlama, Phi-3)
- **k3s Cluster View** — Real-time pod status across all namespaces
- **Git Activity Feed** — Recent commits and remotes for all repositories
- **Systemd Service** — Runs persistently with auto-restart

## Quick Start

```bash
git clone https://github.com/hazem-soussi-HA/hazoom-intelligence.service.git
cd hazoom-intelligence.service
npm install
PORT=5002 node server.js
```

Open http://localhost:5002

## Deploy as System Service

```bash
sudo cp hazoom-intelligence.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now hazoom-intelligence
```

## Architecture

```
server.js              Express backend — system discovery APIs
public/index.html      Single-page dashboard (dark cyberpunk UI)
Dockerfile             Container image for k3s deployment
k8s-dashboard.yaml     Kubernetes manifests (deployment + service + ingress)
```

### API Endpoints

| Route | Description |
|-------|-------------|
| `GET /api/status` | Running services, Docker, k3s pods, Ollama models |
| `GET /api/projects` | All indexed projects with git stats |
| `GET /api/contracts` | Solidity contracts + deployment addresses |
| `GET /api/git-stats` | Git repos with recent commits |

## Blockchain Contracts

| Contract | Address (Anvil) |
|----------|----------------|
| HazoomCoin (HAZ ERC-20) | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| HazoomLedger | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| HazoomLicense | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| HAZOOM-IP | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |

## License

HA-2.0 Proprietary — Hazem Soussi (HA) © 2024-2026
