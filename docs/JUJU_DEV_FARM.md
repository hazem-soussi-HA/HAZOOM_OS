# HAZOOM OS — Juju Dev Farm & Kubernetes Orchestration

> 6 Juju machines (LXD) — one per major microservice — acting as the
> microservice **dev farm** for the OS, registered and exposed through
> Charmed Kubernetes so the whole farm is observable from one shell.

Copyright © 2024-2026 Hazem Soussi — All Rights Reserved

## Topology

```
hazoom-controller (Juju, LXD) ── model: hazoom-dev
├── machine 0  planet-earth       10.182.153.39 :8080
├── machine 1  hazoom-pod         10.182.153.90 :4000
├── machine 2  chatdev-ornith     10.182.153.41 :5055
├── machine 3  birds-encyclopedia 10.182.153.178:4100
├── machine 4  collaborative-beat 10.182.153.188:5000
└── machine 5  descer             10.182.153.251:6000

Charmed Kubernetes (existing cluster, 2 nodes)
└── namespace hazoom-dev: 6 Services + Endpoints (machine IPs) + Ingress
```

## Components

| Component | File | Role |
|---|---|---|
| Bundle | `deployment/charmed/hazoom-dev-bundle.yaml` | Reproducible 6-machine farm definition |
| Provisioner | `scripts/provision-dev-machine.sh` | Runs inside a machine: git + node + clone + systemd unit + runner prep |
| Orchestrator | `scripts/deploy-dev-machines.sh` | Wait for machines → provision all → apply k8s manifests |
| k8s manifests | `deployment/k8s/hazoom-dev.yaml` | Namespace, 6 services, ingress routes (`dev.*.hazoom.local`) |
| Endpoints | `scripts/dev-farm-endpoints.sh` | Refresh Endpoints from current `juju machines` IPs |

## One-time setup

```bash
# juju controller on LXD (already done on the dev host)
juju bootstrap lxd hazoom-controller
juju add-model hazoom-dev
for m in planet-earth hazoom-pod chatdev-ornith birds-encyclopedia collaborative-beat descer; do
    juju add-machine --constraints "cores=1 mem=1024M" -n 1
done

# provision + orchestrate
bash scripts/deploy-dev-machines.sh
bash scripts/dev-farm-endpoints.sh   # after any machine restart
```

## Machine contents (per container)

- `/opt/hazoom-dev/HAZOOM_OS` — shallow clone of the repo (branch `develop`,
  HTTPS fallback; SSH clone works if the machine holds the deploy key)
- systemd unit `hazoom-dev-<service>` for services shipping a Node server
- `/opt/actions-runner` — self-hosted GitHub Actions runner **prepared**;
  register with:
  ```bash
  cd /opt/actions-runner && sudo ./svc.sh install && sudo ./svc.sh start
  # (after ./config.sh --url ... --token <registration token>)
  ```

## Observation from the OS

The gated shell (GitHub Bridge / terminal) can observe the farm without
leaving the OS:

```
juju status
juju machines
kubectl get endpoints -n hazoom-dev
kubectl get pods -A
```

## Resource notes

- Host: 2 cores / 6 GB. Machines run at 1 core / 1 GB each; the Charmed
  control plane shares the host. Keep dev servers light; the farm is for
  dev/CI, not production load.
- Production remains `deployment/k8s/hazoom-fullstack.yaml` on the Charmed
  cluster (or the kubeconfig target), driven by the CI/CD pipeline.

## Teardown

```bash
juju destroy-model hazoom-dev --destroy-storage
juju destroy-controller hazoom-controller --destroy-all-models --destroy-storage
kubectl delete namespace hazoom-dev
```