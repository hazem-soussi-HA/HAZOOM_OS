#!/bin/bash
# HAZOOM OS v6.0 - QEMU Test Runner
# scripts/run-qemu.sh
#
# Runs HAZOOM OS in QEMU with OVMF UEFI firmware.
# Usage: ./run-qemu.sh [--gdb] [--smp N] [--memsize SIZE]

set -e

# Configuration
HAZOOM_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KERNEL_BIN="${HAZOOM_ROOT}/kernel/c/hazoom-kernel.bin"
INITRAMFS="${HAZOOM_ROOT}/initramfs/initramfs.cpio.gz"
QEMU_BIN="qemu-system-x86_64"
GDB_FLAGS=""
SMP_CORES=1
MEM_SIZE="256M"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --gdb)
            GDB_FLAGS="-S -S"
            shift
            ;;
        --smp)
            SMP_CORES="$2"
            shift 2
            ;;
        --memsize)
            MEM_SIZE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--gdb] [--smp N] [--memsize SIZE]"
            exit 1
            ;;
    esac
done

echo "============================================"
echo "  HAZOOM OS v6.0 - QEMU Launcher"
echo "============================================"
echo ""

# Check for OVMF firmware
echo "[qemu] Checking for OVMF firmware..."
OVMF_PATH=""
for path in \
    "/usr/share/OVMF/OVMF_CODE.fd" \
    "/usr/share/qemu/OVMF.fd" \
    "/usr/share/ovmf/OVMF.fd" \
    "/usr/share/qemu/OVMF_CODE.fd" \
    "/usr/share/x86_64-linux-gnu/ovmf/OVMF_CODE.fd"; do
    if [ -f "$path" ]; then
        OVMF_PATH="$path"
        echo "  Found OVMF: $path"
        break
    fi
done

if [ -z "$OVMF_PATH" ]; then
    echo "  [WARN] OVMF firmware not found!"
    echo "  [WARN] Looking for OVMF packages..."
    echo ""
    echo "  Install with:"
    echo "    Debian/Ubuntu: apt install ovmf"
    echo "    Fedora:         dnf install edk2-ovmf"
    echo "    Arch:           pacman -S ovmf"
    echo ""
    echo "  Falling back to no UEFI (using -kernel directly)..."
    USE_UEFI=0
else
    USE_UEFI=1
fi

# Check for QEMU
echo "[qemu] Checking for QEMU..."
if ! command -v $QEMU_BIN &> /dev/null; then
    echo "  [ERROR] $QEMU_BIN not found!"
    echo "  Install with:"
    echo "    Debian/Ubuntu: apt install qemu-system-x86"
    echo "    Fedora:         dnf install qemu-system-x86"
    echo "    Arch:           pacman -S qemu-system-x86"
    exit 1
fi
echo "  Found: $(which $QEMU_BIN)"

# Build kernel if not built
echo "[qemu] Checking kernel..."
if [ ! -f "$KERNEL_BIN" ]; then
    echo "  Kernel not found at: $KERNEL_BIN"
    echo "  Attempting to build..."
    echo ""
    cd "$HAZOOM_ROOT"
    make kernel
    if [ ! -f "$KERNEL_BIN" ]; then
        echo "  [ERROR] Kernel build failed!"
        exit 1
    fi
else
    echo "  Kernel found: $KERNEL_BIN"
fi

# Build initramfs if not built
echo "[qemu] Checking initramfs..."
if [ ! -f "$INITRAMFS" ]; then
    echo "  Initramfs not found, building userspace..."
    cd "$HAZOOM_ROOT"
    make userspace
    # Create initramfs
    echo "  Creating initramfs..."
    cd "${HAZOOM_ROOT}/initramfs"
    find . -print0 | cpio --null -ov --format=newc 2>/dev/null | gzip -9 > "$INITRAMFS"
    echo "  Initramfs created: $INITRAMFS"
else
    echo "  Initramfs found: $INITRAMFS"
fi

# Print configuration
echo ""
echo "============================================"
echo "  Launch Configuration"
echo "============================================"
echo "  Kernel:    $KERNEL_BIN"
echo "  Initramfs: $INITRAMFS"
echo "  Memory:    $MEM_SIZE"
echo "  SMP:       $SMP_CORES cores"
echo "  UEFI:      $([ $USE_UEFI -eq 1 ] && echo $OVMF_PATH || echo 'disabled')"
echo "  GDB:       $([ -n "$GDB_FLAGS" ] && echo 'enabled (port 1234)' || echo 'disabled')"
echo "============================================"
echo ""

# Build QEMU command
QEMU_CMD="$QEMU_CMD"
QEMU_CMD="$QEMU_CMD -m $MEM_SIZE"
QEMU_CMD="$QEMU_CMD -smp $SMP_CORES"
QEMU_CMD="$QEMU_CMD -serial stdio"
QEMU_CMD="$QEMU_CMD -kernel $KERNEL_BIN"

if [ $USE_UEFI -eq 1 ]; then
    QEMU_CMD="$QEMU_CMD -bios $OVMF_PATH"
fi

if [ -f "$INITRAMFS" ]; then
    QEMU_CMD="$QEMU_CMD -initrd $INITRAMFS"
fi

if [ -n "$GDB_FLAGS" ]; then
    QEMU_CMD="$QEMU_CMD $GDB_FLAGS"
fi

# Add debug serial
QEMU_CMD="$QEMU_CMD -monitor none"

echo "============================================"
echo "  HAZOOM OS running in QEMU"
echo "  Press Ctrl-A X to exit."
echo "============================================"
echo ""
echo "  Command: $QEMU_BIN $QEMU_CMD"
echo ""

# Run QEMU
$QEMU_BIN $QEMU_CMD

echo ""
echo "[qemu] QEMU exited."
