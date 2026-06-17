#!/usr/bin/env python3
"""
HAZOOM OS V3 — Unified API Gateway
Combines authentication, neural AI interface, and system endpoints
Integrates AlphaPony AI capabilities (OpenRouter, NeuralBridge, Knowledge System)
"""

import os
import sys
import json
import uuid
import time
import socketserver
from pathlib import Path
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

BASE_DIR = Path(__file__).parent.parent.parent
USERS_FILE = BASE_DIR / "config" / "hazoom-auth" / "users.json"

sys.path.insert(0, str(BASE_DIR / "services" / "ai"))
sys.path.insert(0, str(BASE_DIR / "services" / "reactive"))
sys.path.insert(0, str(BASE_DIR / "services"))

try:
    from neural_bridge import NeuralBridge
    NEURAL_AVAILABLE = True
except ImportError:
    NEURAL_AVAILABLE = False
    NeuralBridge = None

try:
    from openrouter import OpenRouterManager
    OPENROUTER_AVAILABLE = True
except ImportError:
    OPENROUTER_AVAILABLE = False
    OpenRouterManager = None

try:
    from knowledge_system import KnowledgeSystem
    KNOWLEDGE_AVAILABLE = True
except ImportError:
    KNOWLEDGE_AVAILABLE = False
    KnowledgeSystem = None

USERS_FILE.parent.mkdir(parents=True, exist_ok=True)

def load_users():
    if USERS_FILE.exists():
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {"users": [], "sessions": {}}

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

STARRED_APPS_FILE = BASE_DIR / "storage" / "starred_apps.json"
STARRED_APPS_FILE.parent.mkdir(parents=True, exist_ok=True)

def load_starred_apps():
    if STARRED_APPS_FILE.exists():
        with open(STARRED_APPS_FILE, 'r') as f:
            return json.load(f)
    return {"apps": {}}

def save_starred_apps(data):
    with open(STARRED_APPS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def get_featured_apps(limit=10):
    data = load_starred_apps()
    apps = []
    for app_id, app_data in data.get("apps", {}).items():
        if app_data.get("featured"):
            apps.append({"id": app_id, **app_data})
    return apps[:limit]

def get_top_rated_apps(category=None, limit=10):
    data = load_starred_apps()
    apps = []
    for app_id, app_data in data.get("apps", {}).items():
        if category and app_data.get("category") != category:
            continue
        if app_data.get("rating", 0) > 0:
            apps.append({"id": app_id, **app_data})
    apps.sort(key=lambda x: x.get("rating", 0), reverse=True)
    return apps[:limit]

def star_app(app_id, user_id, rating, review_text=""):
    data = load_starred_apps()
    if app_id not in data["apps"]:
        data["apps"][app_id] = {
            "id": app_id,
            "name": app_id,
            "rating": 0,
            "stars": 0,
            "reviews": [],
            "featured": False,
            "category": "general"
        }
    app = data["apps"][app_id]
    app["stars"] += 1
    total = app["rating"] * (app["stars"] - 1) + rating
    app["rating"] = total / app["stars"]
    app["reviews"].append({
        "user_id": user_id,
        "rating": rating,
        "review": review_text,
        "timestamp": datetime.now().isoformat()
    })
    save_starred_apps(data)
    return {"success": True, "app": {"id": app_id, "rating": app["rating"], "stars": app["stars"]}}

class UnifiedHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, neural_bridge=None, openrouter=None, knowledge=None, **kwargs):
        self.neural_bridge = neural_bridge
        self.openrouter = openrouter
        self.knowledge = knowledge
        super().__init__(*args, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode())

    def _get_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length else b'{}'
        try:
            return json.loads(post_data.decode('utf-8'))
        except json.JSONDecodeError:
            return {}

    def _get_session(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            return validate_session(auth_header[7:])
        return None

    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query = parse_qs(parsed_path.query)

        if path == '/api/status':
            self._send_json({
                "status": "ok",
                "version": "3.0.0",
                "service": "hazoom-os-unified",
                "timestamp": datetime.now().isoformat(),
                "components": {
                    "auth": "active",
                    "neural": "active" if self.neural_bridge else "inactive",
                    "openrouter": "active" if self.openrouter else "inactive",
                    "knowledge": "active" if self.knowledge else "inactive"
                }
            })

        elif path == '/api/mcp':
            self._send_json({"mcp": "hazoom-os", "status": "active"})

        elif path == '/api/auth/info':
            session = self._get_session()
            self._send_json({
                'authenticated': session is not None,
                'user': session if session else None
            })

        elif path == '/api/rooms' or path == '/api/rooms/list':
            self._send_json({
                "status": "success",
                "rooms": [
                    {"id": "room_1", "name": "General Meeting", "participants": 0},
                    {"id": "room_2", "name": "Project Review", "participants": 0},
                    {"id": "room_3", "name": "Team Standup", "participants": 0}
                ]
            })

        elif path == '/api/neural/status' and self.neural_bridge:
            self._send_json(self.neural_bridge.get_status())

        elif path == '/api/neural/context' and self.neural_bridge:
            self._send_json({"context": self.neural_bridge.get_context()})

        elif path == '/api/openrouter/status' and self.openrouter:
            self._send_json(self.openrouter.get_status())

        elif path == '/api/openrouter/models' and self.openrouter:
            self._send_json({"models": self.openrouter.get_models(), "free_models": self.openrouter.get_free_models()})

        elif path == '/api/knowledge/status' and self.knowledge:
            self._send_json(self.knowledge.get_system_status())

        elif path == '/api/apps/featured':
            limit = int(query.get('limit', ['10'])[0])
            self._send_json({"success": True, "apps": get_featured_apps(limit)})

        elif path == '/api/apps/top-rated':
            limit = int(query.get('limit', ['10'])[0])
            category = query.get('category', [None])[0]
            self._send_json({"success": True, "apps": get_top_rated_apps(category, limit)})

        elif path == '/api/apps/categories':
            data = load_starred_apps()
            categories = list(set(app.get("category", "general") for app in data.get("apps", {}).values()))
            self._send_json({"success": True, "categories": categories})

        elif path.startswith('/api/apps/') and '/star' not in path:
            app_id = path.split('/')[-1]
            data = load_starred_apps()
            app = data.get("apps", {}).get(app_id)
            if app:
                self._send_json({"success": True, "app": {"id": app_id, **app}})
            else:
                self._send_json({"success": False, "error": "App not found"}, 404)

        elif path == '/api/unified/status':
            self._send_json({
                "success": True,
                "services": {
                    "Unified API Gateway": {"status": "RUNNING", "port": 8080},
                    "Neural Bridge": {"status": "RUNNING" if self.neural_bridge else "STOPPED"},
                    "OpenRouter": {"status": "RUNNING" if self.openrouter else "STOPPED"},
                    "Knowledge System": {"status": "RUNNING" if self.knowledge else "STOPPED"},
                },
                "system": {"name": "HAZOOM OS", "version": "3.0.0"},
                "timestamp": time.time()
            })

        elif path == '/api/admin/users':
            session = self._get_session()
            if not session or session.get('role') != 'admin':
                self._send_json({"error": "Admin access required"}, 403)
                return
            data = load_users()
            users_list = [{"id": u['id'], "username": u['username'], "role": u['role'], "level": u['level']} for u in data['users']]
            self._send_json({"status": "success", "users": users_list})

        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        data = self._get_body()

        if path == '/api/auth/login':
            self._handle_login(data)
        elif path == '/api/auth/register':
            self._handle_register(data)
        elif path == '/api/auth/logout':
            self._handle_logout(data)
        elif path == '/api/rooms/create':
            self._send_json({"status": "success", "room": {"id": "room_" + str(uuid.uuid4())[:8]}})
        elif path == '/api/schedule/create':
            self._send_json({"status": "success"})

        elif path == '/api/neural/think' and self.neural_bridge:
            session = self._get_session()
            if not session:
                self._send_json({"error": "Authentication required"}, 401)
                return
            query = data.get('query', '')
            if not query:
                self._send_json({"error": "Query required"}, 400)
                return
            try:
                result = self.neural_bridge.think(query)
                self._send_json(result)
            except Exception as e:
                self._send_json({"error": f"Thinking failed: {str(e)}"}, 500)

        elif path == '/api/neural/analyze' and self.neural_bridge:
            session = self._get_session()
            if not session:
                self._send_json({"error": "Authentication required"}, 401)
                return
            query = data.get('query', '')
            if not query:
                self._send_json({"error": "Query required"}, 400)
                return
            try:
                result = self.neural_bridge.deep_analyze(query)
                self._send_json(result)
            except Exception as e:
                self._send_json({"error": f"Analysis failed: {str(e)}"}, 500)

        elif path == '/api/neural/orchestrate' and self.neural_bridge:
            session = self._get_session()
            if not session:
                self._send_json({"error": "Authentication required"}, 401)
                return
            task = data.get('task', '')
            if not task:
                self._send_json({"error": "Task required"}, 400)
                return
            try:
                result = self.neural_bridge.orchestrate(task)
                self._send_json(result)
            except Exception as e:
                self._send_json({"error": f"Orchestration failed: {str(e)}"}, 500)

        elif path == '/api/neural/learn' and self.knowledge:
            session = self._get_session()
            if not session:
                self._send_json({"error": "Authentication required"}, 401)
                return
            info = data.get('info', '')
            if not info:
                self._send_json({"error": "Information required"}, 400)
                return
            try:
                self.knowledge.learn(info)
                self._send_json({"success": True, "learned": len(info)})
            except Exception as e:
                self._send_json({"error": f"Learning failed: {str(e)}"}, 500)

        elif path == '/api/neural/clear' and self.neural_bridge:
            session = self._get_session()
            if not session:
                self._send_json({"error": "Authentication required"}, 401)
                return
            result = self.neural_bridge.clear_context()
            self._send_json(result)

        elif path == '/api/neural/save' and self.neural_bridge:
            session = self._get_session()
            if not session:
                self._send_json({"error": "Authentication required"}, 401)
                return
            result = self.neural_bridge.save_state()
            self._send_json(result)

        elif path == '/api/agent/code' and self.neural_bridge:
            session = self._get_session()
            if not session:
                self._send_json({"error": "Authentication required"}, 401)
                return
            query = data.get('query', '')
            if not query:
                self._send_json({"error": "Query required"}, 400)
                return
            try:
                system_prompt = """You are a Vibe-Coding Agent powered by HAZOOM OS.
You are an expert software engineer. When given a task, think step-by-step,
write clean code, and explain your reasoning. Use modern best practices."""
                result = self.neural_bridge.think(query=query, system_prompt=system_prompt)
                self._send_json(result)
            except Exception as e:
                self._send_json({"error": f"Agent error: {str(e)}"}, 500)

        elif path == '/api/openrouter/chat' and self.openrouter:
            session = self._get_session()
            if not session:
                self._send_json({"error": "Authentication required"}, 401)
                return
            messages = data.get('messages', [])
            if not messages:
                self._send_json({"error": "Messages required"}, 400)
                return
            try:
                import asyncio
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    loop = None
                if loop and loop.is_running():
                    # We're in an async context, can't use run_until_complete
                    self._send_json({"error": "Async context conflict", "code": "ASYNC_ERROR"}, 500)
                    return
                result = asyncio.get_event_loop().run_until_complete(self.openrouter.chat(messages))
                self._send_json(result)
            except Exception as e:
                self._send_json({"error": f"Chat failed: {str(e)}", "code": "CHAT_ERROR"}, 500)

        elif path == '/api/openrouter/set-key' and self.openrouter:
            session = self._get_session()
            if not session:
                self._send_json({"error": "Authentication required"}, 401)
                return
            key = data.get('key', '')
            if not key:
                self._send_json({"error": "API key required"}, 400)
                return
            self.openrouter.set_api_key(key)
            self._send_json({"success": True})

        elif path == '/api/openrouter/set-model' and self.openrouter:
            session = self._get_session()
            if not session:
                self._send_json({"error": "Authentication required"}, 401)
                return
            model = data.get('model', '')
            if not model:
                self._send_json({"error": "Model required"}, 400)
                return
            if self.openrouter.set_model(model):
                self._send_json({"success": True, "model": model})
            else:
                self._send_json({"error": "Unknown model"}, 400)

        elif path.startswith('/api/apps/') and path.endswith('/star'):
            app_id = path.split('/')[-2]
            try:
                user_id = data.get('user_id', 'anonymous')
                rating = float(data.get('rating', 0))
                review_text = data.get('review_text', '')
                if not (1.0 <= rating <= 5.0):
                    self._send_json({"success": False, "error": "Rating must be between 1.0 and 5.0"}, 400)
                    return
                result = star_app(app_id, user_id, rating, review_text)
                self._send_json(result)
            except ValueError:
                self._send_json({"success": False, "error": "Invalid rating value"}, 400)

        else:
            self._send_json({"error": "Not found"}, 404)

    def _handle_login(self, data):
        username = data.get('username', '')
        password = data.get('password', '')
        data_users = load_users()
        for user in data_users['users']:
            if user['username'] == username and user['password'] == password:
                token = create_session(user['id'])
                self._send_json({
                    "status": "success",
                    "user": {
                        "id": user['id'],
                        "username": user['username'],
                        "display_name": user.get('display_name', username),
                        "role": user['role'],
                        "level": user['level']
                    },
                    "token": token
                })
                return
        self._send_json({"status": "error", "message": "Invalid credentials"}, 401)

    def _handle_register(self, data):
        username = data.get('username', '')
        password = data.get('password', '')
        email = data.get('email', '')
        if not username or not password:
            self._send_json({"status": "error", "message": "Username and password required"}, 400)
            return
        data_users = load_users()
        for user in data_users['users']:
            if user['username'] == username:
                self._send_json({"status": "error", "message": "Username exists"}, 409)
                return
        new_id = str(max([int(u['id']) for u in data_users['users']] + [0]) + 1)
        new_user = {
            "id": new_id,
            "username": username,
            "password": password,
            "email": email,
            "role": "user",
            "level": 1,
            "display_name": username
        }
        data_users['users'].append(new_user)
        save_users(data_users)
        token = create_session(new_id)
        self._send_json({
            "status": "success",
            "user": {"id": new_id, "username": username, "display_name": username, "role": "user", "level": 1},
            "token": token
        })

    def _handle_logout(self, data):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            data_users = load_users()
            if token in data_users['sessions']:
                del data_users['sessions'][token]
                save_users(data_users)
                self._send_json({"success": True})
            else:
                self._send_json({"success": False, "error": "No session found"})
        else:
            self._send_json({"success": False, "error": "No token provided"})

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

class UnifiedServer:
    def __init__(self, host='0.0.0.0', port=8080):
        self.host = host
        self.port = port
        self.neural_bridge = None
        self.openrouter = None
        self.knowledge = None
        self.server = None
        self._init_components()

    def _init_components(self):
        if NEURAL_AVAILABLE:
            try:
                self.neural_bridge = NeuralBridge()
                self.neural_bridge.initialize()
                print("[Unified] Neural Bridge initialized")
            except Exception as e:
                print(f"[Unified] Neural Bridge init failed: {e}")

        if OPENROUTER_AVAILABLE:
            try:
                self.openrouter = OpenRouterManager()
                print("[Unified] OpenRouter Manager initialized")
            except Exception as e:
                print(f"[Unified] OpenRouter init failed: {e}")

        if KNOWLEDGE_AVAILABLE:
            try:
                self.knowledge = KnowledgeSystem()
                self.knowledge.load()
                print("[Unified] Knowledge System initialized")
            except Exception as e:
                print(f"[Unified] Knowledge System init failed: {e}")

    def create_handler(self):
        def handler(*args, **kwargs):
            return UnifiedHandler(
                *args,
                neural_bridge=self.neural_bridge,
                openrouter=self.openrouter,
                knowledge=self.knowledge,
                **kwargs
            )
        return handler

    def start(self):
        handler_class = self.create_handler()
        self.server = ReusableTCPServer((self.host, self.port), handler_class)
        print(f"""
======================================================================
  HAZOOM OS V3 — Unified API Gateway
======================================================================
  API:          http://127.0.0.1:{self.port}
  Neural:       {'active' if self.neural_bridge else 'inactive'}
  OpenRouter:   {'active' if self.openrouter else 'inactive'}
  Knowledge:    {'active' if self.knowledge else 'inactive'}
======================================================================
""")
        try:
            self.server.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down Unified API Gateway...")
            self.server.shutdown()

if __name__ == "__main__":
    server = UnifiedServer()
    server.start()
