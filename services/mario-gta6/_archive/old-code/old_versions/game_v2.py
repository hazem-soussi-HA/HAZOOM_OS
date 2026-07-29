"""Super Mario GTA6 - SIMPLIFIED VERSION for WSLg/llvmpipe"""
import os
os.environ['SDL_AUDIODRIVER'] = 'disk'

from ursina import *
import math, random

app = Ursina(title='Super Mario GTA6', borderless=False, fullscreen=False, development=False)
window.color = color.rgb(40, 50, 70)

# ══════════════════════════════════════
# SIMPLIFIED CONSTANTS
# ══════════════════════════════════════
WORLD_SIZE   = 400
BLOCK_SIZE   = 50
ROAD_WIDTH   = 16
PLAYER_SPEED = 8
PLAYER_JUMP  = 10
CAR_MAX_SPEED = 50
GRAVITY      = 30

# Colors
C_ROAD  = color.rgb(50, 50, 55)
C_GRASS = color.rgb(55, 130, 55)
C_LINE  = color.rgb(220, 200, 60)
BCOLS   = [color.rgb(140,130,120), color.rgb(160,145,130), color.rgb(120,125,135),
           color.rgb(155,140,125), color.rgb(100,110,120)]

# ══════════════════════════════════════
# LIGHTING - Critical for WSLg
# ══════════════════════════════════════
sun = DirectionalLight(shadows=False)
sun.look_at(Vec3(1, -2, -1))
ambient = AmbientLight(color=color.rgb(180, 180, 170))

# Ground
ground = Entity(
    model='plane', color=C_GRASS,
    scale=(WORLD_SIZE*2, 1, WORLD_SIZE*2),
    position=(0, -0.1, 0),
)

# ══════════════════════════════════════
# CITY - Fewer entities, grid-based
# ══════════════════════════════════════
random.seed(42)
buildings = []

# Simple roads
for i in range(6):
    x = -150 + i * 60
    Entity(model='cube', color=C_ROAD, scale=(ROAD_WIDTH, 0.1, WORLD_SIZE), position=(x, 0.02, 0))
for j in range(6):
    z = -150 + j * 60
    Entity(model='cube', color=C_ROAD, scale=(WORLD_SIZE, 0.1, ROAD_WIDTH), position=(0, 0.02, z))

# Yellow center lines
for i in range(6):
    x = -150 + i * 60
    for dz in range(-180, 180, 15):
        Entity(model='cube', color=C_LINE, scale=(0.4, 0.12, 5), position=(x, 0.04, dz))
for j in range(6):
    z = -150 + j * 60
    for dx in range(-180, 180, 15):
        Entity(model='cube', color=C_LINE, scale=(5, 0.12, 0.4), position=(dx, 0.04, z))

# Buildings - simpler, fewer
for ix in range(5):
    for jz in range(5):
        bx = -120 + ix * 60
        bz = -120 + jz * 60
        # Skip if on a road
        bh = random.uniform(10, 40)
        bw = random.uniform(12, 22)
        bcol = random.choice(BCOLS)
        Entity(model='cube', color=bcol, scale=(bw, bh, bw),
               position=(bx - 15, bh/2, bz - 15))
        Entity(model='cube', color=bcol, scale=(bw, bh, bw),
               position=(bx + 15, bh/2, bz + 15))

spawn_points = []
for i in range(10):
    spawn_points.append(Vec3(
        random.choice([-90, -30, 30, 90]),
        0.5,
        random.uniform(-120, 120)
    ))

print("City generated", flush=True)

# ══════════════════════════════════════
# PLAYER (Mario-style)
# ══════════════════════════════════════
class Player(Entity):
    def __init__(self):
        super().__init__()
        self.on_foot = True
        self.current_car = None
        self.jumping = False
        self.vy = 0
        self.group = Entity()
        # Body
        Entity(parent=self.group, model='cube', color=color.rgb(220,40,30),
               scale=(0.8, 0.9, 0.5), position=(0, 0, 0))
        # Head
        Entity(parent=self.group, model='sphere', color=color.rgb(240,200,160),
               scale=(0.7, 0.7, 0.7), position=(0, 0.65, 0))
        # Cap
        Entity(parent=self.group, model='cube', color=color.rgb(220,30,30),
               scale=(0.75, 0.35, 0.75), position=(0, 0.95, 0))
        # Eyes
        Entity(parent=self.group, model='cube', color=color.rgb(20,20,20),
               scale=(0.12, 0.15, 0.1), position=(-0.15, 0.7, 0.32))
        Entity(parent=self.group, model='cube', color=color.rgb(20,20,20),
               scale=(0.12, 0.15, 0.1), position=(0.15, 0.7, 0.32))
        # Mustache
        Entity(parent=self.group, model='cube', color=color.rgb(60,40,20),
               scale=(0.4, 0.1, 0.15), position=(0, 0.55, 0.32))
        # Legs
        Entity(parent=self.group, model='cube', color=color.rgb(30,50,180),
               scale=(0.3, 0.5, 0.35), position=(-0.2, -0.7, 0))
        Entity(parent=self.group, model='cube', color=color.rgb(30,50,180),
               scale=(0.3, 0.5, 0.35), position=(0.2, -0.7, 0))
        # Shoes
        Entity(parent=self.group, model='cube', color=color.rgb(80,50,20),
               scale=(0.32, 0.18, 0.4), position=(-0.2, -0.95, 0.05))
        Entity(parent=self.group, model='cube', color=color.rgb(80,50,20),
               scale=(0.32, 0.18, 0.4), position=(0.2, -0.95, 0.05))

        sp = spawn_points[0]
        self.group.position = Vec3(sp.x, 0, sp.z)

    def update(self):
        if not self.on_foot:
            return
        dt = time.dt
        move = Vec3(0, 0, 0)
        cam_fwd = camera.forward
        cam_fwd.y = 0
        cam_fwd = cam_fwd.normalized() if cam_fwd.length() > 0.01 else Vec3(0, 0, 1)
        cam_right = camera.right
        cam_right.y = 0
        cam_right = cam_right.normalized() if cam_right.length() > 0.01 else Vec3(1, 0, 0)

        if held_keys['w']: move += cam_fwd
        if held_keys['s']: move -= cam_fwd
        if held_keys['a']: move -= cam_right
        if held_keys['d']: move += cam_right

        if move.length() > 0:
            move = move.normalized()
            spd = PLAYER_SPRINT if held_keys['left shift'] else PLAYER_SPEED
            self.group.position += move * spd * dt
            self.group.rotation_y = math.degrees(math.atan2(move.x, move.z))

        if held_keys['space'] and not self.jumping:
            self.vy = PLAYER_JUMP
            self.jumping = True
        self.vy -= GRAVITY * dt
        self.group.y += self.vy * dt
        if self.group.y <= 0:
            self.group.y = 0
            self.vy = 0
            self.jumping = False

PLAYER_SPRINT = 16

player = Player()
print("Player created", flush=True)

# ══════════════════════════════════════
# TRAFFIC CARS (fewer)
# ══════════════════════════════════════
traffic_cars = []
CAR_COLORS = [color.rgb(200,40,40), color.rgb(40,80,200), color.rgb(240,200,40),
              color.rgb(60,60,60), color.rgb(40,160,80)]

class Vehicle(Entity):
    def __init__(self, pos, rot_y=0):
        super().__init__()
        self.player_driving = False
        self.speed = 0
        self.throttle_in = 0
        self.steer_in = 0
        self.max_speed = CAR_MAX_SPEED
        self.group = Entity(position=pos)
        self.group.rotation_y = rot_y
        c = random.choice(CAR_COLORS)
        # Chassis
        Entity(parent=self.group, model='cube', color=c,
               scale=(2.2, 0.8, 4.5), position=(0, 0.6, 0))
        # Cabin
        Entity(parent=self.group, model='cube', color=color.rgb(60,60,70),
               scale=(2.0, 0.7, 2.2), position=(0, 1.3, -0.3))
        # Headlights
        Entity(parent=self.group, model='sphere', color=color.rgb(255,255,220),
               scale=(0.4, 0.3, 0.2), position=(-0.7, 0.5, 2.28))
        Entity(parent=self.group, model='sphere', color=color.rgb(255,255,220),
               scale=(0.4, 0.3, 0.2), position=(0.7, 0.5, 2.28))
        # Wheels
        for wx in [-1.1, 1.1]:
            for wz in [1.4, -1.4]:
                Entity(parent=self.group, model='cube', color=color.rgb(30,30,30),
                       scale=(0.35, 0.6, 0.6), position=(wx, 0.3, wz))

    def ai_drive(self):
        self.throttle_in = 0.6
        if random.random() < 0.02:
            self.steer_in = random.uniform(-0.4, 0.4)
        else:
            self.steer_in *= 0.95

    def physics(self):
        dt = time.dt
        self.speed += self.throttle_in * 30 * dt
        drag = 3 + 0.05 * abs(self.speed)
        if self.speed > 0:
            self.speed = max(0, self.speed - drag * dt)
        self.speed = max(-10, min(self.speed, self.max_speed))
        self.group.position += self.group.forward * self.speed * dt
        self.group.rotation_y += self.steer_in * 2.0 * self.speed * dt * 60 * dt
        half = WORLD_SIZE / 2 - 5
        self.group.x = max(-half, min(half, self.group.x))
        self.group.z = max(-half, min(half, self.group.z))
        self.group.y = 0

for i in range(8):
    sp = random.choice(spawn_points)
    rot = random.choice([0, 90, 180, 270])
    traffic_cars.append(Vehicle(Vec3(sp.x, 0, sp.z), rot_y=rot))

print(f"Spawned {len(traffic_cars)} cars", flush=True)

# ══════════════════════════════════════
# CAMERA
# ══════════════════════════════════════
class GameCamera:
    def __init__(self):
        self.mode = 'close'
        camera.fov = 70
        self._last_fwd = Vec3(0, 0, 1)

    def update(self):
        target = player.group
        if not player.on_foot and player.current_car:
            target = player.current_car.group

        dist = 12 if player.on_foot else 18
        height = 5 if player.on_foot else 8

        fwd = target.forward
        fwd.y = 0
        if fwd.length() < 0.01:
            fwd = self._last_fwd
        else:
            fwd = fwd.normalized()
            self._last_fwd = fwd

        desired = target.world_position - fwd * dist + Vec3(0, height, 0)
        camera.world_position = lerp(camera.world_position, desired, min(8 * time.dt, 1.0))
        camera.look_at(target.world_position + Vec3(0, 2, 0))

        spd = abs(player.current_car.speed) if (not player.on_foot and player.current_car) else 0
        target_fov = lerp(70, 95, min(spd / CAR_MAX_SPEED, 1))
        camera.fov = lerp(camera.fov, target_fov, 3 * time.dt)

game_camera = GameCamera()

# ══════════════════════════════════════
# COINS (fewer)
# ══════════════════════════════════════
coins = []
for i in range(20):
    coin = Entity(
        model='cube', color=color.rgb(255, 215, 0),
        scale=(0.5, 0.5, 0.15),
        position=Vec3(
            random.uniform(-150, 150), 1.5,
            random.uniform(-150, 150)
        )
    )
    coins.append(coin)

coin_score = 0
btn_cooldown = 0

# ══════════════════════════════════════
# HUD
# ══════════════════════════════════════
speed_text = Text(text='WALKING', position=(-0.85, -0.42), origin=(-0.5, 0),
                  scale=2, color=color.white)
car_prompt = Text(text='', position=(0, -0.35), origin=(0, 0), scale=1.8,
                  color=color.rgb(255, 255, 100))

# ══════════════════════════════════════
# UPDATE
# ══════════════════════════════════════
frame_count = [0]

def global_update():
    global btn_cooldown, coin_score
    dt = time.dt
    btn_cooldown = max(0, btn_cooldown - dt)

    player.update()
    game_camera.update()

    for car in traffic_cars:
        if not car.player_driving:
            car.ai_drive()
        car.physics()

    if held_keys['f'] and btn_cooldown <= 0:
        if player.on_foot:
            # Try enter
            nearest = None
            nd = 5
            for car in traffic_cars:
                d = distance_2d(player.group.position, car.group.position)
                if d < nd:
                    nd = d
                    nearest = car
            if nearest:
                player.current_car = nearest
                nearest.player_driving = True
                player.on_foot = False
                player.group.y = -5
        else:
            player.current_car.player_driving = False
            player.on_foot = True
            player.current_car = None
            player.group.y = 0
        btn_cooldown = 0.4

    # Coins
    for coin in coins[:]:
        if distance_2d(player.group.position, coin.position) < 1.5:
            coins.remove(coin)
            destroy(coin)
            coin_score += 1

    # HUD
    if not player.on_foot and player.current_car:
        kmh = int(abs(player.current_car.speed) * 3.6)
        speed_text.text = f'{kmh} KM/H'
    else:
        speed_text.text = 'WALKING'
        near = None
        nd = 5
        for car in traffic_cars:
            d = distance_2d(player.group.position, car.group.position)
            if d < nd:
                nd = d; near = car
        car_prompt.text = 'PRESS F TO ENTER' if near else ''

    frame_count[0] += 1
    if frame_count[0] % 300 == 0:
        print(f"Frame {frame_count[0]}: player=({player.group.x:.0f},{player.group.z:.0f}) coins={coin_score}", flush=True)

def distance_2d(a, b):
    dx = a.x - b.x
    dz = getattr(a, 'z', 0) - getattr(b, 'z', 0)
    return math.sqrt(dx*dx + dz*dz)

app.update = global_update

print("══════════════════════════════════", flush=True)
print("  SUPER MARIO GTA6 - SIMPLIFIED", flush=True)
print("  (WSLg/llvmpipe compatible)", flush=True)
print("══════════════════════════════════", flush=True)
print("  WASD = Move | SHIFT = Sprint", flush=True)
print("  F = Enter/Exit Car | SPACE = Jump", flush=True)
print("  C = Camera | ESC = Quit", flush=True)
print("══════════════════════════════════", flush=True)

app.run()
print("GAME EXITED", flush=True)
