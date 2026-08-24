from __future__ import annotations

import asyncio
import logging
from typing import Any

import aiohttp

from mimo_browser.config import BrowserConfig, BrowserMode, TaskContext
from mimo_browser.intelligence import Action, IntelligenceEngine, Step
from mimo_browser.browser_engine import BrowserEngine

logger = logging.getLogger("mimo.handlers")


class WebSearchHandler:
    """Handles search engine queries and result extraction."""

    def __init__(self, engine: BrowserEngine) -> None:
        self.engine = engine

    async def search(self, query: str, engine_url: str = "https://www.google.com") -> dict[str, Any]:
        steps = [
            Step(action=Action.NAVIGATE, url=engine_url),
            Step(action=Action.WAIT, target="domcontentloaded"),
        ]
        if "google" in engine_url:
            steps.extend([
                Step(action=Action.TYPE, selector='textarea[name="q"]', value=query),
                Step(action=Action.CLICK, selector='input[name="btnK"]'),
            ])
        elif "bing" in engine_url:
            steps.extend([
                Step(action=Action.TYPE, selector='input[name="q"]', value=query),
                Step(action=Action.CLICK, selector='input[type="submit"]'),
            ])
        elif "duckduckgo" in engine_url:
            steps.extend([
                Step(action=Action.TYPE, selector='input[name="q"]', value=query),
                Step(action=Action.CLICK, selector='input[type="submit"]'),
            ])
        steps.append(Step(action=Action.WAIT, target="networkidle"))
        steps.append(Step(action=Action.EXTRACT, selector="body"))

        results = []
        for step in steps:
            result = await self.engine.execute_step(step)
            if not result.ok:
                return {"success": False, "error": result.error, "query": query}
            if result.data:
                results.append(result.data)
        return {"success": True, "query": query, "data": results[-1] if results else None}


class PageMonitorHandler:
    """Monitors pages for changes over time."""

    def __init__(self, engine: BrowserEngine, memory: Any = None) -> None:
        self.engine = engine
        self.memory = memory
        self._snapshots: dict[str, str] = {}

    async def snapshot(self, url: str, selector: str = "body") -> dict[str, Any]:
        steps = [
            Step(action=Action.NAVIGATE, url=url),
            Step(action=Action.WAIT, target="networkidle"),
            Step(action=Action.EXTRACT, selector=selector),
        ]
        for step in steps:
            result = await self.engine.execute_step(step)
            if not result.ok:
                return {"url": url, "changed": False, "error": result.error}

        content = await self.engine.get_page_text()
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        prev_hash = self._snapshots.get(url)
        changed = prev_hash is not None and prev_hash != content_hash
        self._snapshots[url] = content_hash

        if self.memory and changed:
            self.memory.remember({"type": "change", "url": url}, tags=["monitor", "change"])

        return {"url": url, "changed": changed, "hash": content_hash}

    async def watch(self, url: str, interval_s: float = 60, duration_s: float = 3600) -> list[dict[str, Any]]:
        import hashlib
        snapshots = []
        start = asyncio.get_event_loop().time()
        while asyncio.get_event_loop().time() - start < duration_s:
            result = await self.snapshot(url)
            snapshots.append(result)
            await asyncio.sleep(interval_s)
        return snapshots


class DataExtractor:
    """Extracts structured data from web pages."""

    def __init__(self, engine: BrowserEngine) -> None:
        self.engine = engine

    async def extract_table(self, url: str, table_selector: str = "table") -> list[dict[str, str]]:
        steps = [
            Step(action=Action.NAVIGATE, url=url),
            Step(action=Action.WAIT, target="networkidle"),
            Step(action=Action.EVALUATE, value=f"""
                (() => {{
                    const table = document.querySelector('{table_selector}');
                    if (!table) return [];
                    const headers = [...table.querySelectorAll('th')].map(th => th.textContent.trim());
                    const rows = [...table.querySelectorAll('tbody tr')];
                    return rows.map(row => {{
                        const cells = [...row.querySelectorAll('td')].map(td => td.textContent.trim());
                        const obj = {{}};
                        headers.forEach((h, i) => obj[h] = cells[i] || '');
                        return obj;
                    }});
                }})()
            """),
        ]
        for step in steps:
            result = await self.engine.execute_step(step)
            if not result.ok:
                return []
            if result.data and isinstance(result.data, list):
                return result.data
        return []

    async def extract_list(self, url: str, item_selector: str, text_selector: str | None = None) -> list[str]:
        js = text_selector and f"document.querySelectorAll('{item_selector}')" or f"document.querySelectorAll('{item_selector}')"
        steps = [
            Step(action=Action.NAVIGATE, url=url),
            Step(action=Action.WAIT, target="networkidle"),
            Step(action=Action.EVALUATE, value=f"""
                [...document.querySelectorAll('{item_selector}')].map(el =>
                    el.textContent.trim()
                )
            """),
        ]
        for step in steps:
            result = await self.engine.execute_step(step)
            if not result.ok:
                return []
            if result.data and isinstance(result.data, list):
                return result.data
        return []


class ContentFetcher:
    """Lightweight HTTP content fetching without browser."""

    def __init__(self) -> None:
        self._session: aiohttp.ClientSession | None = None

    async def fetch(self, url: str) -> str:
        if self._session is None:
            self._session = aiohttp.ClientSession()
        async with self._session.get(url) as resp:
            return await resp.text()

    async def fetch_json(self, url: str) -> Any:
        if self._session is None:
            self._session = aiohttp.ClientSession()
        async with self._session.get(url) as resp:
            return await resp.json()

    async def close(self) -> None:
        if self._session:
            await self._session.close()
