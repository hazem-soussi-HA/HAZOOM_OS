# planet-earth

Planet Earth visualization service for HAZOOM_OS. Interactive 3D Earth model using Three.js with orbital controls, bloom post-processing, and atmospheric effects.

## Structure
- `src/` - Core visualization JavaScript (Three.js scene, animation)
- `assets/` - Textures and logos
- `vendor/` - Three.js library and addons (OrbitControls, EffectComposer, UnrealBloomPass)
- `server.py` - HTTP/WebSocket server entry point
- `index.html` - Main entry point
- `temperature/` - Temperature data visualization module
- `scripts/` - Build and security utilities

## Dependencies
- Three.js (vendored)

## Server
Run `python3 server.py` to start the visualization service.
