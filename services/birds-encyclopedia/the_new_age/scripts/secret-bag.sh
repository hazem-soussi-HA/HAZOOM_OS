#!/usr/bin/env bash
# ============================================================================
# 🐦 secret-bag.sh — "The New Age of Birds" private local automation
# Part of the Hazoom system. Air-gapped by design.
#   - regenerates the AGI knowledge graph (offline)
#   - self-audits the air-gap (no outbound network references in app code)
#   - serves the atlas on 127.0.0.1 only
# No data ever leaves this machine. Your trésor stays local.
# ============================================================================
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1
PORT="${PORT:-8080}"

audit() {
  echo "🔎 Air-gap audit — scanning app code for outbound network calls..."
  # Only flag REAL outbound patterns: fetch/http(s) import/src to a host.
  local hits
  hits=$(grep -rEn "(fetch|XMLHttpRequest|new Audio|src=|import .* from )[\"']https?://" src/ index.html 2>/dev/null || true)
  # Allow w3.org namespace identifiers (not network calls)
  hits=$(printf '%s\n' "$hits" | grep -vE "w3\.org" || true)
  if [ -n "$hits" ]; then
    echo "⚠️  Potential external network reference found:"
    echo "$hits"
    return 1
  fi
  echo "✅ No outbound network references in app code (air-gap intact)."
  return 0
}

export_graph() {
  if command -v node >/dev/null 2>&1; then
    echo "🧠 Regenerating AGI knowledge graph (offline)..."
    node src/generate-export.js
  else
    echo "⚠️  node not found — skipping AGI export."
  fi
}

serve() {
  echo "🚀 Serving atlas on 127.0.0.1:$PORT (local only)..."
  PORT="$PORT" python3 serve.py
}

case "${1:-all}" in
  audit)   audit ;;
  export)  export_graph ;;
  serve)   serve ;;
  all)
    export_graph
    audit
    serve
    ;;
  *)
    echo "usage: $0 [audit|export|serve|all]"
    exit 1
    ;;
esac
