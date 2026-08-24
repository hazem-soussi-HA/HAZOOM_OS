#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate 18 family-distinct, NATURAL-sounding bird-call .wav files locally.

Why local synthesis instead of downloading recordings:
  - License-clean: these are my own procedural synthesis (MIT-compatible,
    CC0-by-construction). No external audio with unknown/NC licenses is
    ever bundled into the project.
  - Offline-forever: once generated, the files live in assets/sounds/ and
    are served from 127.0.0.1 with zero egress.
  - Swappable: to use REAL field recordings later, drop a CC0 .mp3 into
    assets/sounds/ and set the bird's sound.src to it -- the audio engine
    (audioBird.js) already reads {type:'file', src:...}.

The acoustic profiles mirror src/audioBird.js VOICES so the file and the
on-device synth stay consistent in character.

Output: the_new_age/assets/sounds/<Family>.wav   (one per family)
Copyright (c) 2026 Hazem Soussi <hazem.soussi@gmail.com> -- MIT.
"""
import os
import math
import wave
import struct
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "sounds")
SR = 44100


def _clip(x):
    return np.clip(x, -0.99, 0.99)


def _tone(t0, dur, f0, f1=None, wave_type="sine", gain=0.3):
    """Return (times, samples) for a tone starting at t0 (s)."""
    n = int(SR * dur)
    t = np.linspace(0.0, dur, n, endpoint=False)
    if wave_type == "sine":
        sig = np.sin(2 * np.pi * f0 * t)
        if f1:  # linear glide in Hz
            sig = np.sin(2 * np.pi * (f0 + (f1 - f0) * (t / dur)) * t)
    elif wave_type == "sawtooth":
        sig = 2 * (f0 * t - np.floor(0.5 + f0 * t))
    elif wave_type == "square":
        sig = np.sign(np.sin(2 * np.pi * f0 * t))
    else:
        sig = np.sin(2 * np.pi * f0 * t)
    # attack/decay envelope
    env = np.ones(n)
    a = int(SR * 0.01)
    env[:a] = np.linspace(0.0001, 1.0, a)
    env[-a:] = np.linspace(1.0, 0.0001, a)
    return t0, sig * gain * env


def _noise_burst(t0, dur, gain=0.2, lp=1200):
    n = int(SR * dur)
    t = np.linspace(0.0, dur, n, endpoint=False)
    sig = (np.random.rand(n) * 2 - 1) * (1 - t / dur)
    # crude one-pole low-pass
    out = np.zeros(n)
    last = 0.0
    a = lp / SR
    for i, s in enumerate(sig):
        last = last + a * (s - last)
        out[i] = last
    return t0, out * gain


def _chirp(t0, f0, f1, dur, wave_type="triangle", gain=0.25):
    n = int(SR * dur)
    t = np.linspace(0.0, dur, n, endpoint=False)
    if wave_type == "triangle":
        phase = 2 * np.pi * (f0 + (f1 - f0) * (t / dur)) * t
        sig = (2 / np.pi) * np.arcsin(np.sin(phase))
    else:
        sig = np.sin(2 * np.pi * (f0 + (f1 - f0) * (t / dur)) * t)
    env = np.ones(n)
    a = int(SR * 0.01)
    env[:a] = np.linspace(0.0001, 1.0, a)
    env[-a:] = np.linspace(1.0, 0.0001, a)
    return t0, sig * gain * env


def _mix(events):
    """events: list of (t0, samples). Render to a single float32 buffer."""
    total = 0.0
    for t0, s in events:
        end = t0 + len(s) / SR
        total = max(total, end)
    n = int(SR * total) + SR  # 1s pad
    buf = np.zeros(n, dtype=np.float32)
    for t0, s in events:
        start = int(SR * t0)
        buf[start:start + len(s)] += s.astype(np.float32)
    peak = max(np.max(np.abs(buf)), 1e-6)
    return (buf / peak).astype(np.float32)


def _write(name, buf):
    path = os.path.join(OUT, name)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        data = (_clip(buf) * 32767).astype("<i2").tobytes()
        w.writeframes(data)
    return path


# --- family -> synth profile (port from audioBird.js VOICES) ---------------
PROFILES = {
    "Psittacidae": lambda: [  # parrot: harsh squawk + mimic warble
        _tone(0.00, 0.12, 900, 1400, "sawtooth", 0.25),
        _tone(0.14, 0.10, 1300, 800, "square", 0.18),
        _chirp(0.28, 700, 1500, 0.18, "sine", 0.20),
    ],
    "Phoenicopteridae": lambda: [  # flamingo: goose-like honk
        _tone(0.00, 0.18, 420, 360, "sawtooth", 0.22),
        _tone(0.20, 0.16, 380, 320, "sawtooth", 0.20),
    ],
    "Ciconiidae": lambda: [  # stork: soft bill-clatter
        _noise_burst(0.00, 0.05, 0.15, 2500),
        _noise_burst(0.09, 0.05, 0.13, 2500),
        _noise_burst(0.18, 0.05, 0.12, 2500),
    ],
    "Struthionidae": lambda: [  # ostrich: low booming
        _tone(0.00, 0.50, 110, 80, "sine", 0.35),
        _tone(0.10, 0.40, 90, 70, "sine", 0.25),
    ],
    "Sagittariidae": lambda: [  # secretary: croaking kurr
        _tone(0.00, 0.10, 300, 220, "sawtooth", 0.20),
        _tone(0.13, 0.10, 280, 210, "sawtooth", 0.18),
    ],
    "Coraciidae": lambda: [  # roller: rolling grating rak-rak
        *[_chirp(i * 0.09, 1100, 700, 0.07, "square", 0.18) for i in range(4)],
    ],
    "Accipitridae": lambda: [  # accipiter (eagle): yelping cry
        _tone(0.00, 0.18, 700, 1100, "sawtooth", 0.28),
        _tone(0.18, 0.16, 1000, 1400, "sawtooth", 0.24),
        _tone(0.36, 0.14, 900, 1200, "sawtooth", 0.20),
    ],
    "Gruidae": lambda: [  # crane: resonant honk + trill
        _tone(0.00, 0.22, 480, 420, "sawtooth", 0.24),
        _chirp(0.26, 900, 1500, 0.20, "sine", 0.18),
    ],
    "Bucorvidae": lambda: [  # hornbill: deep booming
        _tone(0.00, 0.45, 140, 100, "sine", 0.33),
        _tone(0.12, 0.35, 120, 90, "sine", 0.24),
    ],
    "Balaenicipitidae": lambda: [  # shoebill: machine-gun clatter
        *[_noise_burst(i * 0.07, 0.04, 0.18, 3000) for i in range(6)],
    ],
    "Otididae": lambda: [  # bustard: deep booming oomf
        _tone(0.00, 0.40, 160, 110, "sine", 0.30),
        _tone(0.10, 0.30, 130, 95, "sine", 0.22),
    ],
    "Numididae": lambda: [  # guineafowl: kek-kek alarm
        *[_chirp(i * 0.08, 600, 500, 0.05, "square", 0.16) for i in range(6)],
    ],
    "Buphagidae": lambda: [  # oxpecker: hiss + shrill
        _noise_burst(0.00, 0.20, 0.12, 4000),
        _chirp(0.22, 1800, 2200, 0.10, "sine", 0.14),
    ],
    "Spheniscidae": lambda: [  # penguin: donkey bray
        _tone(0.00, 0.20, 500, 300, "sawtooth", 0.30),
        _tone(0.22, 0.22, 320, 480, "sawtooth", 0.26),
    ],
    "Charadriidae": lambda: [  # lapwing: sharp kik-kik
        *[_chirp(i * 0.10, 1400, 1000, 0.06, "square", 0.18) for i in range(4)],
    ],
    "Sturnidae": lambda: [  # starling: whistled tsee + warble
        _chirp(0.00, 2000, 2600, 0.12, "sine", 0.18),
        _chirp(0.16, 2400, 1800, 0.14, "sine", 0.16),
    ],
    "Jacanidae": lambda: [  # jacana: harsh kree-kree
        _chirp(0.00, 1200, 800, 0.10, "sawtooth", 0.20),
        _chirp(0.14, 1100, 750, 0.10, "sawtooth", 0.18),
    ],
    "Threskiornithidae": lambda: [  # ibis: raucous haa-da-da
        _tone(0.00, 0.12, 520, 460, "sawtooth", 0.24),
        _tone(0.14, 0.10, 560, 500, "sawtooth", 0.20),
        _tone(0.26, 0.12, 500, 440, "sawtooth", 0.20),
    ],
    "_generic": lambda: [  # pleasant chirp fallback
        _chirp(0.00, 1000, 1600, 0.15, "sine", 0.20),
        _chirp(0.18, 1500, 1100, 0.14, "sine", 0.16),
    ],
}


def main():
    os.makedirs(OUT, exist_ok=True)
    ok = 0
    for family, synth in PROFILES.items():
        if family.startswith("_"):
            continue
        fname = family + ".wav"
        buf = _mix(synth())
        _write(fname, buf)
        ok += 1
        print(f"  [ok] {family:22s} -> assets/sounds/{fname}")
    print(f"\nGenerated {ok} family-distinct bird-call files in:\n  {OUT}")
    print("All files are local synthesis (MIT/CC0-by-construction). Offline-ready.")


if __name__ == "__main__":
    main()
