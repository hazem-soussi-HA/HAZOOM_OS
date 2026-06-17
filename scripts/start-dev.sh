#!/bin/bash

# HAZOOM OS - Standard Development Server
# Ensures server always runs from correct directory

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

echo -e "${GREEN}🚀 Starting HAZOOM OS Development Server${NC}"
echo -e "${BLUE}📁 Directory: $(pwd)${NC}"
echo -e "${BLUE}🌐 Port: 8000${NC}"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop server${NC}"
echo ""

# Kill any existing server on port 8000
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}⚠️  Port 8000 already in use, killing existing process...${NC}"
    kill $(lsof -t -i:8000) 2>/dev/null || true
    sleep 1
fi

# Start server
python3 -m http.server 8000

echo ""
echo -e "${GREEN}Server stopped${NC}"