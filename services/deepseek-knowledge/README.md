# DeepSeek Knowledge

Offline knowledge base for the HAZOOM OS ecosystem — no API key, no network.

- **Port:** 8200 (bound to 127.0.0.1)
- **Run:** `python3 serve.py`
- **UI:** `http://127.0.0.1:8200/`
- **API:**
  - `GET /api/knowledge?q=…` → ranked search over entries
  - `GET /api/knowledge` → all entries
  - `GET /api/health`

Entries live in `data/knowledge.json`.