# Planet Earth News

Local-only news feed for the HAZOOM OS ecosystem.

- **Port:** 8001 (bound to 127.0.0.1)
- **Run:** `python3 serve.py`
- **UI:** `http://127.0.0.1:8001/`
- **API:**
  - `GET /api/news` → `{ updated, count, articles[] }`
  - `GET /api/health` → `{ status }`

Seed stories live in `data/news.json`. The feed refreshes in the UI every 60s.