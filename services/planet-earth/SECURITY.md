# Security Policy — Planet Earth

This document describes the security posture of the Planet Earth emulation and
how to report issues. **The app is designed to be fully offline / air-gapped:**
it makes zero external network calls at runtime.

## Posture summary

| Control | Status |
| --- | --- |
| Runtime network egress | **None** — 0 external requests (verified in CI-style headless test) |
| Third-party CDN at runtime | None — Three.js is vendored in `vendor/` |
| Secrets / API keys in repo | None (scanned before every push) |
| Repository visibility | **Private** |
| `eval()` / remote scripts | None |
| Dev server binding | `127.0.0.1` only (not exposed to the network) |

## Offline / air-gapped guarantee

- All dependencies (Three.js core + `OrbitControls`) are committed under
  `vendor/` and resolved through a local import map — no `unpkg`/`npm`/`jsdelivr`
  fetch happens when the page loads.
- All textures are bundled under `assets/textures/` and are public,
  NASA-derived imagery (Blue Marble / Black Marble family). No telemetry, no
  analytics, no fonts, no external CSS.
- The headless verification (`verify.mjs`) installs **Puppeteer only as a
  build-time tool** (`npm i --no-save`), which is git-ignored and never shipped.
  The verification asserts that the live page issues **zero** requests to any
  host other than `127.0.0.1`/`localhost`.

## Dependency policy

- **Shipped runtime deps:** none. The vendored `three.module.js` is the only
  third-party code that executes in the browser, and it is pinned to r160.
- **Dev-only deps:** Puppeteer (for the optional headless render test). Kept out
  of the repo via `.gitignore`; not part of the deployed artifact.

## Secret hygiene

Before any push, `scripts/security-scan.sh` greps the tree (excluding
`node_modules`, `.git`, and binary assets) for:

- `api_key` / `secret` / `token` / `password` assignments
- cloud key patterns: `sk-…`, `ghp_…`, `AIza…`, `xoxb-…`, `AKIA…`
- inline `scheme://user:pass@host` credentials
- PEM private-key blocks

Any match fails the push. No real credentials are stored in this repository.

## Running the security verification locally

```bash
# 1) secret scan
bash scripts/security-scan.sh

# 2) headless render + air-gap proof (optional, needs a browser)
npm i --no-save puppeteer
python3 server.py &            # serves 127.0.0.1:8080
node verify.mjs                # asserts zero external requests + renders
# cleanup:
rm -rf node_modules package-lock.json _verify_shot.png
```

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue.

- Or use GitHub's private security advisories on this repository.

We do not publish a personal contact address in this tree. Vulnerabilities are
handled privately, by the repository owner, until resolved.

We aim to acknowledge reports within 72 hours.

## The confidential contract is encrypted at rest

`CONTRACT.md` (the plaintext charter) is **never** committed — it is gitignored.
Only `CONTRACT.md.gpg` (AES-256 PGP ciphertext) lives in the tree.

To read it, decrypt with the passphrase held by the Author (not stored in this
repo or in the assistant's context):

```bash
gpg --decrypt CONTRACT.md.gpg > CONTRACT.md.plain   # then read CONTRACT.md.plain
```

The passphrase is generated once, shown to the Author, and kept only by them.

## Hardening notes for deployers

- The included `server.py` is a dev server bound to `127.0.0.1`. For any
  production deployment, put it behind your own TLS-terminating reverse proxy
  and apply a Content-Security-Policy that blocks all `connect-src` / external
  origins, preserving the offline guarantee.
- Because the app is static and asset-only, it can be served from any
  origin-isolated, read-only CDN without changing its offline behavior.
