"""Minimal Ursina render test on WSLg"""
import sys, traceback

def log(msg):
    with open('/home/hazem/mario_gta6/render_test.log', 'a') as f:
        f.write(msg + '\n')
    print(msg)

log("=== Starting render test ===")

from ursina import *

log("Import done")

app = Ursina(
    title='RenderTest',
    borderless=False,
    fullscreen=False,
    development=False,
)
log("App created")

window.color = color.rgb(40, 50, 70)
log("Window color set")

# Add some basic objects
ground = Entity(
    model='plane',
    color=color.rgb(55, 130, 55),
    scale=(100, 1, 100),
    position=(0, 0, 0),
)
log("Ground created")

box = Entity(
    model='cube',
    color=color.rgb(220, 40, 30),
    scale=(2, 2, 2),
    position=(0, 2, 0),
)
log("Box created")

sphere = Entity(
    model='sphere',
    color=color.rgb(30, 50, 220),
    scale=2,
    position=(5, 2, 0),
)
log("Sphere created")

camera.position = (0, 20, -30)
camera.look_at(Vec3(0, 0, 0))
log(f"Camera: pos={camera.position} fwd={camera.forward}")

sun = DirectionalLight(shadows=False)
sun.look_at(Vec3(1, -2, -1))
log("Sun created")

# HUD text
from ursina import Text
txt = Text(text='URSINA RENDER TEST - DO YOU SEE THIS?', position=(-0.5, 0.0), scale=2, color=color.yellow)
log("Text created")

frame = [0]
def test_update():
    frame[0] += 1
    box.rotation_y += 1
    if frame[0] % 60 == 0:
        log(f"Frame {frame[0]}: camera={camera.position} box={box.position}")
    if frame[0] >= 600:
        log("TEST COMPLETE - 600 frames rendered")
        application.quit()

app.update = test_update
log("Starting app.run()...")
app.run()
log("app.run() exited")
