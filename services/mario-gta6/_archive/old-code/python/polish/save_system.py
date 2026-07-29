# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Hazem Soussi (HA)
# Super Mario GTA6 — Save/Load System

"""Save/load game state to JSON files."""

import json
import os
import time
from typing import Dict, Optional


SAVE_DIR = os.path.join(os.path.dirname(__file__), '..', 'saves')

os.makedirs(SAVE_DIR, exist_ok=True)


def save_game(game, slot: int = 0) -> str:
    """Save game state to a JSON file."""
    state = {
        'version': '1.4.0',
        'timestamp': time.time(),
        'player': {
            'x': game.px,
            'y': game.py,
            'vx': game.pvx,
            'vy': game.pvy,
            'dir': game.p_dir,
            'mode': game.p_mode,
            'inv': game.p_inv,
            'star': game.p_star,
            'on_car': game.p_on_car,
        },
        'game': {
            'coins': game.coins,
            'score': game.score,
            'time': game.time,
            'lives': game.lives,
            'cam': game.cam,
        },
        'level': [[int(t) for t in row] for row in game.lvl],
        'enemies': [
            {'x': e['x'], 'y': e['y'], 'vx': e['vx'], 'hp': e['hp'], 'type': e['type']}
            for e in game.t_enemies if e['hp'] > 0
        ],
        'cars': [
            {'x': c['x'], 'y': c['y'], 'vx': c['vx'], 'color': c['color']}
            for c in game.cars
        ],
    }

    path = os.path.join(SAVE_DIR, f'save_{slot}.json')
    with open(path, 'w') as f:
        json.dump(state, f, indent=2)
    return path


def load_game(game, slot: int = 0) -> bool:
    """Load game state from a JSON file."""
    path = os.path.join(SAVE_DIR, f'save_{slot}.json')
    if not os.path.exists(path):
        return False

    with open(path, 'r') as f:
        state = json.load(f)

    p = state['player']
    game.px = p['x']
    game.py = p['y']
    game.pvx = p['vx']
    game.pvy = p['vy']
    game.p_dir = p['dir']
    game.p_mode = p['mode']
    game.p_inv = p['inv']
    game.p_star = p['star']
    game.p_on_car = p['on_car']

    g = state['game']
    game.coins = g['coins']
    game.score = g['score']
    game.time = g['time']
    game.lives = g['lives']
    game.cam = g['cam']

    game.lvl = [[int(t) for t in row] for row in state['level']]
    game.t_enemies = [
        {'x': e['x'], 'y': e['y'], 'vx': e['vx'], 'hp': e['hp'],
         'type': e['type'], 't': 0}
        for e in state['enemies']
    ]
    game.cars = state['cars']
    return True


def list_saves() -> list:
    """List all save files."""
    saves = []
    for f in os.listdir(SAVE_DIR):
        if f.startswith('save_') and f.endswith('.json'):
            slot = int(f.split('_')[1].split('.')[0])
            path = os.path.join(SAVE_DIR, f)
            with open(path, 'r') as fh:
                state = json.load(fh)
            saves.append({
                'slot': slot,
                'score': state['game']['score'],
                'coins': state['game']['coins'],
                'time': state['game']['time'],
                'timestamp': state['timestamp'],
            })
    return sorted(saves, key=lambda s: s['slot'])
