# HAZOOM OS — v6.0 REAL OPERATING SYSTEM

> **STATUS: Real kernel built. Ready for testing and deployment.**

## Overview

HAZOOM OS is transforming from a browser simulation (v4.0) into a **real operating system** that boots on bare metal. The JavaScript simulation becomes the userspace, while the new C kernel provides true OS capabilities.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   HAZOOM OS v6.0                       │
├─────────────────────────────────────────────────────────┤
│  Userspace (Browser-based simulation)                   │
│  - AI Assistant                                       │
│  - Consciousness Engine                                 │
│  - Desktop Environment                                  │
├─────────────────────────────────────────────────────────┤
│  Real Kernel (C, bare metal)                            │
│  - Process Management                                   │
│  - Memory Management (Buddy Allocator)                  │
│  - Q-Learning Scheduler                                 │
│  - File System                                          │
│  - Device Drivers                                       │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Option 1: Browser Simulation (v4.0)
```bash
./start.sh simulation
# Open http://localhost:3000/os.html
```

### Option 2: Real Kernel in QEMU
```bash
./start.sh kernel
# Or build manually:
make kernel
make run-qemu
```

### Option 3: Build ISO
```bash
./start.sh iso
```

## Kernel Structure

```
kernel/
├── entry.asm           # Assembly entry point
├── main.c              # Kernel main
├── kernel.h            # Kernel headers
├── io.h                # I/O primitives
├── linker.ld           # Linker script
├── Makefile
├── mm/                 # Memory management
│   └── pmm.c           # Physical memory manager
├── proc/               # Process management
│   └── process.c       # Process scheduler
├── fs/                 # File system
│   └── vfs.c           # Virtual file system
├── dev/                # Device drivers
├── ai/                 # Q-learning in kernel
│   └── qtable.c        # Tabular Q-learning
```

## Features

| Feature | Simulation | Real Kernel |
|---------|------------|-------------|
| Process Management | ✅ | ✅ |
| Memory Management | ✅ | ✅ |
| File System | ✅ | ✅ |
| Q-Learning | ✅ | ✅ |
| Consciousness | ✅ | Planned |
| Bare Metal Boot | ❌ | ✅ |

## Requirements

- **Simulation Mode**: Node.js 18+
- **Kernel Mode**: GCC, NASM, QEMU

## Installation

```bash
# Install build tools
sudo apt-get install gcc nasm qemu-system-x86

# Or use the Makefile
make dev-install

# Build and run
make kernel
make run-qemu
```

## API Endpoints (Simulation)

| Endpoint | Description |
|----------|-------------|
| `/api/status` | System state |
| `/api/processes` | Process list |
| `/api/memory` | Memory stats |
| `/api/qlearner` | Q-learning status |
| `/api/consciousness` | Consciousness status |

## Fullstack Services (the OS as the brain for everything)

HAZOOM OS orchestrates Hazem Soussi's fullstack projects as first-class,
loopback-only, offline-first **services**. Single source of truth for launch:
`planet_earth/hazoom-os-launch.sh`. Every service binds `127.0.0.1` ONLY
(no LAN exposure, no runtime egress — blackout-proof).

| Service            | Port  | URL                          | What it is                                  |
|--------------------|-------|------------------------------|---------------------------------------------|
| planet_earth      | 8080  | http://127.0.0.1:8080/       | Offline WebGL globe + Temperature Meteorology |
| planet_earth_news | 8000  | https://127.0.0.1:8000/      | Sovereign local news / climate feeds        |
| birds_encyclopedia | 4100  | http://127.0.0.1:4100/       | Birds + natural-voice 3D atlas              |
| hazoom_pod         | 4000  | http://127.0.0.1:4000/       | Print-on-demand platform                    |
| hazoom_os          | 3000  | http://127.0.0.1:3000/       | This OS desktop                             |
| collaborative_beat | 5000  | http://127.0.0.1:5000/       | Local-first neural core / reasoning         |
| **chatdev (Ornith)** | **5055** | **http://127.0.0.1:5055/** | **Loopback-only offline chatbox → local Ollama** |

**ChatDev / Ornith** — a sovereign, offline-first web chatbox for talking to a
local Ollama model. Integrated 2026-07-20. Launched via its own `run_ornith.sh`
(loopback bind + `keep_alive`). Honest caveat: it defaults to `ornith:35b`,
which is **dead on CPU-only hardware** (0 tokens in 120s). On this box set
`ORNITH_MODEL` to a small responsive model, e.g.
`ORNITH_MODEL=tinyllama:1.1b bash hazoom-os-launch.sh start`.

## Intelligence Core (real local-LLM reasoning)

The OS ships a genuine reasoning layer (`core/intelligence-core.js`) that
auto-selects the fastest *responsive* local Ollama model at boot and fails
soft when none is available. Endpoints:

| Endpoint | Description |
|----------|-------------|
| `/api/intelligence/status` | Active model, offline flag |
| `/api/intelligence/health` | Probe Ollama + model availability |
| `/api/intelligence/think`   | One-shot reasoned reply |
| `/api/intelligence/stream`  | Token-streamed reply |
| `/api/intelligence/reset`   | Clear conversation memory |

## License

HA License — Hazem Soussi (HA) © 2024-2026

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.