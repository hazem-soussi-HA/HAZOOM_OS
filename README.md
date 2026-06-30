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

## License

HA License — Hazem Soussi (HA) © 2024-2026

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.