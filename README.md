# HAZOOM OS — v4.0.0

**Refactored Operating System** — Browser-based OS with real kernel simulation, process management, memory management, file system, device I/O, and security.

## Quick Start

```bash
./start.sh
# Open http://localhost:3000/os.html
```

## Architecture

```
HAZOOM OS v4.0
├── server.js              ← Unified Node.js server (Express + WebSocket)
├── os.html                ← OS Dashboard (modular, API-driven)
├── core/
│   ├── kernel.js          ← Full OS kernel (Process, Memory, FS, Devices, Security)
│   ├── os-desktop.js      ← Desktop environment (window manager)
│   ├── os-filesystem.js   ← Virtual file system
│   ├── consciousness.js   ← AI consciousness engine
│   └── security.js        ← Security system
├── kernel/                ← Pascal kernel modules
│   ├── aether_engine.pas
│   ├── consciousness.pas
│   ├── neural_core.pas
│   ├── deep_consciousness.pas
│   ├── syscall_atlas.pas
│   └── alpha.pas
├── apps/                  ← Applications and games
│   ├── games/
│   │   ├── super-mario-gta6/
│   │   ├── chess-v2/
│   │   └── neon-drift/
│   └── terminal.html
├── services/              ← Backend services
│   ├── ai/                ← AI services
│   ├── api-gateway/       ← API gateway
│   ├── orchestrator/      ← Service orchestrator
│   └── reactive/          ← Event bus
├── python/                ← Python backend
│   ├── hazoom_os/         ← System layer (aether, automation)
│   └── hazoom-os/         ← ML training infrastructure
├── config/                ← Configuration
└── scripts/               ← Launch utilities
```

## OS Concepts Implemented

### Process Management
- Process Control Blocks (PCB) with PID, PPID, state, priority, CPU time
- Process states: NEW → READY → RUNNING → WAITING → TERMINATED
- Round-Robin scheduler with time quantum (100ms)
- Ready queue and blocked queue
- Process creation, termination, blocking, unblocking

### Memory Management
- Virtual memory with paging (4KB pages)
- Page table and frame table
- Memory allocation and deallocation per process
- Swap space management
- Page fault tracking

### File System
- Unix-like hierarchical file system
- Standard directory structure (/bin, /etc, /home, /var, etc.)
- File permissions (rwx), ownership, inodes
- Journal for crash recovery
- File operations: create, read, write, delete

### Device I/O
- Device registry (console, keyboard, display, disk, network, timer)
- Interrupt-driven I/O
- Device status tracking

### Security
- User authentication and sessions
- Ring-based isolation (Ring 0: kernel, Ring 3: user)
- Permission checking
- Audit logging

### Boot Sequence
- POST (Power-On Self-Test)
- Bootloader (GRUB simulation)
- Kernel initialization
- Subsystem initialization (memory, FS, devices, security)
- Init process and system services
- Scheduler activation

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/status | Full system state |
| POST | /api/boot | Boot kernel |
| POST | /api/shutdown | Shutdown kernel |
| POST | /api/tick?count=N | Advance scheduler N ticks |
| GET | /api/processes | List all processes |
| POST | /api/processes/create | Create new process |
| POST | /api/processes/:pid/terminate | Kill process |
| POST | /api/processes/:pid/block | Block process |
| POST | /api/processes/:pid/unblock | Unblock process |
| GET | /api/memory | Memory statistics |
| POST | /api/memory/allocate | Allocate memory |
| GET | /api/fs/list?path= | List directory |
| GET | /api/fs/read?path= | Read file |
| POST | /api/fs/write | Write file |
| POST | /api/fs/mkdir | Create directory |
| POST | /api/fs/delete | Delete file/directory |
| GET | /api/log?lines=N | Kernel log (last N lines) |
| GET | /health | Health check |

## WebSocket

Real-time kernel updates via WebSocket:
- Connect to `ws://localhost:3000`
- Receives tick updates every 2 seconds
- Message types: `connected`, `tick`

## Terminal Commands

The OS dashboard includes a full terminal emulator with:
- `status` — System status
- `ps` — Process list
- `mem` — Memory info
- `ls`, `cat`, `cd`, `pwd` — File operations
- `kill`, `create` — Process management
- `tick` — Advance scheduler
- `boot`, `shutdown` — Kernel control
- `neofetch` — System banner

## Requirements

- Node.js 18+

## License

HA License — Hazem Soussi (HA) © 2024-2026
