from __future__ import annotations

import asyncio
import logging
import re
import socket
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Protocol
from urllib.parse import urlparse

from mimo_browser.config import BrowserConfig, BrowserMode, Priority, TaskContext

logger = logging.getLogger("mimo.intelligence")


class Action(Enum):
    NAVIGATE = "navigate"
    CLICK = "click"
    TYPE = "type"
    SCROLL = "scroll"
    EXTRACT = "extract"
    WAIT = "wait"
    SCREENSHOT = "screenshot"
    EVALUATE = "evaluate"
    BACK = "back"
    FORWARD = "forward"
    REFRESH = "refresh"
    NEW_TAB = "new_tab"
    CLOSE_TAB = "close_tab"
    SEARCH = "search"


@dataclass
class Step:
    action: Action
    target: str | None = None
    value: str | None = None
    selector: str | None = None
    url: str | None = None
    timeout: int = 30_000
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class StepResult:
    success: bool
    data: Any = None
    error: str | None = None
    screenshot: str | None = None

    @property
    def ok(self) -> bool:
        return self.success


class BrowserProtocol(Protocol):
    async def execute_step(self, step: Step) -> StepResult: ...


class URLResolver:
    """Resolves URLs, validates DNS, normalizes input."""

    @staticmethod
    def normalize(raw: str) -> str:
        raw = raw.strip()
        if not raw:
            return ""
        if not raw.startswith(("http://", "https://", "ftp://")):
            if "." in raw and " " not in raw:
                raw = "https://" + raw
            else:
                raw = "https://www.google.com/search?q=" + raw.replace(" ", "+")
        return raw

    @staticmethod
    def validate(url: str) -> bool:
        try:
            parsed = urlparse(url)
            return parsed.scheme in ("http", "https", "ftp") and bool(parsed.netloc)
        except Exception:
            return False

    @staticmethod
    async def resolve_dns(hostname: str) -> dict[str, Any]:
        try:
            loop = asyncio.get_event_loop()
            result = await loop.getaddrinfo(hostname, None)
            ips = list({r[4][0] for r in result})
            return {"hostname": hostname, "resolved": True, "ips": ips}
        except socket.gaierror as e:
            return {"hostname": hostname, "resolved": False, "error": str(e)}

    @staticmethod
    def extract_urls_from_goal(goal: str) -> list[str]:
        url_pattern = re.compile(
            r'https?://[^\s<>"\'{}|\\^`\[\]]+|'
            r'(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:/[^\s<>"\'{}|\\^`\[\]]*)?'
        )
        found = url_pattern.findall(goal)
        normalized = []
        for u in found:
            n = URLResolver.normalize(u)
            if n and n not in normalized:
                normalized.append(n)
        return normalized


class PlanningEngine:
    """Decomposes high-level goals into executable step sequences."""

    def __init__(self) -> None:
        self._strategies: dict[str, Callable] = {
            "search": self._plan_search,
            "explore": self._plan_explore,
            "extract": self._plan_extract,
            "interact": self._plan_interact,
            "monitor": self._plan_monitor,
        }

    async def plan(self, context: TaskContext) -> list[Step]:
        strategy = self._strategies.get(context.mode.value, self._plan_explore)
        steps = await strategy(context)
        logger.info("Planned %d steps for goal: %s", len(steps), context.goal)
        return steps

    async def replan(self, context: TaskContext, last_result: StepResult) -> list[Step]:
        if last_result.ok:
            return []
        logger.warning("Replanning after failure: %s", last_result.error)
        return await self.plan(context)

    def _resolve_goal_url(self, ctx: TaskContext) -> str:
        """Extract URL from state or goal string."""
        if ctx.state.get("url"):
            return ctx.state["url"]
        urls = URLResolver.extract_urls_from_goal(ctx.goal)
        return urls[0] if urls else ""

    async def _plan_search(self, ctx: TaskContext) -> list[Step]:
        query = ctx.state.get("query", ctx.goal)
        engine = ctx.state.get("engine", "google")
        engines = {
            "google": "https://www.google.com",
            "bing": "https://www.bing.com",
            "duckduckgo": "https://duckduckgo.com",
        }
        base = engines.get(engine, engines["google"])
        search_selectors = {
            "google": ("textarea[name='q']", "input[name='btnK']"),
            "bing": ("input[name='q']", "input[type='submit']"),
            "duckduckgo": ("input[name='q']", "input[type='submit']"),
        }
        input_sel, btn_sel = search_selectors.get(engine, search_selectors["google"])

        return [
            Step(action=Action.NAVIGATE, url=base),
            Step(action=Action.WAIT, target="domcontentloaded"),
            Step(action=Action.CLICK, selector=input_sel),
            Step(action=Action.TYPE, selector=input_sel, value=query),
            Step(action=Action.CLICK, selector=btn_sel),
            Step(action=Action.WAIT, target="networkidle"),
            Step(action=Action.EXTRACT, selector="body"),
        ]

    async def _plan_explore(self, ctx: TaskContext) -> list[Step]:
        url = self._resolve_goal_url(ctx)
        if not url:
            return [Step(action=Action.EXTRACT, selector="body")]

        url = URLResolver.normalize(url)
        return [
            Step(action=Action.NAVIGATE, url=url),
            Step(action=Action.WAIT, target="domcontentloaded"),
            Step(action=Action.WAIT, target="2s"),
            Step(action=Action.EXTRACT, selector="body"),
        ]

    async def _plan_extract(self, ctx: TaskContext) -> list[Step]:
        url = self._resolve_goal_url(ctx)
        selector = ctx.state.get("selector", "body")
        steps = []
        if url:
            url = URLResolver.normalize(url)
            steps.append(Step(action=Action.NAVIGATE, url=url))
            steps.append(Step(action=Action.WAIT, target="domcontentloaded"))
            steps.append(Step(action=Action.WAIT, target="2s"))
        steps.append(Step(action=Action.EXTRACT, selector=selector))
        return steps

    async def _plan_interact(self, ctx: TaskContext) -> list[Step]:
        steps: list[Step] = []
        for action_def in ctx.state.get("actions", []):
            action_type = Action(action_def.get("type", "click"))
            steps.append(
                Step(
                    action=action_type,
                    selector=action_def.get("selector"),
                    value=action_def.get("value"),
                    url=action_def.get("url"),
                )
            )
        return steps

    async def _plan_monitor(self, ctx: TaskContext) -> list[Step]:
        url = self._resolve_goal_url(ctx)
        interval = ctx.state.get("interval_s", 60)
        return [
            Step(action=Action.NAVIGATE, url=url),
            Step(action=Action.WAIT, target="networkidle"),
            Step(action=Action.EXTRACT, selector=ctx.state.get("selector", "body")),
            Step(action=Action.WAIT, target=f"{interval}s"),
        ]


class IntelligenceEngine:
    """Core decision-making engine that coordinates planning, execution, and adaptation."""

    def __init__(self, config: BrowserConfig | None = None) -> None:
        self.config = config or BrowserConfig()
        self.planner = PlanningEngine()
        self._browser: BrowserProtocol | None = None
        self._running = False

    async def initialize(self, browser: BrowserProtocol) -> None:
        self._browser = browser
        logger.info("Intelligence engine initialized")

    async def resolve_and_validate(self, url: str) -> dict[str, Any]:
        """Validate URL and resolve DNS before navigation."""
        normalized = URLResolver.normalize(url)
        if not URLResolver.validate(normalized):
            return {"valid": False, "url": normalized, "error": "Invalid URL"}
        parsed = urlparse(normalized)
        dns = await URLResolver.resolve_dns(parsed.hostname)
        return {"valid": True, "url": normalized, "dns": dns}

    async def execute_goal(self, goal: str, mode: BrowserMode = BrowserMode.EXPLORE) -> dict[str, Any]:
        context = TaskContext(goal=goal, mode=mode)
        urls = URLResolver.extract_urls_from_goal(goal)
        if urls:
            context.state["url"] = urls[0]
        return await self.execute(context)

    async def execute(self, context: TaskContext) -> dict[str, Any]:
        self._running = True
        results: list[StepResult] = []

        try:
            steps = await self.planner.plan(context)

            for i, step in enumerate(steps):
                if not self._running or i >= context.max_steps:
                    logger.info("Stopping: running=%s, step=%d/%d", self._running, i, context.max_steps)
                    break

                if self._browser is None:
                    raise RuntimeError("Browser not initialized")

                result = await self._browser.execute_step(step)
                results.append(result)
                context.record(step.action.value, result.data, "ok" if result.ok else "error")

                if not result.ok:
                    logger.warning("Step %d failed: %s", i, result.error)
                    extra = await self.planner.replan(context, result)
                    if extra:
                        steps = steps[: i + 1] + extra

            return {
                "goal": context.goal,
                "mode": context.mode.value,
                "steps_executed": len(results),
                "success": all(r.ok for r in results) if results else False,
                "results": [
                    {"success": r.ok, "data": str(r.data)[:500] if r.data else None, "error": r.error}
                    for r in results
                ],
                "history": context.history,
            }
        except Exception as e:
            logger.exception("Execution failed")
            return {"goal": context.goal, "success": False, "error": str(e), "results": results}
        finally:
            self._running = False

    def stop(self) -> None:
        self._running = False
