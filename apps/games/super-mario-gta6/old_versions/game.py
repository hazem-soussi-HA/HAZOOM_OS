"""
SUPER MARIO GTA6 - Ursina Game Engine
A mashup open-world game: Mario character in a GTA-style city.
Controls:
  WASD        - Move / Drive
  SHIFT       - Sprint (on foot) / Nitro (in car)
  F           - Enter / Exit vehicle
  SPACE       - Jump (on foot) / Handbrake (in car)
  C           - Toggle camera (third-person / far)
  M           - Toggle minimap
  T           - Honk horn (in car)
  ESC         - Quit
"""

from ursina import *
import math
import random

# ═══════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════
WORLD_SIZE       = 600
BLOCK_SIZE       = 40        # City block size
ROAD_WIDTH       = 14
SIDEWALK_WIDTH   = 3
BUILDING_MIN_H   = 8
BUILDING_MAX_H   = 45
NUM_BLOCKS_X     = 8
NUM_BLOCKS_Z     = 8
PLAYER_SPEED     = 8
PLAYER_SPRINT    = 16
PLAYER_JUMP      = 10
CAR_MAX_SPEED    = 60
CAR_ACCEL        = 35
CAR_BRAKE        = 50
CAR_STEER        = 2.2
NITRO_BOOST      = 1.6
GRAVITY          = 30

# Colors palette
C_ROAD    = color.rgb(50, 50, 55)
C_SIDE    = color.rgb(120, 115, 105)
C_GRASS   = color.rgb(55, 130, 55)
C_LINE    = color.rgb(220, 200, 60)
C_LAMP    = color.rgb(80, 80, 90)
C_LAMP_L  = color.rgb(255, 240, 160)
C_DLGHT   = color.rgb(200, 170, 80)

# ═══════════════════════════════════════════
# APP INIT
# ═══════════════════════════════════════════
app = Ursina(
    title='Super Mario GTA6',
    borderless=False,
    fullscreen=False,
    vsync=True,
)
window.color = color.rgb(40, 50, 70)
window.fps_counter.enabled = True

# ═══════════════════════════════════════════
# SKY & LIGHTING
# ═══════════════════════════════════════════
# Enable shadows for better depth perception
sun = DirectionalLight(shadows=True)
sun.look_at(Vec3(1, -2, -1))
ambient = AmbientLight(color=color.rgb(180, 180, 180))

# Time of day system variables
time_of_day = 0.0          # 0.0 = midnight, 0.5 = noon
time_speed = 0.01          # Speed at which time passes per frame

Sky(texture=None, color=color.rgb(100, 140, 200))

# Ambient-ish floor
terrain = Entity(
    model='plane', scale=(WORLD_SIZE * 2, 1, WORLD_SIZE * 2),
    color=C_GRASS, collider=None,
    position=(0, -0.1, 0),
)

# ═══════════════════════════════════════════
# BUILDING PALETTE
# ═══════════════════════════════════════════
BUILDING_COLORS = [
    color.rgb(140, 130, 120),
    color.rgb(160, 145, 130),
    color.rgb(120, 125, 135),
    color.rgb(155, 140, 125),
    color.rgb(130, 120, 110),
    color.rgb(150, 135, 115),
    color.rgb(110, 115, 125),
    color.rgb(170, 155, 140),
    color.rgb(100, 110, 120),
    color.rgb(180, 165, 150),
    color.rgb(135, 120, 105),
    color.rgb(160, 150, 140),
]

WINDOW_COLORS = [
    color.rgb(180, 200, 230, 200),
    color.rgb(200, 220, 250, 200),
    color.rgb(160, 180, 210, 200),
    color.rgb(255, 240, 180, 200),  # lit window
    color.rgb(255, 230, 150, 200),  # lit window
]

# ═══════════════════════════════════════════
# CITY GENERATION
# ═══════════════════════════════════════════
buildings = []
roads = []
traffic_cars = []
spawn_points = []

def generate_city():
    random.seed(42)  # Deterministic

    half_world = WORLD_SIZE / 2

    # Road grid lines for visual
    road_x_positions = []
    road_z_positions = []

    bx = -(NUM_BLOCKS_X // 2) * BLOCK_SIZE
    bz = -(NUM_BLOCKS_Z // 2) * BLOCK_SIZE

    # Generate roads (horizontal and vertical stripes)
    road_visuals = []
    for i in range(NUM_BLOCKS_X + 1):
        rx = bx + i * BLOCK_SIZE - BLOCK_SIZE / 2
        # Vertical road
        rv = Entity(
            model='cube', color=C_ROAD,
            scale=(ROAD_WIDTH, 0.05, WORLD_SIZE),
            position=(rx, 0.02, 0),
        )
        road_visuals.append(rv)
        road_x_positions.append(rx)

    for j in range(NUM_BLOCKS_Z + 1):
        rz = bz + j * BLOCK_SIZE - BLOCK_SIZE / 2
        # Horizontal road
        rh = Entity(
            model='cube', color=C_ROAD,
            scale=(WORLD_SIZE, 0.05, ROAD_WIDTH),
            position=(0, 0.02, rz),
        )
        road_visuals.append(rh)
        road_z_positions.append(rz)

    # Road center lines (yellow dashes)
    for i in range(NUM_BLOCKS_X + 1):
        rx = bx + i * BLOCK_SIZE - BLOCK_SIZE / 2
        for dz in range(int(-WORLD_SIZE/2), int(WORLD_SIZE/2), 12):
            Entity(
                model='cube', color=C_LINE,
                scale=(0.3, 0.06, 4),
                position=(rx, 0.04, dz),
            )
    for j in range(NUM_BLOCKS_Z + 1):
        rz = bz + j * BLOCK_SIZE - BLOCK_SIZE / 2
        for dx in range(int(-WORLD_SIZE/2), int(WORLD_SIZE/2), 12):
            Entity(
                model='cube', color=C_LINE,
                scale=(4, 0.06, 0.3),
                position=(dx, 0.04, rz),
            )

    # Sidewalks and buildings in each block
    for ix in range(NUM_BLOCKS_X):
        for jz in range(NUM_BLOCKS_Z):
            block_cx = bx + ix * BLOCK_SIZE + BLOCK_SIZE / 2
            block_cz = bz + jz * BLOCK_SIZE + BLOCK_SIZE / 2

            sw = SIDEWALK_WIDTH
            rw = ROAD_WIDTH
            # Sidewalks along edges
            # Top sidewalk
            Entity(model='cube', color=C_SIDE,
                   scale=(BLOCK_SIZE - rw + 2*sw, 0.15, sw),
                   position=(block_cx, 0.08, block_cz + BLOCK_SIZE/2 - rw/2 - sw/2))
            # Bottom sidewalk
            Entity(model='cube', color=C_SIDE,
                   scale=(BLOCK_SIZE - rw + 2*sw, 0.15, sw),
                   position=(block_cx, 0.08, block_cz - BLOCK_SIZE/2 + rw/2 + sw/2))
            # Left sidewalk
            Entity(model='cube', color=C_SIDE,
                   scale=(sw, 0.15, BLOCK_SIZE - rw),
                   position=(block_cx - BLOCK_SIZE/2 + rw/2 + sw/2, 0.08, block_cz))
            # Right sidewalk
            Entity(model='cube', color=C_SIDE,
                   scale=(sw, 0.15, BLOCK_SIZE - rw),
                   position=(block_cx + BLOCK_SIZE/2 - rw/2 - sw/2, 0.08, block_cz))

            # Building footprint area (inside sidewalks)
            inner_w = BLOCK_SIZE - rw - 2*sw
            if inner_w < 8:
                continue

            # Place 1-4 buildings per block
            nb = random.choice([1, 2, 4])
            if nb == 1:
                bx_positions = [(0, 0)]
                bw = inner_w * 0.85
            elif nb == 2:
                bx_positions = [(-inner_w*0.25, 0), (inner_w*0.25, 0)]
                bw = inner_w * 0.42
            else:
                s = inner_w / 2
                bx_positions = [(-s*0.45, -s*0.45), (s*0.45, -s*0.45),
                                (-s*0.45, s*0.45), (s*0.45, s*0.45)]
                bw = inner_w * 0.4

            for ox, oz in bx_positions:
                bcol = random.choice(BUILDING_COLORS)
                bh = random.uniform(BUILDING_MIN_H, BUILDING_MAX_H)
                bw_b = bw * random.uniform(0.7, 1.0)
                bd = bw_b  # square-ish footprint

                bpos = (block_cx + ox, bh / 2, block_cz + oz)

                # Main building body
                b = Entity(
                    model='cube', color=bcol,
                    scale=(bw_b, bh, bd),
                    position=bpos,
                )
                buildings.append(b)

                # Windows (simple texture trick: smaller brighter cubes on faces)
                win_col = random.choice(WINDOW_COLORS)
                ww = bw_b * 0.12
                wh = bh * 0.08
                floors = max(2, int(bh / 4.5))
                w_per_side = max(1, int(bw_b / 3.5))
                for fl in range(floors):
                    y = bpos[1] - bh/2 + (fl + 1) * (bh / (floors + 1))
                    for wi in range(w_per_side):
                        xo = -bw_b/2 + (wi + 1) * (bw_b / (w_per_side + 1))
                        if random.random() < 0.6:
                            Entity(model='cube', color=win_col,
                                   scale=(ww, wh, 0.15),
                                   position=(bpos[0] + xo, y, bpos[2] + bd/2 + 0.05))
                        if random.random() < 0.6:
                            Entity(model='cube', color=win_col,
                                   scale=(ww, wh, 0.15),
                                   position=(bpos[0] + xo, y, bpos[2] - bd/2 - 0.05))

                # Roof detail
                if random.random() < 0.5:
                    Entity(model='cube', color=Color(bcol[0]*0.8, bcol[1]*0.8, bcol[2]*0.8, bcol[3] if len(bcol)>3 else 1),
                           scale=(bw_b * 0.4, 1, bd * 0.4),
                           position=(bpos[0], bh + 0.5, bpos[2]))

    # Street lamps at intersections
    for rx in road_x_positions:
        for rz in road_z_positions:
            for dx in [-ROAD_WIDTH/2 - 1.5, ROAD_WIDTH/2 + 1.5]:
                for dz in [-ROAD_WIDTH/2 - 1.5, ROAD_WIDTH/2 + 1.5]:
                    lx = rx + dx
                    lz = rz + dz
                    if abs(lx) < WORLD_SIZE/2 and abs(lz) < WORLD_SIZE/2:
                        Entity(model='cube', color=C_LAMP,
                               scale=(0.4, 6, 0.4),
                               position=(lx, 3, lz))
                        Entity(model='sphere', color=C_DLGHT,
                               scale=(0.8, 1, 0.8),
                               position=(lx, 6.3, lz))

    # Spawn points on roads (for traffic and player)
    for r in range(20):
        if random.random() < 0.5:
            # On vertical road
            rx = random.choice(road_x_positions) + random.uniform(-3, 3)
            rz = random.uniform(-WORLD_SIZE/2 + 10, WORLD_SIZE/2 - 10)
        else:
            rx = random.uniform(-WORLD_SIZE/2 + 10, WORLD_SIZE/2 - 10)
            rz = random.choice(road_z_positions) + random.uniform(-3, 3)
        spawn_points.append(Vec3(rx, 1, rz))

generate_city()

# ═══════════════════════════════════════════
# PLAYER CHARACTER (Mario-inspired)
# ═══════════════════════════════════════════
class Player(Entity):
    def __init__(self):
        super().__init__()
        self.speed = 0
        self.max_speed = PLAYER_SPEED
        self.sprinting = False
        self.on_foot = True
        self.current_car = None
        self.jumping = False
        self.vy = 0
        self.direction = Vec3(0, 0, 1)

        # Mario body (head + body)
        self.group = Entity(position=(0, 0.9, 0))
        # Body / overalls
        self.body = Entity(
            parent=self.group, model='cube',
            color=color.rgb(220, 40, 30),  # Red shirt
            scale=(0.8, 0.9, 0.5),
            position=(0, 0, 0),
        )
        # Overalls
        self.overalls = Entity(
            parent=self.group, model='cube',
            color=color.rgb(30, 50, 180),
            scale=(0.75, 0.6, 0.48),
            position=(0, -0.3, 0),
        )
        # Head
        self.head = Entity(
            parent=self.group, model='sphere',
            color=color.rgb(240, 200, 160),
            scale=(0.7, 0.7, 0.7),
            position=(0, 0.65, 0),
        )
        # Cap
        self.cap = Entity(
            parent=self.group, model='cube',
            color=color.rgb(220, 30, 30),
            scale=(0.75, 0.35, 0.75),
            position=(0, 0.95, 0),
        )
        # Cap brim
        self.brim = Entity(
            parent=self.group, model='cube',
            color=color.rgb(220, 30, 30),
            scale=(0.85, 0.1, 0.4),
            position=(0, 0.82, 0.25),
        )
        # Eyes
        Entity(parent=self.group, model='cube',
               color=color.rgb(20, 20, 20),
               scale=(0.12, 0.15, 0.1),
               position=(-0.15, 0.7, 0.32))
        Entity(parent=self.group, model='cube',
               color=color.rgb(20, 20, 20),
               scale=(0.12, 0.15, 0.1),
               position=(0.15, 0.7, 0.32))
        # Mustache
        Entity(parent=self.group, model='cube',
               color=color.rgb(60, 40, 20),
               scale=(0.4, 0.1, 0.15),
               position=(0, 0.55, 0.32))
        # Legs
        self.left_leg = Entity(
            parent=self.group, model='cube',
            color=color.rgb(30, 50, 180),
            scale=(0.3, 0.5, 0.35),
            position=(-0.2, -0.7, 0),
        )
        self.right_leg = Entity(
            parent=self.group, model='cube',
            color=color.rgb(30, 50, 180),
            scale=(0.3, 0.5, 0.35),
            position=(0.2, -0.7, 0),
        )
        # Shoes
        Entity(parent=self.group, model='cube',
               color=color.rgb(80, 50, 20),
               scale=(0.32, 0.18, 0.4),
               position=(-0.2, -0.95, 0.05))
        Entity(parent=self.group, model='cube',
               color=color.rgb(80, 50, 20),
               scale=(0.32, 0.18, 0.4),
               position=(0.2, -0.95, 0.05))

        self.group.position = Vec3(0, 0, 0)
        # Spawn on a road, not inside a building
        if spawn_points:
            self.world_position = Vec3(spawn_points[0].x, 1, spawn_points[0].z)
        else:
            self.world_position = Vec3(0, 1, 0)

    def update(self):
        if not self.on_foot:
            return

        dt = time.dt
        move = Vec3(0, 0, 0)
        moving = False

        # Camera-relative movement
        cam_fwd = camera.forward
        cam_fwd.y = 0
        cam_fwd = cam_fwd.normalized()
        cam_right = camera.right
        cam_right.y = 0
        cam_right = cam_right.normalized()

        if held_keys['w']:
            move += cam_fwd
            moving = True
        if held_keys['s']:
            move -= cam_fwd
            moving = True
        if held_keys['a']:
            move -= cam_right
            moving = True
        if held_keys['d']:
            move += cam_right
            moving = True

        if moving:
            move = move.normalized()
            self.direction = move
            spd = PLAYER_SPRINT if held_keys['left shift'] else PLAYER_SPEED
            self.world_position += move * spd * dt
            # Face direction
            target_y = math.degrees(math.atan2(move.x, move.z))
            self.group.rotation_y = lerp_angle(
                self.group.rotation_y, target_y, 10 * dt)

            # Walk animation (leg swing)
            swing = math.sin(time.time() * spd * 1.8) * 30
            self.left_leg.rotation_x = swing
            self.right_leg.rotation_x = -swing
            self.left_leg.y = -0.7 + abs(math.sin(time.time() * spd * 1.8)) * 0.05
            self.right_leg.y = -0.7 + abs(math.sin(time.time() * spd * 1.8 + math.pi)) * 0.05
        else:
            self.left_leg.rotation_x = lerp(self.left_leg.rotation_x, 0, 8 * dt)
            self.right_leg.rotation_x = lerp(self.right_leg.rotation_x, 0, 8 * dt)

        # Jump
        if held_keys['space'] and not self.jumping and self.y <= 1.1:
            self.vy = PLAYER_JUMP
            self.jumping = True

        # Gravity
        self.vy -= GRAVITY * dt
        self.y += self.vy * dt
        if self.y <= 1.0:
            self.y = 1.0
            self.vy = 0
            self.jumping = False

        # Clamp to world
        half = WORLD_SIZE / 2 - 5
        self.x = max(-half, min(half, self.x))
        self.z = max(-half, min(half, self.z))

    def try_enter_car(self):
        if not self.on_foot:
            # Exit car
            if self.current_car:
                self.current_car.player_driving = False
                self.current_car.throttle_in = 0
                self.current_car.steer_in = 0
                self.on_foot = True
                self.current_car = None
                self.world_position = camera.world_position + camera.forward * 3
                self.y = 1.0
        else:
            # Try to enter nearest car
            nearest = None
            nd = 5  # pickup range
            for car in traffic_cars:
                d = distance(self, car.group)
                if d < nd:
                    nd = d
                    nearest = car
            if nearest:
                self.current_car = nearest
                nearest.player_driving = True
                self.on_foot = False
                self.group.y = -5  # hide

player = Player()

# ═══════════════════════════════════════════
# VEHICLE SYSTEM
# ═══════════════════════════════════════════
CAR_COLORS = [
    color.rgb(200, 40, 40),
    color.rgb(40, 80, 200),
    color.rgb(240, 200, 40),
    color.rgb(60, 60, 60),
    color.rgb(200, 200, 200),
    color.rgb(40, 160, 80),
    color.rgb(180, 60, 160),
    color.rgb(240, 140, 40),
]

class Vehicle(Entity):
    def __init__(self, pos, rot_y=0):
        super().__init__()
        self.player_driving = False
        self.speed = 0
        self.throttle_in = 0
        self.steer_in = 0
        self.max_speed = CAR_MAX_SPEED
        self.nitro = 0
        self.max_nitro = 100

        c = random.choice(CAR_COLORS)

        self.group = Entity(position=pos)
        self.group.rotation_y = rot_y

        # Chassis
        chassis = Entity(
            parent=self.group, model='cube', color=c,
            scale=(2.2, 0.8, 4.5),
            position=(0, 0.6, 0),
        )
        # Cabin
        Entity(parent=self.group, model='cube',
               color=color.rgb(60, 60, 70),
               scale=(2.0, 0.7, 2.2),
               position=(0, 1.3, -0.3))

        # Windshield
        Entity(parent=self.group, model='cube',
               color=color.rgb(150, 200, 240),
               scale=(1.8, 0.6, 0.1),
               position=(0, 1.3, 0.85))

        # Rear window
        Entity(parent=self.group, model='cube',
               color=color.rgb(150, 200, 240),
               scale=(1.8, 0.6, 0.1),
               position=(0, 1.3, -1.45))

        # Headlights
        Entity(parent=self.group, model='sphere',
               color=color.rgb(255, 255, 220),
               scale=(0.4, 0.3, 0.2),
               position=(-0.7, 0.5, 2.28))
        Entity(parent=self.group, model='sphere',
               color=color.rgb(255, 255, 220),
               scale=(0.4, 0.3, 0.2),
               position=(0.7, 0.5, 2.28))

        # Taillights
        Entity(parent=self.group, model='cube',
               color=color.rgb(255, 40, 40),
               scale=(0.35, 0.2, 0.1),
               position=(-0.7, 0.5, -2.28))
        Entity(parent=self.group, model='cube',
               color=color.rgb(255, 40, 40),
               scale=(0.35, 0.2, 0.1),
               position=(0.7, 0.5, -2.28))

        # Wheels
        for wx in [-1.1, 1.1]:
            for wz in [1.4, -1.4]:
                Entity(parent=self.group, model='cube',
                       color=color.rgb(30, 30, 30),
                       scale=(0.35, 0.6, 0.6),
                       position=(wx, 0.3, wz))

        # Collider for the car self
        self.collider = 'box'
        self.scale = (2.4, 1.0, 4.8)

    def ai_drive(self):
        dt = time.dt
        # Simple AI: go forward, steer toward road direction
        # Random wander on road
        self.throttle_in = 0.6
        # Slight random steer
        if random.random() < 0.02:
            self.steer_in = random.uniform(-0.4, 0.4)
        else:
            self.steer_in = lerp(self.steer_in, 0, 2 * dt)

        # Avoid going off road - if near world edge, turn
        if abs(self.group.x) > WORLD_SIZE/2 - 30:
            self.steer_in = -0.5 if self.group.x > 0 else 0.5
        if abs(self.group.z) > WORLD_SIZE/2 - 30:
            self.steer_in = 0.5

    def physics(self):
        dt = time.dt
        # Acceleration / braking
        eff = 1.0 - abs(self.speed) / self.max_speed * 0.5
        eff = max(eff, 0.1)
        self.speed += self.throttle_in * CAR_ACCEL * eff * dt

        if held_keys['space'] and self.player_driving:
            # Handbrake / brake
            if self.speed > 0:
                self.speed = max(0, self.speed - CAR_BRAKE * 1.5 * dt)
            else:
                self.speed = min(0, self.speed + CAR_BRAKE * 0.5 * dt)
        else:
            # Rolling drag
            drag = 3 + 0.05 * abs(self.speed)
            if self.speed > 0:
                self.speed = max(0, self.speed - drag * dt)
            elif self.speed < 0:
                self.speed = min(0, self.speed + drag * dt)

        # Move
        self.group.position += self.group.forward * self.speed * dt

        # Steering
        turn_factor = max(0.15, 1.0 - abs(self.speed) / self.max_speed * 0.5)
        self.group.rotation_y += self.steer_in * CAR_STEER * self.speed * turn_factor * dt * 60

        # World bounds
        half = WORLD_SIZE / 2 - 5
        if abs(self.group.x) > half:
            self.group.x = max(-half, min(half, self.group.x))
            self.speed *= 0.3
        if abs(self.group.z) > half:
            self.group.z = max(-half, min(half, self.group.z))
            self.speed *= 0.3

        # Keep on ground
        self.group.y = 0

# Spawn AI traffic
for i in range(25):
    sp = random.choice(spawn_points)
    rot = random.choice([0, 90, 180, 270]) if random.random() < 0.5 else random.uniform(0, 360)
    car = Vehicle(Vec3(sp.x, 0, sp.z), rot_y=rot)
    traffic_cars.append(car)

# ═══════════════════════════════════════════
# CAMERA SYSTEM
# ═══════════════════════════════════════════
class GameCamera:
    def __init__(self):
        self.mode = 'close'  # 'close' or 'far'
        camera.fov = 70
        self._last_fwd = Vec3(0, 0, 1)

    def update(self):
        dt = time.dt
        target = player.current_car.group if not player.on_foot else player.group

        if self.mode == 'close':
            dist = 12 if player.on_foot else 18
            height = 5 if player.on_foot else 8
            _smooth = 8
        else:
            dist = 20 if player.on_foot else 30
            height = 8 if player.on_foot else 12
            _smooth = 5

        fwd = target.forward
        fwd.y = 0
        if fwd.length() < 0.01:
            fwd = self._last_fwd
        else:
            fwd = fwd.normalized()
            self._last_fwd = fwd

        desired_pos = (target.world_position
                       - fwd * dist
                       + Vec3(0, height, 0))
        camera.world_position = lerp(camera.world_position, desired_pos,
                                      min(_smooth * dt, 1.0))

        look_at = target.world_position + Vec3(0, 2, 0)
        camera.look_at(look_at)

        spd = abs(player.speed) if player.on_foot else abs(player.current_car.speed)
        target_fov = lerp(70, 95, min(spd / CAR_MAX_SPEED, 1))
        camera.fov = lerp(camera.fov, target_fov, 3 * dt)

game_camera = GameCamera()

# ═══════════════════════════════════════════
# HUD & UI
# ═══════════════════════════════════════════
hud_panel = Entity(
    parent=camera.ui, model='quad',
    color=color.rgba(0, 0, 0, 100),
    scale=(0.35, 0.08),
    position=(0.0, -0.44),
    origin=(0, 0),
)

speed_text = Text(
    text='WALKING',
    position=(-0.85, -0.42),
    origin=(-0.5, 0),
    scale=2,
    color=color.white,
    font='VeraMono.ttf',
)

status_text = Text(
    text='F: Enter/Exit Vehicle',
    position=(-0.85, -0.47),
    origin=(-0.5, 0),
    scale=1.2,
    color=color.rgba(180, 180, 180),
)

# Nearby car prompt
car_prompt = Text(
    text='',
    position=(0, -0.35),
    origin=(0, 0),
    scale=1.8,
    color=color.rgb(255, 255, 100),
)

# Controls help
controls_text = Text(
    text='WASD:Move | SHIFT:Sprint | F:Enter/Exit | SPACE:Jump/Brake | C:Cam | ESC:Quit',
    position=(0, -0.475),
    origin=(0, 0),
    scale=0.9,
    color=color.rgba(150, 150, 150, 200),
)

# WANTED LEVEL (GTA style stars)
wanted_panel = Entity(
    parent=camera.ui, model='quad',
    color=color.rgba(0, 0, 0, 80),
    scale=(0.12, 0.04),
    position=(0.75, 0.46),
)
wanted_stars = []
for i in range(5):
    s = Text(
        text='*', position=(0.70 + i*0.04, 0.46),
        origin=(0, 0), scale=2.5,
        color=color.rgba(100, 100, 100, 150),
        parent=camera.ui,
    )
    wanted_stars.append(s)

# Crosshair / interaction marker
crosshair = Entity(
    parent=camera.ui, model='quad',
    color=color.rgba(255, 255, 255, 80),
    scale=(0.015, 0.015),
)

# ═══════════════════════════════════════════
# MINIMAP
# ═══════════════════════════════════════════
minimap_on = True
mm_size = 0.18
mm_bg = Entity(
    parent=camera.ui, model='quad',
    color=color.rgba(0, 0, 0, 150),
    scale=(mm_size + 0.01, mm_size + 0.01),
    position=(-0.82, 0.36),
    origin=(-0.5, 0.5),
)
mm_plane = Entity(
    parent=camera.ui, model='quad',
    color=color.rgba(40, 60, 40, 200),
    scale=(mm_size, mm_size),
    position=(-0.82, 0.36),
    origin=(-0.5, 0.5),
)
# Player dot on minimap
mm_player = Entity(
    parent=camera.ui, model='quad',
    color=color.rgb(0, 255, 0),
    scale=(0.012, 0.012),
    position=(-0.82, 0.36),
    origin=(-0.5, 0.5),
)
# Car dots on minimap
mm_car_dots = []
for car in traffic_cars:
    dot = Entity(
        parent=camera.ui, model='quad',
        color=color.rgb(255, 100, 50),
        scale=(0.008, 0.008),
        position=(-0.82, 0.36),
        origin=(-0.5, 0.5),
    )
    mm_car_dots.append(dot)

# ═══════════════════════════════════════════
# PARTICLE EFFECTS (exhaust, sparks)
# ═══════════════════════════════════════════
def spawn_exhaust(pos, direction):
    for _ in range(3):
        p = Entity(
            model='quad', texture=None,
            color=color.rgba(100, 100, 100, 150),
            scale=random.uniform(0.1, 0.25),
            position=pos + Vec3(random.uniform(-0.3, 0.3),
                                random.uniform(0, 0.3),
                                random.uniform(-0.3, 0.3)),
            billboard=True, unlit=True,
        )
        p.animate_scale(random.uniform(0.3, 0.6), duration=0.4,
                        curve=curve.out_expo)
        p.fade_out(duration=0.35)
        destroy(p, delay=0.5)

def spawn_sparks(pos, count=6):
    for _ in range(count):
        p = Entity(
            model='quad',
            color=color.rgb(255, 200, 50),
            scale=0.08,
            position=pos + Vec3(random.uniform(-0.5, 0.5),
                                random.uniform(0, 0.5),
                                random.uniform(-0.5, 0.5)),
            billboard=True, unlit=True,
        )
        p.animate_scale(0, duration=0.25, curve=curve.out_expo)
        p.fade_out(duration=0.2)
        destroy(p, delay=0.3)

# ═══════════════════════════════════════════
# GAME WORLD OBJECTS
# ═══════════════════════════════════════════
# Some pickups (coins / power-ups scattered)
coins = []
for _ in range(40):
    cx = random.uniform(-WORLD_SIZE/2 + 10, WORLD_SIZE/2 - 10)
    cz = random.uniform(-WORLD_SIZE/2 + 10, WORLD_SIZE/2 - 10)
    c = Entity(
        model='cube', color=color.rgb(255, 210, 40),
        scale=(0.4, 0.4, 0.1),
        position=(cx, 1.5, cz),
    )
    coins.append(c)

coin_score = 0
coin_text = Text(
    text='COINS: 0',
    position=(0.5, 0.46),
    origin=(0, 0),
    scale=2,
    color=color.rgb(255, 220, 80),
)

# ═══════════════════════════════════════════
# GAME STATE
# ═══════════════════════════════════════════
wavedist = 0  # wave timer for environment
btn_cooldown = 0

# ═══════════════════════════════════════════
# MAIN GAME LOOP
# ═══════════════════════════════════════════
def global_update():
    global btn_cooldown, coin_score
    dt = time.dt
    btn_cooldown = max(0, btn_cooldown - dt)

    # Player foot update
    player.update()

    # Camera
    game_camera.update()

    # Vehicle physics
    for car in traffic_cars:
        if car.player_driving:
            # Player inputs
            car.throttle_in = 0
            car.steer_in = 0
            if held_keys['w']: car.throttle_in = 1
            if held_keys['s']: car.throttle_in = -0.6
            if held_keys['a']: car.steer_in = -1
            if held_keys['d']: car.steer_in = 1

            # Nitro
            if held_keys['left shift'] and car.speed > 5:
                eff = (car.speed / car.max_speed) * 0.7 + 0.3
                car.speed += 15 * eff * dt
        else:
            car.ai_drive()

        car.physics()

        # Exhaust particles when accelerating fast
        if abs(car.throttle_in) > 0.3 and random.random() < 0.3:
            ex_pos = car.group.world_position - car.group.forward * 2.5
            spawn_exhaust(ex_pos, car.group.forward)

    # Enter/exit toggle
    if held_keys['f'] and btn_cooldown <= 0:
        player.try_enter_car()
        btn_cooldown = 0.4

    # Camera toggle
    if held_keys['c'] and btn_cooldown <= 0:
        game_camera.mode = 'far' if game_camera.mode == 'close' else 'close'
        btn_cooldown = 0.4

    # ── HUD Update ──
    if not player.on_foot and player.current_car:
        kmh = int(abs(player.current_car.speed) * 3.6)
        speed_text.text = f'{kmh} KM/H'
        speed_text.color = color.rgb(255, 255, 100)
        status_text.text = 'C: Camera | F: Exit | SHIFT: Nitro | SPACE: Brake | T: Honk'

        # Check nearby car prompt (not needed when driving)
        car_prompt.text = ''
    else:
        speed_text.text = 'WALKING' if not held_keys['left shift'] else 'SPRINTING'
        speed_text.color = color.white

        # Check for nearby car
        near = None
        nd = 5
        for car in traffic_cars:
            d = distance(player, car.group)
            if d < nd:
                nd = d
                near = car
        if near:
            car_prompt.text = 'PRESS F TO ENTER'
            status_text.text = 'SHIFT: Sprint | SPACE: Jump | C: Camera | ESC: Quit'
        else:
            car_prompt.text = ''
            status_text.text = 'SHIFT: Sprint | SPACE: Jump | C: Camera | ESC: Quit'

    # ── Coin collection ──
    to_remove = []
    for coin in coins:
        if distance(player, coin) < 1.5:
            to_remove.append(coin)
            coin.animate_scale(1.5, duration=0.15, curve=curve.out_back)
            coin.fade_out(duration=0.15)
            spawn_sparks(coin.world_position, 4)
            coin_score += 1
            coin_text.text = f'COINS: {coin_score}'
    for c in to_remove:
        coins.remove(c)
        destroy(c, delay=0.2)

    # Coin rotation animation
    for coin in coins:
        coin.rotation_y += 90 * dt
        coin.y = 1.5 + math.sin(time.time() * 2 + coin.x) * 0.2

    # ── Minimap ──
    if minimap_on:
        mm_bg.enabled = True
        mm_plane.enabled = True
        mm_player.enabled = True
        # Player dot
        mm_x = (-0.82 + (player.x / WORLD_SIZE) * mm_size)
        mm_y = (0.36 + (player.z / WORLD_SIZE) * mm_size)
        mm_player.position = (mm_x, mm_y)
        # Car dots
        for i, car in enumerate(traffic_cars):
            if i < len(mm_car_dots):
                mcx = (-0.82 + (car.group.x / WORLD_SIZE) * mm_size)
                mcy = (0.36 + (car.group.z / WORLD_SIZE) * mm_size)
                mm_car_dots[i].position = (mcx, mcy)
                mm_car_dots[i].enabled = True
    else:
        mm_bg.enabled = False
        mm_plane.enabled = False
        mm_player.enabled = False
        for d in mm_car_dots:
            d.enabled = False

    # ── Vehicle collisions with player (on foot) ──
    if player.on_foot:
        for car in traffic_cars:
            d = distance(player, car.group)
            if d < 2.5:
                # Push player away
                push_dir = (player.world_position - car.group.world_position)
                push_dir.y = 0
                push_dir = push_dir.normalized()
                player.world_position += push_dir * 8 * dt

# Connect to Ursina update
app.update = global_update

# ═══════════════════════════════════════════
# SPLASH TEXT
# ═══════════════════════════════════════════
splash = Text(
    text='SUPER MARIO GTA6',
    position=(0, 0.15),
    origin=(0, 0),
    scale=4,
    color=color.rgb(255, 220, 80),
    background=True,
)
sub_splash = Text(
    text='WELCOME TO THE CITY',
    position=(0, -0.02),
    origin=(0, 0),
    scale=2,
    color=color.white,
    background=True,
)

def hide_splash():
    splash.enabled = False
    sub_splash.enabled = False

invoke(hide_splash, delay=3)

# ═══════════════════════════════════════════
# RUN
# ═══════════════════════════════════════════
print("═══════════════════════════════════════")
print("  SUPER MARIO GTA6 - Ursina Engine")
print("═══════════════════════════════════════")
print("")
print("  WASD          - Move / Drive")
print("  SHIFT         - Sprint / Nitro")
print("  F             - Enter / Exit vehicle")
print("  SPACE         - Jump / Handbrake")
print("  C             - Toggle camera")
print("  ESC           - Quit")
print("")
print("  Collect coins! Drive cars! Explore!")
print("═══════════════════════════════════════")

app.run()
