"""
intelligence/analyzer.py - Page Content Analyzer

The PageAnalyzer class inspects HTML content to determine page type,
reading time, word count, technology stack, and security characteristics.
"""

from __future__ import annotations

import re
import urllib.parse
from typing import Any

from bs4 import BeautifulSoup


# --- Tech stack signatures ---

_TECH_SIGNATURES: dict[str, list[str]] = {
    "React": [
        "react", "reactdom", "react-dom", "__react", "data-reactroot",
        "data-reactid", "react.production",
    ],
    "Vue": [
        "vue.js", "vue.min.js", "vue.runtime", "__vue__", "data-v-",
        "vue-router", "vuex", "nuxt",
    ],
    "Angular": [
        "angular", "ng-version", "ng-app", "ng-controller",
        "angular.js", "angular.min.js", "@angular",
    ],
    "jQuery": [
        "jquery", "jquery.min.js", "jquery-ui", "jquery.mobile",
    ],
    "Bootstrap": [
        "bootstrap", "bootstrap.min.css", "bootstrap.min.js",
        "bootstrap.css", "bootstrap.js",
    ],
    "Tailwind CSS": [
        "tailwind", "tailwindcss", "tailwind.min.css",
    ],
    "WordPress": [
        "wp-content", "wp-includes", "wp-json", "wordpress",
        "wp-embed", "wp-block",
    ],
    "Django": [
        "django", "csrfmiddlewaretoken", "__django",
    ],
    "Flask": [
        "flask", "werkzeug",
    ],
    "Next.js": [
        "__NEXT_DATA__", "next.js", "/_next/",
    ],
    "Nuxt.js": [
        "__NUXT__", "nuxt.js", "/_nuxt/",
    ],
    "Svelte": [
        "svelte", "svelte-",
    ],
    "Ember": [
        "ember", "ember.js", "ember-data",
    ],
    "Backbone": [
        "backbone", "backbone.js",
    ],
    "Express": [
        "express",
    ],
    "Laravel": [
        "laravel", "livewire",
    ],
    "Shopify": [
        "shopify", "cdn.shopify.com",
    ],
    "Wix": [
        "wix", "wix.com", "wixstatic",
    ],
    "Squarespace": [
        "squarespace", "sqs-layout",
    ],
}

# --- Page type indicators ---

_PAGE_TYPE_INDICATORS: dict[str, dict[str, list[str]]] = {
    "article": {
        "tags": ["article"],
        "classes": ["post", "article", "entry", "blog-post", "story"],
        "ids": ["article", "post", "entry", "content"],
    },
    "product": {
        "tags": [],
        "classes": ["product", "product-page", "product-detail", "item"],
        "ids": ["product", "product-detail", "add-to-cart", "buy-now"],
    },
    "search_results": {
        "tags": [],
        "classes": ["results", "search-results", "search-result", "serp"],
        "ids": ["results", "search-results", "rso"],
    },
    "login": {
        "tags": [],
        "classes": ["login", "signin", "auth", "login-form", "sign-in"],
        "ids": ["login", "signin", "login-form", "auth"],
    },
    "video": {
        "tags": ["video"],
        "classes": ["video", "player", "video-player", "watch"],
        "ids": ["player", "video-player", "watch"],
    },
    "forum": {
        "tags": [],
        "classes": ["forum", "thread", "topic", "discussion", "post-list"],
        "ids": ["forum", "thread", "topic", "board"],
    },
    "news": {
        "tags": [],
        "classes": ["news", "headline", "breaking", "latest-news"],
        "ids": ["news", "headlines", "latest"],
    },
}

# --- Tracker/ad patterns ---

_TRACKER_PATTERNS = [
    "google-analytics", "googletagmanager", "gtag", "analytics.js",
    "facebook.net", "fbevents", "fbpixel",
    "doubleclick", "googlesyndication", "adservice",
    "hotjar", "mixpanel", "segment.com", "amplitude",
    "adsbygoogle", "amazon-adsystem", "criteo",
]

_MIXED_CONTENT_PATTERN = re.compile(
    r'(?:src|href|action)\s*=\s*["\']http://',
    re.IGNORECASE,
)


class PageAnalyzer:
    """Analyzes web page content for type, metrics, tech stack, and security."""

    # ------------------------------------------------------------------
    # Page type detection
    # ------------------------------------------------------------------

    def detect_page_type(self, html: str) -> str:
        """Detect the type of web page from its HTML content.

        Args:
            html: Raw HTML string.

        Returns:
            One of: 'article', 'product', 'search_results', 'login',
            'video', 'forum', 'news', 'unknown'.
        """
        if not html:
            return "unknown"

        try:
            soup = BeautifulSoup(html, "html.parser")
        except Exception:
            return "unknown"

        scores: dict[str, int] = {}

        for page_type, indicators in _PAGE_TYPE_INDICATORS.items():
            score = 0

            # Check tags
            for tag in indicators["tags"]:
                if soup.find(tag):
                    score += 3

            # Check classes
            for cls in indicators["classes"]:
                if soup.find(class_=re.compile(re.escape(cls), re.I)):
                    score += 2

            # Check IDs
            for id_val in indicators["ids"]:
                if soup.find(id=re.compile(re.escape(id_val), re.I)):
                    score += 2

            # Check URL-like patterns in forms
            if page_type == "login":
                forms = soup.find_all("form")
                for form in forms:
                    inputs = form.find_all("input")
                    has_password = any(
                        str(inp.get("type", "")).lower() == "password" for inp in inputs
                    )
                    if has_password:
                        score += 5

            # Check for video elements
            if page_type == "video":
                if soup.find("iframe", src=re.compile(r"youtube|vimeo|dailymotion", re.I)):
                    score += 5

            if score > 0:
                scores[page_type] = score

        if not scores:
            return "unknown"

        return max(scores, key=scores.get)  # type: ignore[arg-type]

    # ------------------------------------------------------------------
    # Reading time & word count
    # ------------------------------------------------------------------

    def extract_reading_time(self, html: str) -> int:
        """Estimate reading time in minutes.

        Uses an average reading speed of 225 words per minute.

        Args:
            html: Raw HTML string.

        Returns:
            Estimated reading time in minutes (minimum 1).
        """
        word_count = self.extract_word_count(html)
        minutes = max(1, round(word_count / 225))
        return minutes

    def extract_word_count(self, html: str) -> int:
        """Extract the word count from visible text in HTML.

        Args:
            html: Raw HTML string.

        Returns:
            Number of visible words.
        """
        if not html:
            return 0

        try:
            soup = BeautifulSoup(html, "html.parser")
        except Exception:
            return 0

        # Remove script, style, and other non-visible elements
        for element in soup(["script", "style", "noscript", "meta", "link", "head"]):
            element.decompose()

        text = soup.get_text(separator=" ", strip=True)
        words = text.split()
        return len(words)

    # ------------------------------------------------------------------
    # Tech stack detection
    # ------------------------------------------------------------------

    def detect_tech_stack(self, html: str) -> list[str]:
        """Detect the technology stack used by a web page.

        Args:
            html: Raw HTML string.

        Returns:
            List of detected technology names (e.g., ['React', 'Bootstrap']).
        """
        if not html:
            return []

        detected: list[str] = []
        html_lower = html.lower()

        for tech, signatures in _TECH_SIGNATURES.items():
            for sig in signatures:
                if sig.lower() in html_lower:
                    detected.append(tech)
                    break

        return detected

    # ------------------------------------------------------------------
    # Security rating
    # ------------------------------------------------------------------

    def get_security_rating(self, url: str, html: str) -> dict[str, Any]:
        """Evaluate the security characteristics of a page.

        Args:
            url: The page URL.
            html: Raw HTML string.

        Returns:
            Dict with keys:
                - https: bool
                - mixed_content: bool
                - trackers_detected: list[str]
                - tracker_count: int
                - has_password_field: bool
                - has_csp: bool
                - security_headers_hint: dict
                - overall_rating: str ('good', 'fair', 'poor')
        """
        result: dict[str, Any] = {
            "https": False,
            "mixed_content": False,
            "trackers_detected": [],
            "tracker_count": 0,
            "has_password_field": False,
            "has_csp": False,
            "security_headers_hint": {},
            "overall_rating": "fair",
        }

        # Check HTTPS
        parsed = urllib.parse.urlparse(url)
        result["https"] = parsed.scheme == "https"

        if not html:
            result["overall_rating"] = "poor" if not result["https"] else "fair"
            return result

        try:
            soup = BeautifulSoup(html, "html.parser")
        except Exception:
            return result

        # Check mixed content (HTTP resources on HTTPS page)
        if result["https"]:
            if _MIXED_CONTENT_PATTERN.search(html):
                result["mixed_content"] = True

        # Detect trackers
        html_lower = html.lower()
        for tracker in _TRACKER_PATTERNS:
            if tracker.lower() in html_lower:
                result["trackers_detected"].append(tracker)
        result["tracker_count"] = len(result["trackers_detected"])

        # Check for password fields
        password_inputs = soup.find_all("input", {"type": "password"})
        result["has_password_field"] = len(password_inputs) > 0

        # Check for CSP meta tag
        csp_meta = soup.find("meta", {"http-equiv": re.compile(r"content-security-policy", re.I)})
        result["has_csp"] = csp_meta is not None

        # Check for X-Frame-Options hint via meta
        frame_meta = soup.find("meta", {"http-equiv": re.compile(r"x-frame-options", re.I)})
        result["security_headers_hint"]["x_frame_options"] = frame_meta is not None

        # Compute overall rating
        issues = 0
        if not result["https"]:
            issues += 2
        if result["mixed_content"]:
            issues += 2
        if result["tracker_count"] > 3:
            issues += 1
        if result["tracker_count"] > 6:
            issues += 1
        if result["has_password_field"] and not result["https"]:
            issues += 3

        if issues == 0:
            result["overall_rating"] = "good"
        elif issues <= 2:
            result["overall_rating"] = "fair"
        else:
            result["overall_rating"] = "poor"

        return result
