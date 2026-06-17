"""Launch game with safety wrapper + logging"""
import os, sys, traceback

os.environ['SDL_AUDIODRIVER'] = 'disk'

def log(msg):
    with open('/home/hazem/mario_gta6/game_launch.log', 'a') as f:
        f.write(msg + '\n')

log("========== GAME LAUNCH START ==========")

try:
    import ursina
    from ursina import *
    log("Ursina imported OK")

    # Read and execute the game script with error catching
    with open('/home/hazem/mario_gta6/game.py', 'r') as f:
        game_code = f.read()
    log(f"Game code loaded: {len(game_code)} bytes")

    # Execute
    exec(compile(game_code, 'game.py', 'exec'))
    log("Game exited normally")

except Exception as e:
    log(f"CRASH: {e}")
    traceback.print_exc(file=__import__('sys').stderr)
    with open('/home/hazem/mario_gta6/game_crash.log', 'w') as f:
        traceback.print_exc(file=f)
