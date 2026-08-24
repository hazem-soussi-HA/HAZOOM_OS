"""MiMo Browser v4 — Print & File Operations.
Inspired by: "La plupart des navigateurs permettent d'imprimer les pages web
en noir et blanc ou en couleurs."
"""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("mimo.v4.print")


def generate_print_styles() -> str:
    """Generate CSS for print-optimized page rendering."""
    return """
    <style id="mimo-print-styles">
    @media print {
        /* Hide non-essential elements */
        .mimo-toolbar, .mimo-sidebar, .mimo-nav-bar,
        .mimo-status-bar, .mimo-ai-panel, .mimo-stats-panel,
        .mimo-quick-links, .mimo-bookmarks-panel {
            display: none !important;
        }
        /* Reset layout for print */
        body {
            background: white !important;
            color: black !important;
            font-size: 12pt !important;
            line-height: 1.5 !important;
        }
        #pageContent, iframe {
            width: 100% !important;
            height: auto !important;
            border: none !important;
        }
        /* Ensure images print */
        img {
            max-width: 100% !important;
            page-break-inside: avoid;
        }
        /* Page breaks */
        h1, h2, h3 {
            page-break-after: avoid;
        }
        pre, blockquote {
            page-break-inside: avoid;
        }
        /* Links: show URL after text */
        a[href]:after {
            content: " (" attr(href) ")";
            font-size: 80%;
            color: #666;
        }
        /* Remove background colors for cleaner print */
        * {
            background-color: transparent !important;
            box-shadow: none !important;
        }
    }
    </style>
    """


def get_file_menu_actions() -> list[dict[str, Any]]:
    """Return available file menu actions."""
    return [
        {
            "id": "new-tab",
            "label": "New Tab",
            "shortcut": "Ctrl+T",
            "icon": "📄",
            "description": "Open a new tab",
        },
        {
            "id": "new-window",
            "label": "New Window",
            "shortcut": "Ctrl+N",
            "icon": "🪟",
            "description": "Open a new browser window",
        },
        {
            "id": "open-file",
            "label": "Open File...",
            "shortcut": "Ctrl+O",
            "icon": "📂",
            "description": "Open a local file",
        },
        {
            "id": "save-page",
            "label": "Save Page As...",
            "shortcut": "Ctrl+S",
            "icon": "💾",
            "description": "Save the current page",
        },
        {
            "id": "print",
            "label": "Print...",
            "shortcut": "Ctrl+P",
            "icon": "🖨️",
            "description": "Print the current page",
        },
        {
            "id": "print-preview",
            "label": "Print Preview",
            "shortcut": "Ctrl+Shift+P",
            "icon": "👁️",
            "description": "Preview before printing",
        },
        {
            "id": "close-tab",
            "label": "Close Tab",
            "shortcut": "Ctrl+W",
            "icon": "❌",
            "description": "Close the current tab",
        },
        {
            "id": "close-window",
            "label": "Close Window",
            "shortcut": "Ctrl+Shift+W",
            "icon": "🚪",
            "description": "Close the browser window",
        },
    ]


def get_edit_menu_actions() -> list[dict[str, Any]]:
    """Return available edit menu actions."""
    return [
        {"id": "undo", "label": "Undo", "shortcut": "Ctrl+Z", "icon": "↩️"},
        {"id": "redo", "label": "Redo", "shortcut": "Ctrl+Y", "icon": "↪️"},
        {"id": "cut", "label": "Cut", "shortcut": "Ctrl+X", "icon": "✂️"},
        {"id": "copy", "label": "Copy", "shortcut": "Ctrl+C", "icon": "📋"},
        {"id": "paste", "label": "Paste", "shortcut": "Ctrl+V", "icon": "📌"},
        {"id": "select-all", "label": "Select All", "shortcut": "Ctrl+A", "icon": "☑️"},
        {"id": "find", "label": "Find...", "shortcut": "Ctrl+F", "icon": "🔍"},
        {"id": "find-next", "label": "Find Next", "shortcut": "F3", "icon": "🔎"},
    ]


def get_view_menu_actions() -> list[dict[str, Any]]:
    """Return available view menu actions."""
    return [
        {"id": "zoom-in", "label": "Zoom In", "shortcut": "Ctrl++", "icon": "🔍+"},
        {"id": "zoom-out", "label": "Zoom Out", "shortcut": "Ctrl+-", "icon": "🔍-"},
        {"id": "zoom-reset", "label": "Reset Zoom", "shortcut": "Ctrl+0", "icon": "🔄"},
        {"id": "fullscreen", "label": "Fullscreen", "shortcut": "F11", "icon": "⛶"},
        {"id": "reader-mode", "label": "Reader Mode", "shortcut": "Ctrl+Shift+R", "icon": "📖"},
        {"id": "dark-mode", "label": "Toggle Dark Mode", "shortcut": "Ctrl+Shift+D", "icon": "🌙"},
        {"id": "ai-sidebar", "label": "AI Sidebar", "shortcut": "Ctrl+Shift+A", "icon": "🤖"},
        {"id": "devtools", "label": "Developer Tools", "shortcut": "F12", "icon": "🔧"},
        {"id": "brightness-up", "label": "Brightness Up", "shortcut": "", "icon": "☀️"},
        {"id": "brightness-down", "label": "Brightness Down", "shortcut": "", "icon": "🌙"},
        {"id": "brightness-reset", "label": "Reset Brightness", "shortcut": "", "icon": "🔆"},
    ]
