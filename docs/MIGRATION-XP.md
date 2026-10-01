# MIGRATION TRACE — HAZOOM XP → HAZOOM OS

Written 2026-10-01, before anything was moved. This file is the record of
what was decided, what was taken, what was deliberately left behind, and why.

**Nothing in the HAZOOM XP working tree was modified, moved, or deleted to
produce this.** Verified after the work:

```
XP HEAD            f604873   (unchanged)
XP dirty files     57        (all pre-existing, yours — none added here)
XP licences        GPL-3.0-only, intact, SPDX tags still in every file
XP source in OS    0 files
OS licence         proprietary, unchanged
```

---

## 1. The blocker: license

This is the reason the merge is *integration* and not *copying*, and it is not
a technicality.

| Work | License |
|---|---|
| **HAZOOM XP** (`maze-ship`) | **GPL-3.0-only** — stated in its own `LICENSE`, and SPDX-tagged in every source file |
| **HAZOOM OS** (`HAZOOM_OS`) | **Proprietary, All Rights Reserved** |

The XP `LICENSE` is explicit:

> *"if you convey a modified Program (or a work based on it), you must license
> the whole work under GPL-3.0 … and provide Corresponding Source"*

So copying `xp-shell.js`, `xp-games.js`, `xp-views.js`, `xp-matrix.js`,
`xp-accessories.js`, `xp-system.js` or `xp.css` into `HAZOOM_OS` would make
the OS a GPL-3.0 derivative. That would pull the C kernel, all 22 service
directories, the Solidity contracts, and the Stripe-connected Hazoom POD
storefront into GPL-3.0 — the opposite of what `MONETIZATION.md` and the
proprietary `LICENSE` intend.

**That was not done.**

## 2. The three options, and the one chosen

| Option | What it means | Verdict |
|---|---|---|
| **A. Copy the code** | OS becomes GPL-3.0 | Rejected. Would licence the kernel, the services and the storefront away. |
| **B. Re-license XP** | Author re-grants XP under a proprietary licence for this use | Rejected for now. **The author may do this at any time** — it is his copyright. But the already-published GPL version stays GPL in history, and it is a one-way door, so it is his call to make deliberately, not mine to make silently inside a merge. |
| **C. Separate work, executed not copied** | OS runs XP intact; XP stays GPL with its source available; OS stays proprietary | **Chosen.** |

Option C is the standard boundary: HAZOOM OS does not *incorporate* XP, it
*runs* it. XP keeps its licence, its source, its git history and its ability
to be updated independently. The OS keeps its proprietary status. Neither
work is degraded.

This also happens to be the better engineering outcome: all 44 XP apps become
reachable in one move instead of 44 hand-ported rewrites, and the XP tree
stays a live development surface rather than a frozen copy.

## 3. What HAZOOM XP actually contains

Measured from the tree, not from its README.

```
131 tracked files   20 commits
9,061 lines         public/*.js + public/*.css
44 apps registered  across 6 menus
16 root HTML pages
```

| Module | Lines | Apps |
|---|---|---|
| `xp-shell.js` | 53,827 B | 10 — the shell, window manager, hzOS bus, session memory, icon system |
| `xp-games.js` | 866 | 7 — Super Maze Bros, Duck Hunt, Pac-Maze, Galaxy Invaders, Road Frog, Asteroid Field, Retro Arcade |
| `xp-views.js` | 521 | 8 — Library, Final Guide, The Reckoning, Omega Chat, Memory, Transcendance, Agents, HAZOOM Kernel |
| `xp-matrix.js` | 626 | 9 — Quantum Keys, The Oracle, The Construct, Zion Mainframe, Sentinel AI, Plugin Matrix, Matrix Rain, White Rabbit, Zion Comms |
| `xp-system.js` | 383 | 6 — Minesweeper, Task Manager, My Computer, Treasury, Display, System |
| `xp-accessories.js` | 250 | 4 — Notepad, Paint, Calculator, Command Prompt |

Also present and **not** part of the app surface: `hazoom/hazoom_ppo.onnx`
(a trained RL model), `hazoom/physics.wasm`, `hazoom/classic.js` (52 KB),
`hazoom/liberty.html` (77 KB), and a 16-page root set including
`dimensions.html` (100 KB), `cloud.html` (76 KB), `brain-3d.html`.

The genuinely novel capabilities in XP that the OS does not have:

- **hzOS event bus** — apps talk to each other through it; aspect scores land
  in Memory. The OS has no equivalent inter-app bus.
- **Session memory that learns** — boots, launches, and bus events are
  persisted to `localStorage` and read back. The OS has Q-learning but no
  equivalent "what did the user actually do" ledger.
- **Graphics Power Layer** — renderer capability probe with
  performance/balanced/quiet profiles and a live FPS meter.
- **D0–D6 aspect model** — Transcendance scores the interaction across seven
  dimensions, feeding Sentinel AI and Omega Chat.
- **Trained PPO policy** — `hazoom_ppo.onnx`, a real learned artefact.

## 4. What the OS contributes that XP lacks

- A **real kernel** — 2,410 lines of C, 9 subsystems, builds to a 41,688-byte
  multiboot image. XP has no kernel.
- **22 service directories** and a launcher. XP is a static site.
- **Working local intelligence** — 12 models, `hazoom-omega:v3` active.
- **Auth, rate limiting, and a hardened outbound fetcher** with SSRF,
  protocol-smuggle, redirect-pivot and credential-leak defences. XP's browser
  has no such boundary.
- **Audit trail** — 75 commits, one product.

Neither work subsumes the other. That is precisely why integration beats
copying: the OS supplies the substrate, XP supplies 44 apps and a bus.

## 5. The trace

| Action | Detail |
|---|---|
| Read | XP tree, LICENSE, 6 shell modules, icon system, graphics layer, app registry |
| Measured | 131 files, 20 commits, 9,061 lines, 44 apps — from the tree |
| Copied into the OS | **nothing** |
| Modified in the XP tree | **nothing** |
| Deleted anywhere | **nothing** |
| Added to the OS | `core/benchmark.js` (measures both works live), `GET /api/benchmark`, the trace you are reading, the migration entry in the app registry |

## 6. Standing rules for any future XP work

1. **Never copy GPL-3.0 source into `HAZOOM_OS`.** If a change is wanted in
   both, it gets written twice, or the OS calls XP over its own API.
2. **Keep the licence header.** Every XP file carries its SPDX tag. Files
   entering the OS carry the OS's proprietary notice. Neither drifts.
3. **A merge is a decision, not a copy.** The trace is written *before* the
   move, and the answer "separate work" is a valid and often correct one.
4. **If re-licensing is ever wanted**, it is a deliberate, separate act with
   the history consequence stated in writing first. Not a merge side-effect.

## 7. Status

| | |
|---|---|
| XP working tree | untouched, HEAD `f604873` |
| XP licences | unchanged, GPL-3.0-only |
| OS licences | unchanged, proprietary |
| Code moved | none, by design |
| Integration | via the app registry, as a separate work |
