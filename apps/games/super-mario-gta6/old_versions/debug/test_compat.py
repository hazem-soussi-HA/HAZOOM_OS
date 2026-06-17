"""Quick Ursina 8.x compatibility diagnostic"""
from ursina import *
import traceback

print("=== Ursina 8.x Compat Check ===")

# Test 1: color.darken
try:
    c = color.darken(color.red, 0.2)
    print("color.darken: OK")
except AttributeError:
    print("color.darken: MISSING in Ursina 8.x")

# Test 2: Color constructor
try:
    c = Color(1, 0, 0, 1)
    print("Color(r,g,b,a): OK")
except Exception as e:
    print(f"Color(r,g,b,a): FAIL - {e}")

# Test 3: lerp availability
try:
    from ursina import lerp
    print("lerp: OK")
except ImportError:
    print("lerp: NOT FOUND in ursina top-level")

# Test 4: lerp_angle
try:
    from ursina import lerp_angle
    print("lerp_angle: OK")
except ImportError:
    print("lerp_angle: NOT FOUND")

# Test 5: camera.look_at behavior
print("\n=== Init Ursina ===")
app = Ursina(title='CompatTest', borderless=False, fullscreen=False, development=False)

window.color = color.rgb(40, 50, 70)

try:
    e = Entity(model='cube', color=color.red, position=(0, 0.5, 0), scale=(1, 1, 1))
    print("Entity(cube): OK")
except Exception as ex:
    print(f"Entity(cube): FAIL - {ex}")

try:
    camera.position = (0, 15, -25)
    camera.look_at(Vec3(0, 0, 0))
    print(f"camera.look_at: OK  pos={camera.position}")
except Exception as ex:
    print(f"camera.look_at: FAIL - {ex}")

try:
    s = Sky(texture=None, color=color.rgb(100, 140, 200))
    print("Sky: OK")
except Exception as ex:
    print(f"Sky: FAIL - {ex}")

try:
    sun = DirectionalLight(shadows=False)
    print("DirectionalLight: OK")
except Exception as ex:
    print(f"DirectionalLight: FAIL - {ex}")

print("\nAll basic checks done. Starting 5-second render test...")

# Run a few frames to see if rendering works
frame_count = 0
def test_update():
    global frame_count
    frame_count += 1
    if frame_count >= 300:  # ~5 seconds at 60fps
        print(f"Rendered {frame_count} frames successfully!")
        application.quit()

app.update = test_update
app.run()
print("TEST COMPLETE")
