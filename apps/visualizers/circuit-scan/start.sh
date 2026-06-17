#!/bin/bash
# Circuit Scan - VRINX Integration Startup Script

echo "=========================================="
echo "Circuit Human Scan - VRINX Integration"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Installing..."
    # Install Node.js if not present
    apt-get update && apt-get install -y nodejs npm
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the VRINX integration server in background
echo "Starting VRINX Integration Server..."
node server.js &
VRINX_PID=$!

# Wait a moment for server to start
sleep 2

# Start the web server
echo "Starting Web Interface..."
echo ""
echo "Access the circuit scan page at:"
echo "  - http://localhost:8080"
echo "  - or run: python -m http.server 8000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running and clean up on exit
trap "kill $VRINX_PID 2>/dev/null; exit" INT TERM

# Wait for background processes
wait $VRINX_PID
