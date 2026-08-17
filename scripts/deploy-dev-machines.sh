#!/usr/bin/env bash
# HAZOOM OS — Dev Farm Orchestrator (Juju machines × Kubernetes)
#
# 1. Waits for all 6 Juju dev machines to be started
# 2. Provisions each machine (git + node + repo clone + dev service)
# 3. Registers the farm in Kubernetes (hazoom-dev namespace) so the OS
#    can observe and reach each microservice dev environment
#
# Copyright © 2024-2026 Hazem Soussi — All Rights Reserved

set -euo pipefail
cd "$(dirname "$0")/.."

# Machine index → microservice
SERVICES=(planet-earth hazoom-pod chatdev-ornith birds-encyclopedia collaborative-beat descer)
EXPECTED=6
TIMEOUT_LOOPS=${TIMEOUT_LOOPS:-60}

echo "==> Waiting for ${EXPECTED} Juju machines to start..."
for ((i = 0; i < TIMEOUT_LOOPS; i++)); do
    READY=$(juju machines --format json 2>/dev/null | python3 -c "
import json, sys
ms = json.load(sys.stdin)['machines']
print(sum(1 for m in ms.values() if m['machine-status']['current'] in ('started', 'running')))
" 2>/dev/null || echo 0)
    if [ "$READY" -ge "$EXPECTED" ]; then
        echo "==> All ${EXPECTED} machines started."
        break
    fi
    echo "    ... ${READY}/${EXPECTED} started"
    sleep 10
done

mapfile -t MACHINES < <(juju machines --format json 2>/dev/null | python3 -c "
import json, sys
ms = json.load(sys.stdin)['machines']
for k in sorted(ms, key=int):
    if ms[k]['machine-status']['current'] in ('started', 'running'):
        print(k)
")

echo "==> Machines: ${MACHINES[*]}"

for idx in "${!MACHINES[@]}"; do
    MACH="${MACHINES[$idx]}"
    SVC="${SERVICES[$idx]:-unknown}"
    echo "==> Provisioning machine ${MACH} → ${SVC}"
    # shellcheck disable=SC2029
    juju ssh "${MACH}" "bash -s" < scripts/provision-dev-machine.sh "${SVC}" || \
        echo "    ! provisioning ${SVC} failed (retry manually: juju ssh ${MACH})"
done

echo "==> Registering dev farm in Kubernetes (hazoom-dev)"
export KUBECONFIG="${KUBECONFIG:-/home/ubuntu/config}"
kubectl apply -f deployment/k8s/hazoom-dev.yaml

echo "==> Dev farm status"
juju status 2>&1 | head -14
kubectl -n hazoom-dev get svc,endpoints 2>/dev/null | head -16

echo "==> Done. Dev machines are observable via:"
echo "    juju status"
echo "    kubectl -n hazoom-dev get endpoints"
echo "    OS desktop → GitHub Bridge → gated shell: juju status"