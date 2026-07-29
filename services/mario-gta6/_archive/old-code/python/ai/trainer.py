# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Hazem Soussi (HA)
# Super Mario GTA6 — PPO Trainer

"""
PPO Trainer for Mario GTA6.
Implements Proximal Policy Optimization with GAE(λ).
"""

import torch
import torch.nn.functional as F
import numpy as np
import time
import os
from dataclasses import dataclass, field
from typing import Optional, Dict, List

from .network import MarioNet, NetworkConfig
from .environment import SimpleMarioEnv
from .replay_buffer import ReplayBuffer
from .utils import RewardShaper


@dataclass
class TrainingConfig:
    """Training hyperparameters."""
    # Environment
    num_envs: int = 1
    max_steps_per_env: int = 1000
    total_timesteps: int = 1_000_000

    # PPO
    num_epochs: int = 4
    batch_size: int = 64
    clip_epsilon: float = 0.2
    entropy_coef: float = 0.01
    value_coef: float = 0.5
    max_grad_norm: float = 0.5
    learning_rate: float = 3e-4
    gamma: float = 0.99
    gae_lambda: float = 0.95

    # Logging
    log_interval: int = 10
    save_interval: int = 100
    save_dir: str = "checkpoints"

    # Network
    network: NetworkConfig = field(default_factory=NetworkConfig)

    def __post_init__(self):
        os.makedirs(self.save_dir, exist_ok=True)


class Trainer:
    """
    PPO Trainer for Mario GTA6.

    Usage:
        config = TrainingConfig()
        trainer = Trainer(config)
        trainer.train()
    """

    def __init__(self, config: Optional[TrainingConfig] = None):
        self.config = config or TrainingConfig()
        self.device = torch.device(self.config.network.device)

        # Build network
        self.net = MarioNet(self.config.network).to(self.device)
        self.optimizer = torch.optim.Adam(
            self.net.parameters(),
            lr=self.config.learning_rate,
            eps=1e-5,
        )

        # Learning rate scheduler
        self.scheduler = torch.optim.lr_scheduler.LinearLR(
            self.optimizer,
            start_factor=1.0,
            end_factor=0.0,
            total_iters=self.config.total_timesteps // (self.config.batch_size * self.config.num_epochs),
        )

        # Environment
        self.env = SimpleMarioEnv(max_steps=self.config.max_steps_per_env)

        # Buffer
        self.buffer = ReplayBuffer(
            capacity=self.config.max_steps_per_env * 10,
            gamma=self.config.gamma,
            gae_lambda=self.config.gae_lambda,
            device=self.device,
        )

        # Reward shaper
        self.reward_shaper = RewardShaper()

        # Metrics
        self.total_steps = 0
        self.episode_rewards: List[float] = []
        self.episode_lengths: List[float] = []
        self.episode_count = 0

        print(f"MarioNet parameters: {self.net.count_parameters():,}")
        print(f"Device: {self.device}")

    def collect_rollout(self) -> Dict[str, float]:
        """Collect a rollout from the environment."""
        self.net.eval()
        obs, _ = self.env.reset()
        self.reward_shaper.reset()

        episode_reward = 0.0
        episode_length = 0
        hidden = None

        for step in range(self.config.max_steps_per_env):
            # Convert obs to tensors — env returns (H,W,C), PyTorch expects (C,H,W)
            frames_t = torch.as_tensor(obs['frames']).permute(2, 0, 1).unsqueeze(0).to(self.device)
            state_t = torch.as_tensor(obs['state']).unsqueeze(0).to(self.device)

            # Get action from policy
            with torch.no_grad():
                logits, value, hidden = self.net(frames_t, state_t, hidden)
                probs = F.softmax(logits, dim=-1)
                dist = torch.distributions.Categorical(probs)
                action = dist.sample()
                log_prob = dist.log_prob(action)

            action_int = action.item()

            # Step environment
            next_obs, env_reward, terminated, truncated, info = self.env.step(action_int)

            # Shaped reward
            shaped_reward = self.reward_shaper.compute(info)
            reward = shaped_reward + env_reward

            # Store transition
            self.buffer.add(
                frame=obs['frames'].copy(),
                state=obs['state'].copy(),
                action=action_int,
                log_prob=log_prob.item(),
                reward=reward,
                value=value.item(),
                done=terminated or truncated,
            )

            episode_reward += reward
            episode_length += 1
            self.total_steps += 1

            obs = next_obs

            if terminated or truncated:
                self.episode_rewards.append(episode_reward)
                self.episode_lengths.append(episode_length)
                self.episode_count += 1

                obs, _ = self.env.reset()
                self.reward_shaper.reset()
                hidden = None
                episode_reward = 0.0
                episode_length = 0

        return {
            'episode_reward': np.mean(self.episode_rewards[-10:]) if self.episode_rewards else 0,
            'episode_length': np.mean(self.episode_lengths[-10:]) if self.episode_lengths else 0,
            'total_steps': self.total_steps,
        }

    def update(self) -> Dict[str, float]:
        """Perform PPO update using collected rollouts."""
        self.net.train()

        batches = self.buffer.get_batches(self.config.batch_size)
        if not batches:
            return {}

        total_policy_loss = 0.0
        total_value_loss = 0.0
        total_entropy = 0.0
        num_updates = 0

        for epoch in range(self.config.num_epochs):
            for batch in batches:
                # Evaluate actions with current policy
                new_log_probs, new_values, entropy = self.net.evaluate(
                    batch['frames'],
                    batch['states'],
                    batch['actions'],
                )

                # PPO clipped objective
                ratio = torch.exp(new_log_probs - batch['old_log_probs'])
                advantages = batch['advantages']

                surr1 = ratio * advantages
                surr2 = torch.clamp(ratio, 1.0 - self.config.clip_epsilon, 1.0 + self.config.clip_epsilon) * advantages
                policy_loss = -torch.min(surr1, surr2).mean()

                # Value loss
                value_loss = F.mse_loss(new_values, batch['returns'])

                # Total loss
                loss = (
                    policy_loss
                    + self.config.value_coef * value_loss
                    - self.config.entropy_coef * entropy.mean()
                )

                # Backward pass
                self.optimizer.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.net.parameters(), self.config.max_grad_norm)
                self.optimizer.step()

                total_policy_loss += policy_loss.item()
                total_value_loss += value_loss.item()
                total_entropy += entropy.mean().item()
                num_updates += 1

        self.buffer.clear()
        self.scheduler.step()

        return {
            'policy_loss': total_policy_loss / max(num_updates, 1),
            'value_loss': total_value_loss / max(num_updates, 1),
            'entropy': total_entropy / max(num_updates, 1),
        }

    def train(self):
        """Main training loop."""
        print(f"\n{'='*60}")
        print(f"  SUPER MARIO GTA6 — PPO Training")
        print(f"  Total timesteps: {self.config.total_timesteps:,}")
        print(f"  Device: {self.device}")
        print(f"{'='*60}\n")

        start_time = time.time()

        while self.total_steps < self.config.total_timesteps:
            # Collect rollout
            rollout_stats = self.collect_rollout()

            # Update policy
            update_stats = self.update()

            # Logging
            if self.episode_count % self.config.log_interval == 0 and self.episode_rewards:
                elapsed = time.time() - start_time
                fps = self.total_steps / elapsed if elapsed > 0 else 0
                recent_reward = np.mean(self.episode_rewards[-10:])
                recent_length = np.mean(self.episode_lengths[-10:])

                print(
                    f"Step {self.total_steps:>8,} | "
                    f"Ep {self.episode_count:>4} | "
                    f"Reward: {recent_reward:>8.2f} | "
                    f"Length: {recent_length:>6.1f} | "
                    f"Policy Loss: {update_stats.get('policy_loss', 0):>8.4f} | "
                    f"Value Loss: {update_stats.get('value_loss', 0):>8.4f} | "
                    f"Entropy: {update_stats.get('entropy', 0):>6.3f} | "
                    f"FPS: {fps:>6.0f}"
                )

            # Save checkpoint
            if self.episode_count % self.config.save_interval == 0 and self.episode_count > 0:
                self.save(os.path.join(self.config.save_dir, f"mario_ppo_step{self.total_steps}.pt"))

        # Final save
        self.save(os.path.join(self.config.save_dir, "mario_ppo_final.pt"))
        elapsed = time.time() - start_time
        print(f"\nTraining complete! {self.total_steps:,} steps in {elapsed:.1f}s")
        print(f"Final checkpoint saved to {self.config.save_dir}/mario_ppo_final.pt")

    def save(self, path: str):
        """Save checkpoint."""
        torch.save({
            'net_state_dict': self.net.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'total_steps': self.total_steps,
            'episode_count': self.episode_count,
            'config': self.config,
        }, path)
        print(f"  Checkpoint saved: {path}")

    def load(self, path: str):
        """Load checkpoint."""
        checkpoint = torch.load(path, map_location=self.device)
        self.net.load_state_dict(checkpoint['net_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.total_steps = checkpoint.get('total_steps', 0)
        self.episode_count = checkpoint.get('episode_count', 0)
        print(f"Loaded checkpoint from {path} (step {self.total_steps:,})")
