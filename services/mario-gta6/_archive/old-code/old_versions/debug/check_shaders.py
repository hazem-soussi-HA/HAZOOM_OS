"""Ursina WSLg rendering diagnostic"""
import os
os.environ['SDL_AUDIODRIVER'] = 'disk'

from ursina import *
import ursina as _ursina

app = Ursina(title='ShaderCheck', borderless=False, fullscreen=False, development=False)
pkg = _ursina.package_folder
print(f"Package: {pkg}")

shader_dir = os.path.join(pkg, 'shaders')
if os.path.isdir(shader_dir):
    print(f"Shaders dir: {shader_dir}")
    for f in sorted(os.listdir(shader_dir)):
        print(f"  {f}")

# Create test entity and inspect shader
e = Entity(model='cube', color=color.red)
print(f"Default shader: {e.shader}")
print(f"Shader type: {type(e.shader)}")

window.color = color.rgb(40, 50, 70)

ground = Entity(model='plane', color=color.rgb(55, 130, 55), scale=(100, 1, 100), position=(0, 0, 0))
box = Entity(model='cube', color=color.rgb(220, 40, 30), scale=(2, 2, 2), position=(0, 2, 0))

camera.position = (0, 15, -30)
camera.look_at(Vec3(0, 0, 0))

Text(text='RED CUBE ON GREEN GROUND?', position=(-0.5, 0.1), scale=2, color=color.yellow)

# log scene graph
print(f"\nScene graph:")
for child in render.children:
    s = child.shader
    print(f"  {child.name}: shader={s} type={type(s)}")

def close_test():
    print("TEST CLOSING")
    application.quit()
invoke(close_test, delay=10)

print(f"\nStarting render loop...")
app.run()
print("TEST COMPLETE")
