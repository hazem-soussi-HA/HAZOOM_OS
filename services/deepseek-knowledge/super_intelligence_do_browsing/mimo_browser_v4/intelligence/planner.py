"""
intelligence/planner.py - Goal Decomposition Engine

The Planner class breaks down high-level user goals into discrete,
executable steps for the browser automation pipeline.
"""

from __future__ import annotations

import re
import urllib.parse
from typing import Any


# --- Goal pattern definitions ---

_SEARCH_PATTERNS = [
    re.compile(r"^search\s+(?:for\s+)?(.+)", re.IGNORECASE),
    re.compile(r"^find\s+(?:me\s+)?(.+)", re.IGNORECASE),
    re.compile(r"^look\s+(?:up|for)\s+(.+)", re.IGNORECASE),
    re.compile(r"^google\s+(.+)", re.IGNORECASE),
]

_NAVIGATE_PATTERNS = [
    re.compile(r"^go\s+to\s+(.+)", re.IGNORECASE),
    re.compile(r"^open\s+(.+)", re.IGNORECASE),
    re.compile(r"^navigate\s+to\s+(.+)", re.IGNORECASE),
    re.compile(r"^visit\s+(.+)", re.IGNORECASE),
    re.compile(r"^browse\s+(?:to\s+)?(.+)", re.IGNORECASE),
]

_EXTRACT_PATTERNS = [
    re.compile(r"^extract\s+(?:the\s+)?(?:table|tables)\s+(?:from\s+)?(.+)", re.IGNORECASE),
    re.compile(r"^extract\s+(?:the\s+)?(?:data|content|text|links)\s+(?:from\s+)?(.+)", re.IGNORECASE),
    re.compile(r"^scrape\s+(?:the\s+)?(.+?)\s+from\s+(.+)", re.IGNORECASE),
    re.compile(r"^get\s+(?:the\s+)?(.+?)\s+from\s+(.+)", re.IGNORECASE),
]

_SUMMARIZE_PATTERNS = [
    re.compile(r"^summarize\s+(?:this\s+)?(?:page)?\s*(.*)", re.IGNORECASE),
    re.compile(r"^summarise\s+(?:this\s+)?(?:page)?\s*(.*)", re.IGNORECASE),
    re.compile(r"^give\s+me\s+(?:a\s+)?summary\s+(?:of\s+)?(?:this\s+)?(?:page)?\s*(.*)", re.IGNORECASE),
    re.compile(r"^tl;?;?dr\s*(.*)", re.IGNORECASE),
]

_FORM_PATTERNS = [
    re.compile(r"^fill\s+(?:in\s+)?(?:the\s+)?form\s+(?:at|on)\s+(.+)", re.IGNORECASE),
    re.compile(r"^fill\s+(?:in\s+)?(?:the\s+)?(.+?)\s+form\s+(?:at|on)\s+(.+)", re.IGNORECASE),
    re.compile(r"^complete\s+(?:the\s+)?form\s+(?:at|on)\s+(.+)", re.IGNORECASE),
    re.compile(r"^submit\s+(?:the\s+)?form\s+(?:at|on)\s+(.+)", re.IGNORECASE),
]

_LOGIN_PATTERNS = [
    re.compile(r"^log\s*(?:in|into)\s+(?:to\s+)?(.+)", re.IGNORECASE),
    re.compile(r"^sign\s*(?:in|into)\s+(?:to\s+)?(.+)", re.IGNORECASE),
    re.compile(r"^login\s+(?:to\s+)?(.+)", re.IGNORECASE),
]

_DOWNLOAD_PATTERNS = [
    re.compile(r"^download\s+(?:from\s+)?(.+)", re.IGNORECASE),
    re.compile(r"^save\s+(?:from\s+)?(.+)", re.IGNORECASE),
]

_COMPARE_PATTERNS = [
    re.compile(r"^compare\s+(.+?)\s+(?:and|vs\.?|versus)\s+(.+)", re.IGNORECASE),
    re.compile(r"^difference\s+between\s+(.+?)\s+and\s+(.+)", re.IGNORECASE),
]


class Planner:
    """Decomposes high-level user goals into executable browser steps.

    Each step is a dict with:
        - action: The action type (navigate, search, extract, summarize, etc.)
        - target: The target URL, page, or element
        - value: Optional value/data for the step
    """

    def decompose(self, goal: str) -> list[dict[str, Any]]:
        """Decompose a goal string into a list of executable steps.

        Args:
            goal: A natural language goal string.

        Returns:
            List of step dicts, each with 'action', 'target', and 'value' keys.
        """
        if not goal or not goal.strip():
            return []

        goal = goal.strip()

        # Try each goal pattern in priority order
        steps: list[dict[str, Any]] = []

        # 1. Search goals
        result = self._try_search(goal)
        if result:
            return result

        # 2. Navigate goals
        result = self._try_navigate(goal)
        if result:
            return result

        # 3. Extract goals
        result = self._try_extract(goal)
        if result:
            return result

        # 4. Summarize goals
        result = self._try_summarize(goal)
        if result:
            return result

        # 5. Form goals
        result = self._try_form(goal)
        if result:
            return result

        # 6. Login goals
        result = self._try_login(goal)
        if result:
            return result

        # 7. Download goals
        result = self._try_download(goal)
        if result:
            return result

        # 8. Compare goals
        result = self._try_compare(goal)
        if result:
            return result

        # Fallback: treat as a search
        return [
            {
                "action": "search",
                "target": "default_search_engine",
                "value": goal,
            }
        ]

    # ------------------------------------------------------------------
    # Pattern matchers
    # ------------------------------------------------------------------

    def _try_search(self, goal: str) -> list[dict[str, Any]] | None:
        for pattern in _SEARCH_PATTERNS:
            match = pattern.match(goal)
            if match:
                search_term = match.group(1).strip()
                return [
                    {
                        "action": "search",
                        "target": "default_search_engine",
                        "value": search_term,
                    }
                ]
        return None

    def _try_navigate(self, goal: str) -> list[dict[str, Any]] | None:
        for pattern in _NAVIGATE_PATTERNS:
            match = pattern.match(goal)
            if match:
                target = match.group(1).strip()
                url = self._ensure_url(target)
                return [
                    {
                        "action": "navigate",
                        "target": url,
                        "value": None,
                    }
                ]
        return None

    def _try_extract(self, goal: str) -> list[dict[str, Any]] | None:
        for pattern in _EXTRACT_PATTERNS:
            match = pattern.match(goal)
            if match:
                groups = match.groups()
                if len(groups) == 2:
                    data_type = groups[0].strip()
                    source = groups[1].strip()
                    url = self._ensure_url(source)
                    return [
                        {"action": "navigate", "target": url, "value": None},
                        {
                            "action": "extract",
                            "target": data_type,
                            "value": {"source": url},
                        },
                    ]
                else:
                    source = groups[0].strip()
                    url = self._ensure_url(source)
                    return [
                        {"action": "navigate", "target": url, "value": None},
                        {
                            "action": "extract",
                            "target": "content",
                            "value": {"source": url},
                        },
                    ]
        return None

    def _try_summarize(self, goal: str) -> list[dict[str, Any]] | None:
        for pattern in _SUMMARIZE_PATTERNS:
            match = pattern.match(goal)
            if match:
                page_ref = match.group(1).strip() if match.lastindex else ""
                steps: list[dict[str, Any]] = []
                if page_ref:
                    url = self._ensure_url(page_ref)
                    steps.append({"action": "navigate", "target": url, "value": None})
                steps.append(
                    {
                        "action": "summarize",
                        "target": "current_page",
                        "value": None,
                    }
                )
                return steps
        return None

    def _try_form(self, goal: str) -> list[dict[str, Any]] | None:
        for pattern in _FORM_PATTERNS:
            match = pattern.match(goal)
            if match:
                groups = match.groups()
                if len(groups) == 2:
                    form_name = groups[0].strip()
                    url = self._ensure_url(groups[1].strip())
                else:
                    form_name = "form"
                    url = self._ensure_url(groups[0].strip())
                return [
                    {"action": "navigate", "target": url, "value": None},
                    {
                        "action": "fill_form",
                        "target": form_name,
                        "value": {"url": url},
                    },
                ]
        return None

    def _try_login(self, goal: str) -> list[dict[str, Any]] | None:
        for pattern in _LOGIN_PATTERNS:
            match = pattern.match(goal)
            if match:
                target = match.group(1).strip()
                url = self._ensure_url(target)
                return [
                    {"action": "navigate", "target": url, "value": None},
                    {"action": "login", "target": url, "value": None},
                ]
        return None

    def _try_download(self, goal: str) -> list[dict[str, Any]] | None:
        for pattern in _DOWNLOAD_PATTERNS:
            match = pattern.match(goal)
            if match:
                target = match.group(1).strip()
                url = self._ensure_url(target)
                return [
                    {"action": "navigate", "target": url, "value": None},
                    {"action": "download", "target": url, "value": None},
                ]
        return None

    def _try_compare(self, goal: str) -> list[dict[str, Any]] | None:
        for pattern in _COMPARE_PATTERNS:
            match = pattern.match(goal)
            if match:
                item_a = match.group(1).strip()
                item_b = match.group(2).strip()
                return [
                    {
                        "action": "search",
                        "target": "default_search_engine",
                        "value": f"{item_a} vs {item_b}",
                    },
                    {
                        "action": "compare",
                        "target": "search_results",
                        "value": {"item_a": item_a, "item_b": item_b},
                    },
                ]
        return None

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _ensure_url(target: str) -> str:
        """Ensure a target string is a proper URL."""
        if target.startswith(("http://", "https://", "ftp://")):
            return target
        if target.startswith("www."):
            return "https://" + target
        # Check if it looks like a domain
        parsed = urllib.parse.urlparse(target)
        if parsed.scheme and parsed.netloc:
            return target
        if "." in target and " " not in target:
            return "https://" + target
        return target
