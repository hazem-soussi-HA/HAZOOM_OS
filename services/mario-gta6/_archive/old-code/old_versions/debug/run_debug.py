"""Run game with full error catching"""
import sys, traceback

# Monkey-patch to catch all exceptions
_orig_excepthook = sys.excepthook
def _catch_all(exc_type, exc_val, exc_tb):
    with open('/home/hazem/mario_gta6/crash.log', 'a') as f:
        f.write(''.join(traceback.format_exception(exc_type, exc_val, exc_tb)))
    _orig_excepthook(exc_type, exc_val, exc_tb)
sys.excepthook = _catch_all

# Now import and run the game
try:
    # Need to re-exec the game in this process
    exec(open('/home/hazem/mario_gta6/game.py').read())
except Exception as e:
    with open('/home/hazem/mario_gta6/crash.log', 'w') as f:
        traceback.print_exc(file=f)
    print(f"CRASH: {e}", file=sys.stderr)
