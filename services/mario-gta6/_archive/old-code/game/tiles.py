"""Tile cache and tile rendering."""
import pygame
from .constants import (TILE, T_EMPTY, T_GROUND, T_BRICK, T_QUESTION,
                        T_PIPE_L, T_PIPE_R, T_PIPE_TL, T_PIPE_TR, T_USED,
                        T_DIRT, T_SPIKE, T_SPRING, T_FLAG, T_CHECKPOINT,
                        T_PLATFORM, T_COIN, SOLID_TILES)

# Colors
SKY = (92, 148, 252); BLK = (0, 0, 0); WHT = (255, 255, 255)
RED = (200, 30, 30); SKN = (248, 184, 120); BRN = (128, 64, 0)
BLU = (30, 60, 200); GRN = (0, 168, 0); YLW = (255, 220, 0)
GRD = (200, 76, 12); BRC = (184, 40, 24); BLK2 = (228, 160, 32)
GOM = (164, 100, 36); PIP = (0, 168, 0); PI2 = (0, 120, 0); PIL = (100, 220, 100)
DUST = (232, 216, 184); PINK = (252, 96, 180)
SPIKE_COL = (120, 120, 130); SPRING_COL = (255, 200, 0); FLAG_COL = (0, 200, 0)
COIN_GOLD = (255, 215, 0)

_tile_cache = {}

def get_tile_surface(k):
    """Get or create a tile surface. Cached for performance."""
    if k in _tile_cache:
        return _tile_cache[k]
    t = None
    if k == T_EMPTY:
        t = None
    elif k == T_GROUND:
        t = pygame.Surface((TILE, TILE)); t.fill(GRD)
        pygame.draw.rect(t, (0, 120, 0), (0, 0, TILE, 6))
        pygame.draw.rect(t, (152, 56, 0), (8, 16, 16, 16))
    elif k == T_BRICK:
        t = pygame.Surface((TILE, TILE)); t.fill(BRC)
        for i in range(4):
            pygame.draw.line(t, (136, 28, 16), (0, i * 12 + 12), (TILE, i * 12 + 12), 2)
    elif k == T_QUESTION:
        t = pygame.Surface((TILE, TILE)); t.fill(BLK2)
        pygame.draw.rect(t, (180, 120, 24), (2, 2, TILE - 4, TILE - 4))
        pygame.draw.rect(t, YLW, (TILE // 2 - 6, TILE // 4, 12, 12))
    elif k == T_PIPE_L:
        t = pygame.Surface((TILE, TILE)); t.fill(PIP)
        pygame.draw.rect(t, PIL, (0, 0, TILE // 6, TILE))
    elif k == T_PIPE_R:
        t = pygame.Surface((TILE, TILE)); t.fill(PIP)
        pygame.draw.rect(t, PI2, (TILE - TILE // 6, 0, TILE // 6, TILE))
    elif k == T_PIPE_TL:
        t = pygame.Surface((TILE, TILE)); t.fill(PIP)
        pygame.draw.rect(t, PIL, (0, 0, TILE // 6, TILE))
        pygame.draw.rect(t, (0, 200, 0), (0, 0, TILE, 8))
    elif k == T_PIPE_TR:
        t = pygame.Surface((TILE, TILE)); t.fill(PIP)
        pygame.draw.rect(t, PI2, (TILE - TILE // 6, 0, TILE // 6, TILE))
        pygame.draw.rect(t, (0, 200, 0), (0, 0, TILE, 8))
    elif k == T_USED:
        t = pygame.Surface((TILE, TILE)); t.fill((100, 70, 20))
        pygame.draw.rect(t, (80, 50, 10), (2, 2, TILE - 4, TILE - 4))
    elif k == T_DIRT:
        t = pygame.Surface((TILE, TILE)); t.fill((140, 100, 20))
    elif k == T_SPIKE:
        t = pygame.Surface((TILE, TILE), pygame.SRCALPHA)
        for i in range(4):
            pts = [(i * 12, TILE), (i * 12 + 6, 8), (i * 12 + 12, TILE)]
            pygame.draw.polygon(t, SPIKE_COL, pts)
    elif k == T_SPRING:
        t = pygame.Surface((TILE, TILE), pygame.SRCALPHA)
        t.set_colorkey((0, 0, 0))
        pygame.draw.rect(t, SPRING_COL, (8, TILE - 16, TILE - 16, 16))
        pygame.draw.rect(t, (200, 150, 0), (12, TILE - 24, TILE - 24, 12))
        pygame.draw.rect(t, YLW, (16, TILE - 8, TILE - 32, 8))
    elif k == T_FLAG:
        t = pygame.Surface((TILE, TILE), pygame.SRCALPHA)
        pygame.draw.rect(t, (150, 150, 150), (20, 0, 4, TILE))
        pygame.draw.polygon(t, FLAG_COL, [(24, 4), (44, 14), (24, 24)])
    elif k == T_CHECKPOINT:
        t = pygame.Surface((TILE, TILE), pygame.SRCALPHA)
        pygame.draw.rect(t, (100, 100, 100), (20, 0, 4, TILE))
        pygame.draw.polygon(t, YLW, [(24, 0), (34, 10), (24, 20)])
    elif k == T_PLATFORM:
        t = pygame.Surface((TILE, TILE)); t.fill((100, 100, 180))
        pygame.draw.rect(t, (80, 80, 160), (2, 2, TILE - 4, TILE - 4))
        pygame.draw.rect(t, (120, 120, 200), (4, 4, TILE - 8, 8))
    elif k == T_COIN:
        t = pygame.Surface((TILE, TILE), pygame.SRCALPHA)
        t.set_colorkey((0, 0, 0))
        pygame.draw.circle(t, COIN_GOLD, (TILE // 2, TILE // 2), 14)
        pygame.draw.circle(t, (255, 240, 140), (TILE // 2 - 2, TILE // 2 - 2), 4)
    _tile_cache[k] = t
    return t

def is_solid(tile_type):
    return tile_type in SOLID_TILES

def preload_all():
    for k in range(16):
        get_tile_surface(k)
