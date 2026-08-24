"""MiMo Browser v4 — Security middleware: auth, rate limiting, request guards."""
from __future__ import annotations

import asyncio
import hashlib
import hmac
import logging
import time
from collections import defaultdict
from typing import Any
from urllib.parse import urlparse

import aiohttp
from aiohttp import web

logger = logging.getLogger("mimo.middleware")

# ─── Rate Limiter ────────────────────────────────────────────────────────────

class RateLimiter:
    """Token-bucket rate limiter per IP, per endpoint."""

    def __init__(
        self,
        requests_per_minute: int = 120,
        burst: int = 20,
    ) -> None:
        self.rate = requests_per_minute / 60.0  # tokens per second
        self.burst = burst
        self._buckets: dict[str, dict[str, Any]] = defaultdict(
            lambda: {"tokens": burst, "last": time.monotonic()}
        )
        self._lock = asyncio.Lock()

    async def allow(self, client_ip: str, endpoint: str = "*") -> bool:
        key = f"{client_ip}:{endpoint}"
        async with self._lock:
            now = time.monotonic()
            bucket = self._buckets[key]
            elapsed = now - bucket["last"]
            bucket["tokens"] = min(
                self.burst, bucket["tokens"] + elapsed * self.rate
            )
            bucket["last"] = now
            if bucket["tokens"] >= 1.0:
                bucket["tokens"] -= 1.0
                return True
            return False


# ─── Auth ─────────────────────────────────────────────────────────────────────

class AuthMiddleware:
    """Optional API-key or basic-auth middleware.

    Activated only when MIIMO_API_KEY env var is set.
    When not set, all requests are allowed (backward compatible).
    """

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key
        self._enabled = api_key is not None and len(api_key) > 0

    @property
    def enabled(self) -> bool:
        return self._enabled

    def check_key(self, provided: str | None) -> bool:
        if not self._enabled:
            return True
        if not provided:
            return False
        return hmac.compare_digest(provided, self.api_key or "")

    def extract_key(self, request: web.Request) -> str | None:
        # Check X-API-Key header
        key = request.headers.get("X-API-Key")
        if key:
            return key
        # Check ?api_key= query param
        key = request.query.get("api_key")
        if key:
            return key
        # Check Authorization: Bearer <key>
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            return auth[7:]
        return None


# ─── Shared aiohttp session ──────────────────────────────────────────────────

class SharedSession:
    """Reusable aiohttp.ClientSession for proxy requests.

    Fixes the per-request session leak. Session is created once
    and reused for all proxy/download requests.
    """

    _session: aiohttp.ClientSession | None = None
    _lock = asyncio.Lock()

    @classmethod
    async def get(cls) -> aiohttp.ClientSession:
        if cls._session is None or cls._session.closed:
            async with cls._lock:
                if cls._session is None or cls._session.closed:
                    cls._session = aiohttp.ClientSession(
                        timeout=aiohttp.ClientTimeout(total=30),
                        max_line_size=8192,
                        max_field_size=8192,
                    )
        return cls._session

    @classmethod
    async def close(cls) -> None:
        if cls._session and not cls._session.closed:
            await cls._session.close()
            cls._session = None


# ─── URL Validator (SSRF guard) ──────────────────────────────────────────────

# Schemes that are NEVER allowed through the proxy
BLOCKED_SCHEMES = frozenset({"file", "ftp", "gopher", "telnet", "ldap", "dict"})

# Additional blocked host patterns
BLOCKED_HOSTS = frozenset({
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "[::1]",
})


def validate_proxy_url(url: str) -> tuple[bool, str]:
    """Validate a URL for the proxy endpoint.

    Returns (allowed, reason_if_blocked).
    """
    try:
        parsed = urlparse(url)
    except Exception:
        return False, "Invalid URL"

    if parsed.scheme in BLOCKED_SCHEMES:
        return False, f"Scheme '{parsed.scheme}' not allowed"

    if parsed.scheme not in ("http", "https"):
        return False, f"Scheme '{parsed.scheme}' not allowed"

    hostname = parsed.hostname
    if not hostname:
        return False, "No hostname"

    if hostname in BLOCKED_HOSTS:
        return False, "Blocked host"

    # Check for IP-based blocking
    import ipaddress
    import socket

    try:
        # Try parsing as IP directly
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
            return False, "Blocked: private/internal IP"
    except ValueError:
        # It's a hostname — resolve it
        try:
            loop = asyncio.get_event_loop()
            # Use getaddrinfo for DNS resolution
            addr_infos = socket.getaddrinfo(hostname, parsed.port or 443)
            for family, _, _, _, sockaddr in addr_infos:
                ip = ipaddress.ip_address(sockaddr[0])
                if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
                    return False, "Blocked: resolves to private/internal IP"
        except socket.gaierror:
            return False, "Cannot resolve hostname"

    return True, ""
