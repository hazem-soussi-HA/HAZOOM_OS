"""MiMo Browser v4 — AES-256-GCM encryption with Argon2id key derivation."""
from __future__ import annotations

import os
import base64
import hashlib
from typing import Tuple

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from cryptography.exceptions import InvalidTag

# Argon2id is available in cryptography >= 41.0.0 via argon2-cffi or
# we fall back to Scrypt which is in cryptography natively.
# For full Argon2id support we try argon2 first, then fallback to Scrypt.
try:
    import argon2
    from argon2.low_level import hash_secret_raw, Type as Argon2Type
    _HAS_ARGON2 = True
except ImportError:
    _HAS_ARGON2 = False


# --- Constants ---
SALT_LENGTH = 16
NONCE_LENGTH = 12
KEY_LENGTH = 32  # 256 bits
TAG_LENGTH = 16

# Argon2id parameters
ARGON2_TIME_COST = 3
ARGON2_MEMORY_COST = 65536  # 64 MB
ARGON2_PARALLELISM = 4

# Scrypt parameters (fallback)
SCRYPT_N = 2**17  # 131072
SCRYPT_R = 8
SCRYPT_P = 1


def derive_key(password: str, salt: bytes) -> bytes:
    """Derive a 256-bit key from a password using Argon2id (or Scrypt fallback).

    Args:
        password: The password/passphrase to derive the key from.
        salt: Random salt bytes (must be SALT_LENGTH bytes).

    Returns:
        A 32-byte derived key suitable for AES-256-GCM.

    Raises:
        ValueError: If salt length is incorrect.
    """
    if len(salt) != SALT_LENGTH:
        raise ValueError(f"Salt must be {SALT_LENGTH} bytes, got {len(salt)}")

    password_bytes = password.encode("utf-8")

    if _HAS_ARGON2:
        key = hash_secret_raw(
            secret=password_bytes,
            salt=salt,
            time_cost=ARGON2_TIME_COST,
            memory_cost=ARGON2_MEMORY_COST,
            parallelism=ARGON2_PARALLELISM,
            hash_len=KEY_LENGTH,
            type=Argon2Type.ID,
        )
    else:
        # Fallback to Scrypt (built into cryptography library)
        kdf = Scrypt(
            salt=salt,
            length=KEY_LENGTH,
            n=SCRYPT_N,
            r=SCRYPT_R,
            p=SCRYPT_P,
        )
        key = kdf.derive(password_bytes)

    return key


def encrypt(data: bytes | str, password: str) -> bytes:
    """Encrypt data using AES-256-GCM with Argon2id-derived key.

    The output format is:
        salt (16 bytes) || nonce (12 bytes) || ciphertext+tag

    Args:
        data: The plaintext data to encrypt (str or bytes).
        password: The password to derive the encryption key from.

    Returns:
        Encrypted data as bytes (salt + nonce + ciphertext with auth tag).

    Raises:
        TypeError: If data type is not str or bytes.
        ValueError: If password is empty.
    """
    if not password:
        raise ValueError("Password cannot be empty")

    if isinstance(data, str):
        plaintext = data.encode("utf-8")
    elif isinstance(data, bytes):
        plaintext = data
    else:
        raise TypeError(f"Data must be str or bytes, got {type(data)}")

    salt = os.urandom(SALT_LENGTH)
    nonce = os.urandom(NONCE_LENGTH)
    key = derive_key(password, salt)

    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)

    # Format: salt || nonce || ciphertext (includes GCM tag)
    return salt + nonce + ciphertext


def decrypt(encrypted: bytes, password: str) -> bytes:
    """Decrypt AES-256-GCM encrypted data.

    Expects the format produced by encrypt():
        salt (16 bytes) || nonce (12 bytes) || ciphertext+tag

    Args:
        encrypted: The encrypted data (salt + nonce + ciphertext).
        password: The password used during encryption.

    Returns:
        Decrypted plaintext as bytes.

    Raises:
        ValueError: If encrypted data is too short or password is empty.
        InvalidTag: If decryption fails (wrong password or corrupted data).
    """
    if not password:
        raise ValueError("Password cannot be empty")

    min_length = SALT_LENGTH + NONCE_LENGTH + TAG_LENGTH
    if len(encrypted) < min_length:
        raise ValueError(
            f"Encrypted data too short: {len(encrypted)} bytes "
            f"(minimum {min_length} bytes)"
        )

    salt = encrypted[:SALT_LENGTH]
    nonce = encrypted[SALT_LENGTH:SALT_LENGTH + NONCE_LENGTH]
    ciphertext = encrypted[SALT_LENGTH + NONCE_LENGTH:]

    key = derive_key(password, salt)

    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)

    return plaintext


def encrypt_b64(data: bytes | str, password: str) -> str:
    """Encrypt and return result as a base64-encoded string for easy storage."""
    encrypted = encrypt(data, password)
    return base64.b64encode(encrypted).decode("ascii")


def decrypt_b64(encrypted_b64: str, password: str) -> bytes:
    """Decrypt from a base64-encoded string."""
    encrypted = base64.b64decode(encrypted_b64)
    return decrypt(encrypted, password)
