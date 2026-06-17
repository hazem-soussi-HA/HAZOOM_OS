#!/bin/bash
# Hazoom Unified System Startup Script

echo "Starting Hazoom Unified System..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Create necessary directories
mkdir -p ssl

# Start all services
echo "Starting all Hazoom services..."
docker-compose -f docker-compose-unified.yml up -d

echo "Services are starting. This may take a few minutes..."
sleep 10

# Show the status of all containers
echo "Current container status:"
docker-compose -f docker-compose-unified.yml ps

echo ""
echo "Hazoom Unified System is starting..."
echo "Services will be available at:"
echo "  - Frontend: http://localhost:8081 (via nginx on http://localhost)"
echo "  - Backend API: http://localhost:8000"
echo "  - Django API: http://localhost:8002"
echo "  - Grafana: http://localhost:3000"
echo "  - Prometheus: http://localhost:9090"
echo ""
echo "To view logs: docker-compose -f docker-compose-unified.yml logs -f"
echo "To stop the system: docker-compose -f docker-compose-unified.yml down"