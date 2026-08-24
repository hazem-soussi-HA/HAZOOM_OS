"""MiMo Browser v4 — Per-page quick notes manager.

Associates short text notes with URLs so users can jot down context
while browsing.  Notes are persisted to a JSON file.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


def _normalize_url(url: str) -> str:
    """Return a canonical form of *url* for consistent keying."""
    try:
        parsed = urlparse(url.strip())
        # Drop fragment, normalise trailing slash
        path = parsed.path.rstrip("/") or "/"
        return f"{parsed.scheme}://{parsed.netloc}{path}".lower()
    except Exception:
        return url.strip().lower()


class NotesManager:
    """Persisted per-page notes store.

    Usage:
        nm = NotesManager("/path/to/notes.json")
        nm.set_note("https://example.com", "Important finding")
        note = nm.get_note("https://example.com")
        results = nm.search_notes("finding")
    """

    def __init__(self, path: str | Path = "./notes.json") -> None:
        self._path = Path(path)
        self._notes: dict[str, dict[str, Any]] = {}
        self._load()

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def _load(self) -> None:
        if self._path.exists():
            try:
                self._notes = json.loads(self._path.read_text(encoding="utf-8"))
            except Exception:
                logger.warning("Could not load notes — starting fresh.")
                self._notes = {}

    def _save(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(self._notes, indent=2), encoding="utf-8")

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def set_note(self, url: str, note: str) -> None:
        """Attach *note* to *url*.  Overwrites any existing note."""
        key = _normalize_url(url)
        now = datetime.now(timezone.utc).isoformat()
        if key in self._notes:
            self._notes[key]["text"] = note
            self._notes[key]["updated_at"] = now
        else:
            self._notes[key] = {
                "url": url,
                "text": note,
                "created_at": now,
                "updated_at": now,
            }
        self._save()
        logger.debug("Note set for %s.", url)

    def get_note(self, url: str) -> str:
        """Return the note for *url*, or an empty string if none exists."""
        key = _normalize_url(url)
        entry = self._notes.get(key)
        if entry is None:
            return ""
        return entry.get("text", "")

    def delete_note(self, url: str) -> None:
        """Remove the note for *url*."""
        key = _normalize_url(url)
        if key not in self._notes:
            raise KeyError(f"No note found for {url!r}.")
        del self._notes[key]
        self._save()
        logger.info("Note deleted for %s.", url)

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def search_notes(self, query: str) -> list[dict[str, Any]]:
        """Return notes whose text or URL contains *query* (case-insensitive)."""
        q = query.lower()
        results = []
        for entry in self._notes.values():
            haystack = f"{entry.get('url', '')} {entry.get('text', '')}".lower()
            if q in haystack:
                results.append(entry)
        return results

    def get_all_notes(self) -> dict[str, dict[str, Any]]:
        """Return the full notes dict (keyed by normalised URL)."""
        return dict(self._notes)
