#!/usr/bin/env python3
"""HAZOOM OS — DESCER Drum Machine (local-only, port 6000).

Serves the drum machine UI. All drum sounds are synthesized in the
browser with Web Audio — no audio files shipped.
"""
import http.server
import json
import os
import socketserver

PORT = int(os.environ.get('PORT', 6000))
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

PADS = ['kick', 'snare', 'clap', 'closed-hat', 'open-hat', 'tom-low', 'tom-mid', 'cowbell']


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, fmt, *args):
        pass

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        return MIME.get(ext, super().guess_type(path))

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        path = self.path.split('?', 1)[0]
        if path == '/api/sounds':
            body = json.dumps({'pads': PADS}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if path == '/api/health':
            body = json.dumps({'status': 'ok', 'service': 'descer'}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((BIND, PORT), Handler) as httpd:
        print(f'[HAZOOM] DESCER drum machine on http://127.0.0.1:{PORT}/')
        httpd.serve_forever()