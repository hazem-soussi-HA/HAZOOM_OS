"""
intelligence/link_preview.py - Link Preview Generator

The LinkPreview class generates rich preview data for URLs by extracting
Open Graph metadata, titles, descriptions, and images from HTML.
"""

from __future__ import annotations

import re
import urllib.parse
from typing import Any

from bs4 import BeautifulSoup


# --- Suspicious domain patterns ---

_SUSPICIOUS_TLDS = {
    ".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".buzz", ".club",
}

_SUSPICIOUS_KEYWORDS = [
    "free", "win", "winner", "prize", "lottery", "jackpot", "claim",
    "urgent", "verify", "suspended", "locked", "confirm", "update-account",
]


class LinkPreview:
    """Generates rich link previews from URLs and HTML content.

    Usage:
        preview = LinkPreview()
        data = preview.generate_preview("https://example.com", html_content)
        # {'title': '...', 'description': '...', 'image': '...', ...}
    """

    def generate_preview(self, url: str, html: str) -> dict[str, Any]:
        """Generate a link preview from a URL and its HTML content.

        Args:
            url: The URL of the page.
            html: Raw HTML string.

        Returns:
            Dict with keys:
                - title: str
                - description: str
                - image: str (URL or empty string)
                - domain: str
                - favicon: str (URL or empty string)
                - safety_rating: dict
        """
        result: dict[str, Any] = {
            "title": "",
            "description": "",
            "image": "",
            "domain": "",
            "favicon": "",
            "safety_rating": {
                "score": 0,
                "suspicious": False,
                "reasons": [],
            },
        }

        # Extract domain
        parsed = urllib.parse.urlparse(url)
        domain = parsed.netloc or parsed.path
        result["domain"] = domain

        # Default favicon
        if domain:
            result["favicon"] = f"https://{domain}/favicon.ico"

        if not html:
            return result

        try:
            soup = BeautifulSoup(html, "html.parser")
        except Exception:
            return result

        # --- Extract Open Graph metadata ---

        # Title
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            result["title"] = str(og_title["content"]).strip()
        else:
            # Fallback to <title>
            title_tag = soup.find("title")
            if title_tag and title_tag.string:
                result["title"] = title_tag.string.strip()
            else:
                # Fallback to first <h1>
                h1 = soup.find("h1")
                if h1:
                    result["title"] = h1.get_text(strip=True)

        # Description
        og_desc = soup.find("meta", property="og:description")
        if og_desc and og_desc.get("content"):
            result["description"] = str(og_desc["content"]).strip()
        else:
            # Fallback to meta description
            meta_desc = soup.find("meta", attrs={"name": re.compile(r"description", re.I)})
            if meta_desc and meta_desc.get("content"):
                result["description"] = str(meta_desc["content"]).strip()
            else:
                # Fallback to first paragraph
                p = soup.find("p")
                if p:
                    text = p.get_text(strip=True)
                    result["description"] = text[:300]

        # Image
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            result["image"] = self._resolve_url(str(og_image["content"]).strip(), url)
        else:
            # Fallback to first <img>
            img = soup.find("img", src=True)
            if img:
                result["image"] = self._resolve_url(str(img["src"]), url)

        # Favicon (override default)
        icon_link = soup.find("link", rel=re.compile(r"icon", re.I))
        if icon_link and icon_link.get("href"):
            result["favicon"] = self._resolve_url(str(icon_link["href"]), url)

        # --- Safety rating ---
        result["safety_rating"] = self._assess_safety(url, domain)

        return result

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _resolve_url(src: str, base_url: str) -> str:
        """Resolve a relative URL against a base URL."""
        if not src:
            return ""
        if src.startswith(("http://", "https://", "data:")):
            return src
        try:
            return urllib.parse.urljoin(base_url, src)
        except Exception:
            return src

    @staticmethod
    def _assess_safety(url: str, domain: str) -> dict[str, Any]:
        """Assess the safety of a URL."""
        reasons: list[str] = []
        score = 100

        # Check HTTPS
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != "https":
            score -= 20
            reasons.append("Not using HTTPS")

        # Check suspicious TLDs
        domain_lower = domain.lower()
        for tld in _SUSPICIOUS_TLDS:
            if domain_lower.endswith(tld):
                score -= 15
                reasons.append(f"Suspicious TLD: {tld}")
                break

        # Check suspicious keywords in URL
        url_lower = url.lower()
        for keyword in _SUSPICIOUS_KEYWORDS:
            if keyword in url_lower:
                score -= 10
                reasons.append(f"Suspicious keyword in URL: {keyword}")

        # Check for excessive subdomains
        parts = domain.split(".")
        if len(parts) > 3:
            score -= 10
            reasons.append("Excessive subdomains")

        # Check for IP address instead of domain
        if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", domain):
            score -= 15
            reasons.append("IP address instead of domain name")

        score = max(0, min(100, score))

        return {
            "score": score,
            "suspicious": score < 70,
            "reasons": reasons,
        }
