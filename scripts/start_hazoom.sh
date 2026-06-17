#!/bin/bash
# HAZOOM OS v3.0 — Quick Start Script
# Starts all services in background

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OS_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║          HAZOOM OS v3.0 — Quick Start               ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo ""

# Kill existing instances
pkill -f "voice_server.py" 2>/dev/null
pkill -f "chat_server.py" 2>/dev/null
pkill -f "http.server 8888" 2>/dev/null
pkill -f "http.server 9001" 2>/dev/null
pkill -f "http.server 9005" 2>/dev/null
sleep 1

echo "[1/5] Starting PureLift dApps Server (port 9005)..."
cd "/home/hazem/AlphaPony/purelift"
python3 -m http.server 9005 &>/tmp/hazoom_purelift.log &
PURELIFT_PID=$!
echo "  PID: $PURELIFT_PID"

echo "[2/5] Starting Cartoon Episode (port 9001)..."
cd "$OS_DIR/apps/cartoon-episode"
python3 -m http.server 9001 &>/tmp/hazoom_cartoon.log &
CARTOON_PID=$!
echo "  PID: $CARTOON_PID"

echo "[3/5] Starting Voice Server (port 9003)..."
cd "$OS_DIR"
python3 apps/cartoon-episode/voice_server.py &>/tmp/hazoom_voice.log &
VOICE_PID=$!
echo "  PID: $VOICE_PID"

echo "[4/5] Starting Chat Server (port 9004)..."
cd "$OS_DIR"
OLLAMA_MODEL=phi3:mini python3 services/orchestrator/chat_server.py &>/tmp/hazoom_chat.log &
CHAT_PID=$!
echo "  PID: $CHAT_PID"

echo "[5/5] Starting Desktop Server (port 8888)..."
cd "$OS_DIR"
python3 -m http.server 8888 &>/tmp/hazoom_desktop.log &
DESKTOP_PID=$!
echo "  PID: $DESKTOP_PID"

echo ""
echo "Waiting for services to initialize..."
sleep 3

# Test services
echo ""
echo "─── Service Status ───"

if curl -s -o /dev/null -w "%{http_code}" http://localhost:9005/ | grep -q "200"; then
    echo "  ✓ PureLift dApps  — http://localhost:9005"
else
    echo "  ✗ PureLift dApps  — FAILED"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:9001/ | grep -q "200"; then
    echo "  ✓ Cartoon Episode — http://localhost:9001"
else
    echo "  ✗ Cartoon Episode — FAILED"
fi

if curl -s http://localhost:9003/health | grep -q "ok"; then
    echo "  ✓ Voice Server  — http://localhost:9003"
else
    echo "  ✗ Voice Server  — FAILED"
fi

if curl -s http://localhost:9004/health | grep -q "ok"; then
    echo "  ✓ Chat Server   — http://localhost:9004"
else
    echo "  ✗ Chat Server   — FAILED"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:8888/ | grep -q "200"; then
    echo "  ✓ Desktop       — http://localhost:8888"
else
    echo "  ✗ Desktop       — FAILED"
fi

echo ""
echo "Open http://localhost:8888 in your browser"
echo "To stop: kill $PURELIFT_PID $CARTOON_PID $VOICE_PID $CHAT_PID $DESKTOP_PID"
echo ""
