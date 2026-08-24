# -*- coding: utf-8 -*-
"""
llm_core.py  --  Local-first LLM brain for CollaborativeBeat
Copyright (c) 2026 Hazem Soussi <hazem.soussi@gmail.com>
Licensed under MIT.

Injects the owner's local model (ornith:35b) as the *reasoning* layer behind
the Neural Core. The model is served by Ollama as an OpenAI-compatible endpoint
(http://localhost:11434/v1) and runs CPU-only ("assembly mode", num_gpu 0 in
Modelfile.ornith-optimized) so it keeps working during blackouts / without a GPU.

Design rules (do not weaken):
  - STRICTLY LOCAL. The only network egress is to 127.0.0.1:11434 (the local
    Ollama daemon). Nothing leaves the box.
  - FAIL-CLOSED / GRACEFUL. If the model is unreachable, unconfigured, or
    returns garbage, generate_line() returns None and the caller falls back to
    the built-in heuristic NeuralCore. No exception escapes to the user.
  - NO NEW HEAVY DEPENDENCIES. Uses only the Python stdlib (urllib) so the
    project stays installable offline.
"""

import os
import json
import urllib.request
import urllib.error

# ---- Config (env-overridable, with local-first defaults) -------------------
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1").rstrip("/")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "ornith:35b")
# Local Ollama usually needs no key; set OLLAMA_API_KEY only if you secured it.
OLLAMA_API_KEY = os.environ.get("OLLAMA_API_KEY", "")
# Master switch: set CB_LLM=0 to force the heuristic core (zero LLM egress).
LLM_ENABLED = os.environ.get("CB_LLM", "1") != "0"

# The Neural Core persona. The model supplies the *spoken line*; the beat
# parameters (bpm/base/vibe) stay deterministic from the heuristic classifier
# so the audio stays coherent with the detected intent.
SYSTEM_PROMPT = (
    "You are the Neural Core, a local-first reasoning companion that helps the "
    "owner stay focused, inspired, and reasoning toward fortune. You run entirely "
    "on the owner's machine. Given the owner's short message, reply with ONE "
    "concise, positive, constructive line (1-2 sentences, plain English) that "
    "matches the spirit of one of: focus, wealth, inspire, reason, calm, energy, "
    "or dark. Be specific and empowering, never generic. Return only the line, "
    "no引号, no preamble."
)


def generate_line(text: str, timeout: float = 180.0, model: str | None = None) -> str | None:
    """Call the local LLM and return its spoken line.

    `model` overrides OLLAMA_MODEL (e.g. a smaller/faster model for the mic
    path). Returns None on any failure (model down, bad JSON, timeout) so the
    caller can fall back to the heuristic core. Never raises.
    """
    model = model or OLLAMA_MODEL
    if not LLM_ENABLED:
        return None
    if not text or not text.strip():
        return None

    url = OLLAMA_BASE_URL + "/chat/completions"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
        "temperature": 0.7,
        "stream": False,
        # Keep the reply bounded: ornith:35b is a reasoning model and spends
        # most of its budget on the chain-of-thought. A small cap keeps the web
        # latency sane on CPU/low-VRAM hardware.
        "max_tokens": 400,
    }
    data = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if OLLAMA_API_KEY:
        headers["Authorization"] = "Bearer " + OLLAMA_API_KEY

    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        msg = body["choices"][0]["message"]
        # ornith:35b emits its answer into the `reasoning` channel (content is
        # often empty). Prefer content; fall back to the *conclusion* of the
        # reasoning trace (its last sentence), which is where it lands the line.
        line = (msg.get("content") or "").strip()
        if not line:
            reasoning = (msg.get("reasoning") or "").strip()
            if reasoning:
                # ornith:35b reasons then quotes its chosen final line in "..."
                # inside the trace. Pull the LAST double-quoted span — that is
                # the actual spoken conclusion, not the surrounding analysis.
                import re
                quotes = re.findall(r'"([^"]{8,300})"', reasoning)
                if quotes:
                    line = quotes[-1].strip()
                else:
                    # fallback: last sentence of the trace
                    parts = [p.strip() for p in reasoning.replace("\n", " ").split(".") if p.strip()]
                    line = parts[-1].strip() if parts else ""
        # Strip wrapping quotes the model sometimes adds.
        if len(line) >= 2 and line[0] in "\"'”" and line[-1] == line[0]:
            line = line[1:-1].strip()
        # Drop a leading bullet/number the conclusion may carry.
        line = line.lstrip("0123456789-*• ").strip()
        return line or None
    except Exception as e:  # noqa: BLE001 - intentional broad catch: fail soft
        print(f"[info] LLM brain unavailable ({type(e).__name__}: {e}); "
              f"falling back to heuristic core.")
        return None


def health() -> bool:
    """Lightweight liveness probe for the local Ollama daemon."""
    if not LLM_ENABLED:
        return False
    try:
        with urllib.request.urlopen(OLLAMA_BASE_URL + "/models", timeout=3) as r:
            return r.status == 200
    except Exception:
        return False
