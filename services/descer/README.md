# DESCER Drum Machine

Web Audio drum machine for the HAZOOM OS ecosystem — all sounds synthesized in-browser, zero samples shipped.

- **Port:** 6000 (bound to 127.0.0.1)
- **Run:** `python3 server.py`
- **UI:** `http://127.0.0.1:6000/`
- **API:** `GET /api/sounds` → `{ pads[] }` · `GET /api/health`

8 synthesized pads, 16-step sequencer, BPM control, randomize.