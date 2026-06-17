#!/usr/bin/env python3
"""
NEON DRIFT — SKY RACER
Build system: concatenates all JS modules + CSS into final index.html
Usage: python3 build.py

Architecture:
  js/engine/    Core systems: constants, input, audio, physics, core (Three.js)
  js/entities/  Game objects: car, player, opponents, particles
  js/world/     Environment: tracks data, environment builder
  js/render/    Rendering: camera, HUD canvas
  js/ui/        Interface: DOM management
  js/systems/   Services: save/load, AI driver
  main.js       Entry point / game controller
"""
import os, glob

ROOT = os.path.dirname(os.path.abspath(__file__))
JS_DIR = os.path.join(ROOT, 'js')
CSS_DIR = os.path.join(ROOT, 'css')
OUT_FILE = os.path.join(ROOT, 'index.html')
TEMPLATE_FILE = os.path.join(ROOT, 'index_new.html')

# Module load order (dependencies first)
MODULES = [
    # Vendor (Three.js post-processing patches)
    'js/vendor/three-postprocessing.js',
    # Engine core
    'js/engine/constants.js',
    'js/engine/input.js',
    'js/engine/audio.js',
    'js/engine/physics.js',
    'js/engine/core.js',
    # World
    'js/world/tracks.js',
    'js/world/environment.js',
    # Entities
    'js/entities/car.js',
    'js/entities/player.js',
    'js/entities/opponents.js',
    'js/entities/particles.js',
    'js/entities/mascot.js',
    # Render
    'js/render/camera.js',
    'js/render/hud.js',
    # UI
    'js/ui/dom.js',
    'js/ui/reward-modal.js',
    # Effects
    'js/effects/confetti.js',
    # Systems
    'js/systems/save.js',
    'js/systems/ai.js',
    'js/systems/combos.js',
    'js/systems/powerups.js',
    'js/systems/messages.js',
    'js/systems/achievements.js',
    # Entry
    'js/main.js',
]

CSS_FILES = [
    'css/main.css',
]

def load_file(path):
    full = os.path.join(ROOT, path)
    if not os.path.exists(full):
        print(f"  MISSING: {path}")
        return ""
    with open(full, 'r', encoding='utf-8') as f:
        return f.read()

def main():
    print("=" * 50)
    print("NEON DRIFT — Build System")
    print("=" * 50)

    # 0. Verify vendor assets are in place (served alongside index.html)
    print("\n[0/4] Checking vendor assets...")
    vendor_three = os.path.join(JS_DIR, 'vendor', 'three.min.js')
    if not os.path.exists(vendor_three):
        print(f"  MISSING: {vendor_three}")
        print("  Place three.min.js (build/three.min.js from three@0.160.0) in js/vendor/")
        return
    print(f"  js/vendor/three.min.js ({os.path.getsize(vendor_three) / 1024:.1f} KB)")

    # 1. Load template
    print("\n[1/4] Loading template...")
    template = load_file('index_new.html')
    if not template:
        print("ERROR: index_new.html not found!")
        return

    # 2. Concatenate JS modules
    print("[2/4] Concatenating JS modules...")
    js_blocks = []
    total_js_lines = 0
    for mod in MODULES:
        content = load_file(mod)
        lines = content.count('\n') + 1
        total_js_lines += lines
        js_blocks.append(f"// ─── {mod} ───")
        js_blocks.append(content)
        print(f"  {mod} ({lines} lines)")

    js_code = '(function() {\n"use strict";\n\n' + '\n\n'.join(js_blocks) + '\n})();'

    # 3. Concatenate CSS
    print("\n[3/4] Loading CSS...")
    css_blocks = []
    for css_file in CSS_FILES:
        content = load_file(css_file)
        lines = content.count('\n') + 1
        css_blocks.append(f"/* {css_file} */")
        css_blocks.append(content)
        print(f"  {css_file} ({lines} lines)")

    css_code = '\n\n'.join(css_blocks)

    # 4. Inject into template
    print("\n[4/4] Building index.html...")
    output = template.replace('/* __CSS__ */', css_code)
    # Inject JS into app.js template
    output = output.replace('/* __MODULES__ */', js_code)

    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        f.write(output)

    size_kb = os.path.getsize(OUT_FILE) / 1024
    total_lines = output.count('\n') + 1
    print(f"\n{'=' * 50}")
    print(f"BUILD SUCCESS")
    print(f"  Output: {OUT_FILE}")
    print(f"  Size: {size_kb:.1f} KB")
    print(f"  Lines: {total_lines}")
    print(f"  JS modules: {len(MODULES)} ({total_js_lines} lines)")
    print(f"  CSS files: {len(CSS_FILES)}")
    print(f"{'=' * 50}")

if __name__ == '__main__':
    main()
