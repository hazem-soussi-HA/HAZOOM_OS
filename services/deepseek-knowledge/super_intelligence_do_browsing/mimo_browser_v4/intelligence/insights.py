"""
intelligence/insights.py - Page Insights Engine

The PageInsights class provides a comprehensive overview of a web page,
combining data from the analyzer, language detection, and content metrics.
"""

from __future__ import annotations

import re
import urllib.parse
from typing import Any

from bs4 import BeautifulSoup

from .analyzer import PageAnalyzer


# --- Language detection patterns ---

_LANGUAGE_MAP: dict[str, str] = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ru": "Russian",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese",
    "ar": "Arabic",
    "hi": "Hindi",
    "nl": "Dutch",
    "sv": "Swedish",
    "no": "Norwegian",
    "da": "Danish",
    "fi": "Finnish",
    "pl": "Polish",
    "tr": "Turkish",
    "th": "Thai",
    "vi": "Vietnamese",
    "id": "Indonesian",
    "cs": "Czech",
    "el": "Greek",
    "he": "Hebrew",
    "hu": "Hungarian",
    "ro": "Romanian",
    "uk": "Ukrainian",
}

# Common stopwords per language for heuristic detection
_LANGUAGE_STOPWORDS: dict[str, set[str]] = {
    "en": {"the", "is", "at", "which", "on", "a", "an", "and", "or", "but", "in", "with", "to", "for", "of", "not", "no", "can", "had", "has", "have", "was", "were", "are", "been", "being", "this", "that", "these", "those", "from", "into", "about", "between", "through", "during", "before", "after", "above", "below", "then", "once", "here", "there", "when", "where", "why", "how", "all", "each", "every", "both", "few", "more", "most", "other", "some", "such", "only", "own", "same", "than", "too", "very", "just", "because", "as", "until", "while", "although", "though", "after", "before", "since", "unless", "whether"},
    "es": {"el", "la", "los", "las", "un", "una", "unos", "unas", "y", "o", "pero", "en", "de", "del", "al", "con", "para", "por", "es", "son", "fue", "ser", "estar", "como", "más", "menos", "muy", "también", "este", "esta", "estos", "estas", "ese", "esa", "aquel", "aquella"},
    "fr": {"le", "la", "les", "un", "une", "des", "et", "ou", "mais", "en", "de", "du", "au", "aux", "avec", "pour", "par", "est", "sont", "être", "avoir", "comme", "plus", "moins", "très", "aussi", "ce", "cette", "ces", "mon", "ton", "son"},
    "de": {"der", "die", "das", "ein", "eine", "und", "oder", "aber", "in", "von", "zu", "mit", "für", "auf", "ist", "sind", "war", "sein", "haben", "wie", "mehr", "weniger", "sehr", "auch", "dieser", "diese", "dieses", "jener", "jene"},
    "pt": {"o", "a", "os", "as", "um", "uma", "uns", "umas", "e", "ou", "mas", "em", "de", "do", "da", "dos", "das", "com", "para", "por", "é", "são", "ser", "estar", "como", "mais", "menos", "muito", "também", "este", "esta", "esse", "essa"},
}

# --- Ad detection patterns ---

_AD_PATTERNS = [
    re.compile(r"adsbygoogle", re.I),
    re.compile(r"doubleclick", re.I),
    re.compile(r"googlesyndication", re.I),
    re.compile(r"amazon-adsystem", re.I),
    re.compile(r"ad-banner", re.I),
    re.compile(r"advertisement", re.I),
    re.compile(r"google_ad", re.I),
    re.compile(r"ad-container", re.I),
    re.compile(r"ad-wrapper", re.I),
    re.compile(r"ad-slot", re.I),
    re.compile(r"ad-unit", re.I),
    re.compile(r"banner-ad", re.I),
    re.compile(r"sponsored", re.I),
    re.compile(r"promoted", re.I),
]


class PageInsights:
    """Generates comprehensive insights about a web page.

    Combines data from PageAnalyzer with additional metrics like
    link count, image count, ad detection, language, and summary.
    """

    def __init__(self) -> None:
        self._analyzer = PageAnalyzer()

    def get_insights(self, url: str, html: str) -> dict[str, Any]:
        """Generate comprehensive page insights.

        Args:
            url: The page URL.
            html: Raw HTML string.

        Returns:
            Dict with keys:
                - reading_time: int (minutes)
                - word_count: int
                - tech_stack: list[str]
                - security_rating: dict
                - link_count: int
                - image_count: int
                - has_ads: bool
                - language: str
                - summary: str (first 200 chars of text)
                - page_type: str
                - domain: str
        """
        result: dict[str, Any] = {
            "reading_time": 0,
            "word_count": 0,
            "tech_stack": [],
            "security_rating": {},
            "link_count": 0,
            "image_count": 0,
            "has_ads": False,
            "language": "unknown",
            "summary": "",
            "page_type": "unknown",
            "domain": "",
        }

        # Domain
        parsed = urllib.parse.urlparse(url)
        result["domain"] = parsed.netloc or parsed.path

        if not html:
            return result

        try:
            soup = BeautifulSoup(html, "html.parser")
        except Exception:
            return result

        # Use PageAnalyzer for core metrics
        result["reading_time"] = self._analyzer.extract_reading_time(html)
        result["word_count"] = self._analyzer.extract_word_count(html)
        result["tech_stack"] = self._analyzer.detect_tech_stack(html)
        result["security_rating"] = self._analyzer.get_security_rating(url, html)
        result["page_type"] = self._analyzer.detect_page_type(html)

        # Link count
        links = soup.find_all("a", href=True)
        result["link_count"] = len(links)

        # Image count
        images = soup.find_all("img")
        result["image_count"] = len(images)

        # Ad detection
        result["has_ads"] = self._detect_ads(html, soup)

        # Language detection
        result["language"] = self._detect_language(soup)

        # Summary (first 200 chars of visible text)
        result["summary"] = self._extract_summary(soup)

        return result

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _detect_ads(html: str, soup: BeautifulSoup) -> bool:
        """Detect if the page contains advertisements."""
        html_lower = html.lower()

        for pattern in _AD_PATTERNS:
            if pattern.search(html_lower):
                return True

        # Check for common ad container classes/ids
        ad_elements = soup.find_all(
            class_=re.compile(r"\bad\b|ads|advert|sponsor|promo", re.I)
        )
        if ad_elements:
            return True

        ad_ids = soup.find_all(
            id=re.compile(r"\bad\b|ads|advert|sponsor|promo", re.I)
        )
        if ad_ids:
            return True

        # Check for iframes with ad-related src
        iframes = soup.find_all("iframe", src=True)
        for iframe in iframes:
            src = str(iframe["src"]).lower()
            if any(kw in src for kw in ["ad", "doubleclick", "syndication", "adsense"]):
                return True

        return False

    @staticmethod
    def _detect_language(soup: BeautifulSoup) -> str:
        """Detect the language of the page content."""
        # Check HTML lang attribute
        html_tag = soup.find("html")
        if html_tag and html_tag.get("lang"):
            lang_code = str(html_tag["lang"]).split("-")[0].lower()
            if lang_code in _LANGUAGE_MAP:
                return _LANGUAGE_MAP[lang_code]

        # Check meta http-equiv content-language
        meta_lang = soup.find("meta", attrs={"http-equiv": re.compile(r"content-language", re.I)})
        if meta_lang and meta_lang.get("content"):
            lang_code = str(meta_lang["content"]).split("-")[0].lower()
            if lang_code in _LANGUAGE_MAP:
                return _LANGUAGE_MAP[lang_code]

        # Check meta name language
        meta_name_lang = soup.find("meta", attrs={"name": re.compile(r"language", re.I)})
        if meta_name_lang and meta_name_lang.get("content"):
            lang_code = str(meta_name_lang["content"]).split("-")[0].lower()
            if lang_code in _LANGUAGE_MAP:
                return _LANGUAGE_MAP[lang_code]

        # Heuristic: check stopwords in visible text
        for element in soup(["script", "style", "noscript", "meta", "link"]):
            element.decompose()

        text = soup.get_text(separator=" ", strip=True)
        words = set(re.findall(r"\b[a-zA-ZÀ-ÿа-яА-Я\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]+\b", text.lower()))

        best_lang = "English"
        best_score = 0

        for lang_code, stopwords in _LANGUAGE_STOPWORDS.items():
            score = len(words & stopwords)
            if score > best_score:
                best_score = score
                best_lang = _LANGUAGE_MAP.get(lang_code, lang_code)

        return best_lang

    @staticmethod
    def _extract_summary(soup: BeautifulSoup) -> str:
        """Extract a summary (first ~200 chars of visible text)."""
        for element in soup(["script", "style", "noscript", "meta", "link", "head"]):
            element.decompose()

        text = soup.get_text(separator=" ", strip=True)
        # Normalize whitespace
        text = re.sub(r"\s+", " ", text).strip()

        if len(text) <= 200:
            return text

        # Try to break at a sentence boundary
        truncated = text[:200]
        last_period = truncated.rfind(".")
        last_space = truncated.rfind(" ")

        if last_period > 100:
            return truncated[: last_period + 1]
        elif last_space > 50:
            return truncated[:last_space] + "..."

        return truncated + "..."
