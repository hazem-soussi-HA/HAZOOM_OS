# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Hazem Soussi (HA)
# Super Mario GTA6 — AI Player Integration

"""
AIPlayer: Drop-in replacement for keyboard input.
Hooks into the game loop and provides AI-controlled actions.

Usage:
    game = Game()
    ai = AIPlayer(model_path="checkpoints/mario_ppo_final.pt")
    # In game loop:
    keys = ai.get_keys(game)  # returns pygame key state array
    game.run(dt, keys)
"""

import numpy as np
import torch
import pygame
from typing import Optional, Dict

from .ai import MarioAgent, AgentConfig, NetworkConfig
from .ai.utils import preprocess_frame, FrameStack


class AIPlayer:
    """
    AI player that replaces keyboard input.
    Reads game state, runs inference, returns key states.
    """

    # Action to pygame key mapping
    ACTION_KEYS = {
        0: [],                                          # noop
        1: [pygame.K_LEFT],                             # left
        2: [pygame.K_RIGHT],                            # right
        3: [pygame.K_SPACE],                            # jump
        4: [pygame.K_LSHIFT],                           # run
        5: [pygame.K_SPACE, pygame.K_LSHIFT],           # jump+run
        6: [pygame.K_f],                                # car
        7: [pygame.K_LEFT, pygame.K_SPACE],             # left+jump
    }

    def __init__(
        self,
        model_path: Optional[str] = None,
        device: str = 'cpu',
        deterministic: bool = True,
    ):
        config = AgentConfig(
            network=NetworkConfig(device=device),
            model_path=model_path,
            deterministic=deterministic,
        )
        self.agent = MarioAgent(config)
        self.frame_stack = FrameStack(4, (84, 84))
        self.current_action = 0

    def reset(self):
        """Reset for new episode."""
        self.agent.reset()
        self.frame_stack.reset()

    def get_action(self, frame: np.ndarray, game) -> int:
        """Get action from AI given current frame and game state."""
        # Preprocess frame
        processed = preprocess_frame(frame)
        self.frame_stack.push(processed)

        # Build game state
        g = game
        gs = {
            'px': g.px, 'py': g.py, 'pvx': g.pvx, 'pvy': g.pvy,
            'p_mode': g.p_mode, 'p_inv': g.p_inv, 'p_star': g.p_star,
            'coins': g.coins, 'score': g.score, 'time': g.time,
            'lives': g.lives, 'p_on_car': g.p_on_car,
            'p_air': g.p_air, 'p_dir': g.p_dir,
            'cam_x': g.cam, 'level_progress': g.px / (200 * 48),
        }

        action = self.agent.act(self.frame_stack.get_stacked(), gs)
        self.current_action = action
        return action

    def get_keys(self, game) -> list:
        """Return a pygame key-state list for the current action."""
        # Capture current frame from game screen
        frame = pygame.surfarray.array3d(game.screen)
        frame = np.transpose(frame, (1, 0, 2))  # pygame is (W,H,3), we want (H,W,3)

        action = self.get_action(frame, game)

        # Build key state array (mimics pygame.key.get_pressed())
        keys = [False] * 323  # pygame key count
        for key_code in self.ACTION_KEYS.get(action, []):
            if key_code < len(keys):
                keys[key_code] = True
        return keys


class AIVisualizer:
    """Visualize AI attention and decision-making on screen."""

    def __init__(self, font_size: int = 16):
        self.font = None
        self.font_size = font_size

    def init_font(self):
        if self.font is None:
            pygame.font.init()
            self.font = pygame.font.Font(None, self.font_size)

    def draw_overlay(self, screen, game, action: int, value: float = 0.0):
        """Draw AI debug overlay on game screen."""
        self.init_font()
        y = 60
        color = (0, 255, 0)

        texts = [
            f"AI Action: {action} ({self._action_name(action)})",
            f"Value: {value:.3f}",
            f"Player: ({game.px:.0f}, {game.py:.0f})",
            f"Velocity: ({game.pvx:.0f}, {game.pvy:.0f})",
            f"Air: {game.p_air} | Car: {game.p_on_car}",
        ]

        for text in texts:
            surf = self.font.render(text, True, color)
            screen.blit(surf, (10, y))
            y += self.font_size + 2

    def _action_name(self, action: int) -> str:
        names = {
            0: 'noop', 1: 'left', 2: 'right', 3: 'jump',
            4: 'run', 5: 'jump+run', 6: 'car', 7: 'left+jump',
        }
        return names.get(action, f'act{action}')
