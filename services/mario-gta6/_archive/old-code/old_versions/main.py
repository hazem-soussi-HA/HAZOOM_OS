"""
MAIN - Game initialization, world setup, and main loop orchestration.
        This is the central hub that ties all modules together.
"""
import os
os.environ['SDL_AUDIODRIVER'] = 'disk'

import math
import random
from ursina import *

from utils import *
from city import CityGenerator, buildings
from player import Player
from vehicles import Vehicle
from hud import HUD, GameCamera
from missions import MissionManager
import utils as _utils

# ═══════════════════════════════════════════
# GLOBAL GAME STATE (mutable dict, shared across modules)
# ═══════════════════════════════════════════
game_state = _utils.game_state

# Global collections
traffic_cars = []
coins = []
particle_pool = None
city_gen = None
player = None
game_camera = None
hud = None
mission_mgr = None
cam_debug_text = None
btn_cooldown = 0.0


def init_game():
    """Initialize all game systems."""
    global player, game_camera, hud, mission_mgr
    global cam_debug_text
    global traffic_cars, coins, particle_pool, city_gen

    # ── App ──
    app = Ursina(
        title='Super Mario GTA6 v1.0.0',
        borderless=False,
        fullscreen=False,
        development=False,
    )
    window.fps_counter.enabled = True

    # ═══════════════════════════════════════════
    # DEEP PRO ENVIRONMENT PATCH
    #   Proper lighting, atmosphere, and shader
    # ═══════════════════════════════════════════

    # ── 1. SHADER (basic_lighting = stable on WSLg, no segfault) ──
    from ursina.shaders import basic_lighting_shader, unlit_shader
    Entity.default_shader = basic_lighting_shader
    print("Shader: basic_lighting_shader (FORCED FOR STABILITY)", flush=True)

    # ── 2. LIGHTING — warm Nintendo daylight ──
    # Warm golden sun — key light
    sun_pivot = Entity()
    sun = DirectionalLight(parent=sun_pivot, y=15, z=8, shadows=False)
    sun.color = C_SUN
    sun.look_at(Vec3(1, -1, -1))

    # Cool blue ambient fill — creates natural shadow color
    amb = AmbientLight(color=C_AMBIENT_DAY)

    print("Lighting: warm sun + cool ambient fill", flush=True)

    # ── 3. ATMOSPHERE — vibrant Nintendo sky ──
    scene.fog_density = 0.004
    scene.fog_color = C_FOG_DAY
    Sky(texture=None, color=C_SKY_DAY)
    window.color = C_SKY_DAY
    print("Atmosphere: vibrant blue sky + soft fog", flush=True)

    # ── Particle Pool ──
    global particle_pool
    pp = ParticlePool(size=60)
    particle_pool = pp
    _utils.particle_pool = pp  # share with utils for other modules

    # ── City ──
    city_gen = CityGenerator()
    city_gen.generate()

    # ═══════════════════════════════════════════
    # POST-GEN ENTITY FIXUP
    #   Force correct shader + correct colors on
    #   every entity the city just spawned.
    # ═══════════════════════════════════════════
    _road_col  = C_ROAD
    _grass_col = C_GRASS
    _side_col  = C_SIDE
    _line_col  = C_LINE

    _fix_count = 0
    for _e in scene.entities:
        if not hasattr(_e, 'model') or not _e.model:
            continue
        # Force shader (basic_lighting is stable on WSLg)
        try:
            _e.shader = basic_lighting_shader
        except Exception:
            try:
                _e.shader = unlit_shader
            except Exception:
                pass

        _sx = getattr(_e, 'scale_x', 1)
        _sy = getattr(_e, 'scale_y', 1)
        _sz = getattr(_e, 'scale_z', 1)

        # Ground plane: very wide, very flat
        if _sy <= 0.25 and _sx > 100 and _sz > 100:
            _e.color = _grass_col
        # Road slab: flat, medium-wide
        elif _sy <= 0.1 and (_sx > 8 or _sz > 8) and _sx < 100 and _sz < 100:
            _e.color = _road_col
        # Sidewalk: thin flat strips
        elif _sy <= 0.15 and _sy > 0.06 and (_sx < 50 and _sz < 50):
            _e.color = _side_col
        # Road line dashes: tiny flat pieces
        elif _sy <= 0.08 and _sy > 0.04:
            _e.color = _line_col
        # Building: tall
        elif _sy > 5:
            pass  # keep district color, just ensure shader is set

        _fix_count += 1

    print(f"Post-gen fixup: {_fix_count} entities corrected", flush=True)

    # ── Player ──
    sp = city_gen.spawn_points[0] if city_gen.spawn_points else Vec3(0, 0, 0)
    player = Player(spawn_point=sp)

    # ── Traffic Cars ──
    for i in range(8):
        sp = random.choice(city_gen.spawn_points)
        rot = random.choice([0, 90, 180, 270])
        car = Vehicle(Vec3(sp.x, 0, sp.z), rot_y=rot)
        traffic_cars.append(car)

    # ── Player coins (collectibles) ──
    for i in range(30):
        cx = random.uniform(-WORLD_SIZE / 2 + 20, WORLD_SIZE / 2 - 20)
        cz = random.uniform(-WORLD_SIZE / 2 + 20, WORLD_SIZE / 2 - 20)
        coin = Entity(
            model='cube', color=C_COIN,
            scale=(0.5, 0.5, 0.12),
            position=(cx, 1.5, cz),
        )
        coins.append(coin)

    # ── Camera ──
    game_camera = GameCamera(player)

    # ── HUD ──
    hud = HUD()

    # ── Debug camera overlay ──
    cam_debug_text = Text(
        text='',
        position=(-0.85, 0.45),
        origin=(-0.5, 0.5),
        scale=1.0,
        color=color.rgba(255, 255, 0, 200),
    )

    # ── Mission System ──
    mission_mgr = MissionManager()
    mission_mgr.setup_triggers(city_gen.spawn_points)

    print("Game initialized!", flush=True)
    return app


# Module-level app reference (set by launch.py)
app = None


def input(key):
    """Handle one-shot key presses (Ursina callback)."""
    # M: toggle minimap
    if key == 'm':
        hud.mm_bg.enabled = not hud.mm_bg.enabled
        hud.mm_plane.enabled = not hud.mm_plane.enabled
        hud.mm_player.enabled = not hud.mm_player.enabled

    # T: honk horn (only when driving)
    if key == 't':
        if not player.on_foot and player.current_car:
            # Visual honk feedback — flash headlights
            # (no audio file available, so we flash the speed text)
            hud.speed_text.color = color.rgb(255, 255, 0)
            invoke(_reset_honk_flash, delay=0.15)


def _reset_honk_flash():
    hud.speed_text.color = color.rgb(255, 255, 100) if (
        not player.on_foot and player.current_car
    ) else color.white


def global_update():
    """Main game loop update function."""
    global btn_cooldown
    dt = time.dt

    state = game_state['state']

    # ── MENU STATE ──
    if state == STATE_MENU:
        if held_keys['enter']:
            game_state['state'] = STATE_PLAYING
            hud.hide_menu()
        return

    # ── ACTIVE GAMEPLAY ──
    btn_cooldown = max(0, btn_cooldown - dt)
    game_state['frame_count'] += 1

    # Player update
    player.update()
    game_camera.update()

    # Camera debug overlay
    pp = player.group.position
    cp = camera.world_position
    cam_debug_text.text = (
        f'P:({pp.x:.0f},{pp.y:.0f},{pp.z:.0f}) '
        f'C:({cp.x:.0f},{cp.y:.0f},{cp.z:.0f}) '
        f'fov={camera.fov:.0f}'
    )

    # Vehicle physics
    for car in traffic_cars:
        if car.player_driving:
            car.throttle_in = 0
            car.steer_in = 0
            if held_keys['w']: car.throttle_in = 1.0
            if held_keys['s']: car.throttle_in = -0.6
            if held_keys['a']: car.steer_in = -1.0
            if held_keys['d']: car.steer_in = 1.0
            # Nitro
            if held_keys['left shift'] and car.speed > 5:
                car.speed += 15 * dt
            # Exhaust
            if abs(car.throttle_in) > 0.3 and random.random() < 0.2:
                ex_pos = car.group.world_position - car.group.forward * 2.5
                particle_pool.spawn_exhaust(ex_pos, car.group.forward)
        else:
            car.ai_drive()
        car.physics()

    # Enter/exit vehicle
    if held_keys['f'] and btn_cooldown <= 0:
        player.try_enter_exit_vehicle(traffic_cars)
        btn_cooldown = 0.4

    # Camera toggle
    if held_keys['c'] and btn_cooldown <= 0:
        game_camera.mode = (
            'far' if game_camera.mode == 'close' else 'close')
        btn_cooldown = 0.4

    # Mission triggers
    if not mission_mgr.active_mission:
        triggered = mission_mgr.check_triggers(player.group.position)
        if triggered:
            # Check if player can afford it
            cost = triggered.get('cost', 0)
            if game_state['coins'] >= cost:
                game_state['coins'] -= cost
                mission_mgr.start_mission(triggered, player)
                game_state['state'] = STATE_MISSION
            else:
                pass  # Can't afford - trigger stays for retry
    else:
        # Update active mission
        mission_mgr.update(dt, player)
        if not mission_mgr.active_mission:
            game_state['state'] = STATE_PLAYING

    # Coin collection
    for coin in coins[:]:
        if not coin.enabled:
            continue
        if distance_2d(player.group.position, coin.position) < 1.5:
            coins.remove(coin)
            game_state['coins'] += 1
            particle_pool.spawn_sparks(coin.position, count=4)
            destroy(coin, delay=0.1)
            # Also add mission progress for collection missions
            if mission_mgr.active_mission:
                mission_mgr.add_progress(1)

    # Coin animation
    for coin in coins:
        if coin.enabled:
            coin.rotation_y += 90 * dt
            coin.y = 1.5 + math.sin(time.time() * 2 + coin.x) * 0.2

    # Star coin collection (hidden collectibles = permanent upgrades)
    for sc in city_gen.star_coins[:]:
        if sc.enabled and distance_2d(player.group.position, sc.position) < 1.5:
            city_gen.star_coins.remove(sc)
            sc.enabled = False
            player.speed_bonus += 1  # permanent speed upgrade
            game_state['coins'] += 10
            particle_pool.spawn_sparks(sc.position, count=8)
            print(f"STAR COIN! Speed bonus: +{player.speed_bonus}", flush=True)

    # Star coin animation
    for sc in city_gen.star_coins:
        if sc.enabled:
            sc.rotation_y += 60 * dt
            sc.y = 2.0 + math.sin(time.time() * 3 + sc.x) * 0.3

    # Vehicle-player collision (on foot)
    if player.on_foot:
        for car in traffic_cars:
            d = distance_2d(player.group.position, car.group.position)
            if d < 2.5:
                push = (player.group.position - car.group.position)
                push.y = 0
                if push.length() > 0.01:
                    push = push.normalized()
                    player.group.position += push * 8 * dt

    # HUD update
    hud.update(player, game_state['coins'], traffic_cars,
               mission_mgr, dt)

    # Debug frame log
    fc = game_state['frame_count']
    if fc % 300 == 0:
        print(f"Frame {fc}: pos=({player.group.x:.0f},{player.group.z:.0f}) "
              f"coins={game_state['coins']} state={game_state['state']}",
              flush=True)
