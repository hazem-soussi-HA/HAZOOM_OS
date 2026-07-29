"""Entity base class and all entity types."""
import math, random, pygame
from ..constants import (TILE, GRAV, MFALL, WW, WH, SOLID_TILES,
                         ENEMY_GOOMBA, ENEMY_KOOPA, ENEMY_PIRANHA,
                         ENEMY_BULLET, ENEMY_POLICE,
                         POWERUP_MUSHROOM, POWERUP_STAR, POWERUP_FIRE,
                         POWERUP_ONEUP, POWERUP_COIN,
                         COIN_GOLD, GOM, SHELL_GRN, SHELL_BRN, FIRE_RED, FIRE_YLW,
                         STAR_COLOR, MUSHROOM_RED, DUST, YLW, BLK, WHT, RED)


class Entity:
    def __init__(self, x, y, w, h, etype):
        self.x = x; self.y = y; self.w = w; self.h = h
        self.vx = 0; self.vy = 0
        self.type = etype; self.hp = 1
        self.active = True; self.t = 0; self.dir = -1

    def get_rect(self):
        return (self.x, self.y, self.w, self.h)

    def overlaps(self, other):
        return (self.x < other.x + other.w and self.x + self.w > other.x and
                self.y < other.y + other.h and self.y + self.h > other.y)

    def overlaps_rect(self, rx, ry, rw, rh):
        return (self.x < rx + rw and self.x + self.w > rx and
                self.y < ry + rh and self.y + self.h > ry)


class Enemy(Entity):
    TYPES = {
        ENEMY_GOOMBA: {'w': 40, 'h': 40, 'speed': 60, 'score': 100, 'color': GOM},
        ENEMY_KOOPA: {'w': 40, 'h': 56, 'speed': 50, 'score': 200, 'color': SHELL_GRN},
        ENEMY_PIRANHA: {'w': 40, 'h': 48, 'speed': 0, 'score': 200, 'color': (0, 200, 0)},
        ENEMY_BULLET: {'w': 40, 'h': 32, 'speed': 200, 'score': 150, 'color': (0, 0, 0)},
        ENEMY_POLICE: {'w': 36, 'h': 48, 'speed': 120, 'score': 300, 'color': (30, 60, 180)},
    }

    def __init__(self, x, y, etype=ENEMY_GOOMBA):
        cfg = self.TYPES.get(etype, self.TYPES[ENEMY_GOOMBA])
        super().__init__(x, y, cfg['w'], cfg['h'], etype)
        self.cfg = cfg
        self.vx = -cfg['speed']
        self.hp = 2 if etype == ENEMY_KOOPA else 1
        self.shell_mode = False
        self.emerge_timer = 0

    def update(self, dt, lvl):
        if not self.active:
            return
        self.t += dt
        if self.type == ENEMY_PIRANHA:
            self.emerge_timer += dt
            return
        if self.type == ENEMY_BULLET:
            self.x += self.vx * dt
            if self.x < -1000 or self.x > WW * TILE + 1000:
                self.active = False
            return

        self.vy += GRAV * dt
        self.vy = min(self.vy, MFALL)
        self.x += self.vx * dt

        # Wall collision
        check_x = self.x + (self.w if self.vx > 0 else 0)
        tx = int(check_x // TILE)
        for ty in range(int(self.y // TILE), int((self.y + self.h) // TILE) + 1):
            if 0 <= ty < WH and 0 <= tx < WW and lvl[ty][tx] in SOLID_TILES:
                self.vx *= -1; break

        self.y += self.vy * dt
        ty = int((self.y + self.h) // TILE)
        for tx in range(int(self.x // TILE), int((self.x + self.w) // TILE) + 1):
            if 0 <= ty < WH and 0 <= tx < WW and lvl[ty][tx] in SOLID_TILES:
                self.y = ty * TILE - self.h; self.vy = 0; break

        # Edge detection
        edge_tx = int((self.x + (self.w if self.vx > 0 else 0)) // TILE)
        below_ty = int((self.y + self.h + 4) // TILE)
        if 0 <= below_ty < WH and 0 <= edge_tx < WW and lvl[below_ty][edge_tx] == 0:
            self.vx *= -1

        self.x = max(0, min(WW * TILE - self.w, self.x))

    def stomp(self):
        if self.type == ENEMY_KOOPA and not self.shell_mode:
            self.shell_mode = True; self.h = 32; self.vx = 0; self.hp = 1
            return 'shell'
        self.hp -= 1
        if self.hp <= 0:
            self.active = False
            return 'kill'
        return 'hurt'

    def draw(self, screen, cx):
        if not self.active:
            return
        sx = int(self.x - cx); sy = int(self.y)
        if sx < -TILE * 2 or sx > screen.get_width() + TILE * 2:
            return
        if self.type == ENEMY_GOOMBA:
            pygame.draw.ellipse(screen, self.cfg['color'], (sx, sy - self.h // 2, self.w, self.h))
            pygame.draw.rect(screen, self.cfg['color'], (sx + self.w // 4, sy - self.h // 3, self.w // 2, self.h // 3))
            pygame.draw.rect(screen, (0, 0, 0), (sx + self.w // 3, sy - self.h // 3, self.w // 6, self.h // 8))
            pygame.draw.rect(screen, (0, 0, 0), (sx + self.w // 2, sy - self.h // 3, self.w // 6, self.h // 8))
            of = 4 if int(self.t * 4) % 2 == 0 else 0
            pygame.draw.rect(screen, (0, 0, 0), (sx + self.w // 6 + of, sy + self.h // 2 - 4, self.w // 3, self.h // 6))
            pygame.draw.rect(screen, (0, 0, 0), (sx + self.w // 2 - of, sy + self.h // 2 - 4, self.w // 3, self.h // 6))
        elif self.type == ENEMY_KOOPA:
            color = SHELL_BRN if self.shell_mode else self.cfg['color']
            pygame.draw.ellipse(screen, color, (sx, sy - self.h, self.w, self.h))
            pygame.draw.rect(screen, (255, 255, 255), (sx + 4, sy - self.h + 4, self.w - 8, 12))
            if not self.shell_mode:
                pygame.draw.rect(screen, (0, 0, 0), (sx + self.w // 3, sy - self.h // 2, 4, 4))
                pygame.draw.rect(screen, (0, 0, 0), (sx + self.w // 2, sy - self.h // 2, 4, 4))
        elif self.type == ENEMY_POLICE:
            pygame.draw.rect(screen, self.cfg['color'], (sx, sy - self.h, self.w, self.h))
            pygame.draw.rect(screen, (0, 0, 0), (sx + 4, sy - self.h + 4, self.w - 8, 8))
            pygame.draw.rect(screen, (200, 200, 255), (sx + 6, sy - self.h + 14, self.w - 12, 6))
        elif self.type == ENEMY_BULLET:
            pygame.draw.ellipse(screen, (0, 0, 0), (sx, sy - self.h, self.w, self.h))
            pygame.draw.circle(screen, (255, 255, 255), (sx + self.w // 4, sy - self.h // 2), 6)
            pygame.draw.circle(screen, (0, 0, 0), (sx + self.w // 4, sy - self.h // 2), 3)
        else:
            pygame.draw.rect(screen, self.cfg['color'], (sx, sy - self.h, self.w, self.h))


class PowerUp(Entity):
    TYPES = {
        POWERUP_MUSHROOM: {'w': 36, 'h': 36, 'color': MUSHROOM_RED, 'score': 1000},
        POWERUP_STAR: {'w': 36, 'h': 36, 'color': STAR_COLOR, 'score': 2000},
        POWERUP_FIRE: {'w': 36, 'h': 36, 'color': FIRE_RED, 'score': 1000},
        POWERUP_ONEUP: {'w': 36, 'h': 36, 'color': (0, 200, 0), 'score': 0},
        POWERUP_COIN: {'w': 28, 'h': 28, 'color': COIN_GOLD, 'score': 200},
    }

    def __init__(self, x, y, ptype=POWERUP_MUSHROOM):
        cfg = self.TYPES.get(ptype, self.TYPES[POWERUP_MUSHROOM])
        super().__init__(x, y, cfg['w'], cfg['h'], ptype)
        self.cfg = cfg
        self.vx = 80 if ptype != POWERUP_STAR else 120
        self.vy = -200 if ptype != POWERUP_COIN else -300
        self.emerge = True
        self.emerge_y = y - TILE

    def update(self, dt, lvl):
        if not self.active:
            return
        self.t += dt
        if self.emerge:
            self.y += self.vy * dt
            if self.y <= self.emerge_y:
                self.y = self.emerge_y; self.emerge = False; self.vy = 0
            return
        if self.type == POWERUP_COIN:
            self.vy += GRAV * 0.6 * dt
            self.y += self.vy * dt; self.x += self.vx * dt
            if self.y > WH * TILE: self.active = False
            return

        self.vy += GRAV * dt; self.vy = min(self.vy, MFALL)
        self.x += self.vx * dt
        check_x = self.x + (self.w if self.vx > 0 else 0)
        for ty in range(int(self.y // TILE), int((self.y + self.h) // TILE) + 1):
            tx = int(check_x // TILE)
            if 0 <= ty < WH and 0 <= tx < WW and lvl[ty][tx] in SOLID_TILES:
                self.vx *= -1; break
        self.y += self.vy * dt
        ty = int((self.y + self.h) // TILE)
        for tx in range(int(self.x // TILE), int((self.x + self.w) // TILE) + 1):
            if 0 <= ty < WH and 0 <= tx < WW and lvl[ty][tx] in SOLID_TILES:
                self.y = ty * TILE - self.h; self.vy = 0; break

    def draw(self, screen, cx):
        if not self.active: return
        sx = int(self.x - cx); sy = int(self.y)
        if sx < -TILE * 2 or sx > screen.get_width() + TILE * 2: return
        if self.type == POWERUP_MUSHROOM:
            pygame.draw.ellipse(screen, self.cfg['color'], (sx, sy - self.h, self.w, self.h * 3 // 5))
            pygame.draw.rect(screen, (240, 200, 160), (sx + 4, sy - self.h * 2 // 5, self.w - 8, self.h * 2 // 5))
            pygame.draw.circle(screen, (255, 255, 255), (sx + self.w // 3, sy - self.h // 2), 4)
            pygame.draw.circle(screen, (255, 255, 255), (sx + 2 * self.w // 3, sy - self.h // 2), 4)
        elif self.type == POWERUP_STAR:
            angle = self.t * 5; cx_s = sx + self.w // 2; cy_s = sy - self.h // 2
            pts = []
            for i in range(5):
                a = angle + i * 2 * math.pi / 5 - math.pi / 2
                r = self.w // 2 if i % 2 == 0 else self.w // 4
                pts.append((cx_s + r * math.cos(a), cy_s + r * math.sin(a)))
            pygame.draw.polygon(screen, self.cfg['color'], pts)
        elif self.type == POWERUP_FIRE:
            pygame.draw.ellipse(screen, (0, 168, 0), (sx + self.w // 2 - 4, sy - self.h, 8, self.h // 2))
            pygame.draw.circle(screen, FIRE_RED, (sx + self.w // 2, sy - self.h * 3 // 4), 10)
            pygame.draw.circle(screen, FIRE_YLW, (sx + self.w // 2, sy - self.h * 3 // 4), 6)
        elif self.type == POWERUP_ONEUP:
            pygame.draw.ellipse(screen, self.cfg['color'], (sx, sy - self.h, self.w, self.h))
            font = pygame.font.Font(None, 20)
            screen.blit(font.render("1UP", True, (255, 255, 255)), (sx + 4, sy - self.h + 8))
        elif self.type == POWERUP_COIN:
            spin = math.sin(self.t * 18)
            w = max(2, int(self.w // 2 * abs(spin)))
            pygame.draw.ellipse(screen, self.cfg['color'], (sx + self.w // 2 - w // 2, sy - self.h // 2, w, self.h))


class Fireball(Entity):
    def __init__(self, x, y, direction):
        super().__init__(x, y, 16, 16, 'fireball')
        self.vx = 300 * direction; self.vy = -400
        self.bounces = 0; self.max_bounces = 4

    def update(self, dt, lvl):
        if not self.active: return
        self.t += dt; self.vy += GRAV * 0.5 * dt
        self.x += self.vx * dt; self.y += self.vy * dt
        ty = int((self.y + self.h) // TILE); tx = int((self.x + self.w // 2) // TILE)
        if 0 <= ty < WH and 0 <= tx < WW and lvl[ty][tx] in SOLID_TILES:
            self.vy = -350; self.bounces += 1
            if self.bounces > self.max_bounces: self.active = False
        tx2 = int((self.x + (self.w if self.vx > 0 else 0)) // TILE)
        ty2 = int((self.y + self.h // 2) // TILE)
        if 0 <= ty2 < WH and 0 <= tx2 < WW and lvl[ty2][tx2] in SOLID_TILES:
            self.active = False
        if self.x < -200 or self.x > WW * TILE + 200: self.active = False

    def draw(self, screen, cx):
        if not self.active: return
        sx = int(self.x - cx); sy = int(self.y)
        pygame.draw.circle(screen, FIRE_RED, (sx + 8, sy + 8), 8)
        pygame.draw.circle(screen, FIRE_YLW, (sx + 8, sy + 8), 5)
        pygame.draw.circle(screen, (255, 220, 0), (sx + 8, sy + 8), 2)


class MovingPlatform(Entity):
    def __init__(self, x, y, move_range=3 * TILE, speed=60, axis='x'):
        super().__init__(x, y, TILE * 2, TILE // 2, 'platform')
        self.start_x = x; self.start_y = y
        self.move_range = move_range; self.speed = speed; self.axis = axis
        self.vx = speed if axis == 'x' else 0
        self.vy = speed if axis == 'y' else 0

    def update(self, dt, lvl):
        self.t += dt
        if self.axis == 'x':
            self.x += self.vx * dt
            if abs(self.x - self.start_x) > self.move_range: self.vx *= -1
        else:
            self.y += self.vy * dt
            if abs(self.y - self.start_y) > self.move_range: self.vy *= -1

    def draw(self, screen, cx):
        sx = int(self.x - cx); sy = int(self.y)
        pygame.draw.rect(screen, (100, 100, 180), (sx, sy, self.w, self.h))
        pygame.draw.rect(screen, (80, 80, 160), (sx + 2, sy + 2, self.w - 4, self.h - 4))
        pygame.draw.rect(screen, (120, 120, 200), (sx + 4, sy + 4, self.w - 8, 6))
