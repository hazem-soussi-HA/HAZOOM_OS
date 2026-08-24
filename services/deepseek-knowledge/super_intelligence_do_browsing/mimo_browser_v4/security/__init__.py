"""MiMo Browser v4 — Security layer.

This package provides the security infrastructure for the MiMo Browser,
including encryption, encrypted storage, ad blocking, fingerprint protection,
credential management, and site permissions.
"""

from .crypto import (
    derive_key,
    encrypt,
    decrypt,
    encrypt_b64,
    decrypt_b64,
)
from .storage import EncryptedStore
from .filters import FilterEngine
from .fingerprint import FingerprintGuard
from .credentials import CredentialVault
from .permissions import PermissionManager

__all__ = [
    # Crypto
    "derive_key",
    "encrypt",
    "decrypt",
    "encrypt_b64",
    "decrypt_b64",
    # Storage
    "EncryptedStore",
    # Filters
    "FilterEngine",
    # Fingerprint
    "FingerprintGuard",
    # Credentials
    "CredentialVault",
    # Permissions
    "PermissionManager",
]

__version__ = "4.0.0"
