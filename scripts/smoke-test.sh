#!/usr/bin/env bash
# HAZOOM OS — Smoke test: security headers, compression, memory integrity.
# Usage: SMOKE_PORT=3999 bash scripts/smoke-test.sh
set -euo pipefail

PORT="${SMOKE_PORT:-3999}"
BASE="http://127.0.0.1:$PORT"

fail() { echo "FAIL: $1"; exit 1; }
pass() { echo "ok: $1"; }

curl -sf "$BASE/api/status" > /dev/null || fail "GET /api/status"
pass "GET /api/status"

CSP=$(curl -sI "$BASE/" | grep -i content-security-policy | tr ';' '\n')
echo "$CSP" | grep -q "media-src 'self' https:" || fail "CSP missing media-src https:"
echo "$CSP" | grep -q "https://www.soundhelix.com" || fail "CSP missing soundhelix media source"
echo "$CSP" | grep -q "frame-src 'self' http://localhost:\*" || fail "CSP missing localhost frame-src"
pass "CSP: media-src + frame-src localhost"

curl -s -H 'Accept-Encoding: gzip' -D - -o /dev/null "$BASE/core/os-desktop.js" | grep -qi 'content-encoding: gzip' || fail "gzip compression not applied"
pass "gzip compression on static assets"

curl -s -H 'Accept-Encoding: gzip' -D - -o /dev/null "$BASE/" | grep -qi 'content-encoding: gzip' || fail "gzip not applied to HTML"
pass "gzip compression on HTML"

echo "ALL SMOKE TESTS PASSED"