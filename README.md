# HAZOOM OS — Unified Ecosystem Platform

> **Creator:** Hazem Soussi (HA) © 2024-2026
> **Status:** v6.0 — CONVERGENCE — the local-first AI OS with a real kernel

## Overview

HAZOOM OS is a unified platform that integrates all projects under one roof:

- **Real OS** — Bare-metal kernel (C, x86-64) with Q-Learning scheduler
- **Web Desktop** — Browser-based shell with app launcher
- **AI Engine** — Multi-model local AI (Ollama). No cloud required
- **Microservices** — 22 service directories, 7 wired into the launcher
- **Deployment** — Docker Compose, Kubernetes, LXC, systemd, bare metal

### What is true right now

This section is measured, not promised. Open **Convergence** in the desktop,
or:

```bash
curl -s localhost:3000/api/benchmark -H "Authorization: Bearer $TOKEN" | jq .score
curl -s localhost:3000/api/surface   -H "Authorization: Bearer $TOKEN" | jq .tally
```

If a claim here ever disagrees with those two endpoints, the claim is wrong.
That rule is the point: a project this size fails by documentation drifting
away from reality, not by code being bad.

## Architecture

```
HAZOOM_OS/
├── kernel/          # C kernel (x86-64, long mode) + Pascal kernel modules
├── boot/            # UEFI bootloader
├── core/            # OS core modules (JS — the shell)
├── server.js        # Main Express entry point
├── apps/            # Desktop web apps (AI, tools, games, docs)
├── services/        # 22 service directories
│   ├── ai/          # AI reasoning engine
│   ├── api-gateway/ # API gateway & auth
│   ├── orchestrator/# Service orchestrator
│   ├── planet-earth/         # 3D Earth visualization
│   ├── planet-earth-news/    # RSS news aggregator
│   ├── planet-earth-history/ # Historical timeline
│   ├── birds-encyclopedia/   # Interactive bird DB
│   ├── hazoom-pod/           # Print-on-demand e-commerce
│   ├── chatdev-ornith/       # AI chat (Ollama)
│   ├── collaborative-beat/   # AI music collab
│   ├── descer/               # Drum machine
│   ├── sovereign-state/      # AI ledger state
│   ├── bouzelfa-ndhifa/      # Web community app
│   ├── hazoom-intelligence/  # Analytics dashboard
│   ├── serotonin-engine/     # Creative AI engine
│   ├── general-intelligence/ # Infinity reasoning engine
│   ├── mirror-transcendance/ # AI mirror framework
│   └── mario-gta6/           # Game demo
├── projects/        # Standalone projects
│   ├── open-world/  # Godot 3D game
│   ├── portfolio/   # Portfolio website (Vite)
│   ├── assembly/    # x86 assembly terrain sim
│   ├── maps/        # Map visualizations
│   └── map-data/    # Map config & templates
├── infrastructure/  # DevOps & security
│   ├── scripts/     # Setup & deployment
│   └── server/      # Server security configs
└── contracts/       # Smart contracts (Solidity)
```

## Quick Start

### Browser Simulation
```bash
./start.sh simulation
# Open http://localhost:3000
# Visual showcase: http://localhost:3000/showcase
```

### Full Docker Stack
```bash
./start.sh docker
# Brings up the compose stack. Which services answer depends on your machine —
# ask the OS rather than trusting this file:
#   curl -s localhost:3000/api/services -H "Authorization: Bearer $TOKEN" | jq .stats
```

### Local services only
```bash
bash services/planet-earth/hazoom-os-launch.sh start          # the 7 wired services
bash services/planet-earth/hazoom-os-launch.sh status         # what is actually up
```

### Real Kernel in QEMU
```bash
make kernel && ./start.sh kernel
```

## Service Map

The **Status** column is not decoration. It is the answer from
`GET /api/services` at the moment this table was last reconciled, and it is
expected to differ on your machine. Treat this as orientation, never as
truth — `/api/surface` is truth.

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| 3000 | HAZOOM OS | Shell + kernel API | always up |
| 8080 | Planet Earth | 3D globe visualization | wired to launcher |
| 8001 | Planet News | RSS news aggregator | wired to launcher |
| 4100 | Birds | Bird species encyclopedia | wired to launcher |
| 4000 | Hazoom POD | Print-on-demand store | wired to launcher |
| 6000 | DESCER | Drum machine composer | wired to launcher |
| 5055 | Ornith Chat | Local-model AI chat | wired to launcher |
| 5000 | Collab Beat | AI collaborative music | wired to launcher |
| 8100 | HAZOOM XP | Separate work, GPL-3.0-only | `scripts/serve-xp.sh` |
| 8002 | Planet History | Historical events timeline | code present, needs a token |
| 4747 | Sovereign State | AI ledger system | code present, not launched |
| 7000 | Bouzelfa | Web community platform | code present, needs `npm install` |
| 8003 | Hazoom Intel | Business intelligence | code present, needs `npm install` |
| 8004 | General Intelligence | Infinity reasoning engine | code present, not launched |
| 8005 | Serotonin | Creative AI engine | code present, not launched |
| 8006 | Mirror Transcendance | AI mirror framework | code present, not launched |
| 8200 | DeepSeek Knowledge | Local knowledge base | code present, not launched |
| 8440 | JEV 1.13 | Local decision agent | code present, not launched |
| 9001 | Mario GTA6 | Game demo | code present, not launched |

"Code present, not launched" is a real and respectable state. It means the
work exists and is one command away from running. It is not the same as
broken, and the OS reports the two separately on purpose.

## AI Models

- **Local only** (Ollama on loopback): the OS selects a responsive installed
  model at boot. Nothing requires a cloud model, and no API key is needed.
  `GET /api/intelligence/status` reports what is actually installed and which
  one is active.
- **Q-Learning**: hybrid tabular/DQN, trained on *measured* state — real
  AI latency and real service availability, not constants. See
  `GET /api/qlearner/policy`.

## Deployment

```bash
# Docker (production)
docker compose up --build -d

# Kubernetes
kubectl apply -f deployment/k8s/hazoom-fullstack.yaml

# LXC
lxc launch ubuntu:24.04 hazoom -c < deployment/lxc/hazoom-os-lxc.yaml
```

## License

Proprietary — All Rights Reserved © Hazem Soussi
