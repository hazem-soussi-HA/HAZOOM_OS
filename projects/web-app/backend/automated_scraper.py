#!/usr/bin/env python3
"""
Hazoom Automated Educational Content Scraper
Scrapes educational content on physics, science, math, language, and universe topics
"""

import requests
from bs4 import BeautifulSoup
import json
import os
import time
from urllib.parse import urljoin, urlparse
import re
from typing import List, Dict, Set
import sys

class EducationalScraper:
    """Automated scraper for educational content"""

    def __init__(self):
        self.scraped_data = []
        self.visited_urls = set()
        self.max_pages_per_topic = 15  # Increased for more comprehensive data
        self.delay_between_requests = 2  # Increased delay to be more respectful
        self.max_content_length = 2000  # Limit content length for processing

        # Comprehensive educational sources across multiple domains
        self.sources = {
            "physics": [
                # Wikipedia
                "https://en.wikipedia.org/wiki/Physics",
                "https://en.wikipedia.org/wiki/Classical_mechanics",
                "https://en.wikipedia.org/wiki/Electromagnetism",
                "https://en.wikipedia.org/wiki/Thermodynamics",
                "https://en.wikipedia.org/wiki/Quantum_mechanics",
                "https://en.wikipedia.org/wiki/Relativity",
                "https://en.wikipedia.org/wiki/Particle_physics",
                "https://en.wikipedia.org/wiki/Nuclear_physics",
                "https://en.wikipedia.org/wiki/Quantum_field_theory",
                "https://en.wikipedia.org/wiki/String_theory",
                # Educational sites
                "https://www.physicsclassroom.com/",
                "https://www.khanacademy.org/science/physics"
            ],
            "science": [
                # Wikipedia
                "https://en.wikipedia.org/wiki/Science",
                "https://en.wikipedia.org/wiki/Scientific_method",
                "https://en.wikipedia.org/wiki/Biology",
                "https://en.wikipedia.org/wiki/Chemistry",
                "https://en.wikipedia.org/wiki/Geology",
                "https://en.wikipedia.org/wiki/Astronomy",
                "https://en.wikipedia.org/wiki/Ecology",
                "https://en.wikipedia.org/wiki/Neuroscience",
                "https://en.wikipedia.org/wiki/Genetics",
                "https://en.wikipedia.org/wiki/Evolution",
                # Educational sites
                "https://www.khanacademy.org/science",
                "https://www.sciencenews.org/"
            ],
            "mathematics": [
                # Wikipedia
                "https://en.wikipedia.org/wiki/Mathematics",
                "https://en.wikipedia.org/wiki/Algebra",
                "https://en.wikipedia.org/wiki/Calculus",
                "https://en.wikipedia.org/wiki/Geometry",
                "https://en.wikipedia.org/wiki/Statistics",
                "https://en.wikipedia.org/wiki/Number_theory",
                "https://en.wikipedia.org/wiki/Topology",
                "https://en.wikipedia.org/wiki/Linear_algebra",
                "https://en.wikipedia.org/wiki/Probability_theory",
                "https://en.wikipedia.org/wiki/Discrete_mathematics",
                # Educational sites
                "https://www.khanacademy.org/math",
                "https://brilliant.org/"
            ],
            "language": [
                # Wikipedia
                "https://en.wikipedia.org/wiki/Language",
                "https://en.wikipedia.org/wiki/Linguistics",
                "https://en.wikipedia.org/wiki/Natural_language_processing",
                "https://en.wikipedia.org/wiki/Semantics",
                "https://en.wikipedia.org/wiki/Syntax",
                "https://en.wikipedia.org/wiki/Phonology",
                "https://en.wikipedia.org/wiki/Morphology_(linguistics)",
                "https://en.wikipedia.org/wiki/Pragmatics",
                "https://en.wikipedia.org/wiki/Sociolinguistics",
                "https://en.wikipedia.org/wiki/Psycholinguistics",
                # Educational sites
                "https://www.linguisticsociety.org/",
                "https://www.duolingo.com/"
            ],
            "universe": [
                # Wikipedia
                "https://en.wikipedia.org/wiki/Universe",
                "https://en.wikipedia.org/wiki/Cosmology",
                "https://en.wikipedia.org/wiki/Big_Bang",
                "https://en.wikipedia.org/wiki/Galaxy",
                "https://en.wikipedia.org/wiki/Black_hole",
                "https://en.wikipedia.org/wiki/Dark_matter",
                "https://en.wikipedia.org/wiki/Dark_energy",
                "https://en.wikipedia.org/wiki/Quantum_gravity",
                "https://en.wikipedia.org/wiki/Multiverse",
                "https://en.wikipedia.org/wiki/Extraterrestrial_life",
                # NASA and scientific sites
                "https://science.nasa.gov/missions/hubble",
                "https://www.nasa.gov/mission_pages/hubble/main/index.html",
                "https://www.esa.int/Science_Exploration/Space_Science"
            ],
            "philosophy": [
                # Wikipedia
                "https://en.wikipedia.org/wiki/Philosophy",
                "https://en.wikipedia.org/wiki/Metaphysics",
                "https://en.wikipedia.org/wiki/Epistemology",
                "https://en.wikipedia.org/wiki/Ethics",
                "https://en.wikipedia.org/wiki/Political_philosophy",
                "https://en.wikipedia.org/wiki/Aesthetics",
                "https://en.wikipedia.org/wiki/Philosophy_of_mind",
                "https://en.wikipedia.org/wiki/Philosophy_of_science",
                "https://en.wikipedia.org/wiki/Existentialism",
                "https://en.wikipedia.org/wiki/Stoicism"
            ],
            "freedom_studies": [
                # Wikipedia
                "https://en.wikipedia.org/wiki/Human_rights",
                "https://en.wikipedia.org/wiki/Civil_liberties",
                "https://en.wikipedia.org/wiki/Democracy",
                "https://en.wikipedia.org/wiki/Constitutional_law",
                "https://en.wikipedia.org/wiki/Freedom_of_speech",
                "https://en.wikipedia.org/wiki/Freedom_of_thought",
                "https://en.wikipedia.org/wiki/Intellectual_freedom",
                "https://en.wikipedia.org/wiki/Self-determination"
            ]
        }

    def scrape_wikipedia_page(self, url: str, topic: str) -> Dict:
        """Scrape content from a Wikipedia page"""
        try:
            headers = {
                'User-Agent': 'Hazoom-Educational-Scraper/1.0 (Educational AI Training)'
            }

            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Extract title
            title = soup.find('h1', {'id': 'firstHeading'})
            title_text = title.get_text() if title else "Unknown Title"

            # Extract main content (first few paragraphs)
            content_div = soup.find('div', {'id': 'mw-content-text'})
            if content_div:
                paragraphs = content_div.find_all('p', limit=8)  # Increased to 8 paragraphs
                content = ' '.join([p.get_text() for p in paragraphs])
            else:
                content = "Content extraction failed"

            # Clean the content
            content = self.clean_text(content)

            return {
                "title": title_text,
                "url": url,
                "topic": topic,
                "content": content[:self.max_content_length],  # Limit content length
                "source": "wikipedia",
                "scraped_at": time.time()
            }

        except Exception as e:
            print(f"Error scraping {url}: {str(e)}")
            return None

    def scrape_educational_site(self, url: str, topic: str) -> Dict:
        """Scrape content from educational websites"""
        try:
            headers = {
                'User-Agent': 'Hazoom-Educational-Scraper/1.0 (Educational AI Training)'
            }

            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Extract title
            title = soup.find('title')
            title_text = title.get_text() if title else url.split('/')[-1]

            # Try different content extraction strategies
            content = ""

            # Strategy 1: Look for main content areas
            main_content = soup.find('main') or soup.find('article') or soup.find('div', {'class': 'content'})
            if main_content:
                paragraphs = main_content.find_all('p', limit=10)
                content = ' '.join([p.get_text() for p in paragraphs])

            # Strategy 2: Get all paragraphs if no main content found
            if not content:
                paragraphs = soup.find_all('p', limit=15)
                content = ' '.join([p.get_text() for p in paragraphs])

            # Strategy 3: Get text from body if still no content
            if not content:
                body = soup.find('body')
                if body:
                    content = body.get_text()[:2000]  # Limit to first 2000 chars

            # Clean the content
            content = self.clean_text(content)

            # Determine source type
            if 'nasa.gov' in url:
                source_type = 'nasa'
            elif 'khanacademy.org' in url:
                source_type = 'khan_academy'
            elif 'brilliant.org' in url:
                source_type = 'brilliant'
            elif 'duolingo.com' in url:
                source_type = 'duolingo'
            else:
                source_type = 'educational_site'

            return {
                "title": title_text,
                "url": url,
                "topic": topic,
                "content": content[:self.max_content_length],
                "source": source_type,
                "scraped_at": time.time()
            }

        except Exception as e:
            print(f"Error scraping educational site {url}: {str(e)}")
            return None

    def clean_text(self, text: str) -> str:
        """Clean extracted text"""
        # Remove citations [1], [2], etc.
        text = re.sub(r'\[\d+\]', '', text)
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove non-breaking spaces
        text = text.replace('\xa0', ' ')
        return text.strip()

    def scrape_topic(self, topic: str) -> List[Dict]:
        """Scrape all pages for a specific topic using appropriate scraper"""
        print(f"Scraping topic: {topic}")
        topic_data = []

        for url in self.sources.get(topic, []):
            if url in self.visited_urls:
                continue

            print(f"  Scraping: {url}")

            # Choose appropriate scraper based on URL
            if 'wikipedia.org' in url:
                data = self.scrape_wikipedia_page(url, topic)
            else:
                data = self.scrape_educational_site(url, topic)

            if data and len(data['content']) > 100:  # Only keep substantial content
                topic_data.append(data)
                self.visited_urls.add(url)

            time.sleep(self.delay_between_requests)  # Be respectful to servers

            if len(topic_data) >= self.max_pages_per_topic:
                break

        return topic_data

    def scrape_all_topics(self) -> List[Dict]:
        """Scrape educational content for all topics"""
        all_data = []

        for topic in self.sources.keys():
            topic_data = self.scrape_topic(topic)
            all_data.extend(topic_data)
            print(f"Completed {topic}: {len(topic_data)} pages scraped")

        self.scraped_data = all_data
        return all_data

    def save_to_file(self, filename: str = "educational_dataset.json"):
        """Save scraped data to JSON file"""
        output_path = os.path.join(os.path.dirname(__file__), '..', 'data', filename)

        # Ensure data directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.scraped_data, f, indent=2, ensure_ascii=False)

        print(f"Saved {len(self.scraped_data)} educational entries to {output_path}")

    def load_from_file(self, filename: str = "educational_dataset.json") -> List[Dict]:
        """Load previously scraped data"""
        input_path = os.path.join(os.path.dirname(__file__), '..', 'data', filename)

        if os.path.exists(input_path):
            with open(input_path, 'r', encoding='utf-8') as f:
                self.scraped_data = json.load(f)
            print(f"Loaded {len(self.scraped_data)} entries from {input_path}")
            return self.scraped_data
        else:
            print(f"File {input_path} not found")
            return []

def main():
    """Main scraping function"""
    print("Hazoom Educational Content Scraper")
    print("=" * 50)

    scraper = EducationalScraper()

    # Check if we already have scraped data
    existing_data = scraper.load_from_file()

    if existing_data:
        print(f"Found existing dataset with {len(existing_data)} entries")
        print("Enhancing dataset with additional sources...")

    # Always scrape new data to enhance the dataset
    print("Starting comprehensive automated scraping...")
    scraped_data = scraper.scrape_all_topics()

    print(f"\nScraping completed! Collected {len(scraped_data)} educational entries")

    # Save the data
    scraper.save_to_file()

    print("Educational content successfully scraped and saved!")

if __name__ == "__main__":
    main()