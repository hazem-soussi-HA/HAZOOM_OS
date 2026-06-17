#!/bin/bash

echo "🌌 Universe Map - Health Check Script"
echo "========================================"

check_service() {
    local service_name=$1
    local url=$2
    
    echo -n "Checking $service_name... "
    
    if curl -f -s "$url/health" > /dev/null 2>&1; then
        echo "✅ UP"
        return 0
    else
        echo "❌ DOWN"
        return 1
    fi
}

check_database() {
    echo -n "Checking PostgreSQL... "
    
    if docker exec universe-map-db-1 pg_isready -U universe > /dev/null 2>&1; then
        echo "✅ UP"
        return 0
    else
        echo "❌ DOWN"
        return 1
    fi
}

check_redis() {
    echo -n "Checking Redis... "
    
    if docker exec universe-map-redis-1 redis-cli ping > /dev/null 2>&1; then
        echo "✅ UP"
        return 0
    else
        echo "❌ DOWN"
        return 1
    fi
}

check_prometheus() {
    echo -n "Checking Prometheus... "
    
    if curl -f -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
        echo "✅ UP"
        return 0
    else
        echo "❌ DOWN"
        return 1
    fi
}

check_grafana() {
    echo -n "Checking Grafana... "
    
    if curl -f -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ UP"
        return 0
    else
        echo "❌ DOWN"
        return 1
    fi
}

echo "Service Health Status:"
echo "----------------------"

FAILED=0

check_service "Frontend" "http://localhost:3000" || FAILED=$((FAILED + 1))
check_service "Backend API" "http://localhost:8000" || FAILED=$((FAILED + 1))
check_database || FAILED=$((FAILED + 1))
check_redis || FAILED=$((FAILED + 1))
check_prometheus || FAILED=$((FAILED + 1))
check_grafana || FAILED=$((FAILED + 1))

echo ""
echo "========================="
if [ $FAILED -eq 0 ]; then
    echo "✨ All services are healthy!"
    exit 0
else
    echo "⚠️  $FAILED service(s) are down"
    exit 1
fi
