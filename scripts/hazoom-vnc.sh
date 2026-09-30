#!/usr/bin/env bash
# Launch the HAZOOM kernel in QEMU with VNC bound to loopback only.
#
# Security: VNC is an unauthenticated console by default. Binding it to
# 0.0.0.0 exposes full keyboard/mouse control of the guest to anything that
# can route to this host. Always bind 127.0.0.1 (or set VNC_PASSWORD and use
# a -vnc password option via a secrets file you never commit).
#
# Usage: scripts/hazoom-vnc.sh <display> <kernel-dir> [tag]
#   display    VNC display number (1 -> port 5901)
#   kernel-dir directory containing hazoom-kernel.elf
#   tag        log/socket tag, defaults to "live"

set -euo pipefail

DISPLAY_NUM="${1:?usage: $0 <display> <kernel-dir> [tag]}"
KERNEL_DIR="${2:?usage: $0 <display> <kernel-dir> [tag]}"
TAG="${3:-live}"

VNC_HOST="127.0.0.1"          # loopback only - do not change to 0.0.0.0
VNC_PORT="$((5900 + DISPLAY_NUM))"
MONITOR_SOCK="/tmp/hazoom-mon-${TAG}.sock"
SERIAL_LOG="/tmp/hazoom-${TAG}-serial.log"

if [[ ! -f "$KERNEL_DIR/hazoom-kernel.elf" ]]; then
  echo "error: hazoom-kernel.elf not found in $KERNEL_DIR" >&2
  echo "hint: build it with scripts/build-kernel.sh" >&2
  exit 1
fi

# Refuse to start if something already holds the port.
if ss -tln 2>/dev/null | grep -q ":${VNC_PORT}\$"; then
  echo "error: port ${VNC_PORT} already in use; stop the old instance first" >&2
  exit 1
fi

rm -f "$MONITOR_SOCK"

cd "$KERNEL_DIR"
exec qemu-system-x86_64 \
  -kernel hazoom-kernel.elf \
  -m 512 \
  -cpu max \
  -machine pc,accel=tcg \
  -vnc "${VNC_HOST}:${DISPLAY_NUM}" \
  -monitor "unix:${MONITOR_SOCK},server,nowait" \
  -serial "file:${SERIAL_LOG}" \
  -no-reboot
