# Copyright © 2026 Hazem Soussi <hazem.soussi@gmail.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Planet Earth News — at-rest integrity for the on-disk feed cache.

The in-memory fetcher cache (fetcher.py) is fast but volatile. This module
adds an *optional* on-disk mirror of the last fetch so the UI can render
instantly after a restart and stay useful offline. Every cache file is
HMAC-signed (hazoom-style canonical form) so a tampered or partially-written
file is rejected fail-closed — no silent loading of poisoned news.

Key model: a single local signing key, derived from the API token's HMAC key
material so it stays consistent across restarts without extra config. If no
key is configured, caching is disabled (we never store unsigned data we can't
verify). Files live under cache/ (git-ignored).
"""
from __future__ import annotations

import hashlib
import hmac
import json
import time
from pathlib import Path

import auth

CACHE_DIR = Path(__file__).resolve().parent / "cache"
_TTL = 600  # seconds; entries older than this are treated as stale (re-fetched)


def _key() -> bytes | None:
    tok = auth.get_token()
    if not tok:
        return None
    # Derive a stable signing key from the API token (never store the token).
    return hmac.new(b"pen-cache-v1", tok.encode("utf-8"), hashlib.sha256).digest()


def _path(key: str) -> Path:
    # key is already a safe slug (e.g. "" for default or a query hash)
    safe = "".join(c for c in key if c.isalnum() or c in "-_") or "default"
    return CACHE_DIR / f"feed-{safe}.json"


def _sign(payload: bytes, key: bytes) -> str:
    return hmac.new(key, payload, hashlib.sha256).hexdigest()


def save(items: list[dict], key: str = "") -> bool:
    """Persist items (list of dicts) with an HMAC. Returns True on success.
    Disabled (returns False) when no signing key is available."""
    k = _key()
    if not k:
        return False
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    envelope = {
        "v": 1,
        "saved_at": int(time.time()),
        "items": items,
    }
    payload = json.dumps(envelope, ensure_ascii=False, sort_keys=True).encode("utf-8")
    sig = _sign(payload, k)
    # Write atomically: temp file then rename, so a crash can't leave a partial
    # (and thus unverifiable) file behind.
    tmp = _path(key).with_suffix(".tmp")
    tmp.write_bytes(payload + b"\n" + sig.encode("ascii"))
    tmp.replace(_path(key))
    return True


def load(key: str = "") -> list[dict] | None:
    """Load + verify cached items. Returns the item list, or None if missing,
    stale, or the signature does not verify (fail-closed)."""
    k = _key()
    if not k:
        return None
    p = _path(key)
    if not p.exists():
        return None
    raw = p.read_bytes()
    if b"\n" not in raw:
        return None
    payload, sig = raw.rsplit(b"\n", 1)
    if not hmac.compare_digest(_sign(payload, k), sig.decode("ascii")):
        # Tampered or wrong key — refuse to load.
        return None
    try:
        env = json.loads(payload.decode("utf-8"))
    except Exception:
        return None
    if int(time.time()) - int(env.get("saved_at", 0)) > _TTL:
        return None
    return env.get("items", [])
