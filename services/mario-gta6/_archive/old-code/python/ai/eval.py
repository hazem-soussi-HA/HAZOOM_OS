# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Hazem Soussi (HA)
# Super Mario GTA6 — Evaluation Module

"""Evaluation metrics and reporting for trained Mario agents."""

import numpy as np
import time
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


@dataclass
class EvalMetrics:
    """Collected evaluation metrics."""
    completion_rate: float = 0.0
    avg_reward: float = 0.0
    avg_length: float = 0.0
    avg_coins: float = 0.0
    avg_score: float = 0.0
    death_causes: Dict[str, int] = None
    action_distribution: Dict[int, int] = None
    avg_x_progress: float = 0.0
    inference_time_ms: float = 0.0

    def __post_init__(self):
        if self.death_causes is None:
            self.death_causes = {}
        if self.action_distribution is None:
            self.action_distribution = {i: 0 for i in range(8)}

    def summary(self) -> str:
        lines = [
            f"  Completion rate: {self.completion_rate:.1%}",
            f"  Avg reward:     {self.avg_reward:.2f}",
            f"  Avg length:     {self.avg_length:.0f}",
            f"  Avg coins:      {self.avg_coins:.1f}",
            f"  Avg score:      {self.avg_score:.0f}",
            f"  Avg progress:   {self.avg_x_progress:.1%}",
            f"  Inference time: {self.inference_time_ms:.2f}ms",
        ]
        if self.death_causes:
            lines.append(f"  Death causes:   {self.death_causes}")
        return "\n".join(lines)


class Evaluator:
    """Evaluate a trained agent over multiple episodes."""

    def __init__(self, num_episodes: int = 10, max_steps: int = 1000):
        self.num_episodes = num_episodes
        self.max_steps = max_steps

    def evaluate(self, agent, env) -> EvalMetrics:
        """Run agent in environment and collect metrics."""
        metrics = EvalMetrics()
        rewards = []
        lengths = []
        coins_list = []
        scores_list = []
        completions = []
        progresses = []
        action_counts = {i: 0 for i in range(8)}
        total_inference_time = 0.0
        total_inference_steps = 0

        for ep in range(self.num_episodes):
            agent.reset()
            obs, _ = env.reset()
            episode_reward = 0.0
            episode_length = 0
            done = False

            while not done and episode_length < self.max_steps:
                # Time inference
                t0 = time.perf_counter()
                action = agent.act(obs['frames'], self._obs_to_state(obs, env))
                t1 = time.perf_counter()

                total_inference_time += (t1 - t0) * 1000
                total_inference_steps += 1
                action_counts[action] = action_counts.get(action, 0) + 1

                obs, reward, terminated, truncated, info = env.step(action)
                episode_reward += reward
                episode_length += 1
                done = terminated or truncated

            rewards.append(episode_reward)
            lengths.append(episode_length)
            coins_list.append(info.get('coins', 0))
            scores_list.append(info.get('score', 0))
            completions.append(info.get('level_progress', 0) >= 1.0)
            progresses.append(info.get('level_progress', 0))

        metrics.completion_rate = np.mean(completions)
        metrics.avg_reward = np.mean(rewards)
        metrics.avg_length = np.mean(lengths)
        metrics.avg_coins = np.mean(coins_list)
        metrics.avg_score = np.mean(scores_list)
        metrics.avg_x_progress = np.mean(progresses)
        metrics.action_distribution = action_counts
        metrics.inference_time_ms = total_inference_time / max(total_inference_steps, 1)

        return metrics

    def _obs_to_state(self, obs: dict, env) -> dict:
        """Convert observation to game state dict for agent."""
        # For SimpleMarioEnv
        if hasattr(env, 'player_x'):
            return {
                'px': env.player_x,
                'py': env.player_y,
                'pvx': env.player_vx,
                'pvy': env.player_vy,
                'p_mode': 0, 'p_inv': 0, 'p_star': 0,
                'coins': 0, 'score': 0, 'time': 400, 'lives': 3,
                'p_on_car': False, 'p_air': not env.on_ground,
                'p_dir': 1, 'cam_x': env.player_x,
                'level_progress': env.level_progress,
            }
        return {f'f{i}': 0.0 for i in range(16)}
