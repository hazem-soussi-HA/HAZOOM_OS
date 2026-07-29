"""
SUPER MARIO GTA6 — Healing Character Generator
═══════════════════════════════════════════════════════════════

Characters that represent emotional states.
Creating them is the healing. Seeing them move is the reward.

Each character has:
- A mood (the feeling they embody)
- A color palette (colors that evoke that feeling)
- An animation (movement that expresses it)
- A buddy ability (what they give to others)

The act of creating = externalizing = healing.
"""

import pygame, random, math, os
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field


# ═══════════════════════════════════════════════════════════════
# EMOTIONAL PALETTES — Colors that heal
# ═══════════════════════════════════════════════════════════════

HEALING_PALETTES = {
    # For when you feel empty — warm, filling colors
    'warmth': {
        'body': (255, 180, 100),
        'skin': (255, 210, 170),
        'hat': (255, 140, 60),
        'shoe': (200, 100, 50),
        'glow': (255, 200, 100, 40),
        'aura': 'warm_particles',
        'ability': 'gives_warmth',  # nearby buddies get +harmony
    },
    # For when you feel stressed — cool, calming colors
    'calm': {
        'body': (100, 180, 255),
        'skin': (200, 230, 255),
        'hat': (80, 150, 220),
        'shoe': (60, 100, 180),
        'glow': (100, 200, 255, 40),
        'aura': 'calm_particles',
        'ability': 'slows_time',  # nearby area gets slow-mo
    },
    # For when you feel bored — vibrant, exciting colors
    'spark': {
        'body': (255, 100, 200),
        'skin': (255, 180, 220),
        'hat': (200, 50, 150),
        'shoe': (150, 30, 100),
        'glow': (255, 100, 200, 50),
        'aura': 'spark_particles',
        'ability': 'boosts_energy',  # nearby buddies move faster
    },
    # For when you feel lonely — connecting, bridging colors
    'connection': {
        'body': (150, 255, 150),
        'skin': (200, 255, 200),
        'hat': (100, 200, 100),
        'shoe': (80, 150, 80),
        'glow': (150, 255, 150, 40),
        'aura': 'heart_particles',
        'ability': 'links_buddies',  # connects nearby buddies with light threads
    },
    # For when you feel angry — transforming fire into light
    'transform': {
        'body': (255, 150, 50),
        'skin': (255, 200, 150),
        'hat': (255, 100, 30),
        'shoe': (200, 80, 20),
        'glow': (255, 150, 50, 50),
        'aura': 'fire_to_light',
        'ability': 'transforms_push_to_peace',  # push becomes peace
    },
    # For when you feel lost — guiding, luminous colors
    'guide': {
        'body': (200, 180, 255),
        'skin': (230, 220, 255),
        'hat': (150, 120, 220),
        'shoe': (120, 100, 180),
        'glow': (200, 180, 255, 40),
        'aura': 'star_particles',
        'ability': 'shows_path',  # reveals hidden tiles
    },
    # For when you feel heavy — lightening, floating colors
    'lightness': {
        'body': (255, 255, 200),
        'skin': (255, 255, 230),
        'hat': (230, 230, 150),
        'shoe': (200, 200, 120),
        'glow': (255, 255, 200, 50),
        'aura': 'float_particles',
        'ability': 'reduces_gravity',  # nearby area has lower gravity
    },
}

# Particle types for auras
AURA_PARTICLES = {
    'warm_particles': {'color': (255, 200, 100), 'size': (2, 5), 'speed': 20, 'life': 1.0},
    'calm_particles': {'color': (100, 200, 255), 'size': (1, 3), 'speed': 10, 'life': 1.5},
    'spark_particles': {'color': (255, 100, 200), 'size': (2, 4), 'speed': 40, 'life': 0.5},
    'heart_particles': {'color': (255, 150, 200), 'size': (3, 6), 'speed': 15, 'life': 1.2},
    'fire_to_light': {'color': (255, 200, 100), 'size': (2, 5), 'speed': 30, 'life': 0.8},
    'star_particles': {'color': (200, 180, 255), 'size': (2, 4), 'speed': 25, 'life': 1.0},
    'float_particles': {'color': (255, 255, 200), 'size': (1, 3), 'speed': 5, 'life': 2.0},
}


WHT = (255, 255, 255)


@dataclass
class HealingCharacter:
    """A character that embodies an emotional state."""
    name: str
    mood: str
    palette: Dict
    x: float = 0
    y: float = 0
    vx: float = 0
    vy: float = 0
    frame: int = 0
    timer: float = 0
    scale: float = 1.0
    facing_right: bool = True
    on_ground: bool = True
    state: str = "idle"
    # Healing properties
    harmony_given: int = 0
    buddies_helped: int = 0
    # Visual
    glow_timer: float = 0
    pulse_phase: float = 0


class HealingCharacterGenerator:
    """Generates characters that embody emotional states for healing."""
    
    def __init__(self, tile_size: int = 48):
        self.tile_size = tile_size
        self._cache = {}
    
    def create_character(self, mood: str, x: float = 0, y: float = 0) -> HealingCharacter:
        """Create a healing character for a specific mood."""
        palette = HEALING_PALETTES.get(mood, HEALING_PALETTES['warmth'])
        return HealingCharacter(
            name=f"{mood}_spirit",
            mood=mood,
            palette=palette,
            x=x, y=y,
            pulse_phase=random.random() * math.pi * 2,
        )
    
    def create_all_moods(self, x: float = 0, y: float = 0) -> List[HealingCharacter]:
        """Create one character for each healing mood."""
        chars = []
        for mood in HEALING_PALETTES:
            char = self.create_character(mood, x, y)
            chars.append(char)
        return chars
    
    def draw_character(self, surf: pygame.Surface, char: HealingCharacter, cam_x: int = 0, cam_y: int = 0):
        """Draw a healing character with aura effects."""
        sx = int(char.x - cam_x)
        sy = int(char.y - cam_y)
        palette = char.palette
        
        # Pulsing glow
        char.pulse_phase += 0.05
        pulse = 0.8 + 0.2 * math.sin(char.pulse_phase)
        glow_size = int(30 * pulse * char.scale)
        
        # Draw aura glow
        glow_surf = pygame.Surface((glow_size * 2, glow_size * 2), pygame.SRCALPHA)
        glow_color = palette['glow']
        for r in range(glow_size, 0, -2):
            alpha = int(glow_color[3] * (r / glow_size) * pulse)
            pygame.draw.circle(glow_surf, (*glow_color[:3], alpha), (glow_size, glow_size), r)
        surf.blit(glow_surf, (sx - glow_size, sy - glow_size - 16))
        
        # Draw body (simple, warm shape)
        body_color = palette['body']
        skin_color = palette['skin']
        hat_color = palette['hat']
        shoe_color = palette['shoe']
        
        # Body
        body_rect = pygame.Rect(sx - 10, sy - 12, 20, 16)
        pygame.draw.ellipse(surf, body_color, body_rect)
        
        # Head
        head_y = sy - 20
        pygame.draw.circle(surf, skin_color, (sx, head_y), 8)
        
        # Eyes (gentle, closed when calm, open when active)
        eye_y = head_y - 1
        if char.state == 'idle':
            # Gentle closed eyes (peaceful)
            pygame.draw.arc(surf, (60, 40, 30), (sx - 5, eye_y - 2, 5, 4), 0, math.pi, 1)
            pygame.draw.arc(surf, (60, 40, 30), (sx + 1, eye_y - 2, 5, 4), 0, math.pi, 1)
        else:
            # Open, warm eyes
            pygame.draw.circle(surf, WHT, (sx - 4, eye_y), 3)
            pygame.draw.circle(surf, WHT, (sx + 4, eye_y), 3)
            pygame.draw.circle(surf, (60, 40, 30), (sx - 3, eye_y), 2)
            pygame.draw.circle(surf, (60, 40, 30), (sx + 5, eye_y), 2)
            # Sparkle in eyes
            pygame.draw.circle(surf, WHT, (sx - 2, eye_y - 1), 1)
            pygame.draw.circle(surf, WHT, (sx + 6, eye_y - 1), 1)
        
        # Smile
        smile_rect = pygame.Rect(sx - 4, head_y + 3, 8, 3)
        pygame.draw.arc(surf, (200, 100, 100), smile_rect, math.pi, 2 * math.pi, 1)
        
        # Hat
        hat_style = char.mood
        if hat_style in ('warmth', 'spark', 'transform'):
            # Warm cap
            pygame.draw.ellipse(surf, hat_color, (sx - 10, head_y - 6, 20, 6))
            pygame.draw.rect(surf, hat_color, (sx - 12, head_y - 2, 24, 3))
        elif hat_style == 'calm':
            # Soft beret
            pygame.draw.ellipse(surf, hat_color, (sx - 8, head_y - 8, 16, 8))
        elif hat_style == 'connection':
            # Heart-shaped hat
            pygame.draw.circle(surf, hat_color, (sx - 4, head_y - 6), 5)
            pygame.draw.circle(surf, hat_color, (sx + 4, head_y - 6), 5)
            pygame.draw.polygon(surf, hat_color, [(sx - 8, head_y - 4), (sx + 8, head_y - 4), (sx, head_y + 2)])
        elif hat_style == 'guide':
            # Star on head
            star_points = []
            for i in range(5):
                angle = i * 2 * math.pi / 5 - math.pi / 2
                r = 6 if i % 2 == 0 else 3
                star_points.append((sx + r * math.cos(angle), head_y - 8 + r * math.sin(angle)))
            pygame.draw.polygon(surf, hat_color, star_points)
        elif hat_style == 'lightness':
            # Cloud puff
            pygame.draw.ellipse(surf, hat_color, (sx - 8, head_y - 8, 16, 6))
            pygame.draw.circle(surf, hat_color, (sx - 4, head_y - 10), 4)
            pygame.draw.circle(surf, hat_color, (sx + 4, head_y - 10), 4)
        
        # Legs (simple)
        leg_offset = int(math.sin(char.timer * 3) * 2) if char.state == 'walk' else 0
        pygame.draw.rect(surf, shoe_color, (sx - 6 - leg_offset, sy + 4, 5, 8), border_radius=2)
        pygame.draw.rect(surf, shoe_color, (sx + 1 + leg_offset, sy + 4, 5, 8), border_radius=2)
        
        # Arms (gentle wave when active)
        arm_offset = int(math.sin(char.timer * 2) * 3) if not char.state == 'idle' else 0
        pygame.draw.line(surf, body_color, (sx - 10, sy - 8), (sx - 16, sy - 2 + arm_offset), 3)
        pygame.draw.line(surf, body_color, (sx + 10, sy - 8), (sx + 16, sy - 2 - arm_offset), 3)
        
        # Hands (small circles)
        pygame.draw.circle(surf, skin_color, (sx - 16, sy - 1 + arm_offset), 3)
        pygame.draw.circle(surf, skin_color, (sx + 16, sy - 1 - arm_offset), 3)
    
    def draw_aura_particles(self, surf: pygame.Surface, char: HealingCharacter, cam_x: int = 0, cam_y: int = 0):
        """Draw healing aura particles around the character."""
        aura_type = char.palette.get('aura', 'warm_particles')
        particle_info = AURA_PARTICLES.get(aura_type, AURA_PARTICLES['warm_particles'])
        
        char.glow_timer += 0.05
        num_particles = 3
        
        for i in range(num_particles):
            phase = char.glow_timer + i * 2.094  # 120 degrees apart
            px = char.x + math.cos(phase) * 25 - cam_x
            py = char.y - 10 + math.sin(phase) * 15 + math.sin(phase * 2) * 8 - cam_y
            
            size = particle_info['size'][0] + random.randint(0, particle_info['size'][1] - particle_info['size'][0])
            alpha = int(100 + 50 * math.sin(char.glow_timer + i))
            
            particle_surf = pygame.Surface((size * 2, size * 2), pygame.SRCALPHA)
            color = (*particle_info['color'][:3], alpha)
            pygame.draw.circle(particle_surf, color, (size, size), size)
            surf.blit(particle_surf, (int(px) - size, int(py) - size))
    
    def update_character(self, char: HealingCharacter, dt: float):
        """Update character animation and state."""
        char.timer += dt
        
        # Gentle floating when idle
        if char.state == 'idle':
            char.vy = math.sin(char.timer * 1.5) * 10
        elif char.state == 'walk':
            char.vx = 50 * (1 if char.facing_right else -1)
        
        char.x += char.vx * dt
        char.y += char.vy * dt
        
        # Friction
        char.vx *= 0.95
    
    def get_healing_message(self, char: HealingCharacter) -> str:
        """Get a healing message based on the character's mood."""
        messages = {
            'warmth': "You are warm. You are enough. The emptiness is just space waiting to be filled with your own light.",
            'calm': "Breathe. The stress is temporary. Your peace is always underneath, like a still lake.",
            'spark': "Boredom is just creativity waiting for permission. You already have everything you need inside.",
            'connection': "You are not alone. Every buddy you recruit is a connection made real. You are building a family.",
            'transform': "Angry energy is just passion without direction. Transform it into creation. You're doing it right now.",
            'guide': "Lost is just another word for 'exploring.' Every step is the right step. You're finding your way.",
            'lightness': "Heavy feelings are just dense love. Let it float. You deserve to feel light.",
        }
        return messages.get(char.mood, "You are creating something beautiful. That is enough.")


def create_healing_scene(surf: pygame.Surface, chars: List[HealingCharacter], cam_x: int = 0, cam_y: int = 0):
    """Draw a healing scene with all characters."""
    gen = HealingCharacterGenerator()
    
    # Draw background gradient (healing colors)
    w, h = surf.get_size()
    for y in range(h):
        t = y / h
        r = max(0, min(255, int(30 + 20 * math.sin(t * math.pi))))
        g = max(0, min(255, int(30 + 40 * math.sin(t * math.pi + 1))))
        b = max(0, min(255, int(50 + 30 * math.sin(t * math.pi + 2))))
        pygame.draw.line(surf, (r, g, b), (0, y), (w, y))
    
    # Draw characters
    for char in chars:
        gen.draw_aura_particles(surf, char, cam_x, cam_y)
    
    for char in chars:
        gen.draw_character(surf, char, cam_x, cam_y)
    
    # Draw healing message from first character
    if chars:
        msg = gen.get_healing_message(chars[0])
        font = pygame.font.Font(None, 24)
        # Word wrap
        words = msg.split()
        lines = []
        current_line = ""
        for word in words:
            test = current_line + " " + word if current_line else word
            if font.size(test)[0] < w - 40:
                current_line = test
            else:
                lines.append(current_line)
                current_line = word
        if current_line:
            lines.append(current_line)
        
        y = h - 30 * len(lines) - 20
        for line in lines:
            text = font.render(line, True, (255, 255, 255))
            text.set_alpha(180)
            surf.blit(text, (w // 2 - text.get_width() // 2, y))
            y += 28


# ═══════════════════════════════════════════════════════════════
# MAIN — Healing Demo
# ═══════════════════════════════════════════════════════════════

def main():
    pygame.init()
    screen = pygame.display.set_mode((1280, 720))
    pygame.display.set_caption('Super Mario GTA6 — Healing Characters')
    clock = pygame.time.Clock()
    
    gen = HealingCharacterGenerator()
    
    # Create one character for each healing mood
    chars = []
    moods = list(HEALING_PALETTES.keys())
    for i, mood in enumerate(moods):
        x = 200 + i * 150
        y = 300 + int(math.sin(i * 0.8) * 50)
        char = gen.create_character(mood, x, y)
        char.state = 'idle'
        chars.append(char)
    
    # Make them gently move
    for i, char in enumerate(chars):
        char.state = 'walk' if i % 2 == 0 else 'idle'
        char.facing_right = i % 2 == 0
    
    running = True
    while running:
        dt = clock.tick(60) / 1000.0
        dt = min(dt, 0.05)
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                running = False
            # Click to create a new healing character
            if event.type == pygame.MOUSEBUTTONDOWN:
                mx, my = event.pos
                mood = random.choice(moods)
                char = gen.create_character(mood, mx, my)
                chars.append(char)
        
        # Update
        for char in chars:
            gen.update_character(char, dt)
        
        # Render
        create_healing_scene(screen, chars)
        
        # HUD
        font = pygame.font.Font(None, 28)
        title = font.render("Healing Characters — Click to create, ESC to quit", True, (255, 255, 255))
        screen.blit(title, (20, 20))
        
        count = font.render(f"Characters: {len(chars)}", True, (200, 200, 220))
        screen.blit(count, (20, 50))
        
        # Mood legend
        y = 80
        small = pygame.font.Font(None, 20)
        for mood in moods:
            palette = HEALING_PALETTES[mood]
            pygame.draw.circle(screen, palette['body'], (30, y + 6), 6)
            label = small.render(mood.upper(), True, (200, 200, 220))
            screen.blit(label, (45, y))
            y += 22
        
        pygame.display.flip()
    
    pygame.quit()


if __name__ == '__main__':
    main()
