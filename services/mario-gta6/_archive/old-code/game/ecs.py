"""
SUPER MARIO GTA6 — Entity Component System (ECS)
═══════════════════════════════════════════════════════════════

Design: Pure Python ECS with component-based architecture.
Entities = just IDs. Components = data. Systems = logic.

Usage:
    world = World()
    player = world.create_entity()
    player.add(Position(x=100, y=200))
    player.add(Velocity(vx=0, vy=0))
    player.add(Sprite(surface=mario_img))
    player.add(PlayerControlled())
    player.add(CollisionBox(w=36, h=40))

    # Systems process entities with specific components
    physics = world.add_system(PhysicsSystem())
    render = world.add_system(RenderSystem(screen))
    input = world.add_system(InputSystem())
    
    # Game loop
    input.update(dt)   # reads keys, sets velocity on entities with PlayerControlled
    physics.update(dt) # moves entities with Position+Velocity+CollisionBox
    render.update(dt)  # draws entities with Position+Sprite
"""

from dataclasses import dataclass, field
from typing import Dict, List, Set, Type, Any, Optional, Callable
import weakref
import math
import pygame

# Import game constants if available
try:
    from .constants import GRAV, TILE, WW, WH, SOLID_TILES, PH_SMALL, PH_BIG, PW
except ImportError:
    GRAV = 2200; TILE = 48; WW = 200; WH = 15
    SOLID_TILES = set(); PH_SMALL = 40; PH_BIG = 80; PW = 36


# ═══════════════════════════════════════════════════════════════
# ID GENERATION
# ═══════════════════════════════════════════════════════════════

_next_entity_id = 0

def _next_id() -> int:
    global _next_entity_id
    _next_entity_id += 1
    return _next_entity_id


def reset_ids():
    """Reset entity ID counter (for new game sessions)."""
    global _next_entity_id
    _next_entity_id = 0


# ═══════════════════════════════════════════════════════════════
# COMPONENTS (Pure data, no logic)
# ═══════════════════════════════════════════════════════════════

@dataclass
class Position:
    x: float = 0.0
    y: float = 0.0

@dataclass
class Velocity:
    vx: float = 0.0
    vy: float = 0.0

@dataclass
class Acceleration:
    ax: float = 0.0
    ay: float = 2200.0  # gravity

@dataclass
class CollisionBox:
    w: int = 36
    h: int = 40
    solid: bool = True

@dataclass
class Sprite:
    surface: Any = None  # pygame.Surface
    layer: int = 0  # render order
    visible: bool = True
    alpha: int = 255
    flip_x: bool = False
    flip_y: bool = False
    scale_x: float = 1.0
    scale_y: float = 1.0
    tint: tuple = (255, 255, 255)  # color multiply
    outline: bool = False  # outline effect for transitions

@dataclass
class Animation:
    frames: list = field(default_factory=list)  # list of pygame.Surface
    frame_times: list = field(default_factory=list)  # duration per frame
    current_frame: int = 0
    timer: float = 0.0
    loop: bool = True
    playing: bool = True
    state: str = "idle"  # animation state name

@dataclass
class PlayerControlled:
    player_id: int = 0
    # Input state
    move_x: float = 0.0
    jump_pressed: bool = False
    jump_held: bool = False
    dash_pressed: bool = False
    shoot_pressed: bool = False
    # Buffers
    jump_buffer: float = 0.0
    dash_cooldown: float = 0.0
    shield_timer: float = 0.0
    # State
    on_ground: bool = False
    facing_right: bool = True
    is_dashing: bool = False
    dash_timer: float = 0.0
    invincible: float = 0.0
    star_timer: float = 0.0
    combo: int = 0
    combo_timer: float = 0.0

@dataclass
class DefenderAI:
    """AI for defender entities (not enemies — defenders)."""
    speed: float = 60.0
    direction: int = -1  # -1=left, 1=right
    buddy: bool = False
    recruit_timer: float = 0.0
    push_vx: float = 0.0
    push_vy: float = 0.0
    push_timer: float = 0.0
    harmony: int = 0  # harmony points when recruited

@dataclass
class PowerUpItem:
    """Component for power-up items."""
    ptype: str = "mushroom"  # mushroom, fire_flower, star, one_up, shield, harmony
    score: int = 1000
    emerge: bool = True
    emerge_target_y: float = 0.0

@dataclass
class Particle:
    """Single particle (used by particle pool)."""
    x: float = 0.0
    y: float = 0.0
    vx: float = 0.0
    vy: float = 0.0
    life: float = 1.0
    max_life: float = 1.0
    size: int = 3
    color: tuple = (255, 255, 255)
    kind: str = "dust"  # dust, spark, peace, harmony, explosion, coin
    spin: float = 0.0
    rot: float = 0.0
    rot_spd: float = 0.0
    gravity: float = 0.5

@dataclass
class Camera:
    """Camera component (singleton — only one entity should have this)."""
    x: float = 0.0
    y: float = 0.0
    lookahead: float = 200.0
    smooth: float = 8.0
    shake_intensity: float = 0.0
    shake_duration: float = 0.0
    shake_timer: float = 0.0
    zoom: float = 1.0
    target_entity: int = 0  # entity ID to follow

@dataclass
class Tile:
    """Tile component for tilemap entities."""
    tile_type: int = 0
    solid: bool = False
    animated: bool = False
    animation_frames: list = field(default_factory=list)

@dataclass
class Health:
    """Health component (for display, not combat)."""
    current: int = 3
    maximum: int = 3
    shield: float = 0.0  # shield timer

@dataclass
class Score:
    """Score component."""
    value: int = 0
    coins: int = 0
    buddies: int = 0
    harmony: int = 0

@dataclass
class LevelTransition:
    """Level transition state."""
    active: bool = False
    progress: float = 0.0
    from_level: int = 0
    to_level: int = 0
    fade_alpha: int = 0
    state: str = "none"  # none, fade_out, loading, fade_in

@dataclass
class AudioSource:
    """Audio component for entities that make sounds."""
    sound_name: str = ""
    channel: int = -1
    volume: float = 1.0
    loop: bool = False
    priority: int = 0

@dataclass
class DashPanel:
    """Dash panel tile component."""
    boost_speed: float = 600.0
    direction: int = 1
    cooldown: float = 0.5

@dataclass
class ShieldZone:
    """Shield zone tile component."""
    duration: float = 2.0
    radius: float = 48.0

@dataclass
class HarmonyFlower:
    """Harmony flower tile component."""
    harmony_value: int = 1
    score_value: int = 500
    collected: bool = False


# ═══════════════════════════════════════════════════════════════
# ENTITY
# ═══════════════════════════════════════════════════════════════

class Entity:
    """An entity is just an ID with components attached."""
    
    def __init__(self, eid: int):
        self.id = eid
        self._components: Dict[type, Any] = {}
        self._tags: Set[str] = set()
        self.alive = True
    
    def add(self, component) -> 'Entity':
        """Add a component to this entity."""
        self._components[type(component)] = component
        return self
    
    def get(self, component_type: Type) -> Optional[Any]:
        """Get a component by type."""
        return self._components.get(component_type)
    
    def has(self, *component_types) -> bool:
        """Check if entity has all specified component types."""
        return all(ct in self._components for ct in component_types)
    
    def remove(self, component_type: Type):
        """Remove a component."""
        self._components.pop(component_type, None)
    
    def tag(self, tag: str) -> 'Entity':
        """Add a tag."""
        self._tags.add(tag)
        return self
    
    def has_tag(self, tag: str) -> bool:
        return tag in self._tags
    
    def destroy(self):
        """Mark entity for destruction."""
        self.alive = False
        self._components.clear()
        self._tags.clear()
    
    def __repr__(self):
        comps = ', '.join(c.__name__ for c in self._components)
        return f"Entity({self.id}, [{comps}])"


# ═══════════════════════════════════════════════════════════════
# WORLD (Entity Manager)
# ═══════════════════════════════════════════════════════════════

class World:
    """Manages all entities and systems."""
    
    def __init__(self):
        self._entities: Dict[int, Entity] = {}
        self._systems: List['System'] = []
        self._to_destroy: List[int] = []
        self._component_index: Dict[type, Set[int]] = {}  # component_type -> set of entity IDs
    
    def create_entity(self) -> Entity:
        """Create a new entity."""
        eid = _next_id()
        entity = Entity(eid)
        self._entities[eid] = entity
        return entity
    
    def get_entity(self, eid: int) -> Optional[Entity]:
        return self._entities.get(eid)
    
    def destroy_entity(self, eid: int):
        """Mark an entity for destruction."""
        self._to_destroy.append(eid)
    
    def _process_destructions(self):
        """Actually remove destroyed entities."""
        for eid in self._to_destroy:
            entity = self._entities.pop(eid, None)
            if entity:
                # Remove from component index
                for ct in list(entity._components.keys()):
                    if ct in self._component_index:
                        self._component_index[ct].discard(eid)
        self._to_destroy.clear()
    
    def add_system(self, system: 'System') -> 'System':
        """Add a system to the world."""
        system.world = self
        self._systems.append(system)
        # Sort by priority
        self._systems.sort(key=lambda s: s.priority)
        return system
    
    def get_system(self, system_type: Type) -> Optional['System']:
        for s in self._systems:
            if isinstance(s, system_type):
                return s
        return None
    
    def query(self, *component_types) -> List[Entity]:
        """Get all entities that have ALL specified component types."""
        if not component_types:
            return list(self._entities.values())
        
        # Use component index for fast lookup
        sets = []
        for ct in component_types:
            if ct not in self._component_index:
                self._component_index[ct] = {eid for eid, e in self._entities.items() if ct in e._components}
            sets.append(self._component_index[ct])
        
        if not sets:
            return []
        
        # Intersection of all sets
        result_ids = sets[0]
        for s in sets[1:]:
            result_ids = result_ids & s
        
        return [self._entities[eid] for eid in result_ids if eid in self._entities]
    
    def query_tag(self, tag: str) -> List[Entity]:
        """Get all entities with a specific tag."""
        return [e for e in self._entities.values() if e.has_tag(tag)]
    
    def update(self, dt: float):
        """Update all systems."""
        for system in self._systems:
            if system.enabled:
                system.update(dt)
        self._process_destructions()
    
    @property
    def entity_count(self) -> int:
        return len(self._entities)
    
    @property
    def system_count(self) -> int:
        return len(self._systems)


# ═══════════════════════════════════════════════════════════════
# SYSTEMS (Logic processors)
# ═══════════════════════════════════════════════════════════════

class System:
    """Base class for all systems."""
    
    def __init__(self, priority: int = 0):
        self.priority = priority
        self.enabled = True
        self.world: Optional[World] = None
    
    def update(self, dt: float):
        """Override this in subclasses."""
        pass
    
    def on_entity_added(self, entity: Entity):
        """Called when an entity is added that matches this system's query."""
        pass
    
    def on_entity_removed(self, entity: Entity):
        """Called when a matching entity is removed."""
        pass


class InputSystem(System):
    """Processes input and updates PlayerControlled components."""
    
    def __init__(self):
        super().__init__(priority=0)  # First
        self.key_bindings = {
            'left': [pygame.K_a, pygame.K_LEFT],
            'right': [pygame.K_d, pygame.K_RIGHT],
            'jump': [pygame.K_SPACE, pygame.K_w, pygame.K_UP],
            'run': [pygame.K_LSHIFT, pygame.K_RSHIFT],
            'dash': [pygame.K_LCTRL, pygame.K_z],
            'shoot': [pygame.K_x, pygame.K_RCTRL],
            'pause': [pygame.K_p],
        }
    
    def update(self, dt: float):
        keys = pygame.key.get_pressed()
        
        for entity in self.world.query(PlayerControlled):
            pc = entity.get(PlayerControlled)
            
            # Movement
            pc.move_x = 0.0
            if any(keys[k] for k in self.key_bindings['left']):
                pc.move_x -= 1.0
            if any(keys[k] for k in self.key_bindings['right']):
                pc.move_x += 1.0
            
            # Jump
            pc.jump_held = any(keys[k] for k in self.key_bindings['jump'])
            # Jump buffer is handled in physics system
            
            # Dash
            pc.dash_pressed = any(keys[k] for k in self.key_bindings['dash'])
            
            # Shoot
            pc.shoot_pressed = any(keys[k] for k in self.key_bindings['shoot'])
            
            # Facing direction
            if pc.move_x > 0:
                pc.facing_right = True
            elif pc.move_x < 0:
                pc.facing_right = False


class PhysicsSystem(System):
    """Handles physics: gravity, movement, collision."""
    
    def __init__(self, gravity: float = 2200.0):
        super().__init__(priority=10)
        self.gravity = gravity
        self.tile_map = None  # Set externally
    
    def set_tile_map(self, tile_map):
        self.tile_map = tile_map
    
    def update(self, dt: float):
        for entity in self.world.query(Position, Velocity):
            pos = entity.get(Position)
            vel = entity.get(Velocity)
            
            # Apply gravity
            acc = entity.get(Acceleration)
            if acc:
                vel.vy += acc.ay * dt
            
            # Move
            pos.x += vel.vx * dt
            pos.y += vel.vy * dt
            
            # Tile collision (if tile map available)
            if self.tile_map:
                cb = entity.get(CollisionBox)
                if cb:
                    self._resolve_tile_collision(entity, pos, vel, cb, dt)
    
    def _resolve_tile_collision(self, entity, pos, vel, cb, dt):
        """Resolve collision with tile map."""
        if not self.tile_map:
            return
        
        # Check horizontal
        new_x = pos.x + vel.vx * dt
        for ty in range(int(pos.y // TILE), int((pos.y + cb.h) // TILE) + 1):
            for tx in range(int(new_x // TILE), int((new_x + cb.w) // TILE) + 1):
                if 0 <= ty < WH and 0 <= tx < WW:
                    if self.tile_map[ty][tx] in SOLID:
                        if vel.vx > 0:
                            pos.x = tx * TILE - cb.w - 0.01
                        elif vel.vx < 0:
                            pos.x = (tx + 1) * TILE + 0.01
                        vel.vx = 0
                        break
        
        # Check vertical
        new_y = pos.y + vel.vy * dt
        for ty in range(int(new_y // TILE), int((new_y + cb.h) // TILE) + 1):
            for tx in range(int(pos.x // TILE), int((pos.x + cb.w) // TILE) + 1):
                if 0 <= ty < WH and 0 <= tx < WW:
                    if self.tile_map[ty][tx] in SOLID:
                        if vel.vy >= 0:
                            pos.y = ty * TILE - cb.h
                            vel.vy = 0
                            pc = entity.get(PlayerControlled)
                            if pc:
                                pc.on_ground = True
                                pc.jmp = False
                        elif vel.vy < 0:
                            pos.y = (ty + 1) * TILE + cb.h
                            vel.vy = 50
                        break


class AnimationSystem(System):
    """Updates animation frames."""
    
    def __init__(self):
        super().__init__(priority=20)
    
    def update(self, dt: float):
        for entity in self.world.query(Animation):
            anim = entity.get(Animation)
            if not anim.playing or not anim.frames:
                continue
            
            anim.timer += dt
            if anim.timer >= anim.frame_times[anim.current_frame]:
                anim.timer = 0
                anim.current_frame += 1
                if anim.current_frame >= len(anim.frames):
                    if anim.loop:
                        anim.current_frame = 0
                    else:
                        anim.current_frame = len(anim.frames) - 1
                        anim.playing = False
            
            # Update sprite surface
            sprite = entity.get(Sprite)
            if sprite and anim.frames:
                sprite.surface = anim.frames[anim.current_frame]


class RenderSystem(System):
    """Renders entities with Position and Sprite components."""
    
    def __init__(self, screen, camera_entity_id: int = 0):
        super().__init__(priority=100)  # Last
        self.screen = screen
        self.camera_entity_id = camera_entity_id
        self._render_list: List[tuple] = []  # (layer, entity)
    
    def update(self, dt: float):
        # Get camera position
        cam_x, cam_y = 0, 0
        cam_entity = self.world.get_entity(self.camera_entity_id)
        if cam_entity:
            cam_pos = cam_entity.get(Position)
            if cam_pos:
                cam_x, cam_y = int(cam_pos.x), int(cam_pos.y)
        
        # Build render list
        self._render_list.clear()
        for entity in self.world.query(Position, Sprite):
            pos = entity.get(Position)
            sprite = entity.get(Sprite)
            if not sprite.visible or not sprite.surface:
                continue
            self._render_list.append((sprite.layer, entity))
        
        # Sort by layer
        self._render_list.sort(key=lambda x: x[0])
        
        # Render
        for layer, entity in self._render_list:
            pos = entity.get(Position)
            sprite = entity.get(Sprite)
            
            # Cull off-screen
            sx = int(pos.x - cam_x)
            sy = int(pos.y - cam_y)
            if sx < -200 or sx > 1480 or sy < -200 or sy > 920:
                continue
            
            # Apply effects
            surf = sprite.surface
            if sprite.flip_x or sprite.flip_y:
                surf = pygame.transform.flip(surf, sprite.flip_x, sprite.flip_y)
            if sprite.scale_x != 1.0 or sprite.scale_y != 1.0:
                new_w = max(1, int(surf.get_width() * sprite.scale_x))
                new_h = max(1, int(surf.get_height() * sprite.scale_y))
                surf = pygame.transform.scale(surf, (new_w, new_h))
            if sprite.alpha < 255:
                surf = surf.copy()
                surf.set_alpha(sprite.alpha)
            if sprite.tint != (255, 255, 255):
                surf = surf.copy()
                surf.fill(sprite.tint + (0,), None, pygame.BLEND_RGB_MULT)
            
            self.screen.blit(surf, (sx, sy))


class ParticleSystem(System):
    """Updates and renders particles."""
    
    def __init__(self):
        super().__init__(priority=50)
        self.pool = ParticlePool(1000)
    
    def update(self, dt: float):
        self.pool.update(dt)
    
    def draw(self, screen, cam_x: int, cam_y: int):
        self.pool.draw(screen, cam_x)


class DefenderAISystem(System):
    """AI for defender entities."""
    
    def __init__(self):
        super().__init__(priority=15)
    
    def update(self, dt: float):
        for entity in self.world.query(Position, Velocity, DefenderAI):
            ai = entity.get(DefenderAI)
            pos = entity.get(Position)
            vel = entity.get(Velocity)
            
            if ai.buddy:
                # Buddy follows player
                player_entities = self.world.query_tag("player")
                if player_entities:
                    player_pos = player_entities[0].get(Position)
                    if player_pos:
                        target_x = player_pos.x + (24 if player_entities[0].get(PlayerControlled).facing_right else -24)
                        target_y = player_pos.y - PH_SMALL
                        pos.x += (target_x - pos.x) * 5 * dt
                        pos.y += (target_y - pos.y) * 5 * dt
                continue
            
            # Push recovery
            if ai.push_timer > 0:
                ai.push_timer -= dt
                vel.vx *= 0.9
                vel.vy *= 0.9
                continue
            
            # Gravity
            vel.vy += GRAV * dt
            vel.vy = min(vel.vy, MFALL)
            
            # Move
            pos.x += vel.vx * dt
            pos.y += vel.vy * dt
            
            # Wall collision
            check_x = pos.x + (36 if vel.vx > 0 else 0)
            tx = int(check_x // TILE)
            for ty in range(int(pos.y // TILE), int((pos.y + 40) // TILE) + 1):
                if 0 <= ty < WH and 0 <= tx < WW:
                    if self._is_solid(tx, ty):
                        vel.vx *= -1
                        ai.direction *= -1
                        break
            
            # Ground collision
            ty = int((pos.y + 40) // TILE)
            for tx in range(int(pos.x // TILE), int((pos.x + 36) // TILE) + 1):
                if 0 <= ty < WH and 0 <= tx < WW:
                    if self._is_solid(tx, ty):
                        pos.y = ty * TILE - 40
                        vel.vy = 0
                        break
            
            # Edge detection
            edge_tx = int((pos.x + (36 if vel.vx > 0 else 0)) // TILE)
            below_ty = int((pos.y + 44) // TILE)
            if 0 <= below_ty < WH and 0 <= edge_tx < WW:
                if not self._is_solid(edge_tx, below_ty):
                    vel.vx *= -1
                    ai.direction *= -1
            
            pos.x = max(0, min(WW * TILE - 36, pos.x))
    
    def _is_solid(self, tx, ty):
        # This should reference the tile map
        return False  # Placeholder


class CameraSystem(System):
    """Updates camera position."""
    
    def __init__(self):
        super().__init__(priority=5)
    
    def update(self, dt: float):
        for entity in self.world.query(Camera, Position):
            cam = entity.get(Camera)
            pos = entity.get(Position)
            
            # Find target entity
            target = self.world.get_entity(cam.target_entity)
            if target:
                target_pos = target.get(Position)
                target_vel = target.get(Velocity)
                if target_pos and target_vel:
                    direction = 1 if target_vel.vx > 0 else -1 if target_vel.vx < 0 else 0
                    desired = target_pos.x - W // 3 + cam.lookahead * direction
                    desired = max(0, min(WW * TILE - W, desired))
                    pos.x += (desired - pos.x) * min(cam.smooth * dt, 1.0)
            
            # Shake
            ox, oy = 0, 0
            if cam.shake_timer < cam.shake_duration:
                cam.shake_timer += dt
                progress = cam.shake_timer / cam.shake_duration
                decay = 1.0 - progress
                t = cam.shake_timer * 30
                ox = math.sin(t * 7.3) * cam.shake_intensity * decay
                oy = math.cos(t * 5.7) * cam.shake_intensity * decay
            
            cam._offset_x = int(ox)
            cam._offset_y = int(oy)


# ═══════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def create_player(world: World, x: float, y: float) -> Entity:
    """Create a player entity with all required components."""
    player = world.create_entity()
    player.add(Position(x=x, y=y))
    player.add(Velocity())
    player.add(Acceleration(ay=GRAV))
    player.add(CollisionBox(w=PW, h=PH_SMALL))
    player.add(Sprite(layer=10))
    player.add(PlayerControlled())
    player.add(Health(current=3, maximum=3))
    player.add(Score())
    player.tag("player")
    return player


def create_defender(world: World, x: float, y: float, dtype: str = 'goomba') -> Entity:
    """Create a defender entity."""
    entity = world.create_entity()
    entity.add(Position(x=x, y=y))
    entity.add(Velocity(vx=-60))
    entity.add(CollisionBox(w=40, h=40))
    entity.add(Sprite(layer=5))
    entity.add(DefenderAI(speed=60))
    entity.tag("defender")
    return entity


def create_powerup(world: World, x: float, y: float, ptype: str = 'mushroom') -> Entity:
    """Create a power-up entity."""
    entity = world.create_entity()
    entity.add(Position(x=x, y=y))
    entity.add(Velocity(vy=-200))
    entity.add(CollisionBox(w=36, h=36))
    entity.add(Sprite(layer=5))
    entity.add(PowerUpItem(ptype=ptype))
    entity.tag("powerup")
    return entity


def create_tilemap_entity(world: World, tile_map: list) -> Entity:
    """Create a tilemap entity."""
    entity = world.create_entity()
    entity.add(Tile())
    entity.tag("tilemap")
    return entity


def create_camera(world: World, target_entity_id: int) -> Entity:
    """Create a camera entity."""
    entity = world.create_entity()
    entity.add(Position())
    entity.add(Camera(target_entity=target_entity_id))
    entity.tag("camera")
    return entity
