#!/usr/bin/env bash
# Launcher for the Ornith chatbox (ornith_server.py -> ornith:35b via Ollama).
# Binds to loopback only (127.0.0.1); no network exposure.
set -euo pipefail
cd "$(dirname "$0")"

# Port 5000 is usually taken by another local project, so default to 5055.
# ORNITH_KEEP_ALIVE=-1 keeps the 35B model resident so chats are fast
# (avoids the ~3-4 min cold-load on every idle->active transition).
export ORNITH_PORT="${ORNITH_PORT:-5055}"
export ORNITH_KEEP_ALIVE="${ORNITH_KEEP_ALIVE:--1}"

exec python3 ornith_server.py
