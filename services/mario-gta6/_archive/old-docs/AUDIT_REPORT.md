# SUPER MARIO GTA6 — Engine Audit Report
# OWL — June 12, 2026
#
# AUDIT SCOPE: mario_gta6_2d.py (651 lines) + website/js/engine/ (41 modules)
#
# ═══════════════════════════════════════════════════════════════
# 1. SURFACES
# ═══════════════════════════════════════════════════════════════
#
# TILE CACHE (lines 48-74):
#   ✓ Pre-rendered at module load time (good)
#   ✓ 8 tile types: empty, ground, brick, question, pipe-L, pipe-R, used-block, dirt
#   ✗ No SRCALPHA on opaque tiles (minor — fills are fine for opaque)
#   ✗ Tile 9 (used block) has no visual distinction from empty (just dark brown)
#   ✗ No animated tiles (question block doesn't animate)
#   ✗ No tile for: spikes, springs, platforms, coins-as-tiles, doors, flags
#
# MARIO SPRITES (lines 95-148):
#   ✓ Procedural generation (no external assets needed)
#   ✓ 4 poses × 2 sizes × 2 power-ups = 16 sprites pre-cached
#   ✓ SRCALPHA for transparency
#   ✗ No fire Mario sprite (p_mode=2 gives super but no fire variant)
#   ✗ No death animation frames
#   ✗ No climb/crouch sprites
#   ✗ No GTA outfit variants (police, medic, etc.)
#
# HEART SPRITES (lines 78-91):
#   ✓ Filled + empty variants
#   ✗ No half-heart for damage indication
#
# PARTICLE SURFACES:
#   ✗ Particles use raw circles/ellipses — no sprite variety
#   ✗ No explosion sprites, smoke trails, or sparkle effects
#
# HUD SURFACES (lines 566-624):
#   ✓ Dynamic background with alpha
#   ✓ Damage flash overlay
#   ✓ Coin icon rendered procedurally
#   ✗ No minimap surface
#   ✗ No GTA HUD elements (wanted stars, fuel, radar)
#   ✗ No XP bar, combo counter, or level-up notification
#
# ═══════════════════════════════════════════════════════════════
# 2. GAME LOOP
# ═══════════════════════════════════════════════════════════════
#
# PYTHON (lines 628-651):
#   ✓ Fixed timestep with dt capping at 0.05s (good for stability)
#   ✓ Clean event → update → draw pipeline
#   ✗ No frame counter or FPS display in-game
#   ✗ No pause state
#   ✗ No state machine (menu → playing → gameover → retry)
#   ✗ No delta-time accumulator for fixed-step physics
#   ✗ Single-threaded (no async loading)
#
# WEB (website/js/engine/core.js):
#   ✓ requestAnimationFrame-based loop
#   ✓ State machine: menu → playing → paused → gameover
#   ✓ Canvas resize handling
#   ✓ Combo system with timer
#   ✓ XP/leveling system
#   ✓ Hat switching system
#   ✓ Drift chain system (racing mode)
#   ✗ No fixed timestep (variable dt can cause physics issues)
#   ✗ No frame pacing or vsync handling
#
# ═══════════════════════════════════════════════════════════════
# 3. COLLISION
# ═══════════════════════════════════════════════════════════════
#
# TILE COLLISION (lines 285-289):
#   ✓ Simple tile lookup with bounds checking
#   ✓ solid() check for 8 tile types
#   ✗ NO AABB collision — only single-tile checks
#   ✗ Player can clip through walls at high speed (no sweep test)
#   ✗ No side collision detection (only top/bottom)
#   ✗ No slope handling
#   ✗ No one-way platforms
#   ✗ Head bump only checks tile above player center (htx, hty)
#   ✗ No collision response for moving platforms
#
# ENEMY COLLISION (lines 403-422):
#   ✓ Simple AABB overlap check
#   ✓ Stomp detection (player falling + above enemy)
#   ✗ Enemy-wall collision is primitive (just reverse velocity)
#   ✗ No enemy-enemy collision
#   ✗ No enemy types (all are goombas)
#   ✗ No collision layers or tags
#   ✗ Damage check uses simple distance, not AABB
#
# COIN/PICKUP COLLISION:
#   ✗ No dedicated coin entities — coins only from question blocks
#   ✗ No power-up collision (mushroom, star, etc. never spawn)
#   ✗ Coin magnet only works on particles, not entities
#
# CAR COLLISION (lines 453-465):
#   ✓ Simple proximity check for enter/exit
#   ✗ No car-player physics collision
#   ✗ No car-enemy collision
#   ✗ Cars pass through walls (only bounce at level edges)
#
# ═══════════════════════════════════════════════════════════════
# 4. PHYSICS
# ═══════════════════════════════════════════════════════════════
#
# PLAYER PHYSICS (lines 303-384):
#   ✓ Gravity with variable jump height (hold = higher)
#   ✓ Coyote time (0.10s) — good feel
#   ✓ Jump buffer (0.12s) — good feel
#   ✓ Air control (60% of ground control)
#   ✓ Separate ground/air deceleration
#   ✓ Max fall speed cap (900)
#   ✓ Squash/stretch on jump/landing
#   ✗ No wall sliding or wall jumping
#   ✗ No swimming/diving
#   ✗ No ground slope adjustment
#   ✗ No momentum preservation on direction change
#   ✗ Acceleration uses lerp (ax*spd - pvx) * accel*dt — can overshoot
#   ✗ No friction coefficient (only deceleration)
#
# ENEMY PHYSICS (lines 403-410):
#   ✓ Constant velocity movement
#   ✓ Wall bounce (reverse velocity)
#   ✗ No gravity for enemies (they float)
#   ✗ No pathfinding or AI
#   ✗ No enemy-specific physics (koopa shell, etc.)
#
# PARTICLE PHYSICS (lines 424-446):
#   ✓ Per-particle gravity coefficient
#   ✓ Coin magnet with distance-based force
#   ✓ Spinning coin animation
#   ✗ O(n) list.remove() during iteration (slow for many particles)
#   ✗ No particle pooling (constant alloc/free)
#   ✗ No particle collision with tiles
#   ✗ No wind or external forces
#
# CAR PHYSICS (lines 448-465):
#   ✓ Simple acceleration/deceleration
#   ✓ Player inherits car position
#   ✗ No drift physics
#   ✗ No collision damage
#   ✗ No fuel consumption
#   ✗ Cars bounce at level edges (no smooth turn)
#
# CAMERA (lines 467-470):
#   ✓ Smooth lerp follow (12×dt)
#   ✓ Clamped to level bounds
#   ✗ No lookahead based on player velocity
#   ✗ No screen shake
#   ✗ No zoom in/out
#   ✗ No camera triggers or cutscenes
#
# ═══════════════════════════════════════════════════════════════
# 5. EXTRAS / MISSING DIMENSIONS
# ═══════════════════════════════════════════════════════════════
#
# POWER-UPS:
#   ✗ Mushroom (grow big) — p_mode exists but no spawn logic
#   ✗ Fire flower (shoot fireballs) — no fireball entity
#   ✗ Star (invincibility) — p_star exists but no spawn
#   ✗ 1-Up mushroom — no spawn logic
#   ✗ Spring/bounce pad — no entity
#
# ENEMIES:
#   ✗ Goomba — exists but no variety
#   ✗ Koopa — missing (should have shell mechanic)
#   ✗ Piranha plant — missing
#   ✗ Hammer bro — missing
#   ✗ Bullet bill — missing
#   ✗ Cheep cheep — missing
#   ✗ Bowser — missing (boss)
#
# LEVEL:
#   ✗ Single hardcoded level
#   ✗ No level progression
#   ✗ No warp zones
#   ✗ No flagpole/end-of-level
#   ✗ No underground/underwater sections
#   ✗ No moving platforms
#   ✗ No spikes or instant-kill tiles
#   ✗ No checkpoints
#
# GTA FEATURES:
#   ✗ Wanted system — code exists in python/gta/ but not integrated
#   ✗ Shops — code exists but not integrated
#   ✗ Missions — code exists but not integrated
#   ✗ Police chase — no police entity
#   ✗ Fuel system — no fuel mechanic
#   ✗ Drift scoring — no drift detection
#
# AUDIO:
#   ✗ No sound effects in Python engine
#   ✗ No music
#   ✗ Audio engine exists in python/polish/audio.py but not integrated
#
# POLISH:
#   ✗ No screen shake on impacts
#   ✗ No slow-motion on kills
#   ✗ No minimap
#   ✗ No save/load integration
#   ✗ No pause menu
#   ✗ No settings (volume, controls)
#   ✗ No combo system
#   ✗ No XP/leveling
#
# ═══════════════════════════════════════════════════════════════
# PRIORITY FIXES FOR ENHANCED BUILD
# ═══════════════════════════════════════════════════════════════
#
# CRITICAL (breaks gameplay):
#   1. Add proper AABB collision (player vs tiles in all directions)
#   2. Add side collision detection (stop at walls)
#   3. Add power-up spawn from question blocks
#   4. Add enemy gravity + proper AI
#   5. Add level end / flagpole
#
# IMPORTANT (major features):
#   6. Add Koopa enemy with shell mechanic
#   7. Add fireball entity + shooting
#   8. Add moving platforms
#   9. Add spikes / hazards
#   10. Add multiple levels with progression
#   11. Add GTA wanted system integration
#   12. Add audio engine integration
#   13. Add screen shake + slow-motion
#   14. Add save/load integration
#
# NICE-TO-HAVE (polish):
#   15. Add particle pooling
#   16. Add camera lookahead
#   17. Add combo system
#   18. Add minimap
#   19. Add pause menu
#   20. Add animated question blocks
