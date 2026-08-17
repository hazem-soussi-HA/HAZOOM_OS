#!/usr/bin/env python3
"""HAZOOM OS — Ornith (offline chatbox, port 5055).

Fully offline rule-based chat companion. No internet, no API keys.
Answers from an embedded knowledge base with intent matching, and
degrades to a thoughtful fallback for anything unknown.
"""
import http.server
import json
import os
import re
import socketserver
import time

PORT = int(os.environ.get('PORT', 5055))
BIND = os.environ.get('BIND', '127.0.0.1')
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
    KNOWLEDGE = json.load(f)

TOPICS = [
    (r'how are you|how r u', 'I am chirping along nicely, thank you. How are you?'),
    (r'your name|who are you', "I am Ornith, the offline chat companion of HAZOOM OS. No clouds, no keys — just conversation."),
    (r'hello|hi|hey|salam', 'Hello! Ornith here. Ask me about birds, HAZOOM OS, or anything in my offline knowledge.'),
    (r'thanks|thank you', 'Always a pleasure. Come back anytime!'),
    (r'bye|goodbye|see you', 'Bye for now — the window is always open.'),
    (r'time', lambda: 'The time here is {0:%H:%M} local.'.format(time.localtime())),
    (r'date|day', lambda: 'Today is {0:%A, %d %B %Y}.'.format(time.localtime())),
    (r'help', 'Try asking me about birds, planets, HAZOOM OS architecture, the dev farm, or the GitHub bridge. I work fully offline.'),
    (r'who made you|created you|your creator', 'I was built as part of the HAZOOM OS ecosystem by Hazem Soussi.'),
]


def topic_answer(message):
    low = message.lower()
    for pattern, answer in TOPICS:
        if re.search(pattern, low):
            return answer() if callable(answer) else answer
    for entry in KNOWLEDGE:
        terms = entry['keywords']
        if any(t in low for t in terms):
            return entry['answer']
    return "I do not have that in my offline knowledge yet. Try asking about birds, planets, or HAZOOM OS."


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
        if path == '/api/health':
            return self._send(200, json.dumps({'status': 'ok', 'service': 'chatdev-ornith'}).encode(), 'application/json')
        if path == '/api/knowledge':
            return self._send(200, json.dumps({'count': len(KNOWLEDGE), 'topics': [k['title'] for k in KNOWLEDGE]}).encode(), 'application/json')
        self._serve_file(path)

    def do_POST(self):
        if self.path.split('?', 1)[0] != '/api/chat':
            return self._send(404, b'not found', 'text/plain')
        length = int(self.headers.get('Content-Length', 0))
        if length > 4096:
            return self._send(413, b'too large', 'text/plain')
        try:
            data = json.loads(self.rfile.read(length) or b'{}')
            message = str(data.get('message', '')).strip()[:500]
        except json.JSONDecodeError:
            message = ''
        if not message:
            return self._send(400, json.dumps({'error': 'empty message'}).encode(), 'application/json')
        reply = topic_answer(message)
        self._send(200, json.dumps({'reply': reply, 'offline': True}).encode(), 'application/json')


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((BIND, PORT), Handler) as httpd:
        print(f'[HAZOOM] Ornith chatbox on http://127.0.0.1:{PORT}/')
        httpd.serve_forever()