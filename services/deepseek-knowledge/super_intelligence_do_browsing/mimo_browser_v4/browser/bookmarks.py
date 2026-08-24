"""MiMo Browser v4 — Smart bookmark manager.

Features auto-tagging from URL/title content, full-text search, and
Netscape-format HTML export for interoperability with other browsers.
"""

from __future__ import annotations

import html
import json
import logging
import re
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "is", "are", "was", "were",
    "in", "on", "at", "to", "for", "of", "with", "by", "from", "it",
    "this", "that", "be", "as", "has", "have", "had", "not", "do",
    "does", "did", "will", "would", "can", "could", "should", "may",
    "might", "shall", "about", "into", "than", "then", "its", "www",
    "com", "org", "net", "io", "dev", "app", "html", "htm", "php",
}

_DOMAIN_TAG_MAP = {
    "github.com": ["dev", "code", "git"],
    "stackoverflow.com": ["dev", "qa", "programming"],
    "youtube.com": ["video", "media", "entertainment"],
    "twitter.com": ["social", "news"],
    "x.com": ["social", "news"],
    "reddit.com": ["social", "forum", "discussion"],
    "medium.com": ["blog", "articles"],
    "arxiv.org": ["research", "science", "papers"],
    "scholar.google.com": ["research", "science", "papers"],
    "news.ycombinator.com": ["tech", "news", "startup"],
    "amazon.com": ["shopping", "ecommerce"],
    "docs.python.org": ["dev", "docs", "python"],
    "developer.mozilla.org": ["dev", "docs", "web"],
}


def _tokenize(text: str) -> list[str]:
    """Split *text* into lowercase word tokens."""
    return re.findall(r"[a-z0-9]+", text.lower())


def _domain_from_url(url: str) -> str:
    try:
        return urlparse(url).netloc.lower()
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# Bookmark manager
# ---------------------------------------------------------------------------

@dataclass
class BookmarkEntry:
    url: str
    title: str
    tags: list[str] = field(default_factory=list)
    created_at: str = ""
    modified_at: str = ""


class BookmarkManager:
    """Persisted bookmark store with auto-tagging and HTML export.

    Usage:
        bm = BookmarkManager("/path/to/bookmarks.json")
        bm.add("https://example.com", "Example", tags=["demo"])
        results = bm.search("demo")
        html_str = bm.export_html()
    """

    def __init__(self, path: str | Path = "./bookmarks.json") -> None:
        self._path = Path(path)
        self._entries: list[dict[str, Any]] = []
        self._load()

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def _load(self) -> None:
        if self._path.exists():
            try:
                self._entries = json.loads(self._path.read_text())
            except Exception:
                logger.warning("Could not load bookmarks — starting fresh.")
                self._entries = []

    def _save(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(self._entries, indent=2), encoding="utf-8")

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def add(
        self,
        url: str,
        title: str = "",
        tags: list[str] | None = None,
    ) -> dict[str, Any]:
        """Add a bookmark.  Auto-tags are merged with any explicit *tags*."""
        # Deduplicate by URL
        for entry in self._entries:
            if entry["url"] == url:
                if title:
                    entry["title"] = title
                if tags:
                    existing = set(entry.get("tags", []))
                    existing.update(tags)
                    entry["tags"] = sorted(existing)
                entry["modified_at"] = _now_iso()
                self._save()
                logger.debug("Updated bookmark: %s", url)
                return entry

        auto = auto_tag(url, title)
        merged_tags = sorted(set((tags or []) + auto))
        entry: dict[str, Any] = {
            "url": url,
            "title": title or url,
            "tags": merged_tags,
            "created_at": _now_iso(),
            "modified_at": _now_iso(),
        }
        self._entries.append(entry)
        self._save()
        logger.info("Bookmark added: %s (tags=%s)", url, merged_tags)
        return entry

    def remove(self, url: str) -> None:
        """Remove the bookmark with the given *url*."""
        before = len(self._entries)
        self._entries = [e for e in self._entries if e["url"] != url]
        if len(self._entries) == before:
            raise KeyError(f"No bookmark found for {url!r}.")
        self._save()
        logger.info("Bookmark removed: %s", url)

    def get_all(self) -> list[dict[str, Any]]:
        """Return all bookmarks."""
        return list(self._entries)

    def get_by_tag(self, tag: str) -> list[dict[str, Any]]:
        """Return bookmarks that have the given *tag*."""
        t = tag.lower()
        return [e for e in self._entries if t in (tg.lower() for tg in e.get("tags", []))]

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    def search(self, query: str) -> list[dict[str, Any]]:
        """Full-text search across URL, title, and tags."""
        q = query.lower()
        results = []
        for e in self._entries:
            haystack = " ".join([
                e.get("url", ""),
                e.get("title", ""),
                " ".join(e.get("tags", [])),
            ]).lower()
            if q in haystack:
                results.append(e)
        return results

    # ------------------------------------------------------------------
    # Export
    # ------------------------------------------------------------------

    def export_html(self) -> str:
        """Export all bookmarks in Netscape Bookmark File Format."""
        lines = [
            '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
            '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
            '<TITLE>MiMo Bookmarks</TITLE>',
            '<H1>MiMo Browser Bookmarks</H1>',
            '<DL><p>',
        ]
        # Group by first tag for folder structure
        folders: dict[str, list[dict]] = {}
        for entry in self._entries:
            folder = entry["tags"][0] if entry.get("tags") else "Other"
            folders.setdefault(folder, []).append(entry)

        for folder, items in sorted(folders.items()):
            lines.append(f'    <DT><H3>{html.escape(folder)}</H3>')
            lines.append('    <DL><p>')
            for item in items:
                add_date = _iso_to_unix(item.get("created_at", ""))
                tags_attr = html.escape(",".join(item.get("tags", [])))
                lines.append(
                    f'        <DT><A HREF="{html.escape(item["url"])}" '
                    f'ADD_DATE="{add_date}" '
                    f'TAGS="{tags_attr}">'
                    f'{html.escape(item.get("title", ""))}</A>'
                )
            lines.append('    </DL><p>')

        lines.append('</DL><p>')
        return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# Module-level helpers
# ---------------------------------------------------------------------------

def auto_tag(url: str, title: str = "") -> list[str]:
    """Generate tags automatically from *url* and *title*."""
    tags: set[str] = set()

    # Domain-based tags
    domain = _domain_from_url(url)
    for known_domain, domain_tags in _DOMAIN_TAG_MAP.items():
        if known_domain in domain:
            tags.update(domain_tags)

    # Token-based tags from title
    tokens = _tokenize(title)
    for tok in tokens:
        if tok not in _STOP_WORDS and len(tok) > 2:
            tags.add(tok)

    # Path-based tags
    try:
        path_parts = urlparse(url).path.strip("/").split("/")
        for part in path_parts:
            for tok in _tokenize(part):
                if tok not in _STOP_WORDS and len(tok) > 2:
                    tags.add(tok)
    except Exception:
        pass

    return sorted(tags)


def _now_iso() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def _iso_to_unix(iso: str) -> int:
    if not iso:
        return 0
    try:
        from datetime import datetime, timezone
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return int(dt.timestamp())
    except Exception:
        return 0
