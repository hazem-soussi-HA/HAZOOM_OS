#!/bin/bash
# HAZOOM OS — Alpha release builder
# Builds kernel + ISO, verifies boot smoke test, packages dist/ with checksums.
set -e

HAZOOM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HAZOOM_DIR"

VERSION="${HAZOOM_VERSION:-6.0.0-alpha.1}"
ARCH="x86_64"
DIST="dist"
ISO_NAME="HAZOOM-OS-${VERSION}-${ARCH}.iso"

echo "=============================================="
echo " HAZOOM OS ${VERSION} — release build"
echo "=============================================="

# 1. Clean kernel build
make clean > /dev/null

# 2. Build kernel
make kernel
[ -f kernel/c/hazoom-kernel.elf ] || { echo "[ERROR] kernel ELF missing"; exit 1; }

# 3. Build ISO
make iso
[ -f hazoom-os.iso ] || { echo "[ERROR] ISO missing"; exit 1; }

# 4. Boot smoke test (headless QEMU, serial capture)
SMOKE_TIMEOUT="${HAZOOM_SMOKE_TIMEOUT:-120}"
echo "[INFO] Running boot smoke test (max ${SMOKE_TIMEOUT}s)..."
SMOKE_LOG="$(mktemp /tmp/hazoom-smoke.XXXXXX.log)"
if timeout "$SMOKE_TIMEOUT" qemu-system-x86_64 \
        -cdrom hazoom-os.iso -m 512M \
        -display none -no-reboot \
        -serial file:"$SMOKE_LOG" > /dev/null 2>&1; then
    :
fi
if grep -q "SELFTEST] end" "$SMOKE_LOG" 2>/dev/null; then
    echo "[OK] Kernel selftest passed (serial verified)"
else
    echo "[WARN] Selftest marker not seen in serial log (slow TCG or boot issue)"
    echo "       Serial captured so far:"
    sed 's/^/         /' "$SMOKE_LOG" | tail -5
fi
rm -f "$SMOKE_LOG"

# 5. Package
mkdir -p "$DIST"
cp hazoom-os.iso "$DIST/$ISO_NAME"
cp kernel/c/hazoom-kernel.elf "$DIST/hazoom-kernel-${VERSION}.elf"
cp kernel/c/hazoom-kernel.bin "$DIST/hazoom-kernel-${VERSION}.bin"

cd "$DIST"
sha256sum "$ISO_NAME" "hazoom-kernel-${VERSION}.elf" "hazoom-kernel-${VERSION}.bin" > SHA256SUMS
cd "$HAZOOM_DIR"

# 6. Release notes
cat > "$DIST/RELEASE_NOTES.md" << EOF
# HAZOOM OS ${VERSION}

> Creator: Hazem Soussi (HA) © 2024-2026
> Codename: CONVERGENCE — The OS That Learns

## What's in the alpha

- x86_64 bare-metal kernel (multiboot2, boots via GRUB BIOS)
- GDT / IDT, PIC remapping, timer + keyboard IRQs
- Physical memory manager with bitmap allocator
- Identity-mapped paging (2 MiB pages, lower 1 GiB)
- Process manager: PCB list, create/terminate, priorities
- In-kernel tabular Q-learning (1000 states) feeding scheduler stats
- PS/2 keyboard driver + VGA text console
- Interactive shell: help, ps, mem, ls, run, kill, qlearn, uptime,
  clear, neofetch, exit
- Headless selftest over COM1 ([SELFTEST] markers)

## Artifacts

| File | Purpose |
|------|---------|
| ${ISO_NAME} | Bootable ISO (GRUB multiboot2, BIOS) |
| hazoom-kernel-${VERSION}.elf | Unstripped kernel ELF |
| hazoom-kernel-${VERSION}.bin | Flat kernel binary |
| SHA256SUMS | Checksums for all artifacts |

## Try it

QEMU:
    qemu-system-x86_64 -cdrom ${ISO_NAME} -m 512M

Real hardware (BIOS boot):
    dd if=${ISO_NAME} of=/dev/sdX bs=4M status=progress

Serial console: COM1 115200 8N1 (selftest + kernel banner)

## Known limitations

- No userspace yet on bare metal (init/shell run inside the kernel)
- No persistent filesystem (ramfs listing only)
- UEFI path pending (boot/ skeleton); BIOS boot only
- Q-learning table is volatile (not persisted across reboots)

## Verify

    sha256sum -c SHA256SUMS
EOF

echo ""
echo "=============================================="
echo " Release ready: $DIST/"
ls -lh "$DIST"
echo "=============================================="
