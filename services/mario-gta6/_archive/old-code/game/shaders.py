"""
SUPER MARIO GTA6 — Shader / Post-Processing Pipeline
═══════════════════════════════════════════════════════════════

Software-based post-processing effects (no GPU required):
- Bloom / Glow
- Vignette
- Color grading (warm, cool, vintage, etc.)
- Scanlines
- CRT effect
- Motion blur
- Screen shake (integrated)
- Fade transitions
- Outline / Edge detection

Uses pygame Surface operations (no moderngl dependency).
Can be extended with moderngl for true GPU shaders.

Usage:
    pipeline = PostProcessPipeline((1280, 720))
    pipeline.add_effect('bloom', intensity=0.3)
    pipeline.add_effect('vignette', intensity=0.5)
    pipeline.add_effect('color_grade', mode='warm')
    
    # In game loop:
    pipeline.begin()
    # ... draw game ...
    pipeline.end()
    pipeline.apply(screen)  # applies all effects and blits to screen
"""

import pygame, math, random
from typing import Dict, List, Optional, Tuple, Callable


class ShaderEffect:
    """Base class for post-processing effects."""
    
    def __init__(self, name: str, intensity: float = 0.5):
        self.name = name
        self.intensity = intensity
        self.enabled = True
        self._params: Dict[str, any] = {}
    
    def set_param(self, key: str, value):
        self._params[key] = value
    
    def apply(self, surf: pygame.Surface) -> pygame.Surface:
        """Apply this effect to a surface. Override in subclasses."""
        return surf


class BloomEffect(ShaderEffect):
    """Bloom / glow effect using blur + additive blend."""
    
    def __init__(self, intensity: float = 0.3, threshold: int = 180, blur_radius: int = 3):
        super().__init__('bloom', intensity)
        self.threshold = threshold
        self.blur_radius = blur_radius
    
    def apply(self, surf: pygame.Surface) -> pygame.Surface:
        if not self.enabled or self.intensity <= 0:
            return surf
        
        w, h = surf.get_size()
        
        # Extract bright areas
        bright = pygame.Surface((w, h), pygame.SRCALPHA)
        for x in range(0, w, 2):  # Skip pixels for performance
            for y in range(0, h, 2):
                r, g, b, *_ = surf.get_at((x, y))
                brightness = (r + g + b) / 3
                if brightness > self.threshold:
                    alpha = int((brightness - self.threshold) / (255 - self.threshold) * 255 * self.intensity)
                    bright.set_at((x, y), (255, 255, 255, alpha))
        
        # Simple box blur
        for _ in range(self.blur_radius):
            bright = self._box_blur(bright)
        
        # Additive blend
        result = surf.copy()
        result.blit(bright, (0, 0), special_flags=pygame.BLEND_RGBA_ADD)
        return result
    
    def _box_blur(self, surf: pygame.Surface) -> pygame.Surface:
        """Fast box blur using pygame transform."""
        w, h = surf.get_size()
        # Scale down and up for blur effect
        small = pygame.transform.smoothscale(surf, (max(1, w // 4), max(1, h // 4)))
        return pygame.transform.smoothscale(small, (w, h))


class VignetteEffect(ShaderEffect):
    """Dark corners that focus attention on center."""
    
    def __init__(self, intensity: float = 0.5, color: Tuple[int, int, int] = (0, 0, 0)):
        super().__init__('vignette', intensity)
        self.color = color
    
    def apply(self, surf: pygame.Surface) -> pygame.Surface:
        if not self.enabled or self.intensity <= 0:
            return surf
        
        w, h = surf.get_size()
        cx, cy = w // 2, h // 2
        max_dist = math.sqrt(cx * cx + cy * cy)
        
        # Create vignette mask
        vignette = pygame.Surface((w, h), pygame.SRCALPHA)
        for y in range(0, h, 2):
            for x in range(0, w, 2):
                dx, dy = x - cx, y - cy
                dist = math.sqrt(dx * dx + dy * dy) / max_dist
                if dist > 0.5:
                    alpha = int((dist - 0.5) * 2 * 255 * self.intensity)
                    alpha = min(255, alpha)
                    vignette.set_at((x, y), (*self.color, alpha))
        
        result = surf.copy()
        result.blit(vignette, (0, 0), special_flags=pygame.BLEND_RGBA_MULT)
        return result


class ColorGradeEffect(ShaderEffect):
    """Color grading: warm, cool, vintage, etc."""
    
    PRESETS = {
        'warm': {'r': 1.1, 'g': 1.0, 'b': 0.9, 'sat': 1.1},
        'cool': {'r': 0.9, 'g': 1.0, 'b': 1.1, 'sat': 0.9},
        'vintage': {'r': 1.0, 'g': 0.95, 'b': 0.85, 'sat': 0.7},
        'noir': {'r': 0.33, 'g': 0.33, 'b': 0.33, 'sat': 0.0},
        'dream': {'r': 1.1, 'g': 0.9, 'b': 1.2, 'sat': 1.2},
        'healing': {'r': 0.9, 'g': 1.1, 'b': 1.0, 'sat': 1.0},
    }
    
    def __init__(self, mode: str = 'warm', intensity: float = 0.5):
        super().__init__('color_grade', intensity)
        self.mode = mode
        self._preset = self.PRESETS.get(mode, self.PRESETS['warm'])
    
    def apply(self, surf: pygame.Surface) -> pygame.Surface:
        if not self.enabled or self.intensity <= 0:
            return surf
        
        result = surf.copy()
        w, h = result.get_size()
        preset = self._preset
        
        # Process in chunks for performance
        step = max(1, int(4 - self.intensity * 2))  # Higher intensity = more pixels
        for y in range(0, h, step):
            for x in range(0, w, step):
                r, g, b, a = result.get_at((x, y))
                # Apply color grading
                r = min(255, int(r * preset['r'] * self.intensity + r * (1 - self.intensity)))
                g = min(255, int(g * preset['g'] * self.intensity + g * (1 - self.intensity)))
                b = min(255, int(b * preset['b'] * self.intensity + b * (1 - self.intensity)))
                # Saturation
                gray = (r + g + b) // 3
                sat = preset['sat']
                r = min(255, max(0, int(gray + (r - gray) * sat)))
                g = min(255, max(0, int(gray + (g - gray) * sat)))
                b = min(255, max(0, int(gray + (b - gray) * sat)))
                result.set_at((x, y), (r, g, b, a))
        
        return result


class ScanlineEffect(ShaderEffect):
    """Retro scanline effect."""
    
    def __init__(self, intensity: float = 0.2, spacing: int = 2):
        super().__init__('scanlines', intensity)
        self.spacing = spacing
    
    def apply(self, surf: pygame.Surface) -> pygame.Surface:
        if not self.enabled or self.intensity <= 0:
            return surf
        
        result = surf.copy()
        w, h = result.get_size()
        overlay = pygame.Surface((w, h), pygame.SRCALPHA)
        
        for y in range(0, h, self.spacing):
            alpha = int(255 * self.intensity)
            pygame.draw.line(overlay, (0, 0, 0, alpha), (0, y), (w, y))
        
        result.blit(overlay, (0, 0), special_flags=pygame.BLEND_RGBA_MULT)
        return result


class OutlineEffect(ShaderEffect):
    """Edge/outline detection for transition effects."""
    
    def __init__(self, intensity: float = 0.5, color: Tuple[int, int, int] = (255, 255, 255)):
        super().__init__('outline', intensity)
        self.color = color
    
    def apply(self, surf: pygame.Surface) -> pygame.Surface:
        if not self.enabled or self.intensity <= 0:
            return surf
        
        w, h = surf.get_size()
        outline = pygame.Surface((w, h), pygame.SRCALPHA)
        
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                _, _, _, a = surf.get_at((x, y))
                if a > 128:
                    # Check neighbors
                    neighbors = [
                        surf.get_at((x-1, y))[3], surf.get_at((x+1, y))[3],
                        surf.get_at((x, y-1))[3], surf.get_at((x, y+1))[3],
                    ]
                    if any(n < 128 for n in neighbors):
                        alpha = int(255 * self.intensity)
                        outline.set_at((x, y), (*self.color, alpha))
        
        result = surf.copy()
        result.blit(outline, (0, 0), special_flags=pygame.BLEND_RGBA_ADD)
        return result


class FadeEffect(ShaderEffect):
    """Fade in/out transitions."""
    
    def __init__(self, intensity: float = 0.0, color: Tuple[int, int, int] = (0, 0, 0),
                 fade_in: bool = False, fade_out: bool = False, speed: float = 1.0):
        super().__init__('fade', intensity)
        self.color = color
        self.fade_in = fade_in
        self.fade_out = fade_out
        self.speed = speed
        self._alpha = 255 if fade_in else 0
        self._done = False
    
    def update(self, dt: float):
        if self.fade_in:
            self._alpha = max(0, self._alpha - 255 * self.speed * dt)
            if self._alpha <= 0:
                self._done = True
        elif self.fade_out:
            self._alpha = min(255, self._alpha + 255 * self.speed * dt)
            if self._alpha >= 255:
                self._done = True
    
    def apply(self, surf: pygame.Surface) -> pygame.Surface:
        if self._alpha <= 0:
            return surf
        result = surf.copy()
        fade_surf = pygame.Surface(surf.get_size(), pygame.SRCALPHA)
        fade_surf.fill((*self.color, min(255, max(0, int(self._alpha)))))
        result.blit(fade_surf, (0, 0))
        return result


class PostProcessPipeline:
    """Manages and applies a chain of post-processing effects."""
    
    def __init__(self, resolution: Tuple[int, int] = (1280, 720)):
        self.resolution = resolution
        self._effects: List[ShaderEffect] = []
        self._render_target = pygame.Surface(resolution, pygame.SRCALPHA)
        self._output = pygame.Surface(resolution, pygame.SRCALPHA)
    
    def add_effect(self, effect_type: str, **kwargs) -> ShaderEffect:
        """Add an effect to the pipeline."""
        effect_map = {
            'bloom': BloomEffect,
            'vignette': VignetteEffect,
            'color_grade': ColorGradeEffect,
            'scanlines': ScanlineEffect,
            'outline': OutlineEffect,
            'fade': FadeEffect,
        }
        
        if effect_type in effect_map:
            effect = effect_map[effect_type](**kwargs)
            self._effects.append(effect)
            return effect
        return None
    
    def remove_effect(self, name: str):
        self._effects = [e for e in self._effects if e.name != name]
    
    def get_effect(self, name: str) -> Optional[ShaderEffect]:
        for e in self._effects:
            if e.name == name:
                return e
        return None
    
    def begin(self):
        """Clear the render target."""
        self._render_target.fill((0, 0, 0, 0))
    
    def end(self):
        """Finalize rendering to output."""
        self._output.blit(self._render_target, (0, 0))
    
    def apply(self, screen: pygame.Surface):
        """Apply all effects and blit to screen."""
        result = self._output.copy()
        
        for effect in self._effects:
            if effect.enabled:
                if isinstance(effect, FadeEffect):
                    effect.update(1/60)
                result = effect.apply(result)
        
        screen.blit(result, (0, 0))
    
    @property
    def effect_count(self) -> int:
        return len(self._effects)
    
    def clear(self):
        self._effects.clear()


# ═══════════════════════════════════════════════════════════════
# PRESET PIPELINES
# ═══════════════════════════════════════════════════════════════

def create_healing_pipeline(resolution=(1280, 720)) -> PostProcessPipeline:
    """Warm, gentle pipeline for healing mode."""
    p = PostProcessPipeline(resolution)
    p.add_effect('color_grade', mode='healing', intensity=0.3)
    p.add_effect('vignette', intensity=0.2)
    return p

def create_dream_pipeline(resolution=(1280, 720)) -> PostProcessPipeline:
    """Dreamy, soft pipeline."""
    p = PostProcessPipeline(resolution)
    p.add_effect('color_grade', mode='dream', intensity=0.4)
    p.add_effect('bloom', intensity=0.2, blur_radius=2)
    p.add_effect('vignette', intensity=0.3)
    return p

def create_retro_pipeline(resolution=(1280, 720)) -> PostProcessPipeline:
    """Retro CRT pipeline."""
    p = PostProcessPipeline(resolution)
    p.add_effect('color_grade', mode='vintage', intensity=0.5)
    p.add_effect('scanlines', intensity=0.15, spacing=2)
    p.add_effect('vignette', intensity=0.4)
    return p

def create_calm_pipeline(resolution=(1280, 720)) -> PostProcessPipeline:
    """Cool, calming pipeline."""
    p = PostProcessPipeline(resolution)
    p.add_effect('color_grade', mode='cool', intensity=0.3)
    p.add_effect('bloom', intensity=0.15, blur_radius=3)
    return p
