"""
CITY - City generation with districts, roads, buildings, street lamps,
       hidden star coins, and environmental storytelling.
"""
import random
from ursina import *
from utils import *

class CityGenerator:
    """Generates the full city: roads, sidewalks, buildings, decorations."""

    def __init__(self):
        self.buildings = []
        self.spawn_points = []
        self.star_coins = []  # hidden collectibles for permanent upgrades
        self.graffiti = []
        self.district_zones = []  # (x_min, x_max, z_min, z_max, district_id)
        self.road_x = []
        self.road_z = []

    def generate(self):
        """Generate the entire city."""
        random.seed(42)
        self._generate_ground()
        self._generate_roads()
        self._generate_sidewalks()
        self._generate_buildings()
        self._generate_street_lamps()
        self._generate_graffiti()
        self._generate_star_coins()
        self._generate_spawn_points()
        print(f"City generated: {len(self.buildings)} buildings, "
              f"{len(self.star_coins)} star coins", flush=True)

    def _generate_ground(self):
        Entity(
            model='cube', color=C_GRASS,
            scale=(WORLD_SIZE * 2, 0.2, WORLD_SIZE * 2),
            position=(0, -0.1, 0),
            collider='box',
        )

    def _generate_roads(self):
        """Road grid with yellow center lines."""
        bx = -(NUM_BLOCKS // 2) * BLOCK_SIZE
        bz = -(NUM_BLOCKS // 2) * BLOCK_SIZE

        for i in range(NUM_BLOCKS + 1):
            rx = bx + i * BLOCK_SIZE
            self.road_x.append(rx)
            Entity(model='cube', color=C_ROAD,
                   scale=(ROAD_WIDTH, 0.05, WORLD_SIZE),
                   position=(rx, 0.02, 0))

        for j in range(NUM_BLOCKS + 1):
            rz = bz + j * BLOCK_SIZE
            self.road_z.append(rz)
            Entity(model='cube', color=C_ROAD,
                   scale=(WORLD_SIZE, 0.05, ROAD_WIDTH),
                   position=(0, 0.02, rz))

        # Yellow dashes (optimized: wider spacing, longer dashes)
        for rx in self.road_x:
            for dz in range(int(-WORLD_SIZE / 2), int(WORLD_SIZE / 2), 30):
                Entity(model='cube', color=C_LINE,
                       scale=(0.5, 0.07, 10), position=(rx, 0.04, dz))
        for rz in self.road_z:
            for dx in range(int(-WORLD_SIZE / 2), int(WORLD_SIZE / 2), 30):
                Entity(model='cube', color=C_LINE,
                       scale=(10, 0.07, 0.5), position=(dx, 0.04, rz))

    def _generate_sidewalks(self):
        """Sidewalks around each block."""
        bx = -(NUM_BLOCKS // 2) * BLOCK_SIZE
        bz = -(NUM_BLOCKS // 2) * BLOCK_SIZE
        sw = SIDEWALK_WIDTH
        rw = ROAD_WIDTH

        for ix in range(NUM_BLOCKS):
            for jz in range(NUM_BLOCKS):
                cx = bx + ix * BLOCK_SIZE + BLOCK_SIZE / 2
                cz = bz + jz * BLOCK_SIZE + BLOCK_SIZE / 2
                inner = BLOCK_SIZE - rw

                # Top sidewalk
                Entity(model='cube', color=C_SIDE,
                       scale=(inner + 2 * sw, 0.12, sw),
                       position=(cx, 0.06, cz + BLOCK_SIZE / 2 - rw / 2 - sw / 2))
                # Bottom
                Entity(model='cube', color=C_SIDE,
                       scale=(inner + 2 * sw, 0.12, sw),
                       position=(cx, 0.06, cz - BLOCK_SIZE / 2 + rw / 2 + sw / 2))
                # Left
                Entity(model='cube', color=C_SIDE,
                       scale=(sw, 0.12, inner),
                       position=(cx - BLOCK_SIZE / 2 + rw / 2 + sw / 2, 0.06, cz))
                # Right
                Entity(model='cube', color=C_SIDE,
                       scale=(sw, 0.12, inner),
                       position=(cx + BLOCK_SIZE / 2 - rw / 2 - sw / 2, 0.06, cz))

    def _generate_buildings(self):
        """Buildings per block, with district-aware colors."""
        bx = -(NUM_BLOCKS // 2) * BLOCK_SIZE
        bz = -(NUM_BLOCKS // 2) * BLOCK_SIZE

        for ix in range(NUM_BLOCKS):
            for jz in range(NUM_BLOCKS):
                cx = bx + ix * BLOCK_SIZE + BLOCK_SIZE / 2
                cz = bz + jz * BLOCK_SIZE + BLOCK_SIZE / 2

                # Determine district
                did = get_district_at(cx, cz)
                palette = DISTRICT_COLORS[did]

                sw = SIDEWALK_WIDTH
                rw = ROAD_WIDTH
                inner = BLOCK_SIZE - rw - 2 * sw
                if inner < 8:
                    continue

                nb = random.choice([1, 2, 2])  # 1 or 2 buildings
                if nb == 1:
                    offsets = [(0, 0)]
                    bw = inner * 0.7
                else:
                    offsets = [(-inner * 0.25, 0), (inner * 0.25, 0)]
                    bw = inner * 0.4

                for ox, oz in offsets:
                    bcol = random.choice(palette)
                    bh = random.uniform(10, 40)
                    bw_b = bw * random.uniform(0.7, 0.95)
                    pos = (cx + ox, bh / 2, cz + oz)

                    b = Entity(model='cube', color=bcol,
                               scale=(bw_b, bh, bw_b), position=pos,
                               collider='box')
                    self.buildings.append(b)
                    buildings.append(b)  # also add to global for main.py

                    # District name sign (simple text on a building in first block)
                    if ix == 0 and jz == 0 and DISTRICT_NAMES[did] == 'DOWNTOWN':
                        pass  # Skip text entities - too heavy

                    # Roof detail
                    if random.random() < 0.3:
                        Entity(model='cube',
                               color=color.rgb(
                                   int(bcol[0] * 0.8) % 256,
                                   int(bcol[1] * 0.8) % 256,
                                   int(bcol[2] * 0.8) % 256),
                               scale=(bw_b * 0.3, 0.8, bw_b * 0.3),
                               position=(pos[0], bh + 0.4, pos[2]))

    def _generate_graffiti(self):
        """Graffiti messages on building walls (environmental storytelling)."""
        random.seed(42)
        bx = -(NUM_BLOCKS // 2) * BLOCK_SIZE
        bz = -(NUM_BLOCKS // 2) * BLOCK_SIZE
        for ix in range(NUM_BLOCKS):
            for jz in range(NUM_BLOCKS):
                if random.random() < 0.3:
                    cx = bx + ix * BLOCK_SIZE + BLOCK_SIZE / 2
                    cz = bz + jz * BLOCK_SIZE + BLOCK_SIZE / 2
                    msg = random.choice(GRAFFITI)
                    # Simple colored cube "graffiti tag" on wall
                    g_col = color.rgb(
                        random.randint(100, 255),
                        random.randint(50, 200),
                        random.randint(50, 200),
                    )
                    gx = cx + random.choice([-1, 1]) * (BLOCK_SIZE / 2 - 3)
                    gz = cz + random.uniform(-10, 10)
                    Entity(model='cube', color=g_col,
                           scale=(3, 2, 0.1), position=(gx, 2, gz))
                    self.graffiti.append((gx, gz, msg))

    def _generate_star_coins(self):
        """Hidden star coins for permanent speed upgrades."""
        for _ in range(8):
            cx = random.uniform(-WORLD_SIZE / 2 + 20, WORLD_SIZE / 2 - 20)
            cz = random.uniform(-WORLD_SIZE / 2 + 20, WORLD_SIZE / 2 - 20)
            sc = Entity(
                model='cube', color=color.rgb(255, 255, 100),
                scale=(0.6, 0.6, 0.15),
                position=(cx, 2.0, cz),
            )
            self.star_coins.append(sc)

    def _generate_spawn_points(self):
        """Road positions for spawning vehicles and player."""
        for _ in range(15):
            if random.random() < 0.5:
                rx = random.choice(self.road_x) + random.uniform(-3, 3)
                rz = random.uniform(-WORLD_SIZE / 2 + 10, WORLD_SIZE / 2 - 10)
            else:
                rx = random.uniform(-WORLD_SIZE / 2 + 10, WORLD_SIZE / 2 - 10)
                rz = random.choice(self.road_z) + random.uniform(-3, 3)
            self.spawn_points.append(Vec3(rx, 0.5, rz))

    def _generate_street_lamps(self):
        """Street lamps at intersections (optimized: 2 per corner instead of 4)."""
        for rx in self.road_x:
            for rz in self.road_z:
                for dx, dz in [(-ROAD_WIDTH / 2 - 2, -ROAD_WIDTH / 2 - 2),
                               (ROAD_WIDTH / 2 + 2, ROAD_WIDTH / 2 + 2)]:
                    lx = rx + dx
                    lz = rz + dz
                    if abs(lx) < WORLD_SIZE / 2 and abs(lz) < WORLD_SIZE / 2:
                        Entity(model='cube', color=C_LAMP,
                               scale=(0.3, 5, 0.3),
                               position=(lx, 2.5, lz))
                        Entity(model='sphere', color=C_DLGHT,
                               scale=(0.6, 0.8, 0.6),
                               position=(lx, 5.3, lz))


# Global building list for collision
buildings = []
