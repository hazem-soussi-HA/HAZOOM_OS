"""Super Mario GTA6 — Game package. All modules in one place."""
from .constants import *
from .tiles import get_tile_surface as get_tile
from .sprites import get_mario, HEART_F, HEART_E
from .level import parse_level, LEVELS
from .collision import player_tile_collision as player_tile_col
from .ecs import (
    World, Entity, System,
    Position, Velocity, Acceleration, CollisionBox, Sprite, Animation,
    PlayerControlled, DefenderAI, PowerUpItem, Particle, Camera,
    Health, Score, LevelTransition, AudioSource,
    DashPanel, ShieldZone, HarmonyFlower,
    InputSystem, PhysicsSystem, AnimationSystem, RenderSystem,
    ParticleSystem, DefenderAISystem, CameraSystem,
    create_player, create_defender, create_powerup, create_camera,
)
# ParticlePool is in the main engine (mario_gta6_2d.py) for now
ParticlePool = None
try:
    from .game import Game
except ImportError:
    Game = None  # Fallback if game.py has issues
try:
    from .main import main
except ImportError:
    def main(): pass
