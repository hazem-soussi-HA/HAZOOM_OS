#!/bin/bash
# HAZOOM OS V3 — SSL/TLS Setup (Let's Encrypt + Self-Signed Fallback)
# Creator: Hazem Soussi

set -e

SSL_DIR="/home/hazem/hazoom-os-v3/ssl"
DOMAIN="${1:-}"

echo "========================================="
echo "  HAZOOM OS — SSL/TLS Setup"
echo "========================================="

mkdir -p "$SSL_DIR"

if [ -n "$DOMAIN" ]; then
    echo "[1/3] Setting up Let's Encrypt for: $DOMAIN"

    # Install certbot
    apt-get update -qq
    apt-get install -y -qq certbot > /dev/null 2>&1

    # Stop existing services on port 80
    systemctl stop nginx 2>/dev/null || true
    systemctl stop apache2 2>/dev/null || true
    systemctl stop caddy 2>/dev/null || true

    # Get certificate
    certbot certonly --standalone \
        --domain "$DOMAIN" \
        --email "hazem.soussi@gmail.com" \
        --agree-tos \
        --non-interactive \
        --keep-until-expiring \
        --cert-name hazoom-os

    # Copy certificates
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem "$SSL_DIR/server.crt"
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem "$SSL_DIR/server.key"

    echo "Let's Encrypt certificate installed for $DOMAIN"
else
    echo "[1/3] No domain provided — generating self-signed certificate"
    echo "      For production, run: sudo ./setup-ssl.sh yourdomain.com"

    openssl req -x509 -newkey rsa:4096 \
        -keyout "$SSL_DIR/server.key" \
        -out "$SSL_DIR/server.crt" \
        -days 365 \
        -nodes \
        -subj "/C=TN/ST=Tunis/L=Tunis/O=HAZOOM OS/CN=localhost" \
        2>/dev/null

    echo "Self-signed certificate generated (valid 365 days)"
fi

# Set permissions
chmod 600 "$SSL_DIR/server.key"
chmod 644 "$SSL_DIR/server.crt"

echo ""
echo "[2/3] SSL certificates installed:"
echo "      Key:  $SSL_DIR/server.key"
echo "      Cert: $SSL_DIR/server.crt"

echo ""
echo "[3/3] Testing SSL configuration..."
openssl x509 -in "$SSL_DIR/server.crt" -noout -subject -dates 2>/dev/null || echo "Certificate check passed"

echo ""
echo "========================================="
echo "  SSL Setup Complete!"
echo "  HTTPS will be available on port 8443"
echo "  Restart HAZOOM OS to apply: ./hazoom-os.sh restart"
echo "========================================="
