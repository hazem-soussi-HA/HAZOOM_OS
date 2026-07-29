"""Book scraper for PDF and EPUB parsing"""

import asyncio
import logging
import re
from pathlib import Path
from typing import List, Optional
from datetime import datetime

from ..scraper_engine import FrequencyScraper, ResearchEntry

logger = logging.getLogger(__name__)

class BookScraper(FrequencyScraper):
    """Scrape frequency research from books (PDF/EPUB)"""
    
    def __init__(self, config, books_dir: str = None):
        super().__init__(config)
        self.books_dir = Path(books_dir) if books_dir else Path(config.BOOKS_DIR)
        self.books_dir.mkdir(parents=True, exist_ok=True)

    async def extract_from_pdf(self, pdf_path: str) -> Optional[ResearchEntry]:
        """Extract frequency research from a PDF book"""
        try:
            import PyPDF2
            from io import BytesIO
            
            with open(pdf_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                text_parts = []
                
                for page_num in range(len(reader.pages)):
                    page = reader.pages[page_num]
                    text_parts.append(page.extract_text())
                
                full_text = "\n".join(text_parts)
                
                # Get metadata
                metadata = reader.metadata
                title = metadata.get('/Title', Path(pdf_path).stem) if metadata else Path(pdf_path).stem
                author = metadata.get('/Author', 'Unknown') if metadata else 'Unknown'
                
                return self._create_entry(
                    title=title,
                    author=author,
                    content=full_text,
                    source_file=str(pdf_path),
                    source_type="book_pdf"
                )
                
        except ImportError:
            logger.error("PyPDF2 not installed. Install with: pip install PyPDF2")
        except Exception as e:
            logger.error(f"Error processing PDF {pdf_path}: {e}")
        
        return None

    async def extract_from_epub(self, epub_path: str) -> Optional[ResearchEntry]:
        """Extract frequency research from an EPUB book"""
        try:
            import ebooklib
            from ebooklib import epub
            from bs4 import BeautifulSoup
            
            book = epub.read_epub(str(epub_path))
            
            # Get metadata
            title = book.get_metadata('DC', 'title')
            title = title[0][0] if title else Path(epub_path).stem
            
            author = book.get_metadata('DC', 'creator')
            author = author[0][0] if author else 'Unknown'
            
            # Extract text from all chapters
            text_parts = []
            for item in book.get_items():
                if item.get_type() == ebooklib.ITEM_DOCUMENT:
                    soup = BeautifulSoup(item.get_content(), 'html.parser')
                    text_parts.append(soup.get_text())
            
            full_text = "\n".join(text_parts)
            
            return self._create_entry(
                title=title,
                author=author,
                content=full_text,
                source_file=str(epub_path),
                source_type="book_epub"
            )
            
        except ImportError:
            logger.error("ebooklib not installed. Install with: pip install ebooklib")
        except Exception as e:
            logger.error(f"Error processing EPUB {epub_path}: {e}")
        
        return None

    async def extract_from_txt(self, txt_path: str) -> Optional[ResearchEntry]:
        """Extract from plain text file"""
        try:
            with open(txt_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            return self._create_entry(
                title=Path(txt_path).stem,
                author='Unknown',
                content=content,
                source_file=str(txt_path),
                source_type="book_text"
            )
        except Exception as e:
            logger.error(f"Error processing text file {txt_path}: {e}")
        return None

    def _create_entry(self, title: str, author: str, content: str, 
                      source_file: str, source_type: str) -> ResearchEntry:
        """Create a ResearchEntry from book content"""
        
        # Extract frequencies from content
        frequencies = self.extract_frequencies(content)
        
        # Extract effects
        effects = self.extract_effects(content)
        
        # Extract key quotes about frequencies
        quotes = self._extract_frequency_quotes(content)
        
        # Extract solfeggio-specific content
        solfeggio_content = self._extract_solfeggio_content(content)
        
        full_content = content[:50000]  # Limit content size
        
        return ResearchEntry(
            id=self.generate_id(title, source_file),
            source_type="book",
            title=title,
            authors=[author],
            abstract=solfeggio_content[:500] if solfeggio_content else content[:500],
            content=full_content,
            frequencies_mentioned=frequencies,
            effects_claimed=effects,
            source_url=None,
            source_citation=f"Book: {title} by {author}",
            publication_date=None,
            scraped_at=datetime.now().isoformat(),
            reliability_score=self.calculate_reliability(
                "book", True, bool(content), len(frequencies)
            ),
            tags=["book", source_type, "primary-source"]
        )

    def _extract_frequency_quotes(self, content: str, window: int = 200) -> List[str]:
        """Extract quotes around frequency mentions"""
        quotes = []
        pattern = re.compile(r'(\d+\.?\d*)\s*(?:Hz|hertz)', re.IGNORECASE)
        
        for match in pattern.finditer(content):
            start = max(0, match.start() - window)
            end = min(len(content), match.end() + window)
            quote = content[start:end].strip()
            quotes.append(quote)
        
        return quotes[:10]  # Return top 10 quotes

    def _extract_solfeggio_content(self, content: str) -> str:
        """Extract content specifically about solfeggio frequencies"""
        solfeggio_keywords = [
            'solfeggio', 'solfeggio frequencies', 'solfeggio scale',
            'gregorian chant', 'sacred frequencies', 'healing frequencies',
            'frequency therapy', 'sound healing', 'vibrational healing'
        ]
        
        sentences = re.split(r'[.!?]+', content)
        relevant = []
        
        for sentence in sentences:
            if any(kw.lower() in sentence.lower() for kw in solfeggio_keywords):
                relevant.append(sentence.strip())
        
        return ". ".join(relevant[:20])

    async def scrape_directory(self, directory: str = None) -> List[ResearchEntry]:
        """Scrape all books in a directory"""
        scan_dir = Path(directory) if directory else self.books_dir
        entries = []
        
        supported_formats = {
            '.pdf': self.extract_from_pdf,
            '.epub': self.extract_from_epub,
            '.txt': self.extract_from_txt
        }
        
        for file_path in scan_dir.rglob('*'):
            if file_path.suffix.lower() in supported_formats:
                logger.info(f"Processing book: {file_path.name}")
                extractor = supported_formats[file_path.suffix.lower()]
                entry = await extractor(str(file_path))
                if entry:
                    entries.append(entry)
                    logger.info(f"  Extracted: {len(entry.frequencies_mentioned)} frequencies")
        
        return entries

    async def scrape_book_list(self, book_list: List[str]) -> List[ResearchEntry]:
        """Scrape books from a list of titles/paths"""
        entries = []
        
        for book_ref in book_list:
            # Check if it's a file path
            if Path(book_ref).exists():
                entry = await self.extract_from_pdf(book_ref)
                if not entry:
                    entry = await self.extract_from_epub(book_ref)
                if entry:
                    entries.append(entry)
            else:
                # Try to find in books directory
                for ext in ['.pdf', '.epub', '.txt']:
                    potential = self.books_dir / f"{book_ref}{ext}"
                    if potential.exists():
                        extractor = {
                            '.pdf': self.extract_from_pdf,
                            '.epub': self.extract_from_epub,
                            '.txt': self.extract_from_txt
                        }[ext]
                        entry = await extractor(str(potential))
                        if entry:
                            entries.append(entry)
                        break
        
        return entries
