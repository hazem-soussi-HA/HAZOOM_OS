"""Doctoral Guide API — Solfeggio Frequency Explorer"""

import json
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="NANO Protocol — Doctoral Guide API",
    description="Comprehensive Solfeggio Frequency Reference",
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

# Load database
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "solfeggio-database.json"

def load_db():
    with open(DB_PATH, 'r') as f:
        return json.load(f)

@app.get("/")
async def root():
    db = load_db()
    return {
        "name": "NANO Protocol — Doctoral Guide API",
        "subtitle": "Artefactual Creatif Service",
        "researcher": "Hazem Soussi",
        "version": db["metadata"]["version"],
        "total_frequencies": db["metadata"]["total_frequencies"],
        "total_effects": db["metadata"]["total_effects"],
        "endpoints": {
            "frequencies": "/api/frequencies",
            "frequency": "/api/frequency/{hz}",
            "binaural": "/api/binaural",
            "modules": "/api/modules",
            "module": "/api/modules/{name}",
            "references": "/api/references",
            "search": "/api/search",
            "healing_map": "/api/healing-map",
            "session_builder": "/api/session-builder"
        }
    }

@app.get("/api/frequencies")
async def get_all_frequencies():
    db = load_db()
    return {
        "total": len(db["solfeggio_frequencies"]),
        "frequencies": db["solfeggio_frequencies"]
    }

@app.get("/api/frequency/{hz}")
async def get_frequency(hz: int):
    db = load_db()
    freq = db["solfeggio_frequencies"].get(str(hz))
    if not freq:
        raise HTTPException(status_code=404, detail=f"Frequency {hz}Hz not found")
    
    # Find integrations
    integrations = []
    for other_hz, other_data in db["solfeggio_frequencies"].items():
        if hz in other_data.get("integration_with", []):
            integrations.append({"hz": int(other_hz), "name": other_data["name"]})
    
    return {
        "frequency": hz,
        "data": freq,
        "integrations": integrations
    }

@app.get("/api/binaural")
async def get_binaural_beats():
    db = load_db()
    return db["binaural_beats"]

@app.get("/api/binaural/{band}")
async def get_binaural_band(band: str):
    db = load_db()
    binaural = db["binaural_beats"].get(band.lower())
    if not binaural:
        raise HTTPException(status_code=404, detail=f"Band '{band}' not found")
    return {"band": band, "data": binaural}

@app.get("/api/modules")
async def get_all_modules():
    db = load_db()
    return {
        "total": len(db["therapeutic_modules"]),
        "modules": db["therapeutic_modules"]
    }

@app.get("/api/modules/{name}")
async def get_module(name: str):
    db = load_db()
    module = db["therapeutic_modules"].get(name.lower())
    if not module:
        raise HTTPException(status_code=404, detail=f"Module '{name}' not found")
    
    # Get frequency details
    freq_details = []
    for hz in module["frequencies"]:
        freq_data = db["solfeggio_frequencies"].get(str(hz), {})
        freq_details.append({
            "hz": hz,
            "name": freq_data.get("name", "Unknown"),
            "effects": freq_data.get("claimed_effects", [])[:5]
        })
    
    return {
        "module": name,
        "data": module,
        "frequency_details": freq_details
    }

@app.get("/api/references")
async def get_references():
    db = load_db()
    return {
        "total": len(db["scientific_references"]),
        "references": db["scientific_references"]
    }

@app.get("/api/search")
async def search(q: str = Query(..., description="Search query")):
    db = load_db()
    q_lower = q.lower()
    results = {"frequencies": [], "effects": [], "references": []}
    
    # Search frequencies
    for hz, data in db["solfeggio_frequencies"].items():
        searchable = f"{data['name']} {data['traditional_use']['ancient']} {' '.join(data['claimed_effects'])}"
        if q_lower in searchable.lower():
            results["frequencies"].append({"hz": int(hz), "name": data["name"]})
    
    # Search effects
    for effect in db["metadata"].get("effects_list", []):
        if q_lower in effect.lower():
            results["effects"].append(effect)
    
    # Search references
    for ref in db["scientific_references"]:
        searchable = f"{ref['title']} {ref['authors']} {ref['findings']}"
        if q_lower in searchable.lower():
            results["references"].append(ref)
    
    return {"query": q, "results": results}

@app.get("/api/healing-map")
async def get_healing_map():
    db = load_db()
    
    healing_map = {
        "physical_healing": {
            "frequencies": [174, 285, 528],
            "primary": 285,
            "effects": ["Tissue repair", "Pain relief", "Cellular healing"],
            "recommended_modules": ["restore"]
        },
        "emotional_healing": {
            "frequencies": [396, 417, 528],
            "primary": 396,
            "effects": ["Trauma release", "Guilt liberation", "Emotional freedom"],
            "recommended_modules": ["restore", "peace"]
        },
        "spiritual_healing": {
            "frequencies": [741, 852, 963],
            "primary": 963,
            "effects": ["Divine connection", "Intuition", "Higher consciousness"],
            "recommended_modules": ["opportunity"]
        },
        "relationship_healing": {
            "frequencies": [639, 528, 432],
            "primary": 639,
            "effects": ["Oxytocin activation", "Love", "Connection"],
            "recommended_modules": ["peace", "abundance"]
        },
        "prosperity_healing": {
            "frequencies": [888, 528, 639],
            "primary": 888,
            "effects": ["Abundance", "Prosperity", "Wealth"],
            "recommended_modules": ["abundance"]
        },
        "stress_healing": {
            "frequencies": [432, 174, 396],
            "primary": 432,
            "effects": ["Cortisol reduction", "Relaxation", "Calm"],
            "recommended_modules": ["peace"]
        }
    }
    
    return {"healing_map": healing_map}

@app.get("/api/session-builder")
async def session_builder(
    intention: str = Query(..., description="healing, abundance, opportunity, peace"),
    duration: int = Query(20, description="Duration in minutes"),
    experience: str = Query("beginner", description="beginner, intermediate, advanced")
):
    db = load_db()
    
    module_map = {
        "healing": "restore",
        "restore": "restore",
        "abundance": "abundance",
        "opportunity": "opportunity",
        "peace": "peace"
    }
    
    module_name = module_map.get(intention.lower(), "peace")
    module = db["therapeutic_modules"].get(module_name, db["therapeutic_modules"]["peace"])
    
    # Adjust for experience level
    if experience == "beginner":
        recommended_freqs = module["frequencies"][:2]
        recommended_duration = min(duration, 15)
    elif experience == "intermediate":
        recommended_freqs = module["frequencies"]
        recommended_duration = min(duration, 25)
    else:
        recommended_freqs = module["frequencies"]
        recommended_duration = duration
    
    session = {
        "intention": intention,
        "module": module_name,
        "experience_level": experience,
        "recommended_duration_minutes": recommended_duration,
        "frequencies": recommended_freqs,
        "binaural_band": module["binaural"],
        "binaural_hz": module["binaural_hz"],
        "color": module["color"],
        "structure": module["session_structure"],
        "tips": [
            "Use headphones for best binaural effect",
            "Start with 5 minutes if you're new",
            "Breathe deeply throughout",
            "Focus on the visualization",
            "Journal after the session"
        ]
    }
    
    return {"session": session}

@app.get("/api/about")
async def get_about():
    db = load_db()
    return {
        "title": db["metadata"]["title"],
        "subtitle": db["metadata"]["subtitle"],
        "researcher": db["metadata"]["researcher"],
        "institution": db["metadata"]["institution"],
        "classification": db["metadata"]["classification"],
        "description": """
The Solfeggio Frequencies are a set of nine sacred tones that have been used for thousands of years
in spiritual and healing practices. Rediscovered by Dr. Joseph Puleo in the 1970s, these frequencies
correspond to specific energy centers in the body and are believed to have profound effects on
physical, emotional, and spiritual well-being.

This Doctoral Guide provides a comprehensive, evidence-based reference for understanding and
applying these frequencies in therapeutic contexts. All data has been verified through multiple
sources and is presented with scientific references where available.
        """
    }
