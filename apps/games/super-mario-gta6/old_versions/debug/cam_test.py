"""Camera diagnostic test"""
import os, math, sys
os.environ['SDL_AUDIODRIVER'] = 'disk'
from ursina import *
from ursina.shaders import basic_lighting_shader
Entity.default_shader = basic_lighting_shader

app = Ursina(title='CamDiag', borderless=False, fullscreen=False, development=False)
window.color = color.rgb(130, 165, 210)

pivot = Entity()
sun = DirectionalLight(parent=pivot, y=10, z=5, shadows=False)
sun.look_at(Vec3(1,-1,-1))
from ursina import AmbientLight as _AL
_AL(color=color.rgb(90,92,100))
Sky(texture=None, color=color.rgb(130,165,210))
scene.fog_density = 0.006
scene.fog_color = color.rgb(130,165,210)

# Simple player
group = Entity(position=(0, 0.5, 0))
Entity(parent=group, model='cube', color=color.rgb(220,40,30), scale=(0.8,1.8,0.5))
Entity(parent=group, model='sphere', color=color.rgb(240,200,160), scale=(0.7,0.7,0.7), position=(0,0.65,0))
Entity(parent=group, model='cube', color=color.rgb(220,30,30), scale=(0.75,0.35,0.75), position=(0,0.95,0))

_last_fwd = Vec3(0,0,1)
camera.fov = 70
camera.world_position = group.position + Vec3(0,5,-12)
camera.look_at(group.position)

frame = [0]
def upd():
    global _last_fwd
    dt = time.dt
    frame[0] += 1
    group.position += Vec3(0, 0, 1) * dt * 5
    group.rotation_y = 0

    target = group
    fwd = target.forward
    fwd.y = 0
    if fwd.length() < 0.01:
        fwd = _last_fwd
    else:
        fwd = fwd.normalized()
        _last_fwd = fwd
    desired = target.world_position - fwd * 12 + Vec3(0, 5, 0)
    camera.world_position = lerp(camera.world_position, desired, min(8*dt, 1.0))
    camera.look_at(target.world_position + Vec3(0,2,0))

    if frame[0] % 30 == 0:
        sys.stderr.write(f'F{frame[0]}: ply={group.position:.2f} cam={camera.world_position:.2f} fwd={fwd:.2f}\n')
        sys.stderr.flush()

app.update = upd
sys.stderr.write('Starting camera diagnostic...\n')
sys.stderr.flush()
app.run()
sys.stderr.write('DONE\n')
sys.stderr.flush()
