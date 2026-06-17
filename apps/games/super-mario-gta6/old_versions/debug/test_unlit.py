"""Ursina WSLg llvmpipe fix test"""
import os
os.environ['SDL_AUDIODRIVER'] = 'disk'
os.environ['GLX_ALPHA_SIZE'] = '8'

# Force Mesa to use core profile / disable problematic features
os.environ['MESA_GL_VERSION_OVERRIDE'] = '4.5'
os.environ['MESA_GLSL_VERSION_OVERRIDE'] = '450'

from ursina import *
from ursina.shaders import unlit_shader

app = Ursina(title='Ursina Fix Test', borderless=False, fullscreen=False, development=False)
window.color = color.rgb(10, 15, 30)

# Use unlit_shader explicitly on everything
e = Entity(
    model='cube',
    color=color.rgb(200, 50, 50),
    scale=(4, 4, 4),
    position=(0, 2, 0),
    shader=unlit_shader,
)
print(f"Entity shader: {e.shader}")

sky = Entity(
    model='sphere',
    scale=500,
    color=color.rgb(100, 140, 200),
    double_sided=True,
    shader=unlit_shader,
)

ground = Entity(
    model='plane',
    color=color.rgb(50, 50, 55),
    scale=(400, 1, 400),
    position=(0, 0, 0),
    shader=unlit_shader,
)

camera.position = (0, 15, -30)
camera.look_at(Vec3(0, 0, 0))

Text(text='IF YOU SEE A RED CUBE, UNLIT WORKS', position=(-0.5, 0.1), scale=2, color=color.yellow)

frame = [0]
def upd():
    frame[0] += 1
    e.rotation_y += 0.5
    if frame[0] % 60 == 0:
        print(f"Frame {frame[0]}: OK")

app.update = upd
print("Starting app.run()...")
app.run()
print("DONE")
