#!/usr/bin/env bash
# Serve HAZOOM XP as a separate work, alongside HAZOOM OS.
#
# XP is GPL-3.0-only and the OS is proprietary, so XP is never copied into the
# OS tree. It is served from its own checkout on its own port, and the OS links
# to it. That boundary is what keeps both licences intact — see
# docs/MIGRATION-XP.md.
#
# Usage:  ./scripts/serve-xp.sh [port] [path-to-maze-ship]
set -euo pipefail

PORT="${1:-8100}"
XP_DIR="${2:-/mnt/c/Users/HP/Desktop/maze ship}"

if [ ! -d "$XP_DIR/public" ]; then
    echo "HAZOOM XP not found at: $XP_DIR" >&2
    echo "Pass the path:  ./scripts/serve-xp.sh 8100 '/path/to/maze ship'" >&2
    exit 1
fi

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  HAZOOM XP — served as a SEPARATE WORK (GPL-3.0-only)    ║"
echo "║  source : $XP_DIR"
echo "║  url    : http://127.0.0.1:$PORT/"
echo "╚══════════════════════════════════════════════════════════╝"
echo "Do not copy XP source into HAZOOM_OS. That would make the OS GPL-3.0."

cd "$XP_DIR"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
