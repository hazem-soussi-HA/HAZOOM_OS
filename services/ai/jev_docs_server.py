#!/usr/bin/env python3
"""Minimal static docs server for dashboard display."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class DocsHandler(BaseHTTPRequestHandler):
    server_version = "JevDocs/1.0"
    
    def log_message(self, *a):
        pass

    def do_GET(self):
        html = """<!DOCTYPE html>
<html><head><title>Jev 1.13 Docs</title></head>
<body>
<h1>Jev 1.13 Documentation</h1>
<p>System One decision model by TypeSafe AI.</p>
<h2>API Endpoints</h2>
<ul>
<li>POST /v1/systemone - Main decision endpoint</li>
<li>GET /api/status - Server status</li>
</ul>
<h2>Question Types</h2>
<ul>
<li><b>Choice</b> - Pick one from a list</li>
<li><b>Score</b> - Rate on a scale</li>
<li><b>Noul</b> - Yes/No probability</li>
</ul>
</body></html>"""
        data = html.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

if __name__ == "__main__":
    srv = ThreadingHTTPServer(("127.0.0.1", 8322), DocsHandler)
    print("Jev docs server on http://127.0.0.1:8322")
    srv.serve_forever()
