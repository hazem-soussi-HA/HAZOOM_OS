"""Ursina WSLg rendering diagnostic - CLEAN"""
import os
os.environ['SDL_AUDIODRIVER'] = 'disk'

from ursina import *

app = Ursina(title='Ursina Test', borderless=False, fullscreen=False, development=False)
print("App created", flush=True)

window.color = color.rgb(40, 50, 70)
print("Window color set", flush=True)

ground = Entity(model='plane', color=color.rgb(55, 130, 55), scale=(100, 1, 100), position=(0, 0, 0))
box = Entity(model='cube', color=color.rgb(220, 40, 30), scale=(3, 3, 3), position=(0, 2, 0))
sphere = Entity(model='sphere', color=color.rgb(40, 80, 220), scale=2, position=(8, 2, 0))

print(f"box.shader = {box.shader}", flush=True)
print(f"ground.shader = {ground.shader}", flush=True)
print(f"sphere.shader = {sphere.shader}", flush=True)

sun = DirectionalLight(shadows=False)
sun.look_at(Vec3(1, -2, -1))
ambient = AmbientLight(color=color.rgb(160, 160, 160))

camera.position = (0, 20, -35)
camera.look_at(Vec3(0, 1, 0))

print(f"Camera: pos={camera.position} fwd={camera.forward}", flush=True)

t = Text(text='URSINA 8.3 ON WSLg - RED CUBE BLUE SPHERE GREEN GROUND', position=(-0.5, 0.2), scale=1.5, color=color.rgb(255, 255, 100))
print("Text created", flush=True)

frame_count = [0]

def my_update():
    frame_count[0] += 1
    box.rotation_y += 0.5
    if frame_count[0] % 120 == 0:
        print(f"Frame {frame_count[0]} rendered", flush=True)
    if frame_count[0] >= 1200:
        print("1200 frames rendered - SUCCESS", flush=True)
        application.quit()

app.update = my_update

print("=== STARTING app.run() ===", flush=True)
app.run()
print("=== app.run() EXITED ===", flush=True)
