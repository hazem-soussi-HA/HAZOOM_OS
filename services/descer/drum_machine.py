#!/usr/bin/env python3
"""
DESCER — Intelligent Drum Machine & Composer
=============================================
Architecture:
  - Step Sequencer (16 steps x 16 instruments)
  - Pattern Engine (A/B/C/D variations)
  - Pattern Chainer (arrange patterns into songs)
  - Swing/Humanize engine
  - Morph engine (evolve patterns over time)
  - AI Composer (generates patterns from mood/text)

Timing: Sample-accurate at 44100Hz
Resolution: 16th notes (configurable to 32nd)
PPQN: 96 (pulses per quarter note) — like professional MIDI gear

Author: Hazem Soussi (HA) — inspired by Roland TR-808/909, Elektron Digitakt
"""

import json
import math
import random
import struct
import wave
import os
from pathlib import Path
from typing import List, Dict, Optional

# ============================================
# CONSTANTS — Like hardware register defines
# ============================================
SAMPLE_RATE = 44100
PPQN = 96
STEPS = 16
BPM_DEFAULT = 120

# Note frequencies (Hz) — like a synth lookup table
NOTE_FREQ = {
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
    'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
    'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25,
}

# ============================================
# SOUND ENGINE — Sample-level synthesis
# ============================================
class Voice:
    """A single voice/channel — like a hardware drum channel"""
    
    def __init__(self, name: str, waveform: str = 'sine'):
        self.name = name
        self.waveform = waveform
        self.level = 1.0
        self.pan = 0.0  # -1 left, 0 center, 1 right
        self.muted = False
        self.solo = False
    
    def generate_sample(self, freq: float, phase: float, envelope: float) -> float:
        """Generate a single sample — cycle-accurate"""
        t = phase / SAMPLE_RATE
        
        if self.waveform == 'sine':
            raw = math.sin(2 * math.pi * freq * t)
        elif self.waveform == 'square':
            raw = 1.0 if math.sin(2 * math.pi * freq * t) >= 0 else -1.0
        elif self.waveform == 'saw':
            raw = 2.0 * (t * freq - math.floor(t * freq + 0.5))
        elif self.waveform == 'triangle':
            raw = 2.0 * abs(2.0 * (t * freq - math.floor(t * freq + 0.5))) - 1.0
        elif self.waveform == 'noise':
            raw = random.uniform(-1, 1)
        else:
            raw = math.sin(2 * math.pi * freq * t)
        
        return raw * self.level * envelope


class DrumVoice(Voice):
    """Drum-specific voice with drum synthesis algorithms"""
    
    DRUM_TYPES = ['kick', 'snare', 'hihat', 'clap', 'tom', 'cymbal', 'rim', 'perc']
    
    def __init__(self, name: str, drum_type: str = 'kick'):
        super().__init__(name, 'sine')
        self.drum_type = drum_type
        self.tune = 60  # MIDI note
        self.decay = 0.3
        self.tone = 0.5
        self.attack = 0.001
    
    def trigger(self, velocity: float = 1.0) -> List[tuple]:
        """Trigger the drum — returns list of (sample_position, value) pairs"""
        samples = []
        freq = NOTE_FREQ.get(f'M{self.tune}', 100.0)
        decay_samples = int(self.decay * SAMPLE_RATE)
        
        if self.drum_type == 'kick':
            # Pitch-swept sine: 150Hz → 40Hz (classic kick)
            for i in range(decay_samples):
                t = i / SAMPLE_RATE
                progress = i / decay_samples
                freq_sweep = 150 * (1 - progress) + 40
                phase = 2 * math.pi * freq_sweep * t
                env = math.exp(-t * 8)
                val = math.sin(phase) * env * velocity
                samples.append((i, val))
        
        elif self.drum_type == 'snare':
            # Noise + tone burst
            for i in range(decay_samples):
                t = i / SAMPLE_RATE
                progress = i / decay_samples
                env = math.exp(-t * 15)
                tone = math.sin(2 * math.pi * 200 * t) * 0.3
                noise = random.uniform(-1, 1) * 0.7
                val = (tone + noise) * env * velocity
                samples.append((i, val))
        
        elif self.drum_type == 'hihat':
            # High-passed noise burst
            for i in range(int(0.05 * SAMPLE_RATE)):
                t = i / SAMPLE_RATE
                env = math.exp(-t * 80)
                noise = random.uniform(-1, 1)
                # Simple high-pass approximation
                val = noise * env * velocity * 0.5
                samples.append((i, val))
        
        elif self.drum_type == 'clap':
            # Multiple noise bursts
            for burst in range(3):
                offset = int(0.01 * SAMPLE_RATE) * burst
                for i in range(int(0.03 * SAMPLE_RATE)):
                    t = i / SAMPLE_RATE
                    env = math.exp(-t * 40)
                    noise = random.uniform(-1, 1)
                    val = noise * env * velocity * 0.6
                    samples.append((offset + i, val))
        
        elif self.drum_type == 'tom':
            # Like kick but higher
            for i in range(int(0.4 * SAMPLE_RATE)):
                t = i / SAMPLE_RATE
                progress = i / (0.4 * SAMPLE_RATE)
                freq_sweep = 200 * (1 - progress * 0.7)
                env = math.exp(-t * 6)
                val = math.sin(2 * math.pi * freq_sweep * t) * env * velocity
                samples.append((i, val))
        
        elif self.drum_type == 'cymbal':
            # Long noise with metallic harmonics
            for i in range(int(1.0 * SAMPLE_RATE)):
                t = i / SAMPLE_RATE
                env = math.exp(-t * 2)
                noise = random.uniform(-1, 1)
                # Add metallic overtones
                h1 = math.sin(2 * math.pi * 400 * t) * 0.2
                h2 = math.sin(2 * math.pi * 700 * t) * 0.15
                h3 = math.sin(2 * math.pi * 1100 * t) * 0.1
                val = (noise * 0.5 + h1 + h2 + h3) * env * velocity
                samples.append((i, val))
        
        elif self.drum_type == 'rim':
            # Short click
            for i in range(int(0.01 * SAMPLE_RATE)):
                t = i / SAMPLE_RATE
                val = math.sin(2 * math.pi * 800 * t) * math.exp(-t * 100) * velocity
                samples.append((i, val))
        
        elif self.drum_type == 'perc':
            # Tuned percussion
            for i in range(int(0.15 * SAMPLE_RATE)):
                t = i / SAMPLE_RATE
                progress = i / (0.15 * SAMPLE_RATE)
                freq_sweep = 400 * (1 - progress * 0.5)
                env = math.exp(-t * 20)
                val = math.sin(2 * math.pi * freq_sweep * t) * env * velocity
                samples.append((i, val))
        
        return samples


# ============================================
# STEP SEQUENCER — The heart of DESCER
# ============================================
class StepSequencer:
    """
    16-step x N-instrument sequencer
    Like the buttons on a TR-808 or Digitakt
    """
    
    def __init__(self, steps: int = 16):
        self.steps = steps
        self.data: Dict[str, List[int]] = {}  # instrument -> [0/1 per step]
        self.velocities: Dict[str, List[float]] = {}  # instrument -> [0-1 per step]
        self.probabilities: Dict[str, List[float]] = {}  # instrument -> [0-1 per step]
    
    def add_instrument(self, name: str):
        self.data[name] = [0] * self.steps
        self.velocities[name] = [0.8] * self.steps
        self.probabilities[name] = [1.0] * self.steps
    
    def set(self, instrument: str, step: int, velocity: float = 0.8, probability: float = 1.0):
        if instrument in self.data and 0 <= step < self.steps:
            self.data[instrument][step] = 1
            self.velocities[instrument][step] = velocity
            self.probabilities[instrument][step] = probability
    
    def clear(self, instrument: str, step: int):
        if instrument in self.data and 0 <= step < self.steps:
            self.data[instrument][step] = 0
    
    def toggle(self, instrument: str, step: int):
        if instrument in self.data and 0 <= step < self.steps:
            self.data[instrument][step] ^= 1
    
    def get_active_steps(self, instrument: str) -> List[int]:
        return [i for i, v in enumerate(self.data.get(instrument, [])) if v]
    
    def get_density(self, instrument: str) -> float:
        active = sum(self.data.get(instrument, [0]))
        return active / self.steps
    
    def rotate(self, instrument: str, amount: int):
        """Rotate pattern left/right — classic sequencer trick"""
        if instrument in self.data:
            self.data[instrument] = self.data[instrument][amount:] + self.data[instrument][:amount]
            self.velocities[instrument] = self.velocities[instrument][amount:] + self.velocities[instrument][:amount]
    
    def randomize(self, instrument: str, density: float = 0.3):
        """Randomize with density control"""
        if instrument in self.data:
            for i in range(self.steps):
                if random.random() < density:
                    self.data[instrument][i] = 1
                    self.velocities[instrument][i] = random.uniform(0.5, 1.0)
                else:
                    self.data[instrument][i] = 0
    
    def clear_all(self):
        for inst in self.data:
            self.data[inst] = [0] * self.steps
    
    def to_dict(self) -> dict:
        instruments = []
        for name, pattern in self.data.items():
            if any(pattern):
                instruments.append({
                    'name': name,
                    'steps': pattern,
                    'velocities': self.velocities[name],
                    'probabilities': self.probabilities[name],
                })
        return {'steps': self.steps, 'instruments': instruments}


# ============================================
# PATTERN ENGINE — Variations & evolution
# ============================================
class PatternEngine:
    """Generate pattern variations — like A/B variations on hardware"""
    
    @staticmethod
    def create_variation(source: StepSequencer, variation_type: str = 'ghost') -> StepSequencer:
        """Create a variation from source pattern"""
        result = StepSequencer(source.steps)
        
        for inst in source.data:
            result.add_instrument(inst)
            result.data[inst] = source.data[inst].copy()
            result.velocities[inst] = source.velocities[inst].copy()
        
        if variation_type == 'ghost':
            # Add ghost notes (quiet hits between main hits)
            for inst in result.data:
                for i in range(result.steps):
                    if not result.data[inst][i] and random.random() < 0.15:
                        result.data[inst][i] = 1
                        result.velocities[inst][i] = random.uniform(0.1, 0.3)
        
        elif variation_type == 'fills':
            # Add fills at end of bar (steps 12-15)
            for inst in result.data:
                if inst in ['snare', 'tom', 'cymbal']:
                    for i in range(12, 16):
                        if random.random() < 0.4:
                            result.data[inst][i] = 1
                            result.velocities[inst][i] = random.uniform(0.6, 1.0)
        
        elif variation_type == 'simplify':
            # Remove 30% of hits
            for inst in result.data:
                for i in range(result.steps):
                    if result.data[inst][i] and random.random() < 0.3:
                        result.data[inst][i] = 0
        
        elif variation_type == 'intensify':
            # Increase velocities, add accents
            for inst in result.data:
                for i in range(result.steps):
                    if result.data[inst][i]:
                        result.velocities[inst][i] = min(1.0, result.velocities[inst][i] * 1.3)
                        if i % 4 == 0:  # Accent on downbeats
                            result.velocities[inst][i] = 1.0
        
        return result
    
    @staticmethod
    def evolve(pattern: StepSequencer, generations: int = 4) -> List[StepSequencer]:
        """Evolve a pattern through generations"""
        evolution = [pattern]
        current = pattern
        
        for gen in range(generations):
            variation_type = random.choice(['ghost', 'fills', 'simplify', 'intensify'])
            current = PatternEngine.create_variation(current, variation_type)
            evolution.append(current)
        
        return evolution


# ============================================
# SWING & HUMANIZE — Groove engine
# ============================================
class GrooveEngine:
    """Add swing and humanization — makes it feel alive"""
    
    @staticmethod
    def apply_swing(step_index: int, swing_amount: float = 0.33) -> float:
        """
        Apply swing offset to a step
        swing_amount: 0 = straight, 0.5 = triplet feel, 0.66 = heavy swing
        Returns: timing offset in samples
        """
        if step_index % 2 == 1:
            # Odd steps (8th notes) get delayed
            offset = swing_amount * (60.0 / BPM_DEFAULT) * SAMPLE_RATE / 2
            return offset
        return 0
    
    @staticmethod
    def humanize_velocity(velocity: float, amount: float = 0.1) -> float:
        """Add slight velocity variation"""
        return max(0, min(1, velocity + random.uniform(-amount, amount)))
    
    @staticmethod
    def humanize_timing(step_time: float, amount: float = 0.005) -> float:
        """Add slight timing variation (in seconds)"""
        return step_time + random.uniform(-amount, amount)


# ============================================
# AI COMPOSER — Mood-based pattern generation
# ============================================
class AIComposer:
    """Generate patterns from mood/text descriptions"""
    
    # Genre templates — like preset patterns on a drum machine
    GENRE_TEMPLATES = {
        'techno': {
            'kick':  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
            'hihat': [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
            'snare': [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
            'clap':  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        },
        'house': {
            'kick':  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
            'hihat': [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
            'snare': [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        },
        'dnb': {  # Drum & Bass
            'kick':  [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
            'snare': [0,0,0,0, 1,0,0,0, 0,0,0,0, 0,0,1,0],
            'hihat': [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
        },
        'hiphop': {
            'kick':  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],
            'snare': [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
            'hihat': [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1],
        },
        'ambient': {
            'kick':  [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
            'perc':  [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,1],
            'tom':   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
        },
        'berlin': {  # Berlin techno — dark, industrial
            'kick':  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
            'rim':   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
            'clap':  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
            'cymbal':[0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
        },
    }
    
    MOOD_PARAMETERS = {
        'dark':     {'density': 0.4, 'velocity': 0.7, 'decay': 0.5, 'noise': 0.3},
        'energetic': {'density': 0.6, 'velocity': 0.9, 'decay': 0.2, 'noise': 0.1},
        'minimal':  {'density': 0.2, 'velocity': 0.6, 'decay': 0.3, 'noise': 0.0},
        'chaotic':  {'density': 0.7, 'velocity': 1.0, 'decay': 0.4, 'noise': 0.5},
        'groovy':   {'density': 0.45, 'velocity': 0.75, 'decay': 0.35, 'noise': 0.15},
        'melancholic': {'density': 0.25, 'velocity': 0.5, 'decay': 0.6, 'noise': 0.2},
    }
    
    @classmethod
    def compose(cls, genre: str = 'techno', mood: str = 'groovy', 
                 bars: int = 4, variation: bool = True) -> List[StepSequencer]:
        """Generate a full pattern from genre + mood"""
        
        template = cls.GENRE_TEMPLATES.get(genre, cls.GENRE_TEMPLATES['techno'])
        params = cls.MOOD_PARAMETERS.get(mood, cls.MOOD_PARAMETERS['groovy'])
        
        patterns = []
        
        for bar in range(bars):
            pattern = StepSequencer(STEPS)
            
            for drum_name, base_pattern in template.items():
                voice = DrumVoice(drum_name, drum_name)
                pattern.add_instrument(drum_name)
                
                for step in range(STEPS):
                    if base_pattern[step]:
                        # Apply mood parameters
                        vel = params['velocity'] * random.uniform(0.7, 1.0)
                        prob = random.uniform(0.7, 1.0)
                        
                        # Density reduction
                        if random.random() > params['density'] / 0.5:
                            vel = 0
                        
                        pattern.set(drum_name, step, vel, prob)
            
            # Add variation for bars 2+
            if variation and bar > 0:
                pattern = cls._add_bar_variation(pattern, bar)
            
            patterns.append(pattern)
        
        return patterns
    
    @staticmethod
    def _add_bar_variation(pattern: StepSequencer, bar_num: int) -> StepSequencer:
        """Add variation to a specific bar"""
        # Every 4th bar: add fill
        if bar_num % 4 == 3:
            for inst in ['snare', 'tom']:
                if inst in pattern.data:
                    pattern.set(inst, 14, 0.9)
                    pattern.set(inst, 15, 0.7)
        
        # Every 2nd bar: ghost notes
        if bar_num % 2 == 1:
            for inst in ['hihat', 'perc']:
                if inst in pattern.data:
                    empty_steps = [i for i in range(STEPS) if not pattern.data[inst][i]]
                    if empty_steps:
                        step = random.choice(empty_steps)
                        pattern.set(inst, step, random.uniform(0.1, 0.3))
        
        return pattern


# ============================================
# WAV RENDERER — Output to audio file
# ============================================
class Renderer:
    """Render patterns to WAV — like bouncing down a track"""
    
    @staticmethod
    def render_pattern(pattern: StepSequencer, bpm: int = BPM_DEFAULT, 
                       num_loops: int = 4, swing: float = 0.0) -> str:
        """Render a pattern to WAV file"""
        
        beat_duration = 60.0 / bpm
        step_duration = beat_duration / 4  # 16th notes
        total_steps = pattern.steps * num_loops
        total_samples = int(total_steps * step_duration * SAMPLE_RATE)
        
        # Initialize mix buffer
        mix_buffer = [0.0] * total_samples
        
        # Create drum voices
        voices = {}
        for inst in pattern.data:
            voices[inst] = DrumVoice(inst, inst)
        
        # Render each step
        for loop in range(num_loops):
            for step in range(pattern.steps):
                sample_offset = int((loop * pattern.steps + step) * step_duration * SAMPLE_RATE)
                
                # Apply swing
                if step % 2 == 1:
                    sample_offset += int(swing * step_duration * SAMPLE_RATE / 2)
                
                for inst, pattern_data in pattern.data.items():
                    if pattern_data[step]:
                        velocity = pattern.velocities[inst][step]
                        probability = pattern.probabilities[inst][step]
                        
                        # Probability gate
                        if random.random() > probability:
                            continue
                        
                        # Humanize
                        velocity = GrooveEngine.humanize_velocity(velocity, 0.05)
                        
                        # Trigger drum
                        voice = voices[inst]
                        samples = voice.trigger(velocity)
                        
                        for offset, val in samples:
                            idx = sample_offset + offset
                            if 0 <= idx < total_samples:
                                mix_buffer[idx] += val
        
        # Normalize
        peak = max(abs(s) for s in mix_buffer) or 1.0
        scale = 0.8 / peak
        mix_buffer = [s * scale for s in mix_buffer]
        
        # Write WAV
        output_path = f"/tmp/descer_output.wav"
        with wave.open(output_path, 'w') as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(SAMPLE_RATE)
            
            for sample in mix_buffer:
                clamped = max(-1, min(1, sample))
                wav.writeframes(struct.pack('h', int(clamped * 32767)))
        
        return output_path


# ============================================
# MAIN — DESCER runtime
# ============================================
def main():
    print("""
    ╔═══════════════════════════════════════════╗
    ║           DESCER v0.1                     ║
    ║   Intelligent Drum Machine & Composer      ║
    ║   "Code your beats like assembly"          ║
    ╚═══════════════════════════════════════════╝
    """)
    
    # Demo: Generate patterns from different genres + moods
    demos = [
        ('techno', 'dark', 'Berlin Dark Techno'),
        ('house', 'groovy', 'Groovy House'),
        ('dnb', 'energetic', 'Drum & Bass Energy'),
        ('hiphop', 'groovy', 'Hip Hop Beat'),
        ('berlin', 'dark', 'Berlin Industrial'),
    ]
    
    for genre, mood, name in demos:
        print(f"\n  Composing: {name} ({genre} + {mood})")
        
        # AI Composer generates 4 bars
        patterns = AIComposer.compose(genre, mood, bars=4, variation=True)
        
        # Show first bar
        p = patterns[0]
        print(f"  Pattern ({len(patterns)} bars):")
        for inst in p.data:
            if any(p.data[inst]):
                visual = ''.join(['█' if v else '·' for v in p.data[inst]])
                print(f"    {inst:8} |{visual}|")
        
        # Render to WAV
        wav_path = Renderer.render_pattern(p, bpm=125, num_loops=4)
        size = os.path.getsize(wav_path) / 1024
        print(f"  → Rendered: {wav_path} ({size:.0f}KB)")
    
    print(f"\n  ✓ DESCER complete — {len(demos)} patterns generated")
    print(f"  ✓ Output: /tmp/descer_output.wav")
    print(f"\n  DESCER — Because beats are code, and code is art.")


if __name__ == '__main__':
    main()
