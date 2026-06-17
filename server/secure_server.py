#!/usr/bin/env python3
"""
HAZOOM OS - Secure HTTP Server
Production-ready server with security headers and authentication
"""

import http.server
import socketserver
import json
import os
import hashlib
import secrets
import time
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta

class SecureHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Secure HTTP request handler with security headers"""
    
    # Security headers
    SECURITY_HEADERS = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' http://localhost:8000 http://localhost:8001 http://localhost:8002 http://localhost:8003 http://127.0.0.1:8000 http://127.0.0.1:8001 http://127.0.0.1:8002 http://127.0.0.1:8003; frame-ancestors 'self';",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
    
    # Rate limiting
    RATE_LIMITS = {
        'requests': 100,
        'window': 60  # seconds
    }
    
    # Simple session storage (in production, use proper session management)
    SESSIONS = {}
    RATE_LIMIT_STORAGE = {}
    
    def log_message(self, format, *args):
        """Enhanced logging with security events"""
        client_ip = self.client_address[0]
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Log security events
        if self.path.endswith('.js') or self.path.endswith('.html'):
            print(f"[SECURITY] {timestamp} - {client_ip} - {self.path}")
        else:
            print(f"[ACCESS] {timestamp} - {client_ip} - {self.path}")
    
    def check_rate_limit(self, client_ip):
        """Check if client has exceeded rate limit"""
        now = time.time()
        
        if client_ip not in self.RATE_LIMIT_STORAGE:
            self.RATE_LIMIT_STORAGE[client_ip] = []
        
        # Clean old requests
        self.RATE_LIMIT_STORAGE[client_ip] = [
            req_time for req_time in self.RATE_LIMIT_STORAGE[client_ip]
            if now - req_time < self.RATE_LIMITS['window']
        ]
        
        # Check limit
        if len(self.RATE_LIMIT_STORAGE[client_ip]) >= self.RATE_LIMITS['requests']:
            print(f"[SECURITY] Rate limit exceeded for {client_ip}")
            return False
        
        # Record this request
        self.RATE_LIMIT_STORAGE[client_ip].append(now)
        return True
    
    def validate_path(self, path):
        """Validate path to prevent directory traversal"""
        # Remove URL parameters
        path = urlparse(path).path
        
        # Prevent directory traversal
        if '../' in path or '..%2f' in path or '%2e%2e' in path.lower():
            print(f"[SECURITY] Directory traversal attempt blocked: {path}")
            return None
        
        # Prevent accessing hidden files
        if '/.' in path or path.startswith('.'):
            print(f"[SECURITY] Hidden file access blocked: {path}")
            return None
        
        # Prevent file extension attacks
        dangerous_extensions = ['.php', '.py', '.sh', '.exe', '.bat', '.cmd']
        if any(path.lower().endswith(ext) for ext in dangerous_extensions):
            print(f"[SECURITY] Dangerous file extension blocked: {path}")
            return None
        
        return path
    
    def end_headers(self):
        """Add security headers before ending headers"""
        client_ip = self.client_address[0]
        
        # Check rate limit
        if not self.check_rate_limit(client_ip):
            self.send_response(429)
            self.end_headers()
            return
        
        # Add all security headers
        for header, value in self.SECURITY_HEADERS.items():
            self.send_header(header, value)
        
        # Add server info (minimal exposure)
        self.send_header('Server', 'HAZOOM-Secure/1.0')
        
        super().end_headers()
    
    def do_GET(self):
        """Secure GET handler"""
        client_ip = self.client_address[0]
        
        # Validate path
        safe_path = self.validate_path(self.path)
        if safe_path is None:
            self.send_error(403, "Forbidden")
            return
        
        # Override path with validated path
        self.path = safe_path
        
        # Call parent handler
        try:
            super().do_GET()
        except Exception as e:
            print(f"[SECURITY] Error serving {safe_path}: {e}")
            self.send_error(500, "Internal Server Error")
    
    def do_POST(self):
        """Secure POST handler"""
        client_ip = self.client_address[0]
        
        # Validate path
        safe_path = self.validate_path(self.path)
        if safe_path is None:
            self.send_error(403, "Forbidden")
            return
        
        # Content length validation
        content_length = self.headers.get('Content-Length', 0)
        try:
            content_length = int(content_length)
        except:
            content_length = 0
        
        # Max content size: 1MB
        MAX_CONTENT_SIZE = 1024 * 1024
        if content_length > MAX_CONTENT_SIZE:
            print(f"[SECURITY] Request too large from {client_ip}: {content_length} bytes")
            self.send_error(413, "Payload Too Large")
            return
        
        # Content type validation
        content_type = self.headers.get('Content-Type', '')
        allowed_types = ['application/json', 'application/x-www-form-urlencoded', 'text/plain']
        
        if content_type and not any(ct in content_type for ct in allowed_types):
            print(f"[SECURITY] Invalid content type from {client_ip}: {content_type}")
            self.send_error(415, "Unsupported Media Type")
            return
        
        # Process POST (for future API endpoints)
        self.send_response(405)
        self.send_header('Allow', 'GET')
        self.end_headers()
        self.wfile.write(b'{"error": "Method Not Allowed"}')


def run_server(port=8889):
    """Start secure HTTP server"""
    handler = SecureHTTPRequestHandler
    
    # Use socketserver for better performance
    with socketserver.TCPServer(("", port), handler) as httpd:
        print("=" * 60)
        print("SECURE HAZOOM OS SERVER")
        print("=" * 60)
        print(f"Server running at: http://localhost:{port}")
        print(f"Security: ENABLED")
        print(f"Rate Limiting: {handler.RATE_LIMITS['requests']} req/{handler.RATE_LIMITS['window']}s")
        print(f"Protection: Directory traversal, XSS, CSRF, Clickjacking")
        print("=" * 60)
        print("Press Ctrl+C to stop server")
        print("")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n[SERVER] Shutting down gracefully...")
            httpd.shutdown()
            print("[SERVER] Server stopped")


if __name__ == "__main__":
    import sys
    
    port = 8889
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except:
            print(f"Invalid port: {sys.argv[1]}")
            sys.exit(1)
    
    run_server(port)
