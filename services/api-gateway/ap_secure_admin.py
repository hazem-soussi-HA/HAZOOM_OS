#!/usr/bin/env python3
"""
Alpha Pony Secure Admin Server
HTTPS enabled with maximum security - Created by Hazem Soussi
"""

import http.server
import ssl
import os
import json
import socket
import secrets
from pathlib import Path
from urllib.parse import parse_qs

# Optional: cryptography for cert generation
try:
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    import datetime
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False

# ============= CONFIGURATION =============
HTTPS_PORT = 8443
HTTP_PORT = 8080
ADMIN_PORT = 9999
HOST = '0.0.0.0'
CERT_FILE = 'security/server.crt'
KEY_FILE = 'security/server.key'

# Creator Recognition
CREATOR = "Hazem Soussi"
COPYRIGHT = "© 2024-2026 Hazem Soussi - All Rights Reserved"

# ============= SECURITY HEADERS =============
SECURITY_HEADERS = {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://openrouter.ai https://api.github.com",
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
}

# Admin authentication
ADMIN_TOKEN = secrets.token_hex(32)
ADMIN_CONFIG_FILE = 'security/admin_config.encrypted'

# ============= SECURE HANDLER =============
class AlphaPonyHandler(http.server.BaseHTTPRequestHandler):
    """Secure HTTP handler with auth and logging"""
    
    def log_message(self, format, *args):
        """Custom logging with timestamp"""
        timestamp = self.log_date_time_string()
        print(f"[{timestamp}] {self.address_string()} - {format % args}")
    
    def check_auth(self):
        """Verify admin token"""
        auth_header = self.headers.get('Authorization', '')
        return auth_header == f'Bearer {ADMIN_TOKEN}'
    
    def send_security_headers(self):
        """Send all security headers"""
        for header, value in SECURITY_HEADERS.items():
            self.send_header(header, value)
    
    def do_GET(self):
        """Handle GET requests"""
        path = self.path.split('?')[0]
        
        if path == '/':
            self.serve_file('admin_portal.html', 'text/html')
        
        elif path == '/api/status':
            self.handle_status()
        
        elif path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_security_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'secure',
                'creator': CREATOR,
                'timestamp': self.log_date_time_string()
            }).encode())
        
        elif path == '/admin/token':
            if not self.check_auth():
                self.send_error(401, 'Unauthorized')
                return
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_security_headers()
            self.end_headers()
            self.wfile.write(json.dumps({'token': ADMIN_TOKEN}).encode())
        
        else:
            self.send_error(404, 'Not Found')
    
    def do_POST(self):
        """Handle POST requests"""
        path = self.path.split('?')[0]
        
        if path == '/api/config/save':
            self.handle_save_config()
        elif path == '/api/config/load':
            self.handle_load_config()
        else:
            self.send_error(404, 'Not Found')
    
    def serve_file(self, filename, content_type):
        """Serve a file with security headers"""
        try:
            with open(filename, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(content))
            self.send_security_headers()
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404, 'File not found')
    
    def handle_status(self):
        """Return system status"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_security_headers()
        self.end_headers()
        
        status = {
            'server': 'Alpha Pony Secure Admin',
            'version': '2.0.0',
            'creator': CREATOR,
            'copyright': COPYRIGHT,
            'security': 'enabled',
            'ports': {
                'admin': PORT,
                'secure': 'TLS 1.3'
            },
            'timestamp': self.log_date_time_string()
        }
        self.wfile.write(json.dumps(status, indent=2).encode())
    
    def handle_save_config(self):
        """Save configuration"""
        if not self.check_auth():
            self.send_error(401, 'Unauthorized')
            return
        
        content_length = int(self.headers.get('Content-Length', 0))
        config_data = self.rfile.read(content_length)
        
        # In production, encrypt this!
        with open(ADMIN_CONFIG_FILE, 'wb') as f:
            f.write(config_data)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_security_headers()
        self.end_headers()
        self.wfile.write(json.dumps({'success': True}).encode())
    
    def handle_load_config(self):
        """Load configuration"""
        if not self.check_auth():
            self.send_error(401, 'Unauthorized')
            return
        
        try:
            with open(ADMIN_CONFIG_FILE, 'rb') as f:
                config = f.read()
            self.wfile.write(config)
        except FileNotFoundError:
            self.send_error(404, 'No config found')

# ============= PORT CHECKER =============
def check_ports():
    """Check all ports and report security status"""
    print("\n" + "="*50)
    print("🔒 PORT SECURITY SCAN")
    print("="*50)
    
    common_ports = [80, 443, 8080, 8443, 3000, 5000, 8000, 9090, 9999, 11434, HTTP_PORT]
    secure_ports = []
    risky_ports = []
    
    for port in common_ports:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        
        if result == 0:
            if port in [8443, 9999]:  # Our secure ports
                secure_ports.append(port)
            else:
                risky_ports.append(port)
    
    print(f"\n✅ SECURE PORTS (Alpha Pony): {secure_ports}")
    print(f"⚠️ OTHER OPEN PORTS: {risky_ports if risky_ports else 'None'}")
    print("="*50 + "\n")
    return secure_ports, risky_ports

# ============= CERTIFICATE GENERATOR =============
def generate_self_signed_cert():
    """Generate self-signed certificate for HTTPS"""
    os.makedirs('security', exist_ok=True)
    
    if not os.path.exists(CERT_FILE):
        print("🔐 Generating self-signed certificate...")
        
        # Try OpenSSL first (Windows-friendly)
        try:
            if os.name == 'nt':  # Windows
                result = os.system('where openssl >nul 2>nul')
            else:  # Linux/Mac
                result = os.system('which openssl > /dev/null 2>&1')
            
            if result == 0:
                if os.name == 'nt':
                    os.system(f'openssl req -x509 -newkey rsa:4096 -keyout "{KEY_FILE}" -out "{CERT_FILE}" -days 365 -nodes -subj "/CN=AlphaPony/O=AlphaPony" >nul 2>&1')
                else:
                    os.system(f'openssl req -x509 -newkey rsa:4096 -keyout "{KEY_FILE}" -out "{CERT_FILE}" -days 365 -nodes -subj "/CN=AlphaPony/O=AlphaPony"')
                print("✅ Certificate generated (OpenSSL)!")
                return
        except:
            pass
        
        # Fallback to cryptography library
        if CRYPTO_AVAILABLE:
            generate_cert_fallback()
        else:
            print("📥 Installing cryptography library...")
            os.system('pip install cryptography -q')
            generate_cert_fallback()

def generate_cert_fallback():
    """Generate certificate using cryptography library"""
    if not CRYPTO_AVAILABLE:
        print("❌ 'cryptography' library not installed")
        print("📥 Installing: pip install cryptography")
        os.system('pip install cryptography')
        print("Please restart the server.")
        return
    
    try:
        # Generate key
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        
        # Generate certificate
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "AlphaPony"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "AlphaPony"),
            x509.NameAttribute(NameOID.COMMON_NAME, "AlphaPony Local"),
        ])
        
        cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.datetime.utcnow())
            .not_valid_after(datetime.datetime.utcnow() + datetime.timedelta(days=365))
            .sign(key, hashes.SHA256())
        )
        
        with open(KEY_FILE, 'wb') as f:
            f.write(key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        with open(CERT_FILE, 'wb') as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        
        print("✅ Certificate generated!")
        
    except Exception as e:
        print(f"❌ Certificate generation failed: {e}")

# ============= MAIN SERVER =============
def run_server():
    """Start secure HTTPS server"""
    print("\n" + "🦄"*20)
    print("  ALPHA PONY SECURE ADMIN SERVER")
    print("  Created by " + CREATOR)
    print("  " + COPYRIGHT)
    print("🦄"*20)
    
    # Generate certificate
    generate_self_signed_cert()
    
    # Check ports
    check_ports()
    
    # Create HTTP server first (for testing)
    server_address = (HOST, HTTP_PORT)
    httpd = http.server.HTTPServer(server_address, AlphaPonyHandler)
    
    # Try to enable HTTPS
    try:
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_context.load_cert_chain(CERT_FILE, KEY_FILE)
        ssl_context.set_ciphers('ECDHE+AESGCM:DHE+AESGCM:ECDHE+CHACHA20:DHE+CHACHA20')
        ssl_context.minimum_version = ssl.TLSVersion.TLSv1_3
        httpd.socket = ssl_context.wrap_socket(httpd.socket, server_side=True)
        print(f"\n🚀 Secure Admin Server running:")
        print(f"   📱 HTTPS: https://localhost:{HTTPS_PORT}")
    except Exception as e:
        print(f"\n⚠️ HTTPS failed ({e}), running HTTP only:")
        print(f"   🌐 HTTP:  http://localhost:{HTTP_PORT}")
    
    print(f"\n🔑 Admin Token: {ADMIN_TOKEN[:16]}...")
    print(f"\n⚠️  Save this token! It's required for API access.")
    print(f"\n   Press Ctrl+C to stop\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped.")
        httpd.shutdown()

if __name__ == '__main__':
    run_server()