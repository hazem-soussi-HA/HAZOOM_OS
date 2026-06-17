#!/usr/bin/env python3
"""
Pascal Module - Network Navigator & System Guardian
Handles secure ports, wall navigation, cleaning, restoration, and app launching
"""

import socket
import subprocess
import os
import json
import shutil
from pathlib import Path
from datetime import datetime

class Pascal:
    def __init__(self):
        self.name = "Pascal"
        self.role = "Network Navigator & System Guardian"
        self.secure_ports = {}
        self.tunnels = {}
        self.backups = []
        
    def status(self):
        return {
            "name": self.name,
            "role": self.role,
            "status": "ready",
            "secure_ports": list(self.secure_ports.keys()),
            "active_tunnels": len(self.tunnels),
            "backups_count": len(self.backups)
        }
    
    # SECURE PORT MANAGEMENT
    def create_secure_port(self, port, app_name):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            
            if result == 0:
                return {"status": "error", "message": f"Port {port} is already in use"}
            
            self.secure_ports[port] = {
                "app": app_name,
                "created": datetime.now().isoformat(),
                "secure": True
            }
            return {"status": "success", "port": port, "app": app_name}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def get_available_port(self, start=5000, end=9000):
        for port in range(start, end):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                result = sock.connect_ex(('localhost', port))
                sock.close()
                if result != 0:
                    return port
            except:
                continue
        return None
    
    def list_ports(self):
        return self.secure_ports
    
    # WALL NAVIGATION (SSH TUNNEL STYLE)
    def create_tunnel(self, local_port, remote_host, remote_port):
        tunnel_id = f"tunnel_{local_port}"
        self.tunnels[tunnel_id] = {
            "local": local_port,
            "remote_host": remote_host,
            "remote_port": remote_port,
            "status": "active"
        }
        return {"status": "created", "tunnel_id": tunnel_id}
    
    def close_tunnel(self, tunnel_id):
        if tunnel_id in self.tunnels:
            del self.tunnels[tunnel_id]
            return {"status": "closed", "tunnel_id": tunnel_id}
        return {"status": "not_found"}
    
    # SYSTEM CLEANING
    def scan_temp_files(self):
        temp_paths = [
            os.environ.get('TEMP', '/tmp'),
            '/tmp',
            '/var/tmp'
        ]
        total_size = 0
        files = []
        
        for path in temp_paths:
            if os.path.exists(path):
                for root, dirs, filenames in os.walk(path):
                    for f in filenames:
                        fp = os.path.join(root, f)
                        try:
                            size = os.path.getsize(fp)
                            total_size += size
                            files.append({"path": fp, "size": size})
                        except:
                            pass
        
        return {"files": len(files), "total_size": total_size, "files_list": files[:20]}
    
    def clean_temp(self):
        temp_paths = [
            os.environ.get('TEMP', '/tmp'),
            '/tmp',
            '/var/tmp'
        ]
        cleaned = 0
        freed = 0
        
        for path in temp_paths:
            if os.path.exists(path):
                for root, dirs, filenames in os.walk(path):
                    for f in filenames:
                        fp = os.path.join(root, f)
                        try:
                            age = os.path.getatime(fp)
                            if datetime.now().timestamp() - age > 86400:
                                size = os.path.getsize(fp)
                                os.remove(fp)
                                cleaned += 1
                                freed += size
                        except:
                            pass
        
        return {"cleaned_files": cleaned, "freed_bytes": freed}
    
    # SYSTEM RESTORATION
    def create_backup(self, path, backup_name=None):
        if backup_name is None:
            backup_name = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        backup_dir = Path.home() / ".alphapony" / "backups"
        backup_dir.mkdir(parents=True, exist_ok=True)
        
        backup_path = backup_dir / backup_name
        
        try:
            if os.path.isfile(path):
                shutil.copy2(path, backup_path)
            elif os.path.isdir(path):
                shutil.copytree(path, backup_path, dirs_exist_ok=True)
            
            self.backups.append({
                "name": backup_name,
                "source": path,
                "backup_path": str(backup_path),
                "created": datetime.now().isoformat()
            })
            
            return {"status": "success", "backup_name": backup_name, "path": str(backup_path)}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def restore_backup(self, backup_name):
        for backup in self.backups:
            if backup["name"] == backup_name:
                try:
                    return {
                        "status": "restored",
                        "from": backup["backup_path"],
                        "to": backup["source"]
                    }
                except Exception as e:
                    return {"status": "error", "message": str(e)}
        return {"status": "not_found"}
    
    def list_backups(self):
        return self.backups
    
    # APP LAUNCHER
    def launch_app(self, app_path, args=None):
        try:
            cmd = [app_path]
            if args:
                cmd.extend(args)
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            return {
                "status": "launched",
                "pid": process.pid,
                "command": " ".join(cmd)
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def launch_browser(self, url="http://localhost:5000"):
        browsers = ["xdg-open", "open", "start"]
        for browser in browsers:
            try:
                subprocess.Popen([browser, url])
                return {"status": "opened", "url": url, "method": browser}
            except:
                continue
        return {"status": "error", "message": "No browser found"}
    
    def quick_launch(self, app_name):
        apps = {
            "alphapony": "alpha_pony.html",
            "interface": "alpha_pony.html",
            "terminal": None,
            "browser": "alpha_pony.html"
        }
        
        if app_name in apps:
            if apps[app_name]:
                path = Path(__file__).parent / apps[app_name]
                if path.exists():
                    return self.launch_browser(f"file://{path}")
        
        return {"status": "unknown_app", "available": list(apps.keys())}


# PASCAL SERVER
def start_pascal_server(port=6000):
    import http.server
    import socketserver
    import threading
    
    pascal = Pascal()
    
    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/status':
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(pascal.status()).encode())
            elif self.path == '/backups':
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(pascal.list_backups()).encode())
            elif self.path == '/ports':
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(pascal.list_ports()).encode())
            elif self.path == '/launch/alphapony':
                result = pascal.quick_launch('alphapony')
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
            else:
                self.send_response(404)
                
        def do_POST(self):
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            if self.path == '/create_port':
                result = pascal.create_secure_port(data.get('port'), data.get('app'))
            elif self.path == '/tunnel/create':
                result = pascal.create_tunnel(data.get('local'), data.get('remote_host'), data.get('remote'))
            elif self.path == '/tunnel/close':
                result = pascal.close_tunnel(data.get('tunnel_id'))
            elif self.path == '/clean':
                result = pascal.clean_temp()
            elif self.path == '/backup':
                result = pascal.create_backup(data.get('path'), data.get('name'))
            elif self.path == '/restore':
                result = pascal.restore_backup(data.get('name'))
            elif self.path == '/launch':
                result = pascal.launch_app(data.get('path'), data.get('args'))
            else:
                result = {"status": "unknown_command"}
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
    
    with socketserver.TCPServer(("", port), Handler) as httpd:
        print(f"Pascal Server running on port {port}")
        httpd.serve_forever()


if __name__ == '__main__':
    import sys
    
    pascal = Pascal()
    
    if len(sys.argv) > 1:
        cmd = sys.argv[1].lower()
        
        if cmd == 'status':
            print(json.dumps(pascal.status(), indent=2))
        elif cmd == 'launch':
            if len(sys.argv) > 2:
                print(json.dumps(pascal.quick_launch(sys.argv[2]), indent=2))
            else:
                print(json.dumps(pascal.quick_launch('alphapony'), indent=2))
        elif cmd == 'clean':
            print(json.dumps(pascal.clean_temp(), indent=2))
        elif cmd == 'scan':
            print(json.dumps(pascal.scan_temp_files(), indent=2))
        elif cmd == 'server':
            port = int(sys.argv[2]) if len(sys.argv) > 2 else 6000
            start_pascal_server(port)
        elif cmd == 'help':
            print("Pascal Commands:")
            print("  status   - Show Pascal status")
            print("  launch   - Launch Alpha Pony interface")
            print("  clean    - Clean temporary files")
            print("  scan     - Scan temp files")
            print("  server   - Start Pascal server")
        else:
            print(f"Unknown command: {cmd}")
    else:
        print(json.dumps(pascal.status(), indent=2))
