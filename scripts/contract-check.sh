#!/usr/bin/env bash
# Contract Guard — one law, verified everywhere. Source of truth: REASON spine.
# CONTRACT_ENFORCE=1 → refuse boot on tamper; default → warn loudly.
# Copyright (c) 2026 Hazem Soussi. AI is an energy - for those who deserve it, for good reason.
EXPECTED="4b0bdb8de7c6c5c59f6783f9d27be7ac3d67b16bfa2dbc5b483a3cfc3b7bcb0b"
FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/CONTRACT.md"
if [ ! -f "$FILE" ]; then
  echo "[CONTRACT] MISSING: $FILE"
  [ "$CONTRACT_ENFORCE" = "1" ] && exit 1
  exit 0
fi
ACTUAL=$(sha256sum "$FILE" | cut -d' ' -f1)
if [ "$ACTUAL" = "$EXPECTED" ]; then
  echo "[CONTRACT] verified ✔ ($ACTUAL)"
else
  echo "[CONTRACT] TAMPERED ✘ (expected $EXPECTED, got $ACTUAL)"
  [ "$CONTRACT_ENFORCE" = "1" ] && exit 1
fi
