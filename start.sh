#!/bin/bash

# HAZOOM OS v4.0 — Unified Entry Point
# "OS is like a deep self-mind. Nothing is lost and everything is connected." — Hazem Soussi

set -e

HAZOOM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HAZOOM_DIR"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    HAZOOM OS v4.0.0                          ║"
echo "║         Refactored Operating System                          ║"
echo "║         Creator: Hazem Soussi (HA) © 2024-2026             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

echo ""
echo "🌐 Starting HAZOOM OS v4.0..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start the unified server
echo "🚀 Starting server on http://localhost:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   OS Dashboard:    http://localhost:3000/os.html"
echo "   API Status:      http://localhost:3000/api/status"
echo "   Health Check:    http://localhost:3000/health"
echo "   API Docs:        http://localhost:3000/os.html#api"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop"
echo ""

node server.js
