"""MiMo Browser v4 — Optional real-LLM backend for the AI sidebar.

The browser's built-in "AI" is fast, offline keyword/heuristic logic. This
module adds an OPTIONAL real LLM layer that activates only when an API key is
configured via environment variables — it never breaks the app when absent.

Supported providers (OpenAI-compatible chat completions API):
  • DeepSeek  -> set DEEPSEEK_API_KEY (uses https://api.deepseek.com)
  • OpenAI    -> set OPENAI_API_KEY
  • Any compat -> set MIMO_LLM_BASE_URL + MIMO_LLM_API_KEY + MIMO_LLM_MODEL

When no key is set, ask() / summarize() return None and the caller falls back
to the heuristic engine.
"""
from __future__ import annotations

import aiohttp
import os
from typing import Any


def _config() -> dict[str, str] | None:
    """Resolve LLM config from env. Returns None when disabled."""
    base = os.environ.get("MIMO_LLM_BASE_URL")
    key = os.environ.get("MIMO_LLM_API_KEY") or os.environ.get("DEEPSEEK_API_KEY") \
        or os.environ.get("OPENAI_API_KEY")
    model = os.environ.get("MIMO_LLM_MODEL") or os.environ.get("DEEPSEEK_MODEL") \
        or os.environ.get("OPENAI_MODEL") or "deepseek-chat"

    if not key:
        return None
    if not base:
        # Pick a sensible default from which key is present.
        if os.environ.get("DEEPSEEK_API_KEY"):
            base = "https://api.deepseek.com"
        elif os.environ.get("OPENAI_API_KEY"):
            base = "https://api.openai.com/v1"
        else:
            base = "https://api.deepseek.com"
    return {"base_url": base.rstrip("/"), "api_key": key, "model": model}


def is_enabled() -> bool:
    return _config() is not None


def _strip_html_to_text(html: str, max_chars: int = 18000) -> str:
    import re
    html = re.sub(r"<(script|style|noscript)[^>]*>.*?</\1>", " ", html,
                  flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<!--.*?-->", " ", html, flags=re.DOTALL)
    html = re.sub(r"<[^>]+>", " ", html)
    for a, b in [("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"),
                 ("&quot;", '"'), ("&#39;", "'"), ("&nbsp;", " ")]:
        html = html.replace(a, b)
    html = re.sub(r"\s+", " ", html).strip()
    return html[:max_chars]


async def ask(question: str, page_text: str = "", page_title: str = "") -> str | None:
    """Answer a question about a page using the configured LLM.

    Returns None when the LLM is disabled or errored (caller falls back).
    """
    cfg = _config()
    if not cfg:
        return None
    context = _strip_html_to_text(page_text) if page_text else ""
    system = (
        "You are MiMo, an AI embedded in a privacy-first web browser. "
        "Answer questions about the current web page concisely and accurately. "
        "If you don't know, say so. Keep responses under 200 words."
    )
    user_parts = []
    if page_title:
        user_parts.append(f"Page title: {page_title}")
    if context:
        user_parts.append(f"Page content:\n{context}")
    user_parts.append(f"User question: {question}")
    user = "\n\n".join(user_parts)

    payload = {
        "model": cfg["model"],
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.3,
        "max_tokens": 600,
    }
    headers = {
        "Authorization": f"Bearer {cfg['api_key']}",
        "Content-Type": "application/json",
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{cfg['base_url']}/chat/completions",
                json=payload, headers=headers,
                timeout=aiohttp.ClientTimeout(total=30),
            ) as resp:
                if resp.status != 200:
                    return None
                data = await resp.json()
                return data["choices"][0]["message"]["content"].strip() or None
    except Exception:
        return None


async def summarize(title: str, html: str) -> dict[str, Any] | None:
    """Return a structured summary, or None to fall back to heuristics."""
    cfg = _config()
    if not cfg:
        return None
    text = _strip_html_to_text(html)
    system = (
        "You summarize web pages for a privacy-first browser. "
        "Respond ONLY with strict JSON: "
        '{"summary":"...","keyPoints":["...","..."],"topics":["...","..."],'
        '"sentiment":"positive|neutral|negative"}.'
    )
    user = f"Title: {title}\n\nContent:\n{text}"
    payload = {
        "model": cfg["model"],
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.2,
        "max_tokens": 700,
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {cfg['api_key']}",
        "Content-Type": "application/json",
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{cfg['base_url']}/chat/completions",
                json=payload, headers=headers,
                timeout=aiohttp.ClientTimeout(total=30),
            ) as resp:
                if resp.status != 200:
                    return None
                data = await resp.json()
                content = data["choices"][0]["message"]["content"].strip()
                import json as _json
                obj = _json.loads(content)
                return {
                    "title": title,
                    "text": obj.get("summary", ""),
                    "keyPoints": obj.get("keyPoints", [])[:5],
                    "topics": obj.get("topics", [])[:8],
                    "sentiment": obj.get("sentiment", "neutral"),
                    "wordCount": len(text.split()),
                    "readingTime": max(1, len(text.split()) // 200),
                    "language": "en",
                }
    except Exception:
        return None
