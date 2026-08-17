#!/usr/bin/env python3
"""HAZOOM OS — DeepSeek Knowledge Base (local-only, port 8200).

Offline knowledge base with full-text search over embedded entries.
Serves a search UI at / and JSON search at /api/knowledge.
"""
import http.server
import json
import os
import socketserver

PORT = 8200
ROOT = os.path.dirname(os.path.abspath(__file__))

MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
}

with open(os.path.join(ROOT, 'data', 'knowledge.json'), encoding='utf-8') as f:
    ENTRIES = json.load(f)


def search(q):
    q = q.lower().strip()
    if not q:
        return ENTRIES
    scored = []
    for e in ENTRIES:
        hay = ' '.join([e['title'], e.get('tags', ''), e['body']]).lower()
        words = [w for w in q.split() if len(w) > 1]
        score = sum(hay.count(w) for w in words) * 2
        if q in hay:
            score += 4
        if score:
            scored.append((score, e))
    scored.sort(key=lambda x: -x[0])
    return [e for _, e in scored[:12]]


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def _send(self, code, body, ctype):
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def _serve_file(self, path):
        rel = os.path.normpath(path.lstrip('/'))
        if rel == '.':
            rel = 'index.html'
        if '..' in rel:
            return self._send(403, b'forbidden', 'text/plain')
        full = os.path.join(ROOT, rel)
        if not os.path.isfile(full):
            return self._send(404, b'not found', 'text/plain')
        ext = os.path.splitext(full)[1].lower()
        with open(full, 'rb') as f:
            self._send(200, f.read(), MIME.get(ext, 'application/octet-stream'))

    def do_GET(self):
        parsed = self.path.split('?', 1)
        path = parsed[0]
        if path == '/api/knowledge':
            q = ''
            if len(parsed) > 1:
                import urllib.parse
                q = urllib.parse.parse_qs(parsed[1]).get('q', [''])[0]
            results = search(q)
            return self._send(200, json.dumps({'query': q, 'count': len(results), 'entries': results}).encode(), 'application/json')
        if path == '/api/health':
            return self._send(200, json.dumps({'status': 'ok', 'service': 'deepseek-knowledge', 'entries': len(ENTRIES)}).encode(), 'application/json')
        self._serve_file(path)


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', PORT), Handler) as httpd:
        print(f'[HAZOOM] DeepSeek Knowledge on http://127.0.0.1:{PORT}/')
        httpd.serve_forever()