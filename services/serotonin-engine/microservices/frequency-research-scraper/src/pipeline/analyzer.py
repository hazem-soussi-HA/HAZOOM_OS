"""NLP pipeline for frequency research analysis"""

import json
import logging
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Frequency to effect mapping based on research
FREQUENCY_EFFECT_MAP = {
    174: {"name": "Foundation", "effects": ["pain relief", "grounding", "physical stabilization"]},
    285: {"name": "Repair", "effects": ["tissue repair", "energy restoration", "cellular healing"]},
    396: {"name": "Liberation", "effects": ["guilt release", "fear liberation", "endorphin release"]},
    417: {"name": "Change", "effects": ["undoing situations", "change initiation", "cortisol reduction"]},
    432: {"name": "Harmony", "effects": ["cortisol reduction", "nature resonance", "peace"]},
    528: {"name": "Transformation", "effects": ["DNA repair", "serotonin boost", "love", "miracles"]},
    639: {"name": "Connection", "effects": ["relationship healing", "oxytocin activation", "unity"]},
    741: {"name": "Intuition", "effects": ["awakening intuition", "expression", "solving problems"]},
    852: {"name": "Spiritual Order", "effects": ["returning to spiritual order", "third eye activation"]},
    963: {"name": "Divine Consciousness", "effects": ["divine consciousness", "pineal gland activation", "higher self"]},
    888: {"name": "Abundance", "effects": ["prosperity consciousness", "wealth attraction", "abundance"]}
}

BRAINWAVE_BANDS = {
    "delta": {"range": (0.5, 4), "effects": ["deep sleep", "healing", "unconscious processing"]},
    "theta": {"range": (4, 8), "effects": ["meditation", "creativity", "deep relaxation", "emotional processing"]},
    "alpha": {"range": (8, 14), "effects": ["relaxation", "calm focus", "stress reduction", "learning"]},
    "beta": {"range": (14, 30), "effects": ["active thinking", "focus", "problem solving", "alertness"]},
    "gamma": {"range": (30, 100), "effects": ["higher consciousness", "peak perception", "insight"]}
}

class FrequencyAnalyzer:
    """Analyze and process frequency research data"""
    
    def __init__(self):
        self.frequency_counter = Counter()
        self.effect_counter = Counter()
        self.source_stats = defaultdict(lambda: {"count": 0, "frequencies": set(), "effects": set()})
        self.research_database = []

    def process_entries(self, entries: List[Any]) -> Dict[str, Any]:
        """Process all scraped entries into structured data"""
        processed = []
        
        for entry in entries:
            processed_entry = self._process_entry(entry)
            if processed_entry:
                processed.append(processed_entry)
        
        self.research_database = processed
        
        # Generate statistics
        stats = self._generate_statistics()
        
        return {
            "entries": processed,
            "statistics": stats,
            "frequency_index": self._build_frequency_index(),
            "effect_index": self._build_effect_index(),
            "source_index": self._build_source_index(),
            "generated_at": datetime.now().isoformat()
        }

    def _process_entry(self, entry) -> Optional[Dict]:
        """Process a single research entry"""
        try:
            # Extract structured data
            frequencies = entry.frequencies_mentioned if hasattr(entry, 'frequencies_mentioned') else []
            effects = entry.effects_claimed if hasattr(entry, 'effects_claimed') else []
            
            # Map frequencies to known solfeggio
            solfeggio_matches = []
            for freq in frequencies:
                rounded = round(freq)
                if rounded in FREQUENCY_EFFECT_MAP:
                    solfeggio_matches.append({
                        "frequency": rounded,
                        "name": FREQUENCY_EFFECT_MAP[rounded]["name"],
                        "documented_effects": FREQUENCY_EFFECT_MAP[rounded]["effects"]
                    })
            
            # Detect brainwave frequencies
            brainwave_matches = []
            for freq in frequencies:
                for band, info in BRAINWAVE_BANDS.items():
                    if info["range"][0] <= freq <= info["range"][1]:
                        brainwave_matches.append({
                            "frequency": freq,
                            "band": band,
                            "effects": info["effects"]
                        })
            
            # Build frequency profile
            frequency_profile = {
                "all_frequencies": frequencies,
                "solfeggio_detected": solfeggio_matches,
                "brainwave_detected": brainwave_matches,
                "primary_frequency": frequencies[0] if frequencies else None
            }
            
            # Build effect profile
            effect_profile = {
                "claimed_effects": effects,
                "verified_effects": [e for e in effects if e in self._get_verified_effects()],
                "effect_categories": self._categorize_effects(effects)
            }
            
            # Update counters
            self.frequency_counter.update(frequencies)
            self.effect_counter.update(effects)
            
            source_key = entry.source_type
            self.source_stats[source_key]["count"] += 1
            self.source_stats[source_key]["frequencies"].update(frequencies)
            self.source_stats[source_key]["effects"].update(effects)
            
            return {
                "id": entry.id,
                "title": entry.title,
                "authors": entry.authors,
                "abstract": entry.abstract,
                "source_type": entry.source_type,
                "source_url": entry.source_url,
                "source_citation": entry.source_citation,
                "publication_date": entry.publication_date,
                "reliability_score": entry.reliability_score,
                "frequency_profile": frequency_profile,
                "effect_profile": effect_profile,
                "tags": entry.tags,
                "scraped_at": entry.scraped_at,
                "processed_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing entry: {e}")
            return None

    def _get_verified_effects(self) -> List[str]:
        """List of effects that have some scientific basis"""
        return [
            "serotonin", "dopamine", "oxytocin", "endorphin",
            "cortisol reduction", "relaxation", "pain relief",
            "sleep", "meditation", "brainwave", "cognitive"
        ]

    def _categorize_effects(self, effects: List[str]) -> Dict[str, List[str]]:
        """Categorize effects into groups"""
        categories = {
            "neurotransmitter": ["serotonin", "dopamine", "oxytocin", "endorphin", "gaba", "melatonin"],
            "physical": ["healing", "pain_relief", "immune", "dna"],
            "mental": ["relaxation", "focus", "sleep", "anxiety", "depression", "cognitive"],
            "spiritual": ["meditation", "chakra", "brainwave"]
        }
        
        result = defaultdict(list)
        for effect in effects:
            for category, keywords in categories.items():
                if effect in keywords:
                    result[category].append(effect)
                    break
        
        return dict(result)

    def _generate_statistics(self) -> Dict[str, Any]:
        """Generate comprehensive statistics"""
        return {
            "total_entries": len(self.research_database),
            "total_frequencies_found": len(self.frequency_counter),
            "total_effects_found": len(self.effect_counter),
            "top_frequencies": self.frequency_counter.most_common(20),
            "top_effects": self.effect_counter.most_common(20),
            "source_breakdown": {
                source: {
                    "count": stats["count"],
                    "unique_frequencies": len(stats["frequencies"]),
                    "unique_effects": len(stats["effects"])
                }
                for source, stats in self.source_stats.items()
            },
            "reliability_distribution": self._calculate_reliability_dist(),
            "frequency_coverage": self._calculate_frequency_coverage()
        }

    def _calculate_reliability_dist(self) -> Dict[str, int]:
        """Calculate reliability score distribution"""
        dist = {"high": 0, "medium": 0, "low": 0}
        for entry in self.research_database:
            score = entry["reliability_score"]
            if score >= 0.7:
                dist["high"] += 1
            elif score >= 0.4:
                dist["medium"] += 1
            else:
                dist["low"] += 1
        return dist

    def _calculate_frequency_coverage(self) -> Dict[str, Any]:
        """Calculate how well we've covered solfeggio frequencies"""
        covered = {}
        for freq, info in FREQUENCY_EFFECT_MAP.items():
            count = self.frequency_counter.get(freq, 0)
            covered[freq] = {
                "name": info["name"],
                "occurrences": count,
                "has_research": count > 0
            }
        return covered

    def _build_frequency_index(self) -> Dict[int, List[str]]:
        """Build index of frequencies to entry IDs"""
        index = defaultdict(list)
        for entry in self.research_database:
            for freq in entry["frequency_profile"]["all_frequencies"]:
                index[round(freq)].append(entry["id"])
        return dict(index)

    def _build_effect_index(self) -> Dict[str, List[str]]:
        """Build index of effects to entry IDs"""
        index = defaultdict(list)
        for entry in self.research_database:
            for effect in entry["effect_profile"]["claimed_effects"]:
                index[effect].append(entry["id"])
        return dict(index)

    def _build_source_index(self) -> Dict[str, List[str]]:
        """Build index of source types to entry IDs"""
        index = defaultdict(list)
        for entry in self.research_database:
            index[entry["source_type"]].append(entry["id"])
        return dict(index)


class FrequencySynthesizer:
    """Synthesize research findings into actionable insights"""
    
    def synthesize_frequency_profile(self, frequency: int, entries: List[Dict]) -> Dict:
        """Create comprehensive profile for a specific frequency"""
        matching = [e for e in entries if frequency in e["frequency_profile"]["all_frequencies"]]
        
        if not matching:
            return {"frequency": frequency, "status": "no_data"}
        
        all_effects = []
        for entry in matching:
            all_effects.extend(entry["effect_profile"]["claimed_effects"])
        
        effect_counts = Counter(all_effects)
        
        return {
            "frequency": frequency,
            "name": FREQUENCY_EFFECT_MAP.get(frequency, {}).get("name", "Unknown"),
            "total_studies": len(matching),
            "sources": [e["source_type"] for e in matching],
            "top_claimed_effects": effect_counts.most_common(10),
            "average_reliability": sum(e["reliability_score"] for e in matching) / len(matching),
            "evidence_strength": self._assess_evidence(matching),
            "key_findings": [e["abstract"][:200] for e in matching[:3]]
        }

    def _assess_evidence(self, entries: List[Dict]) -> str:
        """Assess overall evidence strength"""
        avg_reliability = sum(e["reliability_score"] for e in entries) / len(entries)
        academic_count = sum(1 for e in entries if e["source_type"] == "academic")
        
        if avg_reliability > 0.7 and academic_count > 2:
            return "strong"
        elif avg_reliability > 0.4 or academic_count > 0:
            return "moderate"
        else:
            return "emerging"

    def generate_research_summary(self, data: Dict) -> str:
        """Generate human-readable research summary"""
        stats = data["statistics"]
        
        summary = f"""
FREQUENCY RESEARCH DATABASE SUMMARY
====================================
Generated: {data['generated_at']}

Total Research Entries: {stats['total_entries']}
  - Academic Papers: {stats['source_breakdown'].get('academic', {}).get('count', 0)}
  - Books: {stats['source_breakdown'].get('book', {}).get('count', 0)}
  - Web Sources: {stats['source_breakdown'].get('web', {}).get('count', 0)}

Most Studied Frequencies:
"""
        for freq, count in stats['top_frequencies'][:5]:
            name = FREQUENCY_EFFECT_MAP.get(freq, {}).get("name", "")
            summary += f"  {freq}Hz ({name}): {count} mentions\n"
        
        summary += "\nMost Common Effects Claimed:\n"
        for effect, count in stats['top_effects'][:5]:
            summary += f"  - {effect}: {count} mentions\n"
        
        summary += f"\nSolfeggio Coverage: {sum(1 for f in stats['frequency_coverage'].values() if f['has_research'])}/11 frequencies"
        
        return summary
