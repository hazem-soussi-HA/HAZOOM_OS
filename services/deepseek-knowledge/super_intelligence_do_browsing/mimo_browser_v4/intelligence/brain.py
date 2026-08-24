"""
intelligence/brain.py - Core Intelligence Engine

The Brain class is the central decision-making component of MiMo Browser v4.
It analyzes user intent, decides on actions, and learns from results using
simple NLP heuristics (no ML required).
"""

from __future__ import annotations

import re
import urllib.parse
from typing import Any


# --- Intent detection patterns ---

_URL_PATTERN = re.compile(
    r"^(https?://|www\.)[^\s]+|[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?"
    r"\.(com|org|net|io|dev|app|gov|edu|co|us|uk|de|fr|jp|cn|ru|br|in|info|biz)"
    r"([/\?#][^\s]*)?$",
    re.IGNORECASE,
)

_COMMAND_KEYWORDS: dict[str, list[str]] = {
    "new_tab": ["new tab", "open tab", "newtab", "open new tab"],
    "close_tab": ["close tab", "closetab", "close this tab"],
    "refresh": ["refresh", "reload", "reload page", "refresh page"],
    "go_back": ["go back", "back", "previous page"],
    "go_forward": ["go forward", "forward", "next page"],
    "bookmark": ["bookmark", "save page", "add bookmark", "favorite"],
    "history": ["history", "show history", "browsing history"],
    "downloads": ["downloads", "show downloads", "download history"],
    "settings": ["settings", "preferences", "options", "config"],
    "fullscreen": ["fullscreen", "full screen", "toggle fullscreen"],
    "zoom_in": ["zoom in", "enlarge", "increase zoom"],
    "zoom_out": ["zoom out", "shrink", "decrease zoom"],
    "print": ["print", "print page", "print this page"],
    "find": ["find", "find on page", "search page", "find in page"],
    "devtools": ["devtools", "developer tools", "inspect", "inspect element"],
    "incognito": ["incognito", "private browsing", "private mode", "new incognito"],
    "clear_data": ["clear data", "clear cookies", "clear cache", "clear browsing data"],
    "screenshot": ["screenshot", "capture page", "take screenshot"],
    "read_mode": ["read mode", "reading mode", "reader view"],
    "dark_mode": ["dark mode", "dark theme", "night mode"],
}

_ACTION_KEYWORDS: dict[str, list[str]] = {
    "summarize": ["summarize", "summary", "summarise", "tl;dr", "tldr", "overview"],
    "translate": ["translate", "translation", "convert language"],
    "explain": ["explain", "what is", "what are", "define", "meaning of"],
    "compare": ["compare", "versus", "vs", "difference between", "differences"],
    "extract": ["extract", "scrape", "pull data", "get data from"],
    "fill_form": ["fill form", "autofill", "auto fill", "complete form"],
    "download": ["download", "save file", "download file", "save as"],
    "share": ["share", "send to", "email this", "share page"],
}

_SEARCH_INDICATORS = [
    "search", "find", "look up", "look for", "google", "bing", "duckduckgo",
    "search for", "find me", "show me", "what is", "who is", "how to",
    "why does", "when did", "where is", "best", "top", "cheapest",
    "review", "reviews", "tutorial", "guide", "documentation",
]


class Brain:
    """Core intelligence engine for MiMo Browser v4.

    Uses keyword matching, URL detection, and simple heuristics to
    understand user intent and decide on appropriate actions.
    """

    def __init__(self) -> None:
        self._action_history: list[dict[str, Any]] = []
        self._intent_stats: dict[str, int] = {}
        self._success_rates: dict[str, list[bool]] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def analyze_intent(self, query: str) -> dict[str, Any]:
        """Analyze a user query and classify its intent.

        Args:
            query: Raw user input string.

        Returns:
            Dict with keys:
                - intent: One of 'url', 'search', 'command', 'action', 'natural_language'
                - value: The extracted/normalized value
                - confidence: Float 0.0-1.0
                - details: Additional context dict
        """
        if not query or not query.strip():
            return {
                "intent": "natural_language",
                "value": "",
                "confidence": 0.0,
                "details": {"reason": "empty query"},
            }

        query = query.strip()

        # 1. Check for URL
        url_result = self._check_url(query)
        if url_result:
            return url_result

        # 2. Check for command
        cmd_result = self._check_command(query)
        if cmd_result:
            return cmd_result

        # 3. Check for action
        action_result = self._check_action(query)
        if action_result:
            return action_result

        # 4. Check for search
        search_result = self._check_search(query)
        if search_result:
            return search_result

        # 5. Default: natural language
        return {
            "intent": "natural_language",
            "value": query,
            "confidence": 0.5,
            "details": {
                "reason": "no specific pattern matched",
                "word_count": len(query.split()),
            },
        }

    def decide_action(self, context: dict[str, Any]) -> str:
        """Decide the best action given a browsing context.

        Args:
            context: Dict that may contain keys like:
                - 'intent': previously detected intent
                - 'url': current page URL
                - 'page_type': detected page type
                - 'user_input': raw user input
                - 'history': list of recent actions

        Returns:
            Action string like 'navigate', 'search', 'execute_command',
            'perform_action', 'ask_clarification'.
        """
        intent = context.get("intent", "")
        page_type = context.get("page_type", "unknown")

        if intent == "url":
            return "navigate"
        if intent == "search":
            return "search"
        if intent == "command":
            return "execute_command"
        if intent == "action":
            return "perform_action"

        # Natural language — use context to decide
        if page_type in ("article", "news"):
            return "perform_action"
        if page_type == "search_results":
            return "navigate"
        if page_type == "login":
            return "ask_clarification"

        # Check history for patterns
        history = context.get("history", [])
        if history:
            recent = history[-3:]
            nav_count = sum(1 for h in recent if h.get("action") == "navigate")
            if nav_count >= 2:
                return "ask_clarification"

        return "ask_clarification"

    def learn_from_result(self, action: str, result: dict[str, Any]) -> None:
        """Update internal models based on action outcomes.

        Args:
            action: The action that was taken.
            result: Dict with outcome info, must contain 'success' (bool).
        """
        entry = {"action": action, "result": result}
        self._action_history.append(entry)

        # Track success rates
        success = result.get("success", True)
        if action not in self._success_rates:
            self._success_rates[action] = []
        self._success_rates[action].append(success)

        # Track intent stats
        intent = result.get("intent", "unknown")
        self._intent_stats[intent] = self._intent_stats.get(intent, 0) + 1

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _check_url(self, query: str) -> dict[str, Any] | None:
        """Check if the query is a URL."""
        # Direct URL with scheme
        if query.startswith(("http://", "https://", "ftp://", "file://")):
            return {
                "intent": "url",
                "value": query,
                "confidence": 1.0,
                "details": {"scheme": urllib.parse.urlparse(query).scheme},
            }

        # Domain-like pattern
        if _URL_PATTERN.match(query):
            # Ensure scheme
            url = query if query.startswith("www.") else query
            if url.startswith("www."):
                url = "https://" + url
            else:
                url = "https://" + url
            return {
                "intent": "url",
                "value": url,
                "confidence": 0.95,
                "details": {"auto_scheme": True},
            }

        return None

    def _check_command(self, query: str) -> dict[str, Any] | None:
        """Check if the query is a browser command."""
        query_lower = query.lower().strip()
        for command, keywords in _COMMAND_KEYWORDS.items():
            for kw in keywords:
                if query_lower == kw or query_lower.startswith(kw + " "):
                    return {
                        "intent": "command",
                        "value": command,
                        "confidence": 0.95 if query_lower == kw else 0.85,
                        "details": {"matched_keyword": kw},
                    }
        return None

    def _check_action(self, query: str) -> dict[str, Any] | None:
        """Check if the query is an AI action request."""
        query_lower = query.lower().strip()
        for action, keywords in _ACTION_KEYWORDS.items():
            for kw in keywords:
                if query_lower == kw or query_lower.startswith(kw + " "):
                    return {
                        "intent": "action",
                        "value": action,
                        "confidence": 0.9 if query_lower == kw else 0.8,
                        "details": {"matched_keyword": kw},
                    }
        return None

    def _check_search(self, query: str) -> dict[str, Any] | None:
        """Check if the query is a search query."""
        query_lower = query.lower().strip()

        for indicator in _SEARCH_INDICATORS:
            if query_lower.startswith(indicator):
                search_term = query[len(indicator):].strip()
                return {
                    "intent": "search",
                    "value": search_term or query,
                    "confidence": 0.85,
                    "details": {"matched_indicator": indicator},
                }

        # Multi-word queries that don't match other patterns are likely searches
        words = query.split()
        if len(words) >= 2:
            return {
                "intent": "search",
                "value": query,
                "confidence": 0.7,
                "details": {"reason": "multi-word query"},
            }

        return None

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def action_history(self) -> list[dict[str, Any]]:
        return list(self._action_history)

    @property
    def intent_stats(self) -> dict[str, int]:
        return dict(self._intent_stats)

    def get_success_rate(self, action: str) -> float | None:
        """Return the success rate (0.0-1.0) for a given action, or None."""
        results = self._success_rates.get(action)
        if not results:
            return None
        return sum(results) / len(results)
