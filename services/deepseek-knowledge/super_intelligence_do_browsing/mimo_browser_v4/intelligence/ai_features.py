"""MiMo Browser v4 — AI-Powered Features.
Inspired by: "Ces navigateurs sont capables de lire, résumer et structurer
l'information à la place de l'utilisateur" and "navigation agentique, où le
logiciel accomplit des tâches pour l'utilisateur."""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import quote

logger = logging.getLogger("mimo.v4.ai")


@dataclass
class PageSummary:
    """AI-generated page summary."""
    title: str
    summary: str
    key_points: list[str]
    reading_time_min: int
    word_count: int
    sentiment: str = "neutral"  # positive, negative, neutral
    topics: list[str] = field(default_factory=list)
    language: str = "en"


@dataclass
class SearchSuggestion:
    """Smart search suggestion."""
    query: str
    type: str  # history, trending, ai, search
    icon: str = "🔍"
    score: float = 0.0


class AIBrain:
    """AI brain for page analysis, summarization, and smart features."""

    def __init__(self) -> None:
        self._search_history: list[str] = []
        self._page_cache: dict[str, PageSummary] = {}
        self._bookmarks: list[dict[str, str]] = []

    # ── Summarization ──
    def summarize_page(self, title: str, html: str) -> PageSummary:
        """Generate a summary of the page content."""
        # Strip HTML tags for text extraction
        text = self._strip_html(html)
        words = text.split()
        word_count = len(words)
        reading_time = max(1, word_count // 200)

        # Extract key sentences (first sentence of each paragraph)
        paragraphs = [p.strip() for p in re.split(r'\n{2,}', text) if len(p.strip()) > 40]
        key_points = []
        for p in paragraphs[:5]:
            # Get first sentence
            sentences = re.split(r'(?<=[.!?])\s+', p)
            if sentences:
                point = sentences[0][:200]
                if len(point) > 20:
                    key_points.append(point)

        # Detect language (simplified)
        lang = self._detect_language(text)

        # Extract topics (most common meaningful words)
        topics = self._extract_topics(text)

        # Simple sentiment
        sentiment = self._analyze_sentiment(text)

        summary = self._generate_summary(title, key_points, word_count)

        result = PageSummary(
            title=title,
            summary=summary,
            key_points=key_points[:5],
            reading_time_min=reading_time,
            word_count=word_count,
            sentiment=sentiment,
            topics=topics[:8],
            language=lang,
        )
        return result

    def _generate_summary(self, title: str, key_points: list[str], word_count: int) -> str:
        """Generate a human-readable summary."""
        parts = [f"📄 {title}"]
        parts.append(f"📊 {word_count} words, ~{max(1, word_count // 200)} min read")
        if key_points:
            parts.append("\n🔑 Key Points:")
            for i, point in enumerate(key_points[:3], 1):
                parts.append(f"  {i}. {point}")
        return "\n".join(parts)

    def _strip_html(self, html: str) -> str:
        """Remove HTML tags and extract readable text."""
        # Remove script/style
        html = re.sub(r'<(script|style|noscript)[^>]*>.*?</\1>', ' ', html, flags=re.DOTALL | re.IGNORECASE)
        # Remove HTML comments
        html = re.sub(r'<!--.*?-->', ' ', html, flags=re.DOTALL)
        # Remove tags
        html = re.sub(r'<[^>]+>', ' ', html)
        # Decode entities
        html = html.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
        html = html.replace('&quot;', '"').replace('&#39;', "'").replace('&nbsp;', ' ')
        # Clean whitespace
        html = re.sub(r'\s+', ' ', html).strip()
        return html

    def _detect_language(self, text: str) -> str:
        """Simple language detection based on common words."""
        text_lower = text.lower()
        lang_indicators = {
            "en": ["the", "is", "and", "of", "to", "in", "a", "that", "it", "for"],
            "fr": ["le", "la", "les", "des", "est", "et", "en", "un", "une", "du"],
            "es": ["el", "la", "los", "las", "es", "en", "de", "que", "por", "con"],
            "de": ["der", "die", "das", "ist", "und", "ein", "eine", "von", "mit", "auf"],
        }
        scores = {}
        for lang, words in lang_indicators.items():
            scores[lang] = sum(1 for w in words if f" {w} " in f" {text_lower} ")
        if scores:
            best = max(scores, key=scores.get)  # type: ignore[arg-type]
            if scores[best] > 2:
                return best
        return "en"

    def _extract_topics(self, text: str) -> list[str]:
        """Extract key topics from text."""
        stop_words = {
            "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
            "have", "has", "had", "do", "does", "did", "will", "would", "could",
            "should", "may", "might", "shall", "can", "need", "dare", "ought",
            "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
            "as", "into", "through", "during", "before", "after", "above", "below",
            "between", "out", "off", "over", "under", "again", "further", "then",
            "once", "and", "but", "or", "nor", "not", "so", "yet", "both", "either",
            "neither", "each", "every", "all", "any", "few", "more", "most", "other",
            "some", "such", "no", "only", "own", "same", "than", "too", "very",
            "just", "because", "if", "when", "where", "how", "what", "which", "who",
            "this", "that", "these", "those", "it", "its", "he", "she", "they", "we",
            "you", "i", "me", "my", "your", "his", "her", "our", "their",
            "le", "la", "les", "des", "un", "une", "du", "de", "et", "est", "en",
        }
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        freq: dict[str, int] = {}
        for w in words:
            if w not in stop_words and len(w) > 3:
                freq[w] = freq.get(w, 0) + 1
        sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        return [w for w, _ in sorted_words[:15]]

    def _analyze_sentiment(self, text: str) -> str:
        """Simple sentiment analysis."""
        positive = ["good", "great", "excellent", "amazing", "wonderful", "best", "love",
                     "happy", "success", "beautiful", "perfect", "awesome", "brilliant",
                     "bon", "excellent", "merveilleux", "parfait", "superbe", "génial"]
        negative = ["bad", "terrible", "awful", "worst", "hate", "horrible", "ugly",
                     "failure", "sad", "angry", "disgusting", "poor", "wrong",
                     "mauvais", "terrible", "horrible", "nul", "affreux"]
        text_lower = text.lower()
        pos = sum(1 for w in positive if w in text_lower)
        neg = sum(1 for w in negative if w in text_lower)
        if pos > neg + 2:
            return "positive"
        elif neg > pos + 2:
            return "negative"
        return "neutral"

    # ── Smart Search ──
    def add_search_history(self, query: str) -> None:
        if query and query not in self._search_history:
            self._search_history.append(query)
            self._search_history = self._search_history[-100:]  # Keep last 100

    def get_suggestions(self, partial: str) -> list[SearchSuggestion]:
        """Get smart search suggestions."""
        suggestions = []
        partial_lower = partial.lower()

        # From history
        for query in reversed(self._search_history):
            if partial_lower in query.lower():
                suggestions.append(SearchSuggestion(
                    query=query, type="history", icon="🕐", score=0.8
                ))

        # AI-powered suggestions (simulated)
        if len(partial) > 2:
            ai_suggestions = self._generate_ai_suggestions(partial)
            suggestions.extend(ai_suggestions)

        # Deduplicate and sort
        seen = set()
        unique = []
        for s in sorted(suggestions, key=lambda x: x.score, reverse=True):
            if s.query not in seen:
                seen.add(s.query)
                unique.append(s)

        return unique[:8]

    def _generate_ai_suggestions(self, query: str) -> list[SearchSuggestion]:
        """Generate AI-powered search suggestions."""
        suggestions = []
        # Add question variants
        if not query.endswith("?"):
            suggestions.append(SearchSuggestion(
                query=f"{query} how to", type="ai", icon="🤖", score=0.6
            ))
            suggestions.append(SearchSuggestion(
                query=f"{query} tutorial", type="ai", icon="📚", score=0.5
            ))
            suggestions.append(SearchSuggestion(
                query=f"best {query}", type="ai", icon="⭐", score=0.4
            ))
        return suggestions

    # ── Page Analysis ──
    def analyze_page(self, url: str, html: str, headers: dict[str, str] | None = None) -> dict[str, Any]:
        """Full page analysis."""
        summary = self.summarize_page("Page", html)
        return {
            "summary": {
                "title": summary.title,
                "text": summary.summary,
                "keyPoints": summary.key_points,
                "readingTime": summary.reading_time_min,
                "wordCount": summary.word_count,
                "sentiment": summary.sentiment,
                "topics": summary.topics,
                "language": summary.language,
            },
            "security": self._check_security(url, headers or {}),
            "seo": self._check_seo(html),
            "performance": {
                "htmlSize": len(html),
                "resourceCount": html.count('<img') + html.count('<script') + html.count('<link'),
            },
        }

    def _check_security(self, url: str, headers: dict[str, str]) -> dict[str, Any]:
        """Check page security."""
        score = 100
        issues = []
        if not url.startswith("https://"):
            score -= 30
            issues.append("Not HTTPS")
        security_headers = ["X-Frame-Options", "X-Content-Type-Options", "Content-Security-Policy"]
        for h in security_headers:
            if h not in headers:
                score -= 10
                issues.append(f"Missing {h}")
        return {"score": max(0, score), "issues": issues}

    def _check_seo(self, html: str) -> dict[str, Any]:
        """Basic SEO analysis."""
        has_title = bool(re.search(r'<title>[^<]+</title>', html, re.IGNORECASE))
        has_meta_desc = bool(re.search(r'<meta[^>]*name=["\']description["\']', html, re.IGNORECASE))
        has_h1 = bool(re.search(r'<h1[^>]*>', html, re.IGNORECASE))
        has_canonical = bool(re.search(r'<link[^>]*rel=["\']canonical["\']', html, re.IGNORECASE))
        has_og = bool(re.search(r'<meta[^>]*property=["\']og:', html, re.IGNORECASE))
        score = sum([has_title * 20, has_meta_desc * 20, has_h1 * 15, has_canonical * 15, has_og * 15, 15])
        return {
            "score": min(100, score),
            "title": has_title,
            "metaDescription": has_meta_desc,
            "h1": has_h1,
            "canonical": has_canonical,
            "openGraph": has_og,
        }

    # ── Agent Mode ──
    def agent_search(self, query: str) -> dict[str, Any]:
        """AI agent search — find and summarize results."""
        # In a real implementation, this would call a search API
        # For now, return a structured response
        return {
            "query": query,
            "results": [],
            "summary": f"Agent search for: {query}",
            "suggestions": [f"{query} guide", f"{query} examples", f"{query} documentation"],
        }

    @property
    def stats(self) -> dict[str, Any]:
        return {
            "searchHistory": len(self._search_history),
            "cachedPages": len(self._page_cache),
        }
