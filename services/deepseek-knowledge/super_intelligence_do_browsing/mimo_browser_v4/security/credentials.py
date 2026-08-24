"""MiMo Browser v4 — Encrypted credential vault."""
from __future__ import annotations

import json
import time
from typing import Any

from .crypto import encrypt, decrypt
from .storage import EncryptedStore


DEFAULT_VAULT_PATH = None  # Uses EncryptedStore default


class CredentialVault:
    """Encrypted credential vault for storing site credentials securely.

    Credentials are stored in an encrypted SQLite database. Each entry
    contains site, username, password, and metadata. The vault is
    protected by a master password.
    """

    def __init__(
        self,
        vault_path: str | None = None,
        master_password: str = "",
    ) -> None:
        """Initialize the credential vault.

        Args:
            vault_path: Path to the vault database file.
            master_password: Master password for the vault.

        Raises:
            ValueError: If master_password is empty.
        """
        if not master_password:
            raise ValueError("Master password cannot be empty")

        self._store = EncryptedStore(
            db_path=vault_path or _default_path(),
            password=master_password,
        )
        self._master_password = master_password

    def store(
        self,
        site: str,
        username: str,
        password: str,
        master_password: str | None = None,
    ) -> None:
        """Store credentials for a site.

        Args:
            site: The site identifier (e.g., domain or URL).
            username: The username/email.
            password: The password to store.
            master_password: Override master password (uses default if None).

        Raises:
            ValueError: If any required field is empty.
        """
        if not site:
            raise ValueError("Site cannot be empty")
        if not username:
            raise ValueError("Username cannot be empty")
        if not password:
            raise ValueError("Password cannot be empty")

        # Use provided master password or the vault's default
        mp = master_password or self._master_password

        # Check if entry already exists
        existing = self._get_entry(site)
        if existing:
            # Update existing entry
            existing["username"] = username
            existing["password"] = password
            existing["updated_at"] = time.time()
            entry = existing
        else:
            entry = {
                "site": site,
                "username": username,
                "password": password,
                "created_at": time.time(),
                "updated_at": time.time(),
            }

        self._store.set(f"cred:{site}", entry)

    def retrieve(
        self,
        site: str,
        master_password: str | None = None,
    ) -> dict[str, Any] | None:
        """Retrieve credentials for a site.

        Args:
            site: The site identifier.
            master_password: Override master password (uses default if None).

        Returns:
            A dict with 'site', 'username', 'password', 'created_at',
            'updated_at' or None if not found.

        Raises:
            ValueError: If site is empty.
            PermissionError: If master password is incorrect.
        """
        if not site:
            raise ValueError("Site cannot be empty")

        mp = master_password or self._master_password

        try:
            entry = self._get_entry(site)
        except Exception as e:
            raise PermissionError(
                f"Failed to decrypt vault (wrong master password?): {e}"
            ) from e

        return entry

    def delete(self, site: str) -> bool:
        """Delete credentials for a site.

        Args:
            site: The site identifier.

        Returns:
            True if the entry was found and deleted, False otherwise.
        """
        if not site:
            raise ValueError("Site cannot be empty")
        return self._store.delete(f"cred:{site}")

    def list_sites(self) -> list[str]:
        """List all sites with stored credentials.

        Returns:
            A list of site identifiers.
        """
        keys = self._store.list_keys()
        return [k.replace("cred:", "", 1) for k in keys if k.startswith("cred:")]

    def _get_entry(self, site: str) -> dict[str, Any] | None:
        """Get a credential entry by site.

        Args:
            site: The site identifier.

        Returns:
            The credential dict or None.
        """
        return self._store.get(f"cred:{site}")

    def close(self) -> None:
        """Close the vault and its underlying storage."""
        self._store.close()

    def __enter__(self) -> CredentialVault:
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()

    def __repr__(self) -> str:
        return "CredentialVault(sites={})".format(len(self.list_sites()))


def _default_path() -> str:
    """Get the default vault database path."""
    from pathlib import Path
    return str(Path.home() / ".mimo_browser" / "vault.db")
