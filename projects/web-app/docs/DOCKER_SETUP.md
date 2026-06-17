# Hazoom Docker Setup Guide

This guide explains how to containerize and deploy the Hazoom LLM RAG super intelligent model using Docker and Docker Compose.

## Prerequisites

- Docker Engine (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- At least 4GB of available RAM (8GB recommended for RAG features)

## Quick Start

To quickly deploy Hazoom with all services:

```bash
# Clone or navigate to the Hazoom project directory
cd hazoom

# Start all services in detached mode
docker-compose up -d

# Check the status of all services
docker-compose ps

# View logs
docker-compose logs -f hazoom-backend
```

## Services Overview

The Docker Compose setup includes:

- `hazoom-backend`: Main FastAPI backend with RAG capabilities
- `hazoom-frontend`: Frontend server for UI
- `postgres`: PostgreSQL database for persistent storage
- `redis`: Redis for caching and session management
- `chromadb`: Vector database for RAG functionality
- `clickhouse`: Columnar database for ChromaDB (if enabled)
- `prometheus`: Monitoring and metrics collection
- `grafana`: Visualization dashboard for monitoring

## Configuration

### Environment Variables

The system uses a `.env` file for configuration. Customize the values in the `.env` file to match your requirements:

```bash
# Database settings
POSTGRES_DB=hazoom
POSTGRES_USER=hazoom_user
POSTGRES_PASSWORD=hazoom_password

# RAG settings
RAG_ENABLED=true
RAG_MODEL_NAME=all-MiniLM-L6-v2
RAG_TOP_K=5
RAG_SCORE_THRESHOLD=0.5

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
```

### RAG Data

To use RAG capabilities, place your documents in the `./data` directory which is mounted to the backend container at `/app/data`.

## Customization

### Adding Custom Models

To use a different embedding model for RAG:

1. Update the `RAG_MODEL_NAME` in `.env`
2. Add the model to the requirements if it's not already included
3. Restart the services

### Scaling

To scale the backend service:

```bash
# Scale backend to 3 instances
docker-compose up -d --scale hazoom-backend=3
```

## Building from Source

To build the containers from source:

```bash
# Build all services
docker-compose build

# Build a specific service
docker-compose build hazoom-backend
```

## Development Mode

For development with live reloading:

```bash
# Start services with development configuration
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Note: Create `docker-compose.dev.yml` with volume mounts for live code changes.

## Monitoring

- Prometheus metrics: http://localhost:9090
- Grafana dashboard: http://localhost:3000 (default login: admin/admin)

## Troubleshooting

### Common Issues

1. **Port already in use**: Make sure ports 8000, 8080, 5432, 6379 are available
2. **Insufficient memory**: RAG models require significant memory; ensure adequate resources
3. **Dependency conflicts**: Check the requirements.txt files for compatibility

### Checking Logs

```bash
# View backend logs
docker-compose logs hazoom-backend

# View all logs in real-time
docker-compose logs -f

# View specific service logs with tail
docker-compose logs --tail=100 hazoom-backend
```

### Health Checks

Each service has built-in health checks. Check the status with:

```bash
docker-compose ps
```

## Production Deployment

For production deployment, consider:

1. Use HTTPS with a reverse proxy (nginx/traefik)
2. Secure the SECRET_KEY and database credentials
3. Set up proper monitoring and alerting
4. Implement backup strategies for data and database
5. Use a managed database service instead of self-hosted PostgreSQL

### Reverse Proxy Setup

Example nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Updating the System

To update to the latest version:

```bash
# Pull the latest code
git pull origin main

# Pull latest images
docker-compose pull

# Rebuild if needed
docker-compose build

# Restart services
docker-compose up -d
```

## Cleanup

To stop and remove all containers, networks, and volumes:

```bash
# Stop all services
docker-compose down

# Remove volumes (this will delete all data)
docker-compose down -v

# Remove images (optional)
docker-compose down --rmi all
```

## Performance Tuning

For better RAG performance, consider:

- Using GPU-enabled containers if available
- Increasing the TOP_K value for broader search
- Adjusting the score threshold for more/less strict matching
- Using more powerful embedding models for better accuracy