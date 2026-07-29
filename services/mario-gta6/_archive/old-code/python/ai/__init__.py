# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Hazem Soussi (HA)
# Super Mario GTA6 — AI Agent Module

"""
AI Agent for Mario — Neural network based decision making.
Supports GPU acceleration (CUDA/ROCm) with CPU fallback.
"""

from .agent import MarioAgent, AgentConfig
from .environment import MarioEnv, SimpleMarioEnv, ObservationSpace, ActionSpace
from .network import MarioNet, NetworkConfig
from .trainer import Trainer, TrainingConfig
from .replay_buffer import ReplayBuffer
from .utils import preprocess_frame, FrameStack, RewardShaper, export_onnx

__all__ = [
    'MarioAgent',
    'AgentConfig',
    'MarioEnv',
    'ObservationSpace',
    'ActionSpace',
    'MarioNet',
    'NetworkConfig',
    'Trainer',
    'TrainingConfig',
    'ReplayBuffer',
    'preprocess_frame',
    'FrameStack',
    'RewardShaper',
    'export_onnx',
]
