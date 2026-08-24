#!/usr/bin/env bash
set -euo pipefail

APP="MIRROR TRANSCENDANCE"
PORT="${MIRROR_PORT:-9090}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
VESSEL="$ROOT/vessel"

check_node() {
  if ! command -v node &>/dev/null; then
    echo "✖ Node.js is not installed. Install it first."
    exit 1
  fi
}

install_deps() {
  if [ ! -d "$VESSEL/node_modules" ]; then
    echo "◈ Installing dependencies..."
    npm install --prefix "$VESSEL"
  fi
}

start_server() {
  check_node
  install_deps
  echo "◈ Starting $APP on port $PORT ..."
  echo "◈ http://localhost:$PORT"
  echo ""
  MIRROR_PORT="$PORT" node "$VESSEL/server.js"
}

start_mcp() {
  check_node
  install_deps
  echo "◈ Starting $APP MCP server (stdio) ..." >&2
  exec node "$VESSEL/mcp-server.js"
}

show_help() {
  cat <<EOF
Usage: ./run.sh [command]

Commands:
  server    Start the HTTP + WebSocket vessel (default)
  mcp       Start the MCP stdio server (for Hermes/LLM integration)
  help      Show this help

Environment:
  MIRROR_PORT  HTTP server port (default: 9090)
EOF
}

case "${1:-server}" in
  server)  start_server ;;
  mcp)     start_mcp ;;
  help|--help|-h) show_help ;;
  *)       echo "Unknown command: $1"; show_help; exit 1 ;;
esac
