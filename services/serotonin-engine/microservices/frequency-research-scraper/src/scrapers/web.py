"""Web scraper for articles and blogs about frequency healing"""

import asyncio
import logging
import re
from typing import List, Optional
from datetime import datetime
from urllib.parse import urlparse

from bs4 import BeautifulSoup

from ..scraper_engine import FrequencyScraper, ResearchEntry

logger = logging.getLogger(__name__)

class WebScraper(FrequencyScraper):
    """Scrape web articles about frequency healing"""
    
    FREQUENCY_SOURCES = [
        # Research-oriented sites
        {"url": "https://www.ncbi.nlm.nih.gov/pmc/", "type": "academic", "name": "PubMed Central"},
        {"url": "https://scholar.google.com/", "type": "academic", "name": "Google Scholar"},
        {"url": "https://www.researchgate.net/", "type": "academic", "name": "ResearchGate"},
        
        # Frequency healing resources
        {"url": "https://soundtherapycenter.com/", "type": "practitioner", "name": "Sound Therapy Center"},
        {"url": "https://www.frequencyresearcher.com/", "type": "researcher", "name": "Frequency Researcher"},
        {"url": "https://solfeggiofrequency.com/", "type": "educational", "name": "Solfeggio Frequency"},
        {"url": "https://www.healingfrequency.com/", "type": "practitioner", "name": "Healing Frequency"},
        
        # Science and health
        {"url": "https://www.frontiersin.org/articles", "type": "academic", "name": "Frontiers"},
        {"url": "https://www.sciencedirect.com/", "type": "academic", "name": "ScienceDirect"},
    ]
    
    # Specific pages known to have frequency research
    KNOWN_RESEARCH_PAGES = [
        "https://pubmed.ncbi.nlm.nih.gov/?term=solfeggio+frequencies",
        "https://pubmed.ncbi.nlm.nih.gov/?term=binaural+beats+therapy",
        "https://pubmed.ncbi.nlm.nih.gov/?term=sound+frequency+healing",
        "https://arxiv.org/search/?query=frequency+healing&searchtype=all",
        "https://scholar.google.com/scholar?q=solfeggio+frequencies+therapy"
    ]

    async def scrape_article(self, url: str) -> Optional[ResearchEntry]:
        """Scrape a single article"""
        html = await self.fetch(url)
        if not html:
            return None
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extract title
        title = None
        if soup.title:
            title = soup.title.text.strip()
        if not title:
            title_tag = soup.find('h1')
            if title_tag:
                title = title_tag.text.strip()
        if not title:
            title = url
        
        # Extract authors (common patterns)
        authors = self._extract_authors(soup)
        
        # Extract main content
        content = self._extract_content(soup)
        
        # Extract abstract if present
        abstract = self._extract_abstract(soup)
        
        # Extract publication date
        pub_date = self._extract_date(soup)
        
        if not content or len(content) < 100:
            return None
        
        frequencies = self.extract_frequencies(content)
        effects = self.extract_effects(content)
        
        source_type = self._classify_source(url)
        
        return ResearchEntry(
            id=self.generate_id(title, url),
            source_type=source_type,
            title=title[:500],
            authors=authors,
            abstract=abstract[:1000] if abstract else content[:500],
            content=content[:30000],
            frequencies_mentioned=frequencies,
            effects_claimed=effects,
            source_url=url,
            source_citation=f"Web: {urlparse(url).netloc}",
            publication_date=pub_date,
            scraped_at=datetime.now().isoformat(),
            reliability_score=self.calculate_reliability(
                source_type, bool(url), bool(abstract), len(frequencies)
            ),
            tags=[source_type, urlparse(url).netloc]
        )

    def _extract_authors(self, soup: BeautifulSoup) -> List[str]:
        """Extract authors from common HTML patterns"""
        authors = []
        
        # Meta author tag
        meta_author = soup.find('meta', attrs={'name': 'author'})
        if meta_author:
            authors.append(meta_author.get('content', ''))
        
        # Common author class patterns
        author_patterns = [
            'author', 'byline', 'writer', 'contributor',
            'article-author', 'post-author', 'entry-author'
        ]
        
        for pattern in author_patterns:
            elements = soup.find_all(class_=re.compile(pattern, re.I))
            for elem in elements:
                text = elem.get_text().strip()
                if text and len(text) < 100:
                    authors.append(text)
        
        # Structured data
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                import json
                data = json.loads(script.string)
                if isinstance(data, dict):
                    if 'author' in data:
                        author = data['author']
                        if isinstance(author, dict):
                            authors.append(author.get('name', ''))
                        elif isinstance(author, str):
                            authors.append(author)
            except:
                continue
        
        return list(set([a for a in authors if a]))[:5]

    def _extract_content(self, soup: BeautifulSoup) -> str:
        """Extract main article content"""
        # Remove scripts, styles, nav, footer, ads
        for tag in soup.find_all(['script', 'style', 'nav', 'footer', 'aside', 'header']):
            tag.decompose()
        
        # Try common article containers
        article_selectors = [
            'article', '.article-content', '.post-content', '.entry-content',
            '.article-body', '.story-body', '.content-body', 'main',
            '[itemprop="articleBody"]', '.prose', '.markdown'
        ]
        
        for selector in article_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text(separator=' ', strip=True)
        
        # Fallback to body
        body = soup.find('body')
        if body:
            return body.get_text(separator=' ', strip=True)
        
        return ""

    def _extract_abstract(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract abstract if present"""
        abstract_selectors = [
            '.abstract', '#abstract', '[itemprop="abstract"]',
            '.summary', '.tldr', '.overview'
        ]
        
        for selector in abstract_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text(strip=True)
        
        meta_abstract = soup.find('meta', attrs={'name': 'description'})
        if meta_abstract:
            return meta_abstract.get('content', '')
        
        return None

    def _extract_date(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract publication date"""
        date_selectors = [
            'time[datetime]', '.date', '.publish-date', '.post-date',
            '[itemprop="datePublished"]', '.entry-date'
        ]
        
        for selector in date_selectors:
            element = soup.select_one(selector)
            if element:
                if element.get('datetime'):
                    return element['datetime'][:10]
                text = element.get_text(strip=True)
                if text:
                    # Try to extract date-like pattern
                    date_match = re.search(r'\d{4}[-/]\d{2}[-/]\d{2}', text)
                    if date_match:
                        return date_match.group()
                    return text[:20]
        
        return None

    def _classify_source(self, url: str) -> str:
        """Classify source type based on URL"""
        domain = urlparse(url).netloc.lower()
        
        academic_domains = ['.edu', 'arxiv.org', 'pubmed', 'ncbi.nlm.nih.gov',
                           'scholar.google', 'researchgate', 'sciencedirect',
                           'springer', 'wiley', 'ieee.org']
        
        if any(d in domain for d in academic_domains):
            return "academic"
        
        news_domains = ['bbc.com', 'cnn.com', 'nytimes.com', 'theguardian',
                       'washingtonpost.com', 'reuters.com', 'apnews.com']
        
        if any(d in domain for d in news_domains):
            return "news"
        
        return "web"

    async def scrape_search_results(self, search_url: str, max_pages: int = 10) -> List[ResearchEntry]:
        """Scrape search results page and follow links"""
        entries = []
        
        html = await self.fetch(search_url)
        if not html:
            return entries
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extract all article links
        links = []
        for a in soup.find_all('a', href=True):
            href = a['href']
            if href.startswith('http') and self._is_article_link(href):
                links.append(href)
        
        # Scrape each article
        for link in links[:max_pages]:
            entry = await self.scrape_article(link)
            if entry:
                entries.append(entry)
                logger.info(f"  Scraped: {entry.title[:60]}")
        
        return entries

    def _is_article_link(self, url: str) -> bool:
        """Check if URL looks like an article"""
        exclude = ['.pdf', '.jpg', '.png', '.gif', '.css', '.js', 
                  'login', 'signup', 'contact', 'about', 'privacy']
        return not any(e in url.lower() for e in exclude)

    async def scrape_all_web(self, max_per_source: int = 5) -> List[ResearchEntry]:
        """Scrape all known web sources"""
        all_entries = []
        
        # Scrape known research pages
        for url in self.KNOWN_RESEARCH_PAGES:
            logger.info(f"Scraping search page: {url}")
            entries = await self.scrape_search_results(url, max_per_source)
            all_entries.extend(entries)
        
        # Deduplicate
        seen = set()
        unique = []
        for entry in all_entries:
            if entry.id not in seen:
                seen.add(entry.id)
                unique.append(entry)
        
        return unique
