# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Hazem Soussi (HA)
# Super Mario GTA6 — GTA Features

"""GTA-style features: wanted system, shops, missions, police AI."""

import random
import math
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field


@dataclass
class WantedSystem:
    """GTA-style wanted level system (1-5 stars)."""
    level: int = 0  # 0-5
    heat: float = 0.0  # 0-100, fills up with crimes
    decay_rate: float = 0.5  # heat decay per second
    police_spawn_timer: float = 0.0
    max_police: int = 6

    # Thresholds for each star level
    THRESHOLDS = [0, 20, 40, 60, 80, 100]

    def add_heat(self, amount: float):
        self.heat = min(100.0, self.heat + amount)
        self._update_level()

    def update(self, dt: float):
        self.heat = max(0.0, self.heat - self.decay_rate * dt)
        self._update_level()

    def _update_level(self):
        for i in range(5, -1, -1):
            if self.heat >= self.THRESHOLDS[i]:
                self.level = i
                break

    def should_spawn_police(self, dt: float, current_police: int) -> bool:
        if self.level == 0 or current_police >= self.max_police:
            return False
        self.police_spawn_timer += dt
        interval = max(2.0 - self.level * 0.3, 0.5)
        if self.police_spawn_timer >= interval:
            self.police_spawn_timer = 0
            return True
        return False

    def get_police_speed(self) -> float:
        return 80 + self.level * 30


@dataclass
class Shop:
    """In-game shop for buying items."""
    x: float
    y: float
    items: Dict[str, float] = field(default_factory=lambda: {
        'mushroom': 50,
        'fire_flower': 100,
        'star': 200,
        'extra_life': 500,
        'speed_boost': 75,
        'shield': 150,
    })

    def can_buy(self, item: str, coins: int) -> bool:
        return self.items.get(item, float('inf')) <= coins

    def buy(self, item: str, coins: int) -> Tuple[bool, int]:
        price = self.items.get(item, float('inf'))
        if price <= coins:
            return True, int(coins - price)
        return False, coins


@dataclass
class Mission:
    """GTA-style mission/quest system."""
    id: str
    title: str
    description: str
    mission_type: str  # 'delivery', 'race', 'combat', 'collect', 'escape'
    target_x: float = 0.0
    target_y: float = 0.0
    reward_coins: int = 0
    reward_score: int = 0
    time_limit: float = 60.0
    required_item: Optional[str] = None
    enemy_count: int = 0
    completed: bool = False
    active: bool = False


class MissionManager:
    """Manages available and active missions."""

    def __init__(self):
        self.missions: List[Mission] = []
        self.active_mission: Optional[Mission] = None
        self.completed_missions: List[str] = []
        self._generate_missions()

    def _generate_missions(self):
        """Generate a pool of missions."""
        self.missions = [
            Mission('m1', 'Package Delivery', 'Deliver a package across town',
                    'delivery', target_x=5000, reward_coins=100, reward_score=500, time_limit=90),
            Mission('m2', 'Street Race', 'Win a street race',
                    'race', target_x=8000, reward_coins=200, reward_score=1000, time_limit=60),
            Mission('m3', 'Coin Collector', 'Collect 50 coins',
                    'collect', reward_coins=50, reward_score=300, time_limit=120),
            Mission('m4', 'Goomba Sweep', 'Defeat 10 goombas',
                    'combat', reward_coins=150, reward_score=750, enemy_count=10),
            Mission('m5', 'Police Escape', 'Escape the cops!',
                    'escape', target_x=3000, reward_coins=300, reward_score=1500, time_limit=30),
            Mission('m6', 'Speed Run', 'Reach the flag in 30 seconds',
                    'race', target_x=10000, reward_coins=500, reward_score=2000, time_limit=30),
        ]

    def get_available(self, completed_ids: List[str]) -> List[Mission]:
        return [m for m in self.missions if m.id not in completed_ids]

    def start_mission(self, mission_id: str) -> Optional[Mission]:
        for m in self.missions:
            if m.id == mission_id:
                m.active = True
                self.active_mission = m
                return m
        return None

    def check_completion(self, game_state: Dict) -> Optional[Mission]:
        """Check if the active mission is complete."""
        m = self.active_mission
        if not m or m.completed:
            return None

        if m.mission_type == 'delivery':
            if game_state.get('px', 0) >= m.target_x:
                m.completed = True

        elif m.mission_type in ('race', 'escape'):
            if game_state.get('px', 0) >= m.target_x:
                m.completed = True

        elif m.mission_type == 'collect':
            if game_state.get('coins', 0) >= 50:
                m.completed = True

        elif m.mission_type == 'combat':
            if game_state.get('enemies_killed', 0) >= m.enemy_count:
                m.completed = True

        # Time limit check
        if game_state.get('mission_time', 0) > m.time_limit:
            m.active = False  # failed

        if m.completed:
            self.completed_missions.append(m.id)
            self.active_mission = None
            return m
        return None
