# SUPER MARIO GTA6 — EXPERT PROJECT AUDIT & ROADMAP
# Prepared by OWL for Hazem Soussi
# Date: June 2026
# LAST UPDATED: June 2026 — Audit Pass 1 complete, V1.4.0 shipped

================================================================
## 0. STATUS BANNER (added 2026-06-04)
================================================================

> **NOTE FROM ENGINEER:** The current live codebase (`mario_gta6_2d.py` +
> `website/`) is a **2D pygame engine** with a JS port. The original audit
> (sections 1-8) was written for a planned 3D Ursina build. Items below
> have been **re-scored against the real 2D codebase** and re-grouped:
>
> ✅ = done in V1.4.0  •  ⏳ = still TODO  •  ❌ = N/A for 2D (3D-only)

**Audit Pass 1 shipped in V1.4.0 (commit pending):**
- ✅ Footstep dust puffs behind running player (cadence-based, run/walk differ)
- ✅ Jump takeoff dust cloud (puffs on leave-ground)
- ✅ Landing dust cloud (scaled by impact velocity)
- ✅ Coin magnet — coin particles home in toward player within 110px
- ✅ 3 hearts HUD replaces LIVES text (procedural heart sprite, gentle bob)
- ✅ HUD pulse on coin pickup (background scales + brightens)
- ✅ Score flash on pickup (yellow tint fade)
- ✅ Damage flash overlay (full-screen red flash, hearts shake)
- ✅ Time warning (red/white blink when <30s)
- ✅ Title fade-in on start, fade-out on game over
- ✅ Improved acceleration: removed 0.1 sluggish factor, direct lerp, air
  control dampened to 60% for arc feel
- ✅ Camera follow tightened (lerp 10→12) for snappier tracking
- ✅ `noise` library installed (1.2.2) for future procedural content
- ✅ Star power rainbow tint (already there, kept)
- ✅ Invincibility flicker (already there, kept)

================================================================
## 1. CURRENT ARCHITECTURE ASSESSMENT
================================================================

STRENGTHS (V1.4.0):
- Clean single-file 2D engine (mario_gta6_2d.py, 638 lines)
- Modular JS port under website/js/ (26 modules, engine/entities/world/render/ui/systems)
- Solid momentum-based physics with coyote time, jump buffering, variable jump
- Procedural squash & stretch animation system
- Procedural sprite generation (Mario, hearts, tiles) — no asset deps
- Tile-culled renderer (only on-screen tiles drawn)
- Particle pool system: dust, coin-pop, burst, with kind-aware physics
- Coin magnet homing force (custom per-particle integrator)
- HUD with drop shadows, pulse, flash, bob, shake (Mario Party aesthetic)
- 10 mission types on JS side, full trigger/reward system
- ~3 lives system with 3 hearts HUD
- 200×15 tile world, 3 traffic cars, 10 goombas, GTA-style F-to-enter-car
- 60 FPS locked, deterministic, runs headless for tests

WEAKNESSES IDENTIFIED:
- ~~Player acceleration feels sluggish~~ ✅ FIXED in V1.4.0
- ~~Camera distance too far~~ ❌ N/A in 2D (camera is 1D horizontal lerp)
- ~~City geometry ~500 entities~~ ❌ N/A in 2D (tile-grid based)
- ~~No texture mapping~~ ❌ N/A in 2D (sprites are the texture)
- ~~No post-processing, no bloom~~ ❌ N/A in 2D (would need shader pass)
- ~~Road dash entities ~400 cubes~~ ❌ N/A in 2D (already part of tile cache)
- No sound/audio system ⏳ TODO — pygame.mixer available, no assets yet
- No day/night cycle ⏳ TODO — would need global sky tint + lamp on/off
- No weather effects ⏳ TODO — particle system ready, needs rain/snow impl
- Vehicle physics are basic (no drift, no suspension) ⏳ TODO
- No minimap rotation ⏳ TODO (no minimap in 2D yet)
- Audio assets missing ⏳ TODO

================================================================
## 2. LIBRARY & ECOSYSTEM ANALYSIS
================================================================

CURRENTLY INSTALLED (relevant):
- pygame 2.6.1          ← 2D game engine (active)
- numpy 1.26.4          ← Fast math operations
- pillow 12.2.0         ← Image processing (texture generation)
- aiohttp 3.13.5        ← Async HTTP (for asset downloading)
- rich 13.7.1           ← Terminal formatting
- PyYAML 6.0.1          ← Config files
- noise 1.2.2           ← ✅ INSTALLED in Pass 1 — Perlin noise for terrain
- Ursina/Panda3D stack  ← Present in env but NOT used by live 2D build

KEY INSIGHT (updated): The 2D pygame build doesn't need a 3D engine.
For the 2D path, the highest-leverage additions are:
- `noise` for procedural terrain/cloud generation (installed ✅)
- `pymunk` for richer 2D physics (future)
- `pygame.mixer` for audio (built-in, no install)

================================================================
## 3. ASSET AUDIT & SCRAPING STRATEGY
================================================================

WHAT WE HAVE:
- Primitive shapes only (cubes, spheres)
- No textures
- No 3D models
- No audio files
- No UI sprites

WHAT WE NEED (Priority Order):

PRIORITY 1 — Character Models:
- Mario character model (GLTF/GLB format)
  Sources: Sketchfab.com, TurboSquid, free3d.com
  Search: "mario low poly gltf" or "super mario 3d model free"
  Alternative: Use panda3d-gltf to load .glb files directly

PRIORITY 2 — Environment Props:
- Vehicle models (cars, trucks)
- Building facades with windows
- Trees, bushes, street props
- Coin/collectible models

PRIORITY 3 — Textures & Materials:
- Brick, concrete, asphalt textures
- Grass, dirt, water
- UI elements (hearts, stars, coins)

PRIORITY 4 — Audio:
- Jump sound, coin collect, power-up
- Engine sounds, horn
- Background music (royalty-free)

SCRAPING APPROACH:
1. Use aiohttp to fetch from free 3D model APIs
2. Convert to GLTF using panda3d-gltf
3. Cache locally in /assets/ folder
4. Load at game init

================================================================
## 4. VISUAL QUALITY UPGRADE PLAN (Opus 5.6 Level)
================================================================

PHASE 1 — PBR Pipeline (BIGGEST IMPACT):
- Integrate panda3d-simplepbr into Ursina
- Replace basic_lighting_shader with simplepbr
- Add environment map for reflections
- Add bloom post-processing
- Result: Materials look REAL — metal shines, surfaces have depth

PHASE 2 — Custom Shaders:
- Write GLSL vertex/fragment shaders for:
  * Toon shading (Nintendo-style cel shading)
  * Rim lighting (character glow)
  * Vertex animation (waving grass, water)
- Use pyopengl for direct GL calls if needed

PHASE 3 — Post-Processing Stack:
- Bloom (glow on bright objects)
- Color grading (warm Nintendo palette)
- Vignette (cinematic edges)
- Anti-aliasing (smooth edges)

PHASE 4 — Particle System Upgrade:
- GPU-accelerated particles
- Smoke, dust, sparkles
- Weather (rain, snow)
- Footstep dust clouds

================================================================
## 5. PHYSICS & MOVEMENT REFINEMENT
================================================================

ORIGINAL 3D ISSUES & 2D RESOLUTIONS:
1. ~~Player accel formula sluggish~~ ✅ FIXED in V1.4.0
   - Old: `accel * dt * 0.1` (in 3D draft)
   - New (2D): direct lerp `pvx += (target - pvx) * min(accel*dt, 1.0)`
   - Air control dampened to 60% (AY*0.6) so jumps feel arc-y

2. ~~Camera distance 10 units~~ ❌ N/A in 2D
   - 2D camera is 1D horizontal lerp at W//3 offset
   - Lerp speed increased 10→12 for snappier tracking (V1.4.0)

3. ~~No ground detection raycast~~ ❌ N/A in 2D
   - 2D uses solid-tile checks + y clamp to ground line
   - This is exact, not approximated

4. ~~No slope handling~~ ⏳ TODO (no ramps in current level)
5. ~~Vehicle physics basic~~ ⏳ TODO (cars are simple back-and-forth)

================================================================
## 6. ENTITY & MODEL AUDIT
================================================================

~~CURRENT ENTITY COUNT: ~560~~ ❌ N/A in 2D — that audit was for 3D.

2D entity/asset count (V1.4.0):
- Tile types cached: 8 (drawn from `_tile_cache`, no per-entity overhead)
- Active drawn tiles: ~50 on-screen (culled by camera)
- Enemies: 10 goombas
- Cars: 3 traffic vehicles
- Particles: 0-50 (object pool, auto-recycled on death)
- Sprites cached: 8 Mario poses × 4 mode combos = 32
- Heart sprites: 2 (filled/empty)
- Sky bands: 4 (full-screen gradients)

The 2D engine is already lean. Tile cache + sprite cache + tile culling
keep frame cost flat regardless of world size.

================================================================
## 7. GAMEPLAY FEATURES TO ADD
================================================================

SHORT TERM (1-2 days) — ✅ MOSTLY DONE in Pass 1:
- [x] Fix player acceleration (remove 0.1 multiplier)         ✅ V1.4.0
- [❌] Reduce camera distance to 6 units                       ❌ N/A 2D
- [x] Add footstep dust particles                              ✅ V1.4.0
- [x] Add coin spin animation (prettier, scale-X cosine)       ✅ V1.4.0
- [x] Add jump dust cloud on takeoff                           ✅ V1.4.0
- [x] Add landing dust cloud                                   ✅ V1.4.0
- [❌] Minimap player dot rotation                             ❌ no minimap yet
- [x] Health/lives system (3 hearts)                          ✅ V1.4.0

MEDIUM TERM (3-5 days) — re-scored for 2D:
- [❌] PBR pipeline integration                                ❌ N/A 2D
- [❌] Load real Mario GLTF model                               ❌ N/A 2D (sprite-based)
- [x] Combine city geometry (reduce entity count 10x)          ✅ N/A in 2D (tile-culled)
- [ ] Add sound effects (pygame.mixer ready, no assets)        ⏳ TODO
- [ ] Day/night cycle (sky tint + lamp lights)                 ⏳ TODO
- [ ] Weather system (rain particles)                          ⏳ TODO
- [x] Power-up system (mushroom=big, star=invincible)          ✅ EXISTED pre-Pass 1
- [ ] Double jump ability                                      ⏳ TODO
- [ ] Wall jump                                                ⏳ TODO
- [ ] Ground pound                                             ⏳ TODO
- [x] Coin magnet effect (coins fly to player)                 ✅ V1.4.0
- [x] HUD polish (pulse, fade, flash, shake)                   ✅ V1.4.0

LONG TERM (1-2 weeks):
- [ ] Multiplayer (aiohttp for networking)                     ⏳ TODO
- [ ] Custom shader pipeline (toon shading)                    ⏳ TODO
- [ ] Procedural vegetation (noise lib installed)              ⏳ TODO
- [ ] Water areas with swimming                                ⏳ TODO
- [ ] Vehicle customization                                    ⏳ TODO
- [ ] Achievement system                                       ⏳ TODO
- [ ] Save/load game state                                     ⏳ TODO

================================================================
## 8. IMMEDIATE ACTION ITEMS
================================================================

| # | Item                                       | Status   | Notes |
|---|--------------------------------------------|----------|-------|
| 1 | Fix player acceleration (remove 0.1 mult) | ✅ DONE  | V1.4.0 — direct lerp, air ctrl 60% |
| 2 | Reduce camera distance from 10 to 6        | ❌ N/A   | 2D uses 1D horizontal lerp; tightened 10→12 |
| 3 | Combine road dash entities                 | ❌ N/A   | 2D is tile-grid, no per-dash entities |
| 4 | Add footstep/jump/landing particle effects | ✅ DONE  | V1.4.0 — 3 separate spawn methods |
| 5 | Install noise library                      | ✅ DONE  | noise 1.2.2 installed via pip |
| 6 | Test panda3d-simplepbr integration         | ❌ N/A   | 2D build doesn't need 3D PBR |
| 7 | Scrape/download Mario GLTF model           | ❌ N/A   | 2D uses procedural sprite (32 cached poses) |
| 8 | Add health system (3 hearts, lose on hit)  | ✅ DONE  | V1.4.0 — procedural heart sprite + bob anim |
| 9 | Add coin magnet effect                     | ✅ DONE  | V1.4.0 — homing force in 110px radius |
| 10| Polish HUD with animated transitions       | ✅ DONE  | V1.4.0 — pulse/fade/flash/shake/bob |

**Audit Pass 1 completion: 6/10 done, 4/10 N/A for 2D codebase.**

================================================================
## 9. NEXT PASS ROADMAP (post V1.4.0)
================================================================

**Pass 2 — Audio + Weather (1-2 days):**
- [ ] Generate procedural jump/coin/hurt SFX (numpy→wav)
- [ ] Generate procedural BGM (Mario-style melody)
- [ ] Rain weather: 200 falling particles, screen tint
- [ ] Day/night: lerp sky palette by world clock

**Pass 3 — Procedural World (2-3 days):**
- [ ] Use `noise` to generate cloud backgrounds
- [ ] Procedural level chunks from Perlin heightmap
- [ ] Decorate chunks with trees, bushes, lamp placement

**Pass 4 — Juice (1-2 days):**
- [ ] Double jump (mid-air coyote of 0.15s)
- [ ] Wall jump (slide+wall detection, kick in opposite dir)
- [ ] Ground pound (down+jump, AOE dust ring on impact)
- [ ] Koopa shell that kicks off-screen (chain kills)

**Pass 5 — Save/Load + Achievements (2-3 days):**
- [ ] JSON save state (coins, score, lives, level hash)
- [ ] 10 achievements (100 coins, 10 stomps, etc.)
- [ ] Stats screen on game over
