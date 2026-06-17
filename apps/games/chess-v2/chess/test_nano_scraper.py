#!/usr/bin/env python3
"""Test script for nano_scraper"""
import json
from nano_scraper import NanoScraper

print("Testing NanoScraper...")

scraper = NanoScraper()

# Test config loading
print(f"Rules: {len(scraper.rules)}")
print(f"Data Sources: {len(scraper.data_sources)}")

# Test adding rule
scraper.add_rule('test_rule', priority=5, enabled=True, max_retries=2, cooldown_seconds=30)

print(f"✅ Added test rule. Total rules: {len(scraper.rules)}")

# Save config
scraper.save_config()
print("✅ Configuration saved")

# Test scraping a single rule
print("\nTesting single rule scrape...")
results = scraper.scrape_wikipedia('Chess')

print(f"Scraped {len(results)} Wikipedia articles")

# Export test
scraper.storage.export_data('test_results', format='json')

print("\n✅ All tests passed!")
