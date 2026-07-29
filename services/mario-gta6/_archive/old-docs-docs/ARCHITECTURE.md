# Architecture Documentation

## Overview

Super Mario GTA6 uses a **Nano Engine** architecture — maximum performance
with minimum code footprint.

## Core Loop

```
while running:
    dt = clock.tick(FPS) / 1000
    handle_events()
    update_physics(dt)
    update_enemies(dt)
    update_particles(dt)
    update_camera()
    draw()
    flip()
```

## Sprite System

1. **Pre-rendering**: All sprites are rendered to surfaces at startup
2. **Caching**: Sprites stored in `_mario_cache` dict
3. **Runtime transform**: Only applied when `|squash - 1.0| > 0.02`
4. **Flip**: Using `pygame.transform.flip()` for direction changes

## Physics Engine

### Adaptive Parameters
- Ground vs air acceleration/deceleration
- Variable jump height via hold duration
- Coyote time for edge forgiveness
- Jump buffer for input queuing
- Friction-based deceleration (exponential decay)

### Collision System
- Tile-based AABB collision
- Head bump detection for blocks
- Enemy stomp detection (velocity-based)

## Tile Rendering Optimization

- Tiles pre-rendered to surfaces in `_tile_cache`
- Camera culling: only tiles in `[cam_x//T-1 : cam_x//T + W//T + 2]` drawn
- Sky rendered as 4 horizontal bands (not per-pixel)

## Memory Management

- `__slots__` on all game objects
- Particle auto-removal on death
- Enemy removal on defeat
- No leaked surfaces

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Lines of Code | <500 | 418 |
| CPU Usage | <20% | 17.5% |
| Memory | <50MB | ~30MB |
| FPS | 60 | 60 |
| Draw calls/frame | <200 | ~150 |
