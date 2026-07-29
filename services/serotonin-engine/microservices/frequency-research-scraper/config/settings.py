"""Configuration for Frequency Research Scraper Microservice"""

import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import List

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
BOOKS_DIR = DATA_DIR / "books"

@dataclass
class ScraperConfig:
    # Academic sources
    PUBMED_API_KEY: str = os.getenv("PUBMED_API_KEY", "")
    ARXIV_API_URL: str = "http://export.arxiv.org/api/query"
    SEMANTIC_SCHOLAR_API: str = "https://api.semanticscholar.org/graph/v1"
    
    # Frequency research keywords
    SEARCH_TERMS: List[str] = field(default_factory=lambda: [
        "solfeggio frequencies",
        "binaural beats therapy",
        "frequency healing",
        "sound therapy neuroscience",
        "432Hz music therapy",
        "528Hz DNA repair",
        "396Hz liberation",
        "639Hz connections",
        "741Hz intuition",
        "852Hz spiritual order",
        "963Hz divine consciousness",
        "174Hz pain relief",
        "285Hz tissue repair",
        "brainwave entrainment",
        "neuroacoustic therapy",
        "cymatics biology",
        "vibrational medicine",
        "sound frequency hormone",
        "serotonin frequency",
        "frequency neurotransmitter"
    ])
    
    # Book sources (trusted references)
    BOOK_SOURCES: List[str] = field(default_factory=lambda: [
        "The Healing Power of Sound - Mitchell Gaynor",
        "Frequency - Toby Gimbel",
        "The Solfeggio Handbook - Dr. Joseph Puleo",
        "Tuning the Human Biofield - Eileen Day McKusick",
        "The Humming Effect - Jonathan Goldman",
        "Sound Healing for Beginners - Joshua Goldman",
        "Beating Tinnitus - Oliver Quackenbush"
    ])
    
    # Web sources
    WEB_SOURCES: List[str] = field(default_factory=lambda: [
        "https://pubmed.ncbi.nlm.nih.gov/",
        "https://arxiv.org/",
        "https://scholar.google.com/",
        "https://www.researchgate.net/",
        "https://www.ncbi.nlm.nih.gov/pmc/"
    ])
    
    # Rate limiting
    REQUEST_DELAY: float = 1.0  # seconds between requests
    MAX_CONCURRENT: int = 5
    RETRY_ATTEMPTS: int = 3
    
    # Extraction settings
    MIN_FREQ_HZ: float = 0.5
    MAX_FREQ_HZ: float = 10000.0
    
    # API settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8099
    
    # Database
    DB_PATH: str = str(PROCESSED_DIR / "frequency_research.json")

config = ScraperConfig()
