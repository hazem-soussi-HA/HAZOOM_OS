# Copyright © 2026 Hazem Soussi <hazem.soussi@gmail.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Planet Earth News — local-first authentication.

Single-user, local-first auth model:
  * One opaque bearer token, generated on first run if absent, stored in .env
    (git-ignored, never committed). Printed once to the service log.
  * The dashboard HTML is public; every /api/* call MUST carry the token via
    `Authorization: Bearer <token>` (or a `__PEN_TOKEN__` bootstrap for the SPA).
  * No password, no external IdP — appropriate for a sovereign localhost app.
  * Verification is constant-time and fail-closed (missing/invalid => 401).
"""
from __future__ import annotations

import os
import secrets
from pathlib import Path

_ENV_FILE = Path(__file__).resolve().parent / ".env"
_TOKEN_VAR = "PEN_API_TOKEN"


def _parse_env_file() -> dict[str, str]:
    """Minimal KEY=VALUE .env reader (stdlib only, no external dep)."""
    out: dict[str, str] = {}
    if not _ENV_FILE.exists():
        return out
    for line in _ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def _ensure_env():
    for k, v in _parse_env_file().items():
        os.environ.setdefault(k, v)


def _generate_and_persist_token() -> str:
    """Create a fresh token, persist it to .env, and return it. Idempotent
    only when the file is absent; otherwise leaves the existing token."""
    token = secrets.token_urlsafe(32)
    # Write a minimal .env (preserve other keys if the file already exists).
    existing = {}
    if _ENV_FILE.exists():
        for line in _ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                existing[k.strip()] = v.strip()
    existing[_TOKEN_VAR] = token
    _ENV_FILE.write_text(
        "\n".join(f"{k}={v}" for k, v in existing.items()) + "\n", encoding="utf-8"
    )
    _ENV_FILE.chmod(0o600)
    return token


def get_token() -> str:
    """Return the active API token, generating + persisting one on first run."""
    _ensure_env()
    tok = os.environ.get(_TOKEN_VAR)
    if not tok:
        tok = _generate_and_persist_token()
        # Re-expose for the running process.
        os.environ[_TOKEN_VAR] = tok
        try:
            import sys

            print(
                f"[PEN] generated local API token (save this): {tok}\n"
                "      Store it; it is also in .env (chmod 600, git-ignored).",
                file=sys.stderr,
            )
        except Exception:
            pass
    return tok


def verify_token(provided: str | None) -> bool:
    """Constant-time verify a provided bearer token against the active one."""
    expected = get_token()
    if not provided or not expected:
        return False
    return secrets.compare_digest(provided, expected)
