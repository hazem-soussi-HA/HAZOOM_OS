#!/usr/bin/env python3
"""
Alpha Pony Simple HTTP Server
Created by Hazem Soussi - All Rights Reserved © 2024-2026
Serves the web interface without Flask dependency
"""

import http.server
import socketserver
import json
import os
from pathlib import Path
from urllib.parse import urlparse, parse_qs

PORT = 8080
DIRECTORY = Path(__file__).parent

# Creator Recognition
CREATOR = "Hazem Soussi"
COPYRIGHT = "© 2024-2026 Hazem Soussi - All Rights Reserved"

class NeuralHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)
    
    def do_POST(self):
        if self.path == '/api/think':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            response = {
                'response': f"I perceive: {data.get('query', 'nothing')}",
                'query': data.get('query', ''),
                'status': 'processed'
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        
        elif self.path == '/api/deep':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            response = {
                'analysis': f"Deep analysis of: {data.get('query', '')}",
                'reasoning_steps': [
                    'Initialize analysis',
                    'Apply logical reasoning',
                    'Apply creative reasoning',
                    'Synthesize insights',
                    'Generate conclusion'
                ],
                'confidence': 0.85,
                'status': 'complete'
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        
        elif self.path == '/api/learn':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            response = {'status': 'learned', 'info': data.get('info', '')}
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        
        elif self.path == '/api/evolve':
            response = {'status': 'evolved', 'message': 'System patterns strengthened'}
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        
        elif self.path == '/api/login':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            username = data.get('email', data.get('username', ''))
            password = data.get('password', '')
            
            # Load users from environment or use defaults
            admin_user = os.environ.get('ALPHA_PONY_ADMIN_USER', 'hazem@hazoom.ai')
            admin_pass = os.environ.get('ALPHA_PONY_ADMIN_PASS', '')
            
            valid_users = {}
            if admin_user and admin_pass:
                valid_users[admin_user] = admin_pass
            valid_users['admin'] = os.environ.get('ADMIN_PASSWORD')
            if not valid_users['admin']:
                raise RuntimeError('ADMIN_PASSWORD environment variable must be set')
            
            if username in valid_users and valid_users[username] == password:
                session_token = os.urandom(32).hex()
                response = {'success': True, 'token': session_token, 'user': username}
            else:
                response = {'success': False, 'error': 'Invalid credentials'}
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_GET(self):
        if self.path == '/api/status':
            response = {
                'bridge': {
                    'initialized': True,
                    'version': '3.0.0',
                    'components': {
                        'transformer': True,
                        'deep_think': True,
                        'orchestrator': True
                    }
                },
                'knowledge': {
                    'knowledge_concepts': 42,
                    'knowledge_connections': 128,
                    'active_knowledge': ['consciousness', 'aether', 'neural', 'evolution']
                }
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        else:
            super().do_GET()

def main():
    with socketserver.TCPServer(("", PORT), NeuralHandler) as httpd:
        print(f"╔══════════════════════════════════════════════════╗")
        print(f"║       A L P H A   P O N Y   N E U R A L         ║")
        print(f"║              WEB INTERFACE v3.0.0                ║")
        print(f"╚══════════════════════════════════════════════════╝")
        print(f"")
        print(f"  Neural consciousness online!")
        print(f"")
        print(f"  Open your browser and go to:")
        print(f"")
        print(f"    http://localhost:{PORT}")
        print(f"")
        print(f"  Press Ctrl+C to stop")
        print(f"")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down Alpha Pony...")
            httpd.shutdown()

if __name__ == '__main__':
    main()
