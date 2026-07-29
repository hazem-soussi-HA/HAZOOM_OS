"""Game systems — particles, camera, effects, wanted, audio, HUD, save."""
import math, random, json, os, pygame
from ..constants import TILE, GRAV, MAGNET_R, MAGNET_FORCE, WW, WH, W, H, YLW, RED, WHT


class ParticlePool:
    def __init__(self, max_particles=500):
        self.particles = []
        self.max_particles = max_particles

    def spawn(self, x, y, vx, vy, col, life, sz, kind='dust', gravity=0.4):
        if len(self.particles) < self.max_particles:
            self.particles.append({
                'x': x, 'y': y, 'vx': vx, 'vy': vy,
                'c': col, 'life': life, 'mlife': life, 'sz': sz,
                'kind': kind, 'gravity': gravity, 'active': True,
                'spin': random.random() * 6.28 if kind == 'coin' else 0
            })

    def update(self, dt, player_x=0, player_y=0):
        alive = []
        collected = 0
        for p in self.particles:
            if not p['active']: continue
            if p['kind'] == 'coin':
                dx = player_x - p['x']; dy = (player_y - TILE // 2) - p['y']
                d = math.hypot(dx, dy)
                if d < MAGNET_R and d > 1:
                    f = MAGNET_FORCE * (1.0 - d / MAGNET_R)
                    p['vx'] += (dx / d) * f * dt
                    p['vy'] += (dy / d) * f * dt - 300 * dt
                else:
                    p['vy'] += GRAV * p['gravity'] * dt
            else:
                p['vy'] += GRAV * p['gravity'] * dt
            p['x'] += p['vx'] * dt; p['y'] += p['vy'] * dt
            p['life'] -= dt
            if p['life'] <= 0:
                if p['kind'] == 'coin': collected += 1
                p['active'] = False
            else:
                alive.append(p)
        self.particles = alive
        return collected

    def draw(self, screen, cx):
        for p in self.particles:
            t = p['life'] / p['mlife']
            sx = int(p['x'] - cx); sy = int(p['y'])
            if p['kind'] == 'coin':
                spin = math.sin(p.get('spin', 0) + p['mlife'] * 18)
                w = max(2, int(10 * abs(spin)))
                r = pygame.Rect(sx - w // 2, sy - 5, w, 10)
                pygame.draw.ellipse(screen, p['c'], r)
                pygame.draw.ellipse(screen, (255, 240, 140), r.inflate(-w // 2, -3))
            elif p['kind'] == 'explosion':
                sz = max(1, int(p['sz'] * t * 2))
                pygame.draw.circle(screen, p['c'], (sx, sy), sz)
            else:
                sz = max(1, int(p['sz'] * t))
                pygame.draw.circle(screen, p['c'], (sx, sy), sz)

    def clear(self):
        self.particles = []


class Camera:
    def __init__(self):
        self.x = 0; self.y = 0
        self.lookahead = 200; self.smoothness = 8.0
        self.shake_intensity = 0; self.shake_duration = 0; self.shake_timer = 0

    def trigger_shake(self, intensity=5.0, duration=0.3):
        self.shake_intensity = intensity; self.shake_duration = duration; self.shake_timer = 0

    def update(self, player_x, player_vx, dt, level_width):
        direction = 1 if player_vx > 0 else -1 if player_vx < 0 else 0
        target = player_x - W // 3 + self.lookahead * direction
        target = max(0, min(level_width - W, target))
        self.x += (target - self.x) * min(self.smoothness * dt, 1.0)

        ox, oy = 0.0, 0.0
        if self.shake_timer < self.shake_duration:
            self.shake_timer += dt
            progress = self.shake_timer / self.shake_duration
            decay = 1.0 - progress
            t = self.shake_timer * 30
            ox = math.sin(t * 7.3) * self.shake_intensity * decay
            oy = math.cos(t * 5.7) * self.shake_intensity * decay
        return int(self.x + ox), int(self.y + oy)


class ScreenEffects:
    def __init__(self):
        self.slow_scale = 1.0; self.slow_duration = 0.0; self.slow_timer = 0.0

    def trigger_slowmo(self, scale=0.3, duration=1.0):
        self.slow_scale = scale; self.slow_duration = duration; self.slow_timer = 0.0

    def update(self, dt):
        time_scale = 1.0
        if self.slow_timer < self.slow_duration:
            self.slow_timer += dt
            progress = self.slow_timer / self.slow_duration
            if progress > 0.7:
                t = (progress - 0.7) / 0.3
                time_scale = self.slow_scale + (1.0 - self.slow_scale) * t
            else:
                time_scale = self.slow_scale
        return time_scale


class WantedSystem:
    THRESHOLDS = [0, 20, 40, 60, 80, 100]

    def __init__(self):
        self.level = 0; self.heat = 0.0; self.decay_rate = 0.3
        self.police_spawn_timer = 0.0; self.max_police = 6

    def add_heat(self, amount):
        self.heat = min(100.0, self.heat + amount)
        for i in range(5, -1, -1):
            if self.heat >= self.THRESHOLDS[i]: self.level = i; break

    def update(self, dt):
        self.heat = max(0.0, self.heat - self.decay_rate * dt)
        for i in range(5, -1, -1):
            if self.heat >= self.THRESHOLDS[i]: self.level = i; break

    def should_spawn_police(self, dt, current_police):
        if self.level == 0 or current_police >= self.max_police: return False
        self.police_spawn_timer += dt
        interval = max(3.0 - self.level * 0.4, 0.8)
        if self.police_spawn_timer >= interval:
            self.police_spawn_timer = 0; return True
        return False

    def draw_stars(self, screen, x, y):
        for i in range(5):
            color = YLW if i < self.level else (60, 60, 60)
            cx_s = x + i * 22 + 10; cy_s = y + 10
            pts = []
            for j in range(5):
                a = j * 2 * math.pi / 5 - math.pi / 2
                r = 8 if j % 2 == 0 else 4
                pts.append((cx_s + r * math.cos(a), cy_s + r * math.sin(a)))
            pygame.draw.polygon(screen, color, pts)


SAVE_DIR = os.path.join(os.path.dirname(__file__), '..', 'saves')
os.makedirs(SAVE_DIR, exist_ok=True)

def save_game(game, slot=0):
    state = {
        'version': '3.0.0', 'timestamp': time.time(),
        'level': game.level_idx, 'coins': game.coins, 'score': game.score,
        'lives': game.lives, 'time': game.time, 'mode': game.p_mode,
        'px': game.px, 'py': game.py,
    }
    path = os.path.join(SAVE_DIR, f'save_{slot}.json')
    with open(path, 'w') as f:
        json.dump(state, f, indent=2)
    return path

def load_game(game, slot=0):
    path = os.path.join(SAVE_DIR, f'save_{slot}.json')
    if not os.path.exists(path): return False
    with open(path, 'r') as f:
        state = json.load(f)
    game.coins = state.get('coins', 0)
    game.score = state.get('score', 0)
    game.lives = state.get('lives', 3)
    game.time = state.get('time', 400)
    game.p_mode = state.get('mode', 0)
    game.px = state.get('px', 3 * TILE)
    game.py = state.get('py', (WH - 3) * TILE)
    return True
