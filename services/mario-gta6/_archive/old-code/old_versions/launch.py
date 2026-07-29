"""
LAUNCH - Entry point for Super Mario GTA6 v1.0.0
Usage: python3 launch.py
"""
import sys
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 50, flush=True)
print("  SUPER MARIO GTA6 v1.0.0", flush=True)
print("  Loading...", flush=True)
print("=" * 50, flush=True)

import main

# Initialize game
app = main.init_game()

# Show title screen then auto-start
main.hud.show_menu()
main.game_state['state'] = 'PLAYING'
main.hud.hide_menu()

# ── Bridge: Ursina calls __main__.update() and __main__.input() ──
# Forward to main.py where the real logic lives.
def update():
    main.global_update()

def input(key):
    main.input(key)

# Also set app.update for good measure
try:
    app.update = update
except:
    pass

print("", flush=True)
print("  CONTROLS:", flush=True)
print("  WASD     - Move / Drive", flush=True)
print("  SHIFT    - Sprint / Nitro", flush=True)
print("  SPACE    - Jump / Brake", flush=True)
print("  F        - Enter / Exit Vehicle", flush=True)
print("  C        - Toggle Camera", flush=True)
print("  M        - Toggle Minimap", flush=True)
print("  T        - Honk Horn", flush=True)
print("  ESC      - Quit", flush=True)
print("", flush=True)
print("  Collect coins, drive cars, do missions!", flush=True)
print("=" * 50, flush=True)

app.run()
print("GAME EXITED", flush=True)
