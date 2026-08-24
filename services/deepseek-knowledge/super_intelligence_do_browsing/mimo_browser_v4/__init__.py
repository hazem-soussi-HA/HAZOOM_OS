"""MiMo Browser v4 — Personal Intelligent Browser"""
from mimo_browser_v4.config import BrowserConfig, BrowserMode, TaskContext, TabInfo, TabGroup, Workspace, Theme, Priority
from mimo_browser_v4.main import MiMoBrowser, create_app, main

__version__ = "4.0.0"
__all__ = [
    "BrowserConfig", "BrowserMode", "TaskContext", "TabInfo", "TabGroup",
    "Workspace", "Theme", "Priority", "MiMoBrowser", "create_app", "main",
]
