#!/usr/bin/env bash
# HAZOOM OS — Smoke test: security headers, compression, memory integrity.
# Usage: SMOKE_PORT=3999 bash scripts/smoke-test.sh
set -euo pipefail

PORT="${SMOKE_PORT:-3000}"
BASE="http://127.0.0.1:$PORT"

fail() { echo "FAIL: $1"; exit 1; }
pass() { echo "ok: $1"; }

curl -sf "$BASE/api/status" > /dev/null || fail "GET /api/status"
pass "GET /api/status"

curl -sf "$BASE/health" > /dev/null || fail "GET /health"
pass "GET /health"

# The reasoning core must be reachable and must report a real model.
INTEL=$(curl -sf "$BASE/api/v1/intelligence/status") || fail "GET /api/v1/intelligence/status"
[[ "$INTEL" == *'"available":true'* ]] || fail "intelligence core reports unavailable: $INTEL"
[[ "$INTEL" == *'"activeModel":'* ]] || fail "intelligence core has no active model"
pass "intelligence core reports a live model"

INTEL_HEALTH=$(curl -sf "$BASE/api/v1/intelligence/health") || fail "GET /api/v1/intelligence/health"
[[ "$INTEL_HEALTH" == *'"status":"online"'* ]] || fail "intelligence health is not online: $INTEL_HEALTH"
pass "intelligence health is online"

# Reasoning must never be reachable without authentication.
UNAUTH_THINK=$(curl -sS -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{"prompt":"hello"}' "$BASE/api/v1/intelligence/think")
[[ "$UNAUTH_THINK" == "401" ]] || fail "unauthenticated reasoning returned $UNAUTH_THINK"
pass "reasoning requires authentication"

# ── Secure web access ─────────────────────────────────────────────
# The browser may reach the public internet, but it must never become a
# bridge into this machine. These are the guards that matter most.
WEB_STATUS=$(curl -sf "$BASE/api/web/status") || fail "GET /api/web/status"
[[ "$WEB_STATUS" == *'"enabled"'* ]] || fail "web status malformed: $WEB_STATUS"
pass "web access status reports state"

for LOOPBACK in "http://127.0.0.1:3000/api/status" "http://localhost:3000/health" "http://169.254.169.254/" "http://10.0.0.1/" "file:///etc/passwd"; do
    ENC=$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$LOOPBACK")
    CODE=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/web/page?url=$ENC")
    [[ "$CODE" == "403" ]] || fail "web proxy allowed $LOOPBACK ($CODE)"
done
pass "web proxy refuses private/loopback targets (no SSRF)"

ENC_ASSET=$(python3 -c 'import urllib.parse; print(urllib.parse.quote("http://127.0.0.1:3000/api/status", safe=""))')
CODE=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/web/asset?url=$ENC_ASSET")
[[ "$CODE" == "403" ]] || fail "asset proxy allowed a loopback target ($CODE)"
pass "asset proxy refuses private targets"

# Rendered pages must never be able to execute script.
ENC_PAGE=$(python3 -c 'import urllib.parse; print(urllib.parse.quote("https://example.com/", safe=""))')
PAGE_HEADERS=$(curl -sS -o /dev/null -D - "$BASE/api/web/page?url=$ENC_PAGE")
echo "$PAGE_HEADERS" | grep -qi "content-security-policy" || fail "web page has no CSP"
echo "$PAGE_HEADERS" | grep -qi "script-src 'none'" || fail "web page CSP does not block script"
echo "$PAGE_HEADERS" | grep -qi "nosniff" || fail "web page missing nosniff"
pass "rendered pages are CSP-locked (script-src 'none')"

MANIFEST=$(curl -sf "$BASE/api/apps/manifest?paths=apps%2Fdocs%2FHAZOOM_OS_TOUR.html%7Ccore%2Fkernel.js") || fail "GET /api/apps/manifest"
[[ "$MANIFEST" == *'"available":true'* ]] || fail "app manifest did not resolve known files"
pass "batched app availability manifest"

curl -sI "$BASE/api/status" | grep -qi 'cache-control: no-store' || fail "dynamic API response is cacheable"
pass "dynamic API responses use no-store"

SHELL_STATUS=$(curl -sS -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{"command":"status"}' "$BASE/api/shell/exec")
[[ "$SHELL_STATUS" == "401" ]] || fail "unauthenticated shell execution returned $SHELL_STATUS"
pass "shell execution requires authentication"

for PRIVATE_PATH in /config/credentials.json /data/qlearner/state.json /server.js /core/jev-core.js; do
    PRIVATE_STATUS=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE$PRIVATE_PATH")
    [[ "$PRIVATE_STATUS" == "404" ]] || fail "$PRIVATE_PATH is publicly accessible ($PRIVATE_STATUS)"
done
pass "private runtime files are not public"

curl -sf "$BASE/showcase" > /dev/null || fail "GET /showcase"
curl -sf -r 0-1023 "$BASE/assets/hazoom-os-trailer.mp4" > /dev/null || fail "trailer byte-range playback"
pass "visual showcase and trailer are available"

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