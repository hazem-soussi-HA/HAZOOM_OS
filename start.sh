#!/bin/bash

# HAZOOM OS — Single Entry Point
# "OS is like a deep self-mind. Nothing is lost and everything is connected." — Hazem Soussi

set -e

HAZOOM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HAZOOM_DIR"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🚀 HAZOOM OS v3.1.0                       ║"
echo "║         Browser-Based OS with AI at its Core                 ║"
echo "║         Creator: Hazem Soussi (HA) © 2024-2026              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check dependencies
check_node() {
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found. Please install Node.js 18+"
        exit 1
    fi
    echo "✅ Node.js $(node --version)"
}

check_python() {
    if ! command -v python3 &> /dev/null; then
        echo "⚠️  Python3 not found. Python services will not start."
        return 1
    fi
    echo "✅ Python $(python3 --version)"
}

check_node
check_python

# Use virtual environment if it exists
if [ -f ".venv/bin/python3" ]; then
    PYTHON=".venv/bin/python3"
    echo "✅ Using virtual environment Python"
else
    PYTHON="python3"
fi

# Install Node dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

echo ""
echo "🌐 Starting HAZOOM OS..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start Node.js server
echo "🚀 Starting Node.js server on http://localhost:3000"
node server.js &
NODE_PID=$!

# Start Python ML API
if [ -f "python/hazoom-os/api/server.py" ]; then
    echo "🐍 Starting Python ML API on http://localhost:8000"
    cd python/hazoom-os/api && $PYTHON server.py &
    PYTHON_PID=$!
    cd "$HAZOOM_DIR"
fi

# Start Python System Layer
if [ -f "python/hazoom_os/server.py" ]; then
    echo "🐍 Starting Python System Layer on http://localhost:8001"
    cd python/hazoom_os && $PYTHON server.py &
    PYTHON2_PID=$!
    cd "$HAZOOM_DIR"
fi

echo ""
echo "✅ HAZOOM OS is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🌐 Desktop OS:     http://localhost:3000"
echo "   🔍 Health Check:   http://localhost:3000/health"
echo "   📊 System Status:  http://localhost:3000/api/status"
echo "   🤖 ML API:         http://localhost:8000"
echo "   ⚙️  System API:     http://localhost:8001"
echo "   🎮 Games:          http://localhost:3000/game"
echo "   📚 Landing Page:   http://localhost:3000/landing.html"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all services"

cleanup() {
    echo ""
    echo "🛑 Shutting down HAZOOM OS..."
    kill $NODE_PID 2>/dev/null || true
    kill $PYTHON_PID 2>/dev/null || true
    kill $PYTHON2_PID 2>/dev/null || true
    echo "✅ All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

wait $NODE_PID