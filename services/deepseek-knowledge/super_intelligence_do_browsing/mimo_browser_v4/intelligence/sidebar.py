"""
intelligence/sidebar.py - AI Sidebar Chat Engine

The AISidebar class provides AI-powered assistance for the browser sidebar,
including page summarization, Q&A, translation, and suggested questions.
"""

from __future__ import annotations

import re
from typing import Any

from bs4 import BeautifulSoup


# --- Translation placeholder ---

_TRANSLATION_NOTE = (
    "[Translation service placeholder - in production this would call "
    "a translation API like Google Translate or DeepL]"
)

# --- Question templates ---

_SUMMARY_QUESTIONS = [
    "What is this page about?",
    "Summarize the key points",
    "What are the main takeaways?",
    "Give me a brief overview",
]

_DETAIL_QUESTIONS = [
    "What is the main argument?",
    "Are there any important details I should know?",
    "What are the pros and cons mentioned?",
    "Is there a conclusion or recommendation?",
]

_ACTION_QUESTIONS = [
    "Can you extract the key data?",
    "What links are on this page?",
    "Are there any forms on this page?",
    "What images are included?",
]

_PAGE_TYPE_QUESTIONS: dict[str, list[str]] = {
    "article": [
        "What is the article about?",
        "Who is the author?",
        "What is the main thesis?",
        "What evidence is provided?",
    ],
    "product": [
        "What is the price?",
        "What are the key features?",
        "Are there reviews?",
        "What are the specifications?",
    ],
    "search_results": [
        "What are the top results?",
        "How many results are there?",
        "What is the most relevant result?",
    ],
    "login": [
        "What credentials are needed?",
        "Is this a secure login page?",
        "What services does this login provide access to?",
    ],
    "video": [
        "What is the video about?",
        "How long is the video?",
        "Who created this video?",
    ],
    "forum": [
        "What is the discussion about?",
        "How many replies are there?",
        "What is the most popular opinion?",
    ],
    "news": [
        "What happened?",
        "When did this occur?",
        "Who is involved?",
        "What is the source?",
    ],
}


class AISidebar:
    """AI-powered sidebar chat engine for MiMo Browser v4.

    Provides page summarization, Q&A, translation, and question suggestions.
    """

    def summarize_page(self, html: str) -> str:
        """Extract and condense the main text of a page into a summary.

        Args:
            html: Raw HTML string.

        Returns:
            A condensed text summary of the page.
        """
        if not html:
            return "No content available to summarize."

        try:
            soup = BeautifulSoup(html, "html.parser")
        except Exception:
            return "Unable to parse page content."

        # Remove non-content elements
        for element in soup(
            ["script", "style", "noscript", "meta", "link", "head",
             "nav", "footer", "header", "aside", "iframe"]
        ):
            element.decompose()

        # Try to find main content area
        main_content = (
            soup.find("main")
            or soup.find("article")
            or soup.find(class_=re.compile(r"content|article|post|entry|main", re.I))
            or soup.find(id=re.compile(r"content|article|post|entry|main", re.I))
        )

        if main_content:
            text = main_content.get_text(separator=" ", strip=True)
        else:
            text = soup.get_text(separator=" ", strip=True)

        # Normalize whitespace
        text = re.sub(r"\s+", " ", text).strip()

        if not text:
            return "No readable content found on this page."

        # Split into sentences
        sentences = re.split(r"(?<=[.!?])\s+", text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]

        if not sentences:
            return text[:500]

        # Take first few meaningful sentences for summary
        summary_sentences = sentences[:5]
        summary = " ".join(summary_sentences)

        # If still too long, truncate
        if len(summary) > 500:
            summary = summary[:497] + "..."

        return summary

    def answer_question(self, html: str, question: str) -> str:
        """Answer a question about the page content using keyword matching.

        Args:
            html: Raw HTML string.
            question: The user's question.

        Returns:
            A text answer based on page content.
        """
        if not html:
            return "No page content available to answer the question."

        if not question:
            return "Please provide a question."

        try:
            soup = BeautifulSoup(html, "html.parser")
        except Exception:
            return "Unable to parse page content."

        # Remove non-content elements
        for element in soup(
            ["script", "style", "noscript", "meta", "link", "head"]
        ):
            element.decompose()

        text = soup.get_text(separator=" ", strip=True)
        text = re.sub(r"\s+", " ", text).strip()

        if not text:
            return "No readable content found to answer your question."

        # Extract keywords from question (remove stopwords)
        stopwords = {
            "what", "is", "are", "the", "a", "an", "in", "on", "at", "to",
            "for", "of", "and", "or", "but", "not", "no", "can", "could",
            "would", "should", "do", "does", "did", "has", "have", "had",
            "was", "were", "been", "being", "this", "that", "these", "those",
            "it", "its", "i", "me", "my", "we", "our", "you", "your",
            "he", "she", "they", "them", "his", "her", "their",
            "which", "who", "whom", "where", "when", "why", "how",
            "about", "from", "with", "by", "as", "into", "through",
            "there", "here", "all", "each", "every", "both", "few",
            "more", "most", "other", "some", "such", "than", "too", "very",
        }

        question_words = [
            w.lower()
            for w in re.findall(r"\b[a-zA-Z]+\b", question)
            if w.lower() not in stopwords and len(w) > 2
        ]

        if not question_words:
            return f"I found this on the page: {text[:300]}..."

        # Score sentences by keyword overlap
        sentences = re.split(r"(?<=[.!?])\s+", text)
        scored_sentences: list[tuple[float, str]] = []

        for sentence in sentences:
            sentence_lower = sentence.lower()
            words_in_sentence = set(re.findall(r"\b[a-zA-Z]+\b", sentence_lower))
            score = len(words_in_sentence & set(question_words))
            if score > 0:
                scored_sentences.append((float(score), sentence.strip()))

        if not scored_sentences:
            return f"I couldn't find specific information about '{question}' on this page. Here's a general overview: {text[:200]}..."

        # Sort by score descending
        scored_sentences.sort(key=lambda x: x[0], reverse=True)

        # Take top sentences
        top_sentences = [s for _, s in scored_sentences[:3]]
        answer = " ".join(top_sentences)

        if len(answer) > 500:
            answer = answer[:497] + "..."

        return answer

    def translate_text(self, text: str, target_lang: str) -> str:
        """Translate text to a target language (placeholder).

        Args:
            text: Text to translate.
            target_lang: Target language code (e.g., 'es', 'fr', 'de').

        Returns:
            Translated text (placeholder in this implementation).
        """
        if not text:
            return ""

        if not target_lang:
            return text

        return (
            f"[{target_lang.upper()}] {text}\n\n"
            f"Note: {_TRANSLATION_NOTE}"
        )

    def get_page_qa_suggestions(self, html: str) -> list[str]:
        """Generate suggested questions for the current page.

        Args:
            html: Raw HTML string.

        Returns:
            List of suggested question strings.
        """
        suggestions: list[str] = []

        # Always include summary questions
        suggestions.extend(_SUMMARY_QUESTIONS[:2])

        # Detect page type for targeted questions
        page_type = self._detect_page_type_simple(html)

        if page_type in _PAGE_TYPE_QUESTIONS:
            type_questions = _PAGE_TYPE_QUESTIONS[page_type]
            suggestions.extend(type_questions[:2])

        # Add detail questions
        suggestions.extend(_DETAIL_QUESTIONS[:1])

        # Add action questions
        suggestions.extend(_ACTION_QUESTIONS[:1])

        # Deduplicate while preserving order
        seen: set[str] = set()
        unique: list[str] = []
        for q in suggestions:
            if q not in seen:
                seen.add(q)
                unique.append(q)

        return unique[:6]

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _detect_page_type_simple(html: str) -> str:
        """Simple page type detection for question suggestions."""
        if not html:
            return "unknown"

        html_lower = html.lower()

        # Quick heuristics
        if re.search(r"<article", html_lower):
            return "article"
        if re.search(r'class="[^"]*product', html_lower):
            return "product"
        if re.search(r'class="[^"]*search-result', html_lower):
            return "search_results"
        if re.search(r'<input[^>]*type="password"', html_lower):
            return "login"
        if re.search(r"<video|youtube\.com/embed|vimeo\.com", html_lower):
            return "video"
        if re.search(r'class="[^"]*forum|class="[^"]*thread', html_lower):
            return "forum"
        if re.search(r'class="[^"]*news|class="[^"]*headline', html_lower):
            return "news"

        return "unknown"
