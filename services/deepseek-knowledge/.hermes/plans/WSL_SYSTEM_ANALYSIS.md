# WSL SYSTEM ANALYSIS
> June 23, 2026 — Shadow Builder (HAZ00M)

---

## SYSTEM MAP

```
WSL FILESYSTEM
│
├── /root/                          ← WSL root home
│   ├── .hermes/                    ★ PRIMARY AI AGENT
│   │   ├── config.yaml (13KB)
│   │   ├── .env (22KB)
│   │   ├── skills/ (20+ modules)
│   │   ├── sessions/ (375 dumps)
│   │   ├── memories/
│   │   │   ├── MEMORY.md
│   │   │   └── USER.md
│   │   └── logs/agent.log (4MB)
│   │
│   ├── .mimo_browser/              ★ MiMo BROWSER RUNTIME DATA
│   │   ├── vault.db (12KB)         — Encrypted credential vault
│   │   └── permissions.db (12KB)   — Site permissions
│   │
│   ├── .foundry/                   ★ ETHEREUM DEV TOOLKIT
│   │   ├── bin/
│   │   │   ├── forge (69MB)
│   │   │   ├── cast (51MB)
│   │   │   ├── anvil (32MB)
│   │   │   └── chisel (34MB)
│   │   └── cache/, share/, versions/
│   │
│   ├── .ollama/                    ★ LOCAL LLM
│   │   ├── models/blobs/           — Model weights
│   │   └── 740MB model binary
│   │
│   ├── .github/workflows/
│   │   └── deploy.yml              — GitHub Pages portfolio deploy
│   │
│   ├── .env                        — API keys (OPENROUTER, ANTHROPIC)
│   ├── .gitconfig                  — Git config (hazem-soussi-HA)
│   └── hermes-power.html (35KB)    — Hermes power dashboard
│
├── /root/deepseek-repo/            ★ DEEPSEEK (GIT-TRACKED)
│   ├── .git                        — github.com/hazem-soussi-HA/deepseek
│   ├── blockchain-portal/           — Pac-Man BASIC + Python
│   │   ├── pacman.bas (16KB)
│   │   ├── pacman.py (17KB)
│   │   └── src/learn.bas (21KB)
│   ├── model-chat/
│   │   └── hermes_chat.html (20KB)  — Chat interface
│   └── deepseek-archive/           — DeepSeek reference docs
│       ├── deepseek.html (24KB)
│       ├── deepseek_v4_flash_not_automated.html (21KB)
│       ├── alpha_pony_showcase.html (18KB)
│       └── contact_prototype.html (6KB)
│
├── /root/hazem-omega/              ★ HAZEM OMEGA MONOREPO [GIT]
│   ├── .git                        — github.com/hazem-soussi-HA/hazem.omega
│   ├── .github/workflows/ci.yml    — CI/CD
│   ├── OMEGA_1.0.0.md (5KB)        — Vision document
│   │
│   ├── apps/
│   │   └── web-portal/             — Web entry point (minimal)
│   │
│   ├── deepseek-knowledge/         ★ KNOWLEDGE APP (Python/FastAPI)
│   │   ├── app/
│   │   │   ├── main.py             — FastAPI entry
│   │   │   ├── api/v1/             — Auth + Video endpoints
│   │   │   ├── models/             — User, Video SQLAlchemy
│   │   │   ├── services/           — Video generator
│   │   │   ├── workers/            — Video tasks
│   │   │   ├── knowledge/          — Internet history
│   │   │   └── core/               — Auth, config, DB, security
│   │   ├── frontend/               — React (Vite)
│   │   │   ├── src/App.jsx
│   │   │   └── src/pages/HomePage.jsx
│   │   ├── deployment/
│   │   │   ├── k8s/                — Kubernetes manifests
│   │   │   └── docker/             — Dockerfile + compose
│   │   ├── migrations/             — Alembic
│   │   ├── storage/                — Video storage
│   │   ├── venv/                   — Python 3.12 venv
│   │   ├── alembic.ini
│   │   ├── requirements.txt
│   │   ├── PROJECT_SUMMARY.md (10KB)
│   │   └── README.md (8KB)
│   │
│   ├── projects/
│   │   └── hazoom-os/              ★ HAZOOM OS v2 [SUB-GIT]
│   │       ├── contracts/
│   │       │   ├── HazoomCoin.sol
│   │       │   └── HazoomLedger.sol
│   │       ├── engine/
│   │       │   ├── hazoom_os/kernel.py (11KB)
│   │       │   └── server.py (36KB)
│   │       ├── data/
│   │       │   ├── atlas.json (45KB)
│   │       │   ├── galaxy_binary.bin (5MB)
│   │       │   ├── galaxy_data.json (12MB)
│   │       │   └── habitable_intelligence.json (60KB)
│   │       ├── ai/                  — AlphaPony AI system
│   │       │   ├── alpha_pony.py (18KB)
│   │       │   ├── ap_neural_bridge.py, ap_openrouter.py
│   │       │   └── hazoom_philosophy.py (15KB)
│   │       ├── api-gateway/         — Web interface
│   │       │   ├── hazoom_desktop.html (43KB)
│   │       │   └── unified_server.py (22KB)
│   │       ├── orchestrator/        — Agent orchestration
│   │       │   ├── ap_alphapony.py, ap_launcher.py
│   │       │   ├── ap_mcp_server.py (25KB)
│   │       │   └── chat_server.py
│   │       ├── services-all/        — Reasoning context
│   │       │   └── reasoning_context.py (33KB)
│   │       ├── payments/
│   │       │   └── crypto-gateway.js
│   │       ├── vault/
│   │       │   └── crypto_engine.py (10KB)
│   │       ├── kernel/              — Compiled kernels (binary)
│   │       └── core/                — Pascal source mirrors
│   │                                 └── *.pas files (7-23KB each)
│   │
│   └── archive/
│       ├── v1-hazoom-os-legacy/    ★ HAZOOM OS v1 (5,984 files)
│       │   ├── *.pas               — Pascal kernel sources
│       │   ├── *.c, *.h, *.cpp     — C/C++ kernel sources
│       │   ├── *.a, *.o            — Assembly/object files
│       │   ├── Makefile, CMakeLists
│       │   └── HAZOOM_OS_COMPLETE_DESCRIPTION.md (29KB)
│       ├── v1-frontend/            — v1 frontend (743 files)
│       └── v1-scattered-modules/   — v1 scattered (647 files)
│           └── META.md, Dockerfile, docker-compose.yml
│
├── /root/projects/                  (not found)

│
├── /home/hazem/                    ★ ORIGINAL WSL USER
│   ├── HAZOOM_OS/                  ★★★ HAZOOM OS v1 (12,882 files) ★★★
│   │   ├── index.html (47KB)       — Main OS entry
│   │   ├── os.html (56KB)          — OS interface
│   │   ├── boot.py (8KB)           — Boot sequence
│   │   ├── landing.html (6KB)
│   │   │
│   │   ├── server/                 — SERVER LAYER
│   │   │   ├── aether_server.py (4KB)
│   │   │   ├── search_proxy.py (13KB)
│   │   │   ├── secure_server.py (7KB)
│   │   │   ├── secure_server.js (18KB)
│   │   │   └── sqlite_persistence.py (18KB)
│   │   │
│   │   ├── apps/                   — 37 HTML APP PAGES
│   │   │   ├── ai_assistant.html (14KB)
│   │   │   ├── ai_command_center.html (30KB)
│   │   │   ├── antigravity_navigator.html (26KB)
│   │   │   ├── browser.html (12KB)
│   │   │   ├── aether-dashboard.html (19KB)
│   │   │   ├── admin_monitor.html (163KB)
│   │   │   └── ... (31 more)
│   │   │
│   │   ├── core/                   — 53 JS FILES
│   │   │   ├── aether.js (21KB)
│   │   │   ├── ai-kernel.js (10KB)
│   │   │   ├── agentic-rag.js (24KB)
│   │   │   ├── ai_orchestrator.js (7KB)
│   │   │   ├── ap_deep_think_engine.js (17KB)
│   │   │   └── ... (48 more)
│   │   │
│   │   ├── kernel/                 — PASCAL KERNEL (21 .pas)
│   │   │   ├── ap_aether_engine.pas (7KB)
│   │   │   ├── ap_consciousness.pas (9KB)
│   │   │   ├── ap_deep_consciousness.pas (23KB)
│   │   │   └── ap_galaxy_server.pas (1KB)
│   │   │
│   │   ├── config/                 — 20+ CONFIG FILES
│   │   │   ├── blockchain_config.json
│   │   │   ├── crypto_config.json
│   │   │   ├── deployment.json
│   │   │   ├── hazoom-os-v3.conf (3KB)
│   │   │   └── credentials.json
│   │   │
│   │   ├── scripts/                — 18 SHELL SCRIPTS
│   │   │   ├── deploy.sh, build.sh
│   │   │   ├── hazoom-os-launcher.sh
│   │   │   └── start_hazoom.sh
│   │   │
│   │   ├── memory/
│   │   │   └── identity.json
│   │   │
│   │   ├── tools/, services/
│   │   │
│   │   └── PROJECT_ANALYSIS.md (11KB)
│   │
│   ├── mario_gta6/                 ★★ SUPER MARIO GTA6 (35,491 files) ★★
│   │   ├── .secure/
│   │   │   ├── GAME_DESIGN_VAULT.md (13KB)  — Vault encryption
│   │   │   ├── vault.db.json (12KB)
│   │   │   └── vault.py (33KB)
│   │   ├── website/
│   │   │   └── index.html (9KB)
│   │   ├── _archive/
│   │   │   ├── game-super-hazoom.bas (464 lines)
│   │   │   └── ... (archived old files)
│   │   └── node_modules/
│   │
│   ├── portfolio_final/            ★★ HAZEM PORTFOLIO (7,395 files) ★★
│   │   ├── src/
│   │   │   ├── App.jsx (28KB)
│   │   │   ├── i18n.js
│   │   │   ├── index.css
│   │   │   └── main.jsx
│   │   ├── dist/                   — Built React/Vite app
│   │   │   └── index.html (5KB)
│   │   ├── public/                 — Hero images, SVGs, robots.txt
│   │   │   └── hazem-hero.jpg (2MB), hazem-photo.jpg (510KB)
│   │   ├── .github/                — GitHub Pages deploy
│   │   │
│   │   └── package.json
│   │
│   ├── chatdev/                    — Chat dev (Node.js)
│   │   ├── server.js (2KB)
│   │   ├── public/index.html, script.js, styles.css
│   │   └── package.json
│   │
│   ├── maps/                       — Map visualizations
│   │   ├── starwars-galaxy/starwars-map.html (2KB)
│   │   ├── world-map/
│   │   │   ├── index.html, script.js, style.css
│   │   │   └── enhanced-csp.html (1KB)
│   │   └── futuristic-command-center/
│   │       └── futuristic-map.html (47KB)
│   │
│   ├── server/                     — Proxy + security servers
│   │   ├── docker-compose-secure.yml
│   │   └── proxy/
│   │       ├── enhanced-secure-proxy.js
│   │       └── secure-proxy.js (3KB)
│   │
│   ├── scripts/                    — System setup
│   │   ├── full-environment-setup.sh (2KB)
│   │   ├── secure-init.sh (874B)
│   │   ├── start_hazoom.sh (178B)
│   │   └── setup_server.sh
│   │
│   └── docs/                       — K8s + proxy docs
│       ├── IMPLEMENTATION_STATUS.md
│       ├── README-k8s.md
│       └── README-proxy.md
│
├── /opt/
│   ├── elephant/                   ★ LOCAL LLM CHAT (17,343 files, 638MB)
│   │   ├── models/                 — LLM model weights
│   │   ├── scripts/
│   │   │   ├── elephant_chat.py (2KB)
│   │   │   ├── local_chat.py (1KB)
│   │   │   └── smart_elephant.py (1KB)
│   │   ├── ui/
│   │   │   └── elephant_ui.py (1KB)
│   │   ├── venv/                   — Python 3.12 venv
│   │   ├── logs/, models/
│   │   ├── run_chat.sh, run_ui.sh
│   │   └── .hermes/ (via /mnt/c mount)
│   │
│   ├── spark-3.3.2-bin-hadoop3/     (821 files, 169MB)
│   ├── spark-3.5.1-bin-without-hadoop/ (236 files, 157MB)
│   ├── containerd/                   (runtime)
│   └── aider-env/                   (5 files, 22MB)
│
├── /root/.claude/                   — Claude agent sessions
├── /root/.codex/                    — OpenAI Codex (13MB logs, skills)
├── /root/.opencode/                 — OpenCode (159MB binary)
├── /root/.cline/                    — Cline (cron, worktrees)
├── /root/.aider/                    — Aider (caches)
├── /root/.alphapony-secrets/        — AlphaPony credentials
│
│
══════════════════════════════════════════════════════════════
 WINDOWS SIDE (/mnt/c/)
══════════════════════════════════════════════════════════════
│
├── /mnt/c/Users/HP/Desktop/
│   │
│   ├── deepseek/                   ★★★ MAIN WORKING PROJECT ★★★
│   │   │                          (18,364 files, 747MB, no .git)
│   │   │
│   │   ├── super_intelligence_do_browsing/  ★★ MiMo BROWSER ★★
│   │   │   ├── server.py (511 lines)        — v2.5 Playwright server
│   │   │   ├── launch.py                     — Daemon launcher
│   │   │   │
│   │   │   ├── mimo_browser/                 — v2.5 ENGINE (6 files)
│   │   │   │   ├── browser_engine.py (233)   — Playwright automation
│   │   │   │   ├── config.py (81)             — TaskContext, BrowserConfig
│   │   │   │   ├── handlers.py (169)          — Search, Monitor, Extract
│   │   │   │   ├── intelligence.py (288)      — Planning engine
│   │   │   │   └── memory.py (103)            — Episodic/Semantic memory
│   │   │   │
│   │   │   └── mimo_browser_v4/              — v4 FULL REWRITE (7,027 lines)
│   │   │       ├── main.py (1,330 lines)      — Server + Dashboard
│   │   │       ├── config.py (168 lines)      — Encrypted config
│   │   │       ├── network.py (230 lines)      — DoH, connections
│   │   │       ├── basic_ide.py (256 lines)    — BASIC encrypted storage
│   │   │       ├── __init__.py
│   │   │       │
│   │   │       ├── browser/                  — Browser engine layer
│   │   │       │   ├── engine.py (268)    QtWebEngine wrapper
│   │   │       │   ├── reader.py (294)    Reader mode
│   │   │       │   ├── bookmarks.py (266)  Smart bookmarks
│   │   │       │   ├── history.py (178)    Encrypted history
│   │   │       │   ├── downloads.py (199)  Secure downloads
│   │   │       │   ├── tab.py (167)        Tab management
│   │   │       │   ├── tab_group.py (150)  Tab groups
│   │   │       │   ├── workspace.py (133)  Workspace sessions
│   │   │       │   └── notes.py (115)      Per-page notes
│   │   │       │
│   │   │       ├── intelligence/             — AI layer
│   │   │       │   ├── brain.py (305)     Intent detection
│   │   │       │   ├── analyzer.py (370)   Page analysis
│   │   │       │   ├── planner.py (309)    Goal decomposition
│   │   │       │   ├── sidebar.py (322)    AI chat sidebar
│   │   │       │   ├── smart_bar.py (237)  Smart address bar
│   │   │       │   ├── insights.py (264)   Page insights
│   │   │       │   ├── link_preview.py (197) Link previews
│   │   │       │   └── memory.py (311)     Session memory
│   │   │       │
│   │   │       └── security/                 — Security layer
│   │   │           ├── crypto.py (169)       AES-256-GCM
│   │   │           ├── filters.py (355)      Ad/tracker blocking
│   │   │           ├── fingerprint.py (373)  Fingerprint protection
│   │   │           ├── credentials.py (176)  Credential vault
│   │   │           ├── permissions.py (312)  Site permissions
│   │   │           └── storage.py (148)      Encrypted SQLite
│   │   │
│   │   ├── pacman-unified/              ★★ PRODUCTION PAC-MAN ★★
│   │   │   ├── index.html
│   │   │   ├── css/styles.css
│   │   │   ├── js/
│   │   │   │   ├── game.js          — Core game loop
│   │   │   │   ├── pacman.js        — Player controller
│   │   │   │   ├── ghost.js         — Ghost AI
│   │   │   │   ├── maze.js          — Maze generation
│   │   │   │   ├── pathfinding.js   — A* pathfinding
│   │   │   │   ├── input.js         — Keyboard input
│   │   │   │   ├── hud.js           — Heads-up display
│   │   │   │   ├── audio.js         — Sound effects
│   │   │   │   ├── config.js        — Game configuration
│   │   │   │   └── wallet.js        — Crypto wallet connect
│   │   │   ├── contracts/
│   │   │   │   ├── foundry.toml
│   │   │   │   ├── package.json
│   │   │   │   └── README.md
│   │   │   └── data/
│   │   │
│   │   ├── blockchain-portal/          — Pac-Man BASIC portal
│   │   │   ├── pacman.bas (16KB)
│   │   │   ├── pacman.py (17KB)
│   │   │   ├── pacman_yabasic.bas (15KB)
│   │   │   ├── src/learn.bas (21KB)
│   │   │   ├── index.html
│   │   │   ├── data/, src/, assets/
│   │   │   └── run.sh, run.bat
│   │   │
│   │   ├── pacman-ai/                  — AI Pac-Man research
│   │   │   └── index.html (24KB)
│   │   │
│   │   ├── deepseek archive/           — DeepSeek reference docs
│   │   │   ├── deepseek.html (24KB)
│   │   │   ├── deepseek_v4_flash_not_automated.html (21KB)
│   │   │   ├── alpha_pony_showcase.html (18KB)
│   │   │   └── contact_prototype.html (6KB)
│   │   │
│   │   ├── Model Chat/
│   │   │   └── hermes_chat.html (20KB)
│   │   │
│   │   └── .hermes/plans/
│   │       ├── INTEGRATION_PLAN.md
│   │       └── WSL_SYSTEM_ANALYSIS.md  ← THIS FILE
│   │
│   ├── crypto stage/                ★ CRYPTO PROJECTS
│   │   ├── ethos_bounty_hub.html (31KB)
│   │   ├── ethos-bounty-hub/
│   │   │   ├── contracts/TaskBazaar.sol (15KB)
│   │   │   ├── src/, scripts/
│   │   │   ├── API.md (14KB), SMART_CONTRACT.md (18KB)
│   │   │   ├── SECURITY_AUDIT.md (12KB)
│   │   │   └── Dockerfile, docker-compose.yml
│   │   ├── copilot_crypto/
│   │   ├── hazem_navigator/         — Electron app
│   │   │   ├── main.js, preload.js, proxy.js, renderer.js
│   │   │   └── package.json
│   │   └── TEST 1/                   — DeepSeek HTML snapshots
│   │
│   ├── concours tunisia 2026/       — Contest project
│   │
│   └── (shortcuts: VS Code, Opera, Telegram, GitHub Desktop, AnyDesk)
│
├── /mnt/c/Users/HP/Documents/
│   ├── Cline/                       — Cline agent projects
│   │   ├── Hooks/, Rules/, Workflows/
│   │   └── (empty project dirs)
│   ├── GitHub/                      — (empty)
│   └── Hazem Soussi - CV.pdf (110KB)
│
├── /mnt/c/Users/HP/Downloads/
│   ├── DeepSeek books (epub, pdf)
│   ├── Hazem Soussi - CV.pdf
│   ├── portfolio.png (381KB)
│   └── deepseek_html_*.html snapshots
│
├── /mnt/c/Users/hazem/Desktop/
│   └── presence.html (9KB)
│
└── /mnt/d/                         (empty, recycle bin only)
```

---

## GIT REPOSITORIES

| Repository | Location | Remote | Status |
|------------|----------|--------|--------|
| deepseek | `/root/deepseek-repo/` | github.com/hazem-soussi-HA/deepseek | Tracked, outdated |
| hazem.omega | `/root/hazem-omega/` | github.com/hazem-soussi-HA/hazem.omega | Active, CI/CD |
| hazoom-os | `/root/hazem-omega/projects/hazoom-os/` | (sub-repo) | Active |
| portfolio | `/home/hazem/portfolio_final/` | (via .github deploy) | Deployed to Pages |
| deepseek (working) | `/mnt/c/Users/HP/Desktop/deepseek/` | — | No .git, 747MB |

---

## MERGE MAP

```
                  ┌─────────────────────┐
                  │   HAZOOM OS v1      │
                  │   /home/hazem/      │
                  │   12,882 files       │
                  │   Pascal + HTML      │
                  └────────┬────────────┘
                           │ archive
                           ▼
                  ┌─────────────────────┐
                  │   HAZOOM OS v2      │
                  │   omega/projects/    │
                  │   885 files          │
                  │   Python + Solidity  │
                  └────────┬────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │ MiMo Browser │ │  Pac-Man    │ │  DeepSeek   │
   │ v4 (main)   │ │  Unified    │ │  Knowledge  │
   │ 7,027 lines │ │  JS/Sol     │ │  FastAPI    │
   └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
          │               │               │
          │    ┌──────────┘               │
          │    │  wallet.js ←→ contracts  │
          │    │  BASIC IDE ←→ pacman.bas  │
          │    │                          │
          ▼    ▼                          ▼
   ┌─────────────────────────────────────────────┐
   │        super_intelligence_do_browsing/       │
   │        THE UNIFIED BROWSER PROJECT           │
   │        Port 8082                             │
   └─────────────────────────────────────────────┘
          │
          ├── /root/.foundry/  ←→  Solidity contracts
          ├── /root/.ollama/   ←→  Local LLM backend
          ├── /opt/elephant/   ←→  LLM chat UI
          └── /root/.hermes/   ←→  Primary AI agent
```

---

## PROJECT INVENTORY

| # | Project | Files | Size | Lang | Location | Status |
|---|---------|-------|------|------|----------|--------|
| 1 | MiMo Browser v4 | 7,027 | 200KB | Python | /mnt/c/.../ | Active |
| 2 | Pac-Man Unified | 13 | 100KB | JS/Sol | /mnt/c/.../ | Active |
| 3 | HAZOOM OS v1 | 12,882 | 50MB | Pascal/HTML | /home/hazem/ | Legacy |
| 4 | HAZOOM OS v2 | 885 | 30MB | Python/Sol | /root/hazem-omega/ | Active |
| 5 | DeepSeek Knowledge | ~50 | 5MB | Python/React | /root/hazem-omega/ | Active |
| 6 | Portfolio | 7,395 | 100MB | React/Vite | /home/hazem/ | Deployed |
| 7 | Mario GTA6 | 35,491 | 200MB | HTML/JS | /home/hazem/ | Archived |
| 8 | Elephant LLM | 17,343 | 638MB | Python | /opt/ | Standalone |
| 9 | Crypto Bounty Hub | ~20 | 50KB | Sol/HTML | /mnt/c/.../ | WIP |
| 10 | Hermes Agent | ~400 | 50MB | Python | /root/.hermes/ | Active |
| 11 | Spark | 1,057 | 326MB | Java | /opt/ | Installed |
| 12 | Foundry | 5 | 200MB | Rust | /root/.foundry/ | Installed |
| 13 | Ollama | ~10 | 1GB | Go | /root/.ollama/ | Installed |
| 14 | DeepSeek Repo | ~30 | 100KB | HTML/BAS | /root/ | Git |
| 15 | Hazem Navigator | ~10 | 20KB | JS | /mnt/c/.../ | WIP |

---

## KEY FINDINGS

1. **Two HAZOOM OS versions coexist** — Legacy (12K files, Pascal) at /home/hazem/ and modern (885 files, Python/Solidity) at /root/hazem-omega/. Legacy is archived but not deleted.

2. **Working copy vs Git repo** — The main deepseek project on Windows has no .git (18K files, 747MB). The git-tracked version at /root/deepseek-repo/ is outdated.

3. **Three browser projects** — (a) HAZOOM OS browser.html, (b) MiMo Browser v2.5 (Playwright), (c) MiMo Browser v4 (proxy/iframe). v4 is the intended unified version.

4. **AI agent ecosystem** — Hermes (primary), Claude, Codex, OpenCode, Cline, Aider — all configured with session data. Ollama + Elephant for local LLMs.

5. **Blockchain stack** — Foundry (forge/cast/anvil), Solidity contracts (HazoomCoin, TaskBazaar), wallet.js integration, crypto bounty hub.

6. **The /home/hazem/ directory is a goldmine** — Original HAZOOM OS, Mario GTA6 vault, portfolio, and many side projects not yet integrated into the omega monorepo.

---

## FILE TYPE BREAKDOWN (Main deepseek project)

```
.html     4,005  ████████████████████████████  21.8%
.h        2,501  ██████████████                13.6%
.py       1,036  █████                          5.6%
.a          956  █████                          5.2%
.md         710  ████                           3.9%
.sol        54   █                              0.3%
.js         20   █                              0.1%
.css         3   █                              0.0%
.json       39   █                              0.2%
.sh         28   █                              0.2%
.bat        24   █                              0.1%
.bas        23   █                              0.1%
(other)   8,965  ████████████████████████████  48.8%
─────────────────────────────────────────────
TOTAL    18,364        747MB
```

---

*Generated by OWL — Shadow Builder's AI companion*
*May the universe be with us. o/*
