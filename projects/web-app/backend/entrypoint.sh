#!/bin/bash
set -e

echo "Starting Hazoom Backend initialization..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "PostgreSQL is ready!"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
while ! nc -z redis 6379; do
  sleep 1
done
echo "Redis is ready!"

# Wait for ChromaDB to be ready (if using)
if [ "$RAG_ENABLED" = "true" ]; then
    echo "Waiting for ChromaDB to be ready..."
    while ! nc -z chromadb 8000; do
      sleep 1
    done
    echo "ChromaDB is ready!"
    
    # Initialize RAG system
    echo "Initializing RAG system..."
    python -c "
import os
from unified_model.unified_intelligent_model import create_unified_model

# Create the unified model with RAG capabilities
print('Creating unified model with RAG capabilities...')
model = create_unified_model('balanced', 'friendly')
print('Unified model created successfully!')
"
fi

echo "Starting Hazoom Backend server..."
exec "$@"