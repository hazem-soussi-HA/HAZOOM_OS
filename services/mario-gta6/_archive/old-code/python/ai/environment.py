# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Hazem Soussi (HA)
# Super Mario GTA6 — Gym Environment Wrapper

"""
MarioEnv: Gymnasium-compatible environment for Super Mario GTA6.
Wraps the Python pygame engine for RL training.

Supports headless mode (no pygame display) for fast training.
"""

import gymnasium as gym
from gymnasium import spaces
import numpy as np
from typing import Dict, Tuple, Optional, Any
import subprocess
import json
import os


# Action mapping: 8 discrete actions
# 0: noop, 1: left, 2: right, 3: jump, 4: run, 5: jump+run, 6: car, 7: left+jump
ACTION_KEYS = {
    0: [],                                          # noop
    1: ['LEFT'],                                    # left
    2: ['RIGHT'],                                   # right
    3: ['SPACE'],                                   # jump
    4: ['SHIFT'],                                   # run
    5: ['SPACE', 'SHIFT'],                          # jump+run
    6: ['F'],                                       # car enter/exit
    7: ['LEFT', 'SPACE'],                           # left+jump
}

# Reverse mapping for pygame key codes
KEY_MAP = {
    'LEFT': 0,   # will be filled from game constants
    'RIGHT': 1,
    'SPACE': 2,
    'SHIFT': 3,
    'F': 4,
}


class ObservationSpace:
    """Defines the observation space for MarioEnv."""
    def __init__(self):
        # 84×84×4 frame stack + 16-dim state
        self.frame_shape = (84, 84, 4)
        self.state_dim = 16
        self.gym_space = spaces.Dict({
            'frames': spaces.Box(0, 255, shape=self.frame_shape, dtype=np.uint8),
            'state': spaces.Box(-1.0, 1.0, shape=(self.state_dim,), dtype=np.float32),
        })


class ActionSpace:
    """Defines the action space for MarioEnv."""
    def __init__(self, num_actions: int = 8):
        self.num_actions = num_actions
        self.gym_space = spaces.Discrete(num_actions)


class MarioEnv(gym.Env):
    """
    Gymnasium environment for Super Mario GTA6.

    Wraps the game via a headless subprocess for fast training.
    Communicates via stdin/JSON for state/action.

    Metadata:
        render_modes: ['human', 'rgb_array', 'none']
        fps: 60
    """
    metadata = {'render_modes': ['human', 'rgb_array', 'none'], 'render_fps': 60}

    def __init__(
        self,
        headless: bool = True,
        max_steps: int = 10000,
        render_mode: str = 'none',
        level_multiplier: float = 1.0,
    ):
        super().__init__()
        self.headless = headless
        self.max_steps = max_steps
        self.render_mode = render_mode
        self.level_multiplier = level_multiplier

        self.observation_space = ObservationSpace().gym_space
        self.action_space = ActionSpace().gym_space

        # Internal state
        self._game_process = None
        self._step_count = 0
        self._last_info = {}

    def reset(
        self,
        seed: Optional[int] = None,
        options: Optional[Dict] = None,
    ) -> Tuple[Dict[str, np.ndarray], Dict]:
        """Reset the environment."""
        super().reset(seed=seed)
        self._step_count = 0

        # Get initial observation from game
        obs = self._get_observation()
        info = {}

        return obs, info

    def step(self, action: int) -> Tuple[Dict[str, np.ndarray], float, bool, bool, Dict]:
        """
        Take a step in the environment.

        Args:
            action: int in [0, 7]

        Returns:
            observation, reward, terminated, truncated, info
        """
        self._step_count += 1

        # Send action to game
        keys = ACTION_KEYS.get(action, [])
        game_state = self._send_action(keys)

        # Get observation
        obs = self._get_observation()

        # Calculate reward
        reward = self._compute_reward(game_state)

        # Check termination
        terminated = game_state.get('game_over', False)
        truncated = self._step_count >= self.max_steps

        info = {
            'score': game_state.get('score', 0),
            'coins': game_state.get('coins', 0),
            'lives': game_state.get('lives', 0),
            'time': game_state.get('time', 0),
            'x_pos': game_state.get('px', 0),
            'level_progress': game_state.get('level_progress', 0.0),
        }
        self._last_info = info

        return obs, reward, terminated, truncated, info

    def _get_observation(self) -> Dict[str, np.ndarray]:
        """Get current observation from the game."""
        # In headless mode, this reads from the subprocess
        # For now, return a placeholder that the trainer fills
        return {
            'frames': np.zeros((84, 84, 4), dtype=np.uint8),
            'state': np.zeros(16, dtype=np.float32),
        }

    def _send_action(self, keys: list) -> Dict:
        """Send action keys to the game and get state back."""
        # Placeholder — in full implementation, writes to subprocess stdin
        return {}

    def _compute_reward(self, game_state: Dict) -> float:
        """
        Compute shaped reward.

        Components:
          +1.0 per 100 pixels forward
          +10.0 per coin
          +50.0 per enemy killed
          -10.0 per death
          +1000.0 for level complete
          -0.1 per time step (encourage speed)
        """
        reward = 0.0

        # Forward progress
        x_pos = game_state.get('px', 0)
        reward += x_pos / 10000.0

        # Coins
        coins = game_state.get('coins', 0)
        reward += coins * 0.5

        # Survival penalty
        reward -= 0.001

        # Death penalty
        if game_state.get('lives', 3) < self._last_info.get('lives', 3):
            reward -= 5.0

        return reward

    def render(self):
        """Render the environment."""
        if self.render_mode == 'human':
            pass  # pygame display already shown

    def close(self):
        """Close the environment."""
        if self._game_process:
            self._game_process.terminate()


class SimpleMarioEnv(gym.Env):
    """
    Simplified Mario environment for initial training.
    Uses a lightweight simulation instead of the full pygame engine.
    Good for testing the RL pipeline end-to-end.
    """
    metadata = {'render_modes': ['none'], 'render_fps': 60}

    def __init__(
        self,
        max_steps: int = 1000,
        num_tiles: int = 200,
    ):
        super().__init__()
        self.max_steps = max_steps
        self.num_tiles = num_tiles

        # Observation: 84×84×4 frames + 16-dim state
        self.observation_space = spaces.Dict({
            'frames': spaces.Box(0, 255, shape=(84, 84, 4), dtype=np.uint8),
            'state': spaces.Box(-1.0, 1.0, shape=(16,), dtype=np.float32),
        })
        self.action_space = spaces.Discrete(8)

        # Simple simulation state
        self.player_x = 0.0
        self.player_y = 0.0
        self.player_vx = 0.0
        self.player_vy = 0.0
        self.on_ground = True
        self.step_count = 0
        self.level_progress = 0.0

        # Simple level: flat ground with gaps
        self.ground_level = 0.0
        self.gaps = [(50, 60), (120, 135), (180, 195)]

        self.np_random = None

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.player_x = 3.0
        self.player_y = 0.0
        self.player_vx = 0.0
        self.player_vy = 0.0
        self.on_ground = True
        self.step_count = 0
        self.level_progress = 0.0
        return self._get_obs(), {}

    def step(self, action):
        self.step_count += 1

        dt = 1.0 / 60.0
        gravity = -2000.0
        jump_vel = 600.0
        move_speed = 200.0

        # Apply action
        if action in [1, 7]:  # left
            self.player_vx = -move_speed
        elif action in [2, 5]:  # right
            self.player_vx = move_speed
        elif action == 4:  # run right
            self.player_vx = move_speed * 1.5
        elif action == 3 or action == 5 or action == 7:  # jump
            if self.on_ground:
                self.player_vy = jump_vel
                self.on_ground = False
        elif action == 0:  # noop
            self.player_vx *= 0.9

        # Physics
        if not self.on_ground:
            self.player_vy += gravity * dt

        self.player_x += self.player_vx * dt
        self.player_y += self.player_vy * dt

        # Ground collision
        if self.player_y <= 0.0:
            self.player_y = 0.0
            self.player_vy = 0.0
            self.on_ground = True

        # Gap collision
        for gap_start, gap_end in self.gaps:
            if gap_start <= self.player_x <= gap_end and self.player_y <= 0:
                self.player_y -= 500 * dt  # fall through gap

        # Level progress
        self.level_progress = min(self.player_x / float(self.num_tiles), 1.0)

        # Reward: forward progress + survival
        reward = self.player_vx * dt * 0.01
        if self.player_y < -100:
            reward -= 10.0  # fell in gap

        # Termination
        terminated = self.player_y < -200 or self.level_progress >= 1.0
        truncated = self.step_count >= self.max_steps

        return self._get_obs(), reward, terminated, truncated, {
            'x': self.player_x,
            'progress': self.level_progress,
        }

    def _get_obs(self) -> Dict[str, np.ndarray]:
        """Build observation dict."""
        # Create a simple 84×84 frame representation
        frames = np.zeros((84, 84, 4), dtype=np.uint8)

        # Draw ground
        for c in range(84):
            tile_x = int(c * self.num_tiles / 84)
            screen_y = int(84 * 0.8)
            for y in range(screen_y, 84):
                frames[y, c, :] = 200  # gray ground

            # Draw gaps
            for gap_start, gap_end in self.gaps:
                if gap_start <= tile_x <= gap_end:
                    for y in range(screen_y, min(screen_y + 5, 84)):
                        frames[y, c, :] = 0  # dark gap

        # Draw player
        screen_x = int((self.player_x / self.num_tiles) * 84) % 84
        screen_y = int(84 * 0.8 - self.player_y * 0.1)
        screen_y = max(0, min(83, screen_y))
        if 0 <= screen_x < 84:
            for dy in range(-2, 3):
                for dx in range(-1, 2):
                    py, px = screen_y + dy, screen_x + dx
                    if 0 <= py < 84 and 0 <= px < 84:
                        frames[py, px, :] = 255  # white player

        # State vector
        state = np.zeros(16, dtype=np.float32)
        state[0] = self.player_x / float(self.num_tiles)
        state[1] = self.player_y / 720.0
        state[2] = self.player_vx / 400.0
        state[3] = self.player_vy / 2000.0
        state[12] = float(not self.on_ground)
        state[15] = self.level_progress

        return {'frames': frames, 'state': state}
