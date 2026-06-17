# NEON DRIFT × MARIO GTA6 — Integration Plan

## Vision

Integrate Neon Drift's 3D racing engine into Mario GTA6's open world. When Mario enters a car, instead of the current simple 2D vehicle physics, the game transitions to a full 3D racing experience powered by Neon Drift's physics, rendering, and audio systems.

## Current State Analysis

### Neon Drift (`/home/hazem/games/neon-drift/`)
- **28 JS modules** across 7 directories (engine, entities, world, render, ui, systems, effects)
- **Three.js 3D** via importmap from unpkg.com (ES modules)
- **Full sim physics**: 1350kg car, torque curves, tire slip, aero, gearbox with clutch
- **Procedural audio**: engine sound, tire screech, effects via Web Audio API
- **Post-processing**: UnrealBloomPass, EffectComposer
- **AI opponents**, power-ups, achievements, combos/scoring
- **4 cameras**: chase, cockpit, hood, bumper
- **Build system**: `build.py` concatenates modules + CSS into `index.html`
- **Total**: ~3,500 lines JS + 1,300 lines CSS

### Mario GTA6 Website (`/home/hazem/mario_gta6/website/`)
- **26 JS modules** across 7 directories (same structure as Neon Drift)
- **Canvas 2D** rendering (no Three.js)
- **Simple vehicle physics**: `physics.js` lines 138-163 — basic velocity, enter/exit with F key
- **Vehicles.js is a 5-line stub** — "Vehicle logic is in physics.js"
- **Procedural audio**: simple tone-based SFX + BGM
- **Build system**: `build.py` concatenates modules + CSS into `index.html`
- **Total**: ~1,200 lines JS + CSS

### Mario GTA6 Python 2D (`/home/hazem/mario_gta6/mario_gta6_2d.py`)
- **641 lines**, Pygame side-scroller
- Car spawning at line 226, enter/exit at physics loop lines 138-163
- Simple car: `c.vx` only, no physics model

## Integration Architecture

### Strategy: "Racing Mode" State

The cleanest approach is to add a **RACING state** to Mario GTA6's state machine. When Mario enters a car, instead of the current simple driving, the game switches to a 3D racing view powered by Neon Drift's engine.

```
Current:  TITLE → PLAYING (with simple car)
Future:   TITLE → PLAYING (on foot) → RACING (in car, 3D) → PLAYING
```

### Phase 1: Extract Neon Drift Core Modules

Extract the **engine-level** modules from Neon Drift that are game-agnostic:

| Neon Drift Module | Purpose | Adapt For Mario GTA6 |
|---|---|---|
| `engine/constants.js` | Physics constants | Merge with Mario's constants |
| `engine/physics.js` | Car sim physics | Replace simple car physics |
| `engine/audio.js` | Procedural audio | Enhance Mario's audio |
| `engine/input.js` | Keyboard handling | Merge with Mario's input |
| `engine/core.js` | Three.js setup | NEW — Mario has no 3D |
| `entities/car.js` | 3D car model | NEW — Mario has 2D sprites |
| `render/camera.js` | 3D camera system | NEW |
| `render/hud.js` | Canvas HUD overlay | Adapt for Mario's HUD |
| `world/environment.js` | 3D world builder | NEW |
| `world/tracks.js` | Track definitions | Adapt for Mario's world |

### Phase 2: Integration Points

#### 2a. State Machine Extension (core.js)
```javascript
// Add to STATE enum:
var STATE = 'TITLE'; // → 'PLAYING' | 'RACING' | 'PAUSED' | 'GAMEORE'

// In gameLoop():
} else if (STATE === 'RACING') {
    updateRacingPhysics(dt);
    drawRacing();
}
```

#### 2b. Enter/Exit Car Transition (physics.js)
```javascript
// Replace current enter/exit (lines 145-163) with:
if (isKey('f') && consumeKey('f')) {
    if (game.pOnCar) {
        // Exit car → back to 2D platformer
        game.pOnCar = false;
        game.pCar = null;
        STATE = 'PLAYING';
        exitRacingMode();
    } else {
        // Enter car → switch to 3D racing
        for (var ci = 0; ci < game.cars.length; ci++) {
            var c = game.cars[ci];
            if (Math.abs(c.x - game.px) < TILE * 2) {
                game.pOnCar = true;
                game.pCar = c;
                STATE = 'RACING';
                initRacingMode(c);
                break;
            }
        }
    }
}
```

#### 2c. Racing Mode Init
```javascript
function initRacingMode(car) {
    // 1. Hide 2D canvas, show 3D canvas
    // 2. Initialize Three.js scene (from Neon Drift core.js)
    // 3. Build 3D road from Mario's tilemap
    // 4. Create car model at car position
    // 5. Initialize Neon Drift physics
    // 6. Switch audio to engine sounds
}
```

#### 2d. Road Generation from Tilemap
The key challenge: Neon Drift uses predefined spline tracks. For Mario GTA6, we need to **generate a 3D road from the 2D tilemap**.

Approach:
- Scan Mario's level tilemap for road tiles
- Generate a CatmullRom spline from road centerline
- Extrude a 3D road mesh along the spline
- Add environment (buildings, trees) from tile types

### Phase 3: Module Merge Plan

#### Files to CREATE (new for Mario GTA6):
1. `website/js/engine/three-core.js` — Three.js setup (from Neon Drift `engine/core.js`)
2. `website/js/world/road-generator.js` — Tilemap → 3D road conversion
3. `website/js/entities/racing-car.js` — 3D car model (from Neon Drift `entities/car.js`)
4. `website/js/render/racing-camera.js` — 3D camera (from Neon Drift `render/camera.js`)
5. `website/js/render/racing-hud.js` — Racing HUD overlay (from Neon Drift `render/hud.js`)
6. `website/js/systems/racing-audio.js` — Engine audio (from Neon Drift `engine/audio.js`)

#### Files to MODIFY:
1. `website/js/engine/constants.js` — Add physics constants from Neon Drift
2. `website/js/engine/core.js` — Add RACING state to game loop
3. `website/js/engine/physics.js` — Replace car section with Neon Drift physics
4. `website/js/engine/input.js` — Add racing controls (nitro, camera switch)
5. `website/js/entities/vehicles.js` — Replace stub with real car spawning
6. `website/js/main.js` — Add racing mode boot
7. `website/build.py` — Add new modules to build order

#### Files to KEEP (no changes needed):
- `website/js/render/sprites.js` — Mario sprites still used in 2D mode
- `website/js/render/draw.js` — 2D rendering still used
- `website/js/entities/enemies.js` — Koopas, Goombas
- `website/js/entities/powerups.js` — Mushrooms, fire flowers
- `website/js/world/level.js` — Level builder
- `website/js/world/tiles.js` — Tile definitions
- `website/js/ui/menus.js` — Title, pause, game over
- `website/js/systems/save.js` — Save/load
- `website/js/systems/settings.js` — Settings

### Phase 4: Three.js Integration

Mario GTA6 currently has **no Three.js dependency**. Options:

**Option A: Importmap (like Neon Drift)**
```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js"
  }
}
</script>
```
- Pros: Clean ES modules, same as Neon Drift
- Cons: Requires file:// → HTTP server (CORS), slower dev

**Option B: Bundled Three.js**
- Download three.min.js, include in build
- Pros: Works offline, faster
- Cons: Large file (~600KB), manual updates

**Option C: Conditional loading**
- Only load Three.js when entering a car
- Pros: No overhead for 2D mode
- Cons: Delay when entering car

**Recommendation: Option C** — dynamic import when entering racing mode:
```javascript
async function initRacingMode(car) {
    const THREE = await import('three');
    const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
    // ... init scene
}
```

### Phase 5: Audio Integration

Neon Drift's audio engine is more sophisticated (oscillator-based engine sounds). Integration:

1. Keep Mario's SFX for 2D mode (jump, coin, stomp, BGM)
2. Use Neon Drift's engine audio for racing mode
3. Crossfade when entering/exiting car

```javascript
// In enterRacingMode():
SFX.stopBGM();
Audio.init();  // Neon Drift audio
Audio.resume();

// In exitRacingMode():
Audio.suspend();
SFX.startBGM();
```

## Technical Challenges

### 1. Canvas 2D ↔ Three.js 3D Switching
- Need two canvases or dynamic context switch
- Recommendation: Two overlapping canvases, toggle visibility

### 2. Tilemap → 3D Road
- Mario's tilemap is a 2D array of tile IDs
- Need to identify road tiles and generate a 3D spline
- This is the hardest part — may need manual road placement

### 3. Coordinate Systems
- Mario: TILE=48px, 2D grid, camera scrolls horizontally
- Neon Drift: 3D world units, spline-based, free camera
- Need mapping: `mario.x * TILE → worldX, worldZ`

### 4. Performance
- Three.js + post-processing is heavy
- Need quality settings (low/medium/high)
- Consider disabling bloom on low-end devices

### 5. Build System
- Current build.py concatenates JS files
- Three.js addons may need separate handling
- May need to adjust build order for dependencies

## Implementation Order

1. **Setup**: Add Three.js importmap to index.html template
2. **Core**: Create racing mode state in core.js
3. **Physics**: Merge Neon Drift physics constants + car sim
4. **3D Road**: Build tilemap → road generator
5. **Car Model**: Integrate CarBuilder
6. **Camera**: Integrate multi-view camera system
7. **Audio**: Crossfade between 2D/3D audio
8. **HUD**: Racing HUD overlay (speed, gear, RPM)
9. **Controls**: Racing keybindings (nitro, camera)
10. **Polish**: Transitions, particles, effects

## File Size Budget

- Current Mario GTA6 website: ~113KB (index.html)
- Neon Drift total: ~206KB (index.html)
- Target merged: ~250-300KB (selective module inclusion)
- Three.js (if bundled): +600KB → use CDN instead

## Branch Strategy

- `main` — stable Mario GTA6
- `feature/neon-drift-integration` — integration work (current)
- Merge to main when racing mode is playable

---

*Created: 2026-004-06*
*Author: Hazem Soussi (HA) × Hermes*
*Status: Planning phase*
