# Changelog

All notable changes to Hazoom are documented here.

This project adheres to [Semantic Versioning](https://semver.org/). The canonical
version lives in `package.json` (`version`) and is surfaced at runtime:

- `GET /api/config` → `version`
- `GET /api/health` → `version`
- Footer of the SaaS UI (auto-populated from `/api/config`)

## [1.1.0] - 2026-07-11

### Added
- **Real 3D T-shirt garment preview** in the Design Studio — a procedural mesh
  (body, sleeves, scooped neckline) with correct chest UV mapping, replacing the
  flat placeholder panel. Mug/cap shapes retained.
- **Hazoom logo** (mark + wordmark SVG, brand-gradient) wired into the SaaS
  header/footer and this README, plus a new SVG favicon (`client/assets/`).
- **Release versioning**: version exposed via the API (`/api/config`,
  `/api/health`), shown in the app footer, and tracked in this changelog.

## [1.0.0] - 2026-07-11

### Added
- Initial Hazoom POD platform: storefront, Design Studio, cart/checkout, admin
  dashboard, Stripe (offline demo) + Printify (mock) fulfillment, and an on-chain
  Proof-of-Work / Proof-of-Concept notarization contract.
