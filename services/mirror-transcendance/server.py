#!/usr/bin/env python3
"""HAZOOM OS — Mirror Transcendance (local-only, port 8006).

A self-reflection journal: write a thought, face the mirror, keep the
record. Reflections persist to data/reflections.json on disk.
"""
import http.server
import json
import os
import socketserver
import time

PORT = int(os.environ.get('PORT', 8006))
BIND = os.environ.get('BIND', '127.0.0.1')
ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, 'data', 'reflections.json')

MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
}


def load_reflections():
    try:
        with open(DATA, encoding='utf-8') as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return []


def save_reflection(entry):
    refs = load_reflections()
    refs.insert(0, entry)
    with open(DATA, 'w', encoding='utf-8') as f:
        json.dump(refs, f, ensure_ascii=False, indent=2)


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
        if path == '/api/reflections':
            refs = load_reflections()
            return self._send(200, json.dumps({'count': len(refs), 'reflections': refs}).encode(), 'application/json')
        if path == '/api/health':
            return self._send(200, json.dumps({'status': 'ok', 'service': 'mirror-transcendance'}).encode(), 'application/json')
        self._serve_file(path)

    def do_POST(self):
        if self.path.split('?', 1)[0] != '/api/reflections':
            return self._send(404, b'not found', 'text/plain')
        length = int(self.headers.get('Content-Length', 0))
        if length > 8192:
            return self._send(413, b'too large', 'text/plain')
        try:
            data = json.loads(self.rfile.read(length) or b'{}')
            text = str(data.get('text', '')).strip()[:2000]
        except json.JSONDecodeError:
            text = ''
        if not text:
            return self._send(400, json.dumps({'error': 'empty reflection'}).encode(), 'application/json')
        entry = {'id': int(time.time() * 1000), 'text': text, 'mood': str(data.get('mood', '')), 'ts': time.strftime('%Y-%m-%d %H:%M')}
        save_reflection(entry)
        self._send(201, json.dumps({'saved': True, 'reflection': entry}).encode(), 'application/json')


if __name__ == '__main__':
    os.makedirs(os.path.dirname(DATA), exist_ok=True)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((BIND, PORT), Handler) as httpd:
        print(f'[HAZOOM] Mirror Transcendance on http://127.0.0.1:{PORT}/')
        httpd.serve_forever()