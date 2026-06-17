"""
Nano Scraping System for Chess Learning Resources
Lightweight, efficient, rule-based data collection system
"""

import json
import re
import time
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta


class ScrapingRule:
    """Represents a single scraping rule."""
    
    def __init__(self, name: str, priority: int, enabled: bool = True,
                 max_retries: int = 3, cooldown_seconds: int = 60):
        self.name = name
        self.priority = priority
        self.enabled = enabled
        self.max_retries = max_retries
        self.cooldown_seconds = cooldown_seconds
        self.last_attempt_time = None
        self.success_count = 0
        self.failure_count = 0
    
    def can_attempt(self) -> bool:
        if not self.enabled:
            return False
        if self.last_attempt_time:
            elapsed = (datetime.now() - self.last_attempt_time).total_seconds()
            if elapsed < self.cooldown_seconds:
                return False
        return True
    
    def record_attempt(self, success: bool):
        self.last_attempt_time = datetime.now()
        if success:
            self.success_count += 1
            self.failure_count = 0
        else:
            self.failure_count += 1
    
    def should_disable(self) -> bool:
        if self.failure_count >= 3:
            return True
        return False


class DataSource:
    def __init__(self, name: str, base_url: str, rate_limit: int = 2,
                 cache_duration_hours: int = 24):
        self.name = name
        self.base_url = base_url
        self.rate_limit = rate_limit
        self.cache_duration_hours = cache_duration_hours
        self.request_count = 0
        self.last_request_time = None
        self.cache = {}
    
    def can_request(self) -> bool:
        now = datetime.now()
        if self.last_request_time:
            elapsed = (now - self.last_request_time).total_seconds()
            if elapsed < 60 / self.rate_limit:
                return False
        self.last_request_time = now
        self.request_count += 1
        return True
    
    def get_from_cache(self, key: str) -> Optional[Any]:
        if key in self.cache:
            cached_data, cached_time = self.cache[key]
            elapsed = (datetime.now() - cached_time).total_seconds()
            max_age = self.cache_duration_hours * 3600
            if elapsed < max_age:
                return cached_data
            else:
                del self.cache[key]
                return None
        return None
    
    def set_cache(self, key: str, data: Any):
        self.cache[key] = (data, datetime.now())


class DataValidator:
    def __init__(self):
        self.required_fields = {
            'chess_move': ['from', 'to', 'piece', 'notation'],
            'chess_position': ['square', 'piece', 'color'],
            'opening': ['name', 'moves', 'description', 'eco_code'],
            'tactic': ['name', 'description', 'example'],
            'puzzle': ['fen', 'solution', 'difficulty', 'theme'],
            'book': ['title', 'author', 'year', 'content_snippet']
        }
    
    def validate(self, data_type: str, data: Dict) -> tuple[bool, List[str]]:
        errors = []
        
        if data_type not in self.required_fields:
            errors.append(f"Unknown data type: {data_type}")
            return (False, errors)
        
        required = self.required_fields[data_type]
        for field in required:
            if field not in data or not data[field]:
                errors.append(f"Missing required field: {field}")
        
        return (len(errors) == 0, errors)
    
    def sanitize(self, data: Dict) -> Dict:
        sanitized = {}
        for key, value in data.items():
            if isinstance(value, str):
                value = re.sub(r'<[^>]+>', '', value)
                value = re.sub(r'<script[^>]*>.*?</script>', '', value, flags=re.IGNORECASE)
                value = ' '.join(value.split())
                sanitized[key] = value
            else:
                sanitized[key] = value
        return sanitized


class ScrapedDataStorage:
    def __init__(self, storage_file: str = 'scraped_data.json'):
        self.storage_file = storage_file
        self.data = {}
        self.load_data()
    
    def load_data(self):
        try:
            with open(self.storage_file, 'r') as f:
                self.data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            pass
    
    def save_data(self, data_type: str, items: List[Dict]):
        self.data[data_type] = items
        self.save_storage()
    
    def save_storage(self):
        with open(self.storage_file, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def get_data(self, data_type: str) -> List[Dict]:
        return self.data.get(data_type, [])
    
    def search(self, query: str, data_type: Optional[str] = None) -> List[Dict]:
        query_lower = query.lower()
        results = []
        
        if data_type:
            items = self.data.get(data_type, [])
            for item in items:
                if self._matches_query(item, query_lower):
                    results.append(item)
        else:
            for data_type, items in self.data.items():
                for item in items:
                    if self._matches_query(item, query_lower):
                        results.append(item)
        
        return results[:100]
    
    def _matches_query(self, item: Dict, query: str) -> bool:
        query_terms = query.split()
        searchable_text = ' '.join([str(v) for v in item.values()]).lower()
        for term in query_terms:
            if term.lower() in searchable_text:
                return True
        return False
    
    def get_size(self) -> int:
        return sum(len(items) for items in self.data.values())
    
    def export_data(self, data_type: Optional[str] = None, format: str = 'json'):
        export_data = {}
        if data_type:
            export_data[data_type] = self.data.get(data_type, [])
        else:
            export_data = self.data
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'chess_data_{timestamp}.{format}'
        
        with open(filename, 'w') as f:
            if format == 'json':
                json.dump(export_data, f, indent=2)
            elif format == 'csv':
                import csv
                with open(filename, 'w') as f:
                    writer = csv.writer(f)
                    for dtype, items in export_data.items():
                        writer.writerow([dtype])
                        for item in items:
                            writer.writerow([str(v) for v in item.values()])
        
        print(f"Exported to {filename}")
        return filename


class NanoScraper:
    def __init__(self, config_file: str = 'scraper_config.json'):
        self.config_file = config_file
        self.rules = []
        self.data_sources = {}
        self.validator = DataValidator()
        self.storage = ScrapedDataStorage()
        self.load_config()
    
    def load_config(self):
        default_config = {
            'rules': self._get_default_rules(),
            'data_sources': self._get_default_data_sources(),
            'global_settings': {
                'max_total_requests_per_hour': 60,
                'enable_caching': True,
                'enable_rate_limiting': True,
                'user_agent': 'NanoScraper/1.0'
            }
        }
        
        try:
            with open(self.config_file, 'r') as f:
                config = json.load(f)
                default_config.update(config)
        except (FileNotFoundError, json.JSONDecodeError):
            pass
        
        for rule_data in default_config.get('rules', []):
            rule = ScrapingRule(**rule_data)
            self.rules.append(rule)
        
        for source_name, source_data in default_config.get('data_sources', {}).items():
            self.data_sources[source_name] = DataSource(**source_data)
    
    def _get_default_rules(self) -> List[Dict]:
        return [
            {'name': 'wikipedia_chess', 'priority': 8, 'enabled': True, 'max_retries': 3, 'cooldown_seconds': 300},
            {'name': 'chess_articles', 'priority': 7, 'enabled': True, 'max_retries': 5, 'cooldown_seconds': 180},
            {'name': 'opening_books', 'priority': 6, 'enabled': True, 'max_retries': 3, 'cooldown_seconds': 600},
            {'name': 'tactical_patterns', 'priority': 5, 'enabled': True, 'max_retries': 2, 'cooldown_seconds': 60},
            {'name': 'chess_puzzles', 'priority': 4, 'enabled': True, 'max_retries': 3, 'cooldown_seconds': 30}
        ]
    
    def _get_default_data_sources(self) -> Dict[str, Dict]:
        return {
            'wikipedia': {
                'name': 'Wikipedia Chess API',
                'base_url': 'https://en.wikipedia.org/api/rest_v1/page/summary/Chess',
                'rate_limit': 10,
                'cache_duration_hours': 168
            },
            'lichess': {
                'name': 'Lichess Opening Explorer',
                'base_url': 'https://lichess.org/api',
                'rate_limit': 5,
                'cache_duration_hours': 720
            }
        }
    
    def add_rule(self, name: str, priority: int, **kwargs) -> bool:
        rule = ScrapingRule(name=name, priority=priority, **kwargs)
        self.rules.append(rule)
        self.save_config()
        return True
    
    def add_data_source(self, name: str, base_url: str, **kwargs) -> bool:
        source = DataSource(name=name, base_url=base_url, **kwargs)
        self.data_sources[name] = source
        self.save_config()
        return True
    
    def scrape_wikipedia(self, topic: str = 'Chess') -> List[Dict]:
        source = self.data_sources.get('wikipedia')
        if not source or not source.can_request():
            return []
        
        print(f"Scraping Wikipedia: {topic}...")
        
        try:
            import requests
            headers = {'User-Agent': 'NanoScraper/1.0'}
            response = requests.get(urljoin(source.base_url, topic), headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                articles = []
                
                if 'query' in data and 'pages' in data['query']:
                    for page in data['query']['pages'][:5]:
                        article = {
                            'source': 'wikipedia',
                            'type': 'encyclopedia',
                            'title': page.get('title', 'Unknown'),
                            'extract': page.get('extract', ''),
                            'url': page.get('fullurl', ''),
                            'snippet': page.get('extract', '')[:200] + '...',
                            'scraped_at': datetime.now().isoformat()
                        }
                        articles.append(article)
                
                self.storage.save_data('wikipedia_articles', articles)
                source.set_cache('', articles)
                print(f"  Scraped {len(articles)} articles")
                return articles
            else:
                print(f"  Failed: HTTP {response.status_code}")
                return []
        
        except Exception as e:
            print(f"  Error: {str(e)}")
            return []
    
    def scrape_opening_moves(self) -> List[Dict]:
        openings = []
        opening_data = [
            {'name': 'Italian Game', 'moves': 'e2e4 d7d5 Ng1f3 O-O', 'description': 'Standard opening with strong center'},
            {'name': 'Sicilian Defense', 'moves': 'e2c4 c7d5 Ng1f3 O-O', 'description': 'Aggressive defense against e4'},
            {'name': "Queen's Gambit", 'moves': 'e2e4 e5f2 d2d4 Nf6', 'description': 'Gambit for control of center'},
            {'name': 'Ruy Lopez', 'moves': 'e2e4 e3f2 Ng1f3 O-O', 'description': 'Solid positional opening'}
            ]
        
        for opening in opening_data:
            openings.append({
                'source': 'static',
                'type': 'opening',
                'name': opening['name'],
                'moves': opening['moves'],
                'description': opening['description'],
                'scraped_at': datetime.now().isoformat()
            })
        
        self.storage.save_data('openings', openings)
        print(f"  Loaded {len(openings)} standard openings")
        return openings
    
    def scrape_tactical_patterns(self) -> List[Dict]:
        tactics = [
            {'source': 'static', 'type': 'tactic', 'name': 'Fork', 'description': 'Attack two pieces simultaneously', 'example': 'White plays d4, Black captures with dxd'},
            {'source': 'static', 'type': 'tactic', 'name': 'Pin', 'description': 'Immobilize a piece so it cannot move', 'example': 'White bishop on c5 pins Black knight on c6'},
            {'source': 'static', 'type': 'tactic', 'name': 'Skewer', 'description': 'Attack a piece that is defending another', 'example': 'White knight attacks Black bishop defending a pawn'},
            {'source': 'static', 'type': 'tactic', 'name': 'Discovered Attack', 'description': 'Move a piece to reveal an attack', 'example': 'White bishop moves to reveal attack on Black queen'}
            },
            {'source': 'static', 'type': 'tactic', 'name': 'Back Rank Mate', 'description': 'Checkmate using rook and queen', 'example': 'White queen and rook deliver checkmate on back rank'},
            {'source': 'static', 'type': 'tactic', 'name': "Scholar's Mate", 'description': 'Fool\'s mate in 4 moves: queen sacrifice', 'example': 'f3, f6, g6, f7, g6, c6, b7, b7'}
            }
        ]
        
        self.storage.save_data('tactics', tactics)
        print(f"  Loaded {len(tactics)} tactical patterns")
        return tactics
    
    def scrape_puzzles(self, difficulty: str = 'easy') -> List[Dict]:
        puzzles = []
        
        if difficulty == 'easy':
            puzzle_fens = [
                'rnb1kbnr/pppppppp/8/PPPPPPPP/RNBQKBNR',
                'r2bqkbnr/pppppppp/8/PPPPPPPP/RNBQKBNR'
            ]
        elif difficulty == 'medium':
            puzzle_fens = [
                'rnb1kbnr/pppppppp/8/PPPPPPPP/RNBQKBNR',
                'r1bqkb1/pppppppp/8/PPPPPPPP/RNBQKBNR'
            ]
        elif difficulty == 'hard':
            puzzle_fens = [
                'r3k2r/pp1bnppp/8/8/PPP1PPP1/RNBQKBNR',
                'r4k2r/pp1bnppp/8/8/PPP1PPP1/RNBQKBNR'
            ]
        
        for i, fen in enumerate(puzzle_fens, 1):
            puzzles.append({
                'source': 'generated',
                'type': 'puzzle',
                'id': f'{difficulty}_{i}',
                'fen': fen,
                'difficulty': difficulty,
                'theme': 'back_rank_mate',
                'scraped_at': datetime.now().isoformat()
            })
        
        self.storage.save_data(f'puzzles_{difficulty}', puzzles)
        print(f"  Generated {len(puzzles)} {difficulty} puzzles")
        return puzzles
    
    def save_config(self):
        config = {
            'rules': [rule.__dict__ for rule in self.rules],
            'data_sources': {name: source.__dict__ for name, source in self.data_sources.items()},
            'global_settings': {
                'max_total_requests_per_hour': 60,
                'enable_caching': True,
                'enable_rate_limiting': True,
                'user_agent': 'NanoScraper/1.0'
            }
        }
        
        with open(self.config_file, 'w') as f:
            json.dump(config, f, indent=2)
    
    def get_stats(self) -> Dict:
        stats = {
            'total_rules': len(self.rules),
            'enabled_rules': sum(1 for rule in self.rules if rule.enabled),
            'data_sources': len(self.data_sources),
            'storage_size': self.storage.get_size(),
            'last_updated': datetime.now().isoformat()
        }
        
        for rule in self.rules:
            stats[f'rule_{rule.name}'] = {
                'attempts': rule.success_count + rule.failure_count,
                'success_rate': rule.success_count / max(1, rule.success_count + rule.failure_count) if rule.success_count + rule.failure_count > 0 else 0
            }
        
        return stats
    
    def run_all_rules(self):
        results = []
        
        sorted_rules = sorted(self.rules, key=lambda r: r.priority)
        
        for rule in sorted_rules:
            if rule.enabled and rule.can_attempt():
                rule.record_attempt(True)
                
                if rule.name == 'wikipedia_chess':
                    data = self.scrape_wikipedia('Chess')
                    results.extend(data)
                elif rule.name == 'opening_books':
                    data = self.scrape_opening_moves()
                    results.extend(data)
                elif rule.name == 'tactical_patterns':
                    data = self.scrape_tactical_patterns()
                    results.extend(data)
                elif rule.name == 'chess_puzzles':
                    data = self.scrape_puzzles('easy')
                    results.extend(data)
                
                time.sleep(1)
        
        return results
    
    def get_size(self) -> int:
        return sum(len(items) for items in self.storage.data.values())


def main():
    print("=" * 50)
    print(" Nano Scraping System v1.0")
    print("=" * 50)
    print()
    
    scraper = NanoScraper()
    
    print(f"  Loaded {len(scraper.rules)} rules")
    print(f"  Loaded {len(scraper.data_sources)} data sources")
    print(f"  Storage has {scraper.storage.get_size()} items")
    print()
    
    print(" Running scraping rules...")
    print("-" * 50)
    
    results = scraper.run_all_rules()
    
    print(f"  Scraped {len(results)} total items")
    print()
    
    stats = scraper.get_stats()
    print(" Statistics:")
    print("-" * 50)
    
    print(f"Total Rules: {stats['total_rules']}")
    print(f"Enabled Rules: {stats['enabled_rules']}")
    print(f"Data Sources: {stats['data_sources']}")
    print(f"Storage Size: {stats['storage_size']}")
    print()
    
    print(" Data by Type:")
    for data_type, items in scraper.storage.data.items():
        print(f"  {data_type}: {len(items)} items")
    
    print()
    print("Scraping complete!")
    print(f" Data saved to: {scraper.storage_file_file}")
    print("=" * 50)


if __name__ == '__main__':
    main()
