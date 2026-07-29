#!/usr/bin/env bash
# Generate a self-signed localhost TLS cert for loopback HTTPS.
# Git-ignored (.pem/.key not committed). Run: ./scripts/gen_cert.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/peh.local.key \
  -out certs/peh.local.pem \
  -days 825 \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1"
chmod 600 certs/peh.local.key certs/peh.local.pem
echo "Wrote certs/peh.local.pem + certs/peh.local.key (localhost, loopback only)"
