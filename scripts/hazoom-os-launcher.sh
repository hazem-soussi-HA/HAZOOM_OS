#!/bin/bash
# HAZOOM OS — Systemd Service Launcher
# Starts all Hazoom OS services securely

OS_DIR="/home/hazem/AlphaPony/hazoom-os"
HAZOOM_DIR="/home/hazem/hazoom"

# Kill existing instances
pkill -f "voice_server.py" 2>/dev/null
pkill -f "chat_server.py" 2>/dev/null
pkill -f "http.server 8888" 2>/dev/null
pkill -f "http.server 9001" 2>/dev/null
pkill -f "mcp_server.py" 2>/dev/null
sleep 1

echo "[HAZOOM OS] Starting Desktop Server (port 8888)..."
cd "$OS_DIR"
python3 -m http.server 8888 &>/tmp/hazoom_desktop.log &

echo "[HAZOOM OS] Starting Cartoon Episode (port 9001)..."
cd "$OS_DIR/apps/cartoon-episode"
python3 -m http.server 9001 &>/tmp/hazoom_cartoon.log &

echo "[HAZOOM OS] Starting Voice Server (port 9003)..."
cd "$OS_DIR"
python3 apps/cartoon-episode/voice_server.py &>/tmp/hazoom_voice.log &

echo "[HAZOOM OS] Starting Chat Server (port 9004)..."
cd "$OS_DIR"
OLLAMA_MODEL=phi3:mini python3 services/orchestrator/chat_server.py &>/tmp/hazoom_chat.log &

echo "[HAZOOM OS] Starting MCP Server (port 3000)..."
cd "$HAZOOM_DIR"
python3 mcp_server.py &>/tmp/hazoom_mcp.log &

# Wait for all background processes
wait
