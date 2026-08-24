# MiMo Browser — Full Integration Plan
> June 23, 2026 — Shadow Builder (HAZ00M)

## System Landscape

```
deepseek/
├── blockchain-portal/        # Pac-Man game portal with BASIC + Python support
├── deepseek archive/         # DeepSeek R1 reference docs (4 HTML files)
│   ├── deepseek.html
│   ├── deepseek_v4_flash_not_automated.html
│   ├── deepseek_html_20260614_23bae4.html
│   ├── alpha_pony_showcase.html
│   └── contact_prototype.html
├── Model Chat/               # Hermes chat interface
├── pacman-ai/                # AI-enhanced Pac-Man research prototype (24KB HTML)
├── pacman-unified/           # Production Pac-Man + Foundry smart contracts
│   ├── contracts/            # Solidity (Forge)
│   └── js/                  ← wallet.js, ghost.js, pathfinding.js, game.js
└── super_intelligence_do_browsing/
    ├── mimo_browser/         # v2.5 Playwright automation engine
    │   ├── browser_engine.py, config.py, handlers.py
    │   ├── intelligence.py, memory.py, cli.py
    │   └── __init__.py
    ├── mimo_browser_v4/      # v4 FULL rewrite (7,027 lines, 31 files)
    │   ├── main.py (1,330 lines — complete server + dashboard UI)
    │   ├── config.py, network.py, basic_ide.py
    │   ├── browser/ (engine, tabs, groups, reader, bookmarks, etc.)
    │   ├── intelligence/ (brain, analyzer, planner, sidebar, etc.)
    │   └── security/ (crypto, filters, fingerprint, credentials, storage)
    ├── server.py             # v2.5 server entry (Playwright, port 8080)
    └── launch.py             # Daemon launcher for v2.5
```

## Architecture Decision
**v4 supersedes v2.5.** Merge v2.5's Playwright automation INTO v4's superior proxy/iframe UI.
- v4 port: 8082
- v2.5 port: 8080 (to be retired after merge)

## Phase 1: Unify Browser Engines
- Make v4 `main.py` the single server on port 8082
- Embed v2.5's Playwright automation as an optional API mode in v4
- Remove v2.5 `server.py` dependency conflicts
- Merge v2.5's `handlers.py` (WebSearchHandler, PageMonitorHandler, DataExtractor) into v4
- Merge v2.5's `BrowserEngine` (Playwright) as a v4 background automation service
- Merge v2.5's `MemoryStore` enhancements into v4's `intelligence/memory.py`

## Phase 2: Proxy + Iframe Rendering (v9 has this, needs hardening)
- Verify `/api/proxy` rewrites: CSS `url()`, `<script src>`, `<img src>`, `<link href>`
- Add WebSocket support for real-time page updates in proxy mode
- Inject fingerprint protection JS into every proxied HTML page
- Add Content-Security-Policy headers to proxy responses
- Handle WebSocket connections through proxy (for sites that need it)
- Cookie isolation per tab (each tab gets its own cookie jar)

## Phase 3: FinTech Module
- Create `mimo_browser_v4/fintech/` submodule:
  - `portfolio.py` — Portfolio tracker API endpoint
  - `prices.py` — Price feed integration (CoinGecko free API)
  - `parser.py` — Transaction history parser (CSV, exchange exports)
  - `alerts.py` — Price alert monitoring system
- Add `/api/fintech/` endpoints to v4 `main.py`
- Wire `security/credentials.py` vault for financial API key storage
- Use `intelligence/analyzer.py` PageAnalyzer for financial data extraction
- Dashboard panel: portfolio overview, price tickers, alerts

## Phase 4: Blockchain Portal Integration
- Import `blockchain-portal/pacman.bas` into v4 BASIC IDE as a demo program
- Deploy HAZOOM Coin contract via Foundry (`pacman-unified/contracts/`)
- Wire `pacman-unified/js/wallet.js` to deployed Foundry contracts
- Add blockchain portal quick links to v4 sidebar
- In-game token rewards: high scores → HAZOOM Coin minting
- Smart contract events → browser notification system

## Phase 5: DeepSeek Archive Integration
- Serve `deepseek archive/` as static content in v4 (`/static/deepseek/`)
- Add DeepSeek model chat API endpoint (`/api/chat`)
- Add AI sidebar panel for model interaction (reference docs + chat)
- Wire `intelligence/sidebar.py` to DeepSeek API
- Quick links: DeepSeek R1 docs accessible from v4 sidebar
- Split View: reference docs alongside model chat

## Phase 6: Pacman-AI → Pacman-Unified
- Merge AI research from `pacman-ai/index.html` into `pacman-unified/js/pathfinding.js`
- Wire smart contract rewards to high scores (HAZOOM Coin minting)
- BASIC-version in v4 IDE loads from pacman-unified source
- Ghost AI improvements: A* pathfinding, personality modes, learning
- Add pacman-ai quick launch from v4 BASIC IDE sidebar

## Phase 7: Security Hardening
- CSP headers on all proxy responses
- Cookie isolation per tab (already in v4 design)
- HTTPS-only enforcement (already in v4 config)
- Rate limiting on API endpoints
- Input sanitization on all user inputs
- Audit `security/` module for edge cases
- Add security dashboard panel showing: blocked requests, tracker count, HTTPS status

## Key Files Reference
- v4 main server: `super_intelligence_do_browsing/mimo_browser_v4/main.py`
- v4 config: `super_intelligence_do_browsing/mimo_browser_v4/config.py`
- v4 proxy handler: main.py line ~1039
- v4 dashboard HTML: main.py line ~56 (DASHBOARD_HTML)
- v4 BASIC IDE: `super_intelligence_do_browsing/mimo_browser_v4/basic_ide.py`
- v4 security: `super_intelligence_do_browsing/mimo_browser_v4/security/`
- v2.5 engine: `super_intelligence_do_browsing/mimo_browser/browser_engine.py`
- Pacman game: `pacman-unified/js/game.js`
- Smart contracts: `pacman-unified/contracts/`
- Foundry config: `pacman-unified/contracts/foundry.toml`
