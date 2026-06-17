"""
HUD - Heads-up display: speed, coins, mission progress, timer,
      minimap, mission markers, and menu screens.
      Mario Party aesthetic — bold text with dark drop shadows.
"""
import math
from ursina import *
from utils import *


class GameCamera:
    """Third-person camera — uses player rotation_y for stable positioning."""

    def __init__(self, player):
        self.player = player
        self.mode = 'close'
        self.fov_base = 70
        self._initialized = False

    def _init_camera(self):
        pos = self.player.group.position
        camera.world_position = (pos.x, pos.y + 5, pos.z - 10)
        camera.look_at((pos.x, pos.y + 1, pos.z))
        camera.rotation_z = 0
        camera.fov = self.fov_base
        self._initialized = True

    def update(self):
        if not self.player or not self._initialized:
            if not self._initialized:
                self._init_camera()
            return

        # Target: player or car
        if not self.player.on_foot and self.player.current_car:
            target = self.player.current_car.group
            dist = 14.0
            height = 6.0
        else:
            target = self.player.group
            dist = 8.0
            height = 5.0

        tp = target.world_position

        # Use player's rotation_y for camera offset (stable, no quaternion issues)
        angle_rad = math.radians(target.rotation_y)
        cam_x = tp.x - math.sin(angle_rad) * dist
        cam_z = tp.z - math.cos(angle_rad) * dist
        cam_y = tp.y + height

        # Smooth follow on position
        cp = camera.world_position
        t = min(8.0 * time.dt, 1.0)
        camera.world_position = (
            cp.x + (cam_x - cp.x) * t,
            cp.y + (cam_y - cp.y) * t,
            cp.z + (cam_z - cp.z) * t,
        )

        # Look at target, then LOCK roll to keep horizon flat
        camera.look_at((tp.x, tp.y + 1.2, tp.z))
        camera.rotation_z = 0

        # Dynamic FOV when driving
        if not self.player.on_foot and self.player.current_car:
            spd = abs(self.player.current_car.speed)
            target_fov = self.fov_base + (90 - self.fov_base) * min(spd / CAR_MAX_SPEED, 1.0)
            camera.fov = camera.fov + (target_fov - camera.fov) * 3.0 * time.dt


class HUD:
    """Full game HUD with Mario Party aesthetic — bold text + drop shadows."""

    def __init__(self):
        # ── Helper: create text with drop shadow ──
        def mk_shadow_text(text, pos, scale, text_color, shadow_offset=(0.004, -0.004)):
            shadow = Text(
                text=text,
                position=(pos[0] + shadow_offset[0], pos[1] + shadow_offset[1]),
                origin=(-0.5, 0),
                scale=scale,
                color=color.rgba(0, 0, 0, 200),
            )
            main = Text(
                text=text,
                position=pos,
                origin=(-0.5, 0),
                scale=scale,
                color=text_color,
            )
            return shadow, main

        # ── Speed text (bottom-left) ──
        self.speed_shadow, self.speed_text = mk_shadow_text(
            'WALKING', (-0.85, -0.40), 2.0, color.white)

        # ── Coin counter (top-right) ──
        self.coin_shadow, self.coin_text = mk_shadow_text(
            'COINS: 0', (0.52, 0.47), 2.2, color.rgb(255, 220, 60))

        # ── Coin icon ──
        self.coin_icon = Entity(
            parent=camera.ui, model='sphere',
            color=color.rgb(255, 200, 0),
            scale=(0.018, 0.018, 0.018),
            position=(0.38, 0.47),
        )

        # ── Car prompt (center-bottom) ──
        self.car_prompt_shadow, self.car_prompt = mk_shadow_text(
            '', (0, -0.32), 1.8, color.rgb(255, 255, 100))

        # ── Status text (bottom-left, small) ──
        self.status_text = Text(
            text='WASD: Move | SHIFT: Sprint | SPACE: Jump | F: Car',
            position=(-0.85, -0.47),
            origin=(-0.5, 0),
            scale=1.0,
            color=color.rgba(200, 200, 200, 220),
        )

        # ── Minimap (top-left) ──
        mm_size = 0.16
        mm_a = 160
        self.mm_bg = Entity(parent=camera.ui, model='quad',
            color=color.rgba(0, 0, 0, mm_a),
            scale=(mm_size + 0.015, mm_size + 0.015),
            position=(-0.82, 0.36), origin=(-0.5, 0.5))
        self.mm_plane = Entity(parent=camera.ui, model='quad',
            color=color.rgba(40, 80, 40, mm_a),
            scale=(mm_size, mm_size),
            position=(-0.82, 0.36), origin=(-0.5, 0.5))
        self.mm_player = Entity(parent=camera.ui, model='quad',
            color=color.rgb(0, 255, 100),
            scale=(0.014, 0.014),
            position=(-0.82, 0.36), origin=(-0.5, 0.5))

        # ── Mission HUD (top-center) ──
        self.mission_name_shadow, self.mission_name = mk_shadow_text(
            '', (0, 0.42), 2.5, color.rgb(255, 200, 50))
        self.mission_timer_shadow, self.mission_timer = mk_shadow_text(
            '', (0, 0.37), 2.0, color.rgb(255, 100, 100))
        self.mission_progress_shadow, self.mission_progress = mk_shadow_text(
            '', (0, 0.33), 1.5, color.rgb(100, 255, 100))

        # ── Mission progress bar ──
        self.mission_bar_bg = Entity(parent=camera.ui, model='quad',
            color=color.rgba(30, 30, 30, 180),
            scale=(0.26, 0.014), position=(0, 0.30), origin=(0, 0.5))
        self.mission_bar = Entity(parent=camera.ui, model='quad',
            color=color.rgb(255, 200, 50),
            scale=(0.25, 0.012), position=(0, 0.30), origin=(-0.5, 0.5))

        # ── Menu ──
        self.menu_bg = Entity(parent=camera.ui, model='quad',
            color=color.rgba(0, 0, 0, 200), scale=(2, 2),
            position=(0, 0), enabled=False)
        self.menu_title_shadow = Text(
            text='SUPER MARIO GTA6',
            position=(0.004, 0.204), origin=(0, 0), scale=4.5,
            color=color.rgba(0, 0, 0, 200), enabled=False)
        self.menu_title = Text(
            text='SUPER MARIO GTA6',
            position=(0, 0.2), origin=(0, 0), scale=4.5,
            color=color.rgb(255, 220, 80), enabled=False)
        self.menu_subtitle = Text(
            text='v1.0.0 — Press ENTER to start',
            position=(0, 0.05), origin=(0, 0), scale=2,
            color=color.white, enabled=False)
        self.menu_controls = Text(
            text='WASD: Move | SHIFT: Sprint | SPACE: Jump\n'
                 'F: Enter/Exit Car | C: Camera | M: Map\n'
                 'ESC: Quit | T: Honk',
            position=(0, -0.15), origin=(0, 0), scale=1.3,
            color=color.rgba(200, 200, 200), enabled=False)
        self.menu_credits = Text(
            text='A Fan Game — Not affiliated with Nintendo or Rockstar',
            position=(0, -0.45), origin=(0, 0), scale=0.9,
            color=color.rgba(120, 120, 120), enabled=False)

    def show_menu(self):
        for attr in ('menu_bg', 'menu_title', 'menu_title_shadow',
                     'menu_subtitle', 'menu_controls', 'menu_credits'):
            getattr(self, attr).enabled = True

    def hide_menu(self):
        for attr in ('menu_bg', 'menu_title', 'menu_title_shadow',
                     'menu_subtitle', 'menu_controls', 'menu_credits'):
            getattr(self, attr).enabled = False

    def update(self, player, coin_score, traffic_cars, mission_mgr, game_state_dt):
        """Called every frame."""
        # ── Speed ──
        if not player.on_foot and player.current_car:
            kmh = int(abs(player.current_car.speed) * 3.6)
            self.speed_text.text = f'{kmh} KM/H'
            self.speed_shadow.text = self.speed_text.text
            self.speed_text.color = color.rgb(255, 255, 100)
            self.status_text.text = 'C: Camera | F: Exit | SHIFT: Nitro | SPACE: Brake'
        else:
            self.speed_text.text = 'SPRINTING' if player.sprinting else 'WALKING'
            self.speed_shadow.text = self.speed_text.text
            self.speed_text.color = color.white

            # Nearby car check
            near = None
            nd = 5.0
            for car in traffic_cars:
                d = distance_2d(player.group.position, car.group.position)
                if d < nd:
                    nd = d
                    near = car
            if near:
                self.car_prompt.text = 'PRESS F TO ENTER'
                self.car_prompt_shadow.text = self.car_prompt.text
                self.status_text.text = 'SHIFT: Sprint | SPACE: Jump | C: Camera'
            else:
                self.car_prompt.text = ''
                self.status_text.text = 'SHIFT: Sprint | SPACE: Jump | C: Camera'

        # ── Coins ──
        self.coin_text.text = f'COINS: {coin_score}'
        self.coin_shadow.text = self.coin_text.text

        # ── Minimap ──
        mm_size = 0.16
        px = -0.82 + (player.group.x / WORLD_SIZE) * mm_size
        py = 0.36 + (player.group.z / WORLD_SIZE) * mm_size
        self.mm_player.position = (px, py)

        # ── Mission HUD ──
        if mission_mgr.active_mission:
            m = mission_mgr.active_mission
            self.mission_name.text = m['name']
            self.mission_name_shadow.text = m['name']
            self.mission_timer.text = f'TIME: {int(mission_mgr.timer)}s'
            self.mission_timer_shadow.text = self.mission_timer.text
            self.mission_progress.text = f'{mission_mgr.progress}/{m["target"]}'
            self.mission_progress_shadow.text = self.mission_progress.text
            frac = min(mission_mgr.progress / max(m['target'], 1), 1.0)
            self.mission_bar.scale_x = 0.25 * frac
            if mission_mgr.timer < 10:
                self.mission_timer.color = color.rgb(255, 50, 50)
            elif mission_mgr.timer < 20:
                self.mission_timer.color = color.rgb(255, 150, 50)
            else:
                self.mission_timer.color = color.rgb(100, 255, 100)
        else:
            for attr in ('mission_name', 'mission_timer', 'mission_progress'):
                getattr(self, attr).text = ''
                getattr(self, attr + '_shadow').text = ''
            self.mission_bar.scale_x = 0
