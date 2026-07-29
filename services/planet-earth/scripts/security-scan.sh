#!/usr/bin/env bash
# Security scan: fail the build if any secret-like pattern is found in the
# source tree. Excludes node_modules, .git, binary assets, and lockfiles.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[security-scan] scanning $ROOT (excluding node_modules/.git/binaries)"

# Patterns that should never appear in committed source.
PATTERNS=(
  'api[_-]?key\s*[:=]'
  'secret\s*[:=]'
  'token\s*[:=]\s*['"'"'"][A-Za-z0-9+/=_-]{16,}['"'"'"]'
  'password\s*[:=]'
  'passwd\s*[:=]'
  'sk-[A-Za-z0-9]{20,}'
  'ghp_[A-Za-z0-9]{36,}'
  'github_pat_[A-Za-z0-9_]{20,}'
  'AIza[0-9A-Za-z_-]{35}'
  'xox[bap]-[A-Za-z0-9-]{10,}'
  'AKIA[0-9A-Z]{16}'
  '[A-Za-z0-9._%+-]+:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/[A-Za-z0-9._%+-]+'
  '(https?|ftp|sftp|ssh|ws|wss)://[A-Za-z0-9._%+-]+:[A-Za-z0-9._%+-]+@'
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'
)

# Files to scan: text only, excluding vendored deps, git, and binaries.
mapfile -t FILES < <(grep -rIl --exclude-dir=node_modules --exclude-dir=.git \
  --exclude='*.png' --exclude='*.jpg' --exclude='*.jpeg' --exclude='*.gif' \
  --exclude='*.woff' --exclude='*.woff2' --exclude='package-lock.json' \
  . 2>/dev/null || true)

hit=0
for p in "${PATTERNS[@]}"; do
  # -n prints file:line; quiet otherwise
  matches="$(grep -rInE "$p" "${FILES[@]}" 2>/dev/null || true)"
  if [[ -n "$matches" ]]; then
    echo "  [FAIL] pattern '$p' matched:"
    echo "$matches" | sed 's/^/    /'
    hit=1
  fi
done

if [[ "$hit" -ne 0 ]]; then
  echo "[security-scan] FAILED — potential secret(s) found. Aborting push."
  exit 1
fi

echo "[security-scan] OK — no secret patterns detected."
