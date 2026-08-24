"""MiMo Browser v4 — Reader mode content extractor.

Uses BeautifulSoup to strip clutter from web pages and present a clean,
readable view with configurable themes.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from bs4 import BeautifulSoup, Tag

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Theme definitions
# ---------------------------------------------------------------------------

_THEMES: dict[str, dict[str, str]] = {
    "light": {
        "bg": "#ffffff",
        "fg": "#1a1a1a",
        "link": "#1a73e8",
        "font": "Georgia, 'Times New Roman', serif",
        "font_size": "18px",
        "line_height": "1.8",
        "max_width": "720px",
    },
    "dark": {
        "bg": "#1a1a2e",
        "fg": "#e0e0e0",
        "link": "#00d4ff",
        "font": "Georgia, 'Times New Roman', serif",
        "font_size": "18px",
        "line_height": "1.8",
        "max_width": "720px",
    },
    "sepia": {
        "bg": "#f4ecd8",
        "fg": "#5c4b37",
        "link": "#8b6914",
        "font": "Georgia, 'Times New Roman', serif",
        "font_size": "18px",
        "line_height": "1.8",
        "max_width": "720px",
    },
    "midnight": {
        "bg": "#0d1117",
        "fg": "#c9d1d9",
        "link": "#58a6ff",
        "font": "'Segoe UI', system-ui, sans-serif",
        "font_size": "17px",
        "line_height": "1.75",
        "max_width": "760px",
    },
}

# Tags that are typically non-content
_NOISE_TAGS = {
    "script", "style", "noscript", "iframe", "object", "embed",
    "nav", "footer", "header", "aside", "form", "input", "button",
    "select", "textarea", "label", "svg", "canvas", "video", "audio",
    "source", "track", "map", "area", "template",
}

_NOISE_CLASSES = re.compile(
    r"(comment|sidebar|footer|header|nav|menu|ad|popup|modal|overlay|"
    r"social|share|related|recommend|newsletter|subscribe|widget|"
    r"cookie|consent|banner|promo|sponsor)",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Reader mode
# ---------------------------------------------------------------------------

class ReaderMode:
    """Extract and re-theme article content from raw HTML.

    Usage:
        reader = ReaderMode()
        content = reader.extract_content(html)
        styled = reader.apply_theme(content, theme="dark")
    """

    def __init__(self) -> None:
        self._themes = dict(_THEMES)

    # ------------------------------------------------------------------
    # Extraction
    # ------------------------------------------------------------------

    def extract_content(self, html: str) -> dict[str, Any]:
        """Extract the main article content from raw *html*.

        Returns a dict with keys:
            - title: str
            - body_html: str
            - word_count: int
            - reading_time: int  (minutes)
            - hero_image: str | None
        """
        soup = BeautifulSoup(html, "html.parser")

        title = self._extract_title(soup)
        hero_image = self._extract_hero_image(soup)
        body_html = self._extract_body(soup)
        word_count = len(re.findall(r"\w+", str(body_html)))
        reading_time = max(1, round(word_count / 200))  # ~200 wpm

        return {
            "title": title,
            "body_html": body_html,
            "word_count": word_count,
            "reading_time": reading_time,
            "hero_image": hero_image,
        }

    # ------------------------------------------------------------------
    # Theming
    # ------------------------------------------------------------------

    def apply_theme(self, content: dict[str, Any], theme: str = "light") -> str:
        """Wrap extracted *content* in a styled HTML document."""
        if theme not in self._themes:
            logger.warning("Unknown theme %r — falling back to 'light'.", theme)
            theme = "light"

        t = self._themes[theme]
        title_escaped = self._esc(content.get("title", ""))
        body = content.get("body_html", "")
        hero = content.get("hero_image")
        wc = content.get("word_count", 0)
        rt = content.get("reading_time", 1)

        hero_html = ""
        if hero:
            hero_html = (
                f'<img src="{self._esc(hero)}" alt="{title_escaped}" '
                f'style="max-width:100%;border-radius:8px;margin-bottom:1.5em;" />'
            )

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title_escaped}</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: {t['bg']};
    color: {t['fg']};
    font-family: {t['font']};
    font-size: {t['font_size']};
    line-height: {t['line_height']};
    padding: 2em 1em;
  }}
  .reader-container {{
    max-width: {t['max_width']};
    margin: 0 auto;
  }}
  h1 {{ font-size: 2em; margin-bottom: 0.5em; }}
  .meta {{ opacity: 0.6; font-size: 0.85em; margin-bottom: 2em; }}
  a {{ color: {t['link']}; }}
  p, ul, ol, blockquote, pre {{ margin-bottom: 1.2em; }}
  img {{ max-width: 100%; height: auto; }}
  pre {{
    background: rgba(128,128,128,0.15);
    padding: 1em;
    overflow-x: auto;
    border-radius: 6px;
  }}
  blockquote {{
    border-left: 3px solid {t['link']};
    padding-left: 1em;
    opacity: 0.85;
  }}
</style>
</head>
<body>
<div class="reader-container">
  <h1>{title_escaped}</h1>
  <div class="meta">{wc} words · {rt} min read</div>
  {hero_html}
  {body}
</div>
</body>
</html>"""

    def get_available_themes(self) -> list[str]:
        """Return the list of available theme names."""
        return sorted(self._themes.keys())

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _extract_title(self, soup: BeautifulSoup) -> str:
        # <meta property="og:title">
        og = soup.find("meta", property="og:title")
        if og:
            content = str(og.get("content", ""))
            if content.strip():
                return content.strip()
        # <title>
        if soup.title and soup.title.string:
            return soup.title.string.strip()
        # First <h1>
        h1 = soup.find("h1")
        if h1:
            return h1.get_text(strip=True)
        return "Untitled"

    def _extract_hero_image(self, soup: BeautifulSoup) -> str | None:
        # og:image
        og = soup.find("meta", property="og:image")
        if og:
            content = str(og.get("content", ""))
            if content.strip():
                return content.strip()
        # twitter:image
        tw = soup.find("meta", attrs={"name": "twitter:image"})
        if tw:
            content = str(tw.get("content", ""))
            if content.strip():
                return content.strip()
        # First meaningful <img>
        for img in soup.find_all("img"):
            src = str(img.get("src", ""))
            if src and not src.startswith("data:"):
                w = str(img.get("width", ""))
                if w and w.isdigit() and int(w) < 100:
                    continue
                return src
        return None

    def _extract_body(self, soup: BeautifulSoup) -> str:
        # Try <article> first
        article = soup.find("article")
        if article:
            return self._clean_and_render(article)

        # Try common content containers
        for selector in [
            "main", "[role='main']",
            ".post-content", ".article-content", ".entry-content",
            ".post-body", ".article-body", ".story-body",
            "#content", ".content",
        ]:
            container = soup.select_one(selector)
            if container:
                return self._clean_and_render(container)

        # Fallback: <body> with noise removed
        body = soup.find("body")
        if body:
            return self._clean_and_render(body)

        return str(soup)

    def _clean_and_render(self, node: Tag) -> str:
        """Remove noise tags and render the remaining HTML."""
        from bs4 import BeautifulSoup, Tag as BsTag
        clone = BeautifulSoup(str(node), "html.parser")
        for tag in clone.find_all(_NOISE_TAGS):
            tag.decompose()
        for tag in clone.find_all(True):
            cls = tag.get("class", None)
            if isinstance(cls, list):
                classes = " ".join(str(c) for c in cls)
            elif cls is not None:
                classes = str(cls)
            else:
                classes = ""
            if _NOISE_CLASSES.search(classes):
                tag.decompose()
        # Return inner HTML
        html_parts = []
        for child in clone.children:
            html_parts.append(str(child))
        return "".join(html_parts)

    @staticmethod
    def _esc(text: str) -> str:
        return (
            text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
        )
