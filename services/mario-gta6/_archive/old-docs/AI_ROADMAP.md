# SUPER MARIO GTA6 — Code Review & Build Plan
# OWL — June 12, 2026

═══════════════════════════════════════════════════════════════
## CURRENT STATE ASSESSMENT
═══════════════════════════════════════════════════════════════

### Architecture Overview
3 parallel implementations of the same game:

1. PYTHON/PYGAME (mario_gta6_2d.py) — 651 lines, V1.4.0
   - Single-file, monolithic, procedural
   - Tile-based level, particle system, enemy AI
   - Cars, coins, power-ups, HUD with hearts/score/time
   - Runs standalone via pygame

2. WEB/JS (website/js/) — 41 ES6 modules
   - Modular architecture: engine/ entities/ render/ systems/ ui/ world/
   - Three.js for 3D (car-3d.js, road-generator.js)
   - Racing mode with HUD, opponents, particles
   - WASM physics bridge (physics-wasm.js)
   - Police entities, vehicles, power-ups, save system

3. RUST/WASM (rust/mario_gta6_physics/) — 1068 lines
   - #![no_std], branch-free tile lookup
   - Memory-mapped I/O with JS (STATIC_CONFIG, INPUT, PLAYER_OUT, etc.)
   - Compiled to mario_gta6_physics.wasm
   - Mirrors JS physics line-for-line

### AI Module (python/ai/) — SKELETON ONLY
- __init__.py with imports but NO implementation files
- Nemotron created the structure, didn't write the bodies
- Missing: network.py, agent.py, environment.py, trainer.py, replay_buffer.py, utils.py

### What Works
- Python game is playable (pygame, single file)
- Web version has full modular architecture with 3D racing
- Rust/WASM physics is compiled and integrated
- Level parser, particle system, enemy AI, car physics all functional

═══════════════════════════════════════════════════════════════
## CODE QUALITY ISSUES FOUND
═══════════════════════════════════════════════════════════════

### Critical (fix now)
1. AI module is empty — __init__.py imports don't resolve
2. Python game is monolithic (651 lines single file) — hard to extend
3. No test suite for game logic
4. No separation of game state from rendering

### Important (fix soon)
5. Particle system uses list.remove() during iteration (O(n) per removal)
6. Enemy AI is trivial (bounce off walls, no pathfinding)
7. Level is hardcoded string — no level editor or external format
8. No collision abstraction — tile checks scattered throughout
9. Camera system is basic lerp — no lookahead, no screen shake
10. Car physics is simplistic (no acceleration curve, no drift)

### Nice to have
11. No sound engine in Python version
12. No minimap
13. No day/night cycle
14. Web version has police but Python version doesn't
15. No multiplayer/networking layer

═══════════════════════════════════════════════════════════════
## NEMOTRON'S COMPLETED WORK (from task list)
═══════════════════════════════════════════════════════════════

[✓] Analyze current architecture for GPU acceleration opportunities
[✓] Design AI agent architecture for Mario (RL/behavior tree/neural net)
    → Created python/ai/ skeleton with __init__.py
[•] Implement GPU-accelerated physics/rendering pipeline
    → Started but not complete
[ ] Integrate AI inference pipeline (ONNX/TensorRT/PyTorch)
[ ] Create training framework for Mario AI agent
[ ] Optimize WASM physics for GPU offload

═══════════════════════════════════════════════════════════════
## OWL'S TASK PLAN — Next Phases
═══════════════════════════════════════════════════════════════

### PHASE 1: AI Module Implementation (Foundation)
Target: Working MarioNet that can run inference on game frames

Files to create:
  python/ai/network.py      — MarioNet CNN+LSTM architecture
  python/ai/agent.py        — MarioAgent inference wrapper
  python/ai/environment.py  — Gym-like env wrapping the Python game
  python/ai/replay_buffer.py — Experience replay for training
  python/ai/utils.py        — Helpers (frame stack, reward shaping)
  python/ai/config.yaml     — Hyperparameters

Design decisions (from Nemotron's plan, refined):
  Observation: 84x84x4 frame stack + 16-dim game state vector
  Action space: 8 discrete (noop, left, right, jump, run, fire, car, pause)
  Reward: sparse (level complete) + shaped (coins, x-pos, survival, time)
  Architecture: IMPALA CNN (3 conv blocks) + 256-unit LSTM + policy/value heads
  Export: ONNX for TensorRT (desktop) / ONNX Runtime Web (browser)

Steps:
  1. Implement MarioNet in PyTorch
  2. Implement MarioAgent with act() method
  3. Create Gym-like environment wrapper
  4. Test inference on random inputs
  5. Export to ONNX, verify with onnxruntime

### PHASE 2: Training Framework
Target: PPO training loop that can train Mario to play

Files to create:
  python/ai/trainer.py      — PPO with GAE, vectorized envs
  python/ai/curriculum.py   — Level progression (easy→hard)
  python/ai/eval.py         — Metrics: completion rate, coin efficiency
  configs/ppo_mario.yaml    — Training hyperparameters

Steps:
  1. Implement PPO trainer with GAE(λ)
  2. Create vectorized environment (SubprocVecEnv)
  3. Add TensorBoard logging
  4. Train on simple level (flat ground, few enemies)
  5. Evaluate and iterate

### PHASE 3: GPU-Accelerated Physics/Rendering
Target: CuPy/PyTorch kernels for particle systems and tile collision

Files to create:
  python/gpu/gpu_physics.py — GPU particle update, tile broadphase
  python/gpu/gpu_render.py  — ModernGL compute shaders for sprite batching

Steps:
  1. Profile Python game to find bottlenecks
  2. Implement GPU particle update with CuPy
  3. Implement GPU tile collision broadphase
  4. Benchmark: CPU vs GPU at 1000/5000/10000 particles
  5. Integrate into main game loop

### PHASE 4: AI Integration into Game
Target: Drop-in AI player that can control Mario in real-time

Steps:
  1. Create AIPlayer class that replaces keyboard input
  2. Hook into game.run(dt, keys) → game.run(dt, ai_actions)
  3. Add AI visualization overlay (attention map, value estimate)
  4. Support hot-switching: human ↔ AI control
  5. Add AI vs Human mode

### PHASE 5: Web AI Inference
Target: Run trained AI in browser via ONNX Runtime Web

Steps:
  1. Export trained model to ONNX
  2. Create website/js/ai/inference.js
  3. Integrate with web version's game loop
  4. Add AI control toggle in web UI
  5. Benchmark inference speed in browser

### PHASE 6: Game Content Expansion
Target: More levels, enemies, vehicles, GTA features

Steps:
  1. Create level editor (HTML5 canvas or Python tkinter)
  2. Design 5+ levels with increasing difficulty
  3. Add GTA features: wanted system, shops, missions
  4. Add more vehicle types (motorcycle, boat, helicopter)
  5. Implement police chase AI (web version has police.js, port to Python)

### PHASE 7: Polish & Performance
Target: 60fps with 10000+ particles, full audio, save/load

Steps:
  1. Add SDL2 audio engine to Python version
  2. Implement save/load system (JSON or binary)
  3. Add screen shake, slow-mo, cinematic camera
  4. Optimize particle pool (pre-allocated array, no list.remove)
  5. Add minimap, day/night cycle, weather

═══════════════════════════════════════════════════════════════
## IMMEDIATE NEXT STEPS (for hermes)
═══════════════════════════════════════════════════════════════

Priority order:
  1. Create python/ai/network.py — MarioNet CNN+LSTM
  2. Create python/ai/agent.py — inference wrapper
  3. Create python/ai/environment.py — Gym wrapper for the game
  4. Create python/ai/config.yaml — hyperparameters
  5. Test: python -c "from python.ai import MarioNet; print('OK')"

Then:
  6. Create python/ai/trainer.py — PPO training loop
  7. Create configs/ppo_mario.yaml
  8. Train on simple level
  9. Integrate AI player into game

═══════════════════════════════════════════════════════════════
## KEY DESIGN DECISIONS (for continuity)
═══════════════════════════════════════════════════════════════

Decision                    Choice
──────────────────────────  ──────────────────────────────────
Observation                 84×84×4 frame stack + 16-dim state
Action space                8 discrete
Reward                      sparse + shaped
Architecture                IMPALA CNN + 256-unit LSTM
Training algo               PPO with GAE(λ)
Export format               ONNX → TensorRT / ONNX Runtime Web
Game wrapper                Gymnasium-compatible env
Level format                String-based (extend to JSON later)
Physics                     Rust WASM (keep), GPU augment (add)
Rendering                   Python: pygame | Web: Three.js + Canvas
AI control                  Drop-in replacement for keyboard input

═══════════════════════════════════════════════════════════════
## DEPENDENCIES TO INSTALL
═══════════════════════════════════════════════════════════════

pip install torch torchvision torchaudio
pip install gymnasium stable-baselines3 sb3-contrib
pip install tensorboard onnx onnxruntime
pip install pygame numpy pillow opencv-python
pip install cupy-cuda12x  # if CUDA available

═══════════════════════════════════════════════════════════════
