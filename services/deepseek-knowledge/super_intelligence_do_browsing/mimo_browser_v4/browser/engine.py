"""MiMo Browser v4 — Playwright-backed browser engine wrapper.

Provides a synchronous API over Playwright's async API for headless
browsing.  Designed as a drop-in replacement for a QtWebEngine based
backend — all public methods match the QtWebEngine wrapper interface.
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Any

from playwright.async_api import async_playwright, Browser, BrowserContext, Page

from ..config import BrowserConfig

logger = logging.getLogger(__name__)


def _run(coro):
    """Run an async coroutine, creating a new event loop if needed."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None
    if loop and loop.is_running():
        # Fallback for nested event loops (e.g. Jupyter)
        try:
            import nest_asyncio  # type: ignore[import-untyped]
            nest_asyncio.apply()
            return loop.run_until_complete(coro)
        except ImportError:
            raise RuntimeError(
                "nest_asyncio is required when running inside an existing event loop. "
                "Install it with: pip install nest_asyncio"
            )
    return asyncio.run(coro)


class BrowserEngine:
    """Thin synchronous wrapper around Playwright for headless browsing.

    Usage:
        engine = BrowserEngine(BrowserConfig())
        engine.start()
        engine.navigate("https://example.com")
        content = engine.get_content()
        engine.stop()
    """

    def __init__(self, config: BrowserConfig | None = None) -> None:
        self.config = config or BrowserConfig()
        self._playwright = None
        self._browser: Browser | None = None
        self._context: BrowserContext | None = None
        self._page: Page | None = None

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start(self) -> None:
        """Launch the browser engine."""
        if self._browser is not None:
            logger.warning("BrowserEngine already started.")
            return

        async def _launch():
            self._playwright = await async_playwright().start()
            browser_type = self._playwright.chromium
            self._browser = await browser_type.launch(
                headless=self.config.headless,
                proxy={"server": self.config.proxy} if self.config.proxy else None,
            )
            self._context = await self._browser.new_context(
                viewport={
                    "width": self.config.viewport_width,
                    "height": self.config.viewport_height,
                },
                user_agent=self.config.user_agent,
            )
            self._page = await self._context.new_page()

        _run(_launch())
        logger.info("BrowserEngine started (Playwright chromium, headless=%s).", self.config.headless)

    def stop(self) -> None:
        """Shut down the browser engine and release all resources."""
        async def _shutdown():
            if self._context:
                await self._context.close()
            if self._browser:
                await self._browser.close()
            if self._playwright:
                await self._playwright.stop()

        _run(_shutdown())
        self._playwright = None
        self._browser = None
        self._context = None
        self._page = None
        logger.info("BrowserEngine stopped.")

    # ------------------------------------------------------------------
    # Navigation
    # ------------------------------------------------------------------

    def navigate(self, url: str) -> None:
        """Navigate the current page to *url*."""
        if self._page is None:
            raise RuntimeError("BrowserEngine not started. Call start() first.")

        async def _nav():
            await self._page.goto(url, timeout=self.config.timeout_ms, wait_until="domcontentloaded")  # type: ignore[arg-type]

        _run(_nav())
        logger.debug("Navigated to %s", url)

    def back(self) -> None:
        """Go back one entry in the navigation history."""
        if self._page is None:
            raise RuntimeError("BrowserEngine not started.")

        async def _back():
            await self._page.go_back(timeout=self.config.timeout_ms)  # type: ignore[arg-type]

        _run(_back())
        logger.debug("Navigated back.")

    def forward(self) -> None:
        """Go forward one entry in the navigation history."""
        if self._page is None:
            raise RuntimeError("BrowserEngine not started.")

        async def _fwd():
            await self._page.go_forward(timeout=self.config.timeout_ms)  # type: ignore[arg-type]

        _run(_fwd())
        logger.debug("Navigated forward.")

    def refresh(self) -> None:
        """Reload the current page."""
        if self._page is None:
            raise RuntimeError("BrowserEngine not started.")

        async def _reload():
            await self._page.reload(timeout=self.config.timeout_ms)  # type: ignore[arg-type]

        _run(_reload())
        logger.debug("Page refreshed.")

    # ------------------------------------------------------------------
    # Content & state
    # ------------------------------------------------------------------

    def get_content(self) -> str:
        """Return the full HTML of the current page."""
        if self._page is None:
            raise RuntimeError("BrowserEngine not started.")

        async def _content():
            page = self._page
            assert page is not None
            return await page.content()

        return _run(_content())  # type: ignore[return-value]

    def get_url(self) -> str:
        """Return the current page URL."""
        if self._page is None:
            raise RuntimeError("BrowserEngine not started.")
        return self._page.url

    def execute_js(self, js: str) -> Any:
        """Execute arbitrary JavaScript on the current page and return the result."""
        if self._page is None:
            raise RuntimeError("BrowserEngine not started.")

        async def _js():
            page = self._page
            assert page is not None
            return await page.evaluate(js)

        return _run(_js())

    # ------------------------------------------------------------------
    # Screenshot
    # ------------------------------------------------------------------

    def screenshot(self, path: str | Path) -> None:
        """Save a screenshot of the current page to *path*."""
        if self._page is None:
            raise RuntimeError("BrowserEngine not started.")

        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)

        async def _ss():
            page = self._page
            assert page is not None
            await page.screenshot(path=str(p), full_page=True)  # type: ignore[arg-type]

        _run(_ss())
        logger.info("Screenshot saved to %s", p)

    # ------------------------------------------------------------------
    # Zoom
    # ------------------------------------------------------------------

    def set_zoom(self, level: float) -> None:
        """Set page zoom level (1.0 = 100 %)."""
        if self._page is None:
            raise RuntimeError("BrowserEngine not started.")
        if level <= 0:
            raise ValueError(f"Zoom level must be positive, got {level}")

        async def _zoom():
            page = self._page
            assert page is not None
            await page.evaluate(f"document.body.style.zoom = '{level}'")

        _run(_zoom())
        logger.debug("Zoom set to %.2f", level)

    # ------------------------------------------------------------------
    # Find
    # ------------------------------------------------------------------

    def find_text(self, text: str, forward: bool = True) -> bool:
        """Search for *text* on the current page (Ctrl+F style).

        Returns True if the text was found, False otherwise.
        """
        if self._page is None:
            raise RuntimeError("BrowserEngine not started.")

        direction = "forward" if forward else "backward"
        escaped = text.replace("'", "\\'")

        async def _find():
            page = self._page
            assert page is not None
            return await page.evaluate(
                f"() => {{ "
                f"  const sel = window.getSelection();"
                f"  if (window.find('{escaped}', false, {str(not forward).lower()}, false, false, true, false)) {{"
                f"    return true;"
                f"  }}"
                f"  return false;"
                f"}}"
            )

        found = _run(_find())
        logger.debug("find_text(%r, forward=%s) -> %s", text, forward, found)
        return bool(found)

    # ------------------------------------------------------------------
    # Context manager support
    # ------------------------------------------------------------------

    def __enter__(self) -> BrowserEngine:
        self.start()
        return self

    def __exit__(self, *exc: Any) -> None:
        self.stop()
