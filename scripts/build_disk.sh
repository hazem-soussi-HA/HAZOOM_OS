#!/usr/bin/env bash
# Build a bootable raw disk image that loads the HAZOOM kernel via GRUB,
# without needing mkfs/loop/dd (uses only cat + grub tools + /dev/zero).
set -e
cd /home/hazem/HAZOOM_OS
KERN=kernel/c/hazoom-kernel.elf
BOOT=/usr/lib/grub/i386-pc/boot.img
WORK=/tmp/hazoom_build
rm -rf "$WORK"; mkdir -p "$WORK"

# 1) compile/link kernel (rebuild ELF)
( cd kernel/c && make >/dev/null 2>&1 )

# 2) build a minimal GRUB core.img (embedded config loads kernel from raw
#    disk sectors after the core image). Use multiboot (v1) so GRUB loads
#    the ELF at its p_vaddr with paging OFF (deterministic, no page-walk).
CORE="$WORK/core.img"
# placeholder config first to learn core.img size, then recompute sector
SECTORS_PLACEHOLDER=300
KSTART_PLACEHOLDER=$(( 1 + SECTORS_PLACEHOLDER ))
printf 'serial --unit=0 --speed=115200\nterminal_output serial\nmultiboot (hd0)%s+999\nboot\n' "$KSTART_PLACEHOLDER" > "$WORK/cfg.cfg"
grub-mkimage -O i386-pc -p '(hd0)' -c "$WORK/cfg.cfg" -o "$CORE" \
    normal serial terminal terminfo multiboot part_gpt part_msdos biosdisk

CORE_SECTORS=$(( ($(stat -c%s "$CORE") + 511) / 512 ))
KERN_START=$(( 1 + CORE_SECTORS ))
KERN_BYTES=$(stat -c%s "$KERN")
KERN_SECTORS=$(( (KERN_BYTES + 511) / 512 ))

# 3) rewrite config with correct sector, rebuild core.img
printf 'serial --unit=0 --speed=115200\nterminal_output serial\nmultiboot (hd0)%s+%s\nboot\n' \
    "$KERN_START" "$KERN_SECTORS" > "$WORK/cfg.cfg"
grub-mkimage -O i386-pc -p '(hd0)' -c "$WORK/cfg.cfg" -o "$CORE" \
    normal serial terminal terminfo multiboot part_gpt part_msdos biosdisk

CORE_SECTORS=$(( ($(stat -c%s "$CORE") + 511) / 512 ))
KERN_START=$(( 1 + CORE_SECTORS ))
PAD=$(( CORE_SECTORS*512 - $(stat -c%s "$CORE") ))
head -c "$PAD" /dev/zero > "$WORK/pad.bin"

# 4) assemble disk: boot.img + core.img + pad + kernel.elf
cat "$BOOT" "$CORE" "$WORK/pad.bin" "$KERN" > /tmp/hazoom-disk.img
echo "Built /tmp/hazoom-disk.img (kern at sector $KERN_START, $KERN_SECTORS sectors)"
echo "disk bytes: $(stat -c%s /tmp/hazoom-disk.img)"
