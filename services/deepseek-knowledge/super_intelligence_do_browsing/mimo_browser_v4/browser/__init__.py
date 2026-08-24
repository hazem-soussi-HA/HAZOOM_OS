"""MiMo Browser v4 — Browser layer: engine, tabs, groups, history, bookmarks, reader, workspace, notes, downloads."""
from .engine import BrowserEngine
from .tab import TabManager
from .tab_group import TabGroupManager
from .history import HistoryManager
from .bookmarks import BookmarkManager
from .reader import ReaderMode
from .workspace import WorkspaceManager
from .notes import NotesManager
from .downloads import DownloadManager

__all__ = [
    "BrowserEngine", "TabManager", "TabGroupManager", "HistoryManager",
    "BookmarkManager", "ReaderMode", "WorkspaceManager", "NotesManager", "DownloadManager",
]
