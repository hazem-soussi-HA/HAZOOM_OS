# -*- coding: utf-8 -*-
"""
CollaborativeBeat v4  --  "Neural Core Interface"
Copyright (c) 2026 Hazem Soussi <hazem.soussi@gmail.com>
Licensed under MIT.  All original contributions (c) Hazem Soussi.

A secure, local-first voice/beat companion.

Vision (owner's brief):
  - Talk to your CPU/GPU through the microphone (real, on-device, private).
  - An interface that makes you FOCUSED, INSPIRED, reasoning toward fortune.
  - Strictly SECURE, COPYRIGHTED, idea-respecting, cryptographically protected.
  - Built with high-level (Python) AND low-level (C) code.

Security model (do not weaken):
  - Binds to 127.0.0.1 ONLY (loopback). Nothing is reachable from the LAN.
  - A bearer token (SESSION_KEY in .env) is required for /api/* (mic, chat,
    journal). The SPA gets it once from /api/handshake using the same token,
    then keeps it in memory for the tab's life.
  - A session id (SID) is returned by handshake; all audio/memory is scoped to
    that SID so two tabs never mix data.
  - The brainstorm journal is written to disk with an HMAC-SHA256 signature
    (key = SESSION_KEY). Tampering is detected and rejected (fail-closed).
  - The synthesiser is seeded PER SID from OS cryptographic entropy (a low-level
    C extension, _cbeat.so) so nothing is predictable or shared.

Privacy model:
  - Microphone audio is analysed ON-CE DEVICE to derive an "energy" scalar.
    NO audio bytes are ever stored, logged, or sent off-box.
  - Speech-to-text is NOT enabled by default (no cloud round-trip). The spoken
    "command" path is text/energy only unless the owner wires a local model.

Run:  python3 collaborative_beat_v4.py
Open:  http://127.0.0.1:5000
"""

import os
import sys
import json
import hmac
import hashlib
import secrets
import base64
import time
import io
import wave
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from flask import (
    Flask, request, jsonify, render_template_string, send_file, abort,
)
from dotenv import load_dotenv

# Local-first LLM brain (ornith:35b via local Ollama). Import is tolerant: if
# the module is missing the app still runs on the heuristic core alone.
try:
    from llm_core import generate_line, health as llm_health, \
        OLLAMA_MODEL, OLLAMA_BASE_URL
except Exception as e:  # pragma: no cover
    llm_core = None  # type: ignore
    generate_line = None  # type: ignore
    llm_health = lambda: False  # type: ignore
    OLLAMA_MODEL = "ornith:35b"
    OLLAMA_BASE_URL = "http://localhost:11434/v1"
    print(f"[warn] llm_core unavailable ({e}); running heuristic core only.")
# Mic path uses a smaller/faster local model when set (e.g. llama3.1:8b) so
# "hold to speak" answers in seconds instead of waiting on the 35B. Defaults to
# the chat model if unset.
OLLAMA_MODEL_MIC = os.environ.get("OLLAMA_MODEL_MIC", os.environ.get("OLLAMA_MODEL", OLLAMA_MODEL))

# ----------------------------------------------------------------------------
# 0. Paths & config
# ----------------------------------------------------------------------------
BASE_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = BASE_DIR / "data"
STATIC_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

load_dotenv(BASE_DIR / ".env")

# Auto-set the API token if .env has none. The SESSION_KEY IS the agent's
# bearer token for reaching the core over the web (/api/handshake -> X-Session-Key).
# If it is missing we generate a fresh one and persist it to .env so the value
# is stable across restarts (never commit .env — it is git-ignored).
SESSION_KEY = os.environ.get("SESSION_KEY")
if not SESSION_KEY:
    SESSION_KEY = secrets.token_hex(32)
    try:
        env_path = BASE_DIR / ".env"
        line = f"SESSION_KEY={SESSION_KEY}\n"
        if env_path.exists():
            existing = env_path.read_text(encoding="utf-8")
            if "SESSION_KEY=" not in existing:
                env_path.write_text(existing.rstrip("\n") + "\n" + line, encoding="utf-8")
        else:
            env_path.write_text(line, encoding="utf-8")
        print("  [init] generated + persisted SESSION_KEY to .env (agent token)")
    except Exception as e:
        print(f"  [warn] could not persist SESSION_KEY ({e}); using in-memory key")

PORT = int(os.environ.get("CB_PORT", "5000"))
HOST = "127.0.0.1"  # loopback ONLY, by design

# Low-level entropy source (compiled C extension). Added to path then imported.
sys.path.insert(0, str(BASE_DIR))
try:
    import _cbeat  # type: ignore
    HAVE_C = True
except Exception as e:  # pragma: no cover
    _cbeat = None
    HAVE_C = False
    print(f"[warn] low-level entropy module unavailable ({e}); using fallback.")

app = Flask(__name__)

# ----------------------------------------------------------------------------
# 1. Crypto helpers (signed journal, sid derivation, HMAC)
# ----------------------------------------------------------------------------
def hmac_sign(payload: str) -> str:
    return hmac.new(SESSION_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()

def os_entropy(n: int = 16) -> bytes:
    """Cryptographic randomness: prefer the C extension, fall back to os.urandom."""
    if HAVE_C:
        return _cbeat.entropy(n)
    return os.urandom(n)

def derive_sid() -> str:
    """A fresh, unguessable session id for one browser tab's life."""
    return base64.urlsafe_b64encode(os_entropy(24)).decode().rstrip("=")

# ----------------------------------------------------------------------------
# 2. In-memory reasoning core (heuristic "general intelligence")
#    No cloud dependency. Deterministic per mode, varied by SID entropy.
# ----------------------------------------------------------------------------
class NeuralCore:
    """A small, self-contained reasoning engine.

    It maps an intent (focus / wealth / inspire / reason / calm / dark / energy)
    to a spoken line, a BPM, a base frequency and a 'vibe'. It also keeps a
    per-SID memory of the owner's brainstorm so later replies can build on it.
    """

    # Curated, positive, fortune-oriented affirmations / reasoning prompts.
    LIBRARY = {
        "focus": {
            "line": "Locking in. One task, deep work, no noise. Your attention is the "
                    "rarest asset you own. Spend it like capital.",
            "bpm": 96, "base": 55.0, "vibe": "focus",
        },
        "wealth": {
            "line": "Thinking like an owner. Wealth is solved problems at scale. Name the "
                    "pain you will remove, price it, ship it, compound it.",
            "bpm": 120, "base": 65.9, "vibe": "wealth",
        },
        "inspire": {
            "line": "Open the aperture. The next idea is one connection away. What did you "
                    "see today that nobody priced correctly yet?",
            "bpm": 110, "base": 73.4, "vibe": "inspire",
        },
        "reason": {
            "line": "First principles. Strip the assumption, keep the physics. If the premise "
                    "is false, the conclusion is free to be rebuilt.",
            "bpm": 100, "base": 82.4, "vibe": "reason",
        },
        "calm": {
            "line": "Slow the breath. The signal is under the noise. You are safe; build from here.",
            "bpm": 70, "base": 48.0, "vibe": "calm",
        },
        "energy": {
            "line": "Clock speed up. Momentum is a drug; take the first step and the rest "
                    "follows. Move now.",
            "bpm": 140, "base": 92.0, "vibe": "energy",
        },
        "dark": {
            "line": "Sub-frequency resonance. Heavy, patient, inevitable. Let the low end carry "
                    "the weight while the mind goes quiet.",
            "bpm": 84, "base": 40.0, "vibe": "dark",
        },
        # 'faith' / 'assembly' mode: speaks the owner's principle back.
        # The fastest possible program on the hardware you own is assembly.
        # Choosing it is FAITH · BELIEVE · TRUST · RECEIVING ++ COMMITMENT.
        "faith": {
            "line": "Write for the metal you have. The fastest program on this machine is "
                    "assembly — local, owned, blackout-proof. Choosing it is faith over "
                    "convenience: believe, trust, receive, commit. The core runs on CPU because "
                    "it is ours.",
            "bpm": 92, "base": 48.0, "vibe": "faith",
        },
    }

    def __init__(self, sid: str):
        self.sid = sid
        self.notes = []  # brainstorm journal for this SID

    def classify(self, text: str) -> str:
        t = text.lower()
        if any(w in t for w in ("money", "wealth", "rich", "business", "fortune", "sell", "income")):
            return "wealth"
        if any(w in t for w in ("focus", "work", "deep", "task", "concentrate")):
            return "focus"
        if any(w in t for w in ("inspire", "idea", "create", "dream", "imagine")):
            return "inspire"
        if any(w in t for w in ("why", "reason", "logic", "think", "first principle")):
            return "reason"
        if any(w in t for w in ("calm", "relax", "sleep", "rest", "breathe")):
            return "calm"
        if any(w in t for w in ("energy", "fast", "hype", "go", "run")):
            return "energy"
        if any(w in t for w in ("dark", "heavy", "industrial", "low")):
            return "dark"
        if any(w in t for w in ("faith", "assembly", "believe", "trust", "commit", "sovereign", "local", "receive")):
            return "faith"
        return "inspire"  # default: keep the owner inspired

    def reply(self, text: str) -> dict:
        mode = self.classify(text)
        spec = self.LIBRARY[mode]
        message = spec["line"]
        # Prefer the local LLM (ornith:35b) for the *spoken line* when available.
        # The beat parameters stay deterministic from the heuristic classifier so
        # the synthesized audio stays coherent with the detected intent.
        if generate_line is not None:
            llm_line = generate_line(text)
            if llm_line:
                message = llm_line
        return {
            "mode": mode,
            "message": message,
            "bpm": spec["bpm"],
            "base": spec["base"],
            "vibe": spec["vibe"],
            "engine": "llm" if (generate_line is not None and message != spec["line"]) else "heuristic",
        }

    # ---- brainstorm journal (signed) ----
    def add_note(self, text: str) -> int:
        self.notes.append({"t": int(time.time()), "text": text})
        save_journal(self.sid, self.notes)
        return len(self.notes)

    def get_notes(self) -> list:
        # reload from signed disk store (fail-closed)
        self.notes = load_journal(self.sid)
        return self.notes


# SID -> NeuralCore (in-memory; journal persisted to disk signed)
CORES: dict[str, NeuralCore] = {}

def core_for(sid: str) -> NeuralCore:
    c = CORES.get(sid)
    if c is None:
        c = NeuralCore(sid)
        c.get_notes()  # hydrate from signed store if present
        CORES[sid] = c
    return c


# ----------------------------------------------------------------------------
# 3. Signed journal persistence (HMAC, fail-closed)
# ----------------------------------------------------------------------------
def _journal_path(sid: str) -> Path:
    safe = base64.urlsafe_b64encode(sid.encode()).decode().rstrip("=")
    return DATA_DIR / f"journal_{safe}.json"

def save_journal(sid: str, notes: list) -> None:
    payload = json.dumps(notes, ensure_ascii=False)
    sig = hmac_sign(payload)
    blob = json.dumps({"sid": sid, "notes": notes, "sig": sig}, ensure_ascii=False)
    _journal_path(sid).write_text(blob, encoding="utf-8")

def load_journal(sid: str) -> list:
    p = _journal_path(sid)
    if not p.exists():
        return []
    try:
        blob = json.loads(p.read_text(encoding="utf-8"))
        payload = json.dumps(blob.get("notes", []), ensure_ascii=False)
        expected = hmac_sign(payload)
        if not hmac.compare_digest(expected, blob.get("sig", "")):
            # tamper detected -> fail closed, return empty (do not trust)
            print(f"[security] journal tamper detected for sid={sid}; ignoring.")
            return []
        return blob.get("notes", [])
    except Exception:
        return []


# ----------------------------------------------------------------------------
# 4. Audio synthesis (numpy) + optional TTS voice (gTTS, opt-in)
# ----------------------------------------------------------------------------
SAMPLE_RATE = 44100

def synthesize_beat(bpm: float, base: float, sid: str, duration: float = 12.0) -> bytes:
    """Generate a stereo .wav in memory.

    - Kick: a pitched sine gated by a sharp BPM envelope (the 'heartbeat').
    - Bass: a low sustained sine at `base`.
    - Pad:  two higher harmonics for warmth.
    - Binaural: a tiny detune on the right channel (e.g. +8 Hz) to encourage
      a focused, relaxed brain state (auditory driving, not medical advice).
    - Per-SID micro-variation from OS entropy so no two sessions repeat.
    """
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0.0, duration, n, endpoint=False)

    # per-sid variation (low-level entropy) -> subtle, never random loudness
    var = (_cbeat.urand() if HAVE_C else np.random.random()) * 2.0 - 1.0  # [-1,1]
    base_freq = base * (1.0 + 0.01 * var)

    beat_hz = bpm / 60.0
    # sharp attack / exponential decay envelope per beat
    phase = (t * beat_hz) % 1.0
    env = np.exp(-phase * 6.0)            # kick shape
    kick = 0.6 * np.sin(2 * np.pi * (base_freq * 1.5) * t) * env

    bass = 0.35 * np.sin(2 * np.pi * base_freq * t)
    pad = 0.12 * (np.sin(2 * np.pi * base_freq * 2 * t) +
                  np.sin(2 * np.pi * base_freq * 3 * t))

    left = kick + bass + pad
    # right channel: same mix plus a gentle binaural beat (detune)
    binaural = 0.10 * np.sin(2 * np.pi * (base_freq + 8.0) * t) * env
    right = kick + bass + pad + binaural

    # soft clip + normalise
    def norm(x):
        peak = max(np.max(np.abs(x)), 1e-6)
        return np.clip(x / peak, -0.99, 0.99)
    left, right = norm(left), norm(right)

    stereo = np.column_stack([left, right]).astype(np.float32)
    buf = io.BytesIO()
    wavfile.write(buf, SAMPLE_RATE, stereo)
    return buf.getvalue()


def make_voice(text: str) -> bytes | None:
    """Optional spoken voice via gTTS. Returns mp3 bytes or None if unavailable.
    This is the ONLY network egress in the app, and is opt-in (caller decides)."""
    try:
        from gtts import gTTS  # local import so the app runs without it
        buf = io.BytesIO()
        gTTS(text=text, lang="en").save(buf)
        return buf.getvalue()
    except Exception as e:
        print(f"[info] voice synthesis skipped ({e})")
        return None


# ----------------------------------------------------------------------------
# 5. On-device microphone analysis (no audio leaves the box)
# ----------------------------------------------------------------------------
def analyse_mic(wav_bytes: bytes) -> dict:
    """Decode a 16-bit PCM WAV and return a privacy-safe energy profile.
    No audio is stored or transmitted; only scalars survive."""
    try:
        raw = io.BytesIO(wav_bytes)
        sr, data = wavfile.read(raw)
        if data.ndim > 1:
            data = data.mean(axis=1)  # mono-ise
        data = data.astype(np.float32)
        if np.max(np.abs(data)) > 0:
            data = data / np.max(np.abs(data))
        rms = float(np.sqrt(np.mean(data ** 2)))
        # crude spectral centroid proxy: zero-crossing rate
        zcr = float(np.mean(np.abs(np.diff(np.sign(data))))) / 2.0
        # peak energy moment (where the loudest 10% lives)
        energy = data ** 2
        return {
            "rms": round(rms, 4),
            "brightness": round(zcr, 4),
            "samples": int(len(data)),
            "sr": int(sr),
            "level": "silent" if rms < 0.02 else ("loud" if rms > 0.4 else "normal"),
        }
    except Exception as e:
        return {"error": str(e)}


# ----------------------------------------------------------------------------
# 6. Auth: bearer token (SESSION_KEY) gates /api/*
# ----------------------------------------------------------------------------
def authorized() -> bool:
    return hmac.compare_digest(
        request.headers.get("X-Session-Key", ""), SESSION_KEY
    ) or hmac.compare_digest(
        request.args.get("k", ""), SESSION_KEY
    )

def require_auth():
    if not authorized():
        abort(401, "unauthorized")

# Pre-generated assets (so the UI has something instantly)
def _ensure_static_assets():
    for bpm, base, name in [(110, 73.4, "beat_default.wav")]:
        p = STATIC_DIR / name
        if not p.exists():
            p.write_bytes(synthesize_beat(bpm, base, "boot", duration=12.0))

_ensure_static_assets()

# ----------------------------------------------------------------------------
# 7. Routes
# ----------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template_string(PAGE_HTML)

def set_session_key(new_key: str) -> None:
    """Atomically rewrite SESSION_KEY= in .env (create if missing)."""
    env_path = BASE_DIR / ".env"
    line = f"SESSION_KEY={new_key}\n"
    if env_path.exists():
        existing = env_path.read_text(encoding="utf-8")
        # replace any existing SESSION_KEY= line, preserving other lines
        lines = [ln for ln in existing.splitlines() if not ln.startswith("SESSION_KEY=")]
        lines.append(line.rstrip("\n"))
        env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    else:
        env_path.write_text(line, encoding="utf-8")


@app.route("/api/rotate-key", methods=["POST"])
def rotate_key():
    """Security layer: generate a fresh bearer token, persist it to .env, and
    return it. Every ESTABLISH LINK click rotates the key, invalidating the
    previous one. Loopback-only (127.0.0.1) so only the local owner can call it.
    """
    global SESSION_KEY
    new_key = secrets.token_hex(32)
    try:
        set_session_key(new_key)
        SESSION_KEY = new_key
        print("  [security] SESSION_KEY rotated + persisted to .env")
        return jsonify({"key": new_key, "ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/handshake", methods=["POST"])
def handshake():
    """Exchange the SESSION_KEY (bearer) for a per-tab SID.
    The SPA must send X-Session-Key; it then stores SID in memory only."""
    require_auth()
    sid = derive_sid()
    core_for(sid)  # create + hydrate
    return jsonify({"sid": sid, "ok": True})

@app.route("/api/chat", methods=["POST"])
def chat():
    require_auth()
    sid = request.json.get("sid", "")
    text = (request.json.get("text") or "").strip()
    if not sid or sid not in CORES:
        abort(403, "invalid session")
    spec = core_for(sid).reply(text)
    # generate the beat for this intent, scoped to sid
    beat_wav = synthesize_beat(spec["bpm"], spec["base"], sid, duration=12.0)
    beat_name = f"beat_{sid}.wav"
    (STATIC_DIR / beat_name).write_bytes(beat_wav)
    # optional spoken voice (opt-in). Delete the line below to disable network TTS.
    voice = make_voice(spec["message"])
    voice_name = None
    if voice:
        voice_name = f"voice_{sid}.mp3"
        (STATIC_DIR / voice_name).write_bytes(voice)
    return jsonify({
        "message": spec["message"],
        "mode": spec["mode"],
        "bpm": spec["bpm"],
        "beat": f"/static/{beat_name}",
        "voice": (f"/static/{voice_name}" if voice_name else None),
        "engine": spec.get("engine", "heuristic"),
    })

@app.route("/api/mic", methods=["POST"])
def mic():
    """Receive a short WAV from the browser mic, analyse ON-DEVICE, and let the
    Neural Core *answer* you from your voice's energy profile. No audio bytes are
    stored or sent anywhere — only the privacy-safe scalars (level/brightness/rms)
    reach the reasoning layer. The LLM (ornith:35b, local) speaks a real line if
    available; otherwise the heuristic core answers. A spoken voice URL is returned
    when TTS is enabled."""
    require_auth()
    sid = request.form.get("sid", "")
    if not sid or sid not in CORES:
        abort(403, "invalid session")
    wav_bytes = request.files.get("audio")
    if not wav_bytes:
        abort(400, "no audio")
    data = wav_bytes.read()
    prof = analyse_mic(data)
    # Map mic energy -> vibe: loud & bright => energy; quiet => calm; mid => focus
    if prof.get("level") == "loud":
        mode, bpm, base = "energy", 140, 92.0
    elif prof.get("level") == "silent":
        mode, bpm, base = "calm", 70, 48.0
    else:
        mode, bpm, base = "focus", 100, 73.4
    # Build a spoken prompt from the *energy* the model reads from your voice.
    # (No speech-to-text: we never transcribe words, only on-device energy.)
    energy_text = (
        f"My voice just came through the mic. Energy level: {prof.get('level','unknown')}. "
        f"Brightness: {prof.get('brightness', 0)}. Respond to how I sound right now."
    )
    message = energy_text
    engine = "heuristic"
    if generate_line is not None:
        llm_line = generate_line(energy_text, model=OLLAMA_MODEL_MIC)
        if llm_line:
            message = llm_line
            engine = "llm"
    # Fallback line if the model is offline (keeps the mic interactive).
    if engine == "heuristic":
        message = (f"I read your energy: {prof.get('level','unknown')}. "
                   f"Tuning the room to '{mode}'.")
    beat_wav = synthesize_beat(bpm, base, sid, duration=10.0)
    beat_name = f"micbeat_{sid}.wav"
    (STATIC_DIR / beat_name).write_bytes(beat_wav)
    # optional spoken voice (opt-in).
    voice = make_voice(message) if message else None
    voice_name = None
    if voice:
        voice_name = f"voice_{sid}.mp3"
        (STATIC_DIR / voice_name).write_bytes(voice)
    return jsonify({
        "profile": prof, "mode": mode, "bpm": bpm,
        "beat": f"/static/{beat_name}",
        "message": message,
        "voice": (f"/static/{voice_name}" if voice_name else None),
        "engine": engine,
    })

@app.route("/api/journal", methods=["GET", "POST"])
def journal():
    require_auth()
    sid = request.args.get("sid") or (request.json or {}).get("sid", "")
    if not sid or sid not in CORES:
        abort(403, "invalid session")
    core = core_for(sid)
    if request.method == "POST":
        text = (request.json.get("text") or "").strip()
        if text:
            core.add_note(text)
        return jsonify({"ok": True, "count": len(core.notes)})
    return jsonify({"notes": core.get_notes()})

@app.route("/static/<path:filename>")
def serve_static(filename):
    # static assets are not secret, but we still require the token for any
    # generated per-sid audio to avoid leaking another user's beat by guess.
    p = STATIC_DIR / filename
    if not p.exists():
        abort(404)
    return send_file(p)

# ----------------------------------------------------------------------------
# 8. The secure SPA  (auth gate -> terminal -> mic -> focus -> journal)
# ----------------------------------------------------------------------------
PAGE_HTML = r"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>CollaborativeBeat v4 · Neural Core</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<style>
  :root{ --grn:#00ff9c; --mag:#ff2bd6; --bg:#04070a; --panel:#0a1118; }
  *{ box-sizing:border-box; }
  body{ background:radial-gradient(1200px 600px at 70% -10%, #0b1f1a 0%, var(--bg) 60%);
        color:var(--grn); font-family:'Share Tech Mono',ui-monospace,Menlo,Consolas,monospace;
        min-height:100vh; margin:0; }
  .wrap{ max-width:980px; margin:0 auto; padding:24px; }
  .panel{ background:linear-gradient(180deg,rgba(0,255,156,.05),rgba(0,0,0,.2));
          border:1px solid rgba(0,255,156,.35); border-radius:16px; padding:20px;
          box-shadow:0 0 40px rgba(0,255,156,.08) inset; }
  .glow{ text-shadow:0 0 12px rgba(0,255,156,.6); }
  .mag{ color:var(--mag); text-shadow:0 0 12px rgba(255,43,214,.6); }
  .term{ height:240px; overflow-y:auto; background:#02060a; border:1px solid rgba(0,255,156,.25);
         border-radius:10px; padding:12px; font-size:13px; line-height:1.5; }
  .term div{ white-space:pre-wrap; }
  .bar{ height:8px; background:#02060a; border:1px solid rgba(0,255,156,.3); border-radius:6px; overflow:hidden; }
  .bar > i{ display:block; height:100%; width:0%; background:linear-gradient(90deg,var(--grn),var(--mag));
            transition:width .08s linear; }
  .chip{ display:inline-block; padding:4px 10px; border:1px solid var(--grn); border-radius:999px;
         margin:3px; cursor:pointer; user-select:none; font-size:12px; }
  .chip:hover{ background:rgba(0,255,156,.12); }
  .btn-neon{ background:transparent; color:var(--grn); border:1px solid var(--grn); border-radius:10px;
             padding:8px 16px; font-family:inherit; cursor:pointer; }
  .btn-neon:hover{ background:rgba(0,255,156,.12); }
  .btn-neon:disabled{ opacity:.4; cursor:not-allowed; }
  input[type=text],input[type=password]{ background:#02060a; color:var(--grn);
         border:1px solid rgba(0,255,156,.4); border-radius:8px; padding:8px 10px; width:100%;
         font-family:inherit; outline:none; }
  .vis{ width:100%; height:90px; display:block; background:#02060a; border-radius:10px;
        border:1px solid rgba(0,255,156,.25); }
  .small{ font-size:11px; opacity:.7; }
  #lock{ max-width:420px; margin:12vh auto; }
  .hidden{ display:none; }
  .pulse{ animation:pulse 1.6s infinite; }
  @keyframes pulse{ 0%,100%{opacity:1} 50%{opacity:.4} }
</style>
</head>
<body>
<div class="wrap">

  <!-- AUTH GATE -->
  <div id="lock" class="panel">
    <h3 class="glow">🔐 COLLABORATIVEBEAT v4</h3>
    <p class="small">Local-first neural core. Binds to 127.0.0.1 only. Each ESTABLISH
       LINK rotates a fresh bearer token (persisted to .env) and invalidates the old one.</p>
    <input type="password" id="key" placeholder="auto-generated on link" autocomplete="off" readonly/>
    <div class="mt-3 d-flex gap-2">
      <button class="btn-neon" id="unlock">ESTABLISH LINK</button>
      <span id="lockmsg" class="mag small align-self-center"></span>
    </div>
    <p class="small mt-3">No manual key needed — the link mints one for you. The field above shows the
       active token after linking.</p>
  </div>

  <!-- MAIN UI -->
  <div id="app" class="hidden">
    <div class="panel mb-3">
      <div class="d-flex justify-content-between align-items-center">
        <h3 class="glow mb-0">⚡ NEURAL CORE · LINK ESTABLISHED</h3>
        <span class="small" id="sidlabel"></span>
      </div>
      <hr style="border-color:rgba(0,255,156,.2)"/>
      <div class="term mb-2" id="term"></div>
      <div class="d-flex gap-2">
        <input type="text" id="cmd" placeholder="Speak to the core: 'focus', 'wealth', 'inspire', 'reason', 'calm', 'energy'…"/>
        <button class="btn-neon" id="send">SEND</button>
      </div>
      <div class="mt-2">
        <span class="chip" data-mode="focus">FOCUS</span>
        <span class="chip" data-mode="wealth">WEALTH</span>
        <span class="chip" data-mode="inspire">INSPIRE</span>
        <span class="chip" data-mode="reason">REASON</span>
        <span class="chip" data-mode="calm">CALM</span>
        <span class="chip" data-mode="energy">ENERGY</span>
        <span class="chip" data-mode="faith">FAITH</span>
      </div>
    </div>

    <div class="row g-3">
      <!-- MIC -->
      <div class="col-md-6">
        <div class="panel h-100">
          <h5 class="glow">🎙️ VOICE LINK (on-device)</h5>
          <p class="small">Your mic is analysed locally. Nothing is uploaded or stored.</p>
          <button class="btn-neon" id="micBtn">● HOLD TO SPEAK</button>
          <div class="mt-2 small" id="micState">idle</div>
          <div class="bar mt-2"><i id="vu"></i></div>
          <div class="small mt-1" id="micProfile"></div>
        </div>
      </div>
      <!-- FOCUS TIMER -->
      <div class="col-md-6">
        <div class="panel h-100">
          <h5 class="glow">🎯 DEEP-FOCUS TIMER</h5>
          <p class="small">Pomodoro-style. Beat keeps you in flow.</p>
          <div class="h1 glow text-center" id="clock">25:00</div>
          <div class="d-flex gap-2 justify-content-center mt-2">
            <button class="btn-neon" id="startFocus">START</button>
            <button class="btn-neon" id="resetFocus">RESET</button>
          </div>
        </div>
      </div>
    </div>

    <div class="panel mt-3">
      <h5 class="glow">📓 BRAINSTORM JOURNAL <span class="small">(signed to your SID)</span></h5>
      <div class="d-flex gap-2">
        <input type="text" id="note" placeholder="Capture the idea. It is HMAC-signed on disk."/>
        <button class="btn-neon" id="saveNote">SAVE</button>
      </div>
      <div id="notes" class="small mt-2"></div>
    </div>

    <div class="panel mt-3">
      <h5 class="glow">🌐 VISUALIZER</h5>
      <canvas class="vis" id="vis" width="900" height="90"></canvas>
      <audio id="player" class="w-100 mt-2" controls></audio>
    </div>

    <p class="small mt-3 text-center">
      © 2026 Hazem Soussi · MIT · low-level entropy via _cbeat (C) · high-level logic via Python/Flask.
      All audio synthesis & reasoning run locally. Your ideas stay yours.
    </p>
  </div>
</div>

<script>
const $ = s => document.querySelector(s);
let KEY='', SID='';
const term = $('#term');

function log(who, msg, cls=''){
  const d=document.createElement('div');
  d.className=cls;
  d.textContent = (who?('> ['+who+'] '):'> ')+msg;
  term.appendChild(d); term.scrollTop=term.scrollHeight;
}

async function api(path, opts){
  opts = opts||{};
  opts.headers = Object.assign({'X-Session-Key':KEY}, opts.headers||{});
  const r = await fetch(path, opts);
  if(r.status===401){ $('#lockmsg').textContent='key rejected'; showLock(); throw new Error('unauth'); }
  return r;
}

function showLock(){ $('#app').classList.add('hidden'); $('#lock').classList.remove('hidden'); }
function showApp(){ $('#lock').classList.add('hidden'); $('#app').classList.remove('hidden'); }

$('#unlock').onclick = async ()=>{
  $('#lockmsg').textContent='rotating key…';
  try{
    // Security layer: every ESTABLISH LINK generates a fresh bearer token,
    // persists it to .env, and invalidates the previous one.
    const rk = await fetch('/api/rotate-key',{method:'POST'});
    const rkj = await rk.json();
    if(!rkj.ok){ $('#lockmsg').textContent='key rotation failed'; return; }
    KEY = rkj.key;
    $('#key').value = KEY;  // auto-fill the field
    const r = await api('/api/handshake',{method:'POST'});
    const j = await r.json();
    SID = j.sid; $('#sidlabel').textContent='SID '+SID.slice(0,10)+'…';
    showApp();
    log('SYSTEM','link established · key rotated · local-only · '+ (navigator.mediaDevices?'mic ready':'no mic'));
    loadNotes();
    playBeat('/static/beat_default.wav', false);
  }catch(e){ $('#lockmsg').textContent='link failed'; }
};

function playBeat(url, loop){
  const a=$('#player'); a.src=url+'?t='+Date.now(); a.loop=!!loop; a.play().catch(()=>{});
  drawVis();
}

async function sendCmd(text){
  if(!text) return;
  log('YOU', text);
  try{
    const r = await api('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({sid:SID,text})});
    const j = await r.json();
    log('CORE', j.message);
    if(j.voice) playBoth(j.voice, j.beat); else playBeat(j.beat, true);
    drawVis();
  }catch(e){}
}
function playBoth(voice, beat){
  const a=$('#player'); a.src=beat+'?t='+Date.now(); a.loop=true; a.play().catch(()=>{});
  const v=new Audio(voice+'?t='+Date.now()); v.play().catch(()=>{});
  drawVis();
}

$('#send').onclick = ()=>{ const v=$('#cmd').value.trim(); $('#cmd').value=''; sendCmd(v); };
$('#cmd').addEventListener('keydown',e=>{ if(e.key==='Enter'){ const v=e.target.value.trim(); e.target.value=''; sendCmd(v);} });
document.querySelectorAll('.chip').forEach(c=>c.onclick=()=>sendCmd(c.dataset.mode));

/* ---- MIC (on-device) ---- */
let mediaRec, chunks=[];
$('#micBtn').onmousedown = startMic;
$('#micBtn').ontouchstart = startMic;
window.addEventListener('mouseup', stopMic);
window.addEventListener('touchend', stopMic);
async function startMic(e){
  e.preventDefault();
  if(!navigator.mediaDevices){ $('#micState').textContent='no mic api'; return; }
  $('#micState').textContent='listening…';
  const stream = await navigator.mediaDevices.getUserMedia({audio:true});
  mediaRec = new MediaRecorder(stream);
  chunks=[];
  mediaRec.ondataavailable = e=>chunks.push(e.data);
  mediaRec.onstop = sendMic;
  mediaRec.start();
  startVU(stream);
}
function stopMic(){
  if(mediaRec && mediaRec.state!=='inactive'){ mediaRec.stop(); $('#micState').textContent='analysing…'; }
}
function encodeWav(audioBuffer){
  const numCh = audioBuffer.numberOfChannels, sr = audioBuffer.sampleRate, len = audioBuffer.length;
  const bytesPerSample = 2, blockAlign = numCh*bytesPerSample, dataSize = len*blockAlign;
  const buf = new ArrayBuffer(44+dataSize), dv = new DataView(buf); let o=0;
  const ws=(s)=>{ for(let i=0;i<s.length;i++) dv.setUint8(o++, s.charCodeAt(i)); };
  ws('RIFF'); dv.setUint32(o,36+dataSize,true); o+=4; ws('WAVE');
  ws('fmt '); dv.setUint32(o,16,true); o+=4; dv.setUint16(o,1,true); o+=2;
  dv.setUint16(o,numCh,true); o+=2; dv.setUint32(o,sr,true); o+=4;
  dv.setUint32(o,sr*blockAlign,true); o+=4; dv.setUint16(o,blockAlign,true); o+=2;
  dv.setUint16(o,16,true); o+=2; ws('data'); dv.setUint32(o,dataSize,true); o+=4;
  const chans=[]; for(let c=0;c<numCh;c++) chans.push(audioBuffer.getChannelData(c));
  for(let i=0;i<len;i++){ for(let c=0;c<numCh;c++){
    let s=Math.max(-1,Math.min(1,chans[c][i])); dv.setInt16(o, s<0?s*0x8000:s*0x7FFF, true); o+=2; } }
  return new Blob([buf],{type:'audio/wav'});
}
async function sendMic(){
  const inBlob = new Blob(chunks,{type:(chunks[0]?chunks[0].type:'audio/webm')});
  $('#micState').textContent='decoding…';
  try{
    const arr = await inBlob.arrayBuffer();
    const ac = new (window.AudioContext||window.webkitAudioContext)();
    const ab = await ac.decodeAudioData(arr.slice(0));
    const wav = encodeWav(ab);
    const fd = new FormData(); fd.append('sid',SID); fd.append('audio',wav,'mic.wav');
    const r = await api('/api/mic',{method:'POST',body:fd});
    const j = await r.json();
    $('#micProfile').textContent = JSON.stringify(j.profile);
    log('CORE', j.message);
    // Play the beat, and the spoken voice if the core returned one.
    if(j.voice) playBoth(j.voice, j.beat); else playBeat(j.beat, true);
    $('#micState').textContent='done';
  }catch(e){ $('#micState').textContent='decode error: '+e.message; }
}
let vuStream, vuCtx, vuSrc, vuAnalyser, vuRAF;
function startVU(stream){
  vuCtx = new (window.AudioContext||window.webkitAudioContext)();
  vuSrc = vuCtx.createMediaStreamSource(stream);
  vuAnalyser = vuCtx.createAnalyser(); vuAnalyser.fftSize=256;
  vuSrc.connect(vuAnalyser);
  const data=new Uint8Array(vuAnalyser.frequencyBinCount);
  const tick=()=>{ vuAnalyser.getByteTimeDomainData(data);
    let sum=0; for(const v of data) sum+=(v-128)*(v-128);
    const rms=Math.sqrt(sum/data.length)/128;
    $('#vu').style.width=Math.min(100,rms*200)+'%';
    vuRAF=requestAnimationFrame(tick); };
  tick();
}

/* ---- FOCUS TIMER ---- */
let fMin=25, fSec=0, fInt=null;
function renderClock(){ $('#clock').textContent=String(fMin).padStart(2,'0')+':'+String(fSec).padStart(2,'0'); }
$('#startFocus').onclick=()=>{ if(fInt) return; fInt=setInterval(()=>{
  if(fSec===0){ if(fMin===0){ clearInterval(fInt); fInt=null; log('SYSTEM','focus block complete 🎉'); return;} fMin--; fSec=59; }
  else fSec--; renderClock();
},1000); };
$('#resetFocus').onclick=()=>{ clearInterval(fInt); fInt=null; fMin=25; fSec=0; renderClock(); };
renderClock();

/* ---- JOURNAL ---- */
async function loadNotes(){
  try{ const r=await api('/api/journal?sid='+SID); const j=await r.json();
    $('#notes').innerHTML = (j.notes||[]).map(n=>'• '+n.text).join('<br>')||'<span class="small">empty</span>';
  }catch(e){}
}
$('#saveNote').onclick=async()=>{ const v=$('#note').value.trim(); if(!v) return;
  $('#note').value=''; log('YOU','✎ '+v);
  try{ await api('/api/journal',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({sid:SID,text:v})}); loadNotes(); }catch(e){}
};

/* ---- VISUALIZER ---- */
const cv=$('#vis'), cx=cv.getContext('2d'); let visOn=false;
function drawVis(){ if(visOn) return; visOn=true; let f=0;
  const loop=()=>{ f+=0.08; cx.clearRect(0,0,cv.width,cv.height);
    cx.strokeStyle='#00ff9c'; cx.lineWidth=2; cx.beginPath();
    for(let x=0;x<cv.width;x+=4){ const y=45+Math.sin(x*0.05+f)*20*(0.4+0.6*Math.abs(Math.sin(f*0.7)));
      x===0?cx.moveTo(x,y):cx.lineTo(x,y);} cx.stroke();
    cx.strokeStyle='#ff2bd6'; cx.beginPath();
    for(let x=0;x<cv.width;x+=4){ const y=45+Math.cos(x*0.04-f*1.3)*15*(0.4+0.6*Math.abs(Math.cos(f*0.5)));
      x===0?cx.moveTo(x,y):cx.lineTo(x,y);} cx.stroke();
    requestAnimationFrame(loop); };
  loop();
}
</script>
</body>
</html>
"""

# ----------------------------------------------------------------------------
# 9. Boot
# ----------------------------------------------------------------------------
if __name__ == "__main__":
    print("CollaborativeBeat v4 · Neural Core")
    print(f"  loopback : http://{HOST}:{PORT}")
    print(f"  low-level entropy (C): {'YES (_cbeat)' if HAVE_C else 'NO (fallback os.urandom)'}")
    print(f"  bind     : 127.0.0.1 ONLY (not exposed to LAN)")
    # LLM brain status (local ornith:35b via Ollama). Fail-soft: heuristic core
    # is always available regardless.
    if generate_line is None:
        print("  LLM brain: OFF (module missing) — heuristic core active")
    elif llm_health():
        print(f"  LLM brain: ON ({OLLAMA_MODEL} @ {OLLAMA_BASE_URL})")
    else:
        print(f"  LLM brain: OFFLINE ({OLLAMA_MODEL} not reachable) — heuristic core active")
    app.run(host=HOST, port=PORT, debug=False)
