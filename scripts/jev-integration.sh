#!/bin/bash
# jev-integration.sh — Start all JEV + HAZOOM services
# Usage: ./jev-integration.sh

echo "⚡ Starting JEV 1.13 Integration for HAZOOM OS..."

# Start Jev console server
echo "[1/4] Starting Jev Console Server (port 8323)..."
cd /root/jev-agent-console
nohup python3 jev_console_server.py > /tmp/jev-console.log 2>&1 &
echo "  Jev Console PID: $!"

# Start Jev Docs Server
echo "[2/4] Starting Jev Docs Server (port 8322)..."
cd /root/jev-security
nohup python3 jev_docs_server.py > /tmp/jev-docs.log 2>&1 &
echo "  Jev Docs PID: $!"

# Start Jev Guard
echo "[3/4] Starting Jev Guard Proxy (port 8440)..."
systemctl restart jev-guard 2>/dev/null
sleep 2
echo "  Jev Guard started"

# Verify
echo "[4/4] Verifying..."
sleep 1
curl -s http://127.0.0.1:8323/api/status > /dev/null && echo "  ✅ Jev Console: ONLINE" || echo "  ❌ Jev Console: OFFLINE"
curl -s http://127.0.0.1:8322/ > /dev/null && echo "  ✅ Jev Docs: ONLINE" || echo "  ❌ Jev Docs: OFFLINE"
curl -s http://127.0.0.1:8440/healthz > /dev/null && echo "  ✅ Jev Guard: ONLINE" || echo "  ❌ Jev Guard: OFFLINE"

echo ""
echo "⚡ JEV Integration Complete!"
echo "  Terminal: http://127.0.0.1:8440/terminal/"
echo "  Admin:    http://127.0.0.1:8440/admin/"
echo "  HAZOOM:   http://127.0.0.1:3000/"
echo "  Token:    IuJivkbWtJvjpbhs6duXzdYg15XsDh5j"
