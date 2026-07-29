"""Sprite generation — Mario, hearts, effects."""
import pygame
from .constants import TILE, RED, SKN, BRN, BLU, WHT, YLW, BLK

_mario_cache = {}

def make_mario(big, fire, pose):
    h = TILE * 2 if big else TILE
    w = TILE
    s = pygame.Surface((w, h), pygame.SRCALPHA)
    cap = (248, 64, 0) if fire else RED
    body = WHT if fire else BLU
    if not big:
        pygame.draw.rect(s, SKN, (w // 2 - 5, 0, 10, 10))
        pygame.draw.rect(s, cap, (w // 2 - 6, 0, 12, 5))
        pygame.draw.rect(s, BRN, (w // 2 - 4, 7, 6, 2))
        pygame.draw.rect(s, BLK, (w // 2 + 2, 3, 2, 2))
        pygame.draw.rect(s, body, (w // 2 - 5, 10, 10, 12))
    else:
        pygame.draw.rect(s, SKN, (w // 2 - 5, 0, 10, 12))
        pygame.draw.rect(s, cap, (w // 2 - 6, 0, 12, 6))
        pygame.draw.rect(s, YLW, (w // 2 - 1, 2, 2, 2))
        pygame.draw.rect(s, BLK, (w // 2 + 2, 4, 2, 2))
        pygame.draw.rect(s, BRN, (w // 2 - 3, 9, 6, 2))
        pygame.draw.rect(s, body, (w // 2 - 6, 12, 12, 14))
        pygame.draw.rect(s, BRN, (w // 2 - 5, 24, 10, 2))
        if pose == 3:
            pygame.draw.rect(s, body, (w // 2 - 8, 26, 5, 14))
            pygame.draw.rect(s, body, (w // 2 + 3, 26, 5, 14))
        elif pose == 1:
            pygame.draw.rect(s, body, (w // 2 - 7, 26, 5, 14))
            pygame.draw.rect(s, body, (w // 2 + 1, 28, 5, 12))
        elif pose == 2:
            pygame.draw.rect(s, body, (w // 2 - 6, 28, 5, 12))
            pygame.draw.rect(s, body, (w // 2 + 1, 26, 5, 14))
        else:
            pygame.draw.rect(s, body, (w // 2 - 6, 26, 12, 14))
        if pose in (1, 2):
            if pose == 1:
                pygame.draw.rect(s, body, (w // 2 - 9, 26, 3, 10))
                pygame.draw.circle(s, WHT, (w // 2 - 8, 33), 2)
            else:
                pygame.draw.rect(s, body, (w // 2 + 6, 26, 3, 10))
                pygame.draw.circle(s, WHT, (w // 2 + 7, 33), 2)
        else:
            pygame.draw.rect(s, body, (w // 2 - 8, 26, 3, 10))
            pygame.draw.circle(s, WHT, (w // 2 - 7, 33), 2)
            pygame.draw.rect(s, body, (w // 2 + 5, 26, 3, 10))
            pygame.draw.circle(s, WHT, (w // 2 + 7, 33), 2)
    return s

def get_mario(big, fire, pose):
    key = (big, fire, pose)
    if key not in _mario_cache:
        _mario_cache[key] = make_mario(big, fire, pose)
    return _mario_cache[key]

def make_heart(filled=True):
    s = pygame.Surface((22, 20), pygame.SRCALPHA)
    col = RED if filled else (90, 30, 30)
    pygame.draw.circle(s, col, (6, 7), 5)
    pygame.draw.circle(s, col, (16, 7), 5)
    pts = [(1, 8), (11, 19), (21, 8), (11, 15)]
    pygame.draw.polygon(s, col, pts)
    if filled:
        pygame.draw.circle(s, (252, 180, 180), (4, 5), 2)
    return s

HEART_F = make_heart(True)
HEART_E = make_heart(False)

def preload_all():
    for b in [False, True]:
        for f in [False, True]:
            for p in range(4):
                get_mario(b, f, p)
