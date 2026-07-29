# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Hazem Soussi (HA)
# Super Mario GTA6 — Curriculum Learning

"""Curriculum learning for progressive difficulty."""

from dataclasses import dataclass
from typing import List, Dict, Optional
import numpy as np


@dataclass
class CurriculumStage:
    """One stage of the curriculum."""
    name: str
    level_params: Dict
    success_threshold: float = 0.5  # avg reward threshold to advance
    min_episodes: int = 50


class Curriculum:
    """
    Progressive difficulty curriculum.

    Stages:
        1. Easy: flat ground, no enemies, short level
        2. Medium: gaps, few enemies, normal length
        3. Hard: multiple gaps, more enemies, longer level
        4. Expert: complex layout, many enemies, full level
    """

    def __init__(self):
        self.stages: List[CurriculumStage] = [
            CurriculumStage(
                name="easy",
                level_params={
                    'num_tiles': 100,
                    'gaps': [(30, 35)],
                    'enemies': 0,
                    'max_steps': 500,
                },
                success_threshold=5.0,
                min_episodes=30,
            ),
            CurriculumStage(
                name="medium",
                level_params={
                    'num_tiles': 200,
                    'gaps': [(40, 48), (90, 100), (140, 150)],
                    'enemies': 3,
                    'max_steps': 1000,
                },
                success_threshold=10.0,
                min_episodes=50,
            ),
            CurriculumStage(
                name="hard",
                level_params={
                    'num_tiles': 300,
                    'gaps': [(30, 40), (80, 95), (130, 145), (180, 195), (230, 245)],
                    'enemies': 6,
                    'max_steps': 1500,
                },
                success_threshold=15.0,
                min_episodes=80,
            ),
            CurriculumStage(
                name="expert",
                level_params={
                    'num_tiles': 500,
                    'gaps': [(25, 38), (65, 80), (110, 130), (160, 180), (210, 235), (260, 280)],
                    'enemies': 10,
                    'max_steps': 2000,
                },
                success_threshold=20.0,
                min_episodes=100,
            ),
        ]
        self.current_stage = 0
        self.episodes_in_stage = 0
        self.recent_rewards: List[float] = []

    def get_current_params(self) -> Dict:
        """Get parameters for the current curriculum stage."""
        stage = self.stages[self.current_stage]
        return stage.level_params

    def get_stage_name(self) -> str:
        return self.stages[self.current_stage].name

    def update(self, episode_reward: float):
        """Update curriculum with latest episode result."""
        self.episodes_in_stage += 1
        self.recent_rewards.append(episode_reward)

        # Check if ready to advance
        if len(self.recent_rewards) >= 10:
            avg_reward = np.mean(self.recent_rewards[-10:])
            stage = self.stages[self.current_stage]

            if avg_reward > stage.success_threshold and self.episodes_in_stage >= stage.min_episodes:
                self.advance()

    def advance(self) -> bool:
        """Move to next curriculum stage. Returns True if advanced."""
        if self.current_stage < len(self.stages) - 1:
            self.current_stage += 1
            self.episodes_in_stage = 0
            self.recent_rewards = []
            print(f"\n  🎓 Curriculum advanced to: {self.stages[self.current_stage].name.upper()}\n")
            return True
        return False

    def is_complete(self) -> bool:
        return self.current_stage >= len(self.stages) - 1
