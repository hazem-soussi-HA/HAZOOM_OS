#!/usr/bin/env python3
"""HAZOOM OS — Planet Earth News (local-only news feed, port 8001).

Local-only static + JSON API server, bound to 127.0.0.1.
Serves the news homepage at / and a live article feed at /api/news.
"""
import http.server
import json
import os
import socketserver
import time

PORT = 8001
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


def load_articles():
    path = os.path.join(ROOT, 'data', 'news.json')
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return []


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
        path = self.path.split('?', 1)[0]
        if path == '/api/news':
            articles = load_articles()
            now = int(time.time() * 1000)
            payload = json.dumps({
                'updated': now,
                'count': len(articles),
                'articles': articles,
            }).encode()
            return self._send(200, payload, 'application/json')
        if path == '/api/health':
            return self._send(200, json.dumps({'status': 'ok', 'service': 'planet-earth-news'}).encode(), 'application/json')
        self._serve_file(path)


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', PORT), Handler) as httpd:
        print(f'[HAZOOM] Planet Earth News serving on http://127.0.0.1:{PORT}/')
        httpd.serve_forever()