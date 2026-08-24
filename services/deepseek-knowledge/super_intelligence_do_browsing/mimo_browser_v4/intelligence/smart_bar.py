"""
intelligence/smart_bar.py - Smart Address Bar NLP

The SmartBar class interprets address bar input, distinguishing between
URLs, search queries, browser commands, and AI actions.
"""

from __future__ import annotations

import re
import urllib.parse
import typing as _typing

# --- Patterns ---

_URL_PATTERN = re.compile(
    r"^(?:https?://|ftp://|file://|www\.)[^\s]+$"
    r"|^[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?"
    r"\.(?:com|org|net|io|dev|app|gov|edu|co|us|uk|de|fr|jp|cn|ru|br|in|info|biz|tv|cc|me|xyz)"
    r"(?:[/\?#][^\s]*)?$",
    re.IGNORECASE,
)

_IPV4_PATTERN = re.compile(
    r"^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:/[^\s]*)?$"
)

_LOCALHOST_PATTERN = re.compile(
    r"^localhost(?::\d+)?(?:/[^\s]*)?$", re.IGNORECASE
)

_COMMAND_MAP: dict[str, list[str]] = {
    "new_tab": ["new tab", "newtab", "open new tab", "open tab"],
    "close_tab": ["close tab", "closetab", "close this tab"],
    "refresh": ["refresh", "reload", "reload page", "refresh page"],
    "go_back": ["go back", "back"],
    "go_forward": ["go forward", "forward"],
    "bookmark": ["bookmark", "save page", "add bookmark", "favorite", "favourite"],
    "history": ["history", "show history", "browsing history"],
    "downloads": ["downloads", "show downloads"],
    "settings": ["settings", "preferences", "options"],
    "fullscreen": ["fullscreen", "full screen", "toggle fullscreen"],
    "zoom_in": ["zoom in", "enlarge"],
    "zoom_out": ["zoom out", "shrink"],
    "print": ["print", "print page"],
    "find": ["find", "find on page", "search page"],
    "devtools": ["devtools", "developer tools", "inspect", "inspect element"],
    "incognito": ["incognito", "private browsing", "private mode", "new incognito"],
    "clear_data": ["clear data", "clear cookies", "clear cache", "clear browsing data"],
    "screenshot": ["screenshot", "capture page", "take screenshot"],
    "read_mode": ["read mode", "reading mode", "reader view"],
    "dark_mode": ["dark mode", "dark theme", "night mode"],
    "about": ["about", "about:blank", "about:version", "about:credits"],
}

_ACTION_MAP: dict[str, list[str]] = {
    "summarize": ["summarize", "summary", "summarise", "tl;dr", "tldr", "overview"],
    "translate": ["translate", "translation"],
    "explain": ["explain", "define", "meaning of", "what does"],
    "compare": ["compare", "versus", "vs", "difference between"],
    "extract": ["extract", "scrape", "pull data"],
    "fill_form": ["fill form", "autofill", "auto fill"],
    "download": ["download", "save file"],
    "share": ["share", "send to", "email this"],
    "read_aloud": ["read aloud", "read out loud", "speak", "text to speech"],
    "bookmark_all": ["bookmark all", "save all tabs"],
    "close_others": ["close other tabs", "close others"],
    "mute": ["mute", "mute tab", "mute site"],
    "pin": ["pin tab", "pin this tab"],
}

_SEARCH_PREFIXES = [
    "search", "find", "look up", "look for", "google", "bing", "duckduckgo",
    "search for", "find me", "show me",
]


class SmartBar:
    """Smart address bar that interprets user input using NLP heuristics.

    Usage:
        bar = SmartBar()
        result = bar.interpret_input("python.org")
        # {'type': 'url', 'value': 'https://python.org', 'confidence': 0.95}
    """

    def interpret_input(self, text: str) -> dict[str, _typing.Any]:
        """Interpret address bar input and classify it.

        Args:
            text: Raw user input from the address bar.

        Returns:
            Dict with keys:
                - type: One of 'url', 'search', 'command', 'action'
                - value: The extracted/normalized value
                - confidence: Float 0.0-1.0
                - details: Additional context
        """
        if not text or not text.strip():
            return {
                "type": "search",
                "value": "",
                "confidence": 0.0,
                "details": {"reason": "empty input"},
            }

        text = text.strip()

        # 1. Check for URL
        url_result = self._try_url(text)
        if url_result:
            return url_result

        # 2. Check for command
        cmd_result = self._try_command(text)
        if cmd_result:
            return cmd_result

        # 3. Check for action
        action_result = self._try_action(text)
        if action_result:
            return action_result

        # 4. Check for search with prefix
        search_result = self._try_search(text)
        if search_result:
            return search_result

        # 5. Default: treat as search
        return {
            "type": "search",
            "value": text,
            "confidence": 0.6,
            "details": {"reason": "default to search"},
        }

    # ------------------------------------------------------------------
    # Internal matchers
    # ------------------------------------------------------------------

    def _try_url(self, text: str) -> dict[str, _typing.Any] | None:
        """Check if input is a URL."""
        # Direct URL with scheme
        if text.startswith(("http://", "https://", "ftp://", "file://")):
            return {
                "type": "url",
                "value": text,
                "confidence": 1.0,
                "details": {"scheme": urllib.parse.urlparse(text).scheme},
            }

        # localhost
        if _LOCALHOST_PATTERN.match(text):
            return {
                "type": "url",
                "value": "http://" + text,
                "confidence": 0.98,
                "details": {"localhost": True},
            }

        # IP address
        if _IPV4_PATTERN.match(text):
            return {
                "type": "url",
                "value": "http://" + text,
                "confidence": 0.95,
                "details": {"ip_address": True},
            }

        # Domain pattern
        if _URL_PATTERN.match(text):
            url = "https://" + text if not text.startswith("www.") else "https://" + text
            return {
                "type": "url",
                "value": url,
                "confidence": 0.95,
                "details": {"auto_scheme": True},
            }

        return None

    def _try_command(self, text: str) -> dict[str, _typing.Any] | None:
        """Check if input is a browser command."""
        text_lower = text.lower().strip()
        for command, keywords in _COMMAND_MAP.items():
            for kw in keywords:
                if text_lower == kw:
                    return {
                        "type": "command",
                        "value": command,
                        "confidence": 0.95,
                        "details": {"matched_keyword": kw},
                    }
                if text_lower.startswith(kw + " "):
                    return {
                        "type": "command",
                        "value": command,
                        "confidence": 0.85,
                        "details": {"matched_keyword": kw},
                    }
        return None

    def _try_action(self, text: str) -> dict[str, _typing.Any] | None:
        """Check if input is an AI action request."""
        text_lower = text.lower().strip()
        for action, keywords in _ACTION_MAP.items():
            for kw in keywords:
                if text_lower == kw:
                    return {
                        "type": "action",
                        "value": action,
                        "confidence": 0.9,
                        "details": {"matched_keyword": kw},
                    }
                if text_lower.startswith(kw + " "):
                    return {
                        "type": "action",
                        "value": action,
                        "confidence": 0.8,
                        "details": {"matched_keyword": kw},
                    }
        return None

    def _try_search(self, text: str) -> dict[str, _typing.Any] | None:
        """Check if input is a search query with a known prefix."""
        text_lower = text.lower().strip()
        for prefix in _SEARCH_PREFIXES:
            if text_lower.startswith(prefix):
                search_term = text[len(prefix):].strip()
                return {
                    "type": "search",
                    "value": search_term or text,
                    "confidence": 0.85,
                    "details": {"matched_prefix": prefix},
                }
        return None
