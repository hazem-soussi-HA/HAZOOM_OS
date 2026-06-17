#!/usr/bin/env python3
"""
HAZOOM OS - Quantum Monitor Service
Provides system metrics and agent status for HAZOOM OS, including a
Quantum Heat Diffusion simulation.
"""

import http.server
import socketserver
import json
import time
import random
import psutil
import numpy as np
from datetime import datetime
from urllib.parse import urlparse

class QuantumHeatSimulator:
    """
    Simulates heat diffusion across conceptual OS components based on the 1D heat equation.
    ∂u/∂t = α * ∂²u/∂x² + f(x, t)
    """
    def __init__(self, num_points=10, alpha=0.1, dt=0.1):
        self.num_points = num_points
        self.alpha = alpha  # Quantum Diffusivity
        self.dt = dt  # Time step
        
        # The "rod" representing OS components' heat/strain
        self.heat_vector = np.zeros(self.num_points, dtype=float)
        
        self.components = [
            "Core Kernel", "Memory Mgmt", "FS Driver", "Network Stack", "Scheduler",
            "Quantum Bridge", "Spirit Core", "Security Daemon", "I/O Bus", "UI Shell"
        ]

    def _calculate_laplacian(self):
        """Calculates the discrete 1D Laplacian with Neumann boundary conditions (insulated ends)."""
        # np.pad adds 'ghost' points to handle boundaries
        padded = np.pad(self.heat_vector, 1, mode='edge')
        laplacian = (padded[:-2] - 2 * padded[1:-1] + padded[2:])
        return laplacian

    def _get_internal_heat_sources(self):
        """Generates heat based on live system metrics, mapping them to components."""
        sources = np.zeros(self.num_points)
        
        # Map system metrics to component indices
        sources[0] += psutil.cpu_percent(interval=None) / 20.0  # Kernel gets CPU load
        sources[1] += psutil.virtual_memory().percent / 20.0  # Memory Mgmt gets RAM load
        
        # Add some thematic, "quantum" heat sources
        sources[5] += random.uniform(0, 5)  # Quantum Bridge activity
        sources[6] += random.uniform(0, 3)  # Spirit Core resonance
        
        # Random I/O spikes
        sources[8] += random.uniform(0, 8) if random.random() > 0.9 else 0
        
        return sources

    def step(self):
        """Performs one time step of the simulation."""
        laplacian = self._calculate_laplacian()
        internal_sources = self._get_internal_heat_sources()
        
        # Euler method to solve the differential equation
        change_in_heat = self.dt * (self.alpha * laplacian + internal_sources)
        self.heat_vector += change_in_heat
        
        # Add a slow cooling/dissipation factor to prevent runaway heat
        self.heat_vector *= 0.98
        
        # Clamp values to a reasonable range
        np.clip(self.heat_vector, 0, 100, out=self.heat_vector)
        
        return self.heat_vector

# --- Global simulator instance ---
heat_simulator = QuantumHeatSimulator()


class QuantumMonitorHandler(http.server.SimpleHTTPRequestHandler):
    """Quantum Monitor HTTP Handler"""
    
    def log_message(self, format, *args):
        """Custom logging"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[QUANTUM_MONITOR] {timestamp} - {self.path} - {format % args}")

    def send_json_response(self, data):
        """Send JSON response with proper headers"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/' or path == '':
            response = {
                "service": "HAZOOM Quantum Monitor",
                "version": "3.0.0",
                "status": "operational",
                "endpoints": {
                    "/": "This information page",
                    "/heat": "Quantum Heat Diffusion Simulation",
                    "/metrics": "Real-time system metrics",
                    "/health": "Health check",
                    "/security": "Security events",
                    "/hazoom": "HAZOOM integration status",
                    "/quantum": "Quantum analysis",
                    "/spirit": "Spirit context",
                    "/report": "System report",
                    "/agents": "Active AI agents"
                }
            }
            self.send_json_response(response)

        elif path == '/heat':
            # Run one step of the simulation and return the current state
            heat_vector = heat_simulator.step()
            response = {
                "timestamp": datetime.now().isoformat(),
                "simulation_parameters": {
                    "alpha": heat_simulator.alpha,
                    "dt": heat_simulator.dt,
                    "points": heat_simulator.num_points
                },
                "components": heat_simulator.components,
                "heat_vector": [round(h, 2) for h in heat_vector],
                "unit": "Quantum Strain"
            }
            self.send_json_response(response)
        
        elif path == '/metrics':
            # This endpoint now just returns metrics without duplicating the /heat logic
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            response = {
                "timestamp": datetime.now().isoformat(),
                "cpu": {"percent": cpu_percent, "cores": psutil.cpu_count()},
                "memory": {"total": memory.total, "used": memory.used, "percent": memory.percent},
                "disk": {"total": disk.total, "used": disk.used, "percent": disk.percent},
            }
            self.send_json_response(response)

        elif path == '/health':
            response = {"status": "healthy", "service": "quantum-monitor", "version": "3.0.0"}
            self.send_json_response(response)
            
        elif path == '/security':
            response = {"timestamp": datetime.now().isoformat(), "threat_level": "Nominal"}
            self.send_json_response(response)
            
        elif path == '/hazoom':
            response = {"timestamp": datetime.now().isoformat(), "integration": "active", "status": "nominal"}
            self.send_json_response(response)
            
        elif path == '/quantum':
            response = {"timestamp": datetime.now().isoformat(), "state": "entangled", "resonance": random.uniform(850.0, 860.0)}
            self.send_json_response(response)
            
        elif path == '/spirit':
            response = {"timestamp": datetime.now().isoformat(), "core": "active", "guidance": "cosmic"}
            self.send_json_response(response)
            
        elif path == '/report':
            cpu = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            response = {
                "timestamp": datetime.now().isoformat(),
                "health_score": random.randint(85, 95),
                "metrics": {"cpu": cpu, "memory": memory.percent}
            }
            self.send_json_response(response)
            
        elif path == '/agents':
            response = {
                "timestamp": datetime.now().isoformat(),
                "count": 5,
                "agents": [
                    {"name": "Spirit Guide", "type": "ai", "status": "running", "efficiency": 98},
                    {"name": "Quantum Solver", "type": "logic", "status": "running", "efficiency": 85},
                    {"name": "Kernel Protector", "type": "security", "status": "running", "efficiency": 100},
                    {"name": "Data Weaver", "type": "analysis", "status": "running", "efficiency": 92},
                    {"name": "Cosmic Navigator", "type": "navigation", "status": "running", "efficiency": 78}
                ]
            }
            self.send_json_response(response)

        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"error": "Endpoint not found"}
            self.wfile.write(json.dumps(response).encode())


def run_server(port=8002):
    """Start quantum monitor server"""
    handler = QuantumMonitorHandler
    
    # Simple and reliable binding
    try:
        # Bind to all interfaces on IPv4
        with socketserver.TCPServer(("0.0.0.0", port), handler) as httpd:
            httpd.allow_reuse_address = True
            print("=" * 60)
            print("HAZOOM QUANTUM MONITOR v3.0")
            print("   - Quantum Heat Diffusion ACTIVE -")
            print("=" * 60)
            print(f"Server running at: http://localhost:{port}")
            print(f"Status: OPERATIONAL")
            print("=" * 60)
            print("Press Ctrl+C to stop")
            print("")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[QUANTUM_MONITOR] Shutting down...")
    except Exception as e:
        print(f"[QUANTUM_MONITOR] Critical error: {e}")


if __name__ == "__main__":
    import sys
    
    # Initialize psutil before starting the server to get a baseline
    psutil.cpu_percent(interval=None)
    
    port = 8002
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port: {sys.argv[1]}")
            sys.exit(1)
    
    run_server(port)
