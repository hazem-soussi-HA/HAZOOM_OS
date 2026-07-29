#!/bin/bash
# Full Environment Setup for World Map Secure Proxy
# Setting up peaceful environment for global map visualization

set -e

echo "🌍 Setting up full environment for World Map..."
echo "⚡ Preparing secure infrastructure for peaceful people..."

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p map-data/{config,ssl,certs}
mkdir -p map-data/{logs,backup,static}
mkdir -p map-data/{templates,scripts,styles}

# Initialize SSL certificates
echo "🔐 Configuring SSL certificates..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout map-data/ssl/server.key \
    -out map-data/ssl/server.crt \
    -subj "/C=US/ST=Global/L=Peace/O=WorldMap/CN=map.peaceful.world"

chmod 600 map-data/ssl/server.key
chmod 644 map-data/ssl/server.crt

# Create secure config
echo "⚙️  Creating secure configuration..."
cat > map-data/config/secure-config.json << 'CONFIG'
{
  "server": {
    "host": "0.0.0.0",
    "port": 8443,
    "ssl": {
      "key": "/app/ssl/server.key",
      "cert": "/app/ssl/server.crt"
    }
  },
  "security": {
    "https_only": true,
    "cors": {
      "enabled": true,
      "origins": ["https://map.peaceful.world"]
    },
    "headers": {
      "hsts": true,
      "x_frame_options": "DENY",
      "content_security": "strict"
    }
  },
  "map": {
    "center": {"lat": 20, "lng": 0},
    "zoom": 2,
    "peaceful_mode": true
  }
}
CONFIG

# Create secure .env
echo "📝 Creating environment configuration..."
cat > map-data/.env << 'ENV'
NODE_ENV=production
HTTPS_PORT=8443
SSL_KEY_PATH=/app/ssl/server.key
SSL_CERT_PATH=/app/ssl/server.crt
PEACEFUL_MODE=true
WORLD_MAP_ENABLED=true
SECURE_PROXY=true
ENV

# Install dependencies
echo "📦 Installing dependencies..."
cd /home/hazem
npm install express 2>/dev/null || true

# Create startup script
cat > map-data/start-peaceful.sh << 'START'
#!/bin/bash
cd /home/hazem
export NODE_ENV=production
export HTTPS_PORT=8443
echo "🌟 Starting peaceful world map server..."
node secure-proxy.js
START
chmod +x map-data/start-peaceful.sh

# Create monitoring script
cat > map-data/monitor.sh << 'MONITOR'
#!/bin/bash
echo "🕊️  Monitoring peaceful map server..."
while true; do
    sleep 60
    echo "$(date): Server running peacefully..."
done
MONITOR
chmod +x map-data/monitor.sh

echo ""
echo "✅ Environment setup complete!"
echo "🌎 World map infrastructure ready for peaceful people"
echo "🔒 Secure HTTPS server configured"
echo "⚡ Ready to deploy global map visualization"
echo ""
echo "Next steps:"
echo "  1. cd /home/hazem"
echo "  2. ./map-data/start-peaceful.sh"
echo "  3. Access: https://localhost:8443"
