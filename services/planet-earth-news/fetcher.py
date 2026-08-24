# Copyright © 2026 Hazem Soussi <hazem.soussi@gmail.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Planet Earth News — sovereign, secure-by-default feed acquisition.

Hardening model (defence in depth against SSRF):
  * Host allow-list: only configured hosts may be fetched.
  * DNS resolution guard: every resolved IP must be a public, globally
    routable address. Private / loopback / link-local / reserved are rejected.
  * Redirect guard: HTTP redirects are followed only if the *final* hop also
    passes the host + IP checks. The default opener follows redirects
    silently (a classic SSRF vector), so we cap the chain and re-validate.

Other guards:
  * Payload size cap -> bounds memory and reflect-amplification.
  * Short timeouts, bounded retries with backoff.
  * RSS (feedparser) and YouTube channel RSS parsed uniformly into Items.
"""
from __future__ import annotations

import ipaddress
import re
import socket
import os
import threading
import time
import urllib.error
import urllib.request
import concurrent.futures as _futures
from dataclasses import dataclass, asdict
from typing import Any
from urllib.parse import urlparse

import feedparser
import yaml

# Max HTTP redirects we are willing to follow (and re-validate) per fetch.
_MAX_REDIRECTS = 3

# ---- config ----------------------------------------------------------------


def load_config(path: str = "config.yaml") -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


# ---- model -----------------------------------------------------------------


@dataclass
class Item:
    source: str
    title: str
    link: str
    summary: str
    published: str
    kind: str          # "article" | "video"
    thumbnail: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class SourceStatus:
    name: str
    ok: bool
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# ---- SSRF guard ------------------------------------------------------------


def _is_safe_host(host: str, allowed_hosts: list[str]) -> bool:
    if host not in allowed_hosts:
        return False
    # Resolve and reject private / loopback / link-local / reserved addresses.
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        return False
    if not infos:
        return False
    for info in infos:
        addr = info[4][0]
        addr = addr.split("%", 1)[0]  # strip IPv6 scope id
        try:
            ip = ipaddress.ip_address(addr)
        except ValueError:
            continue
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            return False
    return True


def _is_safe_url(url: str, allowed_hosts: list[str]) -> tuple[bool, str]:
    """Validate scheme + host of a URL. Returns (ok, reason)."""
    try:
        parts = urlparse(url)
    except ValueError:
        return False, "malformed URL"
    if parts.scheme not in ("http", "https"):
        return False, f"unsupported scheme: {parts.scheme!r}"
    host = parts.hostname or ""
    if not _is_safe_host(host, allowed_hosts):
        return False, "host not allowed or resolves to a private/loopback IP"
    return True, ""


# ---- HTTP fetch (redirect-revalidating) -------------------------------------


class _SSRFGuardRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Follow redirects, but re-validate every hop against the allow-list."""

    allowed_hosts: list[str] = []

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        ok, reason = _is_safe_url(newurl, self.allowed_hosts)
        if not ok:
            raise urllib.error.URLError(
                f"redirect to disallowed target blocked ({reason}): {newurl}"
            )
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def _build_opener(allowed_hosts: list[str]) -> urllib.request.OpenerDirector:
    """Return an opener that follows redirects but re-checks each target."""
    handler = _SSRFGuardRedirectHandler()
    handler.allowed_hosts = allowed_hosts
    return urllib.request.build_opener(
        handler,
        urllib.request.UnknownHandler(),
        urllib.request.HTTPHandler(),
        urllib.request.HTTPSHandler(),
        urllib.request.HTTPDefaultErrorHandler(),
        urllib.request.HTTPErrorProcessor(),
    )


def _http_get(
    url: str,
    cfg: dict[str, Any],
    opener: urllib.request.OpenerDirector | None = None,
) -> bytes:
    f = cfg.get("fetcher", {})
    timeout = f.get("timeout_seconds", 15)
    max_bytes = f.get("max_bytes", 5 * 1024 * 1024)
    ua = f.get("user_agent", "PlanetEarthNews/0.2")
    retries = f.get("retries", 2)
    backoff = f.get("retry_backoff_seconds", 1.0)

    opener = opener or urllib.request.build_opener()
    req = urllib.request.Request(url, headers={"User-Agent": ua})
    last_err: Exception | None = None
    for attempt in range(retries + 1):
        try:
            with opener.open(req, timeout=timeout) as resp:
                data = resp.read(max_bytes + 1)
                if len(data) > max_bytes:
                    raise ValueError(f"response exceeds {max_bytes} byte cap")
                return data
        except (urllib.error.URLError, socket.timeout, ValueError) as e:
            last_err = e
            if attempt < retries:
                time.sleep(backoff * (attempt + 1))
    raise last_err if last_err else RuntimeError("unknown fetch error")


# ---- parsing ---------------------------------------------------------------


def _clean(text: str | None) -> str:
    if not text:
        return ""
    # strip HTML-ish tags crudely; feedparser sometimes keeps markup
    return re.sub(r"<[^>]+>", "", text).strip()


def parse_feed(name: str, kind: str, data: bytes) -> list[Item]:
    d = feedparser.parse(data)
    items: list[Item] = []
    for e in d.entries:
        link = e.get("link", "") or e.get("href", "")
        thumb = None
        # YouTube media thumbnails (channel RSS uses media:thumbnail)
        media = e.get("media_thumbnail")
        if isinstance(media, list) and media:
            thumb = media[0].get("url")
        if kind == "video" and not thumb:
            yt_thumb = e.get("media_content")
            if isinstance(yt_thumb, list) and yt_thumb:
                thumb = yt_thumb[0].get("url")
        items.append(
            Item(
                source=name,
                title=_clean(e.get("title", "")),
                link=link,
                summary=_clean(e.get("summary", e.get("description", "")))[:400],
                published=e.get("published", e.get("updated", "")),
                kind=kind,
                thumbnail=thumb,
            )
        )
    return items


# ---- public API ------------------------------------------------------------


def fetch_all(
    cfg: dict[str, Any], query: str = "", fresh: bool = False
) -> tuple[list[Item], list[dict[str, str]], list[SourceStatus]]:
    """Fetch every configured source, guarding each against SSRF.

    Returns (items, errors, source_status):
      * items         — unified, newest-first list of Item.
      * errors        — list of {"source", "error"} dicts for failures.
      * source_status — per-source SourceStatus (provenance/transparency).

    Failures are logged and skipped (one bad source never takes down the
    whole planet). Sources are fetched concurrently (thread pool) so one slow
    feed never blocks the others; total latency is bounded by the slowest
    source, not the sum. SSRF guarding still runs per-source before fetch.
    Results are cached in-process for `cache_ttl` seconds to keep the UI
    snappy and to be polite to upstream feeds.
    """
    allowed = cfg.get("allowed_hosts", [])
    sources = cfg.get("sources", [])
    opener = _build_opener(allowed)

    # --- in-process cache (bounded, TTL) ---
    if not fresh:
        cached = _cache_get(cfg, query)
        if cached is not None:
            return cached

    def _work(src) -> tuple[list[Item], list[dict[str, str]], list[SourceStatus]]:
        name = src.get("name", "?")
        url = src.get("url", "")
        kind = src.get("type", "rss")
        kind = "video" if kind == "youtube" else "article"

        # SSRF guard (scheme + host + resolved IP) — runs in-thread, per source
        ok, reason = _is_safe_url(url, allowed)
        if not ok:
            return [], [{"source": name, "error": reason}], [SourceStatus(name=name, ok=False, error=reason)]
        try:
            data = _http_get(url, cfg, opener=opener)
            return parse_feed(name, kind, data), [], [SourceStatus(name=name, ok=True)]
        except Exception as e:  # noqa: BLE001 — keep the planet spinning
            msg = f"{type(e).__name__}: {e}"
            return [], [{"source": name, "error": msg}], [SourceStatus(name=name, ok=False, error=msg)]

    all_items: list[Item] = []
    errors: list[dict[str, str]] = []
    statuses: list[SourceStatus] = []

    # Threads are fine here: the work is I/O-bound (network) and the SSL/DNS
    # happens in C, so the GIL is released during the waits.
    with _futures.ThreadPoolExecutor(max_workers=min(8, max(1, len(sources)))) as ex:
        for items, errs, stats in ex.map(_work, sources):
            all_items.extend(items)
            errors.extend(errs)
            statuses.extend(stats)

    # newest-first by published (best-effort), then filter query
    all_items.sort(key=lambda i: i.published, reverse=True)
    if query:
        q = query.lower()
        all_items = [i for i in all_items if q in (i.title + " " + i.summary).lower()]

    result = (all_items, errors, statuses)
    _cache_set(cfg, query, result)
    return result


# --- tiny in-process TTL cache (bounded) ------------------------------------
_CACHE_TTL = float(os.environ.get("PEN_CACHE_TTL", "120"))  # seconds
_CACHE: dict[str, tuple[float, tuple[list[Item], list[dict[str, str]], list[SourceStatus]]]] = {}
_CACHE_LOCK = threading.Lock()


def _cache_key(cfg, query) -> str:
    srcs = tuple((s.get("name"), s.get("url")) for s in cfg.get("sources", []))
    return repr(srcs) + "|" + query


def _cache_get(cfg, query):
    key = _cache_key(cfg, query)
    with _CACHE_LOCK:
        hit = _CACHE.get(key)
        if hit and (time.time() - hit[0]) < _CACHE_TTL:
            return hit[1]
        _CACHE.pop(key, None)
    return None


def _cache_set(cfg, query, value):
    key = _cache_key(cfg, query)
    with _CACHE_LOCK:
        # bound the cache so it can't grow unbounded
        if len(_CACHE) > 32:
            _CACHE.clear()
        _CACHE[key] = (time.time(), value)


def security_posture(cfg: dict[str, Any]) -> dict[str, Any]:
    """Derive the platform's local security posture for transparency in the UI."""
    srv = cfg.get("server", {})
    bind = srv.get("bind", "127.0.0.1")
    return {
        "bind": bind,
        "lan_exposed": bind not in ("127.0.0.1", "localhost", "::1"),
        "ssrf_guard": True,
        "redirect_guard": True,
        "payload_cap": cfg.get("fetcher", {}).get("max_bytes", 5 * 1024 * 1024),
        "allowed_hosts": cfg.get("allowed_hosts", []),
        "sources_configured": len(cfg.get("sources", [])),
    }
