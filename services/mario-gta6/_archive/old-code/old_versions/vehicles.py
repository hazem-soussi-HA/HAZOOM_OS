"""
VEHICLES - Vehicle class with AI pathfinding, player driving, physics,
           exhaust particles, and damage/consequence system.
"""
import math
import random
from ursina import *
from utils import *

class Vehicle(Entity):
    """A drivable vehicle with AI and player control."""

    def __init__(self, pos, rot_y=0):
        super().__init__()
        self.player_driving = False
        self.speed = 0
        self.throttle_in = 0
        self.steer_in = 0
        self.max_speed = CAR_MAX_SPEED
        self.nitro = 100.0
        self.damage = 0.0  # 0..1, affects max speed
        self.ai_target = None
        self.ai_timer = 0

        c = random.choice(CAR_COLORS)
        self.group = Entity(position=pos)
        self.group.rotation_y = rot_y

        # Chassis
        Entity(parent=self.group, model='cube', color=c,
               scale=(2.2, 0.8, 4.5), position=(0, 0.6, 0))
        # Cabin
        Entity(parent=self.group, model='cube',
               color=color.rgb(60, 60, 70),
               scale=(2.0, 0.7, 2.2), position=(0, 1.3, -0.3))
        # Windshield
        Entity(parent=self.group, model='cube',
               color=color.rgb(150, 200, 240),
               scale=(1.8, 0.6, 0.1), position=(0, 1.3, 0.85))
        # Headlights
        Entity(parent=self.group, model='sphere',
               color=color.rgb(255, 255, 220),
               scale=(0.4, 0.3, 0.2), position=(-0.7, 0.5, 2.28))
        Entity(parent=self.group, model='sphere',
               color=color.rgb(255, 255, 220),
               scale=(0.4, 0.3, 0.2), position=(0.7, 0.5, 2.28))
        # Taillights
        Entity(parent=self.group, model='cube',
               color=color.rgb(255, 40, 40),
               scale=(0.35, 0.2, 0.1), position=(-0.7, 0.5, -2.28))
        Entity(parent=self.group, model='cube',
               color=color.rgb(255, 40, 40),
               scale=(0.35, 0.2, 0.1), position=(0.7, 0.5, -2.28))
        # Wheels
        for wx in [-1.1, 1.1]:
            for wz in [1.4, -1.4]:
                Entity(parent=self.group, model='cube',
                       color=color.rgb(30, 30, 30),
                       scale=(0.35, 0.6, 0.6),
                       position=(wx, 0.3, wz))

    def ai_drive(self):
        """Simple AI: follow roads, random turns."""
        dt = time.dt
        self.throttle_in = 0.5
        self.ai_timer -= dt
        if self.ai_timer <= 0:
            self.steer_in = random.uniform(-0.4, 0.4)
            self.ai_timer = random.uniform(1.0, 3.0)
        else:
            self.steer_in *= 0.97

        # Avoid world edges
        half = WORLD_SIZE / 2 - 30
        if abs(self.group.x) > half:
            self.steer_in = -0.5 if self.group.x > 0 else 0.5
        if abs(self.group.z) > half:
            self.steer_in = 0.3

    def physics(self):
        """Vehicle physics step."""
        dt = time.dt
        effective_max = self.max_speed * (1.0 - self.damage * 0.5)

        # Acceleration
        eff = max(0.1, 1.0 - abs(self.speed) / effective_max * 0.5)
        self.speed += self.throttle_in * CAR_ACCEL * eff * dt

        # Drag
        if not self.player_driving or abs(self.throttle_in) < 0.1:
            drag = 3 + 0.05 * abs(self.speed)
            if self.speed > 0:
                self.speed = max(0, self.speed - drag * dt)
            elif self.speed < 0:
                self.speed = min(0, self.speed + drag * dt)

        self.speed = max(-10, min(self.speed, effective_max))

        # Movement
        self.group.position += self.group.forward * self.speed * dt

        # Steering
        turn_factor = max(0.15, 1.0 - abs(self.speed) / max(effective_max, 1) * 0.5)
        self.group.rotation_y += (
            self.steer_in * CAR_STEER * self.speed * turn_factor * dt * 60
        )

        # World bounds
        half = WORLD_SIZE / 2 - 5
        if abs(self.group.x) > half:
            self.group.x = max(-half, min(half, self.group.x))
            self.speed *= 0.3
        if abs(self.group.z) > half:
            self.group.z = max(-half, min(half, self.group.z))
            self.speed *= 0.3
        self.group.y = 0

    def apply_damage(self, amount):
        """Apply damage, reducing max speed."""
        self.damage = min(1.0, self.damage + amount)

    def repair(self):
        """Repair vehicle (costs coins)."""
        self.damage = 0
