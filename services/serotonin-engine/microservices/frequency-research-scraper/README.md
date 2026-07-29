<p align="center">
  <img src="../../hazoom-logo.svg" alt="HAZOOM Logo" width="200">
</p>

<h1 align="center">Frequency Research Scraper</h1>
<h3 align="center">Microservice for NANO Protocol</h3>

<p align="center">
  <em>Automated scraping, extraction, and analysis of frequency healing research</em>
</p>

---

## Overview

The Frequency Research Scraper is a microservice within the NANO Protocol that automatically collects, processes, and analyzes research on:

- **Solfeggio Frequencies** (174Hz - 963Hz)
- **Binaural Beats & Brainwave Entrainment**
- **Sound Therapy & Frequency Healing**
- **Neuroacoustic Research**

### Data Sources

| Source Type | Platforms | Content |
|------------|-----------|---------|
| **Academic** | PubMed, arXiv, Google Scholar | Peer-reviewed papers, preprints |
| **Books** | PDF, EPUB parsing | Complete frequency healing books |
| **Web** | Research sites, articles | Practitioner insights, blog posts |

---

## Architecture

```
frequency-research-scraper/
├── main.py                     # Entry point & orchestrator
├── requirements.txt            # Python dependencies
├── config/
│   └── settings.py            # Configuration
├── src/
│   ├── scraper_engine.py      # Base scraper with NLP
│   ├── scrapers/
│   │   ├── academic.py        # PubMed & arXiv
│   │   ├── books.py           # PDF/EPUB parser
│   │   └── web.py             # Web article scraper
│   ├── pipeline/
│   │   └── analyzer.py        # Frequency analysis & NLP
│   └── api/
│       └── main.py            # REST API (FastAPI)
└── data/
    ├── raw/                   # Raw scraped content
    ├── processed/             # Analyzed & indexed data
    └── books/                 # Book files for parsing
```

---

## Installation

```bash
cd microservices/frequency-research-scraper
pip install -r requirements.txt
```

---

## Usage

### Run Full Scrape

```bash
python main.py
```

### Start API Server

```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8099 --reload
```

### API Documentation

Once running, visit:
- Swagger UI: http://localhost:8099/docs
- ReDoc: http://localhost:8099/redoc

---

## API Endpoints

### Query Research

```bash
# Get all research
curl http://localhost:8099/api/query

# Filter by frequency
curl http://localhost:8099/api/query?frequency=528

# Filter by effect
curl http://localhost:8099/api/query?effect=serotonin

# Filter by source
curl http://localhost:8099/api/query?source_type=academic
```

### Get Frequency Profile

```bash
curl http://localhost:8099/api/frequency/528
```

Returns detailed information about the 528Hz frequency including:
- Total studies found
- Top claimed effects
- Source types
- Reliability score
- Key findings

### Get Effect Research

```bash
curl http://localhost:8099/api/effect/serotonin
```

### Get Statistics

```bash
curl http://localhost:8099/api/stats
```

### Search

```bash
curl http://localhost:8099/api/search?q=solfeggio+healing
```

### Get Solfeggio Guide

```bash
curl http://localhost:8099/api/solfeggio
```

### Start Scraping Job

```bash
curl -X POST http://localhost:8099/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"sources": ["academic", "web"], "max_results": 50}'
```

---

## Data Models

### Research Entry

```json
{
  "id": "string",
  "title": "string",
  "authors": ["string"],
  "abstract": "string",
  "source_type": "academic|book|web",
  "source_url": "string",
  "source_citation": "string",
  "publication_date": "string",
  "reliability_score": 0.0-1.0,
  "frequency_profile": {
    "all_frequencies": [528, 432],
    "solfeggio_detected": [...],
    "brainwave_detected": [...],
    "primary_frequency": 528
  },
  "effect_profile": {
    "claimed_effects": ["serotonin", "healing"],
    "verified_effects": ["serotonin"],
    "effect_categories": {...}
  },
  "tags": ["string"],
  "scraped_at": "ISO datetime",
  "processed_at": "ISO datetime"
}
```

---

## Frequency Reference

### Solfeggio Frequencies

| Hz | Name | Traditional Effects |
|----|------|---------------------|
| 174 | Foundation | Pain relief, grounding |
| 285 | Repair | Tissue healing, energy |
| 396 | Liberation | Guilt release, endorphins |
| 417 | Change | Undoing, cortisol reduction |
| 432 | Harmony | Nature resonance, peace |
| 528 | Transformation | DNA repair, serotonin |
| 639 | Connection | Relationships, oxytocin |
| 741 | Intuition | Awakening, expression |
| 852 | Spiritual Order | Third eye, clarity |
| 963 | Divine | Pineal activation, higher self |

### Brainwave Bands

| Band | Range | Effects |
|------|-------|---------|
| Delta | 0.5-4 Hz | Deep sleep, healing |
| Theta | 4-8 Hz | Meditation, creativity |
| Alpha | 8-14 Hz | Relaxation, focus |
| Beta | 14-30 Hz | Active thinking |
| Gamma | 30-100 Hz | Higher consciousness |

---

## Configuration

Edit `config/settings.py` to customize:

- **Search terms** - Keywords for scraping
- **Rate limiting** - Request delays
- **API settings** - Host and port
- **Data directories** - Storage paths

---

## Output

The scraper generates a comprehensive JSON database:

```json
{
  "entries": [...],
  "statistics": {
    "total_entries": 150,
    "top_frequencies": [[528, 45], [432, 38], ...],
    "top_effects": [["serotonin", 32], ["healing", 28], ...],
    "source_breakdown": {...},
    "frequency_coverage": {...}
  },
  "frequency_index": {...},
  "effect_index": {...},
  "source_index": {...},
  "generated_at": "2026-07-28T..."
}
```

---

## Researcher

**Hazem Soussi**
NANO Protocol - Neuro-Acoustic Optimization for Natural Homeostasis

---

## License

MIT License - See [LICENSE](../../LICENSE)

---

<p align="center">
  <sub>"The body is a living instrument of frequency." — NANO Protocol</sub>
</p>
