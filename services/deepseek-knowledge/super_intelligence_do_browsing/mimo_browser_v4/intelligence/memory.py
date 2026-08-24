"""
intelligence/memory.py - Enhanced Memory System

The SessionMemory class provides persistent storage and retrieval of
browsing session data, including visited pages, searches, and context
for intelligent suggestions.
"""

from __future__ import annotations

import re
import time
import urllib.parse
from collections import Counter
from typing import Any


class SessionMemory:
    """Enhanced memory system for MiMo Browser v4 browsing sessions.

    Stores visited URLs, search queries, and arbitrary key-value data
    with tags. Provides recall, frequency analysis, and continuation
    suggestions.

    Usage:
        mem = SessionMemory()
        mem.remember("page_visit", {"url": "https://example.com"}, tags=["visit"])
        results = mem.recall("example")
    """

    def __init__(self) -> None:
        self._store: dict[str, dict[str, Any]] = {}
        self._visits: list[dict[str, Any]] = []
        self._searches: list[dict[str, Any]] = []
        self._tags_index: dict[str, list[str]] = {}

    # ------------------------------------------------------------------
    # Core API
    # ------------------------------------------------------------------

    def remember(
        self,
        key: str,
        data: Any,
        tags: list[str] | None = None,
    ) -> None:
        """Store data in session memory.

        Args:
            key: Unique key for the data entry.
            data: Any data to store (will be shallow-copied if dict/list).
            tags: Optional list of tags for categorization.
        """
        entry: dict[str, Any] = {
            "key": key,
            "data": data,
            "tags": list(tags) if tags else [],
            "timestamp": time.time(),
        }

        self._store[key] = entry

        # Index by tags
        for tag in entry["tags"]:
            if tag not in self._tags_index:
                self._tags_index[tag] = []
            if key not in self._tags_index[tag]:
                self._tags_index[tag].append(key)

        # Auto-track visits and searches
        if isinstance(data, dict):
            url = data.get("url", "")
            if url and "visit" in entry["tags"]:
                self._visits.append(
                    {"url": url, "title": data.get("title", ""), "timestamp": entry["timestamp"]}
                )
            query = data.get("query", "")
            if query and "search" in entry["tags"]:
                self._searches.append(
                    {"query": query, "timestamp": entry["timestamp"]}
                )

    def recall(self, query: str, limit: int = 10) -> list[dict[str, Any]]:
        """Search memory for entries matching a query.

        Searches across keys, data values, and tags.

        Args:
            query: Search string.
            limit: Maximum number of results.

        Returns:
            List of matching memory entries, sorted by relevance.
        """
        if not query:
            return []

        query_lower = query.lower()
        results: list[dict[str, Any]] = []

        for key, entry in self._store.items():
            score = 0

            # Match key
            if query_lower in key.lower():
                score += 3

            # Match tags
            for tag in entry.get("tags", []):
                if query_lower in tag.lower():
                    score += 2

            # Match data
            data = entry.get("data", "")
            if isinstance(data, str):
                if query_lower in data.lower():
                    score += 1
            elif isinstance(data, dict):
                for v in data.values():
                    if isinstance(v, str) and query_lower in v.lower():
                        score += 1
                        break

            if score > 0:
                results.append({"score": score, "entry": entry})

        # Sort by score descending, then by timestamp descending
        results.sort(key=lambda r: (r["score"], r["entry"]["timestamp"]), reverse=True)

        return [r["entry"] for r in results[:limit]]

    def get_frequently_visited(self, limit: int = 10) -> list[dict[str, Any]]:
        """Get the most frequently visited URLs.

        Args:
            limit: Maximum number of results.

        Returns:
            List of dicts with 'url', 'title', 'visit_count'.
        """
        if not self._visits:
            return []

        url_counts: Counter[str] = Counter()
        url_titles: dict[str, str] = {}

        for visit in self._visits:
            url = visit["url"]
            url_counts[url] += 1
            if visit.get("title"):
                url_titles[url] = visit["title"]

        most_common = url_counts.most_common(limit)
        return [
            {
                "url": url,
                "title": url_titles.get(url, ""),
                "visit_count": count,
            }
            for url, count in most_common
        ]

    def get_recent_searches(self, limit: int = 10) -> list[dict[str, Any]]:
        """Get recent search queries.

        Args:
            limit: Maximum number of results.

        Returns:
            List of dicts with 'query' and 'timestamp'.
        """
        recent = self._searches[-limit:]
        return [
            {"query": s["query"], "timestamp": s["timestamp"]}
            for s in reversed(recent)
        ]

    def suggest_continuation(self, current_url: str, history: list[str]) -> str:
        """Suggest what the user might want to do next.

        Args:
            current_url: The current page URL.
            history: List of recently visited URLs.

        Returns:
            A suggestion string.
        """
        if not current_url:
            return "Start by entering a URL or search query."

        parsed = urllib.parse.urlparse(current_url)
        domain = parsed.netloc or parsed.path

        # Analyze current page context
        if self._is_search_page(current_url):
            return "Click on a result to explore further, or refine your search."

        if self._is_article_page(current_url):
            return "Read the article, or search for related topics."

        if self._is_product_page(current_url):
            return "Check reviews, compare prices, or look for similar products."

        # Check history for patterns
        if history:
            recent_domains = [
                urllib.parse.urlparse(h).netloc
                for h in history[-5:]
                if h
            ]
            domain_counts: Counter[str] = Counter(recent_domains)
            most_common_domain, count = domain_counts.most_common(1)[0]

            if count >= 3 and most_common_domain != domain:
                return f"You've been browsing {most_common_domain} frequently. Continue exploring?"

        # Check for frequent visits to current domain
        domain_visits = [v for v in self._visits if domain in v["url"]]
        if len(domain_visits) > 3:
            return f"You visit {domain} often. Check for updates or new content?"

        # Default suggestions
        suggestions = [
            "Explore related pages",
            "Search for more information",
            "Bookmark this page for later",
            "Share this page",
        ]

        # Pick based on URL hash for variety
        idx = hash(current_url) % len(suggestions)
        return suggestions[abs(idx)]

    # ------------------------------------------------------------------
    # Direct access helpers
    # ------------------------------------------------------------------

    def get(self, key: str) -> dict[str, Any] | None:
        """Get a memory entry by key."""
        return self._store.get(key)

    def get_by_tag(self, tag: str) -> list[dict[str, Any]]:
        """Get all entries with a specific tag."""
        keys = self._tags_index.get(tag, [])
        return [self._store[k] for k in keys if k in self._store]

    def forget(self, key: str) -> bool:
        """Remove an entry from memory. Returns True if found."""
        entry = self._store.pop(key, None)
        if entry:
            for tag in entry.get("tags", []):
                if tag in self._tags_index:
                    self._tags_index[tag] = [
                        k for k in self._tags_index[tag] if k != key
                    ]
            return True
        return False

    def clear(self) -> None:
        """Clear all memory."""
        self._store.clear()
        self._visits.clear()
        self._searches.clear()
        self._tags_index.clear()

    @property
    def size(self) -> int:
        """Number of entries in memory."""
        return len(self._store)

    @property
    def visit_count(self) -> int:
        """Total number of tracked visits."""
        return len(self._visits)

    @property
    def search_count(self) -> int:
        """Total number of tracked searches."""
        return len(self._searches)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _is_search_page(url: str) -> bool:
        """Check if URL is a search results page."""
        parsed = urllib.parse.urlparse(url)
        query_params = urllib.parse.parse_qs(parsed.query)
        search_params = {"q", "query", "search", "s", "keyword", "keywords"}
        return bool(search_params & set(query_params.keys()))

    @staticmethod
    def _is_article_page(url: str) -> bool:
        """Check if URL looks like an article page."""
        path = urllib.parse.urlparse(url).path.lower()
        article_patterns = [
            r"/article", r"/post", r"/blog/", r"/news/", r"/story/",
            r"/\d{4}/\d{2}/", r"/p/", r"/entry/",
        ]
        return any(re.search(p, path) for p in article_patterns)

    @staticmethod
    def _is_product_page(url: str) -> bool:
        """Check if URL looks like a product page."""
        path = urllib.parse.urlparse(url).path.lower()
        product_patterns = [
            r"/product", r"/item", r"/p/", r"/dp/", r"/gp/product",
            r"/buy", r"/shop/", r"/store/",
        ]
        return any(re.search(p, path) for p in product_patterns)
