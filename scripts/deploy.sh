#!/bin/bash
# HAZOOM OS V3 — Full Deployment Orchestrator
# Creator: Hazem Soussi
# Usage: ./deploy.sh [start|stop|restart|status|setup|ssl]

set -e

HAZOOM_DIR="/home/hazem/hazoom-os-v3"
DEPLOY_DIR="/opt/hazoom-os-v3"
SERVICE_NAME="hazoom-os"
PORT=${PORT:-3000}
HTTPS_PORT=${HTTPS_PORT:-8443}

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Run as root (sudo)"
        exit 1
    fi
}

install_deps() {
    log_info "Installing dependencies..."
    apt-get update -qq
    apt-get install -y -qq nodejs npm python3 python3-pip openssl curl > /dev/null 2>&1

    # Install PM2 globally
    npm install -g pm2 > /dev/null 2>&1

    # Install Node dependencies
    cd "$HAZOOM_DIR"
    npm ci --production > /dev/null 2>&1 || npm install --production > /dev/null 2>&1

    log_success "Dependencies installed"
}

setup_ssl() {
    log_info "Setting up SSL..."
    chmod +x "$HAZOOM_DIR/scripts/setup-ssl.sh"
    "$HAZOOM_DIR/scripts/setup-ssl.sh" "$1"
    log_success "SSL configured"
}

deploy() {
    log_info "Deploying HAZOOM OS v3 to $DEPLOY_DIR..."

    # Create deploy directory
    mkdir -p "$DEPLOY_DIR"

    # Copy files
    cp -r "$HAZOOM_DIR"/* "$DEPLOY_DIR/"
    cp "$HAZOOM_DIR"/.github/workflows/ci-cd.yml "$DEPLOY_DIR/.github/workflows/" 2>/dev/null || true

    # Install production deps
    cd "$DEPLOY_DIR"
    npm ci --production > /dev/null 2>&1 || npm install --production > /dev/null 2>&1

    # Create PM2 ecosystem file
    cat > "$DEPLOY_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
    apps: [{
        name: 'hazoom-os',
        script: 'server.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'production',
            PORT: 3000,
            HTTPS_PORT: 8443,
        },
        max_memory_restart: '1G',
        error_file: '/var/log/hazoom-os/error.log',
        out_file: '/var/log/hazoom-os/out.log',
        merge_logs: true,
    }]
};
EOF

    # Create log directory
    mkdir -p /var/log/hazoom-os

    # Start with PM2
    pm2 start "$DEPLOY_DIR/ecosystem.config.js"
    pm2 save
    pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true

    log_success "HAZOOM OS v3 deployed and running"
}

start() {
    log_info "Starting HAZOOM OS v3..."
    pm2 start hazoom-os 2>/dev/null || deploy
    log_success "HAZOOM OS v3 started"
}

stop() {
    log_info "Stopping HAZOOM OS v3..."
    pm2 stop hazoom-os 2>/dev/null || log_warn "Service not running"
    log_success "HAZOOM OS v3 stopped"
}

restart() {
    log_info "Restarting HAZOOM OS v3..."
    pm2 restart hazoom-os 2>/dev/null || deploy
    log_success "HAZOOM OS v3 restarted"
}

status() {
    echo "========================================="
    echo "  HAZOOM OS v3 — Status"
    echo "========================================="
    pm2 list 2>/dev/null || log_warn "PM2 not installed"
    echo ""
    log_info "Health check:"
    curl -sf http://127.0.0.1:$PORT/health 2>/dev/null || log_warn "Service not responding on port $PORT"
    echo ""
    log_info "HTTPS check:"
    curl -sfk https://127.0.0.1:$HTTPS_PORT/health 2>/dev/null || log_warn "HTTPS not available on port $HTTPS_PORT"
    echo ""
    log_info "SSL certificates:"
    ls -la "$HAZOOM_DIR/ssl/" 2>/dev/null || log_warn "No SSL certificates found"
    echo "========================================="
}

# Main
case "${1:-}" in
    setup)
        check_root
        install_deps
        ;;
    ssl)
        check_root
        setup_ssl "$2"
        ;;
    deploy)
        check_root
        deploy
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    *)
        echo "========================================="
        echo "  HAZOOM OS v3 — Deploy Orchestrator"
        echo "========================================="
        echo "Usage: sudo ./deploy.sh <command>"
        echo ""
        echo "Commands:"
        echo "  setup     Install dependencies"
        echo "  ssl       Setup SSL (optional: domain)"
        echo "  deploy    Deploy to production"
        echo "  start     Start service"
        echo "  stop      Stop service"
        echo "  restart   Restart service"
        echo "  status    Show status"
        echo "========================================="
        ;;
esac
