"""REST API for Frequency Research Scraper"""

import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

app = FastAPI(
    title="NANO Protocol - Frequency Research API",
    description="API for querying frequency healing research data",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Data models
class FrequencyQuery(BaseModel):
    frequency: Optional[int] = Field(None, description="Frequency in Hz (e.g., 528)")
    effect: Optional[str] = Field(None, description="Effect to search (e.g., serotonin)")
    source_type: Optional[str] = Field(None, description="Source type: academic, book, web")
    min_reliability: float = Field(0.0, description="Minimum reliability score (0-1)")
    limit: int = Field(50, description="Max results to return")

class ScrapeRequest(BaseModel):
    sources: List[str] = Field(["academic", "book", "web"], description="Sources to scrape")
    queries: Optional[List[str]] = Field(None, description="Custom search queries")
    max_results: int = Field(100, description="Max results per source")

class FrequencyProfile(BaseModel):
    frequency: int
    name: str
    total_studies: int
    sources: List[str]
    top_effects: List[Dict]
    reliability: float

# Database path
DATA_DIR = Path(__file__).parent.parent / "data" / "processed"
DB_PATH = DATA_DIR / "frequency_research.json"

def load_database() -> Dict:
    """Load the research database"""
    if DB_PATH.exists():
        with open(DB_PATH, 'r') as f:
            return json.load(f)
    return {"entries": [], "statistics": {}, "generated_at": None}

def save_database(data: Dict):
    """Save the research database"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(DB_PATH, 'w') as f:
        json.dump(data, f, indent=2, default=str)

# Scraping state
scraping_status = {
    "is_running": False,
    "progress": 0,
    "last_run": None,
    "entries_scraped": 0
}

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": "NANO Protocol - Frequency Research API",
        "version": "1.0.0",
        "researcher": "Hazem Soussi",
        "status": "active",
        "endpoints": {
            "query": "/api/query",
            "frequency": "/api/frequency/{hz}",
            "effect": "/api/effect/{effect}",
            "stats": "/api/stats",
            "scrape": "/api/scrape",
            "status": "/api/status"
        }
    }

@app.get("/api/query")
async def query_research(
    frequency: Optional[int] = Query(None, description="Frequency in Hz"),
    effect: Optional[str] = Query(None, description="Effect name"),
    source_type: Optional[str] = Query(None, description="Source type"),
    min_reliability: float = Query(0.0, description="Minimum reliability"),
    limit: int = Query(50, description="Max results")
):
    """Query frequency research database"""
    db = load_database()
    entries = db.get("entries", [])
    
    # Apply filters
    if frequency:
        entries = [e for e in entries if frequency in e.get("frequency_profile", {}).get("all_frequencies", [])]
    
    if effect:
        entries = [e for e in entries if effect.lower() in [eff.lower() for eff in e.get("effect_profile", {}).get("claimed_effects", [])]]
    
    if source_type:
        entries = [e for e in entries if e.get("source_type") == source_type]
    
    if min_reliability > 0:
        entries = [e for e in entries if e.get("reliability_score", 0) >= min_reliability]
    
    return {
        "total": len(entries[:limit]),
        "results": entries[:limit],
        "query": {
            "frequency": frequency,
            "effect": effect,
            "source_type": source_type,
            "min_reliability": min_reliability
        }
    }

@app.get("/api/frequency/{hz}")
async def get_frequency_profile(hz: int):
    """Get detailed profile for a specific frequency"""
    db = load_database()
    entries = db.get("entries", [])
    
    matching = [e for e in entries if hz in e.get("frequency_profile", {}).get("all_frequencies", [])]
    
    if not matching:
        raise HTTPException(status_code=404, detail=f"No research found for {hz}Hz")
    
    # Aggregate data
    all_effects = []
    for entry in matching:
        all_effects.extend(entry.get("effect_profile", {}).get("claimed_effects", []))
    
    from collections import Counter
    effect_counts = Counter(all_effects)
    
    return {
        "frequency": hz,
        "total_studies": len(matching),
        "top_effects": effect_counts.most_common(10),
        "sources": list(set(e.get("source_type") for e in matching)),
        "average_reliability": sum(e.get("reliability_score", 0) for e in matching) / len(matching),
        "entries": matching[:10]
    }

@app.get("/api/effect/{effect}")
async def get_effect_research(effect: str):
    """Get research for a specific effect"""
    db = load_database()
    entries = db.get("entries", [])
    
    matching = [e for e in entries if effect.lower() in [eff.lower() for eff in e.get("effect_profile", {}).get("claimed_effects", [])]]
    
    # Find associated frequencies
    freq_counter = Counter()
    for entry in matching:
        for freq in entry.get("frequency_profile", {}).get("all_frequencies", []):
            freq_counter[freq] += 1
    
    return {
        "effect": effect,
        "total_studies": len(matching),
        "associated_frequencies": freq_counter.most_common(10),
        "entries": matching[:10]
    }

@app.get("/api/stats")
async def get_statistics():
    """Get database statistics"""
    db = load_database()
    return db.get("statistics", {})

@app.post("/api/scrape")
async def start_scraping(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """Start a scraping job"""
    global scraping_status
    
    if scraping_status["is_running"]:
        raise HTTPException(status_code=409, detail="Scraping already in progress")
    
    background_tasks.add_task(run_scraping, request)
    
    return {
        "message": "Scraping started",
        "sources": request.sources,
        "status_url": "/api/status"
    }

@app.get("/api/status")
async def get_scraping_status():
    """Get current scraping status"""
    return scraping_status

async def run_scraping(request: ScrapeRequest):
    """Background scraping task"""
    global scraping_status
    
    scraping_status["is_running"] = True
    scraping_status["progress"] = 0
    
    try:
        from ..scraper_engine import FrequencyScraper
        from ..scrapers.academic import AcademicScraper
        from ..scrapers.books import BookScraper
        from ..scrapers.web import WebScraper
        from ..pipeline.analyzer import FrequencyAnalyzer
        
        config = None  # Will use default config
        
        all_entries = []
        
        if "academic" in request.sources:
            async with AcademicScraper(config) as scraper:
                entries = await scraper.scrape_all_academic(request.queries)
                all_entries.extend(entries)
                scraping_status["progress"] = 33
        
        if "book" in request.sources:
            book_scraper = BookScraper(config)
            entries = await book_scraper.scrape_directory()
            all_entries.extend(entries)
            scraping_status["progress"] = 66
        
        if "web" in request.sources:
            async with WebScraper(config) as scraper:
                entries = await scraper.scrape_all_web()
                all_entries.extend(entries)
                scraping_status["progress"] = 100
        
        # Process and analyze
        analyzer = FrequencyAnalyzer()
        processed = analyzer.process_entries(all_entries)
        
        # Save to database
        save_database(processed)
        
        scraping_status["entries_scraped"] = len(all_entries)
        scraping_status["last_run"] = datetime.now().isoformat()
        
    except Exception as e:
        logger.error(f"Scraping error: {e}")
    finally:
        scraping_status["is_running"] = False

@app.get("/api/search")
async def search_research(q: str = Query(..., description="Search query")):
    """Free text search across all research"""
    db = load_database()
    entries = db.get("entries", [])
    
    q_lower = q.lower()
    results = []
    
    for entry in entries:
        searchable = f"{entry.get('title', '')} {entry.get('abstract', '')}".lower()
        if q_lower in searchable:
            results.append(entry)
    
    return {
        "query": q,
        "total": len(results),
        "results": results[:20]
    }

@app.get("/api/solfeggio")
async def get_solfeggio_guide():
    """Get complete solfeggio frequency guide"""
    from ..pipeline.analyzer import FREQUENCY_EFFECT_MAP, BRAINWAVE_BANDS
    
    return {
        "solfeggio_frequencies": FREQUENCY_EFFECT_MAP,
        "brainwave_bands": BRAINWAVE_BANDS,
        "usage_guide": {
            "RESTORE": [396, 417, 528],
            "ABUNDANCE": [888, 639, 528],
            "OPPORTUNITY": [741, 852, 963],
            "PEACE": [432, 528, 639]
        }
    }
