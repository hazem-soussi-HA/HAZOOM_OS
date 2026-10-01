# Contributing to HAZOOM OS

## Before you change anything

Read these three, in this order. They are short and they are the whole point.

1. **`THE-ONE-OS.md`** — what the product is, and what the hierarchy is.
2. **`docs/MIGRATION-XP.md`** — why HAZOOM XP is a separate work and what may
   never be copied in.
3. **`CONTRACT.md`** — the law, hash-verified at boot.

## The five rules

These exist because the project spent months in a loop of near-duplicate
repositories. They are not style preferences.

1. **One repo.** No `-v2`, no `-unified`, no `-hub`. A new *name* means a new
   *idea*, and a new idea gets a **branch**, not a repository.
2. **Kernel first.** If a change does not serve the kernel, or the
   intelligence on top of it, it waits.
3. **No new HTML shells.** Everything enters through `apps-registry.json`. If
   it is not in the registry, the OS does not know it exists.
4. **Archive, do not fork.** Ideas branch. Repositories are for products.
5. **The measured truth wins.** If a document disagrees with `GET
   /api/benchmark` or `GET /api/surface`, the document is wrong. Fix the
   document, never the measurement.

## The loop that catches most of it

```bash
npm run check     # syntax on every client module, plus the icon consistency check
npm test          # smoke test against a running OS
```

`npm run check` fails on a dangling icon reference, glyph geometry that escapes
its viewBox, a tile declared in `ICON_ASSETS` with no file, a registry app
with neither a glyph nor a tile, and any reintroduction of a bare `appIcon()`
in a window title with no fixed slot. Those are all regressions that have
actually happened here, so they are all now mechanical.

## Things that will be rejected

- A second OS repository, in any spelling.
- A new standalone HTML app wired directly into the desktop instead of the
  registry.
- Anything that makes a claim the measurement cannot support.
- Copying GPL-3.0 source from HAZOOM XP into this repository.
- A window that opens a remote origin in an iframe, or relaxes
  `frameguard` on a service the OS does not host.

## Things that are wanted

- Kernel work. `kernel/c` and `kernel/pascal` are the product.
- Intelligence that is honest about being offline.
- Tests that disagree with the code.
- Documentation that reduces a number rather than rounding it up.

## Style

Match the file you are in. Comments explain *why*, not *what* — the code
already says what. Do not add comments to code you did not otherwise change.

## Licence

By contributing you agree your work is licensed under `LICENSE`
(proprietary, © Hazem Soussi). Do not paste GPL-3.0 source here; see
`docs/MIGRATION-XP.md`.
