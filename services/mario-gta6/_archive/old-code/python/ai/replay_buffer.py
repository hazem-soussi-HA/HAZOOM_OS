# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Hazem Soussi (HA)
# Super Mario GTA6 — Experience Replay Buffer

"""Replay buffer for PPO training. Stores trajectories for GAE computation."""

import numpy as np
import torch
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field


@dataclass
class Trajectory:
    """Stores a single trajectory (episode or segment)."""
    frames: List[np.ndarray] = field(default_factory=list)   # (T, 4, 84, 84)
    states: List[np.ndarray] = field(default_factory=list)   # (T, 16)
    actions: List[int] = field(default_factory=list)         # (T,)
    log_probs: List[float] = field(default_factory=list)     # (T,)
    rewards: List[float] = field(default_factory=list)       # (T,)
    values: List[float] = field(default_factory=list)        # (T,)
    dones: List[bool] = field(default_factory=list)          # (T,)

    def __len__(self):
        return len(self.actions)

    def is_empty(self):
        return len(self) == 0


class ReplayBuffer:
    """
    Rollout buffer for PPO.
    Collects trajectories and computes GAE(λ) advantages.
    """

    def __init__(
        self,
        capacity: int = 10000,
        gamma: float = 0.99,
        gae_lambda: float = 0.95,
        device: str = 'cpu',
    ):
        self.capacity = capacity
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.device = device

        self.trajectories: List[Trajectory] = []
        self.current = Trajectory()

    def add(
        self,
        frame: np.ndarray,
        state: np.ndarray,
        action: int,
        log_prob: float,
        reward: float,
        value: float,
        done: bool,
    ):
        """Add a single transition."""
        self.current.frames.append(frame)
        self.current.states.append(state)
        self.current.actions.append(action)
        self.current.log_probs.append(log_prob)
        self.current.rewards.append(reward)
        self.current.values.append(value)
        self.current.dones.append(done)

        if done:
            self._finish_trajectory()

    def _finish_trajectory(self):
        """Store completed trajectory and start a new one."""
        if not self.current.is_empty():
            self.trajectories.append(self.current)
            self.current = Trajectory()

            # Trim if over capacity
            while self.total_steps() > self.capacity and self.trajectories:
                self.trajectories.pop(0)

    def total_steps(self) -> int:
        return sum(len(t) for t in self.trajectories)

    def compute_advantages(self, last_value: float = 0.0) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Compute GAE(λ) advantages across all trajectories.

        Returns:
            advantages: (N,) tensor of advantages
            returns: (N,) tensor of returns (advantages + values)
        """
        all_advantages = []
        all_returns = []

        for traj in self.trajectories:
            if traj.is_empty():
                continue

            rewards = np.array(traj.rewards)
            values = np.array(traj.values)
            dones = np.array(traj.dones, dtype=np.float32)

            T = len(rewards)
            advantages = np.zeros(T, dtype=np.float32)
            last_gae = 0.0

            for t in reversed(range(T)):
                if t == T - 1:
                    next_value = last_value
                    next_non_terminal = 1.0 - dones[t]
                else:
                    next_value = values[t + 1]
                    next_non_terminal = 1.0 - dones[t]

                delta = rewards[t] + self.gamma * next_value * next_non_terminal - values[t]
                advantages[t] = last_gae = delta + self.gamma * self.gae_lambda * next_non_terminal * last_gae

            returns = advantages + values
            all_advantages.append(advantages)
            all_returns.append(returns)

        if not all_advantages:
            return torch.zeros(0), torch.zeros(0)

        advantages_t = torch.from_numpy(np.concatenate(all_advantages)).float().to(self.device)
        returns_t = torch.from_numpy(np.concatenate(all_returns)).float().to(self.device)

        return advantages_t, returns_t

    def get_batches(self, batch_size: int = 64) -> List[Dict[str, torch.Tensor]]:
        """
        Get shuffled minibatches for PPO update.

        Returns:
            List of dicts with keys: frames, states, actions, old_log_probs, advantages, returns
        """
        # Concatenate all trajectories
        all_frames = []
        all_states = []
        all_actions = []
        all_log_probs = []
        all_values = []

        for traj in self.trajectories:
            all_frames.extend(traj.frames)
            all_states.extend(traj.states)
            all_actions.extend(traj.actions)
            all_log_probs.extend(traj.log_probs)
            all_values.extend(traj.values)

        N = len(all_actions)
        if N == 0:
            return []

        # Compute advantages
        advantages, returns = self.compute_advantages()

        # Normalize advantages
        if advantages.numel() > 1:
            advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        # Convert to tensors
        frames_t = torch.from_numpy(np.stack(all_frames)).permute(0, 3, 1, 2).float().to(self.device)  # (N, 4, 84, 84)
        states_t = torch.from_numpy(np.stack(all_states)).float().to(self.device)  # (N, 16)
        actions_t = torch.tensor(all_actions, dtype=torch.long).to(self.device)   # (N,)
        old_log_probs_t = torch.tensor(all_log_probs, dtype=torch.float32).to(self.device)  # (N,)

        # Create shuffled indices
        indices = torch.randperm(N)
        batches = []

        for start in range(0, N, batch_size):
            end = min(start + batch_size, N)
            batch_idx = indices[start:end]

            batches.append({
                'frames': frames_t[batch_idx],
                'states': states_t[batch_idx],
                'actions': actions_t[batch_idx],
                'old_log_probs': old_log_probs_t[batch_idx],
                'advantages': advantages[batch_idx],
                'returns': returns[batch_idx],
            })

        return batches

    def clear(self):
        """Clear all stored trajectories."""
        self.trajectories = []
        self.current = Trajectory()
