"""
SUPER MARIO GTA6 — Procedural Character Generation
═══════════════════════════════════════════════════════════════

Generates pixel art characters with:
- Customizable body parts (head, body, legs, arms)
- Outfit variations (hats, shirts, shoes, accessories)
- Animation frames (idle, walk, jump, fall, dash, celebrate)
- Multiple character types (player, defender variants, buddies)
- Export to sprite sheets

Usage:
    gen = CharacterGenerator()
    
    # Generate Mario-like character
    mario = gen.create_character('mario')
    frames = gen.generate_animation(mario, 'walk', 8)
    
    # Generate defender
    goomba = gen.create_character('goomba')
    
    # Generate buddy
    buddy = gen.create_character('buddy')
    
    # Custom character
    custom = gen.create_character('custom', {
        'body_color': (50, 100, 200),
        'hat_style': 'cap',
        'shirt_style': 'overalls',
        'shoe_style': 'boots',
        'skin_tone': (248, 184, 120),
    })
    
    # Export sprite sheet
    sheet = gen.create_sprite_sheet(frames, cols=8)
"""

import pygame, random, math, os
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field


# ═══════════════════════════════════════════════════════════════
# CHARACTER DEFINITIONS
# ═══════════════════════════════════════════════════════════════

@dataclass
class CharacterDef:
    """Defines a character's visual properties."""
    name: str
    body_color: Tuple[int, int, int] = (200, 30, 30)
    skin_tone: Tuple[int, int, int] = (248, 184, 120)
    hat_color: Tuple[int, int, int] = (200, 30, 30)
    shoe_color: Tuple[int, int, int] = (128, 64, 0)
    eye_color: Tuple[int, int, int] = (0, 0, 0)
    
    # Dimensions (in pixels, tile-relative)
    head_size: int = 16
    body_width: int = 20
    body_height: int = 16
    leg_width: int = 8
    leg_height: int = 12
    arm_width: int = 6
    arm_height: int = 14
    
    # Style flags
    has_hat: bool = True
    has_mustache: bool = True
    has_cape: bool = False
    hat_style: str = "cap"  # cap, tophat, crown, none
    body_style: str = "overalls"  # overalls, robe, suit, bare
    shoe_style: str = "boots"  # boots, shoes, sandals, feet
    
    # Animation properties
    walk_speed: float = 0.15  # seconds per frame
    idle_speed: float = 0.5
    jump_hold: float = 0.2
    
    # Scale
    scale: int = 3  # pixel art scale factor


# Pre-defined characters
CHARACTER_PRESETS = {
    'mario': CharacterDef(
        name='mario', body_color=(200, 30, 30), skin_tone=(248, 184, 120),
        hat_color=(200, 30, 30), shoe_color=(128, 64, 0),
        has_hat=True, has_mustache=True, hat_style='cap', body_style='overalls',
    ),
    'fire_mario': CharacterDef(
        name='fire_mario', body_color=(255, 255, 255), skin_tone=(248, 184, 120),
        hat_color=(255, 80, 0), shoe_color=(255, 80, 0),
        has_hat=True, has_mustache=True, hat_style='cap', body_style='overalls',
    ),
    'goomba': CharacterDef(
        name='goomba', body_color=(164, 100, 36), skin_tone=(164, 100, 36),
        hat_color=(128, 64, 0), shoe_color=(100, 50, 0),
        has_hat=False, has_mustache=False, hat_style='none', body_style='bare',
        head_size=20, body_width=24, body_height=12,
    ),
    'koopa': CharacterDef(
        name='koopa', body_color=(0, 180, 0), skin_tone=(248, 200, 120),
        hat_color=(0, 180, 0), shoe_color=(100, 50, 0),
        has_hat=False, has_mustache=False, hat_style='none', body_style='shell',
        head_size=14, body_width=22, body_height=20,
    ),
    'buddy': CharacterDef(
        name='buddy', body_color=(255, 150, 200), skin_tone=(255, 180, 220),
        hat_color=(255, 100, 150), shoe_color=(200, 100, 150),
        has_hat=False, has_mustache=False, hat_style='none', body_style='cute',
        head_size=14, body_width=16, body_height=14,
    ),
    'player_default': CharacterDef(
        name='player', body_color=(30, 60, 200), skin_tone=(248, 184, 120),
        hat_color=(30, 60, 200), shoe_color=(128, 64, 0),
        has_hat=True, has_mustache=False, hat_style='cap', body_style='overalls',
    ),
}


class CharacterGenerator:
    """Generates pixel art characters and animations."""
    
    def __init__(self, tile_size: int = 48):
        self.tile_size = tile_size
        self._cache: Dict[str, List[pygame.Surface]] = {}
    
    def create_character(self, preset_name: str, overrides: Dict = None) -> CharacterDef:
        """Create a character from a preset."""
        if preset_name in CHARACTER_PRESETS:
            char = CHARACTER_PRESETS[preset_name]
        else:
            char = CharacterDef(name=preset_name)
        
        if overrides:
            for key, value in overrides.items():
                if hasattr(char, key):
                    setattr(char, key, value)
        
        return char
    
    def generate_all_animations(self, char: CharacterDef) -> Dict[str, List[pygame.Surface]]:
        """Generate all animation frames for a character."""
        return {
            'idle': self.generate_animation(char, 'idle', 4),
            'walk': self.generate_animation(char, 'walk', 6),
            'run': self.generate_animation(char, 'run', 6),
            'jump': self.generate_animation(char, 'jump', 3),
            'fall': self.generate_animation(char, 'fall', 2),
            'dash': self.generate_animation(char, 'dash', 4),
            'celebrate': self.generate_animation(char, 'celebrate', 6),
            'push': self.generate_animation(char, 'push', 2),
            'recruit': self.generate_animation(char, 'recruit', 4),
        }
    
    def generate_animation(self, char: CharacterDef, state: str, frame_count: int) -> List[pygame.Surface]:
        """Generate animation frames for a specific state."""
        cache_key = f"{char.name}_{state}_{frame_count}"
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        frames = []
        for i in range(frame_count):
            surf = pygame.Surface((self.tile_size, self.tile_size * 2), pygame.SRCALPHA)
            surf = self._draw_character(char, state, i, frame_count, surf)
            frames.append(surf)
        
        self._cache[cache_key] = frames
        return frames
    
    def _draw_character(self, char: CharacterDef, state: str, frame: int, total_frames: int, surf: pygame.Surface) -> pygame.Surface:
        """Draw a single character frame."""
        w, h = surf.get_size()
        cx, cy = w // 2, h // 2
        
        # Animation offsets
        bob = 0
        leg_offset = 0
        arm_offset = 0
        stretch_y = 1.0
        
        if state == 'idle':
            bob = int(math.sin(frame * math.pi / 2) * 1)
        elif state in ('walk', 'run'):
            speed = 1.0 if state == 'run' else 0.7
            leg_offset = int(math.sin(frame * math.pi / (total_frames / 2)) * 6 * speed)
            arm_offset = int(math.cos(frame * math.pi / (total_frames / 2)) * 4 * speed)
        elif state == 'jump':
            stretch_y = 1.2 if frame == 0 else 1.0
            leg_offset = -4
        elif state == 'fall':
            stretch_y = 0.9
            leg_offset = 2
        elif state == 'dash':
            stretch_y = 0.8
            leg_offset = int(math.sin(frame * math.pi / 2) * 8)
        elif state == 'celebrate':
            bob = int(abs(math.sin(frame * math.pi / (total_frames / 2))) * 4)
            arm_offset = int(math.sin(frame * math.pi / (total_frames / 2)) * 8)
        
        # Draw parts (bottom to top)
        self._draw_legs(surf, char, cx, cy + 8 + bob, leg_offset)
        self._draw_body(surf, char, cx, cy + bob, stretch_y)
        self._draw_arms(surf, char, cx, cy - 4 + bob, arm_offset)
        self._draw_head(surf, char, cx, cy - 16 + bob)
        
        if char.has_hat:
            self._draw_hat(surf, char, cx, cy - 20 + bob)
        
        return surf
    
    def _draw_head(self, surf, char, cx, cy):
        """Draw character head."""
        # Head circle
        pygame.draw.ellipse(surf, char.skin_tone, (cx - char.head_size//2, cy - char.head_size//2, char.head_size, char.head_size))
        # Eyes
        eye_y = cy - 2
        pygame.draw.circle(surf, WHT, (cx - 4, eye_y), 3)
        pygame.draw.circle(surf, WHT, (cx + 4, eye_y), 3)
        pygame.draw.circle(surf, char.eye_color, (cx - 3, eye_y), 2)
        pygame.draw.circle(surf, char.eye_color, (cx + 5, eye_y), 2)
        # Nose
        pygame.draw.ellipse(surf, (char.skin_tone[0]-20, char.skin_tone[1]-20, char.skin_tone[2]-20), (cx - 2, cy + 2, 4, 3))
        # Mustache
        if char.has_mustache:
            pygame.draw.ellipse(surf, (60, 30, 10), (cx - 6, cy + 4, 12, 3))
    
    def _draw_body(self, surf, char, cx, cy, stretch_y):
        """Draw character body."""
        bh = int(char.body_height * stretch_y)
        pygame.draw.rect(surf, char.body_color, (cx - char.body_width//2, cy - bh//2, char.body_width, bh), border_radius=4)
        # Belt / detail
        pygame.draw.rect(surf, (char.body_color[0]//2, char.body_color[1]//2, char.body_color[2]//2),
                        (cx - char.body_width//2, cy + bh//4, char.body_width, 3))
    
    def _draw_arms(self, surf, char, cx, cy, offset):
        """Draw character arms."""
        # Left arm
        pygame.draw.rect(surf, char.body_color, (cx - char.body_width//2 - char.arm_width, cy - 2 + offset, char.arm_width, char.arm_height), border_radius=2)
        # Right arm
        pygame.draw.rect(surf, char.body_color, (cx + char.body_width//2, cy - 2 - offset, char.arm_width, char.arm_height), border_radius=2)
        # Hands
        pygame.draw.circle(surf, char.skin_tone, (cx - char.body_width//2 - char.arm_width//2, cy + char.arm_height + offset), 3)
        pygame.draw.circle(surf, char.skin_tone, (cx + char.body_width//2 + char.arm_width//2, cy + char.arm_height - offset), 3)
    
    def _draw_legs(self, surf, char, cx, cy, offset):
        """Draw character legs."""
        # Left leg
        pygame.draw.rect(surf, char.body_color, (cx - 6 - offset, cy, char.leg_width, char.leg_height), border_radius=2)
        # Right leg
        pygame.draw.rect(surf, char.body_color, (cx - 2 + offset, cy, char.leg_width, char.leg_height), border_radius=2)
        # Shoes
        pygame.draw.ellipse(surf, char.shoe_color, (cx - 8 - offset, cy + char.leg_height - 4, 10, 6))
        pygame.draw.ellipse(surf, char.shoe_color, (cx + offset, cy + char.leg_height - 4, 10, 6))
    
    def _draw_hat(self, surf, char, cx, cy):
        """Draw character hat."""
        if char.hat_style == 'cap':
            pygame.draw.ellipse(surf, char.hat_color, (cx - 10, cy - 2, 20, 8))
            pygame.draw.rect(surf, char.hat_color, (cx - 12, cy, 24, 4))  # brim
        elif char.hat_style == 'tophat':
            pygame.draw.rect(surf, char.hat_color, (cx - 6, cy - 10, 12, 12))
            pygame.draw.ellipse(surf, char.hat_color, (cx - 10, cy, 20, 4))
        elif char.hat_style == 'crown':
            points = [(cx - 8, cy + 4), (cx - 6, cy - 4), (cx - 2, cy), (cx, cy - 6), (cx + 2, cy), (cx + 6, cy - 4), (cx + 8, cy + 4)]
            pygame.draw.polygon(surf, (255, 215, 0), points)
            pygame.draw.circle(surf, (255, 0, 0), (cx, cy - 3), 2)
    
    def create_sprite_sheet(self, frames: List[pygame.Surface], cols: int = 8) -> pygame.Surface:
        """Create a sprite sheet from frames."""
        if not frames:
            return pygame.Surface((0, 0))
        
        frame_w = frames[0].get_width()
        frame_h = frames[0].get_height()
        rows = math.ceil(len(frames) / cols)
        
        sheet = pygame.Surface((cols * frame_w, rows * frame_h), pygame.SRCALPHA)
        for i, frame in enumerate(frames):
            col = i % cols
            row = i // cols
            sheet.blit(frame, (col * frame_w, row * frame_h))
        
        return sheet
    
    def save_sprite_sheet(self, sheet: pygame.Surface, filename: str):
        """Save sprite sheet to file."""
        path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sprites', filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        pygame.image.save(sheet, path)
        return path
    
    def randomize_character(self, base_preset: str = 'player_default') -> CharacterDef:
        """Create a randomized character based on a preset."""
        char = self.create_character(base_preset)
        
        # Randomize colors
        char.body_color = (random.randint(50, 255), random.randint(50, 255), random.randint(50, 255))
        char.hat_color = (random.randint(50, 255), random.randint(50, 255), random.randint(50, 255))
        char.shoe_color = (random.randint(50, 200), random.randint(30, 150), random.randint(20, 100))
        char.skin_tone = (random.randint(200, 255), random.randint(150, 220), random.randint(100, 180))
        
        # Random style
        char.hat_style = random.choice(['cap', 'tophat', 'crown', 'none'])
        char.body_style = random.choice(['overalls', 'robe', 'suit'])
        char.shoe_style = random.choice(['boots', 'shoes', 'sandals'])
        
        return char


# Convenience functions
def generate_mario_sprite_sheet() -> pygame.Surface:
    """Generate complete Mario sprite sheet."""
    gen = CharacterGenerator()
    animations = gen.generate_all_animations(CHARACTER_PRESETS['mario'])
    all_frames = []
    for state, frames in animations.items():
        all_frames.extend(frames)
    return gen.create_sprite_sheet(all_frames, cols=8)

def generate_character_portrait(char_type: str = 'mario', size: int = 64) -> pygame.Surface:
    """Generate a portrait of a character."""
    gen = CharacterGenerator(tile_size=size)
    char = gen.create_character(char_type)
    frames = gen.generate_animation(char, 'idle', 1)
    return frames[0] if frames else pygame.Surface((size, size), pygame.SRCALPHA)
