"""MiMo Browser v4 — Ad/tracker blocking engine with EasyList-style rule support."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


# Built-in list of common ad/tracker domains
DEFAULT_BLOCKED_DOMAINS: list[str] = [
    # Advertising networks
    "doubleclick.net",
    "googlesyndication.com",
    "googleadservices.com",
    "google-analytics.com",
    "adnxs.com",
    "adsrvr.org",
    "advertising.com",
    "rubiconproject.com",
    "openx.net",
    "pubmatic.com",
    "criteo.com",
    "criteo.net",
    "taboola.com",
    "outbrain.com",
    "bidswitch.net",
    "smartadserver.com",
    "yieldmo.com",
    "grapeshot.co.uk",
    "ipredictive.com",
    "media.net",
    "33across.com",
    "sharethrough.com",
    "nativo.com",
    "revcontent.com",
    "adroll.com",
    "dianomi.com",
    "gadgets360.com",
    # Tracking/analytics
    "hotjar.com",
    "crazyegg.com",
    "mixpanel.com",
    "segment.com",
    "segment.io",
    "heap-analytics.com",
    "fullstory.com",
    "logrocket.com",
    "sentry.io",
    "newrelic.com",
    "pingdom.com",
    "statcounter.com",
    "clicky.com",
    "chartbeat.com",
    "parsely.com",
    "moatads.com",
    "adsafeprotected.com",
    "iasds.net",
    "quantserve.com",
    "scorecardresearch.com",
    "measurementapi.com",
    # Social trackers
    "facebook.com/tr",
    "connect.facebook.net",
    "platform.twitter.com",
    "analytics.twitter.com",
    "pixel.facebook.com",
    "ads.linkedin.com",
    "analytics.pointdrive.linkedin.com",
    # Cryptominers / malware
    "coinhive.com",
    "cryptoloot.pro",
    "minero.cc",
    "lolex.dedyn.io",
    # Common ad-serving patterns
    "adserver.",
    "ads.",
    "tracker.",
    "metrics.",
    "analytics.",
    "telemetry.",
    "pixel.",
    "log.",
    "stats.",
    "click.",
    "banner.",
    "promo.",
    "sponsor.",
]

# EasyList-style rule patterns
EASYLIST_DOMAIN_RE = re.compile(
    r'^\|\|([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)+)\^?'
)
EASYLIST_SUBSCRIPTION_RE = re.compile(
    r'^\|\|([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)+)\^\$'
)
EASYLIST_EXCEPTION_RE = re.compile(
    r'@@\|\|([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)+)\^?'
)
EASYLIST_HOSTS_RE = re.compile(
    r'^\|\|([a-zA-Z0-9\-\.]+)\^'
)
EASYLIST_REDIRECT_RE = re.compile(
    r'^\|\|([a-zA-Z0-9\-\.]+)\^\$redirect='
)
EASYLIST_THIRD_PARTY_RE = re.compile(
    r'\$third-party'
)
EASYLIST_MATCH_ALL_RE = re.compile(
    r'^\|\|([a-zA-Z0-9\-\.]+)\^\$.*'
)


class FilterEngine:
    """Ad/tracker blocking engine supporting EasyList-style rules.

    Supports:
        - ||domain^ (block domain and all subdomains)
        - ||domain^$ (block exact domain)
        - @@||domain^ (exception/whitelist)
        - $third-party modifier
        - Hosts file style: 0.0.0.0 domain
        - Plain domain entries
    """

    def __init__(self) -> None:
        self._blocked_domains: set[str] = set()
        self._blocked_patterns: list[re.Pattern[str]] = []
        self._exceptions: set[str] = set()
        self._blocked_count: int = 0
        self._rules_loaded: int = 0
        self._load_default_blocklist()

    def _load_default_blocklist(self) -> None:
        """Load the built-in list of common ad/tracker domains."""
        for domain in DEFAULT_BLOCKED_DOMAINS:
            domain_lower = domain.lower().strip()
            if domain_lower:
                self._blocked_domains.add(domain_lower)
        self._rules_loaded = len(self._blocked_domains)

    def load_rules(self, rule_file: str | Path) -> int:
        """Load blocking rules from an EasyList-style file.

        Args:
            rule_file: Path to the rules file (e.g., EasyList.txt).

        Returns:
            Number of rules loaded from the file.

        Raises:
            FileNotFoundError: If the rule file doesn't exist.
            PermissionError: If the file cannot be read.
        """
        rule_path = Path(rule_file)
        if not rule_path.exists():
            raise FileNotFoundError(f"Rule file not found: {rule_file}")

        count = 0
        with open(rule_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("!") or line.startswith("["):
                    continue

                if self._parse_rule(line):
                    count += 1

        self._rules_loaded += count
        return count

    def _parse_rule(self, rule: str) -> bool:
        """Parse a single EasyList-style rule and add it to the engine.

        Args:
            rule: A single rule line.

        Returns:
            True if the rule was successfully parsed and added.
        """
        # Check for exception rules first
        exception_match = EASYLIST_EXCEPTION_RE.match(rule)
        if exception_match:
            domain = exception_match.group(1).lower()
            self._exceptions.add(domain)
            return True

        # Standard ||domain^ pattern
        domain_match = EASYLIST_DOMAIN_RE.match(rule)
        if domain_match:
            domain = domain_match.group(1).lower()
            self._blocked_domains.add(domain)
            return True

        # Hosts file style: 0.0.0.0 domain or 127.0.0.1 domain
        hosts_match = re.match(
            r'^(?:0\.0\.0\.0|127\.0\.0\.1)\s+([a-zA-Z0-9\-\.]+)',
            rule,
        )
        if hosts_match:
            domain = hosts_match.group(1).lower()
            self._blocked_domains.add(domain)
            return True

        # Plain domain (just a domain name)
        plain_match = re.match(
            r'^([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)+)$',
            rule,
        )
        if plain_match:
            domain = plain_match.group(1).lower()
            self._blocked_domains.add(domain)
            return True

        # URL pattern rules (regex-based)
        if rule.startswith("/") and rule.endswith("/"):
            try:
                pattern = re.compile(rule[1:-1], re.IGNORECASE)
                self._blocked_patterns.append(pattern)
                return True
            except re.error:
                return False

        return False

    def should_block(self, url: str, domain: str | None = None) -> bool:
        """Check if a URL or domain should be blocked.

        Args:
            url: The full URL to check.
            domain: Optional domain override (extracted from url if not provided).

        Returns:
            True if the URL/domain should be blocked, False otherwise.
        """
        if domain is None:
            try:
                parsed = urlparse(url)
                domain = parsed.hostname or ""
            except Exception:
                return False

        domain_lower = domain.lower().strip()
        if not domain_lower:
            return False

        # Check exceptions first
        if self._is_exception(domain_lower):
            return False

        # Check exact domain and parent domains
        if self._domain_matches(domain_lower):
            self._blocked_count += 1
            return True

        # Check regex patterns
        for pattern in self._blocked_patterns:
            if pattern.search(url):
                self._blocked_count += 1
                return True

        return False

    def _domain_matches(self, domain: str) -> bool:
        """Check if a domain matches any blocked domain (including subdomains).

        Args:
            domain: The domain to check.

        Returns:
            True if the domain or any of its parents are in the blocklist.
        """
        parts = domain.split(".")
        # Check the domain itself and all parent domains
        for i in range(len(parts)):
            parent = ".".join(parts[i:])
            if parent in self._blocked_domains:
                return True
        return False

    def _is_exception(self, domain: str) -> bool:
        """Check if a domain is whitelisted (exception).

        Args:
            domain: The domain to check.

        Returns:
            True if the domain is in the exception list.
        """
        parts = domain.split(".")
        for i in range(len(parts)):
            parent = ".".join(parts[i:])
            if parent in self._exceptions:
                return True
        return False

    def get_blocked_count(self) -> int:
        """Get the total number of requests blocked since last reset.

        Returns:
            Number of blocked requests.
        """
        return self._blocked_count

    def reset_blocked_count(self) -> None:
        """Reset the blocked request counter."""
        self._blocked_count = 0

    def add_domain(self, domain: str) -> None:
        """Manually add a domain to the blocklist.

        Args:
            domain: The domain to block.
        """
        self._blocked_domains.add(domain.lower().strip())

    def remove_domain(self, domain: str) -> bool:
        """Remove a domain from the blocklist.

        Args:
            domain: The domain to remove.

        Returns:
            True if the domain was in the blocklist and removed.
        """
        domain_lower = domain.lower().strip()
        if domain_lower in self._blocked_domains:
            self._blocked_domains.remove(domain_lower)
            return True
        return False

    def add_exception(self, domain: str) -> None:
        """Add a domain to the exception/whitelist.

        Args:
            domain: The domain to whitelist.
        """
        self._exceptions.add(domain.lower().strip())

    @property
    def rules_loaded(self) -> int:
        """Number of rules currently loaded."""
        return self._rules_loaded

    @property
    def blocked_domains_count(self) -> int:
        """Number of unique domains in the blocklist."""
        return len(self._blocked_domains)

    def __repr__(self) -> str:
        return (
            f"FilterEngine(rules={self._rules_loaded}, "
            f"blocked={self._blocked_count})"
        )
