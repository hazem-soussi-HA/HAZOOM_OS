#!/bin/bash
cd /home/hazem
export NODE_ENV=production
export HTTPS_PORT=8443
echo "🌟 Starting peaceful world map server..."
node secure-proxy.js
