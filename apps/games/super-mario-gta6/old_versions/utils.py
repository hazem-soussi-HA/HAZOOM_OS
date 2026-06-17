"""
UTILS - Shared constants, helpers, and spatial hashing for Super Mario GTA6.
         Vibrant Nintendo-style color palette with warm daylight lighting.
"""
import math
import random
from ursina import *

# ═══════════════════════════════════════════
# WSLg SAFETY
# ═══════════════════════════════════════════
import os
os.environ['SDL_AUDIODRIVER'] = 'disk'

# ═══════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════
WORLD_SIZE       = 400
BLOCK_SIZE       = 50
ROAD_WIDTH       = 16
SIDEWALK_WIDTH   = 3
NUM_BLOCKS       = 5
PLAYER_SPEED     = 8
PLAYER_SPRINT    = 16
PLAYER_JUMP      = 10
CAR_MAX_SPEED    = 50
CAR_ACCEL        = 35
CAR_BRAKE        = 50
CAR_STEER        = 2.2
GRAVITY          = 30
NITRO_BOOST      = 1.6

# ═══════════════════════════════════════════
# VIBRANT NINTENDO-STYLE COLOR PALETTE
# ═══════════════════════════════════════════
# Mario character — saturated, warm, iconic
C_MARIO_R   = color.rgb(220, 30, 30)       # Bright Mario red
C_MARIO_B   = color.rgb(30, 60, 200)       # Vibrant overalls blue
C_MARIO_SK  = color.rgb(245, 210, 160)     # Warm skin tone
C_SHOE      = color.rgb(90, 55, 25)        # Brown shoes

# World colors — vibrant, clean, Nintendo-style
C_ROAD      = color.hex('#3a3a42')         # Dark asphalt (not pure black)
C_SIDE      = color.hex('#b0a898')         # Warm concrete sidewalk
C_GRASS     = color.hex('#4caf50')         # Vibrant Mario green
C_LINE      = color.rgb(255, 210, 50)      # Bright traffic yellow
C_LAMP      = color.hex('#505060')         # Dark metallic lamp post
C_LAMP_L    = color.rgb(255, 240, 180)     # Warm lamp glow
C_DLGHT     = color.rgb(255, 235, 150)     # Lamp head glow
C_COIN      = color.rgb(255, 200, 0)       # Bright gold coin
C_STAR      = color.rgb(255, 220, 0)       # Star coin gold

# Sky & atmosphere
C_SKY_DAY       = color.rgb(135, 200, 255)  # Bright blue sky
C_SKY_HORIZON   = color.rgb(200, 230, 255)  # Light horizon blue
C_FOG_DAY       = color.rgb(180, 215, 240)  # Soft fog
C_SUN           = color.rgb(255, 240, 200)  # Warm sun color
C_AMBIENT_DAY   = color.rgb(180, 195, 220)  # Cool blue ambient fill

# District palettes — vibrant, varied, Nintendo-style
DISTRICT_COLORS = [
    # Downtown — warm greys with blue tint
    [color.hex('#7a7570'), color.hex('#8d8578'), color.hex('#6a6e78'),
     color.hex('#887e72'), color.hex('#5a5e68')],
    # Residential — warm terracotta & cream
    [color.hex('#c08850'), color.hex('#d4985a'), color.hex('#b07840'),
     color.hex('#e0a864'), color.hex('#c89058')],
    # Industrial — cool gunmetal blues
    [color.hex('#505860'), color.hex('#5a6268'), color.hex('#484f58'),
     color.hex('#626870'), color.hex('#404850')],
    # Suburbs — sage green & warm yellow
    [color.hex('#709058'), color.hex('#84a468'), color.hex('#608048'),
     color.hex('#98b878'), color.hex('#507038')],
]

CAR_COLORS = [
    color.rgb(220, 40, 40),    # Red
    color.rgb(40, 100, 220),   # Blue
    color.rgb(255, 200, 40),   # Yellow
    color.rgb(60, 60, 60),     # Black
    color.rgb(240, 240, 240),  # White
    color.rgb(40, 180, 80),    # Green
    color.rgb(180, 60, 180),   # Purple
    color.rgb(255, 140, 40),   # Orange
]

DISTRICT_NAMES = ['DOWNTOWN', 'RESIDENTIAL', 'INDUSTRIAL', 'SUBURBS']

# ═══════════════════════════════════════════
# GRAFFITI / LORE MESSAGES
# ═══════════════════════════════════════════
GRAFFITI = [
    "BOWSER BOUGHT CITY HALL",
    "THE PRINCESS IS IN ANOTHER CASTLE",
    "WARP ZONE ->",
    "1-UP",
    "WELCOME TO THE JUNGLE",
    "GOOMBAS WERE HERE",
    "STAR POWER FOREVER",
    "F? = FORTUNE",
    "RED SHELLS DON'T STOP",
    "LUIGI 2026",
]

# ═══════════════════════════════════════════
# GAME STATE
# ═══════════════════════════════════════════
STATE_MENU     = 'MENU'
STATE_PLAYING  = 'PLAYING'
STATE_MISSION  = 'MISSION_ACTIVE'
STATE_GAMEOVER = 'GAME_OVER'

game_state = {
    'state': STATE_MENU,
    'coins': 0,
    'score': 0,
    'frame_count': 0,
}
particle_pool = None

# ═══════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════
def distance_2d(a, b):
    dx = a.x - b.x
    dz = getattr(a, 'z', 0) - getattr(b, 'z', 0)
    return math.sqrt(dx * dx + dz * dz)

def distance_3d(a, b):
    dx = a.x - b.x
    dy = a.y - b.y
    dz = getattr(a, 'z', 0) - getattr(b, 'z', 0)
    return math.sqrt(dx * dx + dy * dy + dz * dz)

def clamp_world(pos, margin=5):
    half = WORLD_SIZE / 2 - margin
    x = max(-half, min(half, pos.x))
    z = max(-half, min(half, pos.z))
    return Vec3(x, pos.y, z)

def lerp_angle(current, target, speed_dt):
    from ursina import lerp_angle as _ursina_lerp_angle
    return _ursina_lerp_angle(current, target, min(speed_dt * time.dt, 1.0))

def get_road_positions():
    positions = []
    for i in range(NUM_BLOCKS + 1):
        pos = -(NUM_BLOCKS // 2) * BLOCK_SIZE + i * BLOCK_SIZE
        positions.append(pos)
    return positions

def get_district_at(x, z):
    half = WORLD_SIZE / 2
    nx = (x + half) / WORLD_SIZE
    nz = (z + half) / WORLD_SIZE
    ix = min(int(nx * 2), 1)
    iz = min(int(nz * 2), 1)
    return iz * 2 + ix

def get_district_name(x, z):
    return DISTRICT_NAMES[get_district_at(x, z)]

# ═══════════════════════════════════════════
# SPATIAL HASH
# ═══════════════════════════════════════════
class SpatialHash:
    def __init__(self, cell_size=30):
        self.cell_size = cell_size
        self.cells = {}

    def _key(self, x, z):
        return (int(x // self.cell_size), int(z // self.cell_size))

    def insert(self, entity):
        key = self._key(entity.x, entity.z)
        if key not in self.cells:
            self.cells[key] = []
        self.cells[key].append(entity)

    def query(self, x, z, radius):
        results = []
        cs = self.cell_size
        min_kx = int((x - radius) // cs)
        max_kx = int((x + radius) // cs)
        min_kz = int((z - radius) // cs)
        max_kz = int((z + radius) // cs)
        r2 = radius * radius
        for kx in range(min_kx, max_kx + 1):
            for kz in range(min_kz, max_kz + 1):
                cell = self.cells.get((kx, kz))
                if cell:
                    for e in cell:
                        dx = e.x - x
                        dz = e.z - z
                        if dx * dx + dz * dz <= r2:
                            results.append(e)
        return results

    def clear(self):
        self.cells.clear()

# ═══════════════════════════════════════════
# PARTICLE POOL
# ═══════════════════════════════════════════
class ParticlePool:
    def __init__(self, size=50):
        self.pool = []
        self.active = []
        for _ in range(size):
            p = Entity(
                model='quad', texture=None,
                color=color.rgba(100, 100, 100, 150),
                scale=0.1, billboard=True, unlit=True,
                enabled=False,
            )
            self.pool.append(p)

    def spawn(self, pos, col=None, scale=0.15, duration=0.4):
        if not self.pool:
            return None
        p = self.pool.pop()
        p.position = pos
        p.color = col or color.rgba(100, 100, 100, 150)
        p.scale = scale
        p.enabled = True
        p.animate_scale(scale * 3, duration=duration, curve=curve.out_expo)
        p.fade_out(duration=duration)

        def _return_to_pool():
            if p in self.active:
                self.active.remove(p)
            p.enabled = False
            self.pool.append(p)

        invoke(_return_to_pool, delay=duration + 0.1)
        self.active.append(p)
        return p

    def spawn_exhaust(self, pos, direction):
        for _ in range(2):
            offset = pos + Vec3(
                random.uniform(-0.3, 0.3),
                random.uniform(0, 0.3),
                random.uniform(-0.3, 0.3),
            )
            self.spawn(offset, color.rgba(80, 80, 80, 120),
                       scale=random.uniform(0.1, 0.2), duration=0.5)

    def spawn_sparks(self, pos, count=4):
        for _ in range(count):
            offset = pos + Vec3(
                random.uniform(-0.3, 0.3),
                random.uniform(0, 0.3),
                random.uniform(-0.3, 0.3),
            )
            self.spawn(offset, color.rgb(255, 200, 50),
                       scale=0.08, duration=0.3)

    def spawn_confetti(self, pos, count=10):
        confetti_colors = [
            color.rgb(255, 50, 50), color.rgb(50, 255, 50),
            color.rgb(50, 50, 255), color.rgb(255, 255, 50),
            color.rgb(255, 50, 255), color.rgb(50, 255, 255),
        ]
        for _ in range(count):
            offset = pos + Vec3(
                random.uniform(-1, 1),
                random.uniform(0, 2),
                random.uniform(-1, 1),
            )
            c = random.choice(confetti_colors)
            self.spawn(offset, c, scale=0.12, duration=0.8)
