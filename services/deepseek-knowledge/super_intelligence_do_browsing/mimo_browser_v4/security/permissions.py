"""MiMo Browser v4 — Site permissions model."""
from __future__ import annotations

import time
from typing import Any

from .storage import EncryptedStore


# Permission types
PERMISSION_CAMERA = "camera"
PERMISSION_MICROPHONE = "microphone"
PERMISSION_LOCATION = "location"
PERMISSION_NOTIFICATIONS = "notifications"
PERMISSION_POPUPS = "popups"
PERMISSION_AUTOPLAY = "autoplay"
PERMISSION_FULLSCREEN = "fullscreen"
PERMISSION_CLIPBOARD = "clipboard"

VALID_PERMISSION_TYPES = frozenset({
    PERMISSION_CAMERA,
    PERMISSION_MICROPHONE,
    PERMISSION_LOCATION,
    PERMISSION_NOTIFICATIONS,
    PERMISSION_POPUPS,
    PERMISSION_AUTOPLAY,
    PERMISSION_FULLSCREEN,
    PERMISSION_CLIPBOARD,
})

# Permission values
ALLOW = "allow"
DENY = "deny"
ASK = "ask"

VALID_PERMISSION_VALUES = frozenset({ALLOW, DENY, ASK})

# Default permission for each type
DEFAULT_PERMISSIONS: dict[str, str] = {
    PERMISSION_CAMERA: ASK,
    PERMISSION_MICROPHONE: ASK,
    PERMISSION_LOCATION: ASK,
    PERMISSION_NOTIFICATIONS: ASK,
    PERMISSION_POPUPS: DENY,
    PERMISSION_AUTOPLAY: DENY,
    PERMISSION_FULLSCREEN: ASK,
    PERMISSION_CLIPBOARD: ASK,
}


class PermissionManager:
    """Manages site-specific permissions with encrypted storage.

    Supports granular permission control per site for various
    browser APIs (camera, microphone, geolocation, etc.).
    """

    def __init__(
        self,
        storage: EncryptedStore | None = None,
        db_path: str | None = None,
        password: str = "",
    ) -> None:
        """Initialize the permission manager.

        Args:
            storage: An existing EncryptedStore instance (optional).
            db_path: Path to the permissions database (used if storage is None).
            password: Master password for encryption (used if storage is None).

        Raises:
            ValueError: If no storage or password is provided.
        """
        if storage is not None:
            self._store = storage
        else:
            if not password:
                raise ValueError(
                    "Either storage or password must be provided"
                )
            self._store = EncryptedStore(
                db_path=db_path or _default_path(),
                password=password,
            )
        self._own_storage = storage is None

    def get_permission(self, site: str, permission_type: str) -> str:
        """Get the permission value for a site and permission type.

        Args:
            site: The site identifier (domain).
            permission_type: The type of permission (e.g., 'camera').

        Returns:
            The permission value: 'allow', 'deny', or 'ask'.

        Raises:
            ValueError: If permission_type is invalid.
        """
        if permission_type not in VALID_PERMISSION_TYPES:
            raise ValueError(
                f"Invalid permission type: '{permission_type}'. "
                f"Valid types: {', '.join(sorted(VALID_PERMISSION_TYPES))}"
            )

        entry = self._get_site_entry(site)
        if entry is None or permission_type not in entry:
            return DEFAULT_PERMISSIONS.get(permission_type, ASK)

        return entry[permission_type]

    def set_permission(
        self,
        site: str,
        permission_type: str,
        value: str,
    ) -> None:
        """Set a permission for a site.

        Args:
            site: The site identifier (domain).
            permission_type: The type of permission.
            value: The permission value ('allow', 'deny', or 'ask').

        Raises:
            ValueError: If permission_type or value is invalid.
        """
        if permission_type not in VALID_PERMISSION_TYPES:
            raise ValueError(
                f"Invalid permission type: '{permission_type}'. "
                f"Valid types: {', '.join(sorted(VALID_PERMISSION_TYPES))}"
            )
        if value not in VALID_PERMISSION_VALUES:
            raise ValueError(
                f"Invalid permission value: '{value}'. "
                f"Valid values: {', '.join(sorted(VALID_PERMISSION_VALUES))}"
            )

        entry = self._get_site_entry(site)
        if entry is None:
            entry = {"site": site, "updated_at": time.time()}

        entry[permission_type] = value
        entry["updated_at"] = time.time()
        self._store.set(f"perm:{site}", entry)

    def check_camera(self, site: str) -> str:
        """Check camera permission for a site.

        Args:
            site: The site identifier.

        Returns:
            'allow', 'deny', or 'ask'.
        """
        return self.get_permission(site, PERMISSION_CAMERA)

    def check_microphone(self, site: str) -> str:
        """Check microphone permission for a site.

        Args:
            site: The site identifier.

        Returns:
            'allow', 'deny', or 'ask'.
        """
        return self.get_permission(site, PERMISSION_MICROPHONE)

    def check_location(self, site: str) -> str:
        """Check location permission for a site.

        Args:
            site: The site identifier.

        Returns:
            'allow', 'deny', or 'ask'.
        """
        return self.get_permission(site, PERMISSION_LOCATION)

    def check_notifications(self, site: str) -> str:
        """Check notifications permission for a site.

        Args:
            site: The site identifier.

        Returns:
            'allow', 'deny', or 'ask'.
        """
        return self.get_permission(site, PERMISSION_NOTIFICATIONS)

    def check_popups(self, site: str) -> str:
        """Check popup permission for a site.

        Args:
            site: The site identifier.

        Returns:
            'allow', 'deny', or 'ask'.
        """
        return self.get_permission(site, PERMISSION_POPUPS)

    def check_autoplay(self, site: str) -> str:
        """Check autoplay permission for a site.

        Args:
            site: The site identifier.

        Returns:
            'allow', 'deny', or 'ask'.
        """
        return self.get_permission(site, PERMISSION_AUTOPLAY)

    def check_fullscreen(self, site: str) -> str:
        """Check fullscreen permission for a site.

        Args:
            site: The site identifier.

        Returns:
            'allow', 'deny', or 'ask'.
        """
        return self.get_permission(site, PERMISSION_FULLSCREEN)

    def check_clipboard(self, site: str) -> str:
        """Check clipboard permission for a site.

        Args:
            site: The site identifier.

        Returns:
            'allow', 'deny', or 'ask'.
        """
        return self.get_permission(site, PERMISSION_CLIPBOARD)

    def delete_site(self, site: str) -> bool:
        """Delete all permissions for a site.

        Args:
            site: The site identifier.

        Returns:
            True if the site was found and deleted, False otherwise.
        """
        return self._store.delete(f"perm:{site}")

    def list_sites(self) -> list[str]:
        """List all sites with stored permissions.

        Returns:
            A list of site identifiers.
        """
        keys = self._store.list_keys()
        return [k.replace("perm:", "", 1) for k in keys if k.startswith("perm:")]

    def get_all_permissions(self, site: str) -> dict[str, str]:
        """Get all permission values for a site.

        Args:
            site: The site identifier.

        Returns:
            A dict mapping permission types to their values.
        """
        entry = self._get_site_entry(site)
        if entry is None:
            return dict(DEFAULT_PERMISSIONS)

        result = dict(DEFAULT_PERMISSIONS)
        for ptype in VALID_PERMISSION_TYPES:
            if ptype in entry:
                result[ptype] = entry[ptype]
        return result

    def reset_to_defaults(self, site: str) -> None:
        """Reset all permissions for a site to defaults.

        Args:
            site: The site identifier.
        """
        entry = {"site": site, "updated_at": time.time()}
        self._store.set(f"perm:{site}", entry)

    def _get_site_entry(self, site: str) -> dict[str, Any] | None:
        """Get the permission entry for a site.

        Args:
            site: The site identifier.

        Returns:
            The permission dict or None.
        """
        return self._store.get(f"perm:{site}")

    def close(self) -> None:
        """Close the permission manager and its storage."""
        if self._own_storage:
            self._store.close()

    def __enter__(self) -> PermissionManager:
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()

    def __repr__(self) -> str:
        return "PermissionManager(sites={})".format(len(self.list_sites()))


def _default_path() -> str:
    """Get the default permissions database path."""
    from pathlib import Path
    return str(Path.home() / ".mimo_browser" / "permissions.db")
