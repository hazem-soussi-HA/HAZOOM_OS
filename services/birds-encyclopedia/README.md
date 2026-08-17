# Birds Encyclopedia

Local-only bird encyclopedia for the HAZOOM OS ecosystem.

- **Port:** 4100 (bound to 127.0.0.1)
- **Run:** `node server/server.js`
- **UI:** `http://127.0.0.1:4100/` — Atlas view at `/atlas/`
- **API:**
  - `GET /api/birds` → `{ count, birds[] }`
  - `GET /api/birds/:id` → single bird entry
  - `GET /api/health` → `{ status }`

Species data lives in `server/data/birds.json`.