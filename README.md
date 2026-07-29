# HAZOOM OS — Unified Ecosystem Platform

> **Creator:** Hazem Soussi (HA) © 2024-2026
> **Status:** v6.0 — CONVERGENCE — Real OS + Full-Stack Cloud Ecosystem

## Overview

HAZOOM OS is a unified platform that integrates all projects under one roof:

- **Real OS** — Bare-metal kernel (C, x86-64) with Q-Learning scheduler
- **Web Desktop** — Browser-based simulation with app launcher
- **AI Engine** — Multi-model AI (Ollama, OpenRouter, local LLMs)
- **Microservices** — 20+ integrated services
- **Deployment** — Docker Compose, Kubernetes, LXC, bare metal

## Architecture

```
HAZOOM_OS/
├── kernel/          # C kernel (x86-64, long-mode, paging, buddy allocator)
├── boot/            # UEFI bootloader
├── core/            # OS core modules (JS — web simulation)
├── server.js        # Main Express entry point
├── apps/            # Desktop web apps (AI, tools, games, docs)
├── services/        # 20+ microservices
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
```

### Full Docker Stack
```bash
./start.sh docker
# All 20+ services start automatically
```

### Real Kernel in QEMU
```bash
make kernel && ./start.sh kernel
```

## Service Map

| Port | Service | Description |
|------|---------|-------------|
| 3000 | HAZOOM OS | Web desktop + kernel API |
| 8080 | Planet Earth | 3D globe visualization |
| 8001 | Planet News | RSS news feed aggregator |
| 8002 | Planet History | Historical events timeline |
| 4100 | Birds | Bird species encyclopedia |
| 4000 | Hazoom POD | Print-on-demand store |
| 5055 | Ornith Chat | Ollama-powered AI chat |
| 5000 | Collab Beat | AI collaborative music |
| 6000 | DESCER | Drum machine composer |
| 4747 | Sovereign State | AI ledger system |
| 7000 | Bouzelfa | Web community platform |
| 8003 | Hazoom Intel | Business intelligence |
| 8005 | Serotonin | Creative AI engine |
| 9001 | Mario GTA6 | Game demo |
| 9002 | Portfolio | Personal website |

## AI Models

- **Ollama** (local): `qwen2.5-coder:3b`, `deepseek-r1`, `llama3`
- **OpenRouter** (cloud): GPT-4, Claude, Gemini
- **Q-Learning**: Hybrid tabular/DQN reinforcement learning

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
