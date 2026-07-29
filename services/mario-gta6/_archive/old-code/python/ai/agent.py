# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Hazem Soussi (HA)
# Super Mario GTA6 — MarioAgent Inference Wrapper

"""
MarioAgent: High-level inference wrapper around MarioNet.
Handles frame preprocessing, state extraction, and action selection.
"""

import torch
import numpy as np
from dataclasses import dataclass
from typing import Optional, Tuple, Dict

from .network import MarioNet, NetworkConfig
from .utils import preprocess_frame, FrameStack


@dataclass
class AgentConfig:
    """Configuration for MarioAgent."""
    network: NetworkConfig = None
    model_path: Optional[str] = None
    deterministic: bool = False

    def __post_init__(self):
        if self.network is None:
            self.network = NetworkConfig()


class MarioAgent:
    """
    High-level agent that wraps MarioNet for inference.

    Usage:
        agent = MarioAgent(AgentConfig())
        action = agent.act(frame, game_state)
    """

    def __init__(self, config: Optional[AgentConfig] = None):
        self.config = config or AgentConfig()
        self.device = torch.device(self.config.network.device)

        # Build network
        self.net = MarioNet(self.config.network).to(self.device)
        self.frame_stack = FrameStack(
            self.config.network.frame_stack,
            (self.config.network.frame_height, self.config.network.frame_width)
        )

        # Load weights if provided
        if self.config.model_path:
            self.load(self.config.model_path)

        # LSTM hidden state (persists across steps)
        self.hidden = None

        self.net.eval()

    def reset(self):
        """Reset agent state (call at episode start)."""
        self.hidden = None
        self.frame_stack.reset()

    def act(
        self,
        frame: np.ndarray,
        game_state: Dict[str, float],
    ) -> int:
        """
        Select an action given a raw frame and game state.

        Args:
            frame: (H, W, 3) RGB frame from the game
            game_state: dict with keys: px, py, pvx, pvy, p_mode,
                       p_inv, p_star, coins, score, time, lives,
                       p_on_car, p_air, p_dir, cam_x, level_progress

        Returns:
            action: int in [0, 7]
        """
        # Preprocess frame
        processed = preprocess_frame(frame)  # (84, 84)
        self.frame_stack.push(processed)
        frames = self.frame_stack.get_stacked()  # (4, 84, 84)

        # Build state vector
        state_vec = self._build_state_vector(game_state)  # (16,)

        # Convert to tensors
        frames_t = torch.from_numpy(frames).unsqueeze(0).to(self.device)  # (1, 4, 84, 84)
        state_t = torch.from_numpy(state_vec).unsqueeze(0).to(self.device)  # (1, 16)

        # Forward pass
        action, _, _, self.hidden = self.net.act(
            frames_t, state_t, self.hidden,
            deterministic=self.config.deterministic
        )

        return action

    def _build_state_vector(self, gs: Dict[str, float]) -> np.ndarray:
        """Convert game state dict to 16-dim normalized vector."""
        vec = np.zeros(16, dtype=np.float32)
        vec[0] = gs.get('px', 0) / 96000.0          # player x (normalized to level width)
        vec[1] = gs.get('py', 0) / 720.0             # player y
        vec[2] = gs.get('pvx', 0) / 400.0            # velocity x
        vec[3] = gs.get('pvy', 0) / 2000.0           # velocity y
        vec[4] = float(gs.get('p_mode', 0)) / 2.0     # power-up mode (0,1,2)
        vec[5] = min(gs.get('p_inv', 0) / 2.0, 1.0)  # invincibility timer
        vec[6] = min(gs.get('p_star', 0) / 10.0, 1.0) # star timer
        vec[7] = min(gs.get('coins', 0) / 100.0, 1.0) # coins
        vec[8] = min(gs.get('score', 0) / 10000.0, 1.0) # score
        vec[9] = min(gs.get('time', 400) / 400.0, 1.0)  # time remaining
        vec[10] = float(gs.get('lives', 3)) / 3.0      # lives
        vec[11] = float(gs.get('p_on_car', False))     # on car
        vec[12] = float(gs.get('p_air', True))         # in air
        vec[13] = float(gs.get('p_dir', 1))            # facing direction
        vec[14] = gs.get('cam_x', 0) / 96000.0         # camera x
        vec[15] = gs.get('level_progress', 0.0)         # level progress (0-1)
        return vec

    def save(self, path: str):
        """Save model weights."""
        torch.save({
            'net_state_dict': self.net.state_dict(),
            'config': self.config,
        }, path)

    def load(self, path: str):
        """Load model weights."""
        checkpoint = torch.load(path, map_location=self.device, weights_only=False)
        self.net.load_state_dict(checkpoint['net_state_dict'])
        print(f"Loaded model from {path}")

    def export_onnx(self, path: str):
        """Export model to ONNX format for web inference."""
        self.net.eval()
        dummy_frames = torch.randn(1, 4, 84, 84).to(self.device)
        dummy_state = torch.randn(1, 16).to(self.device)

        torch.onnx.export(
            self.net,
            (dummy_frames, dummy_state, None),
            path,
            input_names=['frames', 'state', 'hidden'],
            output_names=['logits', 'value', 'new_hidden'],
            dynamic_axes={
                'frames': {0: 'batch'},
                'state': {0: 'batch'},
            },
            opset_version=17,
        )
        print(f"Exported ONNX model to {path}")
