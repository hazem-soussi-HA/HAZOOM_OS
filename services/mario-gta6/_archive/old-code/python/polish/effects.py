# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Hazem Soussi (HA)
# Super Mario GTA6 — Screen Effects

"""Screen shake, slow-motion, and cinematic camera effects."""

import math
import random
from typing import Tuple


class ScreenShake:
    """Screen shake effect for impacts, explosions, etc."""

    def __init__(self):
        self.intensity: float = 0.0
        self.duration: float = 0.0
        self.timer: float = 0.0
        self.frequency: float = 30.0  # shake frequency in Hz
        self._offset_x: float = 0.0
        self._offset_y: float = 0.0

    def trigger(self, intensity: float = 5.0, duration: float = 0.3):
        """Trigger a screen shake."""
        self.intensity = intensity
        self.duration = duration
        self.timer = 0.0

    def update(self, dt: float) -> Tuple[float, float]:
        """Update shake and return (offset_x, offset_y)."""
        if self.timer >= self.duration:
            self.intensity = 0.0
            return (0.0, 0.0)

        self.timer += dt
        progress = self.timer / self.duration
        decay = 1.0 - progress

        # Perlin-like noise using sin
        t = self.timer * self.frequency
        self._offset_x = math.sin(t * 7.3) * self.intensity * decay
        self._offset_y = math.cos(t * 5.7) * self.intensity * decay

        return (self._offset_x, self._offset_y)

    def is_active(self) -> bool:
        return self.timer < self.duration


class SlowMotion:
    """Slow-motion effect for dramatic moments."""

    def __init__(self):
        self.scale: float = 1.0  # 1.0 = normal, 0.5 = half speed
        self.duration: float = 0.0
        self.timer: float = 0.0
        self._target_scale: float = 1.0

    def trigger(self, scale: float = 0.3, duration: float = 2.0):
        """Trigger slow-motion."""
        self._target_scale = scale
        self.duration = duration
        self.timer = 0.0
        self.scale = scale

    def update(self, dt: float) -> float:
        """Update and return current time scale."""
        if self.timer >= self.duration:
            self.scale = 1.0
            return 1.0

        self.timer += dt
        progress = self.timer / self.duration

        # Smooth ease-out back to normal
        if progress > 0.7:
            t = (progress - 0.7) / 0.3
            self.scale = self._target_scale + (1.0 - self._target_scale) * t

        return self.scale

    def is_active(self) -> bool:
        return self.timer < self.duration


class CinematicCamera:
    """Cinematic camera with lookahead and smooth follow."""

    def __init__(self, screen_width: int = 1280):
        self.screen_width = screen_width
        self.lookahead: float = 200.0  # pixels to look ahead
        self.smoothness: float = 8.0  # lerp speed
        self.deadzone: float = 50.0  # player can move this far before camera follows
        self.current_x: float = 0.0
        self.target_x: float = 0.0

    def update(self, player_x: float, player_vx: float, dt: float, level_width: float) -> float:
        """Update camera position."""
        # Lookahead based on player velocity
        direction = 1 if player_vx > 0 else -1 if player_vx < 0 else 0
        lookahead = self.lookahead * direction

        # Target is player position + lookahead, centered on screen
        self.target_x = player_x - self.screen_width / 3 + lookahead
        self.target_x = max(0, min(level_width - self.screen_width, self.target_x))

        # Smooth follow
        self.current_x += (self.target_x - self.current_x) * min(self.smoothness * dt, 1.0)

        return self.current_x

    def apply_shake(self, shake: ScreenShake, dt: float) -> float:
        """Apply screen shake offset to camera."""
        ox, oy = shake.update(dt)
        return self.current_x + ox


class Minimap:
    """Minimap renderer showing level overview."""

    def __init__(self, width: int = 200, height: int = 40):
        self.width = width
        self.height = height
        self.margin = 10

    def draw(self, surface, game):
        """Draw minimap on the given pygame surface."""
        import pygame

        # Background
        bg = pygame.Surface((self.width, self.height), pygame.SRCALPHA)
        bg.fill((0, 0, 0, 128))
        x = surface.get_width() - self.width - self.margin
        y = self.margin
        surface.blit(bg, (x, y))

        # Level tiles
        level_w = len(game.lvl[0]) if game.lvl else 200
        level_h = len(game.lvl) if game.lvl else 15
        tile_w = self.width / level_w
        tile_h = self.height / level_h

        for ty, row in enumerate(game.lvl):
            for tx, tile in enumerate(row):
                if tile > 0:
                    color = (100, 100, 100) if tile == 1 else (150, 75, 0)
                    rect = pygame.Rect(
                        x + tx * tile_w,
                        y + ty * tile_h,
                        max(1, tile_w),
                        max(1, tile_h)
                    )
                    pygame.draw.rect(surface, color, rect)

        # Player dot
        px = x + (game.px / (level_w * 48)) * self.width
        py = y + (game.py / (level_h * 48)) * self.height
        pygame.draw.circle(surface, (255, 0, 0), (int(px), int(py)), 3)

        # Camera view rectangle
        cam_x = game.cam / (level_w * 48) * self.width
        cam_w = 1280 / (level_w * 48) * self.width
        view_rect = pygame.Rect(x + cam_x, y, cam_w, self.height)
        pygame.draw.rect(surface, (255, 255, 255), view_rect, 1)
