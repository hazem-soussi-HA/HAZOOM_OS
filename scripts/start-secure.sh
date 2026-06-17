#!/bin/bash

# HAZOOM OS - Secure Development Server
# Starts server with security headers

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to script directory
cd "$SCRIPT_DIR"

echo -e "${GREEN}🛡️  Starting HAZOOM OS Secure Server${NC}"
echo -e "${BLUE}📁 Directory: $(pwd)${NC}"
echo -e "${BLUE}🌐 Port: 8889${NC}"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop server${NC}"
echo ""

# Kill any existing server on port 8889
if lsof -Pi :8889 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}⚠️  Port 8889 already in use, killing existing process...${NC}"
    kill $(lsof -t -i:8889) 2>/dev/null || true
    sleep 1
fi

# Start secure server
if [[ -f "secure_server.py" ]]; then
    python3 secure_server.py 8889
else
    echo -e "${RED}❌ secure_server.py not found${NC}"
    echo -e "${RED}   Falling back to standard server...${NC}"
    python3 -m http.server 8889
fi

echo ""
echo -e "${GREEN}Server stopped${NC}"