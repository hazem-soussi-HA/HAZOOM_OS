#!/usr/bin/env bash
# Copyright © 2026 Hazem Soussi <hazem.soussi@gmail.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Planet Earth News — local TLS certificate generator.
#
# Issues a self-signed certificate for the loopback address (127.0.0.1 +
# localhost) so the platform can serve HTTPS on localhost. This is NOT a
# publicly-trusted cert (that's impossible for 127.0.0.1); the user must
# trust it once in their browser (Firefox: "Accept the Risk and Continue").
#
# The cert NEVER leaves the machine and is git-ignored.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERTDIR="$ROOT/certs"
CERT="$CERTDIR/pen.local.pem"
KEY="$CERTDIR/pen.local.key"
DAYS="${PEN_CERT_DAYS:-3650}"   # default: 10 years (localhost self-signed)

mkdir -p "$CERTDIR"

if [[ -f "$CERT" && -f "$KEY" ]]; then
  echo "PEN cert already exists: $CERT"
  echo "Remove it first if you want to regenerate (rm -f $CERTDIR/*)."
  exit 0
fi

echo "Generating self-signed localhost cert (CN=127.0.0.1, valid $DAYS days)…"
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "$KEY" -out "$CERT" -days "$DAYS" \
  -subj "/CN=127.0.0.1" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
  2>/dev/null

chmod 600 "$KEY"
chmod 644 "$CERT"
echo "Wrote:"
echo "  cert: $CERT"
echo "  key:  $KEY"
echo "Trust it once in your browser, then load https://127.0.0.1:8000"
