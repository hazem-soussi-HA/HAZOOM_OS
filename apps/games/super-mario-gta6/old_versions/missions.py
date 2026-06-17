"""
MISSIONS - Mission system with 10+ unique missions, trigger zones,
           objectives, timers, rewards, and progress tracking.
"""
import random
from ursina import *
from utils import *

# ═══════════════════════════════════════════
# MISSION DEFINITIONS
# ═══════════════════════════════════════════
MISSIONS = [
    {
        'id': 'taxi_run',
        'name': 'TAXI RUN',
        'desc': 'Drive 5 NPCs across the city!',
        'type': 'driving',
        'target': 5,
        'time': 60,
        'reward': 50,
        'cost': 10,
    },
    {
        'id': 'coin_rush',
        'name': 'COIN RUSH',
        'desc': 'Collect 20 coins in 30 seconds!',
        'type': 'collect',
        'target': 20,
        'time': 30,
        'reward': 30,
        'cost': 5,
    },
    {
        'id': 'escape_goombas',
        'name': 'ESCAPE THE GOOMBAS',
        'desc': 'Evade 3 Goombas for 60 seconds!',
        'type': 'survive',
        'target': 3,
        'time': 60,
        'reward': 60,
        'cost': 15,
    },
    {
        'id': 'delivery_dash',
        'name': 'DELIVERY DASH',
        'desc': 'Pick up and deliver 3 packages!',
        'type': 'delivery',
        'target': 3,
        'time': 90,
        'reward': 45,
        'cost': 10,
    },
    {
        'id': 'stunt_jumps',
        'name': 'STUNT JUMPS',
        'desc': 'Hit 3 ramp zones at high speed!',
        'type': 'stunt',
        'target': 3,
        'time': 45,
        'reward': 40,
        'cost': 10,
    },
    {
        'id': 'race_champion',
        'name': 'RACE CHAMPION',
        'desc': 'Beat 3 AI cars around the circuit!',
        'type': 'race',
        'target': 3,
        'time': 120,
        'reward': 80,
        'cost': 20,
    },
    {
        'id': 'rooftop_run',
        'name': 'ROOFTOP RUN',
        'desc': 'Parkour across rooftops, grab 5 stars!',
        'type': 'collect',
        'target': 5,
        'time': 60,
        'reward': 55,
        'cost': 15,
    },
    {
        'id': 'smash_grab',
        'name': 'SMASH & GRAB',
        'desc': 'Destroy 10 street lamps with your car!',
        'type': 'destruction',
        'target': 10,
        'time': 60,
        'reward': 50,
        'cost': 10,
    },
    {
        'id': 'time_warp',
        'name': 'TIME WARP',
        'desc': 'Collect time power-ups, chase 500 points!',
        'type': 'score',
        'target': 500,
        'time': 45,
        'reward': 70,
        'cost': 20,
    },
    {
        'id': 'boss_escape',
        'name': 'BOSS ESCAPE',
        'desc': 'A giant Thwomp chases you! Survive 45s!',
        'type': 'survive',
        'target': 1,
        'time': 45,
        'reward': 100,
        'cost': 25,
    },
]


class MissionTrigger(Entity):
    """A zone that triggers a mission when the player enters."""

    def __init__(self, mission_def, position, radius=8):
        super().__init__()
        self.mission_def = mission_def
        self.position = position
        self.radius = radius
        self.triggered = False
        self.visual = Entity(
            model='cube', color=color.rgba(255, 200, 0, 80),
            scale=(radius * 2, 0.2, radius * 2),
            position=(position.x, 0.1, position.z),
        )
        # Floating icon
        self.icon = Entity(
            model='cube', color=color.rgb(255, 200, 0),
            scale=(1.5, 1.5, 0.2),
            position=(position.x, 4, position.z),
        )

    def check_trigger(self, player_pos):
        if self.triggered:
            return False
        dx = player_pos.x - self.position.x
        dz = player_pos.z - self.position.z
        if dx * dx + dz * dz < self.radius * self.radius:
            self.triggered = True
            self.visual.color = color.rgba(100, 100, 100, 50)
            return True
        return False


class MissionManager:
    """Manages active missions, objectives, timers, and rewards."""

    def __init__(self):
        self.active_mission = None
        self.progress = 0
        self.timer = 0
        self.score = 0
        self.triggers = []
        self.available = list(MISSIONS)
        self.completed = []
        self.failed = []
        self.goombas = []  # enemy entities for escape missions
        self.thwomp = None  # boss entity
        self.delivery_targets = []  # delivery waypoints
        self.ramp_zones = []  # stunt jump zones
        self.destruction_targets = []  # smashable lamps
        self.powerup_entities = []  # time warp power-ups
        self.race_checkpoints = []
        self.race_progress = 0

    def setup_triggers(self, spawn_points):
        """Place mission trigger zones around the city."""
        random.seed(123)
        used_positions = set()
        for mission_def in MISSIONS:
            # Find a unique spawn point
            sp = None
            for _ in range(20):
                candidate = random.choice(spawn_points)
                key = (int(candidate.x / 20), int(candidate.z / 20))
                if key not in used_positions:
                    sp = candidate
                    used_positions.add(key)
                    break
            if sp is None:
                sp = random.choice(spawn_points)

            trigger = MissionTrigger(mission_def, Vec3(sp.x, 0, sp.z))
            self.triggers.append(trigger)

    def check_triggers(self, player_pos):
        """Check if player entered any mission trigger."""
        for trigger in self.triggers:
            if trigger.check_trigger(player_pos):
                return trigger.mission_def
        return None

    def start_mission(self, mission_def, player):
        """Start a mission."""
        self.active_mission = mission_def
        self.progress = 0
        self.timer = mission_def['time']
        self.score = 0
        mtype = mission_def['type']

        # Dynamic difficulty: scale timer based on player wealth
        from utils import game_state
        coins = game_state.get('coins', 0)
        if coins > 100:
            self.timer *= 0.8  # 20% less time for rich players
        elif coins > 50:
            self.timer *= 0.9

        # Setup mission-specific entities
        if mtype == 'survive':
            self._spawn_goombas(player)
        if mtype == 'boss_escape':
            self._spawn_thwomp(player)
        if mtype == 'delivery':
            self._spawn_delivery_targets()
        if mtype == 'stunt':
            self._spawn_ramp_zones()
        if mtype == 'destruction':
            self._spawn_destruction_targets()
        if mtype == 'score':
            self._spawn_powerups()
        if mtype == 'race':
            self._spawn_race_checkpoints()

        print(f"Mission started: {mission_def['name']}", flush=True)

    def _spawn_goombas(self, player):
        """Spawn Goomba enemies that chase the player."""
        self.goombas = []
        for i in range(3):
            g = Entity(
                model='cube', color=color.rgb(139, 90, 43),
                scale=(1.2, 1.2, 1.2),
                position=player.group.position + Vec3(
                    random.uniform(-15, 15), 0, random.uniform(-15, 15)
                ),
            )
            # Goomba "face"
            Entity(parent=g, model='cube',
                   color=color.rgb(200, 150, 100),
                   scale=(0.8, 0.5, 0.3),
                   position=(0, 0.2, 0.5))
            self.goombas.append(g)

    def _spawn_thwomp(self, player):
        """Spawn a giant Thwomp boss."""
        self.thwomp = Entity(
            model='cube', color=color.rgb(80, 80, 85),
            scale=(6, 6, 6),
            position=player.group.position + Vec3(0, 10, -30),
        )
        # Angry face
        Entity(parent=self.thwomp, model='cube',
               color=color.rgb(255, 50, 50),
               scale=(0.3, 0.2, 0.1),
               position=(-1.2, 1, 3))
        Entity(parent=self.thwomp, model='cube',
               color=color.rgb(255, 50, 50),
               scale=(0.3, 0.2, 0.1),
               position=(1.2, 1, 3))

    def _spawn_delivery_targets(self):
        """Spawn delivery waypoints."""
        self.delivery_targets = []
        for i in range(3):
            pos = Vec3(
                random.uniform(-120, 120), 1.5,
                random.uniform(-120, 120),
            )
            t = Entity(
                model='cube', color=color.rgb(50, 200, 50),
                scale=(1, 1, 0.2),
                position=pos,
            )
            self.delivery_targets.append(t)

    def _spawn_ramp_zones(self):
        """Spawn stunt jump ramp zones."""
        self.ramp_zones = []
        for i in range(3):
            pos = Vec3(
                random.uniform(-100, 100), 0,
                random.uniform(-100, 100),
            )
            r = Entity(
                model='cube', color=color.rgba(255, 100, 0, 150),
                scale=(8, 0.3, 12),
                position=pos,
            )
            self.ramp_zones.append({'entity': r, 'hit': False, 'pos': pos})

    def _spawn_destruction_targets(self):
        """Spawn smashable street lamps."""
        self.destruction_targets = []
        for i in range(10):
            pos = Vec3(
                random.uniform(-120, 120), 2,
                random.uniform(-120, 120),
            )
            lamp = Entity(
                model='cube', color=C_LAMP,
                scale=(0.4, 5, 0.4),
                position=pos,
            )
            Entity(parent=lamp, model='sphere',
                   color=C_DLGHT,
                   scale=(0.8, 1, 0.8),
                   position=(0, 3, 0))
            self.destruction_targets.append(lamp)

    def _spawn_powerups(self):
        """Spawn time-extending power-ups."""
        self.powerup_entities = []
        for i in range(8):
            pos = Vec3(
                random.uniform(-120, 120), 2,
                random.uniform(-120, 120),
            )
            p = Entity(
                model='cube', color=color.rgb(50, 200, 255),
                scale=(0.8, 0.8, 0.2),
                position=pos,
            )
            self.powerup_entities.append(p)

    def _spawn_race_checkpoints(self):
        """Spawn race circuit checkpoints."""
        self.race_checkpoints = []
        self.race_progress = 0
        cx, cz = 0, 0
        for i in range(6):
            angle = i * 60
            rad = math.radians(angle)
            pos = Vec3(
                cx + math.sin(rad) * 80, 2,
                cz + math.cos(rad) * 80,
            )
            cp = Entity(
                model='cube', color=color.rgba(0, 100, 255, 150),
                scale=(3, 3, 0.3),
                position=pos,
            )
            self.race_checkpoints.append(cp)

    def update(self, dt, player):
        """Update active mission logic."""
        if not self.active_mission:
            return

        self.timer -= dt
        if self.timer <= 0:
            self._fail_mission()
            return

        mtype = self.active_mission['type']
        target = self.active_mission['target']

        if mtype == 'collect':
            # Coin collection handled in main loop
            pass
        elif mtype == 'survive':
            self._update_goombas(dt, player)
        elif mtype == 'boss_escape':
            self._update_thwomp(dt, player)
        elif mtype == 'delivery':
            self._update_delivery(player)
        elif mtype == 'stunt':
            self._update_stunts(player)
        elif mtype == 'destruction':
            self._update_destruction(player)
        elif mtype == 'score':
            self._update_powerups(player)
        elif mtype == 'race':
            self._update_race(player)
        elif mtype == 'driving':
            # Progress tracked by distance driven
            pass

        # Check completion
        if self.progress >= target:
            self._complete_mission()

    def _update_goombas(self, dt, player):
        """Goombas chase the player."""
        for g in self.goombas:
            if not g.enabled:
                continue
            direction = (player.group.position - g.position)
            direction.y = 0
            if direction.length() > 0.5:
                direction = direction.normalized()
                g.position += direction * 6 * dt
                g.rotation_y = math.degrees(math.atan2(direction.x, direction.z))
            # Check collision with player
            if distance_2d(g.position, player.group.position) < 1.5:
                # Player caught - mission fails
                self._fail_mission()
                return

    def _update_thwomp(self, dt, player):
        """Thwomp chases and tries to crush the player."""
        if not self.thwomp or not self.thwomp.enabled:
            return
        direction = (player.group.position - self.thwomp.position)
        direction.y = 0
        if direction.length() > 1:
            direction = direction.normalized()
            self.thwomp.position += direction * 10 * dt
        # Vertical slam effect
        self.thwomp.y = 8 + math.sin(time.time() * 3) * 3
        if distance_2d(self.thwomp.position, player.group.position) < 4:
            self._fail_mission()

    def _update_delivery(self, player):
        """Check delivery waypoint proximity."""
        for t in self.delivery_targets:
            if t.enabled and distance_2d(t.position, player.group.position) < 3:
                t.enabled = False
                self.progress += 1
                from utils import particle_pool
                particle_pool.spawn_sparks(t.position)

    def _update_stunts(self, player):
        """Check if player hits ramp at high speed."""
        for ramp in self.ramp_zones:
            if ramp['hit']:
                continue
            if not player.on_foot and player.current_car:
                spd = abs(player.current_car.speed)
                if spd > 20:
                    dx = player.group.position.x - ramp['pos'].x
                    dz = player.group.position.z - ramp['pos'].z
                    if dx * dx + dz * dz < 36:
                        ramp['hit'] = True
                        ramp['entity'].color = color.rgba(0, 255, 0, 100)
                        self.progress += 1
                        from utils import particle_pool
                        particle_pool.spawn_sparks(ramp['pos'], count=8)

    def _update_destruction(self, player):
        """Check if player car hits lamps."""
        if player.on_foot:
            return
        for lamp in self.destruction_targets:
            if not lamp.enabled:
                continue
            if distance_2d(lamp.position, player.group.position) < 3:
                lamp.enabled = False
                self.progress += 1
                from utils import particle_pool
                particle_pool.spawn_sparks(
                    Vec3(lamp.x, lamp.y, lamp.z), count=6)
                # Damage the car slightly
                if player.current_car:
                    player.current_car.apply_damage(0.05)

    def _update_powerups(self, player):
        """Collect time power-ups."""
        for p in self.powerup_entities:
            if p.enabled and distance_2d(p.position, player.group.position) < 2:
                p.enabled = False
                self.score += 50
                self.timer += 3  # bonus time
                from utils import particle_pool
                particle_pool.spawn_sparks(p.position, count=6)

    def _update_race(self, player):
        """Check race checkpoint proximity."""
        if self.race_progress < len(self.race_checkpoints):
            cp = self.race_checkpoints[self.race_progress]
            if distance_2d(cp.position, player.group.position) < 5:
                cp.color = color.rgba(0, 255, 0, 100)
                self.race_progress += 1
                self.progress = self.race_progress
                from utils import particle_pool
                particle_pool.spawn_sparks(cp.position, count=6)

    def add_progress(self, amount=1):
        """Add progress to active mission (for coin collection etc)."""
        if self.active_mission:
            self.progress += amount

    def _complete_mission(self):
        """Complete the active mission."""
        reward = self.active_mission['reward']
        from utils import game_state, particle_pool
        game_state['coins'] = game_state.get('coins', 0) + reward
        self.completed.append(self.active_mission['id'])
        print(f"Mission COMPLETE: {self.active_mission['name']} +{reward} coins", flush=True)
        # Confetti at player position
        particle_pool.spawn_confetti(player.group.position, count=15)
        self._cleanup()

    def _fail_mission(self):
        """Fail the active mission."""
        print(f"Mission FAILED: {self.active_mission['name']}", flush=True)
        self.failed.append(self.active_mission['id'])
        self._cleanup()

    def _cleanup(self):
        """Clean up mission entities."""
        self.active_mission = None
        self.progress = 0
        self.timer = 0
        self.score = 0
        # Destroy spawned entities
        for g in self.goombas:
            if g:
                destroy(g)
        self.goombas = []
        if self.thwomp:
            destroy(self.thwomp)
            self.thwomp = None
        for t in self.delivery_targets:
            if t:
                destroy(t)
        self.delivery_targets = []
        for ramp in self.ramp_zones:
            if ramp['entity']:
                destroy(ramp['entity'])
        self.ramp_zones = []
        for lamp in self.destruction_targets:
            if lamp:
                destroy(lamp)
        self.destruction_targets = []
        for p in self.powerup_entities:
            if p:
                destroy(p)
        self.powerup_entities = []
        for cp in self.race_checkpoints:
            if cp:
                destroy(cp)
        self.race_checkpoints = []
