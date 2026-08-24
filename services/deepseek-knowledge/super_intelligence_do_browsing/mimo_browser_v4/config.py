"""MiMo Browser v4 — Core configuration and encrypted storage."""
from __future__ import annotations

import json
import os
import hashlib
from dataclasses import dataclass, field, asdict
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


class Theme(Enum):
    DARK = "dark"
    LIGHT = "light"
    MIDNIGHT = "midnight"
    FOREST = "forest"
    OCEAN = "ocean"


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
    max_concurrent_tabs: int = 10
    retry_attempts: int = 3
    retry_delay_s: float = 1.0
    theme: str = "dark"
    https_only: bool = True
    ad_block_enabled: bool = True
    fingerprint_protection: bool = True
    doh_enabled: bool = True
    doh_provider: str = "https://cloudflare-dns.com/dns-query"
    ai_sidebar_enabled: bool = True
    reader_mode_enabled: bool = True
    keyboard_shortcuts: dict = field(default_factory=lambda: {
        "new_tab": "Ctrl+T",
        "close_tab": "Ctrl+W",
        "command_palette": "Ctrl+K",
        "ai_sidebar": "Ctrl+Shift+A",
        "reader_mode": "Ctrl+Shift+R",
        "split_view": "Ctrl+Shift+S",
        "next_tab": "Ctrl+Tab",
        "prev_tab": "Ctrl+Shift+Tab",
        "find": "Ctrl+F",
        "devtools": "F12",
        "refresh": "F5",
        "hard_refresh": "Ctrl+Shift+R",
        "top": "gg",
        "bottom": "G",
        "scroll_down": "j",
        "scroll_up": "k",
        "page_down": "d",
        "page_up": "u",
    })

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        return d

    @classmethod
    def from_file(cls, path: str | Path) -> BrowserConfig:
        p = Path(path)
        if p.exists():
            data = json.loads(p.read_text())
            return cls(**{k: v for k, v in data.items() if hasattr(cls, k)})
        return cls()

    def save(self, path: str | Path) -> None:
        Path(path).write_text(json.dumps(self.to_dict(), indent=2))


@dataclass
class TabInfo:
    id: str
    url: str = "about:blank"
    title: str = "New Tab"
    group: str = "default"
    group_color: str = "#00d4ff"
    favicon: str | None = None
    scroll_position: float = 0.0
    zoom: float = 1.0
    is_loading: bool = False
    is_pinned: bool = False
    is_muted: bool = False
    notes: str = ""
    reader_mode: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> TabInfo:
        return cls(**{k: v for k, v in data.items() if hasattr(cls, k)})


@dataclass
class TabGroup:
    name: str
    color: str = "#00d4ff"
    collapsed: bool = False
    tab_ids: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> TabGroup:
        return cls(**{k: v for k, v in data.items() if hasattr(cls, k)})


@dataclass
class Workspace:
    name: str
    tabs: list[dict] = field(default_factory=list)
    groups: list[dict] = field(default_factory=list)
    active_tab: int = 0
    created_at: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> Workspace:
        return cls(**{k: v for k, v in data.items() if hasattr(cls, k)})


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
