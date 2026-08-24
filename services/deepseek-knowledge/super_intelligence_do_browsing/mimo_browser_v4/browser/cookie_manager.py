"""MiMo Browser v4 — Cookie Manager.
Handles cookie storage, retrieval, and privacy controls.
Inspired by: "Les cookies sont des fichiers, déposés côté client,
dans lesquels le serveur écrit des données servant à lier à une visite
toute information d'état."""
from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

logger = logging.getLogger("mimo.v4.cookie")


@dataclass
class Cookie:
    """Represents a single HTTP cookie."""
    name: str
    value: str
    domain: str
    path: str = "/"
    expires: float = 0.0  # 0 = session cookie
    secure: bool = False
    http_only: bool = False
    same_site: str = "Lax"
    created_at: float = field(default_factory=time.time)

    @property
    def is_expired(self) -> bool:
        if self.expires == 0:
            return False
        return time.time() > self.expires

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "value": self.value,
            "domain": self.domain,
            "path": self.path,
            "expires": self.expires,
            "secure": self.secure,
            "http_only": self.http_only,
            "same_site": self.same_site,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Cookie:
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


class CookieManager:
    """Manages cookies with privacy controls and domain isolation."""

    def __init__(self, storage_path: str = "./data/cookies.json") -> None:
        self._path = Path(storage_path)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._cookies: dict[str, list[Cookie]] = {}  # domain -> [Cookie]
        self._incognito: bool = False
        self._block_third_party: bool = True
        self._load()

    def _load(self) -> None:
        if self._path.exists():
            try:
                data = json.loads(self._path.read_text())
                for domain, cookies in data.items():
                    self._cookies[domain] = [
                        Cookie.from_dict(c) for c in cookies if not Cookie.from_dict(c).is_expired
                    ]
            except Exception as e:
                logger.warning("Failed to load cookies: %s", e)

    def _save(self) -> None:
        if self._incognito:
            return
        try:
            data = {
                domain: [c.to_dict() for c in cookies if not c.is_expired]
                for domain, cookies in self._cookies.items()
            }
            self._path.write_text(json.dumps(data, indent=2))
        except Exception as e:
            logger.warning("Failed to save cookies: %s", e)

    def set_cookie(self, url: str, name: str, value: str, **kwargs: Any) -> None:
        """Set a cookie for the given URL's domain."""
        parsed = urlparse(url)
        domain = parsed.hostname or ""
        if not domain:
            return

        if self._block_third_party and self._is_third_party(url, domain):
            logger.debug("Blocked third-party cookie: %s from %s", name, domain)
            return

        cookie = Cookie(name=name, value=value, domain=domain, **kwargs)
        if domain not in self._cookies:
            self._cookies[domain] = []
        # Replace existing or add new
        self._cookies[domain] = [c for c in self._cookies[domain] if c.name != name]
        self._cookies[domain].append(cookie)
        self._save()

    def get_cookies(self, url: str) -> list[Cookie]:
        """Get all valid cookies for the given URL."""
        parsed = urlparse(url)
        domain = parsed.hostname or ""
        result = []
        for cookie_domain, cookies in self._cookies.items():
            if domain == cookie_domain or domain.endswith("." + cookie_domain):
                for cookie in cookies:
                    if not cookie.is_expired:
                        if cookie.secure and parsed.scheme != "https":
                            continue
                        result.append(cookie)
        return result

    def get_cookie_header(self, url: str) -> str:
        """Build the Cookie header value for a request."""
        cookies = self.get_cookies(url)
        return "; ".join(f"{c.name}={c.value}" for c in cookies)

    def delete_cookie(self, domain: str, name: str) -> bool:
        """Delete a specific cookie."""
        if domain in self._cookies:
            original_len = len(self._cookies[domain])
            self._cookies[domain] = [c for c in self._cookies[domain] if c.name != name]
            if not self._cookies[domain]:
                del self._cookies[domain]
            self._save()
            return len(self._cookies.get(domain, [])) < original_len
        return False

    def clear_domain(self, domain: str) -> int:
        """Clear all cookies for a domain. Returns count cleared."""
        if domain in self._cookies:
            count = len(self._cookies[domain])
            del self._cookies[domain]
            self._save()
            return count
        return 0

    def clear_all(self) -> int:
        """Clear all cookies. Returns count cleared."""
        count = sum(len(c) for c in self._cookies.values())
        self._cookies.clear()
        self._save()
        return count

    def list_all(self) -> dict[str, list[dict[str, Any]]]:
        """List all cookies grouped by domain."""
        return {
            domain: [c.to_dict() for c in cookies if not c.is_expired]
            for domain, cookies in sorted(self._cookies.items())
        }

    def set_incognito(self, enabled: bool) -> None:
        """Enable/disable incognito mode (don't persist cookies)."""
        self._incognito = enabled

    def set_block_third_party(self, enabled: bool) -> None:
        self._block_third_party = enabled

    def _is_third_party(self, url: str, cookie_domain: str) -> bool:
        """Check if a cookie is third-party relative to the URL."""
        parsed = urlparse(url)
        page_domain = parsed.hostname or ""
        return cookie_domain != page_domain and not page_domain.endswith("." + cookie_domain)

    @property
    def stats(self) -> dict[str, int]:
        return {
            "domains": len(self._cookies),
            "total": sum(len(c) for c in self._cookies.values()),
            "incognito": 1 if self._incognito else 0,
        }
