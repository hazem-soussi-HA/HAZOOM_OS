# MiMo Browser v4.0 — Personal Intelligent Browser
# "Navigate the WWW with Full Comfort"

## Vision
A personal browser built for comfort, intelligence, and privacy. Not a browser-inside-a-browser.
A real standalone browser with AI built into its bones — not bolted on top.

---

## What's New in v4 (vs v3 plan)

### Comfort Features
- **Command Palette** — Ctrl+K universal search: commands, bookmarks, history, tabs, AI actions
- **Tab Groups** — Organize tabs into named, color-coded groups (Work, Research, Personal)
- **Reader Mode** — One-click clean reading view with adjustable font, width, theme
- **Workspace Sessions** — Save/restore full browser states (tabs + scroll positions + form data)
- **Smart Bookmarks** — AI-tagged bookmarks with full-text search across page content
- **Split View** — View two pages side-by-side in one tab
- **Quick Notes** — Per-page sticky notes that persist across sessions
- **Themes** — Dark, Light, Midnight, Forest, Ocean + custom CSS injection

### Intelligence Features
- **AI Sidebar** — Persistent chat panel for page summarization, Q&A, translation
- **Smart Address Bar** — Natural language input: "best python course coursera" just works
- **Auto-Extract** — Detects page type and offers relevant extraction (tables, articles, products)
- **Page Insights** — Word count, reading time, security rating, tech stack detection
- **Link Previews** — Hover any link to see a mini summary of the destination
- **Session Memory** — Remembers what you were doing, suggests continuations

### Security & Privacy
- **Built-in Ad/Tracker Blocking** — EasyList + EasyPrivacy + custom MiMo blocklist
- **DNS-over-HTTPS** — Cloudflare/Quad9 encrypted DNS
- **Fingerprint Protection** — Canvas noise, WebGL spoof, font masking
- **Encrypted Storage** — AES-256-GCM for all local data, Argon2id key derivation
- **Secure Auto-fill** — Encrypted credential vault
- **Cookie Isolation** — Per-site cookie jars
- **HTTPS-Only Mode** — No unencrypted connections

### Power User
- **Keyboard Shortcuts** — Vim-inspired navigation (j/k scroll, gg/G top/bottom, d/u page down/up)
- **Custom CSS/JS** — Per-site user styles and scripts
- **Export/Import** — Encrypted profile backup
- **DevTools Panel** — Built-in inspector, console, network monitor
- **Performance HUD** — Optional overlay showing load time, memory, requests

---

## Architecture: 6 Layers

```
┌─────────────────────────────────────────────────────┐
│           LAYER 6: COMFORT & POWER USER             │
│  Command palette, themes, reader mode, split view,  │
│  keyboard shortcuts, custom CSS/JS, performance HUD │
├─────────────────────────────────────────────────────┤
│           LAYER 5: UI (PySide6 / Qt6)               │
│  Native window, tabs, address bar, AI sidebar,      │
│  DevTools, settings, tab groups, workspace sessions │
├─────────────────────────────────────────────────────┤
│        LAYER 4: INTELLIGENCE CORE                    │
│  AI planner, content analyzer, auto-extract,        │
│  smart address bar, link previews, page insights    │
├─────────────────────────────────────────────────────┤
│        LAYER 3: SECURITY ENGINE                      │
│  TLS 1.3, DoH, cert pinning, ad/tracker blocking,   │
│  fingerprint protection, encrypted storage          │
├─────────────────────────────────────────────────────┤
│        LAYER 2: RENDERING ENGINE                     │
│  QtWebEngine (Chromium) + content injection         │
│  Reader mode, split view, custom CSS/JS             │
├─────────────────────────────────────────────────────┤
│        LAYER 1: NETWORK CORE                         │
│  HTTP/2, QUIC, WebSockets, proxy, DNS resolver,     │
│  connection pooling, request interception           │
└─────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Language | Python 3.12+ | AI/ML ecosystem, rapid dev |
| UI Framework | PySide6 (Qt6) | Native look, WebEngine built-in |
| Rendering | QtWebEngine (Chromium) | Full browser engine |
| Encryption | cryptography lib | AES-256-GCM, Argon2id |
| DNS | DNS-over-HTTPS (DoH) | Encrypted DNS |
| Storage | SQLite + SQLCipher | Encrypted local DB |
| Intelligence | Custom engine + LLM API | On-device + cloud AI |
| Ad Blocking | Filter engine + EasyList | Real-time blocking |

---

## File Structure

```
mimo_browser_v4/
├── main.py                    # Entry point
├── pyproject.toml             # Dependencies
│
├── core/
│   ├── __init__.py
│   ├── app.py                 # Application lifecycle
│   ├── config.py              # Encrypted config management
│   ├── logger.py              # Secure logging
│   └── events.py              # Event bus for inter-module comm
│
├── network/
│   ├── __init__.py
│   ├── resolver.py            # DNS-over-HTTPS resolver
│   ├── connection.py          # Connection manager
│   ├── proxy.py               # Proxy/Tor support
│   ├── certificates.py        # Cert pinning, validation
│   └── interceptor.py         # Request/response interception
│
├── security/
│   ├── __init__.py
│   ├── crypto.py              # AES-256-GCM encryption
│   ├── storage.py             # Encrypted SQLite
│   ├── sandbox.py             # Process sandboxing
│   ├── filters.py             # Ad/tracker blocking engine
│   ├── permissions.py         # Site permissions model
│   ├── fingerprint.py         # Fingerprint protection
│   └── credentials.py         # Encrypted auto-fill vault
│
├── browser/
│   ├── __init__.py
│   ├── engine.py              # QtWebEngine wrapper
│   ├── tab.py                 # Tab management
│   ├── tab_group.py           # Tab group management
│   ├── history.py             # Encrypted history
│   ├── bookmarks.py           # Smart bookmarks with AI tags
│   ├── downloads.py           # Secure downloads
│   ├── reader.py              # Reader mode processor
│   ├── split_view.py          # Split view manager
│   ├── workspace.py           # Workspace session save/restore
│   └── notes.py               # Per-page quick notes
│
├── intelligence/
│   ├── __init__.py
│   ├── brain.py               # Core intelligence engine
│   ├── planner.py             # Goal decomposition
│   ├── memory.py              # Learning/memory system
│   ├── analyzer.py            # Page content analysis
│   ├── automator.py           # Auto-form fill, etc.
│   ├── sidebar.py             # AI sidebar chat engine
│   ├── smart_bar.py           # Smart address bar NLP
│   ├── link_preview.py        # Link preview generator
│   └── insights.py            # Page insights (reading time, etc.)
│
├── ui/
│   ├── __init__.py
│   ├── main_window.py         # Main window
│   ├── tab_bar.py             # Custom tab bar with groups
│   ├── address_bar.py         # Smart address bar
│   ├── command_palette.py     # Ctrl+K command palette
│   ├── ai_sidebar.py          # AI chat sidebar panel
│   ├── devtools.py            # Developer tools panel
│   ├── settings.py            # Settings dialog
│   ├── theme_manager.py       # Theme engine
│   └── performance_hud.py     # Performance overlay
│
├── data/
│   ├── hosts_blocklist.txt    # Ad/tracker domains
│   ├── filter_rules.txt       # EasyList-compatible rules
│   ├── ca_bundle.pem          # Certificate bundle
│   ├── config.enc             # Encrypted config
│   └── themes/                # Theme definitions
│       ├── dark.json
│       ├── midnight.json
│       ├── forest.json
│       └── ocean.json
│
└── tests/
    ├── __init__.py
    ├── test_core.py
    ├── test_security.py
    ├── test_intelligence.py
    └── test_browser.py
```

---

## Build Phases

### Phase 1: Foundation (Core + UI skeleton)
- [ ] Project structure and dependencies
- [ ] PySide6 + QtWebEngine setup
- [ ] Main window with tab bar
- [ ] Basic navigation (URL, back/forward, refresh)
- [ ] Address bar with smart suggestions
- [ ] Command palette (Ctrl+K)

### Phase 2: Browser Features
- [ ] Tab groups (create, name, color-code)
- [ ] Reader mode (content extraction + clean view)
- [ ] Split view (side-by-side pages)
- [ ] Workspace sessions (save/restore)
- [ ] Smart bookmarks with full-text search
- [ ] Per-page quick notes
- [ ] History with encrypted storage

### Phase 3: Security
- [ ] AES-256-GCM encrypted storage
- [ ] DNS-over-HTTPS resolver
- [ ] Ad/tracker blocking engine
- [ ] Fingerprint protection
- [ ] HTTPS-only mode
- [ ] Cookie isolation
- [ ] Encrypted credential vault

### Phase 4: Intelligence
- [ ] AI sidebar (page summarization, Q&A)
- [ ] Smart address bar (natural language)
- [ ] Auto-extract (tables, articles, products)
- [ ] Page insights (reading time, word count, security)
- [ ] Link previews
- [ ] Session memory and suggestions

### Phase 5: Power User
- [ ] Keyboard shortcuts (vim-inspired)
- [ ] Custom CSS/JS injection
- [ ] Theme engine (5 themes + custom)
- [ ] Performance HUD
- [ ] DevTools panel
- [ ] Export/import encrypted profiles

### Phase 6: Polish
- [ ] Cross-platform packaging
- [ ] Auto-update mechanism
- [ ] Comprehensive test suite
- [ ] Documentation

---

## Key Design Decisions

### 1. WebEngine over Playwright
QtWebEngine gives us a REAL browser engine (Chromium) with native rendering.
Playwright is for automation, not for human browsing. v4 is for humans.

### 2. Encrypted Everything
All local data encrypted with AES-256-GCM. Key derived from user password via Argon2id.
No plaintext data ever touches disk.

### 3. AI as a Layer, Not a Feature
Intelligence is woven into every layer — not a separate module.
The address bar understands natural language. The sidebar summarizes pages.
The planner decomposes goals. The analyzer extracts meaning.

### 4. Comfort First
Every feature is measured by one question: "Does this make browsing more comfortable?"
Reader mode for reading. Tab groups for organizing. Workspaces for context switching.
Command palette for speed. Themes for aesthetics.

---

## Launch Commands

```bash
# Install dependencies
pip install PySide6 PySide6-WebEngine cryptography argon2-cffi aiohttp beautifulsoup4 lxml

# Run
python main.py

# Run with visible browser (non-headless)
python main.py --no-headless

# Run with specific theme
python main.py --theme midnight
```
