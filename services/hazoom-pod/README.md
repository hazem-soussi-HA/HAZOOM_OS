# Hazoom — Print-on-Demand E-commerce Platform

<p align="center">
  <img src="client/assets/logo.svg" alt="Hazoom" height="56" />
</p>

<p align="center">
  <strong>Create. Customize. Drop-ship.</strong> — a futuristic print-on-demand studio.
</p>

> Current version: **1.1.0** — see [CHANGELOG.md](./CHANGELOG.md) for the full release history.

A complete, production-ready POD storefront + admin dashboard. Built by **Hazem Soussi**.

- **Frontend:** HTML5, Tailwind (CDN), Vanilla ES6+ JS — SPA with hash routing, dark mode, responsive, loading states.
- **Backend:** Node.js + Express, JWT auth, bcrypt password hashing.
- **Database:** SQLite (zero-config, via `better-sqlite3`) — **MongoDB supported** (see below).
- **Payments:** Stripe (test mode) with webhook handling.
- **Fulfillment:** Printify API (catalog sync, order submission, webhook-ready) with a safe **mock mode** when no token is set.

> The app is **fully runnable with zero external credentials**: Stripe runs in offline/demo mode and Printify runs in mock mode, so you can click through the whole flow locally. Add real keys to enable live payments/fulfillment.

---

## Quick start

```bash
# 1. Copy env and adjust (optional — defaults work out of the box)
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Start the server (serves the API on :4000 and hosts the client)
npm start
# or with auto-reload: npm run dev

# 4. Open the store
#    http://localhost:4000
```

On first launch the server:
- creates `data/hazoom.db` (SQLite),
- seeds an **admin account** (`admin@hazoom.example` / `Admin123!` from `.env`),
- inserts 4 demo products (T-shirt, Mug, Hoodie, Phone Case).

---

## Project structure

```
hazoom/
├── client/                 # SPA frontend (static, served by Express)
│   ├── index.html          # app shell, meta tags credit Hazem Soussi
│   ├── css/style.css       # spinner, dark-mode, design-canvas styles
│   └── js/
│       ├── api.js          # fetch wrapper + toast
│       ├── auth.js         # login/register + token state
│       ├── cart.js         # localStorage cart
│       ├── products.js     # catalog, detail, cart views
│       ├── designer.js     # canvas design studio
│       ├── checkout.js     # address + Stripe + confirmation
│       ├── admin.js        # admin dashboard
│       └── app.js          # hash router + theme
└── server/
    ├── server.js           # Express app, security, static hosting, seed
    ├── db.js               # SQLite connection + schema
    ├── seed.js             # idempotent admin + demo seed
    ├── routes/             # auth, products, orders, payment
    ├── models/             # User, Product, Order (data layer)
    ├── middleware/auth.js  # JWT + admin guard
    └── services/           # stripe.js, printify.js, email.js
```

---

## Features

| Area | What works |
|------|------------|
| **Auth** | Register/login (JWT), bcrypt hashing, `/api/auth/me`, protected routes |
| **Catalog** | Categories (tshirt/mug/hoodie/phonecase), search, filter, detail + gallery |
| **Cart** | localStorage-backed, qty/edit/remove, backend checkout sync |
| **Design Studio** | Upload image / add text, color picker, draggable layers, live mockup preview |
| **Checkout** | Shipping + billing, Stripe PaymentIntent (or offline demo), order confirmation + email |
| **Admin** | Order list + status update + Printify fulfill, product CRUD, sales analytics |
| **Printify** | `/api/products/sync` pulls catalog, `/api/orders/:id/fulfill` submits, webhook helper |
| **Security** | Helmet, CORS allowlist, rate limiting, JWT auth, env-based secrets |

---

## Configuration (`.env`)

All secrets are environment variables — nothing sensitive is hardcoded.

| Var | Purpose |
|-----|---------|
| `JWT_SECRET` | **Set a long random value in production** (`node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`) |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe test keys. Without them, payments run in **offline demo mode**. |
| `PRINTIFY_API_TOKEN` / `PRINTIFY_SHOP_ID` | Printify creds. Without them, fulfillment runs in **mock mode**. |
| `EMAIL_*` | SMTP for order confirmations (optional; logged if unset). |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Bootstrap admin on first run. |

### Going live with payments
1. Get Stripe test keys from the dashboard; put them in `.env`.
2. For webhooks: `stripe listen --forward-to localhost:4000/api/payment/webhook` and set `STRIPE_WEBHOOK_SECRET`.
3. Replace the `confirmWithStripe` redirect flow in `client/js/checkout.js` with Stripe **Elements** for inline card capture (the offline path already finalizes orders).

### Going live with Printify
1. Set `PRINTIFY_API_TOKEN` + `PRINTIFY_SHOP_ID`.
2. Click **Sync** in the admin to import your catalog, or map your products in `routes/products.js`.
3. Use **Fulfill** on an order to push it to Printify.

---

## Switching to MongoDB

The models are plain data-access layers, so swapping to Mongoose is localized:

1. Set `DB_TYPE=mongo` and `MONGO_URI` in `.env`.
2. Replace the bodies of `server/models/*.js` with Mongoose schemas/models.
3. Replace `server/db.js` with a `mongoose.connect()` bootstrap.

The route/handler code does not change because it only calls the model methods (`create`, `findById`, `list`, `update`, `remove`, `updateStatus`, …).

---

## API summary

```
POST   /api/auth/register        { email, password, name }
POST   /api/auth/login           { email, password } -> { token, user }
GET    /api/auth/me              (auth)
GET    /api/products             ?category=&search=
GET    /api/products/:id
POST   /api/products             (admin) create
PUT    /api/products/:id         (admin)
DELETE /api/products/:id         (admin)
POST   /api/products/sync        (admin) pull from Printify
GET    /api/orders               (auth) my orders
GET    /api/orders/:id           (auth)
GET    /api/orders/all/list      (admin)
PATCH  /api/orders/:id/status    (admin)
GET    /api/orders/analytics/metrics (admin)
POST   /api/orders/:id/fulfill   (admin) -> Printify
POST   /api/payment/create-intent { amount }
POST   /api/payment/confirm      { items, shipping, billing, paymentIntentId }
POST   /api/payment/webhook      (Stripe, raw body)
GET    /api/config               public client config
GET    /api/health               health check
```

---

## Deploy notes

- Set `NODE_ENV=production`, a strong `JWT_SECRET`, and real Stripe/Printify/SMTP keys.
- Use a process manager (`pm2 start server/server.js`) or a container; bind `PORT`.
- For production, prefer a real Tailwind build instead of the CDN, and enable the CSP in `server.js` (`helmet` CSP is currently relaxed for the canvas).

---

## Versioning

Hazoom follows [Semantic Versioning](https://semver.org/). The canonical version
lives in `package.json` (`version`) and is surfaced at runtime:

- `GET /api/config` → `version`
- `GET /api/health` → `version`
- `GET /api/version` → `{ version }`
- Footer of the SaaS UI (auto-populated from `/api/config`)

Release history is tracked in [CHANGELOG.md](./CHANGELOG.md) (Keep a Changelog
format). Bump the version in `package.json` and add a CHANGELOG entry on each
release.

---

## Smart contract — Proof of Work / Proof of Concept

`contracts/PrintOnDemandProofOfWork.sol` is an **on-chain notarization layer** (not part of the storefront runtime). It immutably records authorship, project metadata, development milestones, feature-implementation status, and IPFS hashes of the codebase so the work can be independently verified at any time.

- Authorship baked in: **Hazem Soussi** — `hazem dot soussi at gmail dot com` — repo `https://github.com/hazem-soussi-HA/hazoom`.
- All mutating functions are `onlyAuthor` (the deployer). Features are initialized as `implemented = true` for v1.0.0; milestones as pending so you can flip them as you ship.
- Verified to **compile cleanly** with `solc 0.8.24` (`--optimize`): emits valid ABI + bytecode.

```bash
# Compile (no chain/RPC required)
npx --yes solc@0.8.24 --optimize --abi --bin -o out contracts/PrintOnDemandProofOfWork.sol

# Typical deploy (Hardhat example)
# 1. put your private key in .env (PRIVATE_KEY, RPC_URL)
# 2. deploy the single contract; constructor is argument-less
```

After deploy, call:
- `verifyCodebase(bytes32 ipfsHash)` — full repo release CID.
- `setComponentHashes(frontend, backend, contractHash)` — granual hashes.
- `completeMilestone(id)` / `verifyFeature(id, true, "status")` — progress.
- `getVerificationStatus()` / `getProjectId()` — off-chain verification.

---

© Hazoom — created by **Hazem Soussi**.
