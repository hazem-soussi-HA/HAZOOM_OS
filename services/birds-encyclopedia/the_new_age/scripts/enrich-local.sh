#!/usr/bin/env bash
# ============================================================================
# 🐦 enrich-local.sh — extend the atlas with a LOCAL taxonomy dump.
# AIR-GAP SAFE: it does NOT fetch anything. You bring the data; this ingests it.
#
# How to use (your "secret bag" enrichment flow):
#   1. Obtain a taxonomy export OFFLINE (copy an Avibase/IOC JSON to this
#      machine via USB/air-gap). Place it at data/import/taxonomy.json.
#   2. Run:  bash scripts/enrich-local.sh
#   3. It merges new families/orders into data/birds.json (procedural birds),
#      then regenerates the AGI graph. No network touched.
# ============================================================================
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1
IMPORT_DIR="$ROOT/data/import"
BIRDS="$ROOT/data/birds.json"

if [ ! -d "$IMPORT_DIR" ] || [ -z "$(ls -A "$IMPORT_DIR" 2>/dev/null)" ]; then
  echo "📥 Drop a taxonomy JSON into $IMPORT_DIR/ (e.g. taxonomy.json) then re-run."
  echo "   Schema: [{ \"family\":\"...\", \"order\":\"...\", \"commonName\":\"...\","
  echo "             \"scientificName\":\"...\", \"iucnStatus\":\"LC\" }, ...]"
  exit 0
fi

if ! command -v node >/dev/null 2>&1; then
  echo "⚠️  node required for merge. Aborting."; exit 1
fi

node scripts/merge-import.js "$IMPORT_DIR" "$BIRDS"

echo "🧠 Regenerating AGI graph..."
node src/generate-export.js | tail -2
echo "🎉 Enrichment done — fully offline."
