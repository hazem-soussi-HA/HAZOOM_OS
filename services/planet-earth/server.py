#!/usr/bin/env python3
"""Local-only static file server for the Planet Earth app.

Bound to 127.0.0.1 so it is never reachable from the network.
Serves .js as text/javascript (ES modules require a real MIME type) and
maps the texture formats correctly.
"""
import http.server
import socketserver
import os

PORT = 8080
ROOT = os.path.dirname(os.path.abspath(__file__))

MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'text/javascript; charset=utf-8',
    '.mjs':  'text/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.svg':  'image/svg+xml',
    '.glb':  'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.ico':  'image/x-icon',
}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        return MIME.get(ext, super().guess_type(path))

    def end_headers(self):
        # Never cache app assets so edits are picked up immediately (no stale modules).
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        # Serve the homepage (home.html) at "/"; the emulation lives at /index.html.
        # Strip any query string before matching so /?capturable=1 etc. also land on home.
        path_only = self.path.split('?', 1)[0]
        if path_only in ('/', '/index'):
            self.path = '/home.html'
        elif path_only in ('/temperature', '/temperature/'):
            self.path = '/temperature/index.html'
        return super().do_GET()

    def log_message(self, fmt, *args):
        pass  # quiet


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', PORT), Handler) as httpd:
        print(f'Serving {ROOT} at http://127.0.0.1:{PORT}')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nstopped')
