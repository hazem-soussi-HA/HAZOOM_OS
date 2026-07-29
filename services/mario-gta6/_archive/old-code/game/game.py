"""
SUPER MARIO GTA6 — V3.0.0 Unified Game Class
Orchestrates all systems: physics, collision, entities, particles, camera, HUD, GTA.
"""
import math, random, pygame
from .constants import *
from .tiles import get_tile_surface, is_solid, preload_all as preload_tiles
from .sprites import get_mario, HEART_F, HEART_E, preload_all as preload_sprites
from .collision import player_tile_collision
from .entities import Enemy, PowerUp, Fireball, MovingPlatform
from .systems import (ParticlePool, Camera, ScreenEffects, WantedSystem,
                       save_game, load_game, SAVE_DIR)
from .level import parse_level, LEVELS


class Game:
    def __init__(self, level_idx=0):
        self.level_idx = level_idx
        self.lvl = parse_level(LEVELS[level_idx] if level_idx < len(LEVELS) else LEVELS[0])

        # Systems
        self.particles = ParticlePool(500)
        self.camera = Camera()
        self.effects = ScreenEffects()
        self.wanted = WantedSystem()

        # Entities
        self.entities = []
        self.cars = []
        for _ in range(3):
            self.cars.append({
                'x': random.randint(50, WW - 5) * TILE, 'y': (WH - 3) * TILE,
                'vx': 30, 'color': random.choice([(220, 40, 40), (40, 100, 220), (255, 200, 40)])
            })

        # Game state
        self.coins = 0; self.score = 0; self.time = 400; self.lives = 3
        self.max_lives = 3; self.game_over = False; self.level_complete = False
        self.paused = False
        self.hud_pulse = 0.0; self.hud_flash = 0.0; self.hud_score_pulse = 0.0
        self.hud_fade = 0.0; self.combo = 0; self.combo_timer = 0.0

        # Player state
        self.px = 3 * TILE; self.py = (WH - 3) * TILE
        self.pvx = 0; self.pvy = 0; self.p_dir = 1; self.p_mode = MODE_SMALL
        self.p_inv = 0; self.p_star = 0; self.p_air = True; self.p_jmp = False
        self.p_sq_y = 1.0; self.p_sq_x = 1.0; self.p_coyote = 0
        self.p_jbuf = 0; self.p_jhold = 0; self.p_was_g = True
        self.p_anim = 0; self.p_step_t = 0.0
        self.p_on_car = False; self.p_car = None; self.p_can_shoot = True

        self._spawn_enemies()

    def _spawn_enemies(self):
        self.entities = []
        for tx in range(WW):
            for ty in range(WH):
                if self.lvl[ty][tx] == T_DIRT and random.random() < 0.3:
                    etype = random.choice([ENEMY_GOOMBA, ENEMY_GOOMBA, ENEMY_KOOPA])
                    self.entities.append(Enemy(tx * TILE, (ty - 1) * TILE, etype))
        for ex in [20, 21, 35, 36, 50, 51, 65, 66, 80, 81]:
            if random.random() < 0.7:
                etype = random.choice([ENEMY_GOOMBA, ENEMY_GOOMBA, ENEMY_KOOPA])
                self.entities.append(Enemy(ex * TILE, (WH - 3) * TILE, etype))

    def get_player_rect(self):
        ph = PH_BIG if self.p_mode > 0 else PH_SMALL
        return (self.px, self.py - ph, PW, ph)

    def run(self, dt, keys):
        if self.game_over or self.level_complete:
            self.hud_fade = max(0, self.hud_fade - dt * 1.5); return
        if self.paused: return

        dt *= self.effects.update(dt)
        self.hud_fade = min(1.0, self.hud_fade + dt * 1.5)
        self.hud_pulse = max(0, self.hud_pulse - dt * 2.5)
        self.hud_flash = max(0, self.hud_flash - dt * 3.0)
        self.hud_score_pulse = max(0, self.hud_score_pulse - dt * 2.0)
        self.time -= dt; self.p_anim += dt
        if self.p_star > 0: self.p_star -= dt
        if self.p_inv > 0: self.p_inv -= dt
        if self.combo_timer > 0: self.combo_timer -= dt
        if self.combo_timer <= 0: self.combo = 0
        self.wanted.update(dt)

        # Input
        ax = 0
        if keys[pygame.K_a] or keys[pygame.K_LEFT]: ax = -1
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]: ax = 1
        jmp = keys[pygame.K_SPACE] or keys[pygame.K_w] or keys[pygame.K_UP]
        run = keys[pygame.K_LSHIFT] or keys[pygame.K_RSHIFT]
        shoot = keys[pygame.K_x] or keys[pygame.K_RCTRL]
        spd = RUN if run else WALK
        ph = PH_BIG if self.p_mode > 0 else PH_SMALL
        ground_y = (WH - 3) * TILE - ph

        # Physics
        self.p_air = self.py < ground_y
        if ax:
            accel = AG if not self.p_air else AY * 0.6
            self.pvx += (ax * spd - self.pvx) * min(accel * dt, 1.0)
            self.p_dir = 1 if ax > 0 else 0
        else:
            if not self.p_air: self.pvx *= max(0, 1 - DG * dt)
            else: self.pvx *= max(0, 1 - DA * dt)
            if abs(self.pvx) < 5: self.pvx = 0

        if self.p_air: self.p_coyote = max(0, self.p_coyote - dt)
        else: self.p_coyote = COYOTE
        if jmp: self.p_jbuf = JBUF
        else: self.p_jbuf = max(0, self.p_jbuf - dt)

        can_jmp = not self.p_air or self.p_coyote > 0
        if self.p_jbuf > 0 and can_jmp and not self.p_jmp:
            self.pvy = JVEL if jmp else SHOP; self.p_jmp = True
            self.p_coyote = 0; self.p_jbuf = 0; self.p_jhold = 0
            self.p_sq_y = 0.7; self.p_sq_x = 1.3
            if not self.p_on_car:
                for _ in range(6):
                    self.particles.spawn(self.px + random.uniform(-10, 10), ground_y,
                                         random.uniform(-90, 90), random.uniform(-60, 10),
                                         DUST, random.uniform(0.25, 0.55), random.randint(4, 8))

        if self.p_jmp and jmp and self.pvy < 0:
            self.p_jhold += dt; self.pvy += GRAV * (0.4 if self.p_jhold < JHOLD else 1.0) * dt
        elif self.p_air: self.pvy += GRAV * dt
        self.pvy = min(self.pvy, MFALL)

        # Move with collision
        self.px += self.pvx * dt
        self.px, self.py, hg, hc, hl, hr = player_tile_collision(self.px, self.py, PW, ph, self.lvl, self.pvy, WW, WH)
        if hg: self.pvy = 0; self.p_jmp = False
        if hc: self.pvy = 50

        self.py += self.pvy * dt
        self.px, self.py, hg, hc, hl, hr = player_tile_collision(self.px, self.py, PW, ph, self.lvl, self.pvy, WW, WH)

        if hg and not self.p_was_g and self.pvy > 200:
            imp = min(self.pvy / 800, 1.0)
            self.p_sq_y = 1.0 + imp * 0.4; self.p_sq_x = 1.0 - imp * 0.25
            if not self.p_on_car:
                for _ in range(int(6 * (0.6 + 0.6 * imp))):
                    self.particles.spawn(self.px + random.uniform(-10, 10), ground_y,
                                         random.uniform(-90, 90) * imp, random.uniform(-60, 10),
                                         DUST, random.uniform(0.25, 0.55), random.randint(4, 8))
            self.camera.trigger_shake(imp * 3, 0.15)
        if hg: self.pvy = 0; self.p_jmp = False; self.p_was_g = True
        else: self.p_was_g = False

        # Footsteps
        if not self.p_air and not self.p_on_car and abs(self.pvx) > 40:
            cadence = FOOTSTEP_RUN if (run and abs(self.pvx) > WALK * 0.95) else FOOTSTEP_GRD
            self.p_step_t += dt
            if self.p_step_t >= cadence:
                self.p_step_t = 0
                for _ in range(2):
                    self.particles.spawn(self.px + (-10 if self.p_dir < 1 else 10) + random.uniform(-4, 4),
                                         ground_y + random.uniform(-3, 2),
                                         random.uniform(-25, 25) + (-self.p_dir * 40),
                                         random.uniform(-15, 5), DUST, random.uniform(0.18, 0.35),
                                         random.randint(2, 4), gravity=0.20)
        else: self.p_step_t = FOOTSTEP_GRD * 0.5

        self.p_sq_y += (1 - self.p_sq_y) * 15 * dt
        self.p_sq_x += (1 - self.p_sq_x) * 15 * dt
        self.px = max(0, min(WW * TILE - PW, self.px))

        # Head bump
        htx = int(self.px // TILE); hty = int((self.py - ph) // TILE)
        if 0 <= htx < WW and 0 <= hty < WH:
            ht = self.lvl[hty][htx]
            if is_solid(ht) and self.py - ph < hty * TILE:
                self.pvy = 50
                if ht == T_QUESTION:
                    self.coins += 1; self.score += 200
                    self.lvl[hty][htx] = T_USED
                    if self.p_mode == MODE_SMALL:
                        self.entities.append(PowerUp(htx * TILE, (hty - 1) * TILE, POWERUP_MUSHROOM))
                    else:
                        self.entities.append(PowerUp(htx * TILE, (hty - 1) * TILE, POWERUP_FIRE))
                    for _ in range(6):
                        self.particles.spawn(htx * TILE + TILE // 2 + random.uniform(-8, 8),
                                             hty * TILE + random.uniform(-4, 4),
                                             random.uniform(-60, 60), -260, YLW, 0.7, 10, 'coin', 0.6)
                    self.hud_pulse = 1.0; self.hud_score_pulse = 1.0
                elif ht == T_COIN:
                    self.coins += 1; self.score += 200; self.lvl[hty][htx] = T_EMPTY
                    self.hud_pulse = 1.0

        # Fireball
        if shoot and self.p_mode == MODE_FIRE and self.p_can_shoot:
            self.p_can_shoot = False
            fb_x = self.px + (PW if self.p_dir == 1 else -16)
            fb_y = self.py - ph // 2
            self.entities.append(Fireball(fb_x, fb_y, 1 if self.p_dir == 1 else -1))
        if not shoot: self.p_can_shoot = True

        # Entity update
        for e in self.entities:
            if isinstance(e, (Enemy, PowerUp, Fireball, MovingPlatform)):
                e.update(dt, self.lvl)

        # Player-entity collision
        player_rect = self.get_player_rect()
        for e in self.entities:
            if not e.active: continue
            if isinstance(e, Enemy) and e.overlaps_rect(*player_rect):
                if self.pvy > 0 and self.py < e.y - e.h // 2:
                    result = e.stomp(); self.pvy = JVEL * 0.6
                    self.score += e.cfg['score']; self.combo += 1; self.combo_timer = 2.0
                    self.camera.trigger_shake(3, 0.2)
                    if result == 'kill':
                        for _ in range(8):
                            self.particles.spawn(e.x, e.y, random.uniform(-150, 150),
                                                 random.uniform(-300, -50), e.cfg['color'],
                                                 random.uniform(0.3, 0.8), random.randint(3, 8), 'burst', 0.5)
                        self.wanted.add_heat(5)
                elif self.p_star > 0 or self.p_inv > 0:
                    e.active = False; self.score += e.cfg['score']
                else:
                    if self.p_mode > 0:
                        self.p_mode = MODE_SMALL; self.p_inv = 2.0
                        self.camera.trigger_shake(5, 0.3)
                    else:
                        self.lives -= 1; self.hud_flash = 1.0
                        self.camera.trigger_shake(8, 0.5)
                        if self.lives <= 0: self.game_over = True
            elif isinstance(e, PowerUp) and e.overlaps_rect(*player_rect):
                e.active = False
                if e.type == POWERUP_MUSHROOM:
                    if self.p_mode == MODE_SMALL: self.p_mode = MODE_BIG; self.py -= TILE
                    self.score += e.cfg['score']
                elif e.type == POWERUP_FIRE: self.p_mode = MODE_FIRE; self.score += e.cfg['score']
                elif e.type == POWERUP_STAR: self.p_star = 10.0; self.score += e.cfg['score']
                elif e.type == POWERUP_ONEUP: self.lives = min(self.lives + 1, self.max_lives)
                elif e.type == POWERUP_COIN: self.coins += 1; self.score += 200
                self.hud_pulse = 1.0; self.hud_score_pulse = 1.0
            elif isinstance(e, Fireball):
                for e2 in self.entities:
                    if isinstance(e2, Enemy) and e2.active and e.overlaps(e2):
                        e.active = False; e2.active = False; self.score += e2.cfg['score']
                        self.camera.trigger_shake(4, 0.2)
                        for _ in range(6):
                            self.particles.spawn(e.x, e.y, random.uniform(-120, 120),
                                                 random.uniform(-200, -30), (255, 80, 0),
                                                 random.uniform(0.3, 0.6), random.randint(3, 7), 'explosion', 0.3)
                        break

        self.entities = [e for e in self.entities if e.active]

        # Particles
        collected = self.particles.update(dt, self.px, self.py)
        self.coins += collected; self.score += collected * 50

        # Cars
        for c in self.cars:
            c['x'] += c['vx'] * dt
            if c['x'] < 0 or c['x'] > WW * TILE: c['vx'] *= -1
        if keys[pygame.K_f]:
            if self.p_on_car: self.p_on_car = False; self.p_car = None
            else:
                for c in self.cars:
                    if abs(c['x'] - self.px) < TILE * 2 and abs(c['y'] - self.py) < TILE * 2:
                        self.p_on_car = True; self.p_car = c; break
        if self.p_on_car and self.p_car:
            c = self.p_car; self.px = c['x']; self.py = c['y'] - ph
            if keys[pygame.K_d]: c['vx'] = min(c['vx'] + 200 * dt, 400)
            elif keys[pygame.K_a]: c['vx'] = max(c['vx'] - 200 * dt, -200)
            else: c['vx'] *= max(0, 1 - 3 * dt)

        # Police spawn
        if self.wanted.should_spawn_police(dt, sum(1 for e in self.entities if isinstance(e, Enemy) and e.type == ENEMY_POLICE)):
            spawn_x = self.px + (W if random.random() < 0.5 else -W)
            self.entities.append(Enemy(spawn_x, (WH - 3) * TILE, ENEMY_POLICE))

        # Camera
        self.camera.update(self.px, self.pvx, dt, WW * TILE)

        # Time out
        if self.time <= 0:
            self.lives -= 1; self.hud_flash = 1.0; self.time = 400
            if self.lives <= 0: self.game_over = True

    def draw(self, screen):
        cx, cy = int(self.camera.x), int(self.camera.y)
        # Sky
        for b in range(4):
            r = b / 4
            screen.fill((int(92 + (180 - 92) * r), int(148 + (220 - 148) * r), int(252 + (255 - 252) * r)),
                        (0, b * H // 4, W, H // 4 + 1))
        # Tiles
        stx = max(0, cx // TILE - 1); etx = min(WW, cx // TILE + W // TILE + 2)
        for tx in range(stx, etx):
            for ty in range(WH):
                t = self.lvl[ty][tx]
                if t == 0: continue
                ts = get_tile_surface(t)
                if ts:
                    sx = tx * TILE - cx
                    if -TILE < sx < W + TILE: screen.blit(ts, (sx, ty * TILE))
        # Entities
        for e in self.entities:
            if isinstance(e, MovingPlatform): e.draw(screen, cx)
        for e in self.entities:
            if isinstance(e, (Enemy, PowerUp, Fireball)): e.draw(screen, cx)
        # Particles
        self.particles.draw(screen, cx)
        # Cars
        for c in self.cars:
            sx = int(c['x'] - cx)
            if -TILE * 2 < sx < W + TILE * 2:
                pygame.draw.rect(screen, c['color'], (sx, c['y'] - TILE // 2, TILE * 2, TILE // 2))
                pygame.draw.rect(screen, (60, 60, 70), (sx + TILE // 2, c['y'] - TILE, TILE, TILE // 2))
                pygame.draw.rect(screen, (150, 200, 240), (sx + TILE // 2 + 4, c['y'] - TILE + 4, TILE - 8, TILE // 3))
                pygame.draw.circle(screen, (30, 30, 30), (sx + TILE // 3, c['y']), TILE // 4)
                pygame.draw.circle(screen, (30, 30, 30), (sx + TILE * 5 // 3, c['y']), TILE // 4)
        # Player
        if not self.p_on_car:
            sx = int(self.px - cx); sy = int(self.py)
            ph = PH_BIG if self.p_mode > 0 else PH_SMALL
            big = self.p_mode > 0; fire = self.p_mode == MODE_FIRE
            if self.p_air: pose = 3
            elif abs(self.pvx) > 20: pose = 1 if int(self.p_anim * 8) % 2 == 0 else 2
            else: pose = 0
            spr = get_mario(big, fire, pose)
            sw2 = max(1, int(spr.get_width() * self.p_sq_x))
            sh2 = max(1, int(spr.get_height() * self.p_sq_y))
            if abs(self.p_sq_x - 1.0) > 0.02 or abs(self.p_sq_y - 1.0) > 0.02:
                spr = pygame.transform.scale(spr, (sw2, sh2))
            if not self.p_dir: spr = pygame.transform.flip(spr, True, False)
            if self.p_inv > 0 and int(self.p_inv * 12) % 2 == 0:
                spr = spr.copy(); spr.set_alpha(110)
            if self.p_star > 0:
                tint = (int(128 + 127 * math.sin(self.p_anim * 16)),
                        int(128 + 127 * math.sin(self.p_anim * 16 + 2.1)),
                        int(128 + 127 * math.sin(self.p_anim * 16 + 4.2)))
                spr = spr.copy(); spr.fill(tint + (0,), None, pygame.BLEND_RGB_MULT)
            screen.blit(spr, (sx - sw2 // 2, sy - sh2))
        # HUD
        self._draw_hud(screen)
        if self.game_over:
            ov = pygame.Surface((W, H), pygame.SRCALPHA)
            ov.fill((0, 0, 0, int(140 * (1 - self.hud_fade))))
            screen.blit(ov, (0, 0))
            font = pygame.font.Font(None, 72)
            go = font.render("GAME OVER", True, RED)
            screen.blit(go, (W // 2 - go.get_width() // 2, H // 2 - 30))

    def _draw_hud(self, screen):
        font = pygame.font.Font(None, 36); med = pygame.font.Font(None, 28)
        pulse = 1.0 + self.hud_pulse * 0.08
        bg_h = int(50 * pulse)
        bg = pygame.Surface((W, bg_h), pygame.SRCALPHA)
        bg.fill((0, 0, 0, min(220, int(120 + 60 * self.hud_pulse))))
        screen.blit(bg, (0, 0))
        if self.hud_flash > 0:
            ov = pygame.Surface((W, H), pygame.SRCALPHA)
            ov.fill((220, 40, 40, int(120 * self.hud_flash))); screen.blit(ov, (0, 0))
        pygame.draw.circle(screen, YLW, (34, 30), 9)
        pygame.draw.circle(screen, (255, 240, 140), (31, 27), 3)
        if self.hud_pulse > 0:
            pygame.draw.circle(screen, YLW, (34, 30), int(11 + self.hud_pulse * 4), 2)
        screen.blit(med.render(f"x{self.coins:03d}", True, YLW), (50, 15))
        sc = int(255 + 255 * self.hud_score_pulse)
        screen.blit(med.render(f"SCORE:{self.score:06d}", True,
                               (min(255, sc), min(255, int(220 + 35 * self.hud_score_pulse)), min(255, 100))), (150, 15))
        title = font.render("SUPER MARIO GTA6", True, YLW)
        if self.hud_fade < 1.0: title = title.copy(); title.set_alpha(int(255 * self.hud_fade))
        sh = font.render("SUPER MARIO GTA6", True, (0, 0, 0))
        sh = sh.copy(); sh.set_alpha(int(160 * self.hud_fade))
        tx = W // 2 - title.get_width() // 2
        screen.blit(sh, (tx + 2, 12)); screen.blit(title, (tx, 10))
        time_col = RED if self.time < 30 else WHT
        if self.time < 30 and int(self.time * 6) % 2 == 0: time_col = YLW
        screen.blit(med.render(f"TIME:{int(self.time)}", True, time_col), (W - 260, 15))
        for i in range(self.max_lives):
            h = HEART_F if i < self.lives else HEART_E
            yo = int(math.sin(self.p_anim * 2 + i * 0.7) * 1.5)
            shake_x = int(math.sin(self.p_anim * 60 + i) * 3 * self.hud_flash) if self.hud_flash > 0 else 0
            screen.blit(h, (W - 100 + i * 26 + shake_x, 16 + yo))
        screen.blit(med.render(f"x{self.lives}", True, WHT), (W - 22, 15))
        if self.combo > 1:
            screen.blit(font.render(f"COMBO x{self.combo}!", True, YLW), (W // 2 - 60, 60))
        self.wanted.draw_stars(screen, W - 150, 45)


def preload_all():
    preload_tiles(); preload_sprites()
