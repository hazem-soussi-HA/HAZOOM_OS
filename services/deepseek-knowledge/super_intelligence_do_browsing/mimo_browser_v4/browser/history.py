"""MiMo Browser v4 — Encrypted browsing history manager.

Stores history entries in a JSON file with optional Fernet-style
encryption.  Supports search, recent lookups, most-visited ranking,
and timeline grouping.
"""

from __future__ import annotations

import json
import logging
import os
import time
from collections import defaultdict
from dataclasses import dataclass, field, asdict, field as dc_field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lightweight XOR obfuscation (no external crypto dependency required).
# Swap in cryptography.fernet.Fernet for production use.
# ---------------------------------------------------------------------------

def _derive_key(password: str, salt: bytes = b"mimo-browser-v4") -> bytes:
    """Derive a repeatable key from *password* using SHA-256."""
    import hashlib
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)


def _xor_crypt(data: bytes, key: bytes) -> bytes:
    """Simple XOR cipher — NOT cryptographically secure, but keeps
    history unreadable without the key.  Replace with Fernet for
    real deployments."""
    key_len = len(key)
    return bytes(b ^ key[i % key_len] for i, b in enumerate(data))


def _encrypt(plaintext: str, password: str) -> str:
    import base64
    key = _derive_key(password)
    encrypted = _xor_crypt(plaintext.encode("utf-8"), key)
    return base64.b64encode(encrypted).decode("ascii")


def _decrypt(ciphertext: str, password: str) -> str:
    import base64
    key = _derive_key(password)
    raw = base64.b64decode(ciphertext)
    return _xor_crypt(raw, key).decode("utf-8")


# ---------------------------------------------------------------------------
# History manager
# ---------------------------------------------------------------------------

@dataclass
class HistoryEntry:
    url: str
    title: str
    timestamp: str  # ISO-8601
    visit_count: int = 1


class HistoryManager:
    """Persisted, encrypted browsing history.

    Usage:
        hm = HistoryManager("/path/to/history.json", password="secret")
        hm.add_entry("https://example.com", "Example")
        results = hm.search("example")
        recent = hm.get_recent(10)
    """

    def __init__(
        self,
        path: str | Path = "./history.json",
        password: str = "mimo-default-key",
        encrypted: bool = True,
    ) -> None:
        self._path = Path(path)
        self._password = password
        self._encrypted = encrypted
        self._entries: list[dict[str, Any]] = []
        self._load()

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def _load(self) -> None:
        if not self._path.exists():
            self._entries = []
            return
        try:
            raw = self._path.read_text(encoding="utf-8")
            if self._encrypted:
                raw = _decrypt(raw, self._password)
            self._entries = json.loads(raw)
        except Exception:
            logger.warning("Could not load history — starting fresh.")
            self._entries = []

    def _save(self) -> None:
        data = json.dumps(self._entries, indent=2)
        if self._encrypted:
            data = _encrypt(data, self._password)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(data, encoding="utf-8")

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------

    def add_entry(self, url: str, title: str = "") -> None:
        """Record a visit to *url*."""
        now = datetime.now(timezone.utc).isoformat()
        # Increment visit_count if the URL already exists
        for entry in self._entries:
            if entry["url"] == url:
                entry["visit_count"] = entry.get("visit_count", 1) + 1
                entry["timestamp"] = now
                if title:
                    entry["title"] = title
                self._save()
                return

        self._entries.append({
            "url": url,
            "title": title or url,
            "timestamp": now,
            "visit_count": 1,
        })
        self._save()
        logger.debug("History entry added: %s", url)

    def clear(self) -> None:
        """Remove all history entries."""
        self._entries.clear()
        self._save()
        logger.info("History cleared.")

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def search(self, query: str) -> list[dict[str, Any]]:
        """Return entries whose URL or title contains *query* (case-insensitive)."""
        q = query.lower()
        return [
            e for e in self._entries
            if q in e.get("url", "").lower() or q in e.get("title", "").lower()
        ]

    def get_recent(self, limit: int = 20) -> list[dict[str, Any]]:
        """Return the *limit* most recent entries (newest first)."""
        return list(reversed(self._entries[-limit:]))

    def get_most_visited(self, limit: int = 10) -> list[dict[str, Any]]:
        """Return the *limit* most frequently visited entries."""
        sorted_entries = sorted(
            self._entries, key=lambda e: e.get("visit_count", 1), reverse=True
        )
        return sorted_entries[:limit]

    def get_timeline(self) -> dict[str, list[dict[str, Any]]]:
        """Group entries by date (YYYY-MM-DD) into a dict."""
        timeline: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for entry in self._entries:
            ts = entry.get("timestamp", "")
            date_key = ts[:10] if len(ts) >= 10 else "unknown"
            timeline[date_key].append(entry)
        # Sort each day's entries chronologically
        for day in timeline:
            timeline[day].sort(key=lambda e: e.get("timestamp", ""))
        return dict(sorted(timeline.items()))
