#!/bin/bash
set -e

HAZOOM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HAZOOM_DIR"

MODE="${1:-simulation}"

print_banner() {
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              HAZOOM OS v6.0                                ║"
    echo "║         Full-Stack Intelligent Operating System             ║"
    echo "║         Creator: Hazem Soussi (HA) © 2024-2026             ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
}

print_banner

case "$MODE" in
    simulation)
        if ! command -v node &> /dev/null; then
            echo "[ERROR] Node.js not found. Please install Node.js 18+"
            exit 1
        fi
        if [ ! -d "node_modules" ]; then
            echo "[INFO] Installing dependencies..."
            npm install
        fi
        echo "[INFO] Starting HAZOOM OS in browser simulation mode..."
        echo "[INFO] Access the OS at http://localhost:3000"
        echo "[INFO] Dashboard: http://localhost:3000/os.html"
        echo "[INFO] v5 Desktop: http://localhost:3000/os-v5.html"
        echo "[INFO] v3 Desktop: http://localhost:3000/index.html"
        exec node server.js
        ;;

    kernel)
        echo "[INFO] Starting HAZOOM OS in bare-metal kernel mode..."
        if [ ! -f kernel/c/hazoom-kernel.bin ]; then
            echo "[INFO] Kernel not built. Building now..."
            make kernel
        fi
        echo "[INFO] Launching QEMU with OVMF UEFI..."
        exec qemu-system-x86_64 \
            -bios /usr/share/ovmf/OVMF.fd \
            -drive format=raw,file=kernel/c/hazoom-kernel.bin \
            -serial stdio \
            -s \
            -m 512M \
            -machine q35,accel=kvm:hvf:tcg \
            -cpu max
        ;;

    iso)
        echo "[INFO] Building HAZOOM OS ISO..."
        make iso
        echo "[INFO] ISO built: hazoom-os.iso"
        ;;

    docker)
        echo "[INFO] Starting full stack with Docker Compose..."
        if [ ! -f .env ]; then
            echo "[INFO] Creating .env from .env.example..."
            cp .env.example .env
        fi
        docker compose up --build -d
        echo "[INFO] All services started."
        echo "[INFO] Frontend:         http://localhost:80"
        echo "[INFO] Backend:          http://localhost:3000"
        echo "[INFO] AI API:           http://localhost:8000"
        echo "[INFO] Gateway:          http://localhost:8080"
        echo "[INFO] WS:               ws://localhost:9090"
        echo "[INFO] Planet Earth:     http://localhost:8080"
        echo "[INFO] Planet News:      http://localhost:8001"
        echo "[INFO] Planet History:   http://localhost:8002"
        echo "[INFO] Hazoom POD:       http://localhost:4000"
        echo "[INFO] Birds:            http://localhost:4100"
        echo "[INFO] Collab Beat:      http://localhost:5000"
        echo "[INFO] Ornith Chat:      http://localhost:5055"
        echo "[INFO] DESCER:           http://localhost:6000"
        echo "[INFO] Bouzelfa:         http://localhost:7000"
        echo "[INFO] Sovereign State:  http://localhost:4747"
        echo "[INFO] Hazoom Intel:     http://localhost:8003"
        echo "[INFO] General Intel:    http://localhost:8004"
        echo "[INFO] Serotonin:        http://localhost:8005"
        echo "[INFO] Mario GTA6:       http://localhost:9001"
        echo "[INFO] Portfolio:        http://localhost:9002"
        ;;

    docker:stop)
        docker compose down
        echo "[INFO] All services stopped."
        ;;

    docker:logs)
        docker compose logs -f
        ;;

    clean)
        echo "[INFO] Cleaning build artifacts..."
        make clean
        rm -rf node_modules
        echo "[INFO] Done."
        ;;

    dev)
        echo "[INFO] Starting development environment..."
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        export NODE_ENV=development
        export LOG_LEVEL=debug
        exec node --watch server.js
        ;;

    help|--help|-h)
        echo "Usage: $0 [mode]"
        echo ""
        echo "Modes:"
        echo "  simulation   Run browser-based OS simulation (default)"
        echo "  kernel       Boot real kernel in QEMU"
        echo "  iso          Build bootable ISO"
        echo "  docker       Start full stack with Docker Compose"
        echo "  docker:stop  Stop Docker services"
        echo "  docker:logs  View Docker service logs"
        echo "  dev          Start with auto-reload for development"
        echo "  clean        Clean all build artifacts"
        echo ""
        echo "Kernel Commands:"
        echo "  make kernel              - Build the C kernel"
        echo "  make run-qemu            - Run kernel in QEMU"
        echo "  make clean               - Clean kernel build"
        echo "  make dev-install         - Install dev dependencies"
        echo ""
        echo "Service Commands:"
        echo "  ./scripts/unified-server.sh [start|stop|restart]"
        echo "  ./scripts/start-all.sh"
        echo "  ./scripts/stop-all.sh"
        ;;

    *)
        echo "[ERROR] Unknown mode: $MODE"
        echo "Usage: $0 [simulation|kernel|iso|docker|docker:stop|docker:logs|dev|clean|help]"
        exit 1
        ;;
esac
