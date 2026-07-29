"""Academic paper scraper for PubMed and arXiv"""

import asyncio
import logging
import xml.etree.ElementTree as ET
from typing import List, Optional
from datetime import datetime

from ..scraper_engine import FrequencyScraper, ResearchEntry

logger = logging.getLogger(__name__)

class AcademicScraper(FrequencyScraper):
    """Scrape academic papers from PubMed and arXiv"""
    
    PUBMED_SEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    PUBMED_FETCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    ARXIV_API = "http://export.arxiv.org/api/query"

    async def scrape_pubmed(self, query: str, max_results: int = 50) -> List[ResearchEntry]:
        """Scrape PubMed for frequency research papers"""
        entries = []
        
        # Search for papers
        search_params = {
            "db": "pubmed",
            "term": query,
            "retmax": max_results,
            "retmode": "json",
            "sort": "relevance"
        }
        
        if self.config.PUBMED_API_KEY:
            search_params["api_key"] = self.config.PUBMED_API_KEY
        
        async with self.session as session:
            async with session.get(self.PUBMED_SEARCH, params=search_params) as resp:
                if resp.status != 200:
                    logger.error(f"PubMed search failed: {resp.status}")
                    return entries
                    
                data = await resp.json()
                pmids = data.get("esearchresult", {}).get("idlist", [])
        
        if not pmids:
            return entries
        
        # Fetch paper details
        fetch_params = {
            "db": "pubmed",
            "id": ",".join(pmids),
            "retmode": "xml",
            "rettype": "abstract"
        }
        
        async with self.session as session:
            async with session.get(self.PUBMED_FETCH, params=fetch_params) as resp:
                if resp.status == 200:
                    xml_text = await resp.text()
                    entries = self._parse_pubmed_xml(xml_text)
        
        return entries

    def _parse_pubmed_xml(self, xml_text: str) -> List[ResearchEntry]:
        """Parse PubMed XML response"""
        entries = []
        root = ET.fromstring(xml_text)
        
        for article in root.findall(".//PubmedArticle"):
            try:
                # Extract metadata
                title_elem = article.find(".//ArticleTitle")
                title = title_elem.text if title_elem is not None else "Unknown"
                
                # Authors
                authors = []
                for author in article.findall(".//Author"):
                    last = author.find("LastName")
                    first = author.find("ForeName")
                    if last is not None:
                        name = last.text
                        if first is not None:
                            name = f"{first.text} {name}"
                        authors.append(name)
                
                # Abstract
                abstract_parts = []
                for abstract in article.findall(".//AbstractText"):
                    if abstract.text:
                        abstract_parts.append(abstract.text)
                abstract = " ".join(abstract_parts)
                
                # Publication date
                pub_date = article.find(".//PubDate")
                date_str = None
                if pub_date is not None:
                    year = pub_date.find("Year")
                    if year is not None:
                        date_str = year.text
                
                # PMID
                pmid_elem = article.find(".//PMID")
                pmid = pmid_elem.text if pmid_elem is not None else ""
                
                full_text = f"{title} {abstract}"
                frequencies = self.extract_frequencies(full_text)
                effects = self.extract_effects(full_text)
                
                entry = ResearchEntry(
                    id=self.generate_id(title, f"pubmed:{pmid}"),
                    source_type="academic",
                    title=title,
                    authors=authors,
                    abstract=abstract,
                    content=full_text,
                    frequencies_mentioned=frequencies,
                    effects_claimed=effects,
                    source_url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                    source_citation=f"PubMed PMID: {pmid}",
                    publication_date=date_str,
                    scraped_at=datetime.now().isoformat(),
                    reliability_score=self.calculate_reliability(
                        "academic", True, bool(abstract), len(frequencies)
                    ),
                    tags=["pubmed", "peer-reviewed"]
                )
                entries.append(entry)
                
            except Exception as e:
                logger.error(f"Error parsing PubMed article: {e}")
                continue
        
        return entries

    async def scrape_arxiv(self, query: str, max_results: int = 50) -> List[ResearchEntry]:
        """Scrape arXiv for frequency/sound research"""
        entries = []
        
        search_query = f"all:{query}"
        params = {
            "search_query": search_query,
            "start": 0,
            "max_results": max_results,
            "sortBy": "relevance",
            "sortOrder": "descending"
        }
        
        async with self.session as session:
            async with session.get(self.ARXIV_API, params=params) as resp:
                if resp.status == 200:
                    xml_text = await resp.text()
                    entries = self._parse_arxiv_xml(xml_text)
        
        return entries

    def _parse_arxiv_xml(self, xml_text: str) -> List[ResearchEntry]:
        """Parse arXiv Atom XML"""
        entries = []
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        root = ET.fromstring(xml_text)
        
        for entry in root.findall("atom:entry", ns):
            try:
                title = entry.find("atom:title", ns).text.strip().replace("\n", " ")
                
                authors = []
                for author in entry.findall("atom:author", ns):
                    name = author.find("atom:name", ns).text
                    authors.append(name)
                
                abstract = entry.find("atom:summary", ns).text.strip().replace("\n", " ")
                
                # Get link
                link = entry.find("atom:id", ns).text
                
                # Published date
                published = entry.find("atom:published", ns).text[:10]
                
                # Categories
                categories = []
                for cat in entry.findall("atom:category", ns):
                    categories.append(cat.get("term", ""))
                
                full_text = f"{title} {abstract}"
                frequencies = self.extract_frequencies(full_text)
                effects = self.extract_effects(full_text)
                
                entry_obj = ResearchEntry(
                    id=self.generate_id(title, link),
                    source_type="academic",
                    title=title,
                    authors=authors,
                    abstract=abstract[:2000],  # Limit abstract length
                    content=full_text,
                    frequencies_mentioned=frequencies,
                    effects_claimed=effects,
                    source_url=link,
                    source_citation=f"arXiv: {link.split('/')[-1]}",
                    publication_date=published,
                    scraped_at=datetime.now().isoformat(),
                    reliability_score=self.calculate_reliability(
                        "academic", True, True, len(frequencies)
                    ),
                    tags=["arxiv", "preprint"] + categories[:3]
                )
                entries.append(entry_obj)
                
            except Exception as e:
                logger.error(f"Error parsing arXiv entry: {e}")
                continue
        
        return entries

    async def scrape_all_academic(self, queries: Optional[List[str]] = None) -> List[ResearchEntry]:
        """Scrape all academic sources"""
        if queries is None:
            queries = self.config.SEARCH_TERMS[:5]  # Use top 5 terms
        
        all_entries = []
        
        for query in queries:
            logger.info(f"Scraping academic: {query}")
            
            # PubMed
            pubmed_entries = await self.scrape_pubmed(query, max_results=20)
            all_entries.extend(pubmed_entries)
            logger.info(f"  PubMed: {len(pubmed_entries)} papers")
            
            # arXiv
            arxiv_entries = await self.scrape_arxiv(query, max_results=20)
            all_entries.extend(arxiv_entries)
            logger.info(f"  arXiv: {len(arxiv_entries)} papers")
        
        # Deduplicate by title similarity
        seen_titles = set()
        unique_entries = []
        for entry in all_entries:
            title_key = entry.title.lower()[:50]
            if title_key not in seen_titles:
                seen_titles.add(title_key)
                unique_entries.append(entry)
        
        return unique_entries
