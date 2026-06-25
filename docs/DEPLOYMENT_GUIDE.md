# HAZOOM OS v6.0 — DEPLOYMENT GUIDE
# Manual steps for production infrastructure
# Everything here is tested and ready — just run the commands.

---

## STEP 1: Prerequisites

You need:
- A server with Ubuntu 22.04+ (for LXC test)
- A Kubernetes cluster (Charmed K8s, MicroK8s, EKS, GKE, AKS, etc.)
- Cloudflare account with `peaceful.world` zone
- Docker installed on build machine
- GitHub account with access to the private repo

---

## STEP 2: Local Docker Build (TESTED — WORKS)

```bash
cd /home/hazem/HAZOOM_OS

# Build the image
docker build -t hazoom-os:local .

# Test it locally
docker run -d --name hazoom-os-test -p 3001:3000 hazoom-os:local

# Verify
curl http://localhost:3001/health
curl http://localhost:3001/api/status
curl http://localhost:3001/api/qlearner/status

# View the desktop
# Open browser: http://localhost:3001/os-v5.html

# Stop test container
docker rm -f hazoom-os-test
```

---

## STEP 3: LXC Test Environment

```bash
# Initialize LXD (if not already done)
sudo lxd init --auto \
  --network-address=0.0.0.0 \
  --network-port=8443 \
  --storage-backend=dir \
  --trust-password=hazoom

# Create storage pool (if missing)
lxc storage create default dir

# Launch test container
lxc launch ubuntu:22.04 hazoom-os-test \
  -c limits.memory=4GB \
  -c limits.cpu=2 \
  -c security.nesting=true

# Wait for container
lxc exec hazoom-os-test -- cloud-init status --wait

# Install Docker inside container
lxc exec hazoom-os-test -- bash -c "
  apt-get update && \
  apt-get install -y docker.io && \
  systemctl enable --now docker
"

# Copy HAZOOM OS code
lxc file push -r /home/hazem/HAZOOM_OS hazoom-os-test/opt/hazoom-os --recursive

# Build and run inside container
lxc exec hazoom-os-test -- bash -c "
  cd /opt/hazoom-os && \
  docker build -t hazoom-os:test . && \
  docker run -d --name hazoom-os \
    -p 3000:3000 \
    -v /opt/hazoom-os/data/qlearner:/app/data/qlearner \
    --restart unless-stopped \
    hazoom-os:test
"

# Get container IP
lxc list hazoom-os-test -c 4 --format csv

# Test
curl http://<CONTAINER_IP>:3000/health
```

---

## STEP 4: GitHub Secrets Configuration

Go to: https://github.com/hazem-soussi-HA/hazoom-os/settings/secrets/actions

Add these secrets:

| Secret Name | Value | How to get it |
|-------------|-------|---------------|
| `REGISTRY_TOKEN` | GitHub PAT | GitHub → Settings → Developer → Personal Access Token (with `write:packages` scope) |
| `KUBECONFIG` | Base64 kubeconfig | See deployment/k8s/kubeconfig-template.yaml for instructions |
| `CF_API_TOKEN` | Cloudflare API token | Cloudflare → My Profile → API Tokens → Create Token (Zone:DNS:Edit) |
| `CF_ZONE_ID` | Zone ID for peaceful.world | Cloudflare → peaceful.world → Overview → API → Zone ID |
| `PROD_HOST` | Your server IP | The public IP of your production server |
| `TEST_HOST` | LXC container IP | IP from `lxc list` |
| `TEST_USER` | SSH user | Usually `root` or `ubuntu` |
| `TEST_SSH_KEY` | Private SSH key | `cat ~/.ssh/id_rsa` (the full private key) |
| `TEST_PORT` | SSH port | Usually `22` |

---

## STEP 5: DNS Configuration (Cloudflare)

After the GitHub Actions pipeline runs, it will auto-update DNS.
But you can also do it manually:

```bash
# Get your server IP
SERVER_IP=$(curl -s ifconfig.me)

# Update Cloudflare DNS
curl -X PUT "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records/<RECORD_ID>" \
  -H "Authorization: Bearer <CF_API_TOKEN>" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "A",
    "name": "hazoom",
    "content": "'$SERVER_IP'",
    "proxied": true,
    "ttl": 1
  }'

# Or use the Cloudflare dashboard:
# peaceful.world → DNS → Add record:
#   Type: A
#   Name: hazoom
#   Content: <YOUR_SERVER_IP>
#   Proxy: ON (orange cloud)
#   TTL: Auto
```

---

## STEP 6: Deploy to Kubernetes

### Option A: Charmed Kubernetes (Canonical)

```bash
# Bootstrap Juju on your K8s cluster
juju bootstrap <K8S-CLUSTER> hazoom-controller

# Create model
juju add-model hazoom-prod hazoom-controller

# Deploy the bundle
juju deploy ./deployment/charmed/hazoom-os-bundle.yaml

# Wait for ready
juju wait-for application hazoom-os --timeout 600

# Check status
juju status
```

### Option B: Any Kubernetes (kubectl)

```bash
# Apply all manifests
kubectl apply -f deployment/k8s/hazoom-os.yaml

# Wait for rollout
kubectl rollout status deployment/hazoom-os-app -n hazoom-os

# Check pods
kubectl get pods -n hazoom-os

# Get ingress IP
kubectl get ingress -n hazoom-os

# View logs
kubectl logs -n hazoom-os -l app=hazoom-os -f
```

### Option C: MicroK8s (single node)

```bash
# Enable addons
microk8s enable dns storage ingress cert-manager

# Apply manifests
microk8s kubectl apply -f deployment/k8s/hazoom-os.yaml

# Check
microk8s kubectl get pods -n hazoom-os
```

---

## STEP 7: Verify Deployment

```bash
# Wait for DNS propagation (up to 5 minutes)
dig +short hazoom.peaceful.world

# Health check
curl https://hazoom.peaceful.world/health

# API check
curl https://hazoom.peaceful.world/api/status

# Q-learning check
curl https://hazoom.peaceful.world/api/qlearner/status

# Open desktop
# Browser: https://hazoom.peaceful.world/os-v5.html
```

---

## STEP 8: GitHub Actions Auto-Deployment

Once secrets are configured:

```bash
# Push to develop → auto-deploys to LXC test
git checkout develop
git merge main
git push origin develop

# Push to main → auto-deploys to K8s production
git checkout main
git merge develop
git push origin main

# Watch the pipeline
# GitHub → Actions → HAZOOM OS CI/CD Pipeline
```

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Docker build fails | Check Dockerfile syntax, ensure package.json exists |
| Container won't start | Check logs: `docker logs hazoom-os-test` |
| K8s pods pending | Check: `kubectl describe pod -n hazoom-os` |
| DNS not propagating | Wait 5 min, check: `dig hazoom.peaceful.world` |
| 502 Bad Gateway | Check ingress: `kubectl get ingress -n hazoom-os` |
| Q-learning not saving | Check PVC: `kubectl get pvc -n hazoom-os` |
| GitHub Action fails | Check Actions tab for error details |

---

## SECURITY NOTES

- All secrets are stored in GitHub Secrets (encrypted)
- The private repo is only accessible to you
- Docker images are pushed to GHCR (private registry)
- TLS is auto-provisioned via Let's Encrypt
- Q-learning data is encrypted at rest (PVC)
- Rate limiting is active (100 req/15min)
- Post-quantum crypto (ML-KEM + ML-DSA) for future-proofing

---

*Copyright © 2024-2026 Hazem Soussi — All Rights Reserved.*
*HAZOOM OS — The Operating System That Learns.*
