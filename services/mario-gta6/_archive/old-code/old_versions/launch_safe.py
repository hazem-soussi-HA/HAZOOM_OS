"""Game launcher with forced visibility"""
import os
os.environ['SDL_AUDIODRIVER'] = 'disk'

from ursina import *

app = Ursina(title='Super Mario GTA6', borderless=False, fullscreen=False, development=False)

# Force window to visible position
window.position = (200, 100)
window.size = (1280, 720)
window.color = color.rgb(10, 15, 25)

# We need to DON'T call app.run() here — the game.py will do it
# Instead, just execute game code but intercept the app.run() call
import builtins
_orig_print = builtins.print
def _log_print(*args, **kwargs):
    msg = ' '.join(str(a) for a in args)
    with open('/home/hazem/mario_gta6/game_debug.log', 'a') as f:
        f.write(msg + '\n')
    _orig_print(*args, **kwargs)
builtins.print = _log_print

# Monkeypatch camera to log its state
import ursina.camera
_orig_look_at = ursina.camera.look_at
def _logged_look_at(target):
    result = _orig_look_at(target)
    with open('/home/hazem/mario_gta6/game_debug.log', 'a') as f:
        f.write(f"camera.look_at({target}) -> pos={camera.position}\n")
    return result
ursina.camera.look_at = _logged_look_at

# Now exec the game code
with open('/home/hazem/mario_gta6/game.py', 'r') as f:
    code = f.read()

# Remove the duplicate app.run() call since we already created app
# game.py also creates app via Ursina() — we need to skip that
# Actually, exec will create a second app which will fail
# Let's just patch the Ursina class to not create a second window
_app_created = True

_orig_ursina_init = Ursina.__init__
def _patched_ursina_init(self, *args, **kwargs):
    global _app_created
    if _app_created:
        self.title = 'Super Mario GTA6'
        return
    _orig_ursina_init(self, *args, **kwargs)
    _app_created = True

Ursina.__init__ = _patched_ursina_init

# Execute
exec(compile(code, 'game.py', 'exec'))
