#!/bin/bash
# HAZOOM OS — Charmed Kubernetes Deployment Script
# Deploys HAZOOM OS to a Charmed K8s cluster

set -euo pipefail

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  HAZOOM OS v6.0 — Charmed Kubernetes Deployment          ║"
echo "║  The Operating System That Learns                         ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Configuration
JUJU_CONTROLLER="hazoom-controller"
JUJU_MODEL="hazoom-prod"
K8S_CLUSTER="hazoom-k8s"
DOMAIN="hazoom.peaceful.world"
EMAIL="admin@peaceful.world"

# Colors
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${CYAN}[HAZOOM]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${PURPLE}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Step 1: Bootstrap Juju controller on K8s
log "Step 1: Bootstrapping Juju controller on Kubernetes..."
juju bootstrap ${K8S_CLUSTER} ${JUJU_CONTROLLER} \
  --config caas-image-repo=rocks.canonical.com/cdk \
  --constraints "mem=4G cores=2" || warn "Controller may already exist"

# Step 2: Create model
log "Step 2: Creating Juju model..."
juju add-model ${JUJU_MODEL} ${JUJU_CONTROLLER} || warn "Model may already exist"

# Step 3: Deploy MicroK8s addons
log "Step 3: Enabling MicroK8s addons..."
microk8s enable dns storage ingress cert-manager helm3

# Step 4: Deploy HAZOOM OS bundle
log "Step 4: Deploying HAZOOM OS bundle..."
juju deploy ./deployment/charmed/hazoom-os-bundle.yaml \
  --model ${JUJU_CONTROLLER}:${JUJU_MODEL}

# Step 5: Wait for deployment
log "Step 5: Waiting for deployment to be ready..."
juju wait-for application hazoom-os --timeout 600 \
  --model ${JUJU_CONTROLLER}:${JUJU_MODEL}

# Step 6: Configure DNS
log "Step 6: Configuring DNS..."
INGRESS_IP=$(kubectl get svc -n hazoom-os hazoom-os-service \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

if [ -n "$INGRESS_IP" ]; then
  log "Ingress IP: $INGRESS_IP"
  log "Update your DNS:"
  log "  ${DOMAIN} → A → ${INGRESS_IP}"
  log "  api.${DOMAIN} → A → ${INGRESS_IP}"
  log "  test.${DOMAIN} → A → ${INGRESS_IP}"
else
  warn "Could not determine Ingress IP. Check with: kubectl get svc -n hazoom-os"
fi

# Step 7: Verify deployment
log "Step 7: Running health checks..."
sleep 10
if curl -sf https://${DOMAIN}/health > /dev/null 2>&1; then
  success "HAZOOM OS is live at https://${DOMAIN}"
else
  warn "Health check failed. Deployment may still be starting."
  log "Check status with: juju status --model ${JUJU_CONTROLLER}:${JUJU_MODEL}"
fi

# Step 8: Display status
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Deployment Complete                                       ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Domain:    https://${DOMAIN}                ║"
echo "║  API:       https://api.${DOMAIN}            ║"
echo "║  Status:    juju status                                     ║"
echo "║  Logs:      juju debug-log --replay                        ║"
echo "║  Scale:     juju scale-application hazoom-os 5            ║"
echo "╚════════════════════════════════════════════════════════════╝"
