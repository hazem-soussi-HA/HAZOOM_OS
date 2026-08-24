from __future__ import annotations

import asyncio
import logging
import os
import re
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup

from mimo_browser.config import BrowserConfig
from mimo_browser.intelligence import Action, BrowserProtocol, Step, StepResult

logger = logging.getLogger("mimo.browser")


class ContentExtractor:
    """Parses and extracts meaningful content from HTML."""

    @staticmethod
    def extract_text(html: str, selector: str = "body") -> str:
        soup = BeautifulSoup(html, "lxml")
        element = soup.select_one(selector) or soup
        for tag in element.find_all(["script", "style", "noscript"]):
            tag.decompose()
        return element.get_text(separator="\n", strip=True)

    @staticmethod
    def extract_links(html: str, base_url: str = "") -> list[dict[str, str]]:
        soup = BeautifulSoup(html, "lxml")
        links = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            text = a.get_text(strip=True)
            if href.startswith(("http://", "https://")):
                links.append({"url": href, "text": text})
            elif base_url and href.startswith("/"):
                from urllib.parse import urljoin
                links.append({"url": urljoin(base_url, href), "text": text})
        return links

    @staticmethod
    def extract_structured(html: str) -> dict[str, Any]:
        soup = BeautifulSoup(html, "lxml")
        title = soup.title.string if soup.title else ""
        meta = {}
        for m in soup.find_all("meta"):
            name = m.get("name") or m.get("property", "")
            content = m.get("content", "")
            if name:
                meta[name] = content
        headings = {}
        for level in range(1, 7):
            tags = soup.find_all(f"h{level}")
            if tags:
                headings[f"h{level}"] = [t.get_text(strip=True) for t in tags]
        return {"title": title, "meta": meta, "headings": headings}


class PageAnalysis:
    """Analyzes page structure for intelligent interaction."""

    @staticmethod
    def find_interactive_elements(html: str) -> list[dict[str, Any]]:
        soup = BeautifulSoup(html, "lxml")
        elements = []
        for tag in soup.find_all(["a", "button", "input", "select", "textarea"]):
            info = {"tag": tag.name, "type": tag.get("type", ""), "text": tag.get_text(strip=True)[:100]}
            if tag.get("id"):
                info["selector"] = f"#{tag['id']}"
            elif tag.get("name"):
                info["selector"] = f'[name="{tag["name"]}"]'
            elif tag.get("class"):
                info["selector"] = f".{' '.join(tag['class'])}"
            elements.append(info)
        return elements

    @staticmethod
    def estimate_page_type(html: str) -> str:
        lower = html.lower()
        if any(w in lower for w in ["search", "query", "results"]):
            return "search_results"
        if any(w in lower for w in ["login", "sign in", "password"]):
            return "auth"
        if any(w in lower for w in ["error", "404", "not found"]):
            return "error"
        if any(w in lower for w in ["article", "content", "post"]):
            return "content"
        return "generic"


class BrowserEngine(BrowserProtocol):
    """Browser automation engine using Playwright."""

    def __init__(self, config: BrowserConfig | None = None) -> None:
        self.config = config or BrowserConfig()
        self._playwright: Any = None
        self._browser: Any = None
        self._context: Any = None
        self._page: Any = None
        self.extractor = ContentExtractor()
        self.analyzer = PageAnalysis()
        self._screenshots_dir = Path(self.config.download_path) / "screenshots"
        self._content_dir = Path(self.config.download_path) / "content"

    async def start(self) -> None:
        from playwright.async_api import async_playwright

        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.launch(headless=self.config.headless)
        self._context = await self._browser.new_context(
            viewport={"width": self.config.viewport_width, "height": self.config.viewport_height},
            user_agent=self.config.user_agent,
            proxy={"server": self.config.proxy} if self.config.proxy else None,
        )
        self._page = await self._context.new_page()
        self._screenshots_dir.mkdir(parents=True, exist_ok=True)
        self._content_dir.mkdir(parents=True, exist_ok=True)
        logger.info("Browser started (headless=%s)", self.config.headless)

    async def stop(self) -> None:
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()
        logger.info("Browser stopped")

    async def execute_step(self, step: Step) -> StepResult:
        try:
            if step.action == Action.NAVIGATE:
                return await self._navigate(step.url or "")
            if step.action == Action.CLICK:
                return await self._click(step.selector or step.target)
            if step.action == Action.TYPE:
                return await self._type(step.selector, step.value or "")
            if step.action == Action.SCROLL:
                return await self._scroll(step.value)
            if step.action == Action.EXTRACT:
                return await self._extract(step.selector or "body")
            if step.action == Action.WAIT:
                return await self._wait(step.target)
            if step.action == Action.SCREENSHOT:
                return await self._screenshot(step.target)
            if step.action == Action.EVALUATE:
                return await self._evaluate(step.value or "")
            if step.action == Action.BACK:
                await self._page.go_back()
                return StepResult(success=True)
            if step.action == Action.FORWARD:
                await self._page.go_forward()
                return StepResult(success=True)
            if step.action == Action.REFRESH:
                await self._page.reload()
                return StepResult(success=True)
            return StepResult(success=False, error=f"Unknown action: {step.action}")
        except Exception as e:
            logger.exception("Step execution failed: %s", step.action)
            if self.config.screenshot_on_error:
                await self._screenshot(f"error_{step.action.value}")
            return StepResult(success=False, error=str(e))

    async def _navigate(self, url: str) -> StepResult:
        response = await self._page.goto(url, timeout=self.config.timeout_ms)
        status = response.status if response else 0
        return StepResult(success=200 <= status < 400, data={"url": url, "status": status})

    async def _click(self, selector: str) -> StepResult:
        await self._page.click(selector, timeout=self.config.timeout_ms)
        return StepResult(success=True, data={"clicked": selector})

    async def _type(self, selector: str | None, text: str) -> StepResult:
        if selector:
            await self._page.fill(selector, text, timeout=self.config.timeout_ms)
        else:
            await self._page.keyboard.type(text)
        return StepResult(success=True, data={"typed": text[:50]})

    async def _scroll(self, direction: str | None = None) -> StepResult:
        if direction == "up":
            await self._page.mouse.wheel(0, -500)
        else:
            await self._page.mouse.wheel(0, 500)
        return StepResult(success=True, data={"scrolled": direction or "down"})

    async def _extract(self, selector: str) -> StepResult:
        html = await self._page.content()
        text = self.extractor.extract_text(html, selector)
        links = self.extractor.extract_links(html, self._page.url)
        structured = self.extractor.extract_structured(html)
        page_type = self.analyzer.estimate_page_type(html)
        interactive = self.analyzer.find_interactive_elements(html)
        data = {
            "url": self._page.url,
            "page_type": page_type,
            "text": text[:5000],
            "links_count": len(links),
            "top_links": links[:20],
            "structured": structured,
            "interactive_count": len(interactive),
            "interactive_elements": interactive[:20],
        }
        content_path = self._content_dir / f"page_{self._page.url.split('/')[-1][:50]}.json"
        return StepResult(success=True, data=data)

    async def _wait(self, condition: str | None) -> StepResult:
        if condition == "networkidle":
            await self._page.wait_for_load_state("networkidle", timeout=self.config.timeout_ms)
        elif condition == "domcontentloaded":
            await self._page.wait_for_load_state("domcontentloaded", timeout=self.config.timeout_ms)
        elif condition and condition.endswith("s"):
            seconds = int(condition.rstrip("s"))
            await asyncio.sleep(seconds)
        return StepResult(success=True)

    async def _screenshot(self, name: str | None = None) -> StepResult:
        path = self._screenshots_dir / f"{name or 'screenshot'}.png"
        await self._page.screenshot(path=str(path), full_page=True)
        return StepResult(success=True, data={"path": str(path)})

    async def _evaluate(self, expression: str) -> StepResult:
        result = await self._page.evaluate(expression)
        return StepResult(success=True, data=result)

    async def get_page_content(self) -> str:
        return await self._page.content()

    async def get_page_text(self) -> str:
        html = await self._page.content()
        return self.extractor.extract_text(html)

    async def get_current_url(self) -> str:
        return self._page.url
