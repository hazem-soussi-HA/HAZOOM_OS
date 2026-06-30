#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Building HAZOOM OS v6.0 ==="

echo "[1/4] Building kernel..."
cd kernel
make clean
make

if [ ! -f hazoom-kernel.bin ]; then
    echo "ERROR: Kernel build failed"
    exit 1
fi

cd ..

echo "[2/4] Creating initramfs..."
mkdir -p initramfs/{bin,sbin,etc,dev,proc,sys,tmp,home,hazem}
cp userspace/init/hazoom-init initramfs/bin/ 2>/dev/null || true
echo "HAZOOM OS v6.0" > initramfs/etc/hazoom-release
echo "root:x:0:0:root:/root:/bin/sh" > initramfs/etc/passwd

cd initramfs
find . | cpio -o -H newc > ../hazoom-initramfs.cpio
cd ..

echo "[3/4] Creating ISO..."
rm -f hazoom-os.iso
xorriso -as mkisofs \
    -o hazoom-os.iso \
    -b hazoom-kernel.bin \
    -no-emul-boot \
    -boot-load-size 4 \
    -boot-info-table \
    -eltorito-alt-boot \
    -efi-boot efi-boot.img \
    -no-emul-boot \
    hazoom-kernel.bin hazoom-initramfs.cpio 2>/dev/null || \
xorriso -as mkisofs \
    -o hazoom-os.iso \
    -b hazoom-kernel.bin \
    -no-emul-boot \
    -boot-load-size 4 \
    -boot-info-table \
    hazoom-kernel.bin hazoom-initramfs.cpio

echo "[4/4] Done!"
echo "ISO created: hazoom-os.iso"
ls -la hazoom-os.iso