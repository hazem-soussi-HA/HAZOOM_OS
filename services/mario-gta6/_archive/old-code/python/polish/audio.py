# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Hazem Soussi (HA)
# Super Mario GTA6 — Audio Engine

"""
Procedural audio engine for Mario GTA6.
Generates sound effects using pygame.mixer (no external audio files needed).
"""

import numpy as np
import pygame
import math
from typing import Optional


SAMPLE_RATE = 22050


def generate_sine(frequency: float, duration: float, volume: float = 0.3) -> np.ndarray:
    """Generate a sine wave sound."""
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n, dtype=np.float32)
    wave = np.sin(2 * np.pi * frequency * t) * volume
    return wave


def generate_square(frequency: float, duration: float, volume: float = 0.2) -> np.ndarray:
    """Generate a square wave sound."""
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n, dtype=np.float32)
    wave = np.sign(np.sin(2 * np.pi * frequency * t)) * volume
    return wave


def generate_noise(duration: float, volume: float = 0.1) -> np.ndarray:
    """Generate white noise."""
    n = int(SAMPLE_RATE * duration)
    return (np.random.random(n).astype(np.float32) * 2 - 1) * volume


def array_to_sound(array: np.ndarray) -> pygame.mixer.Sound:
    """Convert numpy array to pygame Sound."""
    # Convert to 16-bit stereo
    stereo = np.column_stack((array, array))
    samples = (stereo * 32767).astype(np.int16)
    return pygame.mixer.Sound(buffer=samples.tobytes())


class AudioEngine:
    """Procedural sound effects generator."""

    def __init__(self):
        self._sounds = {}
        self._init_sounds()

    def _init_sounds(self):
        """Generate all sound effects."""
        self._sounds['jump'] = array_to_sound(
            generate_square(400, 0.15, 0.2) * np.linspace(1, 0, int(SAMPLE_RATE * 0.15))
        )
        self._sounds['coin'] = array_to_sound(
            generate_sine(880, 0.1, 0.3) + generate_sine(1320, 0.1, 0.2)
        )
        self._sounds['stomp'] = array_to_sound(
            generate_noise(0.1, 0.3) * np.linspace(1, 0.3, int(SAMPLE_RATE * 0.1))
        )
        self._sounds['powerup'] = array_to_sound(
            np.concatenate([
                generate_sine(440, 0.05, 0.2),
                generate_sine(550, 0.05, 0.2),
                generate_sine(660, 0.05, 0.2),
                generate_sine(880, 0.1, 0.3),
            ])
        )
        self._sounds['hurt'] = array_to_sound(
            generate_square(200, 0.3, 0.2) * np.linspace(1, 0, int(SAMPLE_RATE * 0.3))
        )
        self._sounds['game_over'] = array_to_sound(
            np.concatenate([
                generate_sine(440, 0.2, 0.3),
                generate_sine(370, 0.2, 0.3),
                generate_sine(311, 0.2, 0.3),
                generate_sine(261, 0.5, 0.4),
            ])
        )
        self._sounds['car_horn'] = array_to_sound(
            generate_sine(520, 0.2, 0.15) + generate_sine(660, 0.2, 0.1)
        )
        self._sounds['spring'] = array_to_sound(
            generate_sine(300, 0.05, 0.2) + generate_sine(600, 0.15, 0.15)
        )

    def play(self, sound_name: str):
        """Play a sound effect."""
        if sound_name in self._sounds:
            self._sounds[sound_name].play()

    def play_music(self, bpm: float = 120, duration: float = 8.0):
        """Generate and play a simple procedural music loop."""
        beat_duration = 60.0 / bpm
        n_beats = int(duration / beat_duration)

        # Simple arpeggio pattern
        notes = [261, 329, 392, 523, 392, 329]  # C major arpeggio

        music = np.array([], dtype=np.float32)
        for i in range(n_beats):
            freq = notes[i % len(notes)]
            beat = generate_sine(freq, beat_duration * 0.9, 0.1)
            silence = np.zeros(int(SAMPLE_RATE * beat_duration * 0.1), dtype=np.float32)
            music = np.concatenate([music, beat, silence])

        sound = array_to_sound(music)
        sound.play(-1)  # loop
        return sound
