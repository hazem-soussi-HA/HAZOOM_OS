"""Frequency Research Scraper - Scrape, extract, and analyze frequency healing research"""

from .scraper_engine import FrequencyScraper, ResearchEntry
from .scrapers.academic import AcademicScraper
from .scrapers.books import BookScraper
from .scrapers.web import WebScraper

__all__ = [
    'FrequencyScraper',
    'ResearchEntry', 
    'AcademicScraper',
    'BookScraper',
    'WebScraper'
]
