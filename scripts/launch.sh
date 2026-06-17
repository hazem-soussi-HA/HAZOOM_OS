#!/bin/bash
# AlphaPony Launcher
# Connects all services

PORT=${1:-8000}
PROJECT_DIR="/mnt/c/AlphaPony"

echo "======================================"
echo "  ALPHAPONY SYSTEM LAUNCHER"
echo "======================================"
echo ""

# Check services
echo "[1/4] Checking services..."
if [ -f "$PROJECT_DIR/apps/python/alpha_pony_bridge.py" ]; then
    echo "  ✓ Bridge module ready"
fi

# Start web server
echo "[2/4] Web server on port $PORT..."
cd "$PROJECT_DIR/purelift"
python3 -m http.server $PORT > /dev/null 2>&1 &
echo "  ✓ Server running at http://localhost:$PORT"

echo ""
echo "======================================"
echo "  AVAILABLE SERVICES"
echo "======================================"
echo "  Token Deploy:  http://localhost:$PORT/deploy.html"
echo "  Control Ctr:   http://localhost:$PORT/control_center.html"
echo "  PURE Project:  http://localhost:$PORT/"
echo ""

echo "To deploy PURE Token:"
echo "  1. Open http://localhost:$PORT/deploy.html"
echo "  2. Connect MetaMask"
echo "  3. Click DEPLOY"
echo ""

echo "To run AI Agent:"
echo "  mini-swe-agent --task 'your task' --yolo"
echo ""

# Keep server running
wait