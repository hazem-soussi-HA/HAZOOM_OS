#!/usr/bin/env python3
"""
Hazoom Search API Proxy v2.0
Real web search via DuckDuckGo Lite + context clarity engine
"""

import http.server
import json
import urllib.parse
import urllib.request
import ssl
import sys
import re
import html
import time
import hashlib
from datetime import datetime

# ─── Configuration ───────────────────────────────────────────────────────────

PORT = 8003
MAX_RESULTS = 20
CACHE_TTL = 300  # 5 minutes

# ─── Search Cache ────────────────────────────────────────────────────────────

class SearchCache:
    def __init__(self):
        self._cache = {}

    def _key(self, query, page=0):
        return hashlib.md5(f"{query}:{page}".encode()).hexdigest()

    def get(self, query, page=0):
        key = self._key(query, page)
        entry = self._cache.get(key)
        if entry and (time.time() - entry["ts"]) < CACHE_TTL:
            return entry["data"]
        return None

    def put(self, query, page=0, data=None):
        key = self._key(query, page)
        self._cache[key] = {"ts": time.time(), "data": data}

    def clear(self):
        self._cache.clear()

cache = SearchCache()

# ─── Context Analyser ────────────────────────────────────────────────────────

def analyse_query(query):
    """Extract search context: language, category, intent, entities"""
    q = query.strip()
    ctx = {
        "original_query": q,
        "language": "en",
        "category": "general",
        "intent": "search",
        "entities": [],
        "keywords": [],
        "is_question": False,
        "is_code": False,
        "time_range": None,
    }

    # Detect question
    if q.endswith("?") or re.match(r'^(what|who|where|when|why|how|which|is|are|do|does|can|could|will|would|should)\b', q, re.I):
        ctx["is_question"] = True
        ctx["intent"] = "answer"

    # Detect code search
    if re.search(r'[{};()=<>!]|function|class|import|def |const |var |let |=>|print\(|console\.', q):
        ctx["is_code"] = True
        ctx["category"] = "code"

    # Detect language patterns
    lang_patterns = {
        "en": r'\b(the|a|an|is|are|was|were|what|how|why|where)\b',
        "fr": r'\b(le|la|les|un|une|des|est|sont|quoi|comment|pourquoi|où)\b',
        "ar": r'[\u0600-\u06FF]',
    }
    for lang, pat in lang_patterns.items():
        if re.search(pat, q, re.I):
            ctx["language"] = lang
            break

    # Detect category
    cat_patterns = {
        "tech": r'\b(code|programming|python|javascript|api|server|database|linux|git|docker|react|css|html)\b',
        "science": r'\b(science|physics|chemistry|biology|math|equation|research|study|experiment)\b',
        "news": r'\b(news|latest|today|breaking|update|recent)\b',
        "image": r'\b(image|picture|photo|gif|wallpaper|screenshot)\b',
        "video": r'\b(video|youtube|watch|stream|movie|film|episode)\b',
        "shopping": r'\b(buy|price|cheap|deal|shop|store|order|discount)\b',
    }
    for cat, pat in cat_patterns.items():
        if re.search(pat, q, re.I):
            ctx["category"] = cat
            break

    # Extract quoted entities
    entities = re.findall(r'"([^"]+)"', q)
    ctx["entities"] = entities

    # Extract keywords (remove stop words)
    stop_words = {'the','a','an','is','are','was','were','in','on','at','to','for','of','and','or','not','but','what','how','why','where','when','which','who','do','does','did','can','could','will','would','should','i','you','it','this','that','be','have','has'}
    words = re.findall(r'\b[a-zA-Z]{2,}\b', q.lower())
    ctx["keywords"] = [w for w in words if w not in stop_words][:8]

    return ctx

# ─── DuckDuckGo Search ──────────────────────────────────────────────────────

def ddg_search(query, max_results=10):
    """Search via DuckDuckGo HTML (no API key needed)"""
    results = []
    try:
        encoded = urllib.parse.quote_plus(query)
        url = f"https://html.duckduckgo.com/html/?q={encoded}"

        ctx_ssl = ssl.create_default_context()
        ctx_ssl.check_hostname = False
        ctx_ssl.verify_mode = ssl.CERT_NONE

        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        })

        with urllib.request.urlopen(req, context=ctx_ssl, timeout=10) as resp:
            body = resp.read().decode("utf-8", errors="ignore")

        # Parse DuckDuckGo HTML results
        # Result links: <a rel="nofollow" class="result__a" href="...">TITLE</a>
        # Snippets: <a class="result__snippet" href="...">SNIPPET</a>

        link_pattern = re.compile(r'<a\s+rel="nofollow"\s+class="result__a"\s+href="([^"]+)"[^>]*>(.*?)</a>', re.DOTALL)
        snip_pattern = re.compile(r'<a\s+class="result__snippet"\s+href="[^"]*"[^>]*>(.*?)</a>', re.DOTALL)

        links = link_pattern.findall(body)
        snips = snip_pattern.findall(body)

        for i, (raw_url, title) in enumerate(links):
            title = re.sub(r'<[^>]+>', '', title).strip()
            title = html.unescape(title)

            snippet = ""
            if i < len(snips):
                snippet = re.sub(r'<[^>]+>', '', snips[i]).strip()
                snippet = html.unescape(snippet)

            # Extract actual URL from DDG redirect
            actual_url = raw_url
            ddg_redirect = re.search(r'uddg=([^&]+)', raw_url)
            if ddg_redirect:
                actual_url = urllib.parse.unquote(ddg_redirect.group(1))

            if title and actual_url and actual_url.startswith('http'):
                results.append({
                    "title": title,
                    "url": actual_url,
                    "snippet": snippet or f"Search result for: {query}",
                    "source": "duckduckgo",
                    "type": "web"
                })

            if len(results) >= max_results:
                break

    except Exception as e:
        print(f"DDG search error: {e}")

    return results

# ─── Contextual Results Enrichment ──────────────────────────────────────────

def enrich_results(results, context):
    """Add context metadata to each result"""
    for r in results:
        r["context_match"] = {}
        title_lower = r.get("title", "").lower()
        snippet_lower = r.get("snippet", "").lower()

        for kw in context.get("keywords", []):
            if kw in title_lower:
                r["context_match"]["title_kw"] = True
            if kw in snippet_lower:
                r["context_match"]["snippet_kw"] = True

        if r.get("url",""):
            try:
                from urllib.parse import urlparse
                r["domain"] = urlparse(r["url"]).netloc
            except:
                r["domain"] = ""

    return results

# ─── HTTP Handler ────────────────────────────────────────────────────────────

class SearchHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        """Silent logging"""
        pass

    def do_OPTIONS(self):
        self._send_cors_headers()
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if parsed.path == "/api/search":
            query = params.get("q", [""])[0]
            page = int(params.get("page", ["0"])[0])
            max_r = min(int(params.get("max", ["10"])[0]), MAX_RESULTS)

            if not query:
                self._json_response({"error": "Query parameter 'q' required"}, 400)
                return

            # Check cache
            cached = cache.get(query, page)
            if cached:
                cached["from_cache"] = True
                self._json_response(cached)
                return

            # Analyse context
            context = analyse_query(query)

            # Perform real search
            results = ddg_search(query, max_r)

            # Enrich with context
            results = enrich_results(results, context)

            response = {
                "success": True,
                "query": query,
                "context": context,
                "results": results,
                "total": len(results),
                "page": page,
                "took": 0,
                "from_cache": False,
                "timestamp": datetime.utcnow().isoformat(),
            }

            cache.put(query, page, response)
            self._json_response(response)

        elif parsed.path == "/api/context":
            query = params.get("q", [""])[0]
            if not query:
                self._json_response({"error": "Query parameter 'q' required"}, 400)
                return
            context = analyse_query(query)
            self._json_response({"success": True, "context": context})

        elif parsed.path == "/api/cache/clear":
            cache.clear()
            self._json_response({"success": True, "message": "Cache cleared"})

        elif parsed.path == "/api/health":
            self._json_response({
                "success": True,
                "status": "healthy",
                "engine": "duckduckgo",
                "cache_entries": len(cache._cache),
                "version": "2.0.0"
            })

        else:
            self._json_response({"error": "Not found"}, 404)

    def do_POST(self):
        if self.path == "/api/search":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                self._json_response({"error": "Invalid JSON"}, 400)
                return

            query = data.get("query", "")
            if not query:
                self._json_response({"error": "query field required"}, 400)
                return

            context = analyse_query(query)
            results = ddg_search(query, MAX_RESULTS)
            results = enrich_results(results, context)

            response = {
                "success": True,
                "query": query,
                "context": context,
                "results": results,
                "total": len(results),
                "took": 0,
                "timestamp": datetime.utcnow().isoformat(),
            }
            self._json_response(response)
        else:
            self._json_response({"error": "Not found"}, 404)

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json_response(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._send_cors_headers()
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    port = PORT
    if len(sys.argv) > 1:
        port = int(sys.argv[1])

    print(f"""
╔══════════════════════════════════════════════════════════╗
║  🔍 HAZOOM SEARCH ENGINE v2.0                           ║
║  Context-Aware Web Search Proxy                          ║
║  Powered by DuckDuckGo · Zero Tracking                  ║
╠══════════════════════════════════════════════════════════╣
║  API: http://127.0.0.1:{port}/api/search?q=your+query     ║
║  Context: http://127.0.0.1:{port}/api/context?q=query     ║
║  Health: http://127.0.0.1:{port}/api/health                ║
╚══════════════════════════════════════════════════════════╝
""")

    server = http.server.HTTPServer(("0.0.0.0", port), SearchHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🔴 Hazoom Search Proxy stopped")
        server.shutdown()

if __name__ == "__main__":
    main()
