"""
PLAYER - Mario character with fluid platformer physics, procedural animation,
         squash & stretch, coyote time, jump buffering, and variable jump height.
"""
import math
from ursina import *
from utils import *


class Player(Entity):
    """Mario-inspired character with Nintendo-grade game feel."""

    # ── Physics constants ──
    WALK_SPEED       = 6.0
    SPRINT_SPEED     = 11.0
    ACCELERATION     = 40.0      # How fast we reach top speed
    DECELERATION     = 30.0      # How fast we stop when releasing keys
    AIR_ACCEL        = 20.0      # Reduced air control
    AIR_DECEL        = 10.0
    FRICTION_GROUND  = 0.85      # Velocity multiplier each frame on ground
    FRICTION_AIR     = 0.95      # Less friction in air
    JUMP_VELOCITY    = 12.0      # Full jump initial velocity
    SHORT_HOP_VELOCITY = 7.0     # Tap-jump velocity
    GRAVITY          = 28.0
    MAX_FALL_SPEED   = 35.0
    COYOTE_TIME      = 0.15      # Grace period after leaving ledge
    JUMP_BUFFER_TIME = 0.15      # Buffer jump input before landing
    JUMP_HOLD_TIME   = 0.20      # How long holding jump adds upward force
    TURN_SPEED       = 8.0       # How fast character faces movement direction
    BODY_LEAN_MAX    = 12.0      # Max forward tilt in degrees during sprint

    def __init__(self, spawn_point=None):
        super().__init__()

        # ── State ──
        self.on_foot = True
        self.current_car = None
        self.jumping = False
        self.sprinting = False

        # ── Velocity (momentum-based) ──
        self.velocity = Vec3(0, 0, 0)
        self.ground_normal = Vec3(0, 1, 0)

        # ── Jump state ──
        self.jump_hold_timer = 0.0
        self.coyote_timer = 0.0
        self.jump_buffer_timer = 0.0
        self.was_on_ground = True
        self.fall_speed_on_land = 0.0

        # ── Animation state ──
        self.anim_time = 0.0
        self.squash_y = 1.0         # Y scale multiplier for squash/stretch
        self.squash_xz = 1.0        # XZ scale multiplier (inverse of Y)
        self.body_lean = 0.0        # Forward tilt angle
        self.visual_scale = Vec3(1, 1, 1)

        # ── Visual group (the root of all visual parts) ──
        self.group = Entity()

        # ── Build the character model ──
        self._build_model()

        # ── Position ──
        sp = spawn_point or Vec3(0, 1, 0)
        self.group.position = Vec3(sp.x, sp.y, sp.z)
        self.collider = 'box'

    # ════════════════════════════════════════════════════════════
    # CHARACTER MODEL — rounded, expressive, Nintendo-style
    # ════════════════════════════════════════════════════════════
    def _build_model(self):
        g = self.group

        # ── Torso (rounded cube, slightly wider than tall) ──
        self.torso = Entity(
            parent=g, model='cube',
            color=C_MARIO_R,
            scale=(1.0, 1.1, 0.7),
            position=(0, 0.55, 0),
        )
        # ── Overalls (blue, slightly narrower) ──
        self.overalls = Entity(
            parent=g, model='cube',
            color=C_MARIO_B,
            scale=(0.9, 0.85, 0.65),
            position=(0, 0.0, 0),
        )
        # ── Belt / overall strap line ──
        Entity(
            parent=g, model='cube',
            color=color.rgb(60, 40, 15),
            scale=(0.92, 0.08, 0.66),
            position=(0, 0.15, 0),
        )
        # ── Head (sphere, friendly round shape) ──
        self.head = Entity(
            parent=g, model='sphere',
            color=C_MARIO_SK,
            scale=(0.85, 0.85, 0.85),
            position=(0, 1.35, 0),
        )
        # ── Cap (red dome) ──
        self.cap = Entity(
            parent=g, model='sphere',
            color=C_MARIO_R,
            scale=(0.9, 0.45, 0.9),
            position=(0, 1.72, 0),
        )
        # ── Cap brim (flat disc) ──
        Entity(
            parent=g, model='cube',
            color=C_MARIO_R,
            scale=(0.95, 0.1, 0.5),
            position=(0, 1.55, 0.3),
        )
        # ── "M" emblem on cap (small white square) ──
        Entity(
            parent=g, model='cube',
            color=color.rgb(255, 255, 255),
            scale=(0.2, 0.2, 0.05),
            position=(0, 1.75, 0.48),
        )
        # ── Eyes (dark spheres) ──
        self.eye_l = Entity(
            parent=g, model='sphere',
            color=color.rgb(15, 15, 15),
            scale=(0.18, 0.22, 0.15),
            position=(-0.2, 1.4, 0.42),
        )
        self.eye_r = Entity(
            parent=g, model='sphere',
            color=color.rgb(15, 15, 15),
            scale=(0.18, 0.22, 0.15),
            position=(0.2, 1.4, 0.42),
        )
        # ── Nose (small sphere) ──
        Entity(
            parent=g, model='sphere',
            color=C_MARIO_SK,
            scale=(0.2, 0.15, 0.2),
            position=(0, 1.3, 0.55),
        )
        # ── Mustache (rounded cube) ──
        Entity(
            parent=g, model='cube',
            color=color.rgb(50, 30, 10),
            scale=(0.45, 0.1, 0.15),
            position=(0, 1.2, 0.45),
        )
        # ── Left arm ──
        self.arm_l = Entity(
            parent=g, model='cube',
            color=C_MARIO_R,
            scale=(0.3, 0.7, 0.3),
            position=(-0.65, 0.5, 0),
        )
        # ── Right arm ──
        self.arm_r = Entity(
            parent=g, model='cube',
            color=C_MARIO_R,
            scale=(0.3, 0.7, 0.3),
            position=(0.65, 0.5, 0),
        )
        # ── Left glove ──
        self.glove_l = Entity(
            parent=g, model='sphere',
            color=color.rgb(255, 255, 255),
            scale=(0.28, 0.28, 0.28),
            position=(-0.65, 0.05, 0),
        )
        # ── Right glove ──
        self.glove_r = Entity(
            parent=g, model='sphere',
            color=color.rgb(255, 255, 255),
            scale=(0.28, 0.28, 0.28),
            position=(0.65, 0.05, 0),
        )
        # ── Left leg ──
        self.leg_l = Entity(
            parent=g, model='cube',
            color=C_MARIO_B,
            scale=(0.38, 0.6, 0.4),
            position=(-0.25, -0.55, 0),
        )
        # ── Right leg ──
        self.leg_r = Entity(
            parent=g, model='cube',
            color=C_MARIO_B,
            scale=(0.38, 0.6, 0.4),
            position=(0.25, -0.55, 0),
        )
        # ── Left shoe ──
        self.shoe_l = Entity(
            parent=g, model='cube',
            color=C_SHOE,
            scale=(0.42, 0.22, 0.55),
            position=(-0.25, -0.9, 0.05),
        )
        # ── Right shoe ──
        self.shoe_r = Entity(
            parent=g, model='cube',
            color=C_SHOE,
            scale=(0.42, 0.22, 0.55),
            position=(0.25, -0.9, 0.05),
        )

    # ════════════════════════════════════════════════════════════
    # MAIN UPDATE — called every frame
    # ════════════════════════════════════════════════════════════
    def update(self):
        if not self.on_foot and not self.current_car:
            return
        if self.current_car:
            return

        dt = time.dt
        self.anim_time += dt

        # ── Input ──
        move = self._get_input_direction()
        speed = self.SPRINT_SPEED if held_keys['left shift'] else self.WALK_SPEED
        self.sprinting = held_keys['left shift']

        # ── Ground check ──
        is_grounded = self.group.y <= 0.1

        # ── Coyote time ──
        if is_grounded:
            self.coyote_timer = self.COYOTE_TIME
        else:
            self.coyote_timer = max(0, self.coyote_timer - dt)

        # ── Jump buffer ──
        if held_keys['space']:
            self.jump_buffer_timer = self.JUMP_BUFFER_TIME
        else:
            self.jump_buffer_timer = max(0, self.jump_buffer_timer - dt)

        # ── Horizontal movement (momentum-based) ──
        if is_grounded:
            accel = self.ACCELERATION if move.length() > 0.1 else self.DECELERATION
            friction = self.FRICTION_GROUND
        else:
            accel = self.AIR_ACCEL if move.length() > 0.1 else self.AIR_DECEL
            friction = self.FRICTION_AIR

        if move.length() > 0.1:
            # Accelerate toward input direction
            target_vel_x = move.x * speed
            target_vel_z = move.z * speed
            self.velocity.x += (target_vel_x - self.velocity.x) * accel * dt * 0.1
            self.velocity.z += (target_vel_z - self.velocity.z) * accel * dt * 0.1
        else:
            # Decelerate
            self.velocity.x *= friction
            self.velocity.z *= friction

        # ── Jump logic ──
        can_jump = is_grounded or self.coyote_timer > 0
        wants_jump = self.jump_buffer_timer > 0

        if wants_jump and can_jump and not self.jumping:
            # Determine jump type: short hop vs full jump
            if held_keys['space']:
                self.velocity.y = self.JUMP_VELOCITY
            else:
                self.velocity.y = self.SHORT_HOP_VELOCITY
            self.jumping = True
            self.jump_hold_timer = 0.0
            self.coyote_timer = 0.0
            self.jump_buffer_timer = 0.0
            # Squash & stretch: stretch on jump
            self.squash_y = 1.35
            self.squash_xz = 0.8

        # ── Variable jump height: reduce gravity while holding jump ──
        if self.jumping and held_keys['space'] and self.velocity.y > 0:
            self.jump_hold_timer += dt
            if self.jump_hold_timer < self.JUMP_HOLD_TIME:
                # Reduced gravity = higher jump
                self.velocity.y -= self.GRAVITY * 0.4 * dt
            else:
                self.velocity.y -= self.GRAVITY * dt
        else:
            self.velocity.y -= self.GRAVITY * dt

        # ── Max fall speed ──
        self.velocity.y = max(self.velocity.y, -self.MAX_FALL_SPEED)

        # ── Apply velocity ──
        self.group.position += self.velocity * dt

        # ── Ground collision ──
        if self.group.y <= 0:
            # Landing impact
            if not self.was_on_ground and self.fall_speed_on_land > 5.0:
                # Squash on landing (proportional to fall speed)
                impact = min(self.fall_speed_on_land / self.MAX_FALL_SPEED, 1.0)
                self.squash_y = 1.0 - impact * 0.3
                self.squash_xz = 1.0 + impact * 0.2

            self.group.y = 0
            self.velocity.y = 0
            self.jumping = False
            self.was_on_ground = True
        else:
            self.fall_speed_on_land = abs(self.velocity.y)
            self.was_on_ground = False

        # ── World bounds ──
        half = WORLD_SIZE / 2 - 5
        self.group.x = max(-half, min(half, self.group.x))
        self.group.z = max(-half, min(half, self.group.z))

        # ── Face movement direction (snappy turn) ──
        speed_xz = math.sqrt(self.velocity.x ** 2 + self.velocity.z ** 2)
        if speed_xz > 0.5:
            target_angle = math.degrees(math.atan2(self.velocity.x, self.velocity.z))
            self.group.rotation_y = lerp(
                self.group.rotation_y, target_angle, self.TURN_SPEED * dt)

        # ── Body lean during sprint ──
        if speed_xz > self.WALK_SPEED:
            lean_target = self.BODY_LEAN_MAX * min(speed_xz / self.SPRINT_SPEED, 1.0)
            self.body_lean = lerp(self.body_lean, lean_target, 5.0 * dt)
        else:
            self.body_lean = lerp(self.body_lean, 0.0, 5.0 * dt)

        # ── Apply procedural animation ──
        self._animate(dt)

    # ════════════════════════════════════════════════════════════
    # INPUT — camera-relative direction
    # ════════════════════════════════════════════════════════════
    def _get_input_direction(self):
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
        return move

    # ════════════════════════════════════════════════════════════
    # PROCEDURAL ANIMATION — squash & stretch, limb swing, breathing
    # ════════════════════════════════════════════════════════════
    def _animate(self, dt):
        speed_xz = math.sqrt(self.velocity.x ** 2 + self.velocity.z ** 2)
        is_grounded = self.group.y <= 0.1

        # ── Squash & stretch recovery (spring back to 1,1,1) ──
        self.squash_y = lerp(self.squash_y, 1.0, 12.0 * dt)
        self.squash_xz = lerp(self.squash_xz, 1.0, 12.0 * dt)

        # ── Idle breathing (gentle Y bob) ──
        if speed_xz < 0.5 and is_grounded:
            breathe = math.sin(self.anim_time * 2.0) * 0.03
            self.squash_y = 1.0 + breathe
            self.squash_xz = 1.0 - breathe * 0.5

        # ── Apply squash/stretch to the whole group ──
        self.group.scale = Vec3(self.squash_xz, self.squash_y, self.squash_xz)

        # ── Body lean (forward tilt during sprint) ──
        self.group.rotation_x = self.body_lean

        # ── Limb animation ──
        if is_grounded and speed_xz > 0.5:
            # Running: legs and arms swing opposite
            run_speed = speed_xz * 1.8
            swing = math.sin(self.anim_time * run_speed) * 35
            arm_swing = math.sin(self.anim_time * run_speed) * 40

            self.leg_l.rotation_x = swing
            self.leg_r.rotation_x = -swing
            self.arm_l.rotation_x = -arm_swing
            self.arm_r.rotation_x = arm_swing

            # Leg vertical bob
            leg_bob = abs(math.sin(self.anim_time * run_speed)) * 0.1
            self.leg_l.y = -0.55 + leg_bob
            self.leg_r.y = -0.55 + abs(math.sin(self.anim_time * run_speed + math.pi)) * 0.1

            # Shoe follows leg
            self.shoe_l.y = -0.9 + leg_bob
            self.shoe_r.y = -0.9 + abs(math.sin(self.anim_time * run_speed + math.pi)) * 0.1

            # Glove follows arm
            glove_bob = abs(math.sin(self.anim_time * run_speed)) * 0.08
            self.glove_l.y = 0.05 - glove_bob
            self.glove_r.y = 0.05 - abs(math.sin(self.anim_time * run_speed + math.pi)) * 0.08

        elif is_grounded:
            # Idle: gentle arm sway
            sway = math.sin(self.anim_time * 1.5) * 3
            self.leg_l.rotation_x = lerp(self.leg_l.rotation_x, 0, 5.0 * dt)
            self.leg_r.rotation_x = lerp(self.leg_r.rotation_x, 0, 5.0 * dt)
            self.arm_l.rotation_x = lerp(self.arm_l.rotation_x, sway, 3.0 * dt)
            self.arm_r.rotation_x = lerp(self.arm_r.rotation_x, -sway, 3.0 * dt)
            self.leg_l.y = lerp(self.leg_l.y, -0.55, 5.0 * dt)
            self.leg_r.y = lerp(self.leg_r.y, -0.55, 5.0 * dt)
            self.shoe_l.y = lerp(self.shoe_l.y, -0.9, 5.0 * dt)
            self.shoe_r.y = lerp(self.shoe_r.y, -0.9, 5.0 * dt)
            self.glove_l.y = lerp(self.glove_l.y, 0.05, 5.0 * dt)
            self.glove_r.y = lerp(self.glove_r.y, 0.05, 5.0 * dt)
        else:
            # In air: limbs spread out
            self.leg_l.rotation_x = lerp(self.leg_l.rotation_x, -15, 4.0 * dt)
            self.leg_r.rotation_x = lerp(self.leg_r.rotation_x, -15, 4.0 * dt)
            self.arm_l.rotation_x = lerp(self.arm_l.rotation_x, -25, 4.0 * dt)
            self.arm_r.rotation_x = lerp(self.arm_r.rotation_x, -25, 4.0 * dt)
            self.glove_l.y = lerp(self.glove_l.y, 0.15, 4.0 * dt)
            self.glove_r.y = lerp(self.glove_r.y, 0.15, 4.0 * dt)

    # ════════════════════════════════════════════════════════════
    # VEHICLE INTERACTION
    # ════════════════════════════════════════════════════════════
    def try_enter_exit_vehicle(self, traffic_cars_list=None):
        if traffic_cars_list is None:
            return
        if not self.on_foot:
            if self.current_car:
                self.current_car.player_driving = False
                self.current_car.throttle_in = 0
                self.current_car.steer_in = 0
                self.on_foot = True
                pos = self.current_car.group.world_position
                self.current_car = None
                self.group.world_position = pos + camera.forward * 4 + Vec3(0, 0.5, 0)
                self.group.y = 0
                self.velocity = Vec3(0, 0, 0)
        else:
            nearest = None
            nd = 5.0
            for car in traffic_cars_list:
                d = distance_2d(self.group.position, car.group.position)
                if d < nd:
                    nd = d
                    nearest = car
            if nearest:
                self.current_car = nearest
                nearest.player_driving = True
                self.on_foot = False
                self.group.y = -5
                self.velocity = Vec3(0, 0, 0)
