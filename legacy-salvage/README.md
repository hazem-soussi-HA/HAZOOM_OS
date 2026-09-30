# legacy-salvage

Work recovered from `hazoom-os-unified` (archived 2026-10-01) that does not
exist anywhere else in this repository. It is preserved here so nothing is
lost, and it is **not** part of the product build.

## What this is

`hazoom-os-unified` was 912 files / 187k lines. This directory holds the
14k lines that were genuinely unique. The rest of that repo was either
already present here, or duplicated HTML at two paths with identical content
(`apps/glm_integration.html` == `apps/ai-apps/glm_integration.html`, and
four more pairs), or superseded by work done here later.

## What is here

| Path | Lines | What it is | State |
|---|---|---|---|
| `kernel-ui/` | 1935 | React + TypeScript kernel dashboard. `App.tsx`, pages (Dashboard, Analytics, Agents, Observations, Deployments, Settings), hooks, components. | **Cannot build.** No `package.json`, no `tsconfig.json`, no lockfile. Orphaned — nothing imports it. This is a design, not a running app. |
| `kernel-python/` | 951 | Pascal-kernel bridges: `pascal_kernel.py` (shells out to `fpc`), `unified_kernel_bridge.py` (Neural Core + Consciousness + Aether), `alpha_chat.py` (local AI chat, 359 lines), `mind_web_interface.py`, plus Flask routes and a psutil sysinfo blueprint. | **Not wired in.** Nothing imports it. Needs `fpc` installed, which is not on this machine. `unified_kernel_bridge.py` hardcodes `KERNEL_DIR = /mnt/c/AlphaPony/core`, a path that does not exist. |
| `mcp/` | 751 | Two MCP supervisors (`MCP-Supervisor`, `MCP-Cloud-Supervisor`) — multi-agent orchestration, `goose_client.py`, AWS deploy script. | Standalone. Real code, independently runnable. |
| `universe-map/` | 427 | FastAPI backend: celestial models, database connection, `attention_optimizer.py`, security. | Standalone backend, needs its own deps. |
| `python-core/` | 824 | `hazoom_os` Python core: aether protocol, automation framework. | **Duplicated on disk** in the old repo as both `python/hazoom_os` and `python/hazoom-os`. Not imported by any entrypoint. No tests. |

## The honest summary

The kernel dream you remember is **already real and already here** — it is
`kernel/c/` (1951 lines of C: GDT, IDT, PIC, PIT, PMM, processes, Q-learning)
plus `kernel/pascal/` (2247 lines across 11 modules). Those compile. They
boot in QEMU. `Makefile` works.

What was in `hazoom-os-unified` was the *same dream in a different language*
— Pascal and Python and TypeScript versions of a kernel that had no
manifest, no imports, and no callers. Three half-built kernels, not three
missing features.

## If you ever want to build on this

- `kernel-ui/` needs a `package.json`, `tsconfig.json`, and a decision on
  whether it is a standalone dashboard or a view inside the OS shell.
  Recharts is imported but unpinned.
- `kernel-python/` needs `fpc` on PATH and `KERNEL_DIR` corrected to point
  at this repo's `kernel/pascal/`.

Nothing here is on the critical path. Nothing here should be started.
It is here so the option exists, and so the effort is not lost.
