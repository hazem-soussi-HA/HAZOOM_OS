"""Monitor windows while Ursina runs"""
import subprocess, time, os

os.environ['SDL_AUDIODRIVER'] = 'disk'

# Start the game in background
game_proc = subprocess.Popen(
    ['python3', '/home/hazem/mario_gta6/game_v2.py'],
    stdout=open('/home/hazem/mario_gta6/game_v2_monitor.log', 'w'),
    stderr=subprocess.STDOUT,
)

print(f"Game PID: {game_proc.pid}")

# Wait for window to appear
for i in range(20):
    time.sleep(1)
    # Check xwininfo
    result = subprocess.run(['xwininfo', '-root', '-tree'], capture_output=True, text=True, timeout=5)
    if 'Ursina' in result.stdout or 'Mario' in result.stdout or 'GTA' in result.stdout:
        print(f"Found Ursina window at check {i+1}!")
        print(result.stdout)
        break
    # Count children
    lines = result.stdout.strip().split('\n')
    child_count = sum(1 for l in lines if l.strip().startswith('0x'))
    print(f"Check {i+1}: {child_count} child windows")
    if child_count > 3:
        print("NEW WINDOWS DETECTED:")
        for l in lines:
            if l.strip().startswith('0x'):
                print(f"  {l.strip()}")
else:
    print("No Ursina window found after 20 seconds")
    # Final check
    result = subprocess.run(['xwininfo', '-root', '-tree'], capture_output=True, text=True, timeout=5)
    print("Final window tree:")
    print(result.stdout)

game_proc.terminate()
print("Game terminated")
