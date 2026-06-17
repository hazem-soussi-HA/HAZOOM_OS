#!/bin/bash

set -e

echo "🚀 Universe Map - Quick Start Script"
echo "===================================="
echo ""

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is not installed. Please install Docker first."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is not installed. Please install Docker Compose first."; exit 1; }

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your API keys."
else
    echo "✅ .env file already exists."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/logs
mkdir -p backend/models
mkdir -p data/postgres
mkdir -p data/redis

# Pull latest images
echo "🐳 Pulling Docker images..."
docker-compose pull

# Build custom images
echo "🔨 Building custom Docker images..."
docker-compose build

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "🔍 Checking service health..."
docker-compose ps

# Show logs
echo ""
echo "📊 Recent logs:"
echo "=============="
docker-compose logs --tail=20

echo ""
echo "✨ Setup complete!"
echo ""
echo "🌐 Access points:"
echo "  - Frontend:      http://localhost:3000"
echo "  - Backend API:   http://localhost:8000"
echo "  - API Docs:      http://localhost:8000/api/docs"
echo "  - Grafana:       http://localhost:3001 (admin/admin)"
echo "  - Prometheus:    http://localhost:9090"
echo ""
echo "📖 For more information, see README.md"
echo "🔧 To stop services: docker-compose down"
echo "🧹 To clean everything: docker-compose down -v"
