#!/bin/bash
# HAZOOM OS Service Manager
# Usage: hazoom-service.sh {start|stop|restart|status|logs|dev}

set -e
HAZOOM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="/tmp/hazoom-os.pid"
LOG_FILE="/tmp/hazoom-os.log"
WATCHDOG_PID="/tmp/hazoom-watchdog.pid"

usage() {
    echo "Usage: $0 {start|stop|restart|status|logs|dev|boot}"
    echo ""
    echo "  start    - Start HAZOOM OS in production mode (background)"
    echo "  stop     - Stop all HAZOOM OS processes"
    echo "  restart  - Stop then start"
    echo "  status   - Show running status"
    echo "  logs     - Tail live logs"
    echo "  dev      - Start in dev mode with auto-reload on file changes"
    echo "  boot     - Start + enable watchdog (survives crashes)"
    exit 1
}

is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        kill -0 "$pid" 2>/dev/null && return 0
    fi
    return 1
}

do_stop() {
    echo "[HAZOOM] Stopping..."
    # Kill watchdog
    if [ -f "$WATCHDOG_PID" ]; then
        kill $(cat "$WATCHDOG_PID") 2>/dev/null || true
        rm -f "$WATCHDOG_PID"
    fi
    # Kill main process
    if is_running; then
        local pid=$(cat "$PID_FILE")
        kill "$pid" 2>/dev/null || true
        sleep 1
        kill -9 "$pid" 2>/dev/null || true
        rm -f "$PID_FILE"
    fi
    # Kill any stray processes
    pkill -f "node.*server.js" 2>/dev/null || true
    fuser -k 3000/tcp 2>/dev/null || true
    fuser -k 8443/tcp 2>/dev/null || true
    sleep 1
    echo "[HAZOOM] Stopped."
}

do_start() {
    if is_running; then
        echo "[HAZOOM] Already running (PID $(cat $PID_FILE))"
        return 0
    fi
    echo "[HAZOOM] Starting HAZOOM OS..."
    cd "$HAZOOM_DIR"
    nohup node server.js > "$LOG_FILE" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_FILE"
    sleep 2
    if is_running; then
        echo "[HAZOOM] Running (PID $pid)"
        echo "[HAZOOM] http://localhost:3000"
        curl -s http://localhost:3000/health 2>/dev/null && echo "" || true
    else
        echo "[HAZOOM] Failed to start. Check logs: $LOG_FILE"
        return 1
    fi
}

do_dev() {
    if is_running; then
        echo "[HAZOOM] Stopping production mode first..."
        do_stop
    fi
    echo "[HAZOOM] Starting in DEV mode (auto-reload on file changes)..."
    cd "$HAZOOM_DIR"
    node --watch server.js &
    local pid=$!
    echo "$pid" > "$PID_FILE"
    echo "[HAZOOM] Dev mode running (PID $pid) — auto-reloads on core/ changes"
    echo "[HAZOOM] http://localhost:3000"
}

do_boot() {
    do_stop
    do_start
    # Start watchdog
    bash "$HAZOOM_DIR/scripts/hazoom-watchdog.sh" &
    echo "$!" > "$WATCHDOG_PID"
    echo "[HAZOOM] Watchdog started (survives crashes)"
}

do_status() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        echo "[HAZOOM] RUNNING (PID $pid)"
        curl -s http://localhost:3000/health 2>/dev/null | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'  Status: {d[\"status\"]}')
print(f'  Version: {d[\"version\"]}')
print(f'  Processes: {d[\"processes\"]}')
print(f'  Memory: {d[\"memoryUsage\"]}')
" 2>/dev/null || echo "[HAZOOM] Health check failed"
    else
        echo "[HAZOOM] NOT RUNNING"
    fi
}

case "${1:-status}" in
    start)   do_start ;;
    stop)    do_stop ;;
    restart) do_stop; sleep 1; do_start ;;
    status)  do_status ;;
    logs)    tail -f "$LOG_FILE" ;;
    dev)     do_dev ;;
    boot)    do_boot ;;
    *)       usage ;;
esac
