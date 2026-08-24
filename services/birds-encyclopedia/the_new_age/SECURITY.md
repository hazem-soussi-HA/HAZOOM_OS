# SECURITY & PRIVACY — The New Age of Birds

This repository is **PRIVATE** and intended for local, air-gapped use only.

## Hard rules
1. **No cloud at runtime.** Three.js is vendored in `vendor/`. All data is local
   (`data/`), all 3D models are local (`assets/models/`). The dev server (`serve.py`)
   binds to `127.0.0.1` and makes **zero outbound network calls**.
2. **No external image/CSS/JS CDNs.** The `index.html` import map points only to local files.
3. **No secrets.** This repo contains no API keys, tokens, credentials, or PII.
   The only "key-shaped" string is the local JSON-LD namespace `https://local.agi/...`,
   which is an offline identifier, not a network endpoint.
4. **Build-time network only.** A maintainer may use the internet *once* at build time
   to fetch vendored dependencies (three.js) or sample GLB models, which are then committed
   locally. After that, the project is fully self-contained.
5. **Logo assets are generated on-device** as SVG (see `assets/logo/`). Do not route
   project art through third-party image services.

## Verification
`node verify-runtime.mjs` asserts: page loads, scene renders, and **external hosts hit = NONE**.

## If you must extend
- Add birds via `data/birds.json` + local GLB in `assets/models/`. Never paste a remote URL.
- Re-run `node src/generate-export.js` to refresh the AGI knowledge graph offline.
