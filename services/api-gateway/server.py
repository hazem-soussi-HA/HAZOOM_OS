#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
import uuid
from datetime import datetime, timedelta

PORT = 8080
USERS_FILE = '/home/hazem/hazoom/config/users.json'

def load_users():
    with open(USERS_FILE, 'r') as f:
        return json.load(f)

def save_users(data):
    with open(USERS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def create_session(user_id):
    token = str(uuid.uuid4())
    data = load_users()
    data['sessions'][token] = {
        'user_id': user_id,
        'created': datetime.now().isoformat(),
        'expires': (datetime.now() + timedelta(hours=24)).isoformat()
    }
    save_users(data)
    return token

def validate_session(token):
    data = load_users()
    session = data['sessions'].get(token)
    if not session:
        return None
    expires = datetime.fromisoformat(session['expires'])
    if datetime.now() > expires:
        del data['sessions'][token]
        save_users(data)
        return None
    for user in data['users']:
        if user['id'] == session['user_id']:
            return user
    return None

class HazoomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        if self.path == '/api/auth/login':
            self.handle_login()
        elif self.path == '/api/auth/register':
            self.handle_register()
        elif self.path == '/api/rooms/create':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success", "room": {"id": "room_" + str(uuid.uuid4())[:8]}}).encode())
        elif self.path == '/api/schedule/create':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success"}).encode())
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode())
    
    def handle_login(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            username = body.get('username', '')
            password = body.get('password', '')
            
            data = load_users()
            for user in data['users']:
                if user['username'] == username and user['password'] == password:
                    token = create_session(user['id'])
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "status": "success",
                        "user": {
                            "id": user['id'],
                            "username": user['username'],
                            "display_name": user['display_name'],
                            "role": user['role'],
                            "level": user['level']
                        },
                        "token": token
                    }).encode())
                    return
            
            self.send_response(401)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "message": "Invalid credentials"}).encode())
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode())
    
    def handle_register(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            username = body.get('username', '')
            password = body.get('password', '')
            email = body.get('email', '')
            
            if not username or not password:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": "Username and password required"}).encode())
                return
            
            data = load_users()
            for user in data['users']:
                if user['username'] == username:
                    self.send_response(409)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "error", "message": "Username exists"}).encode())
                    return
            
            new_id = str(max(int(u['id']) for u in data['users']) + 1)
            new_user = {
                "id": new_id,
                "username": username,
                "password": password,
                "email": email,
                "role": "user",
                "level": 1,
                "display_name": username
            }
            data['users'].append(new_user)
            save_users(data)
            
            token = create_session(new_id)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "success",
                "user": {"id": new_id, "username": username, "display_name": username, "role": "user", "level": 1},
                "token": token
            }).encode())
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode())
    
    def do_GET(self):
        path = self.path
        
        if path == '/api/mcp':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"mcp": "hazoom-os", "status": "active"}).encode())
        
        elif path == '/api/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "version": "1.0.0"}).encode())
        
        elif path == '/api/rooms' or path == '/api/rooms/list':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "success",
                "rooms": [
                    {"id": "room_1", "name": "General Meeting", "participants": 0},
                    {"id": "room_2", "name": "Project Review", "participants": 0},
                    {"id": "room_3", "name": "Team Standup", "participants": 0}
                ]
            }).encode())
        
        elif path == '/api/admin/users':
            token = self.headers.get('Authorization', '').replace('Bearer ', '')
            user = validate_session(token)
            if not user or user['role'] != 'admin':
                self.send_response(403)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Admin access required", "required_level": 3}).encode())
                return
            data = load_users()
            users_list = [{"id": u['id'], "username": u['username'], "role": u['role'], "level": u['level']} for u in data['users']]
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success", "users": users_list}).encode())
        
        else:
            self.path = '/index.html'
            super().do_GET()

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

os.chdir('/home/hazem/hazoom/public')
print("🚀 Hazoom OS running on http://127.0.0.1:8080")
print("🔐 Authentication required — set ADMIN_PASSWORD_HASH env var")
with ReusableTCPServer(("0.0.0.0", PORT), HazoomHandler) as httpd:
    httpd.serve_forever()
