# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Hazem Soussi (HA)
# Super Mario GTA6 — CPU-Optimized Physics

"""
Physics optimization using NumPy vectorization.
Since CUDA is not available on this machine, we optimize the CPU path.
For GPU (CuPy), the same API works by replacing np with cp.
"""

import numpy as np
from typing import List, Dict, Tuple, Optional


class ParticleSystem:
    """
    Vectorized particle system using NumPy arrays.
    Much faster than dict-based particles for large counts.
    """

    def __init__(self, max_particles: int = 10000):
        self.max_particles = max_particles
        self.active_count = 0

        # SoA (Structure of Arrays) layout for cache efficiency
        self.x = np.zeros(max_particles, dtype=np.float32)
        self.y = np.zeros(max_particles, dtype=np.float32)
        self.vx = np.zeros(max_particles, dtype=np.float32)
        self.vy = np.zeros(max_particles, dtype=np.float32)
        self.life = np.zeros(max_particles, dtype=np.float32)
        self.mlife = np.zeros(max_particles, dtype=np.float32)
        self.sz = np.zeros(max_particles, dtype=np.float32)
        self.gravity = np.zeros(max_particles, dtype=np.float32)
        self.kind = np.zeros(max_particles, dtype=np.int32)  # 0=dust, 1=coin, 2=burst
        self.active = np.zeros(max_particles, dtype=np.bool_)

    def spawn(self, x: float, y: float, vx: float, vy: float,
              life: float, sz: float, gravity: float = 0.5, kind: int = 0):
        """Spawn a single particle."""
        # Find first inactive slot
        idx = np.where(~self.active)[0]
        if len(idx) == 0:
            return  # full
        i = idx[0]
        self.x[i] = x
        self.y[i] = y
        self.vx[i] = vx
        self.vy[i] = vy
        self.life[i] = life
        self.mlife[i] = life
        self.sz[i] = sz
        self.gravity[i] = gravity
        self.kind[i] = kind
        self.active[i] = True
        self.active_count += 1

    def spawn_batch(self, x: np.ndarray, y: np.ndarray,
                    vx: np.ndarray, vy: np.ndarray,
                    life: np.ndarray, sz: np.ndarray,
                    gravity: float = 0.5, kind: int = 0):
        """Spawn multiple particles at once."""
        n = len(x)
        inactive = np.where(~self.active)[0]
        if len(inactive) < n:
            n = len(inactive)
        idx = inactive[:n]
        self.x[idx] = x[:n]
        self.y[idx] = y[:n]
        self.vx[idx] = vx[:n]
        self.vy[idx] = vy[:n]
        self.life[idx] = life[:n]
        self.mlife[idx] = life[:n]
        self.sz[idx] = sz[:n]
        self.gravity[idx] = gravity
        self.kind[idx] = kind
        self.active[idx] = True
        self.active_count += n

    def update(self, dt: float, grav_const: float = 2200.0):
        """Update all active particles (vectorized)."""
        if self.active_count == 0:
            return

        mask = self.active
        n = mask.sum()

        # Apply gravity
        self.vy[mask] += grav_const * self.gravity[mask] * dt

        # Update positions
        self.x[mask] += self.vx[mask] * dt
        self.y[mask] += self.vy[mask] * dt

        # Decrease life
        self.life[mask] -= dt

        # Deactivate dead particles
        dead = self.active & (self.life <= 0)
        self.active[dead] = False
        self.active_count = self.active.sum()

    def apply_magnet(self, px: float, py: float, radius: float, force: float, dt: float):
        """Apply coin magnet effect to coin particles."""
        if self.active_count == 0:
            return

        coin_mask = self.active & (self.kind == 1)
        if not coin_mask.any():
            return

        dx = px - self.x[coin_mask]
        dy = (py - 24) - self.y[coin_mask]
        dist = np.sqrt(dx * dx + dy * dy)

        in_range = dist < radius
        if not in_range.any():
            return

        # Apply force toward player
        f = force * (1.0 - dist[in_range] / radius)
        coin_indices = np.where(coin_mask)[0][in_range]
        self.vx[coin_indices] += (dx[in_range] / dist[in_range]) * f * dt
        self.vy[coin_indices] += (dy[in_range] / dist[in_range]) * f * dt - 300 * dt

    def get_active(self) -> Dict[str, np.ndarray]:
        """Get arrays of active particles."""
        mask = self.active
        return {
            'x': self.x[mask],
            'y': self.y[mask],
            'vx': self.vx[mask],
            'vy': self.vy[mask],
            'life': self.life[mask],
            'mlife': self.mlife[mask],
            'sz': self.sz[mask],
            'kind': self.kind[mask],
        }

    def clear(self):
        """Clear all particles."""
        self.active[:] = False
        self.active_count = 0


class TileCollision:
    """
    Optimized tile collision using NumPy broadphase.
    """

    def __init__(self, level: np.ndarray, tile_size: int = 48):
        self.level = level
        self.tile_size = tile_size
        self.height, self.width = level.shape

        # Precompute solid tile positions for broadphase
        self.solid_tiles = np.argwhere(level > 0)

    def check_collision(self, x: float, y: float, w: float, h: float) -> Tuple[bool, int]:
        """Check if AABB collides with any solid tile."""
        ts = self.tile_size
        tx1 = max(0, int(x / ts))
        ty1 = max(0, int(y / ts))
        tx2 = min(self.width - 1, int((x + w) / ts))
        ty2 = min(self.height - 1, int((y + h) / ts))

        for ty in range(ty1, ty2 + 1):
            for tx in range(tx1, tx2 + 1):
                if 0 <= ty < self.height and 0 <= tx < self.width:
                    if self.level[ty, tx] > 0:
                        return True, self.level[ty, tx]
        return False, 0

    def check_line(self, x1: float, y1: float, x2: float, y2: float) -> Optional[Tuple[int, int]]:
        """Bresenham line check for broadphase collision."""
        ts = self.tile_size
        tx1, ty1 = int(x1 / ts), int(y1 / ts)
        tx2, ty2 = int(x2 / ts), int(y2 / ts)

        dx = abs(tx2 - tx1)
        dy = abs(ty2 - ty1)
        sx = 1 if tx1 < tx2 else -1
        sy = 1 if ty1 < ty2 else -1
        err = dx - dy

        while True:
            if 0 <= ty1 < self.height and 0 <= tx1 < self.width:
                if self.level[ty1, tx1] > 0:
                    return (tx1, ty1)
            if tx1 == tx2 and ty1 == ty2:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                tx1 += sx
            if e2 < dx:
                err += dx
                ty1 += sy
        return None
