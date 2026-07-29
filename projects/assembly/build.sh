#!/bin/bash
# build.sh — Build all HAZOOM Assembly generators
# Usage: ./build.sh [terrain|earth|all|server]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Check for nasm
if ! command -v nasm &> /dev/null; then
    echo "Installing nasm..."
    apt-get update -qq && apt-get install -y -qq nasm 2>/dev/null || {
        echo "Cannot install nasm. Please install manually."
        exit 1
    }
fi

build_terrain() {
    echo "[1/2] Assembling terrain_gen.asm..."
    nasm -f elf64 terrain_gen.asm -o terrain_gen.o -g
    echo "[2/2] Linking terrain_gen..."
    ld terrain_gen.o -o terrain_gen
    echo "  -> terrain_gen ready"
}

build_earth() {
    echo "[1/2] Assembling earth_sim.asm..."
    nasm -f elf64 earth_sim.asm -o earth_sim.o -g
    echo "[2/2] Linking earth_sim..."
    ld earth_sim.o -o earth_sim
    echo "  -> earth_sim ready"
}

run_server() {
    echo "Starting HAZOOM server..."
    cd server
    if [ ! -d node_modules ]; then
        npm install
    fi
    node server.js
}

case "${1:-all}" in
    terrain)
        build_terrain
        ;;
    earth)
        build_earth
        ;;
    all)
        build_terrain
        build_earth
        echo ""
        echo "=== Build complete ==="
        echo "Run ./build.sh server to start the dashboard"
        ;;
    server)
        run_server
        ;;
    *)
        echo "Usage: $0 [terrain|earth|all|server]"
        echo "  all      — Build both generators (default)"
        echo "  server   — Start the unified dashboard server"
        exit 1
        ;;
esac
