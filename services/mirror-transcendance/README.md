# Mirror Transcendance

Local-only self-reflection journal for the HAZOOM OS ecosystem.

- **Port:** 8006 (bound to 127.0.0.1)
- **Run:** `python3 server.py`
- **UI:** `http://127.0.0.1:8006/`
- **API:**
  - `POST /api/reflections` `{ text, mood }` → saves to disk
  - `GET /api/reflections` → all reflections, newest first
  - `GET /api/health`

Reflections persist to `data/reflections.json`.