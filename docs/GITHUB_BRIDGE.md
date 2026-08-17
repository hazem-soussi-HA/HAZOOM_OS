# HAZOOM OS — GitHub Bridge & Real-Time Shell Observation

> The bridge that makes GitHub a **direct server for the OS**: push/PR/workflow
> activity flows into HAZOOM OS in real time, and the gated shell lets the OS
> observe (and safely operate) the machine — and the whole Juju/k8s dev farm.

Copyright © 2024-2026 Hazem Soussi — All Rights Reserved

## Architecture

```
GitHub ──webhook──▶ POST /api/github/webhook (HMAC-SHA256 verified)
   │                    │
   │                    ▼
   │             core/github_bridge.js
   │                    │  ring buffer (200) + WS broadcast
   │                    ▼
   │              WS 'github_event' ──▶ desktop toast + GitHub Bridge app
   │
   ├─poll (GITHUB_TOKEN)─▶ /api/github/sync (commits/PRs/runs)
   │
   └─push──────────────▶ ops/commands.json (GitOps) → gated shell
                              └──▶ commit statuses (ops/<name>)

OS shell ──WS 'command'──▶ core/shell.js (allowlist) → real output
```

## Components

| Component | File | Role |
|---|---|---|
| Bridge core | `core/github_bridge.js` | Webhook receiver, HMAC verify, REST client, ring buffer, GitOps executor |
| Gated shell | `core/shell.js` | Allowlist executor: read-only + safe git ops only |
| API | `core/api.js` | `/api/github/webhook`, `/api/github/events`, `/api/github/status`, `/api/github/sync`, `/api/shell/exec`, `/api/shell/log`, `/api/shell/stats` |
| WS | `core/websocket.js` | `github_event` broadcast, real `command` channel |
| Desktop | `apps/tools/github-bridge.html` | Live feed + gated shell panel |
| Terminal | `apps/core-apps/terminal.html` | `gh` command + real shell passthrough |
| GitOps control | `ops/commands.json` | Commands executed on push, results → commit statuses |
| CI callback | `.github/workflows/observe.yml` | Workflow runs reported back into the OS |

## Configuration (env or `config/local.json`)

| Env | Config key | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | `github.token` | Outbound polling (commits/PRs/runs) + commit statuses |
| `GITHUB_WEBHOOK_SECRET` | `github.webhookSecret` | HMAC-SHA256 verification of inbound webhooks |
| `GITHUB_OWNER` / `GITHUB_REPO` | `github.owner/repo` | Repo to observe |
| `GITHUB_POLL_INTERVAL` | `github.pollInterval` | Poll cadence (ms, default 30000) |

> `config/local.json` is gitignored — it holds the machine-local webhook secret.

## GitHub setup (one-time, on github.com)

1. Repo → **Settings → Webhooks → Add webhook**
2. Payload URL: `https://<os-host>/api/github/webhook`
3. Content type: `application/json`
4. Secret: the value of `GITHUB_WEBHOOK_SECRET` (see `config/local.json`)
5. Events: **push**, **pull_request**, **workflow_run** (select individually)
6. Add repo secrets for the CI callback (`.github/workflows/observe.yml`):
   - `OS_WEBHOOK_URL` — same URL as step 2
   - `OS_WEBHOOK_SECRET` — same secret

## Gated shell allowlist

```
git status|log|diff|branch|show|rev-parse|remote|fetch|pull --ff-only|tag|blame
ps, uptime, ls, df -h, free -h, uname, date, hostname, whoami
node --version, npm --version
docker ps|stats --no-stream|images|network ls|volume ls
juju status|machines|models|controllers
kubectl get|describe|top|logs
```

Everything else is **denied and logged** (`/api/shell/log`). Override via the
`allowlist` option in code — do not weaken in production.

## GitOps control plane (`ops/commands.json`)

On every `push` webhook, the OS executes the allowlisted commands listed in
`ops/commands.json` and reports each result as a GitHub commit status under
context `ops/<name>`. Add commands there to make the OS react to commits —
e.g. `git fetch origin`, health probes, `juju status` snapshots.

## Verification

```bash
# signed webhook (local):
PAYLOAD='{"ref":"refs/heads/main","head_commit":{"id":"abc123","message":"hi"},"sender":{"login":"hazem-soussi-HA"}}'
SIG="sha256=$(printf '%s' "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')"
curl -X POST localhost:3000/api/github/webhook \
  -H 'Content-Type: application/json' -H 'X-GitHub-Event: push' \
  -H "X-Hub-Signature-256: $SIG" -d "$PAYLOAD"

# observe:
curl localhost:3000/api/github/events
curl localhost:3000/api/github/status

# shell:
curl -X POST localhost:3000/api/shell/exec -d '{"command":"juju status"}'

# desktop:
#   Open http://localhost:3000 → GitHub Bridge app, or terminal → `gh status`
```