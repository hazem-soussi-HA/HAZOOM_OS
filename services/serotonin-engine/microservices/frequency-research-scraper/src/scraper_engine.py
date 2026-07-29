"""Core scraper engine for frequency research"""

import asyncio
import hashlib
import json
import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, asdict

import aiohttp
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

@dataclass
class ResearchEntry:
    id: str
    source_type: str  # academic, book, web
    title: str
    authors: List[str]
    abstract: str
    content: str
    frequencies_mentioned: List[float]
    effects_claimed: List[str]
    source_url: Optional[str]
    source_citation: Optional[str]
    publication_date: Optional[str]
    scraped_at: str
    reliability_score: float  # 0-1
    tags: List[str]

class FrequencyScraper:
    """Base scraper with frequency extraction capabilities"""
    
    FREQUENCY_PATTERN = re.compile(
        r'(\d+\.?\d*)\s*(?:Hz|hertz|赫兹)',
        re.IGNORECASE
    )
    
    EFFECT_PATTERNS = {
        'serotonin': re.compile(r'serotonin|5-HT|serotonergic', re.I),
        'dopamine': re.compile(r'dopamine|dopaminergic', re.I),
        'oxytocin': re.compile(r'oxytocin', re.I),
        'endorphin': re.compile(r'endorphin|enkephalin', re.I),
        'cortisol': re.compile(r'cortisol|stress hormone', re.I),
        'melatonin': re.compile(r'melatonin', re.I),
        'gaba': re.compile(r'GABA|gamma-aminobutyric', re.I),
        'healing': re.compile(r'heal|recovery|repair|restor', re.I),
        'pain_relief': re.compile(r'pain|analges|analgesic', re.I),
        'relaxation': re.compile(r'relax|calm|peace|serenity', re.I),
        'focus': re.compile(r'focus|concentration|attention', re.I),
        'sleep': re.compile(r'sleep|insomnia|rest', re.I),
        'anxiety': re.compile(r'anxiety|anxiolytic|stress', re.I),
        'depression': re.compile(r'depression|antidepressant', re.I),
        'meditation': re.compile(r'meditat|mindful', re.I),
        'brainwave': re.compile(r'brainwave|EEG|alpha|theta|delta|gamma|beta', re.I),
        'chakra': re.compile(r'chakra|energy center|energy field', re.I),
        'dna': re.compile(r'DNA|genetic|cellular repair', re.I),
        'immune': re.compile(r'immune|immunomodulat', re.I),
        'cognitive': re.compile(r'cognitive|neuroplasticity|neural', re.I)
    }

    def __init__(self, config):
        self.config = config
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()

    def extract_frequencies(self, text: str) -> List[float]:
        """Extract all frequency values from text"""
        matches = self.FREQUENCY_PATTERN.findall(text)
        frequencies = []
        for match in matches:
            try:
                freq = float(match)
                if self.config.MIN_FREQ_HZ <= freq <= self.config.MAX_FREQ_HZ:
                    frequencies.append(freq)
            except ValueError:
                continue
        return sorted(list(set(frequencies)))

    def extract_effects(self, text: str) -> List[str]:
        """Extract claimed effects from text"""
        effects = []
        for effect, pattern in self.EFFECT_PATTERNS.items():
            if pattern.search(text):
                effects.append(effect)
        return effects

    def generate_id(self, title: str, source: str) -> str:
        """Generate unique ID for entry"""
        content = f"{title}:{source}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def calculate_reliability(self, source_type: str, has_citation: bool, 
                               has_abstract: bool, frequency_count: int) -> float:
        """Calculate reliability score based on metadata quality"""
        score = 0.0
        if source_type == "academic":
            score += 0.4
        elif source_type == "book":
            score += 0.3
        else:
            score += 0.1
        
        if has_citation:
            score += 0.2
        if has_abstract:
            score += 0.2
        if frequency_count > 0:
            score += 0.1
        if frequency_count > 2:
            score += 0.1
        
        return min(score, 1.0)

    async def fetch(self, url: str, headers: Optional[Dict] = None) -> Optional[str]:
        """Fetch URL with rate limiting and retries"""
        for attempt in range(self.config.RETRY_ATTEMPTS):
            try:
                await asyncio.sleep(self.config.REQUEST_DELAY)
                async with self.session.get(url, headers=headers, timeout=30) as response:
                    if response.status == 200:
                        return await response.text()
                    logger.warning(f"HTTP {response.status} for {url}")
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed: {e}")
        return None
