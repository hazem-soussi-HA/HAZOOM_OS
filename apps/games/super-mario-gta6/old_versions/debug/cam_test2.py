"""Camera diagnostic - minimal"""
import os, sys
os.environ['SDL_AUDIODRIVER'] = 'disk'
from ursina import *
from ursina.shaders import basic_lighting_shader
Entity.default_shader = basic_lighting_shader

app = Ursina(title='CamDiag', borderless=False, fullscreen=False, development=False)
window.color = color.rgb(130, 165, 210)

group = Entity(position=(0, 0.5, 0))
Entity(parent=group, model='cube', color=color.rgb(220,40,30), scale=(0.8,1.8,0.5))

_last_fwd = Vec3(0,0,1)
camera.fov = 70
camera.world_position = group.position + Vec3(0,5,-12)

frame = [0]

def update():
    global _last_fwd
    dt = time.dt
    frame[0] += 1
    group.position += Vec3(0, 0, 1) * dt * 5
    group.rotation_y = 0
    fwd = group.forward
    fwd.y = 0
    if fwd.length() < 0.01:
        fwd = _last_fwd
    else:
        fwd = fwd.normalized()
        _last_fwd = fwd
    desired = group.world_position - fwd * 12 + Vec3(0, 5, 0)
    camera.world_position = lerp(camera.world_position, desired, min(8*dt, 1.0))
    camera.look_at(group.world_position + Vec3(0,2,0))
    if frame[0] % 60 == 0:
        p = group.position
        c = camera.world_position
        print(f'F{frame[0]}: ply=({p.x:.1f},{p.y:.1f},{p.z:.1f}) cam=({c.x:.1f},{c.y:.1f},{c.z:.1f})', flush=True)

print('Starting...', flush=True)
app.run()
print('DONE', flush=True)
