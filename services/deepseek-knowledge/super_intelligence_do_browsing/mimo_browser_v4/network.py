"""MiMo Browser v4 — Network layer: DNS-over-HTTPS, connection management, request interception."""
from __future__ import annotations

import asyncio
import logging
import socket
import time
from typing import Any
from urllib.parse import urlparse

import aiohttp

logger = logging.getLogger("mimo.network")


class DNSOverHTTPS:
    """DNS-over-HTTPS resolver with caching."""

    def __init__(self, provider: str = "https://cloudflare-dns.com/dns-query") -> None:
        self.provider = provider
        self._cache: dict[str, dict] = {}
        self._cache_ttl = 300  # 5 minutes
        self._session: aiohttp.ClientSession | None = None
        self._resolved_count = 0
        self._cache_hits = 0

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                headers={"Accept": "application/dns-json"}
            )
        return self._session

    async def resolve(self, hostname: str) -> dict[str, Any]:
        """Resolve hostname via DoH. Returns {hostname, ips, from_cache, time_ms}."""
        now = time.time()

        # Check cache
        if hostname in self._cache:
            entry = self._cache[hostname]
            if now - entry["ts"] < self._cache_ttl:
                self._cache_hits += 1
                return {**entry["data"], "from_cache": True}

        start = time.time()
        try:
            session = await self._get_session()
            url = f"{self.provider}?name={hostname}&type=A"
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                data = await resp.json()
                ips = [
                    r["Data"]
                    for r in data.get("Answer", [])
                    if r.get("type") == 1 and "Data" in r
                ]
                elapsed = (time.time() - start) * 1000
                self._resolved_count += 1

                result = {
                    "hostname": hostname,
                    "ips": ips,
                    "resolved": len(ips) > 0,
                    "time_ms": round(elapsed, 1),
                    "from_cache": False,
                }

                # Cache result
                self._cache[hostname] = {"ts": now, "data": result}
                logger.debug("DoH resolved %s -> %s (%.1fms)", hostname, ips, elapsed)
                return result

        except Exception as e:
            elapsed = (time.time() - start) * 1000
            logger.warning("DoH resolution failed for %s: %s", hostname, e)
            # Fallback to system DNS
            try:
                loop = asyncio.get_event_loop()
                result = await loop.getaddrinfo(hostname, None)
                ips = list({r[4][0] for r in result})
                return {
                    "hostname": hostname,
                    "ips": ips,
                    "resolved": len(ips) > 0,
                    "time_ms": round(elapsed, 1),
                    "from_cache": False,
                    "fallback": True,
                }
            except socket.gaierror:
                return {
                    "hostname": hostname,
                    "ips": [],
                    "resolved": False,
                    "time_ms": round(elapsed, 1),
                    "error": str(e),
                }

    def get_stats(self) -> dict[str, Any]:
        return {
            "resolved": self._resolved_count,
            "cache_hits": self._cache_hits,
            "cache_size": len(self._cache),
            "provider": self.provider,
        }

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()


class ConnectionManager:
    """Manages HTTP connections with pooling and metrics."""

    def __init__(self, max_connections: int = 20) -> None:
        self.max_connections = max_connections
        self._session: aiohttp.ClientSession | None = None
        self._request_count = 0
        self._error_count = 0
        self._total_bytes = 0
        self._domain_times: dict[str, list[float]] = {}

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            connector = aiohttp.TCPConnector(
                limit=self.max_connections,
                ttl_dns_cache=300,
                enable_cleanup_closed=True,
            )
            timeout = aiohttp.ClientTimeout(total=30, connect=10)
            self._session = aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers={
                    "User-Agent": "MiMo/4.0 (Intelligent Browser)",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept-Encoding": "gzip, deflate, br",
                    "DNT": "1",
                    "Upgrade-Insecure-Requests": "1",
                },
            )
        return self._session

    async def fetch(self, url: str, headers: dict | None = None) -> dict[str, Any]:
        """Fetch URL and return {status, headers, body, time_ms, size, domain}."""
        start = time.time()
        domain = urlparse(url).netloc
        try:
            session = await self._get_session()
            merged_headers = {}
            if headers:
                merged_headers.update(headers)
            async with session.get(url, headers=merged_headers or None, allow_redirects=True) as resp:
                body = await resp.read()
                elapsed = (time.time() - start) * 1000
                self._request_count += 1
                self._total_bytes += len(body)

                if domain not in self._domain_times:
                    self._domain_times[domain] = []
                self._domain_times[domain].append(elapsed)

                return {
                    "status": resp.status,
                    "headers": dict(resp.headers),
                    "body": body,
                    "text": body.decode("utf-8", errors="replace"),
                    "time_ms": round(elapsed, 1),
                    "size": len(body),
                    "domain": domain,
                    "url": str(resp.url),
                }
        except Exception as e:
            elapsed = (time.time() - start) * 1000
            self._error_count += 1
            return {
                "status": 0,
                "error": str(e),
                "time_ms": round(elapsed, 1),
                "domain": domain,
                "url": url,
            }

    def get_stats(self) -> dict[str, Any]:
        avg_times = {}
        for domain, times in self._domain_times.items():
            avg_times[domain] = round(sum(times) / len(times), 1) if times else 0
        return {
            "requests": self._request_count,
            "errors": self._error_count,
            "total_mb": round(self._total_bytes / 1048576, 2),
            "avg_response_times": avg_times,
        }

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()


class RequestInterceptor:
    """Intercepts and modifies requests/responses. Handles ad blocking, header injection, etc."""

    def __init__(self, filter_engine=None, fingerprint_guard=None) -> None:
        self.filter_engine = filter_engine
        self.fingerprint_guard = fingerprint_guard
        self._blocked_count = 0
        self._modified_count = 0

    def should_block(self, url: str) -> bool:
        if self.filter_engine is None:
            return False
        domain = urlparse(url).netloc
        if self.filter_engine.should_block(url, domain):
            self._blocked_count += 1
            logger.debug("Blocked: %s", url)
            return True
        return False

    def get_privacy_headers(self) -> dict[str, str]:
        """Return privacy-enhancing headers."""
        return {
            "DNT": "1",
            "Sec-GPC": "1",  # Global Privacy Control
            "Accept-Language": "en-US,en;q=0.9",
        }

    def get_stats(self) -> dict[str, Any]:
        return {
            "blocked": self._blocked_count,
            "modified": self._modified_count,
        }
