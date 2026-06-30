#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== HAZOOM OS v6.0 - QEMU Emulator ==="

if [ ! -f kernel/hazoom-kernel.bin ]; then
    echo "Kernel not found. Building..."
    cd kernel && make
    cd ..
fi

echo "Starting QEMU..."
echo "Serial console output will appear below."
echo ""

QEMU_OPTS=(
    -drive format=raw,file=kernel/hazoom-kernel.bin
    -serial stdio
    -display none
    -m 32M
    -no-reboot
)

if command -v qemu-system-x86_64 &> /dev/null; then
    qemu-system-x86_64 "${QEMU_OPTS[@]}"
elif command -v qemu-system-i386 &> /dev/null; then
    qemu-system-i386 "${QEMU_OPTS[@]}"
else
    echo "ERROR: QEMU not found. Install with: apt install qemu-system-x86"
    exit 1
fi