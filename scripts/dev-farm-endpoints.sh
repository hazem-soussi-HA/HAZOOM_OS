#!/usr/bin/env bash
# HAZOOM OS — Populate k8s Endpoints for the Juju dev farm
# Reads `juju machines` IPs and writes Endpoints objects so the
# hazoom-dev Services resolve to the current LXD machine addresses.
#
# Usage: scripts/dev-farm-endpoints.sh
# Copyright © 2024-2026 Hazem Soussi — All Rights Reserved

set -euo pipefail
cd "$(dirname "$0")/.."

export KUBECONFIG="${KUBECONFIG:-/home/ubuntu/config}"

SERVICES=(planet-earth hazoom-pod chatdev-ornith birds-encyclopedia collaborative-beat descer)
PORTS=(8080 4000 5055 4100 5000 6000)

mapfile -t IPS < <(juju machines --format json 2>/dev/null | python3 -c "
import json, sys
ms = json.load(sys.stdin)['machines']
for k in sorted(ms, key=int):
    st = ms[k]['machine-status']['current']
    if st in ('started', 'running') and ms[k].get('ip-addresses'):
        print(ms[k]['ip-addresses'][0])
")

echo "==> Machine IPs: ${IPS[*]:-none}"

for i in "${!SERVICES[@]}"; do
    SVC="${SERVICES[$i]}"
    IP="${IPS[$i]:-}"
    if [ -z "$IP" ]; then
        echo "    ! no IP for ${SVC} — skipping"
        continue
    fi
    cat <<EOF | kubectl apply -f - >/dev/null
apiVersion: v1
kind: Endpoints
metadata:
  name: dev-${SVC}
  namespace: hazoom-dev
subsets:
  - addresses:
      - ip: ${IP}
    ports:
      - port: ${PORTS[$i]}
        name: http
EOF
    echo "    ${SVC} → ${IP}:${PORTS[$i]}"
done

echo "==> Endpoints:"
kubectl -n hazoom-dev get endpoints