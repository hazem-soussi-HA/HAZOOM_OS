"""MiMo Browser v4 — Tab manager.

Manages an ordered collection of TabInfo objects with support for
pinning, muting, duplicating, and reordering.
"""

from __future__ import annotations

import logging
import uuid
from typing import Optional

from ..config import TabInfo

logger = logging.getLogger(__name__)


class TabManager:
    """In-memory tab manager.

    Maintains an ordered list of :class:`TabInfo` objects and tracks the
    currently active tab by index.

    Usage:
        tm = TabManager()
        tab = tm.new_tab("https://example.com")
        tm.pin_tab(tab.id)
        all_tabs = tm.get_all_tabs()
    """

    def __init__(self, max_tabs: int = 50) -> None:
        self._tabs: list[TabInfo] = []
        self._active_index: int = -1
        self._max_tabs = max_tabs

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_all_tabs(self) -> list[TabInfo]:
        """Return a shallow copy of the tab list."""
        return list(self._tabs)

    def get_tab(self, tab_id: str) -> TabInfo:
        """Return the :class:`TabInfo` with the given *tab_id*."""
        for tab in self._tabs:
            if tab.id == tab_id:
                return tab
        raise KeyError(f"Tab {tab_id!r} not found.")

    @property
    def active_tab(self) -> TabInfo | None:
        """The currently active tab, or None if no tabs exist."""
        if 0 <= self._active_index < len(self._tabs):
            return self._tabs[self._active_index]
        return None

    @property
    def active_index(self) -> int:
        return self._active_index

    @property
    def count(self) -> int:
        return len(self._tabs)

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------

    def new_tab(self, url: str = "about:blank") -> TabInfo:
        """Open a new tab at the end of the tab strip and activate it."""
        if len(self._tabs) >= self._max_tabs:
            raise RuntimeError(f"Maximum tab count ({self._max_tabs}) reached.")

        tab = TabInfo(id=uuid.uuid4().hex[:12], url=url)
        self._tabs.append(tab)
        self._active_index = len(self._tabs) - 1
        logger.info("New tab %s -> %s", tab.id, url)
        return tab

    def close_tab(self, tab_id: str) -> None:
        """Close the tab with the given *tab_id*."""
        idx = self._index_of(tab_id)
        if idx == -1:
            raise KeyError(f"Tab {tab_id!r} not found.")

        self._tabs.pop(idx)
        # Adjust active index
        if not self._tabs:
            self._active_index = -1
        elif idx <= self._active_index:
            self._active_index = max(0, self._active_index - 1)
        logger.info("Closed tab %s.", tab_id)

    def switch_tab(self, tab_id: str) -> TabInfo:
        """Activate the tab with the given *tab_id*."""
        idx = self._index_of(tab_id)
        if idx == -1:
            raise KeyError(f"Tab {tab_id!r} not found.")
        self._active_index = idx
        logger.debug("Switched to tab %s.", tab_id)
        return self._tabs[idx]

    def pin_tab(self, tab_id: str) -> TabInfo:
        """Pin the tab so it stays at the beginning of the strip."""
        tab = self.get_tab(tab_id)
        if tab.is_pinned:
            return tab
        tab.is_pinned = True
        # Move to front
        idx = self._index_of(tab_id)
        self._tabs.pop(idx)
        # Insert after the last pinned tab
        insert_pos = 0
        for i, t in enumerate(self._tabs):
            if not t.is_pinned:
                insert_pos = i
                break
        else:
            insert_pos = len(self._tabs)
        self._tabs.insert(insert_pos, tab)
        self._active_index = insert_pos
        logger.info("Pinned tab %s.", tab_id)
        return tab

    def mute_tab(self, tab_id: str) -> TabInfo:
        """Toggle mute for the given tab."""
        tab = self.get_tab(tab_id)
        tab.is_muted = not tab.is_muted
        logger.info("Tab %s mute=%s.", tab_id, tab.is_muted)
        return tab

    def duplicate_tab(self, tab_id: str) -> TabInfo:
        """Create a copy of the given tab next to the original."""
        src = self.get_tab(tab_id)
        dup = TabInfo(
            id=uuid.uuid4().hex[:12],
            url=src.url,
            title=src.title,
            group=src.group,
            group_color=src.group_color,
            favicon=src.favicon,
            zoom=src.zoom,
            notes=src.notes,
        )
        idx = self._index_of(tab_id)
        self._tabs.insert(idx + 1, dup)
        self._active_index = idx + 1
        logger.info("Duplicated tab %s -> %s.", tab_id, dup.id)
        return dup

    def reload_tab(self, tab_id: str) -> TabInfo:
        """Mark a tab as loading (actual reload is handled by the engine)."""
        tab = self.get_tab(tab_id)
        tab.is_loading = True
        logger.debug("Tab %s marked for reload.", tab_id)
        return tab

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _index_of(self, tab_id: str) -> int:
        for i, tab in enumerate(self._tabs):
            if tab.id == tab_id:
                return i
        return -1
