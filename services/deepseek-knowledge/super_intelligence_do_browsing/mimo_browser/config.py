from __future__ import annotations

import json
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any


class BrowserMode(Enum):
    EXPLORE = "explore"
    SEARCH = "search"
    EXTRACT = "extract"
    INTERACT = "interact"
    MONITOR = "monitor"


class Priority(Enum):
    CRITICAL = 0
    HIGH = 1
    MEDIUM = 2
    LOW = 3


@dataclass
class BrowserConfig:
    headless: bool = True
    timeout_ms: int = 30_000
    viewport_width: int = 1920
    viewport_height: int = 1080
    user_agent: str | None = None
    proxy: str | None = None
    download_path: str = "./downloads"
    screenshot_on_error: bool = True
    max_concurrent_tabs: int = 5
    retry_attempts: int = 3
    retry_delay_s: float = 1.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "headless": self.headless,
            "timeout_ms": self.timeout_ms,
            "viewport": {"width": self.viewport_width, "height": self.viewport_height},
            "user_agent": self.user_agent,
            "proxy": self.proxy,
            "download_path": self.download_path,
            "screenshot_on_error": self.screenshot_on_error,
            "max_concurrent_tabs": self.max_concurrent_tabs,
            "retry_attempts": self.retry_attempts,
            "retry_delay_s": self.retry_delay_s,
        }

    @classmethod
    def from_file(cls, path: str | Path) -> BrowserConfig:
        p = Path(path)
        if p.exists():
            data = json.loads(p.read_text())
            return cls(**{k: v for k, v in data.items() if hasattr(cls, k)})
        return cls()


@dataclass
class TaskContext:
    goal: str
    mode: BrowserMode = BrowserMode.EXPLORE
    priority: Priority = Priority.MEDIUM
    constraints: list[str] = field(default_factory=list)
    max_steps: int = 50
    state: dict[str, Any] = field(default_factory=dict)
    history: list[dict[str, Any]] = field(default_factory=list)

    def record(self, action: str, result: Any, status: str = "ok") -> None:
        self.history.append({
            "step": len(self.history),
            "action": action,
            "result": str(result)[:500],
            "status": status,
        })

    def add_constraint(self, constraint: str) -> None:
        self.constraints.append(constraint)
