#!/usr/bin/env python3
# Local, dependency-free static server for the Birds of Africa 3D Atlas.
# Serves ONLY files from this directory. No network egress — fully air-gapped at runtime.
import http.server, socketserver, os, sys

PORT = int(os.environ.get("PORT", "8080"))
ROOT = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a):
        pass  # quiet

# Force correct MIME for ES modules (some setups mis-serve .js)
class StrictMime(Handler):
    extensions_map = {
        **Handler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".json": "application/json",
        ".glb": "model/gltf-binary",
        ".gltf": "model/gltf+json",
    }

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), StrictMime) as httpd:
        print(f"Birds of Africa 3D Atlas → http://127.0.0.1:{PORT}")
        print("LOCAL ONLY · no external network used at runtime.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
