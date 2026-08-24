"""MiMo Browser v4 — Workspace session manager.

A workspace captures the full browser session state (tabs, groups,
active tab) so it can be saved, listed, and restored across sessions.
An auto-save slot provides crash-recovery.
"""

from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..config import Workspace

logger = logging.getLogger(__name__)

_AUTO_SAVE_NAME = "__auto_save__"


class WorkspaceManager:
    """Persist and restore named workspace sessions.

    Usage:
        wm = WorkspaceManager("/path/to/workspaces")
        wm.save_workspace("research", tabs=[...], groups=[...])
        state = wm.load_workspace("research")
    """

    def __init__(self, directory: str | Path = "./workspaces") -> None:
        self._dir = Path(directory)
        self._dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def save_workspace(
        self,
        name: str,
        tabs: list[dict[str, Any]],
        groups: list[dict[str, Any]] | None = None,
        active_tab: int = 0,
    ) -> bool:
        """Save a workspace with the given *name*.

        Args:
            name: Workspace identifier.
            tabs: Serialized tab dicts (from TabInfo.to_dict()).
            groups: Serialized group dicts (from TabGroup.to_dict()).
            active_tab: Index of the active tab.

        Returns:
            True on success.
        """
        ws = {
            "name": name,
            "tabs": tabs,
            "groups": groups or [],
            "active_tab": active_tab,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        path = self._path_for(name)
        try:
            path.write_text(json.dumps(ws, indent=2), encoding="utf-8")
            logger.info("Workspace %r saved (%d tabs).", name, len(tabs))
            return True
        except OSError as exc:
            logger.error("Failed to save workspace %r: %s", name, exc)
            return False

    def load_workspace(self, name: str) -> dict[str, Any]:
        """Load a workspace by *name*.

        Returns the full workspace dict (tabs, groups, active_tab, …).
        """
        path = self._path_for(name)
        if not path.exists():
            raise FileNotFoundError(f"Workspace {name!r} not found.")
        data = json.loads(path.read_text(encoding="utf-8"))
        logger.info("Workspace %r loaded (%d tabs).", name, len(data.get("tabs", [])))
        return data

    def delete_workspace(self, name: str) -> None:
        """Delete a workspace."""
        if name == _AUTO_SAVE_NAME:
            logger.warning("Deleting auto-save workspace.")
        path = self._path_for(name)
        if not path.exists():
            raise FileNotFoundError(f"Workspace {name!r} not found.")
        path.unlink()
        logger.info("Workspace %r deleted.", name)

    def list_workspaces(self) -> list[str]:
        """Return the names of all saved workspaces."""
        names = []
        for p in sorted(self._dir.glob("*.json")):
            names.append(p.stem)
        return names

    # ------------------------------------------------------------------
    # Auto-save (crash recovery)
    # ------------------------------------------------------------------

    def auto_save(self, current_state: dict[str, Any]) -> bool:
        """Save *current_state* to the auto-save slot."""
        return self.save_workspace(
            name=_AUTO_SAVE_NAME,
            tabs=current_state.get("tabs", []),
            groups=current_state.get("groups", []),
            active_tab=current_state.get("active_tab", 0),
        )

    def restore_auto_save(self) -> dict[str, Any]:
        """Restore the auto-save workspace.

        Raises FileNotFoundError if no auto-save exists.
        """
        return self.load_workspace(_AUTO_SAVE_NAME)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _path_for(self, name: str) -> Path:
        # Sanitise name to prevent path traversal
        safe = "".join(c for c in name if c.isalnum() or c in "-_")
        if not safe:
            safe = "workspace"
        return self._dir / f"{safe}.json"
