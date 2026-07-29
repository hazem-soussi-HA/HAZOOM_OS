"""
SUPER MARIO GTA6 — Animation State Machine (FSM)
═══════════════════════════════════════════════════════════════

Finite State Machine for character animations.
States: idle, walk, run, jump, fall, dash, hurt, recruit, celebrate
Transitions: conditional, event-driven, timed

Usage:
    fsm = AnimationFSM()
    fsm.add_state('idle', frames=idle_frames, loop=True)
    fsm.add_state('walk', frames=walk_frames, loop=True)
    fsm.add_state('jump', frames=jump_frames, loop=False)
    fsm.add_transition('idle', 'walk', condition=lambda e: e.vx != 0)
    fsm.add_transition('walk', 'idle', condition=lambda e: e.vx == 0)
    fsm.add_transition('idle', 'jump', condition=lambda e: e.jump_pressed)
    fsm.add_transition('jump', 'fall', condition=lambda e: e.vy > 0)
    fsm.add_transition('fall', 'idle', condition=lambda e: e.on_ground)
    
    fsm.update(entity, dt)
"""

from dataclasses import dataclass, field
from typing import Dict, List, Callable, Optional, Any, Tuple
import pygame


@dataclass
class AnimationState:
    """A single animation state."""
    name: str
    frames: list = field(default_factory=list)  # list of pygame.Surface
    frame_times: list = field(default_factory=list)  # seconds per frame
    loop: bool = True
    priority: int = 0  # higher = can interrupt lower
    on_enter: Optional[Callable] = None  # callback when entering state
    on_exit: Optional[Callable] = None  # callback when exiting state
    on_frame: Optional[Callable] = None  # callback per frame (frame_idx)
    
    def __post_init__(self):
        if self.frames and not self.frame_times:
            self.frame_times = [0.1] * len(self.frames)


@dataclass
class Transition:
    """A transition between two animation states."""
    from_state: str
    to_state: str
    condition: Callable  # function(entity) -> bool
    priority: int = 0
    cooldown: float = 0.0  # minimum time between transitions
    on_transition: Optional[Callable] = None  # callback


class AnimationFSM:
    """Finite State Machine for sprite animations."""
    
    def __init__(self, initial_state: str = "idle"):
        self._states: Dict[str, AnimationState] = {}
        self._transitions: Dict[str, List[Transition]] = {}  # from_state -> [transitions]
        self._current_state: Optional[AnimationState] = None
        self._current_state_name: str = ""
        self._frame_index: int = 0
        self._frame_timer: float = 0.0
        self._transition_cooldowns: Dict[str, float] = {}  # transition_key -> timer
        self._initial_state_name = initial_state
        self._finished: bool = False  # True when non-looping animation completes
    
    def add_state(self, name: str, frames: list = None, frame_times: list = None,
                  loop: bool = True, priority: int = 0,
                  on_enter=None, on_exit=None, on_frame=None) -> 'AnimationFSM':
        """Add an animation state."""
        state = AnimationState(
            name=name, frames=frames or [], frame_times=frame_times or [],
            loop=loop, priority=priority,
            on_enter=on_enter, on_exit=on_exit, on_frame=on_frame
        )
        self._states[name] = state
        if not self._current_state:
            self._current_state = state
            self._current_state_name = name
        return self
    
    def add_transition(self, from_state: str, to_state: str,
                       condition: Callable, priority: int = 0,
                       cooldown: float = 0.0, on_transition=None) -> 'AnimationFSM':
        """Add a transition between states."""
        trans = Transition(
            from_state=from_state, to_state=to_state,
            condition=condition, priority=priority,
            cooldown=cooldown, on_transition=on_transition
        )
        if from_state not in self._transitions:
            self._transitions[from_state] = []
        self._transitions[from_state].append(trans)
        # Sort by priority (highest first)
        self._transitions[from_state].sort(key=lambda t: -t.priority)
        return self
    
    def force_state(self, state_name: str):
        """Force a state change (ignores transitions)."""
        if state_name in self._states:
            old_state = self._current_state
            if old_state and old_state.on_exit:
                old_state.on_exit()
            self._current_state = self._states[state_name]
            self._current_state_name = state_name
            self._frame_index = 0
            self._frame_timer = 0.0
            self._finished = False
            if self._current_state.on_enter:
                self._current_state.on_enter()
    
    def update(self, entity: Any, dt: float) -> pygame.Surface:
        """Update the FSM and return the current frame surface."""
        if not self._current_state:
            return None
        
        # Update cooldowns
        for key in list(self._transition_cooldowns.keys()):
            self._transition_cooldowns[key] -= dt
            if self._transition_cooldowns[key] <= 0:
                del self._transition_cooldowns[key]
        
        # Check transitions
        if self._current_state_name in self._transitions:
            for trans in self._transitions[self._current_state_name]:
                # Check cooldown
                trans_key = f"{trans.from_state}->{trans.to_state}"
                if trans_key in self._transition_cooldowns:
                    continue
                # Check priority (can't interrupt higher priority)
                if self._current_state and trans.priority < self._current_state.priority:
                    continue
                # Check condition
                try:
                    if trans.condition(entity):
                        # Perform transition
                        old_state = self._current_state
                        if old_state and old_state.on_exit:
                            old_state.on_exit()
                        self._current_state = self._states.get(trans.to_state)
                        self._current_state_name = trans.to_state
                        self._frame_index = 0
                        self._frame_timer = 0.0
                        self._finished = False
                        if trans.cooldown > 0:
                            self._transition_cooldowns[trans_key] = trans.cooldown
                        if trans.on_transition:
                            trans.on_transition()
                        if self._current_state and self._current_state.on_enter:
                            self._current_state.on_enter()
                        break
                except Exception:
                    pass  # Condition evaluation failed, skip
        
        # Update frame timer
        state = self._current_state
        if not state or not state.frames:
            return None
        
        self._frame_timer += dt
        if self._frame_timer >= state.frame_times[self._frame_index]:
            self._frame_timer = 0.0
            self._frame_index += 1
            if self._frame_index >= len(state.frames):
                if state.loop:
                    self._frame_index = 0
                else:
                    self._frame_index = len(state.frames) - 1
                    self._finished = True
        
        # Frame callback
        if state.on_frame:
            state.on_frame(self._frame_index)
        
        return state.frames[self._frame_index]
    
    @property
    def current_state(self) -> str:
        return self._current_state_name
    
    @property
    def current_frame(self) -> int:
        return self._frame_index
    
    @property
    def is_finished(self) -> bool:
        return self._finished
    
    @property
    def frame_count(self) -> int:
        if self._current_state:
            return len(self._current_state.frames)
        return 0


def create_player_animator() -> AnimationFSM:
    """Create a pre-configured animation FSM for the player."""
    fsm = AnimationFSM(initial_state="idle")
    
    # States are added with placeholder frames (actual surfaces loaded at runtime)
    fsm.add_state("idle", loop=True, priority=0)
    fsm.add_state("walk", loop=True, priority=0)
    fsm.add_state("run", loop=True, priority=0)
    fsm.add_state("jump", loop=False, priority=1)
    fsm.add_state("fall", loop=True, priority=1)
    fsm.add_state("dash", loop=False, priority=2)
    fsm.add_state("hurt", loop=False, priority=3)
    fsm.add_state("celebrate", loop=False, priority=2)
    
    # Transitions
    fsm.add_transition("idle", "walk", lambda e: abs(e.get('vx', 0)) > 20 and e.get('on_ground', True))
    fsm.add_transition("walk", "idle", lambda e: abs(e.get('vx', 0)) <= 20)
    fsm.add_transition("walk", "run", lambda e: abs(e.get('vx', 0)) > WALK * 0.95)
    fsm.add_transition("run", "walk", lambda e: abs(e.get('vx', 0)) <= WALK * 0.95)
    fsm.add_transition("idle", "jump", lambda e: e.get('jump_pressed', False))
    fsm.add_transition("walk", "jump", lambda e: e.get('jump_pressed', False))
    fsm.add_transition("run", "jump", lambda e: e.get('jump_pressed', False))
    fsm.add_transition("jump", "fall", lambda e: e.get('vy', 0) > 0)
    fsm.add_transition("fall", "idle", lambda e: e.get('on_ground', False))
    fsm.add_transition("fall", "walk", lambda e: e.get('on_ground', False) and abs(e.get('vx', 0)) > 20)
    fsm.add_transition("idle", "dash", lambda e: e.get('dash_pressed', False))
    fsm.add_transition("walk", "dash", lambda e: e.get('dash_pressed', False))
    fsm.add_transition("run", "dash", lambda e: e.get('dash_pressed', False))
    fsm.add_transition("dash", "idle", lambda e: e.get('dash_timer', 0) <= 0)
    fsm.add_transition("any", "hurt", lambda e: e.get('hurt', False), priority=3)
    fsm.add_transition("hurt", "idle", lambda e: fsm.is_finished)
    fsm.add_transition("idle", "celebrate", lambda e: e.get('celebrate', False), priority=2)
    fsm.add_transition("celebrate", "idle", lambda e: fsm.is_finished)
    
    return fsm


def create_defender_animator() -> AnimationFSM:
    """Create a pre-configured animation FSM for defenders."""
    fsm = AnimationFSM(initial_state="walk")
    
    fsm.add_state("walk", loop=True, priority=0)
    fsm.add_state("push", loop=False, priority=1)
    fsm.add_state("recruit", loop=False, priority=2)
    fsm.add_state("buddy_idle", loop=True, priority=0)
    fsm.add_state("buddy_follow", loop=True, priority=0)
    
    fsm.add_transition("walk", "push", lambda e: e.get('push_timer', 0) > 0)
    fsm.add_transition("push", "walk", lambda e: e.get('push_timer', 0) <= 0)
    fsm.add_transition("walk", "recruit", lambda e: e.get('recruit', False), priority=2)
    fsm.add_transition("recruit", "buddy_idle", lambda e: fsm.is_finished)
    fsm.add_transition("buddy_idle", "buddy_follow", lambda e: abs(e.get('vx', 0)) > 5)
    fsm.add_transition("buddy_follow", "buddy_idle", lambda e: abs(e.get('vx', 0)) <= 5)
    
    return fsm


# Constants for transitions (referenced in lambdas)
WALK = 220
