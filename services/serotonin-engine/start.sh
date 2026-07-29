#!/bin/bash

# NANO Protocol - Quick Start Script
# This script sets up and runs the project

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           NANO PROTOCOL - Quick Start                   ║"
echo "║     Neuro-Acoustic Optimization for Natural Homeostasis ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    echo "Please install Python 3.9+ from https://python.org"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo -e "${GREEN}✓ Python ${PYTHON_VERSION} found${NC}"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}Error: pip3 is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ pip found${NC}"
echo ""

# Menu
echo "Select an option:"
echo "1) Run Web App (opens browser)"
echo "2) Run Research Scraper API"
echo "3) Run Full Research Scrape"
echo "4) Setup only (install dependencies)"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}Starting Web App...${NC}"
        echo "Opening browser at http://localhost:8080"
        echo "Press Ctrl+C to stop"
        echo ""
        
        # Try to open browser
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:8080
        elif command -v open &> /dev/null; then
            open http://localhost:8080
        fi
        
        python3 -m http.server 8080
        ;;
    2)
        echo ""
        echo -e "${YELLOW}Starting Research Scraper API...${NC}"
        echo "API docs: http://localhost:8099/docs"
        echo "Press Ctrl+C to stop"
        echo ""
        
        cd microservices/frequency-research-scraper
        
        # Check if dependencies are installed
        if ! python3 -c "import fastapi" 2>/dev/null; then
            echo "Installing dependencies..."
            pip3 install -r requirements.txt
        fi
        
        uvicorn src.api.main:app --host 0.0.0.0 --port 8099 --reload
        ;;
    3)
        echo ""
        echo -e "${YELLOW}Running Full Research Scrape...${NC}"
        echo "This may take a while depending on sources"
        echo ""
        
        cd microservices/frequency-research-scraper
        
        # Check if dependencies are installed
        if ! python3 -c "import aiohttp" 2>/dev/null; then
            echo "Installing dependencies..."
            pip3 install -r requirements.txt
        fi
        
        python3 main.py
        ;;
    4)
        echo ""
        echo -e "${YELLOW}Setting up project...${NC}"
        
        # Create virtual environment
        if [ ! -d "venv" ]; then
            echo "Creating virtual environment..."
            python3 -m venv venv
        fi
        
        echo "Activating virtual environment..."
        source venv/bin/activate
        
        echo "Installing dependencies..."
        pip3 install --upgrade pip
        pip3 install -r requirements.txt
        
        echo "Installing microservice dependencies..."
        cd microservices/frequency-research-scraper
        pip3 install -r requirements.txt
        cd ../..
        
        echo ""
        echo -e "${GREEN}✓ Setup complete!${NC}"
        echo ""
        echo "To activate the virtual environment in the future:"
        echo "  source venv/bin/activate"
        ;;
    5)
        echo ""
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac
