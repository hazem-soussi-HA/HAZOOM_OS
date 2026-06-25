# HAZOOM OS Apps - Comprehensive Inventory Report
## Generated: 2026-06-25
## Total HTML files: 110 | Unique files (by content hash): 83 | Exact duplicates: 27

---

## SUMMARY STATISTICS

| Category | Count |
|----------|-------|
| Total HTML files | 110 |
| Unique files (by MD5) | 83 |
| Exact duplicate pairs | 27 pairs (27 files in apps/ root are duplicates of files in subdirs) |
| Files with real JS logic (>20 script lines) | ~65 |
| Files that are UI shells only (<20 script lines) | ~45 |
| Files calling /api/ endpoints | ~25 |
| Files calling external APIs (localhost) | ~15 |
| Files calling external APIs (internet) | ~30 |

---

## 1. apps/ai-apps/ (11 files, 8 unique)

| Filename | Lines | Has Real Logic | API Calls | Duplicate Of | Purpose |
|----------|-------|---------------|-----------|--------------|---------|
| ai-assistant-v3.html | 189 | YES (97) | none | — | Chat UI with mode selector, local echo response |
| ai_assistant.html | 429 | YES (122) | fonts.googleapis.com | — | Quantum AI chat with MCP context router |
| ai_command_center.html | 1005 | YES (237) | fonts.googleapis.com | — | Full AI hub: model switching, agent orchestration, memory |
| copilot.html | 233 | YES (63) | none (MCP only) | — | Co-pilot chat with MCP context integration |
| deep_think_explorer.html | 504 | YES (104) | fonts.googleapis.com | — | Deep thinking AI with multi-step reasoning display |
| glm_integration.html | 536 | YES (150) | http://localhost:8000 | — | GLM 4.7 model integration with local API |
| hazoom.html | 76 | MINIMAL (8) | none | — | AI nav shell — cards linking to other AI apps |
| hazoom_ai_assistant.html | 678 | YES (280) | none (MCP only) | — | Full AI assistant with MCP tools, memory, search |
| quantum_ai_assistant.html | 887 | YES (293) | http://localhost:11434/api/chat, fonts | — | Ollama-powered quantum AI with model selection |
| super_intelligent_agent.html | 639 | YES (233) | none (MCP only) | — | MCP-aware agent with knowledge retrieval |
| voice-chat.html | 240 | YES (85) | http://localhost:11434/api/chat | — | Alpha Pony voice interface with Ollama |
| web-chat.html | 903 | YES (163) | localhost:11434/api/chat, localhost:8081/api/login, fonts | — | Alpha Pony web chat with auth + Ollama |

---

## 2. apps/core-apps/ (8 files, 8 unique)

| Filename | Lines | Has Real Logic | API Calls | Duplicate Of | Purpose |
|----------|-------|---------------|-----------|--------------|---------|
| ap-desktop.html | 488 | YES (104) | none | — | Alpha Pony desktop with taskbar, widgets, app launcher |
| browser.html | 36 | MINIMAL (8) | https://www.wikipedia.org, bing.com | — | Simple iframe browser (2-line JS) |
| consciousness.html | 376 | YES (111) | /api/consciousness, /api/consciousness/awaken, /api/consciousness/sleep, /api/consciousness/think, /api/consciousness/memories | — | Consciousness module with full CRUD API |
| filemanager.html | 376 | YES (145) | none | — | Full file manager with CRUD, search, breadcrumbs |
| hazoom-dashboard/index.html | 19 | MINIMAL (9) | fonts.googleapis.com | — | Dashboard shell — loads assets, minimal logic |
| hazoom_desktop.html | 1058 | YES (231) | tailwindcss CDN, font-awesome CDN, localhost:8080 | — | Full desktop environment with start menu, windows |
| settings.html | 349 | YES (105) | fetch(), http://127.0.0.1:8002/agents | — | Settings panel with theme, toggles, agent API |
| terminal.html | 652 | YES (534) | none | — | Full terminal emulator with virtual FS, 20+ commands |

---

## 3. apps/docs/ (5 files, 4 unique)

| Filename | Lines | Has Real Logic | API Calls | Duplicate Of | Purpose |
|----------|-------|---------------|-----------|--------------|---------|
| HAZOOM_OS_TOUR.html | 956 | MINIMAL (34) | /api/kernel/state, /api/memory/stats, /api/pascal/status, /api/process/create, localhost:3000, fonts | — | Interactive tour with API status cards |
| about.html | 526 | NO (0) | github.com/hazem-soussi, linkedin.com | — | Static about page — no JS |
| hazoom_universe.html | 449 | YES (83) | tailwindcss CDN, font-awesome CDN | — | Marketing/showcase page with animations |
| pricing.html | 240 | NO (0) | none | — | Static pricing page — no JS |
| synapse_os.html | 595 | YES (154) | fetch() | — | SynapseOS neural OS documentation with interactive demo |

---

## 4. apps/games/ (4 files, 3 unique)

| Filename | Lines | Has Real Logic | API Calls | Duplicate Of | Purpose |
|----------|-------|---------------|-----------|--------------|---------|
| arcade.html | 760 | YES (318) | none | — | Full retro arcade with multiple games |
| chess.html | 263 | YES (122) | none | — | Quantum chess with move validation, AI opponent |
| cartoon-episode/index.html | 181 | MINIMAL (2) | none | — | Episode viewer shell — minimal JS |
| cartoon-episode/alpha_pony_voice.html | 603 | YES (248) | none | — | Alpha Pony voice trainer with recording/playback |

---

## 5. apps/tools/ (38 files, 22 unique)

| Filename | Lines | Has Real Logic | API Calls | Duplicate Of | Purpose |
|----------|-------|---------------|-----------|--------------|---------|
| HAZOOM_NET.html | 556 | YES (403) | /api/knowledge/query, /api/neural/bridge, /api/v3/chat, /api/v3/search | — | TCP/IP & OSI model explorer with neural API |
| admin-panel.html | 588 | YES (175) | localhost:11434/api/tags, localhost:8081/api/quantum-login, openrouter.ai/api/v1/models | — | Admin portal with Ollama + OpenRouter model mgmt |
| admin_monitor.html | 4209 | YES (1719) | none | — | Full system monitor: processes, CPU, memory, network |
| advanced_navigator.html | 997 | YES (435) | google.com/search, bing.com, duckduckgo, wikipedia, github, reddit, youtube, twitter | — | Multi-engine search aggregator with bookmarks |
| antigravity_navigator.html | 830 | YES (221) | 127.0.0.1:8002/health, google, bing, duckduckgo, github, reddit, twitter, youtube, wikipedia | — | Navigator with external search + local health check |
| api_settings.html | 256 | NO (0) | http://localhost:11434 (text only) | — | Static API settings display — no JS |
| background_office.html | 26 | NO (0) | none | — | Stub — single "Coming Soon" card |
| camera_stream.html | 740 | YES (185) | none | — | Camera viewer with capture, filters, recording |
| cloud_hub.html | 531 | YES (143) | api.example.com/data (placeholder) | — | Cloud hub dashboard with placeholder API |
| component-scanner/index.html | 65 | MINIMAL (2) | none | — | Scanner shell — minimal placeholder |
| consciousness.html | 385 | YES (148) | none | — | Consciousness core UI with memory visualization |
| consciousness_core.html | 386 | YES (240) | none | — | Full consciousness engine with thought processing |
| consciousness_portal.html | 50 | MINIMAL (9) | none | — | Portal shell — button to enter consciousness |
| control-center.html | 1352 | YES (229) | none | — | AlphaPony AI Future Lab control panel |
| data_intelligence.html | 273 | YES (38) | none | — | Data analytics dashboard with charts |
| focus-timer/index.html | 251 | YES (113) | none | — | Pomodoro timer with task tracking |
| focus-timer/focus-timer/index.html | 46 | MINIMAL (2) | none | — | Timer stub — minimal placeholder |
| hazoom_integration.html | 824 | YES (315) | /api/rag/query, /api/rag/status, /api/v1/*, localhost:8000, localhost:8001 | — | Full RAG integration with REST API + MCP |
| hazoom_search.html | 480 | YES (155) | none (different from root version) | — | MCP-powered search (different from root version) |
| hazoom_search_indexer.html | 625 | YES (268) | example.com/page1, example.com/page2 (placeholders) | — | Search indexer with domain crawling |
| hazoom_universal_search.html | 912 | YES (357) | github.com/hazem-soussi-HA/hazoom-os, hazoom-os.com/docs/* | — | Universal search across Hazoom ecosystem |
| ledger-pro.html | 141 | YES (110) | tailwindcss CDN, fonts | — | WSL/PHP emulator v3 — ledger interface |
| mcp-monitor.html | 486 | MINIMAL (34) | fonts.googleapis.com | — | MCP supervision dashboard (mostly CSS) |
| meeting-scheduler.html | 185 | YES (43) | localhost:11434/api/chat | — | Meeting scheduler with Ollama integration |
| monitor/monitor/index.html | 28 | MINIMAL (2) | none | — | Monitor stub — minimal placeholder |
| process-visualizer.html | 630 | YES (164) | fetch() | — | Neural process visualizer with real-time viz |
| prompt_engineering_system.html | 1104 | YES (383) | tailwindcss CDN, font-awesome CDN | — | Full prompt engineering IDE with templates |
| quantum_monitor.html | 89 | MINIMAL (28) | none | — | Quantum state monitor with basic animation |
| quantum_search.html | 408 | YES (157) | none | — | Quantum search with visualization |
| quantum_travel.html | 1205 | YES (345) | /api/analysis/, /api/consciousness/, /api/creativity/, /api/memory/, /api/optimization/, /api/peace/ | — | Quantum travel portal with 6 API endpoints |
| screen_light_controller.html | 857 | YES (262) | tailwindcss CDN, font-awesome CDN | — | Screen brightness/color controller |
| secure_scraper.html | 488 | YES (127) | example.com (placeholder) | — | Secure web scraper with proxy support |
| security_center.html | 251 | YES (50) | none | — | Security dashboard with threat display |
| security_settings.html | 514 | YES (74) | none | — | Security & privacy settings panel |
| system-monitor.html | 148 | YES (50) | none | — | Compact system monitor |
| system_monitor.html | 278 | YES (194) | none | — | Full system monitor with CPU/RAM/disk |
| usb_portal.html | 511 | YES (177) | none | — | USB device portal manager |
| web-search.html | 127 | YES (23) | /api/web-search, example.com, hazoom-os.com, hazoom-search.com | — | Web search API mock tester |

---

## 6. apps/visualizers/ (6 files, 5 unique)

| Filename | Lines | Has Real Logic | API Calls | Duplicate Of | Purpose |
|----------|-------|---------------|-----------|--------------|---------|
| circuit-scan/index.html | 65 | MINIMAL (2) | none | — | Circuit scan stub — placeholder |
| circuit-scan/circuit-scan/index.html | 47 | NO (0) | none | — | Empty circuit scan shell |
| futuristic-map.html | 208 | YES (70) | unpkg.com/leaflet, openstreetmap tiles | — | Interactive Leaflet map with markers |
| growflow/index.html | 589 | YES (167) | fonts.googleapis.com | — | Habit & gratitude tracker with localStorage |
| map-command-center/public/index.html | 608 | YES (547) | cesium.com (CesiumJS 3D globe) | — | 3D quantum command center with Cesium |
| showtime/templates/index.html | 27 | MINIMAL (2) | bootstrap CDN | — | Search template stub |

---

## 7. apps/ ROOT — Standalone HTML files (47 files, 21 unique)

NOTE: 27 of these are EXACT duplicates of files in subdirectories (same MD5 hash).

### 7a. Unique standalone files (21 files)

| Filename | Lines | Has Real Logic | API Calls | Duplicate Of | Purpose |
|----------|-------|---------------|-----------|--------------|---------|
| about.html | 516 | NO (0) | none | — | Static about page (no JS) |
| admin_monitor.html | 4189 | YES (1706) | none | — | Full system monitor (standalone v2.1) |
| advanced_navigator.html | 997 | YES (435) | google, bing, duckduckgo, wikipedia, github, reddit, youtube, twitter | — | Multi-engine navigator |
| aether-dashboard.html | 371 | YES (124) | none | — | Consciousness dashboard with metrics |
| antigravity_navigator.html | 830 | YES (221) | localhost:8002/health, google, bing, duckduckgo, github, reddit, twitter, youtube, wikipedia | — | Navigator with health check |
| api_settings.html | 256 | NO (0) | localhost:11434 (display only) | — | Static API settings display |
| background_office.html | 26 | NO (0) | none | — | "Coming Soon" stub |
| browser.html | 230 | YES (85) | wikipedia.org | — | Secure browser with fetch + iframe |
| camera_stream.html | 740 | YES (185) | none | — | Camera viewer with MediaStream |
| chess.html | 263 | YES (122) | none | — | Quantum chess game |
| cloud_hub.html | 531 | YES (143) | api.example.com (placeholder) | — | Cloud hub dashboard |
| consciousness_portal.html | 50 | MINIMAL (9) | none | — | Portal entry shell |
| copilot.html | 233 | YES (63) | none (MCP only) | — | Co-pilot chat UI |
| data_intelligence.html | 273 | YES (38) | none | — | Data analytics dashboard |
| deep_think_explorer.html | 504 | YES (104) | fonts.googleapis.com | — | Deep think AI explorer |
| filemanager.html | 377 | YES (182) | none | — | File manager (standalone) |
| glm_integration.html | 536 | YES (150) | localhost:8000 | — | GLM 4.7 integration |
| hazoom.html | 76 | MINIMAL (8) | none | — | AI nav shell (cards linking to apps) |
| hazoom_ai_assistant.html | 676 | YES (280) | none (MCP only) | — | AI assistant with MCP tools |
| hazoom_integration.html | 824 | YES (315) | /api/rag/*, /api/v1/*, localhost:8000, localhost:8001 | — | Full RAG integration platform |
| hazoom_search.html | 710 | YES (157) | /api/cache/clear, /api/health, /api/search, localhost:8003 | — | Context-aware search engine v2 |
| hazoom_search_indexer.html | 625 | YES (268) | example.com (placeholders) | — | Search indexer with crawling |
| hazoom_universal_search.html | 912 | YES (357) | github.com, hazoom-os.com | — | Universal search across ecosystem |
| pricing.html | 240 | NO (0) | none | — | Static pricing page |
| punch-cards.html | 272 | YES (125) | none | — | Punch card system with time tracking |
| quantum_ai_assistant.html | 887 | YES (293) | localhost:11434/api/chat, fonts | — | Ollama quantum AI assistant |
| quantum_monitor.html | 89 | MINIMAL (28) | none | — | Quantum state monitor |
| quantum_search.html | 408 | YES (157) | none | — | Quantum search visualization |
| quantum_travel.html | 1205 | YES (345) | /api/analysis/*, /api/consciousness/*, /api/creativity/*, /api/memory/*, /api/optimization/*, /api/peace/* | — | Quantum travel portal |
| secure_scraper.html | 488 | YES (127) | example.com (placeholder) | — | Secure web scraper |
| security_settings.html | 514 | YES (74) | none | — | Security & privacy settings |
| settings.html | 527 | YES (307) | fetch(), 1.1.1.1/dns-query, proxy:8080 | — | Full settings panel with theme engine |
| super_intelligent_agent.html | 639 | YES (233) | none (MCP only) | — | Super intelligent agent UI |
| terminal.html | 677 | YES (543) | none | — | Full terminal emulator with virtual FS |
| usb_portal.html | 511 | YES (177) | none | — | USB portal manager |

### 7b. EXACT DUPLICATES (27 files in root = copies in subdirs)

These files in apps/ root are byte-identical to files in subdirectories:

| Root File | Duplicate Of (subdirectory) |
|-----------|---------------------------|
| ai_assistant.html | ai-apps/ai_assistant.html |
| ai_command_center.html | ai-apps/ai_command_center.html |
| antigravity_navigator.html | tools/antigravity_navigator.html |
| api_settings.html | tools/api_settings.html |
| background_office.html | tools/background_office.html |
| camera_stream.html | tools/camera_stream.html |
| chess.html | games/chess.html |
| cloud_hub.html | tools/cloud_hub.html |
| consciousness_portal.html | tools/consciousness_portal.html |
| copilot.html | ai-apps/copilot.html |
| data_intelligence.html | tools/data_intelligence.html |
| deep_think_explorer.html | ai-apps/deep_think_explorer.html |
| glm_integration.html | ai-apps/glm_integration.html |
| hazoom.html | ai-apps/hazoom.html |
| hazoom_ai_assistant.html | ai-apps/hazoom_ai_assistant.html |
| hazoom_integration.html | tools/hazoom_integration.html |
| hazoom_search_indexer.html | tools/hazoom_search_indexer.html |
| pricing.html | docs/pricing.html |
| quantum_ai_assistant.html | ai-apps/quantum_ai_assistant.html |
| quantum_monitor.html | tools/quantum_monitor.html |
| quantum_search.html | tools/quantum_search.html |
| quantum_travel.html | tools/quantum_travel.html |
| secure_scraper.html | tools/secure_scraper.html |
| security_settings.html | tools/security_settings.html |
| super_intelligent_agent.html | ai-apps/super_intelligent_agent.html |
| usb_portal.html | tools/usb_portal.html |

---

## API ENDPOINT SUMMARY

### /api/ Endpoints Called (internal)

| Endpoint | Files Using It |
|----------|---------------|
| /api/consciousness (+ /awaken, /sleep, /think, /memories) | core-apps/consciousness.html |
| /api/kernel/state | docs/HAZOOM_OS_TOUR.html |
| /api/memory/stats | docs/HAZOOM_OS_TOUR.html |
| /api/pascal/status | docs/HAZOOM_OS_TOUR.html |
| /api/process/create | docs/HAZOOM_OS_TOUR.html |
| /api/analysis/ | tools/quantum_travel.html |
| /api/creativity/ | tools/quantum_travel.html |
| /api/memory/ | tools/quantum_travel.html |
| /api/optimization/ | tools/quantum_travel.html |
| /api/peace/ | tools/quantum_travel.html |
| /api/rag/query | tools/hazoom_integration.html |
| /api/rag/status | tools/hazoom_integration.html |
| /api/v1/agendas/ | tools/hazoom_integration.html |
| /api/v1/auth/access-token | tools/hazoom_integration.html |
| /api/v1/progress/ | tools/hazoom_integration.html |
| /api/v1/quizzes/ | tools/hazoom_integration.html |
| /api/v1/users/ | tools/hazoom_integration.html |
| /api/cache/clear | hazoom_search.html |
| /api/health | hazoom_search.html |
| /api/search | hazoom_search.html |
| /api/web-search | tools/web-search.html |
| /api/knowledge/query | tools/HAZOOM_NET.html |
| /api/neural/bridge | tools/HAZOOM_NET.html |
| /api/v3/chat | tools/HAZOOM_NET.html |
| /api/v3/search | tools/HAZOOM_NET.html |

### Localhost API Calls

| Endpoint | Files |
|----------|-------|
| http://localhost:11434/api/chat | ai-apps/quantum_ai_assistant.html, ai-apps/voice-chat.html, tools/admin-panel.html, tools/meeting-scheduler.html |
| http://localhost:8000 | ai-apps/glm_integration.html, tools/hazoom_integration.html |
| http://localhost:8001 | tools/hazoom_integration.html |
| http://localhost:8003 | hazoom_search.html |
| http://localhost:8080 | core-apps/hazoom_desktop.html |
| http://localhost:8081/api/login | ai-apps/web-chat.html |
| http://localhost:8081/api/quantum-login | tools/admin-panel.html |
| http://localhost:11434/api/tags | tools/admin-panel.html |
| http://localhost:8002/health | tools/antigravity_navigator.html |
| http://127.0.0.1:8002/agents | core-apps/settings.html |
| https://openrouter.ai/api/v1/models | tools/admin-panel.html |

---

## KEY FINDINGS

1. **MASSIVE DUPLICATION**: 27 of 110 files (24.5%) are exact duplicates — the apps/ root directory contains copies of files from ai-apps/, tools/, and docs/. This is likely for "quick access" from the OS desktop.

2. **STANDALONE ROOT IS THE CANONICAL SET**: The apps/ root directory contains the "master" copies of most files. Subdirectories (ai-apps/, tools/, etc.) are organizational copies.

3. **MOST COMPLEX FILES**:
   - admin_monitor.html (4189 lines, 1706 JS) — Full system monitor
   - admin_monitor.html in tools/ (4209 lines, 1719 JS) — Slightly different version
   - quantum_travel.html (1205 lines, 345 JS) — Quantum portal with 6 API endpoints
   - prompt_engineering_system.html (1104 lines, 383 JS) — Prompt IDE
   - control-center.html (1352 lines, 229 JS) — AI lab control panel
   - hazoom_integration.html (824 lines, 315 JS) — RAG platform

4. **FILES WITH NO REAL LOGIC** (UI shells only):
   - about.html, docs/about.html, docs/pricing.html, pricing.html — Static pages
   - background_office.html, tools/background_office.html — "Coming Soon" stub
   - api_settings.html, tools/api_settings.html — Static display
   - consciousness_portal.html, tools/consciousness_portal.html — Entry shell
   - Various scanner/monitor stubs (component-scanner, focus-timer, monitor)

5. **API ARCHITECTURE**: The system expects a local backend with:
   - Ollama at localhost:11434 (LLM inference)
   - RAG service at localhost:8000-8001
   - Search service at localhost:8003
   - Quantum services at localhost:8002
   - Auth at localhost:8081
   - Desktop at localhost:8080

6. **EXTERNAL DEPENDENCIES**: Many files load CDNs (tailwindcss, font-awesome, bootstrap, leaflet, cesium, google fonts) — these won't work offline.
