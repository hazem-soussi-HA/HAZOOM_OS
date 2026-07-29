"""NANO Protocol - Frequency Research Scraper Microservice

Main entry point for the frequency research scraping microservice.
Scrapes, extracts, and analyzes frequency healing research from:
- Academic papers (PubMed, arXiv)
- Books (PDF, EPUB)
- Web articles and blogs
"""

import asyncio
import json
import logging
import sys
from datetime import datetime
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.scrapers.academic import AcademicScraper
from src.scrapers.books import BookScraper
from src.scrapers.web import WebScraper
from src.pipeline.analyzer import FrequencyAnalyzer, FrequencySynthesizer

class FrequencyResearchScraper:
    """Main scraper orchestrator"""
    
    def __init__(self, config=None):
        self.config = config
        self.analyzer = FrequencyAnalyzer()
        self.synthesizer = FrequencySynthesizer()
        
    async def run_full_scrape(self, queries=None):
        """Run complete scraping pipeline"""
        logger.info("=" * 60)
        logger.info("NANO PROTOCOL - Frequency Research Scraper")
        logger.info("=" * 60)
        
        all_entries = []
        
        # 1. Academic papers
        logger.info("\n[1/3] Scraping academic papers...")
        async with AcademicScraper(self.config) as scraper:
            academic_entries = await scraper.scrape_all_academic(queries)
            all_entries.extend(academic_entries)
            logger.info(f"  Found: {len(academic_entries)} academic papers")
        
        # 2. Books
        logger.info("\n[2/3] Scraping books...")
        book_scraper = BookScraper(self.config)
        book_entries = await book_scraper.scrape_directory()
        all_entries.extend(book_entries)
        logger.info(f"  Found: {len(book_entries)} book extracts")
        
        # 3. Web sources
        logger.info("\n[3/3] Scraping web sources...")
        async with WebScraper(self.config) as scraper:
            web_entries = await scraper.scrape_all_web()
            all_entries.extend(web_entries)
            logger.info(f"  Found: {len(web_entries)} web articles")
        
        # Process and analyze
        logger.info("\nProcessing and analyzing data...")
        processed_data = self.analyzer.process_entries(all_entries)
        
        # Generate summary
        summary = self.synthesizer.generate_research_summary(processed_data)
        logger.info(summary)
        
        # Save results
        output_dir = Path(__file__).parent / "data" / "processed"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        output_file = output_dir / "frequency_research.json"
        with open(output_file, 'w') as f:
            json.dump(processed_data, f, indent=2, default=str)
        
        logger.info(f"\nResults saved to: {output_file}")
        logger.info(f"Total entries: {processed_data['statistics']['total_entries']}")
        
        return processed_data

async def main():
    """Main entry point"""
    scraper = FrequencyResearchScraper()
    await scraper.run_full_scrape()

if __name__ == "__main__":
    asyncio.run(main())
