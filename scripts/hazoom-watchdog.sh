#!/bin/bash
# HAZOOM OS Watchdog — keeps the service alive
# Restarts server.js if it dies, with exponential backoff.

HAZOOM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="/tmp/hazoom-os.log"
PID_FILE="/tmp/hazoom-os.pid"
BACKOFF=0
MAX_BACKOFF=30

echo "[WATCHDOG] Starting at $(date)"

while true; do
    # Check if server is alive
    if curl -s --connect-timeout 3 http://localhost:3000/health > /dev/null 2>&1; then
        BACKOFF=0
        sleep 10
        continue
    fi

    # Server is down, restart it
    echo "[WATCHDOG] Server down — restarting (backoff: ${BACKOFF}s)"
    cd "$HAZOOM_DIR"

    # Kill anything on port 3000
    fuser -k 3000/tcp 2>/dev/null || true
    fuser -k 8443/tcp 2>/dev/null || true
    sleep 2

    # Start server
    nohup node server.js >> "$LOG_FILE" 2>&1 &
    echo "$!" > "$PID_FILE"
    sleep 3

    # Verify it started
    if curl -s --connect-timeout 5 http://localhost:3000/health > /dev/null 2>&1; then
        echo "[WATCHDOG] Server restarted successfully"
        BACKOFF=0
    else
        BACKOFF=$((BACKOFF + 2))
        if [ $BACKOFF -gt $MAX_BACKOFF ]; then BACKOFF=$MAX_BACKOFF; fi
        echo "[WATCHDOG] Restart may have failed, backing off ${BACKOFF}s"
        sleep $BACKOFF
    fi

    sleep 5
done
