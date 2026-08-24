#!/usr/bin/env bash
# Copyright © 2026 Hazem Soussi <hazem.soussi@gmail.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Planet Earth News — asset build (minify + integrity hash).
#
# Produces tamper-evident, minified frontend bundles:
#   static/style.min.css   <- minified CSS (tiny dependency-free Python minifier)
#   static/app.min.js      <- minified JS (terser)
# The SRI hashes are injected into index.html at *serve* time (app.py), so
# they are always correct and survive any later edit to the source files.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[build] installing terser locally (git-ignored node_modules)…"
( command -v npx >/dev/null 2>&1 ) || { echo "FATAL: npx unavailable"; exit 1; }
npm install --no-save terser >/dev/null 2>&1 || npm install terser >/dev/null 2>&1 || {
  echo "FATAL: could not install terser"; exit 1; }

echo "[build] minifying CSS (dependency-free)…"
python3 - <<'PY'
import re, pathlib
css = pathlib.Path("static/style.css").read_text(encoding="utf-8")
css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)          # comments
css = re.sub(r"\s+", " ", css)                            # collapse ws
css = re.sub(r"\s*([{}:;,>])\s*", r"\1", css)            # around punctuation
css = css.replace(";}", "}").strip()
pathlib.Path("static/style.min.css").write_text(css, encoding="utf-8")
print("  style.min.css:", len(css), "bytes")
PY

echo "[build] minifying JS (app.js -> app.min.js)…"
npx --yes terser static/app.js --ext=.js -c -m -o static/app.min.js

echo "[build] done. Bundles:"
ls -l static/style.min.css static/app.min.js
