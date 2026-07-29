# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Hazem Soussi (HA)
# Super Mario GTA6 — Utility Functions

"""Utilities: frame preprocessing, frame stacking, reward shaping, ONNX export."""

import numpy as np
import cv2
import torch
from typing import Optional


def preprocess_frame(frame: np.ndarray, target_size: tuple = (84, 84)) -> np.ndarray:
    """
    Preprocess a raw game frame for the neural network.

    Steps:
        1. Convert RGB to grayscale
        2. Resize to 84×84
        3. Normalize to [0, 255] uint8

    Args:
        frame: (H, W, 3) RGB array
        target_size: (height, width) target size

    Returns:
        (84, 84) grayscale uint8 array
    """
    if frame.ndim == 3 and frame.shape[2] == 3:
        gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
    elif frame.ndim == 2:
        gray = frame
    else:
        gray = cv2.cvtColor(frame, cv2.COLOR_RGBA2GRAY)

    resized = cv2.resize(gray, (target_size[1], target_size[0]), interpolation=cv2.INTER_AREA)
    return resized.astype(np.uint8)


class FrameStack:
    """Stack last N frames for temporal observation."""

    def __init__(self, stack_size: int = 4, frame_size: tuple = (84, 84)):
        self.stack_size = stack_size
        self.frame_size = frame_size
        self.frames = []

    def push(self, frame: np.ndarray):
        """Add a new frame, remove oldest if full."""
        self.frames.append(frame)
        if len(self.frames) > self.stack_size:
            self.frames.pop(0)

    def get_stacked(self) -> np.ndarray:
        """Return stacked frames as (stack_size, H, W)."""
        while len(self.frames) < self.stack_size:
            self.frames.insert(0, np.zeros(self.frame_size, dtype=np.uint8))
        return np.stack(self.frames, axis=0)  # (4, 84, 84)

    def reset(self):
        self.frames = []


class RewardShaper:
    """
    Shaped reward function for Mario GTA6.

    Components:
        + Forward progress (x-position change)
        + Coin collection
        + Enemy kills
        - Death penalty
        - Time penalty (encourage speed)
        + Level completion bonus
    """

    def __init__(
        self,
        coin_reward: float = 5.0,
        enemy_reward: float = 10.0,
        death_penalty: float = -10.0,
        time_penalty: float = -0.01,
        progress_weight: float = 1.0,
        completion_bonus: float = 100.0,
        survival_bonus: float = 0.01,
    ):
        self.coin_reward = coin_reward
        self.enemy_reward = enemy_reward
        self.death_penalty = death_penalty
        self.time_penalty = time_penalty
        self.progress_weight = progress_weight
        self.completion_bonus = completion_bonus
        self.survival_bonus = survival_bonus

        self._prev_x = 0.0
        self._prev_coins = 0
        self._prev_lives = 3
        self._prev_score = 0

    def reset(self):
        self._prev_x = 0.0
        self._prev_coins = 0
        self._prev_lives = 3
        self._prev_score = 0

    def compute(self, info: dict) -> float:
        """Compute shaped reward from game info dict."""
        reward = 0.0

        # Forward progress
        x_pos = info.get('x_pos', 0)
        dx = x_pos - self._prev_x
        reward += dx * self.progress_weight * 0.01
        self._prev_x = x_pos

        # Coins
        coins = info.get('coins', 0)
        d_coins = coins - self._prev_coins
        reward += d_coins * self.coin_reward
        self._prev_coins = coins

        # Death detection
        lives = info.get('lives', 3)
        if lives < self._prev_lives:
            reward += self.death_penalty
        self._prev_lives = lives

        # Score-based reward
        score = info.get('score', 0)
        d_score = score - self._prev_score
        reward += d_score * 0.001
        self._prev_score = score

        # Time penalty
        reward += self.time_penalty

        # Survival bonus
        reward += self.survival_bonus

        # Level completion
        if info.get('level_progress', 0) >= 1.0:
            reward += self.completion_bonus

        return reward


def export_onnx(model: torch.nn.Module, path: str, input_shape: tuple = (1, 4, 84, 84)):
    """Export a PyTorch model to ONNX format."""
    model.eval()
    dummy_frames = torch.randn(*input_shape)
    dummy_state = torch.randn(1, 16)

    torch.onnx.export(
        model,
        (dummy_frames, dummy_state),
        path,
        input_names=['frames', 'state'],
        output_names=['logits', 'value'],
        dynamic_axes={
            'frames': {0: 'batch_size'},
            'state': {0: 'batch_size'},
        },
        opset_version=17,
    )
    print(f"Exported ONNX model to {path}")
