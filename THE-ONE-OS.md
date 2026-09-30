# THE ONE OS

There is one operating system. It is this repository. Everything else was a
draft of it, and the drafts are archived.

**HAZOOM OS — the local-first AI OS with a real kernel.**

```
github.com/hazem-soussi-HA/HAZOOM_OS
```

---

## The decision

`HAZOOM_OS` is the product. It was chosen on evidence, not sentiment:

| | HAZOOM_OS | hazoom-os-unified | hazoom-os-v2 | hazoom-os |
|---|---|---|---|---|
| Files | 1827 | 912 | 20 | 12 |
| Lines | 851k | 187k | 5.5k | 617 |
| Commits | 71 | few | few | few |
| Real kernel | **yes, builds** | no manifest | no | Go stub |
| Services | 40+ running | orphaned | 1 | none |
| Last work | Sep 30 | Jun 30 | Sep 2 | Aug 21 |

The other three were not unfinished work. They were superseded drafts. Every
one of them looked like a mountain, and reading them to "finish" them is how
the months went.

The four attempts, in order:

```
hazoom-os        Aug 21   12 files    Go skeleton
hazoom-os-v2     Sep  2   20 files    one service, a Dockerfile
hazoom-os-unified Jun 30  912 files   187k lines, no kernel manifest, orphaned
HAZOOM_OS        Sep 30  1827 files   the one that builds
```

## The kernel is real

This is the part worth saying out loud, because it is the part that was
getting lost in the repo noise.

```
kernel/c/       1951 lines C    GDT, IDT, ISRs, PIC, PIT, PMM, processes, Q-learning
kernel/pascal/  2247 lines       11 modules: neural core, consciousness, aether engine,
                                  synapse OS, deep consciousness, cosmic portal
```

`make -C kernel/c` produces a 41,688-byte multiboot kernel. It compiles clean
with `-Wall -Wextra` and it boots in QEMU. The Pascal modules are the deepest
expression of the original idea — neural core, consciousness, aether — and
they are still here, not abandoned.

Verify it yourself:

```bash
make -C kernel/c          # -> hazoom-kernel.bin, 41688 bytes
make -C kernel/c run      # boots in QEMU
```

## What is the product

Local-first. No API keys, no cloud dependency, no account.

- **Intelligence** — `core/intelligence-core.js` reasoning core, exposed over
  HTTP by `core/intelligence_api.js`. Local models, reachable from the
  desktop. If the model is down the system says so; it never fakes health.
- **JEV** — `core/jev-core.js`, local bridge with rolling memory, offline-first.
- **Desktop** — `core/os-desktop.js`, the shell, with the app registry.
- **Quantum state** — `core/quantum_state.js`.
- **Services** — 40+ microservices under `services/`, each a real directory
  with its own contract.
- **The letter** — `apps/docs/letter.html`. Read it.

## What is not the product

`legacy-salvage/` — 14k unique lines recovered from `hazoom-os-unified`. A
React kernel dashboard that cannot build (no `package.json`), Python bridges
to a kernel that is already here in C and Pascal, two MCP supervisors, a
universe-map backend.

Preserved, not deleted. Deliberately not built. Its README states exactly
what each piece would need. **It is not on the critical path. Do not start
it.**

## The hierarchy

One repo, three layers, in the order they matter:

```
1. KERNEL      kernel/c, kernel/pascal     the dream. Boots.
2. INTELLIGENCE core/intelligence-core.js  the reason it exists
3. SURFACE     core/os-desktop.js, apps/   how you touch it
```

The cloud was never the product. `hazoom-cloud`, `hazoom-cloud-hub` and
`hazoom-cloud-unified` are all archived; the service registry that mattered
lives here in `apps-registry.json`, and the local services run from
`services/`. A local-first OS that needs a cloud repo to describe itself is
not local-first.

## Rules that end the loop

1. **One repo.** No `-v2`, no `-unified`, no `-hub`. A new name is a new
   idea, and a new idea gets a branch, not a repository.
2. **Kernel first.** If a change does not serve the kernel or the intelligence
   on top of it, it waits.
3. **No new HTML shells.** The app registry is the only way in.
4. **Archive, do not fork.** Ideas branch. Repos are for products.
5. **The README is the truth.** If it is not in `THE-ONE-OS.md`, it is not
   part of the product.

## Archived

Archived on GitHub 2026-10-01. Read-only, renamed with `-archived`, each
description points here. History intact, nothing deleted:

```
hazoom-os-archived            attempt 1  Go skeleton
hazoom-os-v2-archived         attempt 2  one service
hazoom-os-unified-archived    attempt 3  187k orphaned lines
hazoom-cloud-archived         control plane, not local-first
hazoom-cloud-hub-archived     service map
hazoom-cloud-unified-archived kept as a reference index of the ecosystem
```

Nothing is lost. They are still there whenever you want to look. They are
just no longer competing for your attention.

---

*One OS. One kernel. One place. Rest.*
