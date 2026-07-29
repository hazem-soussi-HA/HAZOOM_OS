#!/bin/bash
# Secure Map Proxy Initialization Script

set -e

echo "🔐 Initializing Secure Map Proxy..."

# Create SSL directory with proper permissions
mkdir -p /etc/ssl/private
mkdir -p /etc/ssl/certs
chmod 700 /etc/ssl/private

# Generate self-signed certificate for development (use proper certs in production)
if [ ! -f /etc/ssl/private/server.key ]; then
    echo "⚠️  Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/server.key \
        -out /etc/ssl/certs/server.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
fi

# Set secure permissions
chmod 600 /etc/ssl/private/server.key
chmod 644 /etc/ssl/certs/server.crt

echo "✅ SSL certificates configured"
echo "🚀 Starting secure proxy server..."

# Start the secure proxy
exec node secure-proxy.js
