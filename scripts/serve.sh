#!/bin/bash
set -e

ALPHAPONY_ROOT="/mnt/d/AlphaPony"
PID_FILE="$ALPHAPONY_ROOT/logs/unified_server.pid"
LOG_FILE="$ALPHAPONY_ROOT/logs/unified_server.log"
PORT=8080
VENV_DIR="$ALPHAPONY_ROOT/hazoom_venv"

# Use venv Python if available, else system Python
if [ -f "$VENV_DIR/bin/python3" ]; then
    PYTHON="$VENV_DIR/bin/python3"
else
    PYTHON="python3"
fi

SERVICE_CMD="$PYTHON $ALPHAPONY_ROOT/services/api_gateway/unified_server.py"

mkdir -p "$ALPHAPONY_ROOT/logs"

start_service() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "✅ Unified Server already running (PID: $(cat $PID_FILE))"
        return 0
    fi
    echo "🚀 Starting Unified Server (Port $PORT)..."
    nohup bash -c "$SERVICE_CMD" > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    sleep 2
    if kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "✅ Unified Server started (PID: $(cat $PID_FILE))"
        echo "   Access: http://localhost:$PORT/"
    else
        echo "❌ Failed to start Unified Server. Check $LOG_FILE"
        return 1
    fi
}

stop_service() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "🛑 Stopping Unified Server (PID: $(cat $PID_FILE))..."
        kill $(cat "$PID_FILE")
        rm -f "$PID_FILE"
        echo "✅ Unified Server stopped"
    else
        echo "ℹ️  Unified Server not running"
    fi
}

status_service() {
    echo "=== AlphaPony Service Status ==="
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "✅ Unified Server: RUNNING (PID: $(cat $PID_FILE))"
        lsof -i :$PORT | grep LISTEN || true
    else
        echo "❌ Unified Server: STOPPED"
    fi
    echo ""
    echo "=== Integration Chain Components ==="
    curl -s http://localhost:$PORT/api/status 2>/dev/null || echo "   API Gateway not reachable"
}

logs_service() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        echo "❌ No log file found at $LOG_FILE"
    fi
}

case "$1" in
    start)   start_service ;;
    stop)    stop_service ;;
    restart) stop_service; sleep 1; start_service ;;
    status)  status_service ;;
    logs)    logs_service ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
