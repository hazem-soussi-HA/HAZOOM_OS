"""MiMo Browser v4 — Encrypted SQLite storage using the crypto module."""
from __future__ import annotations

import json
import sqlite3
import os
from pathlib import Path
from typing import Any

from .crypto import encrypt, decrypt


DEFAULT_DB_PATH = Path.home() / ".mimo_browser" / "store.db"


class EncryptedStore:
    """Encrypted key-value store backed by SQLite.

    Each value is JSON-serialized and then encrypted with AES-256-GCM
    before being stored. The encryption key is derived from a user-provided
    master password.
    """

    def __init__(
        self,
        db_path: str | Path = DEFAULT_DB_PATH,
        password: str = "",
    ) -> None:
        """Initialize the encrypted store.

        Args:
            db_path: Path to the SQLite database file.
            password: Master password for encryption/decryption.
        """
        if not password:
            raise ValueError("Master password cannot be empty")

        self._db_path = Path(db_path)
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._password = password
        self._conn = sqlite3.connect(str(self._db_path))
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.execute("PRAGMA foreign_keys=ON")
        self._create_table()

    def _create_table(self) -> None:
        """Create the key-value table if it doesn't exist."""
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS kv_store (
                key TEXT PRIMARY KEY,
                value BLOB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        self._conn.commit()

    def set(self, key: str, value: Any) -> None:
        """Store and encrypt a value.

        Args:
            key: The storage key.
            value: The value to store (will be JSON-serialized).
        """
        serialized = json.dumps(value, ensure_ascii=False).encode("utf-8")
        encrypted = encrypt(serialized, self._password)

        self._conn.execute(
            """
            INSERT INTO kv_store (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = CURRENT_TIMESTAMP
            """,
            (key, encrypted),
        )
        self._conn.commit()

    def get(self, key: str) -> Any | None:
        """Retrieve and decrypt a value.

        Args:
            key: The storage key.

        Returns:
            The decrypted deserialized value, or None if not found.

        Raises:
            ValueError: If decryption fails (wrong password or corrupted data).
        """
        cursor = self._conn.execute(
            "SELECT value FROM kv_store WHERE key = ?",
            (key,),
        )
        row = cursor.fetchone()
        if row is None:
            return None

        encrypted = row[0]
        try:
            decrypted = decrypt(encrypted, self._password)
        except Exception as e:
            raise ValueError(
                f"Failed to decrypt value for key '{key}': {e}"
            ) from e

        return json.loads(decrypted.decode("utf-8"))

    def delete(self, key: str) -> bool:
        """Delete a key from the store.

        Args:
            key: The key to delete.

        Returns:
            True if the key was found and deleted, False otherwise.
        """
        cursor = self._conn.execute(
            "DELETE FROM kv_store WHERE key = ?",
            (key,),
        )
        self._conn.commit()
        return cursor.rowcount > 0

    def list_keys(self) -> list[str]:
        """List all stored keys.

        Returns:
            A list of all keys in the store.
        """
        cursor = self._conn.execute("SELECT key FROM kv_store ORDER BY key")
        return [row[0] for row in cursor.fetchall()]

    def close(self) -> None:
        """Close the database connection."""
        self._conn.close()

    def __enter__(self) -> EncryptedStore:
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()

    def __repr__(self) -> str:
        return f"EncryptedStore(db_path={self._db_path!r})"
