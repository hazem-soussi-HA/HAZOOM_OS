#!/bin/bash
# HAZOOM OS Crash Recovery — run every 30s via cron
# Checks if HAZOOM is running, restarts if not.

HAZOOM_DIR="/home/hazem/HAZOOM_OS"
LOG="/tmp/hazoom-watchdog-cron.log"

# Check if server is up
if curl -s --connect-timeout 3 http://localhost:3000/health > /dev/null 2>&1; then
    exit 0
fi

# Server is down — restart
echo "[$(date)] HAZOOM CRASHED — restarting" >> "$LOG"
cd "$HAZOOM_DIR"
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 8443/tcp 2>/dev/null || true
sleep 2
setsid node server.js >> /tmp/hazoom-os.log 2>&1 &
echo "$!" > /tmp/hazoom-os.pid
echo "[$(date)] Restarted PID $!" >> "$LOG"
