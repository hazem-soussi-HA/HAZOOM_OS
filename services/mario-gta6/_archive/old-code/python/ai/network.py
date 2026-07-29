# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Hazem Soussi (HA)
# Super Mario GTA6 — MarioNet Neural Network

"""
MarioNet: IMPALA-style CNN + LSTM architecture for Mario GTA6.

Architecture:
  1. Frame preprocessor (RGB → grayscale, resize to 84×84)
  2. CNN encoder (3 conv blocks with residual connections)
  3. LSTM core (256 units) for temporal reasoning
  4. Policy head (action probabilities)
  5. Value head (state value estimate)

Observation: 84×84×4 frame stack + 16-dim game state vector
Action: 8 discrete actions
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from dataclasses import dataclass, field
from typing import Tuple, Dict, Optional
import numpy as np


@dataclass
class NetworkConfig:
    """Hyperparameters for MarioNet."""
    # Observation
    frame_height: int = 84
    frame_width: int = 84
    frame_stack: int = 4
    state_dim: int = 16

    # CNN
    cnn_channels: list = field(default_factory=lambda: [32, 64, 64])
    cnn_kernels: list = field(default_factory=lambda: [8, 4, 3])
    cnn_strides: list = field(default_factory=lambda: [4, 2, 1])
    use_residual: bool = True

    # LSTM
    lstm_hidden: int = 256
    lstm_layers: int = 1

    # Output
    num_actions: int = 8

    # Training
    learning_rate: float = 3e-4
    entropy_coef: float = 0.01
    value_coef: float = 0.5
    max_grad_norm: float = 0.5
    gamma: float = 0.99
    gae_lambda: float = 0.95
    clip_epsilon: float = 0.2

    # Device
    device: str = "auto"  # "auto", "cuda", "mps", "cpu"

    def __post_init__(self):
        if self.device == "auto":
            if torch.cuda.is_available():
                self.device = "cuda"
            elif torch.backends.mps.is_available():
                self.device = "mps"
            else:
                self.device = "cpu"


class ConvBlock(nn.Module):
    """Conv2d + ReLU with optional residual connection (only when spatial dims match)."""
    def __init__(self, in_ch: int, out_ch: int, kernel: int, stride: int, residual: bool = True):
        super().__init__()
        self.conv = nn.Conv2d(in_ch, out_ch, kernel_size=kernel, stride=stride)
        self.use_residual = residual

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = F.relu(self.conv(x))
        if self.use_residual and x.shape == out.shape:
            out = out + x
        return out


class MarioNet(nn.Module):
    """
    IMPALA-style CNN + LSTM network for Mario GTA6.

    Input:
        frames: (B, 4, 84, 84) — stacked grayscale frames
        state:  (B, 16) — game state vector
        hidden: (num_layers, B, hidden) — LSTM hidden state

    Output:
        logits: (B, 8) — action logits
        value:  (B, 1) — state value
        new_hidden: updated LSTM hidden state
    """

    def __init__(self, config: Optional[NetworkConfig] = None):
        super().__init__()
        self.config = config or NetworkConfig()

        # CNN encoder
        in_ch = self.config.frame_stack
        self.conv_blocks = nn.ModuleList()
        for out_ch, kernel, stride in zip(
            self.config.cnn_channels,
            self.config.cnn_kernels,
            self.config.cnn_strides
        ):
            self.conv_blocks.append(
                ConvBlock(in_ch, out_ch, kernel, stride, self.config.use_residual)
            )
            in_ch = out_ch

        # Calculate CNN output size: 84→20→9→7 for channels [32,64,64]
        cnn_out_size = self.config.cnn_channels[-1] * 7 * 7  # 64 * 49 = 3136

        # State embedding
        self.state_embed = nn.Sequential(
            nn.Linear(self.config.state_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 64),
            nn.ReLU(),
        )

        # Combined feature dimension
        combined_dim = cnn_out_size + 64  # 3136 + 64 = 3200

        # Feature projection
        self.feature_proj = nn.Sequential(
            nn.Linear(combined_dim, 512),
            nn.ReLU(),
        )

        # LSTM core
        self.lstm = nn.LSTM(
            input_size=512,
            hidden_size=self.config.lstm_hidden,
            num_layers=self.config.lstm_layers,
            batch_first=False,  # (seq, batch, features)
        )

        # Policy head
        self.policy_head = nn.Sequential(
            nn.Linear(self.config.lstm_hidden, 128),
            nn.ReLU(),
            nn.Linear(128, self.config.num_actions),
        )

        # Value head
        self.value_head = nn.Sequential(
            nn.Linear(self.config.lstm_hidden, 128),
            nn.ReLU(),
            nn.Linear(128, 1),
        )

        # Initialize weights
        self.apply(self._init_weights)

    def _init_weights(self, module):
        if isinstance(module, nn.Linear):
            nn.init.orthogonal_(module.weight, gain=np.sqrt(2))
            nn.init.constant_(module.bias, 0.0)
        elif isinstance(module, nn.Conv2d):
            nn.init.orthogonal_(module.weight, gain=np.sqrt(2))
            nn.init.constant_(module.bias, 0.0)
        elif isinstance(module, nn.LSTM):
            for param in module.parameters():
                if param.dim() >= 2:
                    nn.init.orthogonal_(param, gain=np.sqrt(2))
                else:
                    nn.init.constant_(param, 0.0)

    def forward(
        self,
        frames: torch.Tensor,
        state: torch.Tensor,
        hidden: Optional[Tuple[torch.Tensor, torch.Tensor]] = None,
    ) -> Tuple[torch.Tensor, torch.Tensor, Tuple[torch.Tensor, torch.Tensor]]:
        """
        Forward pass.

        Args:
            frames: (B, 4, 84, 84) stacked grayscale frames
            state:  (B, 16) game state vector
            hidden: LSTM hidden state tuple (h, c)

        Returns:
            logits: (B, 8) action logits
            value:  (B, 1) state value
            hidden: updated LSTM hidden state
        """
        B = frames.shape[0]

        # CNN encode frames
        x = frames.float() / 255.0  # normalize to [0, 1]
        for block in self.conv_blocks:
            x = block(x)
        cnn_features = x.reshape(B, -1)  # (B, 3136)

        # Embed state
        state_features = self.state_embed(state.float())  # (B, 64)

        # Combine features
        combined = torch.cat([cnn_features, state_features], dim=-1)  # (B, 3200)
        features = self.feature_proj(combined)  # (B, 512)

        # LSTM (expects seq_len=1 for single step)
        lstm_input = features.unsqueeze(0)  # (1, B, 512)
        if hidden is None:
            lstm_out, new_hidden = self.lstm(lstm_input)
        else:
            lstm_out, new_hidden = self.lstm(lstm_input, hidden)
        lstm_out = lstm_out.squeeze(0)  # (B, 256)

        # Heads
        logits = self.policy_head(lstm_out)  # (B, 8)
        value = self.value_head(lstm_out)    # (B, 1)

        return logits, value, new_hidden

    def act(
        self,
        frames: torch.Tensor,
        state: torch.Tensor,
        hidden: Optional[Tuple[torch.Tensor, torch.Tensor]] = None,
        deterministic: bool = False,
    ) -> Tuple[int, torch.Tensor, torch.Tensor, Tuple[torch.Tensor, torch.Tensor]]:
        """
        Select an action.

        Returns:
            action: int — selected action index
            log_prob: log probability of the action
            value: state value estimate
            hidden: updated LSTM hidden state
        """
        with torch.no_grad():
            logits, value, new_hidden = self.forward(frames, state, hidden)

        probs = F.softmax(logits, dim=-1)

        if deterministic:
            action = probs.argmax(dim=-1)
        else:
            dist = torch.distributions.Categorical(probs)
            action = dist.sample()

        log_prob = torch.log(probs.gather(1, action.unsqueeze(-1))).squeeze(-1)

        return action.item(), log_prob, value.squeeze(-1), new_hidden

    def evaluate(
        self,
        frames: torch.Tensor,
        state: torch.Tensor,
        actions: torch.Tensor,
        hidden: Optional[Tuple[torch.Tensor, torch.Tensor]] = None,
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Evaluate actions for PPO update.

        Returns:
            log_probs: (B,) log probabilities of taken actions
            values: (B,) state values
            entropy: (B,) policy entropy
        """
        logits, value, _ = self.forward(frames, state, hidden)
        probs = F.softmax(logits, dim=-1)
        dist = torch.distributions.Categorical(probs)

        log_probs = dist.log_prob(actions)
        entropy = dist.entropy()

        return log_probs, value.squeeze(-1), entropy

    def count_parameters(self) -> int:
        return sum(p.numel() for p in self.parameters() if p.requires_grad)
