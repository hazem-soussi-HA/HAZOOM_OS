"""
Chess Learning Resources Fetcher
Safely fetches chess tutorials and documentation from the web
"""

import requests
from bs4 import BeautifulSoup
import time
import json
import os
from typing import Optional, List, Dict
from urllib.robotparser import RobotFileParser
from urllib.parse import urljoin, urlparse


class ChessResourcesFetcher:
    def __init__(self, cache_dir: str = "cache"):
        self.cache_dir = cache_dir
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'ChessLearningBot/1.0 (Educational Purpose; Contact: chess@example.com)'
        })
        self.last_request_time = 0
        self.min_request_interval = 2.0  # 2 seconds between requests
        
        if not os.path.exists(cache_dir):
            os.makedirs(cache_dir)
    
    def _respect_rate_limit(self):
        """Ensure we don't make too many requests too quickly."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_request_interval:
            time.sleep(self.min_request_interval - time_since_last)
        
        self.last_request_time = time.time()
    
    def _check_robots_txt(self, url: str) -> bool:
        """Check if robots.txt allows crawling the URL."""
        parsed = urlparse(url)
        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
        
        try:
            rp = RobotFileParser()
            rp.set_url(robots_url)
            rp.read()
            return rp.can_fetch('*', url)
        except Exception:
            return True  # Allow if we can't check robots.txt
    
    def _get_cached_data(self, cache_key: str) -> Optional[Dict]:
        """Get data from cache if available."""
        cache_file = os.path.join(self.cache_dir, f"{cache_key}.json")
        
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if time.time() - data.get('timestamp', 0) < 86400 * 7:  # 7 days cache
                        return data['content']
            except Exception:
                pass
        
        return None
    
    def _save_to_cache(self, cache_key: str, content: Dict):
        """Save data to cache."""
        cache_file = os.path.join(self.cache_dir, f"{cache_key}.json")
        
        try:
            data = {
                'timestamp': time.time(),
                'content': content
            }
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error caching data: {e}")
    
    def fetch_chess_tutorial(self, url: str) -> Optional[Dict]:
        """Fetch a chess tutorial from a URL safely."""
        if not self._check_robots_txt(url):
            print(f"Robots.txt disallows: {url}")
            return None
        
        cache_key = f"tutorial_{hash(url)}"
        cached = self._get_cached_data(cache_key)
        if cached:
            return cached
        
        self._respect_rate_limit()
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            tutorial_data = {
                'url': url,
                'title': soup.title.string if soup.title else 'Untitled',
                'content': self._extract_content(soup),
                'timestamp': time.time()
            }
            
            self._save_to_cache(cache_key, tutorial_data)
            return tutorial_data
            
        except requests.RequestException as e:
            print(f"Error fetching tutorial: {e}")
            return None
        except Exception as e:
            print(f"Error parsing tutorial: {e}")
            return None
    
    def _extract_content(self, soup: BeautifulSoup) -> str:
        """Extract main content from HTML."""
        content_selectors = [
            'article',
            'main',
            '[role="main"]',
            '.content',
            '.post-content',
            '.entry-content'
        ]
        
        for selector in content_selectors:
            element = soup.select_one(selector)
            if element:
                text = element.get_text(separator='\n', strip=True)
                if len(text) > 100:  # Ensure we got substantial content
                    return text
        
        return soup.get_text(separator='\n', strip=True)
    
    def fetch_chess_openings(self) -> List[Dict]:
        """Fetch information about chess openings from Wikipedia."""
        url = "https://en.wikipedia.org/wiki/Chess_opening"
        
        cache_key = "chess_openings_wikipedia"
        cached = self._get_cached_data(cache_key)
        if cached:
            return cached
        
        self._respect_rate_limit()
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            openings = []
            for heading in soup.find_all(['h2', 'h3']):
                if heading.text and not ('See also' in heading.text or 'References' in heading.text):
                    next_element = heading.find_next_sibling()
                    if next_element and next_element.name in ['ul', 'p']:
                        openings.append({
                            'name': heading.text.strip(),
                            'description': next_element.get_text(strip=True)[:200]
                        })
            
            self._save_to_cache(cache_key, openings)
            return openings
            
        except Exception as e:
            print(f"Error fetching openings: {e}")
            return []
    
    def fetch_chess_tactics(self) -> List[Dict]:
        """Fetch information about chess tactics."""
        url = "https://en.wikipedia.org/wiki/Chess_tactic"
        
        cache_key = "chess_tactics_wikipedia"
        cached = self._get_cached_data(cache_key)
        if cached:
            return cached
        
        self._respect_rate_limit()
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            tactics = []
            for heading in soup.find_all('h3'):
                if heading.text and heading.text.strip():
                    next_p = heading.find_next_sibling('p')
                    if next_p:
                        tactics.append({
                            'name': heading.text.strip(),
                            'description': next_p.get_text(strip=True)[:300]
                        })
            
            self._save_to_cache(cache_key, tactics)
            return tactics
            
        except Exception as e:
            print(f"Error fetching tactics: {e}")
            return []
    
    def fetch_chess_books_list(self) -> List[Dict]:
        """Return a curated list of famous chess books (static data)."""
        return [
            {
                'title': 'My System',
                'author': 'Aron Nimzowitsch',
                'year': '1925',
                'description': 'Classic text on positional chess, covering pawn structure, piece activity, and prophylaxis.',
                'level': 'Intermediate to Advanced'
            },
            {
                'title': 'Logical Chess: Move by Move',
                'author': 'Irving Chernev',
                'year': '1957',
                'description': 'Explains 33 master games move by move, perfect for understanding why moves are made.',
                'level': 'Beginner to Intermediate'
            },
            {
                'title': 'The Amateur\'s Mind',
                'author': 'Jeremy Silman',
                'year': '1999',
                'description': 'Turns chess mistakes into lessons, explaining the thought process behind moves.',
                'level': 'Beginner to Intermediate'
            },
            {
                'title': 'My 60 Memorable Games',
                'author': 'Bobby Fischer',
                'year': '1969',
                'description:': 'Fischer\'s annotations of his own games, featuring brilliant combinations and strategic concepts.',
                'level': 'Intermediate to Advanced'
            },
            {
                'title': 'Think Like a Grandmaster',
                'author': 'Alexander Kotov',
                'year': '1971',
                'description': 'Teaches how to analyze positions systematically and think like a grandmaster.',
                'level': 'Intermediate to Advanced'
            },
            {
                'title': 'Simple Chess',
                'author': 'Michael Stean',
                'year': '1978',
                'description': 'Introduces positional chess concepts in an accessible way.',
                'level': 'Beginner'
            },
            {
                'title': 'Bobby Fischer Teaches Chess',
                'author': 'Bobby Fischer',
                'year': '1966',
                'description': 'Programmed learning approach teaching chess from basics to advanced tactics.',
                'level': 'Beginner'
            },
            {
                'title': 'Zurich International Chess Tournament 1953',
                'author': 'David Bronstein',
                'year': '1979',
                'description': 'Considered one of the greatest chess books ever written.',
                'level': 'Advanced'
            }
        ]
    
    def fetch_training_puzzles(self, count: int = 10) -> List[Dict]:
        """Return sample chess puzzles (static data for demonstration)."""
        puzzles = [
            {
                'fen': 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq -',
                'solution': 'Qxf7#',
                'difficulty': 'Easy',
                'theme': 'Scholar\'s Mate'
            },
            {
                'fen': 'rnbqk2r/ppp2ppp/3p1n2/2b5/2B1P3/2N2N2/PPP2PPP/R1BQK2R w KQkq -',
                'solution': 'Nf3-g5',
                'difficulty': 'Easy',
                'theme': 'Knight fork preparation'
            },
            {
                'fen': 'r1b1k2r/ppppqppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq -',
                'solution': 'Bxf7+',
                'difficulty': 'Medium',
                'theme': 'Bishop sacrifice'
            },
            {
                'fen': 'r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/2N2N2/PPP2PPP/R1BQK2R b KQkq -',
                'solution': 'Nf6-g4',
                'difficulty': 'Medium',
                'theme': 'Pin'
            }
        ]
        
        return puzzles[:count]
    
    def get_learning_plan(self, level: str = 'beginner') -> Dict:
        """Get a structured learning plan based on player level."""
        plans = {
            'beginner': {
                'title': 'Beginner Chess Learning Plan',
                'duration': '3-6 months',
                'goals': [
                    'Master basic piece movements',
                    'Understand checkmate patterns',
                    'Learn opening principles',
                    'Practice basic tactics',
                    'Play 100 games'
                ],
                'resources': [
                    {'type': 'book', 'title': 'Bobby Fischer Teaches Chess'},
                    {'type': 'online', 'title': 'Chess.com lessons'},
                    {'type': 'practice', 'title': 'Daily puzzles (easy)'}
                ]
            },
            'intermediate': {
                'title': 'Intermediate Chess Learning Plan',
                'duration': '6-12 months',
                'goals': [
                    'Study positional play',
                    'Learn key opening systems',
                    'Master tactical patterns',
                    'Analyze your own games',
                    'Play in tournaments'
                ],
                'resources': [
                    {'type': 'book', 'title': 'My System'},
                    {'type': 'book', 'title': 'The Amateur\'s Mind'},
                    {'type': 'online', 'title': 'Chessable courses'},
                    {'type': 'practice', 'title': 'Daily puzzles (medium)'}
                ]
            },
            'advanced': {
                'title': 'Advanced Chess Learning Plan',
                'duration': '12+ months',
                'goals': [
                    'Deep study of endgames',
                    'Mastery of specific openings',
                    'Complex calculation training',
                    'Grandmaster game analysis',
                    'Competitive play'
                ],
                'resources': [
                    {'type': 'book', 'title': 'My 60 Memorable Games'},
                    {'type': 'book', 'title': 'Think Like a Grandmaster'},
                    {'type': 'online', 'title': 'Chessbase database'},
                    {'type': 'practice', 'title': 'Complex tactical studies'}
                ]
            }
        }
        
        return plans.get(level.lower(), plans['beginner'])


def main():
    """Test the fetcher."""
    fetcher = ChessResourcesFetcher()
    
    print("=== Chess Books ===")
    books = fetcher.fetch_chess_books_list()
    for book in books[:3]:
        print(f"\n{book['title']} by {book['author']}")
        print(f"  {book['description']}")
    
    print("\n=== Training Puzzles ===")
    puzzles = fetcher.fetch_training_puzzles(2)
    for puzzle in puzzles:
        print(f"\n{puzzle['theme']} ({puzzle['difficulty']})")
        print(f"  FEN: {puzzle['fen']}")
        print(f"  Solution: {puzzle['solution']}")
    
    print("\n=== Learning Plan ===")
    plan = fetcher.get_learning_plan('beginner')
    print(f"\n{plan['title']}")
    print(f"Duration: {plan['duration']}")
    print("\nGoals:")
    for goal in plan['goals']:
        print(f"  - {goal}")


if __name__ == '__main__':
    main()
