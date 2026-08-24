# Birds of Africa — 3D Ornithology Atlas

A fully **offline, confidential, air-gapped** 3D platform presenting birds of Africa.
Built for ornithology study and AGI knowledge ingestion.

## SECURITY / PRIVACY POSTURE
- **No cloud.** Three.js is vendored in `vendor/` — no CDN, no npm install at runtime.
- All data is local: `data/birds.json`. All models are local GLB in `assets/models/`.
- The dev server (`serve.py`) binds to `127.0.0.1` only and makes **zero outbound** requests.
- Drop your own GLTF/GLB models into `assets/models/` and reference them in `data/birds.json`
  to extend the collection without ever touching the network.

## RUN
    python3 serve.py
    # open http://127.0.0.1:8080

## FEATURES
- Orbit/zoom 3D gallery of African birds (procedural low-poly + real GLTF models).
- Click any bird (or its sidebar card) to inspect taxonomy, IUCN status, range, habitat,
  diet, size, call, and curated facts.
- Search by name/family/order and filter by IUCN status.

## DATA
- `data/birds.json` — curated species with taxonomy, range, IUCN status, calls, fun facts,
  and a `render` block (`{type:'gltf', model:...}` or `{type:'procedural', profile:{...}}`).
- IUCN status codes: LC, NT, VU, EN, CR (from IUCN Red List — status reference only).

## FOR THE AGI
- `src/generate-export.js` builds a JSON-LD knowledge graph (`export/ornithology.jsonld`)
  plus a question/answer training corpus (`export/training_corpus.jsonl`):
      node src/generate-export.js

## AUTOMATION — the "secret bag" (scripts/)
Build-time/dev automation, all local. Part of the Hazoom system.

    bash scripts/secret-bag.sh all     # export AGI graph + air-gap audit + serve
    bash scripts/secret-bag.sh audit   # self-check: no outbound network refs in app code
    bash scripts/secret-bag.sh export  # regenerate export/ (JSON-LD + corpus)
    bash scripts/secret-bag.sh serve   # serve on 127.0.0.1:$PORT (local only)

### Air-gap-safe enrichment (the "big encyclopedia" path)
To grow the atlas without ever touching the network at runtime:
1. Obtain a taxonomy export OFFLINE (copy an Avibase/IOC JSON to this machine
   via USB/air-gap). Drop it in `data/import/taxonomy.json`.
2. `bash scripts/enrich-local.sh` — merges new species as procedural birds,
   then regenerates the AGI graph. No fetch, no cloud.
Schema: `[{ "family", "order", "commonName", "scientificName", "iucnStatus", ... }]`

This is the privacy-correct answer to a "live API" fetcher: data is acquired
out-of-band and ingested locally, so the running app stays 100% air-gapped.

## FILE LAYOUT
    index.html              UI shell (offline)
    src/main.js             3D scene, gallery, interaction
    src/proceduralBird.js   parametric bird mesh generator
    vendor/                 vendored three.js (local)
    data/birds.json         ornithology dataset
    assets/models/          local GLB models
    export/                 AGI knowledge graph + corpus (generated)
    serve.py                local-only static server
