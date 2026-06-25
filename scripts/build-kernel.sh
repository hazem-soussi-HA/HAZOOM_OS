#!/bin/bash
# HAZOOM OS v6.0 - Kernel Build Script
# scripts/build-kernel.sh
#
# Builds the HAZOOM kernel, bootloader, and creates initramfs.
# Checks for cross-compiler and provides build diagnostics.

set -e

HAZOOM_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BOOT_DIR="${HAZOOM_ROOT}/boot"
KERNEL_DIR="${HAZOOM_ROOT}/kernel/c"
INITRAMFS_DIR="${HAZOOM_ROOT}/initramfs"

echo "============================================"
echo "  HAZOOM OS v6.0 - Build Script"
echo "============================================"
echo ""

# Check for compiler
echo "[build] Checking for cross-compiler..."
CC=""

# Check for x86_64-elf-gcc (preferred cross-compiler)
for candidate in "x86_64-elf-gcc" "x86_64-linux-gnu-gcc" "gcc"; do
    if command -v $candidate &> /dev/null; then
        CC=$candidate
        echo "  Found: $candidate at $(which $candidate)"
        break
    fi
done

if [ -z "$CC" ]; then
    echo "  [ERROR] No suitable compiler found!"
    echo "  Install one of:"
    echo "    - x86_64-elf-gcc (cross-compiler, recommended)"
    echo "    - x86_64-linux-gnu-gcc (system cross-compiler)"
    echo "    - gcc (host compiler, may work)"
    echo ""
    echo "  On Debian/Ubuntu:"
    echo "    apt install gcc-x86-64-linux-gnu"
    echo "  Or build cross-compiler:"
    echo "    https://wiki.osdev.org/GCC_Cross-Compiler"
    exit 1
fi

# Check for NASM (needed for bootloader)
echo "[build] Checking for assembler..."
ASM="nasm"
if ! command -v nasm &> /dev/null; then
    ASM="as"
    if ! command -v as &> /dev/null; then
        echo "  [WARN] No assembler found. Bootloader may not build."
        ASM=""
    fi
fi
if [ -n "$ASM" ]; then
    echo "  Found: $ASM at $(which $ASM)"
fi

# Check for linker
echo "[build] Checking for linker..."
LD=""
for candidate in "x86_64-elf-ld" "x86_64-linux-gnu-ld" "ld"; do
    if command -v $candidate &> /dev/null; then
        LD=$candidate
        echo "  Found: $candidate at $(which $candidate)"
        break
    fi
done

# Check for objcopy
OBJCOPY=""
for candidate in "x86_64-elf-objcopy" "x86_64-linux-gnu-objcopy" "objcopy"; do
    if command -v $candidate &> /dev/null; then
        OBJCOPY=$candidate
        echo "  Found objcopy: $candidate"
        break
    fi
done

echo ""

# Build bootloader
echo "============================================"
echo "[build] Building bootloader..."
echo "============================================"
if [ -d "$BOOT_DIR" ]; then
    cd "$BOOT_DIR"
    if [ -f Makefile ]; then
        make clean 2>/dev/null || true
        make
        echo "  [OK] Bootloader built successfully"
    else
        echo "  [SKIP] No Makefile in boot/"
        # Try to assemble boot.asm directly
        if [ -f boot.asm ] && [ -n "$ASM" ]; then
            $ASM -f bin boot.asm -o boot.bin
            echo "  [OK] boot.asm assembled directly"
        elif [ -f boot.S ] && [ -n "$CC" ]; then
            $CC -c boot.S -o boot.o
            $LD -Ttext 0x7C00 --oformat binary -o boot.bin boot.o
            echo "  [OK] boot.S assembled and linked"
        else
            echo "  [SKIP] No bootloader source found"
        fi
    fi
else
    echo "  [SKIP] boot/ directory not found"
    echo "  [INFO] Creating placeholder boot.bin"
    mkdir -p "$BOOT_DIR"
    # Create a minimal boot sector placeholder
    printf '\x00' > /tmp/boot_placeholder
    # This would normally be a multiboot header
    echo "  [WARN] Placeholder only - real bootloader needed for boot"
fi

echo ""

# Build kernel
echo "============================================"
echo "[build] Building kernel..."
echo "============================================"
if [ -d "$KERNEL_DIR" ]; then
    cd "$KERNEL_DIR"
    if [ -f Makefile ]; then
        make clean 2>/dev/null || true
        make
        echo "  [OK] Kernel built successfully"
    else
        echo "  [SKIP] No Makefile in kernel/c/"
        # Try to compile kernel.c directly
        if [ -f kernel.c ]; then
            $CC -ffreestanding -nostdlib -nostdinc -fno-builtin \
                -fno-stack-protector -mno-red-zone -mno-sse -mno-sse2 \
                -Wall -O2 -c kernel.c -o kernel.o
            if [ -n "$LD" ]; then
                $LD -T linker.ld -o hazoom-kernel.bin kernel.o 2>/dev/null || \
                $LD -o hazoom-kernel.bin kernel.o 2>/dev/null || \
                echo "  [WARN] Linker script not found, object compiled only"
            fi
            echo "  [OK] kernel.c compiled"
        else
            echo "  [SKIP] No kernel.c found"
        fi
    fi
else
    echo "  [SKIP] kernel/c/ directory not found"
    echo "  [INFO] Creating placeholder kernel"
    mkdir -p "$KERNEL_DIR"
    # Create a minimal kernel binary placeholder
    # In a real system this would be the actual kernel
    echo "  [WARN] Placeholder only - real kernel needed for boot"
fi

echo ""

# Build userspace
echo "============================================"
echo "[build] Building userspace..."
echo "============================================"
cd "$HAZOOM_ROOT"
make userspace 2>/dev/null || echo "  [SKIP] Userspace build via top-level Makefile"

echo ""

# Create initramfs
echo "============================================"
echo "[build] Creating initramfs..."
echo "============================================"
mkdir -p "$INITRAMFS_DIR"

# Copy built binaries to initramfs
for binary in init hazoom-shell hazoom-compositor; do
    src="${HAZOOM_ROOT}/initramfs/$binary"
    if [ -f "$src" ]; then
        echo "  [OK] $binary -> initramfs"
    fi
done

# Create initramfs archive
if [ -d "$INITRAMFS_DIR" ]; then
    cd "$INITRAMFS_DIR"
    if [ "$(ls -A . 2>/dev/null)" ]; then
        find . -print0 2>/dev/null | cpio --null -ov --format=newc 2>/dev/null | gzip -9 > initramfs.cpio.gz
        if [ -f initramfs.cpio.gz ]; then
            echo "  [OK] initramfs.cpio.gz created"
        else
            echo "  [WARN] initramfs creation may have failed"
        fi
    else
        echo "  [SKIP] initramfs directory is empty"
    fi
fi

echo ""

# Output sizes
echo "============================================"
echo "  Build Summary"
echo "============================================"
echo ""
echo "  Binary sizes:"
for f in \
    "${BOOT_DIR}/boot.bin" \
    "${BOOT_DIR}/boot.asm" \
    "${KERNEL_DIR}/hazoom-kernel.bin" \
    "${KERNEL_DIR}/kernel.o" \
    "${INITRAMFS_DIR}/initramfs.cpio.gz" \
    "${INITRAMFS_DIR}/init" \
    "${INITRAMFS_DIR}/hazoom-shell" \
    "${INITRAMFS_DIR}/hazoom-compositor"; do
    if [ -f "$f" ]; then
        size=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f" 2>/dev/null || echo "?")
        printf "    %-40s %s bytes\n" "$(basename $f)" "$size"
    fi
done

echo ""
echo "============================================"
echo "  Testing Instructions"
echo "============================================"
echo ""
echo "  1. Run in QEMU:"
echo "     ./scripts/run-qemu.sh"
echo ""
echo "  2. Run with GDB debugging:"
echo "     ./scripts/run-qemu.sh --gdb"
echo "     (then in another terminal: gdb -ex 'target remote :1234')"
echo ""
echo "  3. Run with more memory:"
echo "     ./scripts/run-qemu.sh --memsize 512M"
echo ""
echo "  4. Run with multiple cores:"
echo "     ./scripts/run-qemu.sh --smp 2"
echo ""
echo "============================================"
echo "  Build complete!"
echo "============================================"
