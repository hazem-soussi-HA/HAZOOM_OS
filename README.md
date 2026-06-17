# HAZOOM OS — v3.1.0

Browser-based operating system with AI at its core. Desktop environment, window manager, file system, apps, games, AI assistant, Python backend.

## Quick Start

```bash
./start.sh
# Open http://localhost:3000
```

## Structure

```
index.html              Desktop OS
landing.html            Landing page
server.js               Node.js Express server (port 3000)
boot.py                 Python boot system
core/                   OS kernel (desktop, filesystem, AI, security)
apps/                   Applications and games (Super Mario GTA6, Neon Drift, Chess)
services/               Backend AI services
python/                 Python ML/AI backend
kernel/                 Pascal kernel
config/                 Configuration
scripts/                Launch utilities
tools/                  hz-shell, verification tools
```

## Requirements

- Node.js 18+
- Python 3.10+

## License

MIT — Hazem Soussi
├── python/                 ← Python backend
│   ├── hazoom-os/          ← ML training infrastructure
│   │   ├── api/            ← FastAPI REST API
│   │   ├── core/           ← AGI optimizer, training engine, deployer, verification
│   │   ├── cli/            ← CLI manager
│   │   ├── monitoring/     ← System monitoring
│   │   └── storage/        ← Checkpoint management
│   ├── hazoom_os/          ← System layer
│   │   ├── aether/         ← Aether communication protocol
│   │   ├── automation/     ← Task automation framework
│   │   └── integrations/   ← GLM Cloud Bridge
│   └── server/             ← Python servers (search, sqlite, secure, aether)
│
├── core/                   ← OS Core Engine (JavaScript + Pascal)
│   ├── os-desktop.js       ← Desktop environment (window manager)
│   ├── os-filesystem.js    ← Virtual file system
│   ├── consciousness.js    ← AI consciousness engine (JS)
│   ├── consciousness.pas   ← Consciousness (Pascal)
│   ├── ai_orchestrator.js  ← AI agent orchestration
│   ├── deep_think_engine.js ← Deep reasoning with parallel paths
│   ├── llm_engine.js       ← LLM integration (Ollama)
│   ├── security.js         ← Security system
│   ├── persistent-data-system.js ← Client-side encrypted persistence
│   ├── mcp_context_router.js ← MCP context routing
│   ├── hazoom_search_engine.js ← Search engine integration
│   ├── full_security_measurement_system.js ← Security auditing
│   ├── quantum_heat_monitor.js ← System strain visualization
│   ├── secure_client.js    ← Secure HTTP client
│   ├── aether_bridge.js    ← Aether protocol bridge
│   ├── app_launcher.js     ← Application launcher
│   ├── app_registry.js     ← App registry
│   ├── transformer_ai.py   ← Transformer AI (Python)
│   ├── neural_core.pas     ← Neural core (Pascal)
│   ├── aether_engine.pas   ← Aether engine (Pascal)
│   ├── deep_consciousness.pas ← Deep consciousness (Pascal)
│   └── ...                 ← 50+ more modules
│
├── kernel/                 ← Kernel Layer
│   ├── pascal/             ← Pascal Trinity (11 files)
│   │   ├── ap_neural_core.pas
│   │   ├── ap_consciousness.pas
│   │   ├── ap_aether_engine.pas
│   │   ├── ap_deep_consciousness.pas
│   │   └── ...
│   ├── alpha_chat.py       ← Python AI bridge
│   ├── pascal_kernel.py    ← Pascal runtime bridge
│   └── unified_kernel_bridge.py
│
├── apps/                   ← All Applications (70+)
│   ├── core-apps/          ← Desktop, Terminal, Browser, File Manager, Settings
│   ├── ai-apps/            ← AI Assistant, Deep Think, Copilot, Quantum AI
│   ├── tools/              ← System tools, monitors, search, security
│   ├── games/              ← Super Mario GTA6, Neon Drift, Chess, Arcade
│   ├── visualizers/        ← Showtime, consciousness visualizers
│   └── docs/               ← Documentation apps
│
├── games/                  ← Standalone games
│   ├── super-mario-gta6/   ← Platformer + GTA fusion (38 JS modules, Rust→WASM)
│   ├── neon-drift/         ← 3D neon sky racing (Three.js, 17 modules)
│   ├── chess/              ← Chess with transformer AI
│   └── arcade/             ← Arcade hub
│
├── server/                 ← Server Backends
│   ├── server.js           ← Main Node.js server
│   ├── search_proxy.py     ← DuckDuckGo search proxy with caching
│   ├── sqlite_persistence.py ← SQLite persistence layer
│   ├── secure_server.js    ← Secure supervision server
│   ├── secure_server.py    ← Python secure server
│   └── aether_server.py    ← Aether Protocol server
│
├── services/               ← Backend Services
│   ├── ai/                 ← AI services (neural bridge, knowledge system)
│   ├── api-gateway/        ← API gateway and WebSocket server
│   ├── orchestrator/       ← Service orchestration
│   ├── payments/           ← Payment systems
│   └── reactive/           ← Event bus
│
├── projects/               ← Sub-projects
│   ├── mcp/                ← MCP Cloud Supervisor (AWS/Azure/GCP)
│   ├── web-app/            ← Full-stack web app (FastAPI + React)
│   ├── swiss-edtech/       ← Swiss EdTech backend
│   ├── universe-map/       ← Universe visualizer
│   └── os-simulation/      ← OS simulation project
│
├── tools/                  ← Utility Tools
│   ├── hz-shell/           ← Natural language to shell translator
│   ├── disk-analysis-tool/ ← Disk analysis utility
│   └── verification-tools/ ← System verification utilities
│
├── docs/                   ← Documentation
│   ├── archive/            ← Archived projects (AlphaPony, etc.)
│   └── *.md                ← All documentation
│
├── config/                 ← Configuration files
├── scripts/                ← Build/deploy/utility scripts
├── tests/                  ← Test files
├── assets/                 ← Static assets
├── dapps/                  ← Decentralized apps
├── deploy/                 ← Deployment configs
├── security/               ← Security configs and certs
├── storage/                ← Data storage
└── legacy/                 ← Legacy code (for reference)
    ├── blockchain/         ← Blockchain experiments
    ├── simulation-code/    ← Old simulation code
    ├── experimental-services/
    ├── pascal-binaries/    ← Compiled Pascal binaries
    ├── orphaned-legacy/
    └── broken-dirs/
```

## 🎮 Games

| Game | Description | Tech |
|------|-------------|------|
| **Super Mario GTA6** | 2D platformer + GTA fusion. Police chase, wanted system, 300-tile level | 38 JS modules, Rust→WASM, Three.js racing |
| **Neon Drift** | 3D neon sky racing | Three.js, 17 modules, post-processing |
| **Chess** | Chess with AI opponent | Python + JS, transformer AI |
| **Arcade** | Arcade game hub | Canvas 2D |

## 🧠 AI Systems

- **Neural Core** — Pascal-based neural processing engine
- **Consciousness Engine** — AI consciousness modeling (JS + Pascal)
- **Aether Protocol** — Asyncio message bus for AI communication
- **Deep Think Engine** — Parallel reasoning paths with self-correction
- **AI Orchestrator** — Multi-agent coordination
- **LLM Engine** — Ollama/OpenRouter integration
- **AGI Optimizer** — Self-improving model training (Python, 632 lines)
- **Training Engine** — Multi-GPU distributed training (Python, 518 lines)
- **MCP Cloud Supervisor** — Multi-cloud agent management (AWS/Azure/GCP)
- **GLM Cloud Bridge** — Cloud AI integration

## 🔒 Security

- **Security System** — Login, sessions, rate limiting, input sanitization
- **Full Security Measurement** — Comprehensive security auditing
- **Secure Client** — Secure HTTP client
- **Privacy Controls** — User privacy management
- **Content Filter** — AI-powered content moderation
- **Secure Server** — Production-ready server with CSP and auth

## 🚀 Quick Start

```bash
# Start the OS (browser)
cd hazoom-os-unified
# Open index.html in your browser

# Start the backend server
node server.js
# Open http://localhost:3000

# Start Python services
cd python/hazoom-os/api
python server.py
# API at http://localhost:8000
```

## 📜 License

MIT License — Copyright © 2024-2026 Hazem Soussi (HA). All Rights Reserved.

## 🔗 GitHub

- **HAZOOM OS (this repo):** https://github.com/hazem-soussi-HA/hazoom-os-unified
- **Mario GTA6 (standalone):** https://github.com/hazem-soussi-HA/mario_gta6