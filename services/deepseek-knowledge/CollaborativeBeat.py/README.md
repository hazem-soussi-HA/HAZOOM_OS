# CollaborativeBeat v4 — Neural Core Interface

Copyright (c) 2026 Hazem Soussi <hazem.soussi@gmail.com>
Licensed under MIT. All original contributions (c) Hazem Soussi.

A secure, local-first voice + beat companion. You talk to your CPU/GPU through
the microphone; the interface is built to keep you focused, inspired, and
reasoning toward fortune. Everything runs on your machine.

## Vision
- Real microphone voice-link (analysed on-device, nothing uploaded).
- A reasoning core that maps intent (focus / wealth / inspire / reason / calm /
  energy) to a spoken line + a synthesized beat.
- Strictly local: binds to 127.0.0.1 only. A bearer token gates every API.
- The brainstorm journal is HMAC-signed on disk (tamper-evident, fail-closed).
- Built with BOTH high-level (Python/Flask/numpy) AND low-level (C entropy
  extension, `_cbeat.so`) code.

## Stack
- Python 3.12 (in `~/.main_env`), Flask, numpy, scipy.
- `cryptography` for the signed journal HMAC.
- C extension `entropy.c` -> `_cbeat.so` (OS cryptographic RNG via getrandom).
- `gTTS` for the optional spoken voice (opt-in; disable with CB_VOICE=0).
- **Local LLM brain** (`llm_core.py`): when present, `ornith:35b` (served by a
  local Ollama daemon at `127.0.0.1:11434`, OpenAI-compatible) generates the
  core's *spoken line*. Runs CPU-only ("assembly mode", `num_gpu 0` in
  `Modelfile.ornith-optimized`) so it survives blackouts / no-GPU. The beat
  parameters stay deterministic from the heuristic classifier. **Fail-soft:**
  if the model is offline, chat silently falls back to the heuristic core.

## LLM brain setup (optional, strictly local)
    # one-time, needs internet:
    ollama serve
    ollama create ornith:35b -f ~/.hermes/Modelfile.ornith-optimized   # from local GGUF
    # or: ollama pull <your-35b-model>   # then set OLLAMA_MODEL to match
    # boot the core:
    python3 collaborative_beat_v4.py
The server logs `LLM brain: ON (ornith:35b @ http://localhost:11434/v1)` when
the model is reachable, or `OFFLINE` (heuristic fallback) otherwise. Tune via
`.env`: `CB_LLM` (0 = force heuristic), `OLLAMA_BASE_URL`, `OLLAMA_MODEL`.

## Run
    cd CollaborativeBeat.py
    python3 -m venv .venv && source .venv/bin/activate   # if not using ~/.main_env
    pip install flask numpy scipy python-dotenv cryptography gtts
    pip install setuptools    # for building the C extension
    python3 build_ext.py      # compiles entropy.c -> _cbeat.so
    cp .env.example .env      # SESSION_KEY auto-generated if missing (the agent token)
    python3 collaborative_beat_v4.py

Open http://127.0.0.1:5000 — enter your SESSION_KEY to establish the link.

## Security notes
- Server binds 127.0.0.1 only. It is NOT reachable from your LAN.
- Opening it via a public tunnel (ngrok/cloudflared) is at your own risk and is
  NOT recommended; if you must, put it behind your own auth proxy.
- Microphone audio never leaves the browser un-decoded; only an energy profile
  (rms / brightness / level) reaches the server, and nothing is stored.
- The brainstorm journal is HMAC-SHA256 signed with SESSION_KEY; edits are
  detected and ignored.

## File map
- entropy.c / build_ext.py / _cbeat.so : low-level OS entropy (C).
- collaborative_beat_v4.py        : server, auth, reasoning, synthesis, SPA.
- llm_core.py                     : local LLM brain (ornith:35b via Ollama), fail-soft.
- PRINCIPLES.md                   : Assembly = FAITH · BELIEVE · TRUST · RECEIVING ++ COMMITMENT.
- static/                         : generated beat/voice assets (git-ignored).
- data/                           : signed journal files (git-ignored).
