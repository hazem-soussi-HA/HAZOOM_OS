#!/bin/bash
# HAZOOM OS — LXC Test Environment Setup
# Creates an LXC container for testing HAZOOM OS

set -euo pipefail

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  HAZOOM OS v6.0 — LXC Test Environment                   ║"
echo "╚════════════════════════════════════════════════════════════╝"

CONTAINER_NAME="hazoom-os-test"
IMAGE="ubuntu:24.04"
MEMORY="4GB"
CPUS="2"
DISK="50GB"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${CYAN}[HAZOOM]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Step 1: Launch LXC container
log "Step 1: Launching LXC container..."
lxc launch ${IMAGE} ${CONTAINER_NAME} \
  -c limits.memory=${MEMORY} \
  -c limits.cpu=${CPUS} \
  -c security.nesting=true \
  || error "Failed to launch container"

# Step 2: Wait for container
log "Step 2: Waiting for container to be ready..."
lxc exec ${CONTAINER_NAME} -- cloud-init status --wait || true
sleep 5

# Step 3: Install dependencies
log "Step 3: Installing dependencies..."
lxc exec ${CONTAINER_NAME} -- bash -c "
  apt-get update && \
  apt-get install -y curl wget git docker.io docker-compose && \
  systemctl enable docker && \
  systemctl start docker
" || error "Failed to install dependencies"

# Step 4: Copy HAZOOM OS code
log "Step 4: Copying HAZOOM OS code..."
lxc file push -r /home/hazem/HAZOOM_OS ${CONTAINER_NAME}/opt/hazoom-os --recursive || \
  error "Failed to copy code"

# Step 5: Build and start
log "Step 5: Building and starting HAZOOM OS..."
lxc exec ${CONTAINER_NAME} -- bash -c "
  cd /opt/hazoom-os && \
  docker build -t hazoom-os:test . && \
  docker run -d \
    --name hazoom-os \
    -p 3000:3000 \
    -v /opt/hazoom-os/data/qlearner:/app/data/qlearner \
    --restart unless-stopped \
    hazoom-os:test
" || error "Failed to build and start"

# Step 6: Health check
log "Step 6: Running health check..."
sleep 5
if lxc exec ${CONTAINER_NAME} -- curl -sf http://localhost:3000/health > /dev/null 2>&1; then
  success "HAZOOM OS is running in LXC container!"
else
  error "Health check failed"
fi

# Step 7: Display info
CONTAINER_IP=$(lxc list ${CONTAINER_NAME} -c 4 --format csv | grep -oP '(\d+\.){3}\d+' | head -1)
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  LXC Test Environment Ready                                ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Container: ${CONTAINER_NAME}                              ║"
echo "║  IP:        ${CONTAINER_IP}                                ║"
echo "║  Port:      3000                                           ║"
echo "║  URL:       http://${CONTAINER_IP}:3000                    ║"
echo "║  Shell:     lxc exec ${CONTAINER_NAME} -- bash             ║"
echo "║  Stop:      lxc stop ${CONTAINER_NAME}                     ║"
echo "║  Delete:    lxc delete ${CONTAINER_NAME} --force           ║"
echo "╚════════════════════════════════════════════════════════════╝"
