#!/usr/bin/env python3
"""
HAZOOM OS - Mind & Neural Web Interface
Pascal Kernel Backend for Web Interface
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import subprocess
from pathlib import Path

KERNEL_DIR = Path("/home/hazem/hazoom-os-v3/core")

class MindHTTPHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path
        if path == "/":
            self.send_html()
        elif path == "/api/status":
            self.send_json(self.get_kernel_status())
        elif path == "/api/neural":
            self.send_json(self.run_module("neural_core"))
        elif path == "/api/consciousness":
            self.send_json(self.run_module("consciousness"))
        elif path == "/api/aether":
            self.send_json(self.run_module("aether_engine"))
        elif path == "/api/deep-consciousness":
            self.send_json(self.run_module("deep_consciousness"))
        elif path == "/api/synapse":
            self.send_json(self.run_module("synapse_os"))
        elif path == "/api/integrate":
            self.send_json(self.integrate_all())
        else:
            self.send_error(404, "Not Found")

    def send_html(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(self.get_html().encode('utf-8'))

    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))

    def send_error(self, code, msg):
        self.send_response(code)
        self.end_headers()
        self.wfile.write(msg.encode())

    def run_module(self, module: str) -> dict:
        binary = KERNEL_DIR / module
        if not binary.exists():
            return {"module": module, "success": False, "error": "Binary not found"}
        try:
            result = subprocess.run(
                [str(binary)], capture_output=True, text=True, timeout=10,
                cwd=str(KERNEL_DIR)
            )
            return {
                "module": module,
                "success": result.returncode == 0,
                "output": result.stdout[:2000],
                "errors": result.stderr[:500]
            }
        except subprocess.TimeoutExpired:
            return {"module": module, "success": False, "error": "Timeout"}
        except Exception as e:
            return {"module": module, "success": False, "error": str(e)}

    def get_kernel_status(self) -> dict:
        return {
            "system": "HAZOOM OS",
            "kernel": "Pascal Unix Kernel v3",
            "version": "3.0.0",
            "modules": {
                "neural_core": (KERNEL_DIR / "neural_core").exists(),
                "consciousness": (KERNEL_DIR / "consciousness").exists(),
                "aether_engine": (KERNEL_DIR / "aether_engine").exists(),
                "deep_consciousness": (KERNEL_DIR / "deep_consciousness").exists(),
            },
            "source": "compiled from core/*.pas via fpc"
        }

    def integrate_all(self) -> dict:
        results = {}
        for module in ["neural_core", "consciousness", "aether_engine", "deep_consciousness"]:
            results[module] = self.run_module(module)
        return {
            "integration": "complete",
            "modules": results,
            "status": self.get_kernel_status()
        }

    def get_html(self) -> str:
        return '''<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>HAZOOM OS - Pascal Kernel</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;background:linear-gradient(135deg,#0a0a1a,#1a1a3a);color:#00ff88;min-height:100vh;padding:20px}
.container{max-width:1200px;margin:0 auto}
h1{text-align:center;font-size:2.5em;text-shadow:0 0 20px #00ff88;margin-bottom:10px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-top:20px}
.card{background:rgba(0,255,136,0.1);border:2px solid #00ff88;border-radius:10px;padding:20px;cursor:pointer;transition:all 0.3s}
.card:hover{background:rgba(0,255,136,0.2);transform:translateY(-5px)}
.card h2{color:#00ccff;margin-bottom:10px}
.status{border:1px solid #00ff88;border-radius:5px;padding:15px;margin-top:30px;background:rgba(0,0,0,0.5)}
.module{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(0,255,136,0.3)}
.active{color:#00ff88}.inactive{color:#ff4444}
#output{margin-top:20px;padding:15px;background:#000;border:1px solid #00ccff;border-radius:5px;white-space:pre-wrap;display:none;max-height:400px;overflow:auto}
</style></head>
<body><div class=container>
<h1>🧠 HAZOOM OS PASCAL KERNEL</h1>
<div class=grid>
<div class=card onclick="runModule('neural')"><h2>🧠 Neural Core</h2><p>Neural processing engine</p></div>
<div class=card onclick="runModule('consciousness')"><h2>💚 Consciousness</h2><p>Self-awareness engine</p></div>
<div class=card onclick="runModule('aether')"><h2>✨ Aether Engine</h2><p>Quantum protocol engine</p></div>
<div class=card onclick="runModule('deep-consciousness')"><h2>🧩 Deep Consciousness</h2><p>Recursive self-awareness</p></div>
</div>
<div class=status><h3>System Status</h3><div id=status></div></div>
<div id=output></div>
</div>
<script>
async function load(){const r=await fetch('/api/status');const d=await r.json();let h='';for(const[n,a]of Object.entries(d.modules)){h+='<div class=module><span>'+n+'</span><span class="'+(a?'active':'inactive')+'">'+(a?'● ACTIVE':'○ INACTIVE')+'</span></div>'}document.getElementById('status').innerHTML=h}
async function runModule(m){const o=document.getElementById('output');o.style.display='block';o.textContent='Running...';try{const r=await fetch('/api/'+m);const d=await r.json();o.textContent=d.output||d.error||'No output'}catch(e){o.textContent='Error: '+e}}
load();
</script></body></html>'''
def run_server(port=8089):
    HTTPServer(('127.0.0.1', port), MindHTTPHandler).serve_forever()

if __name__ == "__main__":
    print("HAZOOM OS Pascal Kernel Web Interface")
    print(f"Running on http://localhost:8089")
    run_server()
