# Ornith Chatbox (ornith_server.py)

A local, loopback-only web chatbox wired to `ornith:35b` via Ollama.
No internet egress — talks only to http://localhost:11434.

## Files
- `ornith_server.py`   : Flask app, SSE streaming proxy to Ollama.
- `templates/index.html`: the chat UI (streaming, dark theme).

## Prerequisites
- Ollama running with `ornith:35b` pulled:  `ollama pull ornith:35b`
- Python deps: `pip install flask requests`

## Run
Note: port 5000 is usually taken by another local project, so use 5055
(or any free port). The server binds to 127.0.0.1 only (not the network).

    cd /home/hazem/chatdev
    ORNITH_PORT=5055 ORNITH_KEEP_ALIVE=-1 python3 ornith_server.py

Then open:  http://127.0.0.1:5055

## Important: ornith:35b is a 35B model, CPU-only here
- Cold load (first call after idle) takes ~3-4 minutes and loads ~21 GB
  into RAM. Set `ORNITH_KEEP_ALIVE=-1` (recommended) so the model stays
  resident and every subsequent chat is fast (~0.6 s load, then generation).
- Without keep-alive, your `OLLAMA_KEEP_ALIVE=5m` unloads it and the NEXT
  chat re-pays the full multi-minute cold load.
- If you see HTTP 500 "llama-server process has terminated: signal: killed",
  it means the model was OOM-killed during load — free RAM and retry, or
  reduce context. Status shows in the page header ("ready" vs "loading…").

## Env overrides
- OLLAMA_HOST   (default http://localhost:11434; scheme is auto-prepended)
- ORNITH_MODEL  (default ornith:35b)
- ORNITH_PORT   (default 5000)
- ORNITH_KEEP_ALIVE (default 5m; use -1 to keep forever)
- ORNITH_TIMEOUT (per-request timeout seconds, default 180)
- ORNITH_SYSTEM (system prompt)

## Endpoints
- GET  /api/health  -> {status, model, ollama, loaded}
- POST /api/chat    -> SSE stream: data: {"token": "..."} ... data: {"done": true}
