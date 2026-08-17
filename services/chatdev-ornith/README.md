# Ornith — Offline Chatbox

Fully offline rule-based chat companion for the HAZOOM OS ecosystem.

- **Port:** 5055 (bound to 127.0.0.1)
- **Run:** `python3 ornith_server.py`
- **UI:** `http://127.0.0.1:5055/`
- **API:**
  - `POST /api/chat` `{ message }` → `{ reply, offline: true }`
  - `GET /api/knowledge` → list of topics it can answer
  - `GET /api/health` → `{ status }`

Intent patterns live in `ornith_server.py`; knowledge entries in `data/knowledge.json`.