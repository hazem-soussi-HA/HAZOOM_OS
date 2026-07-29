# HAZOOM OS — ONE SCRIPT LAUNCH

One command assembles and launches the fullstack of Hazem Soussi's projects as a
single, local-first, loopback-only unit. Built for blackout / coupure resistance:
after the first bootstrap (while internet is up), every service runs with **zero
network egress**.

## Launch

```bash
cd /mnt/c/Users/HP/Desktop/planet_earth
./hazoom-os-launch.sh          # or: start | stop | restart | status
```

All services detach from the terminal (setsid) and are tracked by PID files in
`.hazoom-os/pids/`. Logs: `.hazoom-os/logs/`.

## Services (127.0.0.1 only)

| Service              | Port   | URL                                              |
|----------------------|--------|--------------------------------------------------|
| planet_earth (globe) | 8080   | http://127.0.0.1:8080/                          |
| planet_earth_news    | 8000   | https://127.0.0.1:8000/  (self-signed TLS)       |
| birds_encyclopedia   | 4100   | http://127.0.0.1:4100/  (atlas: /atlas/)        |
| hazoom_pod           | 4000   | http://127.0.0.1:4000/                          |
| hazoom_os            | 3000   | http://127.0.0.1:3000/  (desktop at root /)     |
| collaborative_beat   | 5000   | http://127.0.0.1:5000/                          |
| chatdev (Ornith)     | 5055   | http://127.0.0.1:5055/  (offline Ollama chatbox)|

## Notes / honesty

- **Offline-first**: each project is served from localhost. PEN refuses any
  non-loopback bind; planet_earth and the bird atlas make zero external calls.
- **Local LLM reality (measured, not assumed)**: `ollama` is installed and
  `ornith:35b` IS present — but on this CPU-only box it produces **0 tokens in
  120s**, so it is unusable as a live brain here. The OS's Intelligence Core
  (`core/intelligence-core.js`) therefore **auto-selects the fastest responsive
  local model** at boot (tinyllama/qwen/phi3) and fails soft if none answer.
  ChatDev/Ornith likewise defaults to `ornith:35b`; set
  `ORNITH_MODEL=tinyllama:1.1b` for it to actually answer on CPU.
- **Real reasoning, honest claims**: we do not claim ornith "thinks" unless a
  model is genuinely serving tokens. The symbolic consciousness/pascal engine
  remain the OS "body/state"; reasoning happens in the Intelligence Core.

## Climate / atmosphere / birds (the mission)

- The globe (`planet_earth`) and PEN give the real-Earth + real-news surface.
- Birds Encyclopedia + the "Birds of Africa" 3D atlas are the natural-voice layer
  (`the_new_age/src/audioBird.js`, `soundProfiles.js`). Natural bird audio is
  referenced but no .wav/.mp3 assets ship in the repo yet — that is the next
  integration step (bundle offline CC0 bird calls into `birds-encyclopedia/data/`).
- CollaborativeBeat is the local reasoning core (CPU-only, blackout-proof).

## Author

© 2026 Hazem Soussi (HA). alpha pony stars — everything is connected.
