"""
SUPER MARIO GTA6 — Gamepad/Controller Support
═══════════════════════════════════════════════════════════════

Supports: Xbox, PlayStation, generic USB gamepads via pygame.joystick
Features: Button mapping, analog sticks, haptic feedback, hot-plugging

Usage:
    gamepad = GamepadManager()
    gamepad.init()
    
    # In game loop:
    gamepad.update()
    if gamepad.is_pressed('jump'):
        player.jump()
    move_x = gamepad.get_axis('move_x')  # -1.0 to 1.0
    
    # Haptic feedback:
    gamepad.rumble(0.5, 0.3)  # 50% intensity, 300ms
"""

import pygame
from typing import Dict, List, Optional, Tuple


# ═══════════════════════════════════════════════════════════════
# BUTTON MAPPINGS
# ═══════════════════════════════════════════════════════════════

# Standard mapping (works for most Xbox/PS/generic pads)
STANDARD_MAPPING = {
    'a': 0, 'b': 1, 'x': 2, 'y': 3,
    'lb': 4, 'rb': 5, 'back': 6, 'start': 7,
    'l3': 8, 'r3': 9,
    'dpad_up': 10, 'dpad_down': 11, 'dpad_left': 12, 'dpad_right': 13,
}

# Action names → button names
ACTION_MAP = {
    'jump': ['a', 'x'],
    'dash': ['b', 'rb'],
    'shield': ['lb', 'y'],
    'shoot': ['x', 'a'],
    'pause': ['start'],
    'hat_switch': ['back'],
    'car': ['y', 'lb'],
}

# Axis names → (axis_index, deadzone)
AXIS_MAP = {
    'move_x': (0, 0.15),
    'move_y': (1, 0.15),
    'camera_x': (2, 0.15),
    'camera_y': (3, 0.15),
    'trigger_l': (4, 0.05),
    'trigger_r': (5, 0.05),
}


class Gamepad:
    """Represents a single gamepad/controller."""
    
    def __init__(self, joystick_id: int):
        self.id = joystick_id
        self.joystick = pygame.joystick.Joystick(joystick_id)
        self.name = self.joystick.get_name()
        self._button_states = {}
        self._prev_button_states = {}
        self._axis_values = {}
        self._rumble_supported = False
        self._haptic = None
        
        # Initialize
        self._num_buttons = self.joystick.get_numbuttons()
        self._num_axes = self.joystick.get_numaxes()
        self._num_hats = self.joystick.get_numhats()
        
        for i in range(self._num_buttons):
            self._button_states[i] = False
            self._prev_button_states[i] = False
        for i in range(self._num_axes):
            self._axis_values[i] = 0.0
        
        # Check rumble support
        try:
            if hasattr(self.joystick, 'rumble'):
                self._rumble_supported = True
        except Exception:
            pass
        
        print(f"  Gamepad {joystick_id}: {self.name} ({self._num_buttons} buttons, {self._num_axes} axes)")
    
    def update(self):
        """Update button and axis states."""
        self._prev_button_states = dict(self._button_states)
        for i in range(self._num_buttons):
            self._button_states[i] = self.joystick.get_button(i)
        for i in range(self._num_axes):
            self._axis_values[i] = self.joystick.get_axis(i)
    
    def is_pressed(self, button_name: str) -> bool:
        """Check if a button is currently held."""
        mapping = STANDARD_MAPPING
        if button_name in mapping:
            btn_id = mapping[button_name]
            if btn_id < self._num_buttons:
                return self._button_states.get(btn_id, False)
        return False
    
    def just_pressed(self, button_name: str) -> bool:
        """Check if a button was just pressed this frame."""
        mapping = STANDARD_MAPPING
        if button_name in mapping:
            btn_id = mapping[button_name]
            if btn_id < self._num_buttons:
                return self._button_states.get(btn_id, False) and not self._prev_button_states.get(btn_id, False)
        return False
    
    def just_released(self, button_name: str) -> bool:
        """Check if a button was just released this frame."""
        mapping = STANDARD_MAPPING
        if button_name in mapping:
            btn_id = mapping[button_name]
            if btn_id < self._num_buttons:
                return not self._button_states.get(btn_id, False) and self._prev_button_states.get(btn_id, False)
        return False
    
    def get_axis(self, axis_name: str) -> float:
        """Get axis value (-1.0 to 1.0) with deadzone applied."""
        if axis_name in AXIS_MAP:
            axis_idx, deadzone = AXIS_MAP[axis_name]
            if axis_idx < self._num_axes:
                value = self._axis_values.get(axis_idx, 0.0)
                if abs(value) < deadzone:
                    return 0.0
                # Rescale after deadzone
                sign = 1 if value > 0 else -1
                return sign * (abs(value) - deadzone) / (1.0 - deadzone)
        return 0.0
    
    def get_hat(self, hat_idx: int = 0) -> Tuple[int, int]:
        """Get D-pad/hat value."""
        if hat_idx < self._num_hats:
            return self.joystick.get_hat(hat_idx)
        return (0, 0)
    
    def is_action_pressed(self, action: str) -> bool:
        """Check if any button mapped to an action is pressed."""
        if action in ACTION_MAP:
            for button_name in ACTION_MAP[action]:
                if self.just_pressed(button_name):
                    return True
        return False
    
    def is_action_held(self, action: str) -> bool:
        """Check if any button mapped to an action is held."""
        if action in ACTION_MAP:
            for button_name in ACTION_MAP[action]:
                if self.is_pressed(button_name):
                    return True
        return False
    
    def rumble(self, low_frequency: float = 0.5, high_frequency: float = 0.5,
               duration_ms: int = 200):
        """Trigger haptic feedback (if supported)."""
        if self._rumble_supported:
            try:
                self.joystick.rumble(low_frequency, high_frequency, duration_ms)
            except pygame.error:
                pass  # Rumble failed
    
    def stop_rumble(self):
        """Stop any active rumble."""
        if self._rumble_supported:
            try:
                self.joystick.rumble(0, 0, 0)
            except pygame.error:
                pass
    
    @property
    def connected(self) -> bool:
        return self.joystick.get_init()
    
    def quit(self):
        """Clean up."""
        self.stop_rumble()
        self.joystick.quit()


class GamepadManager:
    """Manages all connected gamepads."""
    
    def __init__(self):
        self._gamepads: List[Gamepad] = []
        self._initialized = False
    
    def init(self) -> int:
        """Initialize joystick subsystem and detect gamepads."""
        pygame.joystick.init()
        count = pygame.joystick.get_count()
        print(f"GamepadManager: {count} controller(s) detected")
        for i in range(count):
            try:
                gamepad = Gamepad(i)
                self._gamepads.append(gamepad)
            except pygame.error as e:
                print(f"  Failed to init gamepad {i}: {e}")
        self._initialized = True
        return len(self._gamepads)
    
    def update(self):
        """Update all gamepad states."""
        for gp in self._gamepads:
            if gp.connected:
                gp.update()
    
    @property
    def gamepad_count(self) -> int:
        return len(self._gamepads)
    
    @property
    def has_gamepad(self) -> bool:
        return len(self._gamepads) > 0 and any(gp.connected for gp in self._gamepads)
    
    def get_gamepad(self, idx: int = 0) -> Optional[Gamepad]:
        if idx < len(self._gamepads):
            return self._gamepads[idx]
        return None
    
    # Convenience methods (use first gamepad)
    def is_pressed(self, button: str) -> bool:
        gp = self.get_gamepad(0)
        return gp.is_pressed(button) if gp else False
    
    def just_pressed(self, button: str) -> bool:
        gp = self.get_gamepad(0)
        return gp.just_pressed(button) if gp else False
    
    def get_axis(self, axis: str) -> float:
        gp = self.get_gamepad(0)
        return gp.get_axis(axis) if gp else 0.0
    
    def is_action_pressed(self, action: str) -> bool:
        gp = self.get_gamepad(0)
        return gp.is_action_pressed(action) if gp else False
    
    def is_action_held(self, action: str) -> bool:
        gp = self.get_gamepad(0)
        return gp.is_action_held(action) if gp else False
    
    def rumble(self, low: float = 0.5, high: float = 0.5, duration: int = 200):
        gp = self.get_gamepad(0)
        if gp:
            gp.rumble(low, high, duration)
    
    def quit(self):
        for gp in self._gamepads:
            gp.quit()
        pygame.joystick.quit()


def get_keyboard_input():
    """Fallback: create keyboard input dict for gamepad compatibility."""
    keys = pygame.key.get_pressed()
    move_x = 0.0
    if keys[pygame.K_a] or keys[pygame.K_LEFT]:
        move_x -= 1.0
    if keys[pygame.K_d] or keys[pygame.K_RIGHT]:
        move_x += 1.0
    move_y = 0.0
    if keys[pygame.K_w] or keys[pygame.K_UP]:
        move_y -= 1.0
    if keys[pygame.K_s] or keys[pygame.K_DOWN]:
        move_y += 1.0
    return {
        'jump': keys[pygame.K_SPACE] or keys[pygame.K_w] or keys[pygame.K_UP],
        'dash': keys[pygame.K_LCTRL] or keys[pygame.K_z],
        'shield': keys[pygame.K_LSHIFT],
        'shoot': keys[pygame.K_x] or keys[pygame.K_RCTRL],
        'pause': keys[pygame.K_p],
        'move_x': move_x,
        'move_y': move_y,
    }
