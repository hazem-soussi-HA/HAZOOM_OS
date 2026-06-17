# 🍄 SUPER MARIO GTA6 — V1.4.0

> **The Unified Vision** — Where classic platforming meets open-world freedom.
> Created by **Hazem Soussi (HA)** — original code, original vision.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://python.org)
[![Pygame](https://img.shields.io/badge/pygame-2.6+-green.svg)](https://pygame.org)
[![Author: Hazem Soussi (HA)](https://img.shields.io/badge/author-Hazem%20Soussi%20(HA)-red.svg)](https://github.com/hazem-soussi-HA)
[![Status: Active Development](https://img.shields.io/badge/status-active%20development-brightgreen.svg)](NOTICE_TO_IP_HOLDERS.md)

> 🎯 **Vision:** A polished, original game engine fusing platformer
> mechanics with open-world freedom. Currently in active development
> by Hazem Soussi (HA). All code and assets are original work.
> Not affiliated with Nintendo or Rockstar — this is an independent
> creation. [`Legal notices`](NOTICE_TO_IP_HOLDERS.md) · [`Trademarks`](TRADEMARKS.md)

---

## 🎮 About

**Super Mario GTA6** is an original game engine that fuses classic
platformer mechanics with open-world driving freedom. Every line of
code, every sprite, and every sound effect is **original work by
Hazem Soussi (HA)** — nothing has been copied from Nintendo or Rockstar.

This is an **independent project** in active development. The codebase
is MIT-licensed and built from scratch. The name references the genres
and inspirations; the implementation is entirely original.

> 💼 **Commercial vision:** This project is being built with the intent
> of future official collaboration. All original work is copyrighted
> by Hazem Soussi (HA). Partnership inquiries welcome.

### V1.3 Features (Latest)

- 🎨 **Modular Architecture** — 26 JS modules, clean separation of concerns
- 🍄 **Power-Up System** — Mushroom, Fire Flower, Star from hidden blocks
- 🐢 **Koopa Troopas** — Stomp → shell → kick → chain kills
- 🔥 **Fireballs** — Fire Mario shoots bouncing fireballs
- 💥 **Breakable Bricks** — Big Mario smashes from below
- 🎯 **Combo System** — Chain stomps for multiplied scores
- 🎵 **Procedural BGM** — Mario-style music generated in real-time
- 📱 **Mobile Touch Controls** — D-pad, jump, fire buttons
- 📳 **Screen Shake** — Impact feedback on every action
- 🖼️ **Enhanced Sprites** — Detailed Mario, enemies, and tiles
- 🌐 **Unified Website** — Game + wiki in one page

### Architecture

```
js/
├── engine/     Core: loop, input, physics, camera, audio
├── entities/   Player, enemies, power-ups, items, vehicles
├── world/      Level parser, tiles, backgrounds
├── render/     Sprites, draw pipeline, particles, effects
├── ui/         HUD, menus, dialogs
├── systems/    Save/load, settings, debug
└── main.js     Entry point
```

Build: `python3 build.py` → `index.html` (87KB, zero dependencies)

---

## 🚀 Quick Start

```bash
git clone https://github.com/hazem-soussi-HA/mario_gta6.git
cd mario_gta6
python3 -m http.server 8080
# Open http://localhost:8080/website/
```

### Controls

| Key | Action |
|-----|--------|
| ← → / A D | Move |
| Space / ↑ / W | Jump |
| Shift | Run |
| F | Enter/Exit car |
| E / X | Shoot fireball |
| Esc | Pause |

---

## 📁 Project Structure

```
mario_gta6/
├── 📄 README.md
├── 📄 LICENSE (MIT)
├── 📄 CONTRIBUTING.md
├── 📄 CODE_OF_CONDUCT.md
├── 📄 .gitignore
├── 🎮 mario_gta6_2d.py          # Original Python engine (418 lines)
├── 📂 website/                   # Unified game + website
│   ├── index.html                # Built output (87KB)
│   ├── build.py                  # Build system
│   ├── game.js                   # Standalone game (legacy)
│   ├── logo.svg                  # Animated logo
│   ├── css/website.css           # Website styles
│   └── js/                       # Modular source (26 files)
│       ├── main.js
│       ├── engine/
│       ├── entities/
│       ├── world/
│       ├── render/
│       ├── ui/
│       └── systems/
├── 📂 assets/
├── 📂 docs/
├── 📂 tests/
└── 📂 .secure/                   # Private (gitignored)
```

---

## 🛡️ Legal & Copyright

**Copyright © 2026 Hazem Soussi (HA). All rights reserved.**

- **Lead Developer:** Hazem Soussi (HA)
- **Repository:** https://github.com/hazem-soussi-HA/mario_gta6
- **License:** MIT
- **Trademarks:** "Super Mario GTA6", "Mario GTA6"

---

## 🗺️ Roadmap

- [x] V1.0 — Python engine, tile physics, enemy AI, GTA mode
- [x] V1.1 — Canvas port, title screen, pause, SFX
- [x] V1.2 — Koopas, power-ups, fireballs, combos, BGM, mobile
- [x] V1.3 — Modular architecture, enhanced sprites, unified website
- [x] V1.4 — Footstep dust, jump/landing clouds, coin magnet, hearts HUD, **💎 Credits currency**, **Pre-partnership legal package**
- [ ] V2.0 — Multiple worlds, save system, level editor, more enemies
- [ ] V3.0 — Multiplayer, daily challenges, boss rush

---

## 📜 Legal Documents

This project ships with a complete legal package designed to be
honest about what is original code, what is homage, and what the
author's relationship is to the IP holders. Read in this order:

  1. **[`LICENSE`](LICENSE)** — MIT grant on the original code,
     with a clear scope statement of what is and is not covered
  2. **[`TRADEMARKS.md`](TRADEMARKS.md)** — Full ® and ™
     attribution for every Nintendo® and Take-Two® mark referenced
     in the project, plus the required in-game notice text
  3. **[`PRE_PARTNERSHIP_STATEMENT.md`](PRE_PARTNERSHIP_STATEMENT.md)** —
     The author's formal statement of intent: a fan project, offered
     in good faith, with no claim of partnership but with an open
     door if one is ever welcome
  4. **[`NOTICE_TO_IP_HOLDERS.md`](NOTICE_TO_IP_HOLDERS.md)** —
     Direct address to the legal and business-development teams at
     Nintendo® and Rockstar Games®, including the takedown procedure
     and 72-hour response commitment
  5. **[`CONTRIBUTING.md`](CONTRIBUTING.md)** — Developer Certificate
     of Origin (DCO) sign-off workflow for contributors
  6. **[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)** — Community
     standards

---

<div align="center">

**"Nothing is lost and everything is connected."**

*© 2026 Hazem Soussi (HA) — MIT License for original code.*

*SUPER MARIO® and GRAND THEFT AUTO® are trademarks of their
respective owners. This is an unofficial fan project.*

</div>
