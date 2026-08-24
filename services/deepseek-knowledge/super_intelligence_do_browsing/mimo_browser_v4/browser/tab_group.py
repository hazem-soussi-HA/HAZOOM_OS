"""MiMo Browser v4 — Tab group manager.

Allows tabs to be organised into named, coloured groups that can be
collapsed/expanded.
"""

from __future__ import annotations

import logging
from typing import Optional

from ..config import TabGroup

logger = logging.getLogger(__name__)

# Predefined colours for auto-assignment
_DEFAULT_COLORS = [
    "#00d4ff", "#ff6b6b", "#ffd93d", "#6bcb77",
    "#a855f7", "#f97316", "#06b6d4", "#ec4899",
]


class TabGroupManager:
    """Manages named tab groups.

    Usage:
        tgm = TabGroupManager()
        tgm.create_group("Research", color="#00d4ff")
        tgm.add_tab_to_group(tab_id, "Research")
    """

    def __init__(self) -> None:
        self._groups: dict[str, TabGroup] = {}
        # Create a default group
        self.create_group("default", color="#00d4ff")

    # ------------------------------------------------------------------
    # Group CRUD
    # ------------------------------------------------------------------

    def create_group(self, name: str, color: str | None = None) -> TabGroup:
        """Create a new tab group.

        Args:
            name: Unique group name.
            color: Hex colour string.  Auto-assigned if *None*.

        Raises:
            ValueError: If a group with *name* already exists.
        """
        if name in self._groups:
            raise ValueError(f"Group {name!r} already exists.")

        if color is None:
            color = _DEFAULT_COLORS[len(self._groups) % len(_DEFAULT_COLORS)]

        group = TabGroup(name=name, color=color)
        self._groups[name] = group
        logger.info("Created group %r (color=%s).", name, color)
        return group

    def delete_group(self, name: str) -> None:
        """Delete a group.  Tabs in the group are moved to 'default'."""
        if name == "default":
            raise ValueError("Cannot delete the default group.")
        if name not in self._groups:
            raise KeyError(f"Group {name!r} not found.")

        # Move tabs to default
        group = self._groups[name]
        default = self._groups.get("default")
        if default:
            default.tab_ids.extend(group.tab_ids)

        del self._groups[name]
        logger.info("Deleted group %r.", name)

    def get_group(self, name: str) -> TabGroup:
        """Return the :class:`TabGroup` with the given *name*."""
        if name not in self._groups:
            raise KeyError(f"Group {name!r} not found.")
        return self._groups[name]

    def get_all_groups(self) -> list[TabGroup]:
        """Return all groups."""
        return list(self._groups.values())

    # ------------------------------------------------------------------
    # Tab <-> Group mapping
    # ------------------------------------------------------------------

    def add_tab_to_group(self, tab_id: str, group_name: str) -> None:
        """Move *tab_id* into *group_name*, removing it from any previous group."""
        if group_name not in self._groups:
            raise KeyError(f"Group {group_name!r} not found.")

        # Remove from all other groups
        for grp in self._groups.values():
            if tab_id in grp.tab_ids:
                grp.tab_ids.remove(tab_id)

        target = self._groups[group_name]
        if tab_id not in target.tab_ids:
            target.tab_ids.append(tab_id)
        logger.debug("Added tab %s to group %r.", tab_id, group_name)

    def remove_tab_from_group(self, tab_id: str) -> None:
        """Remove *tab_id* from whatever group it is in and place it in 'default'."""
        for grp in self._groups.values():
            if tab_id in grp.tab_ids:
                grp.tab_ids.remove(tab_id)
                break
        self.add_tab_to_group(tab_id, "default")

    # ------------------------------------------------------------------
    # Collapse / Expand
    # ------------------------------------------------------------------

    def collapse_group(self, name: str) -> TabGroup:
        """Collapse the group so its tabs are hidden from the strip."""
        grp = self.get_group(name)
        grp.collapsed = True
        logger.info("Collapsed group %r.", name)
        return grp

    def expand_group(self, name: str) -> TabGroup:
        """Expand a collapsed group."""
        grp = self.get_group(name)
        grp.collapsed = False
        logger.info("Expanded group %r.", name)
        return grp

    # ------------------------------------------------------------------
    # Rename
    # ------------------------------------------------------------------

    def rename_group(self, old_name: str, new_name: str) -> TabGroup:
        """Rename a group."""
        if old_name == "default":
            raise ValueError("Cannot rename the default group.")
        if old_name not in self._groups:
            raise KeyError(f"Group {old_name!r} not found.")
        if new_name in self._groups:
            raise ValueError(f"Group {new_name!r} already exists.")

        grp = self._groups.pop(old_name)
        grp.name = new_name
        self._groups[new_name] = grp
        logger.info("Renamed group %r -> %r.", old_name, new_name)
        return grp
