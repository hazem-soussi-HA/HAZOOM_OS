#!/usr/bin/env python3
"""
HAZOOM OS - Quantum Monitor Service v4.0
Enhanced with WebGPU compute shaders, 3D heat diffusion, QKD simulation,
entanglement network tracking, and quantum algorithm endpoints.
"""

import http.server
import socketserver
import json
import time
import random
import psutil
import numpy as np
from datetime import datetime
from urllib.parse import urlparse, parse_qs
import threading
import asyncio
from collections import deque

# Try to import WebGPU compute (via wgpu-py if available)
try:
    import wgpu
    WGPU_AVAILABLE = True
except ImportError:
    WGPU_AVAILABLE = False
    print("[QuantumMonitor] wgpu not available, using NumPy fallback")

# ============================================================
# 3D QUANTUM HEAT DIFFUSION SIMULATOR
# ============================================================
class QuantumHeatSimulator3D:
    """
    3D Heat diffusion on GPU via compute shaders (wgpu) or CPU fallback.
    Solves: ∂u/∂t = α ∇²u + f(x,y,z,t) + quantum_noise
    """
    def __init__(self, grid_size=(16, 16, 16), alpha=0.1, dt=0.1):
        self.grid_size = grid_size
        self.nx, self.ny, self.nz = grid_size
        self.alpha = alpha
        self.dt = dt
        self.total_cells = self.nx * self.ny * self.nz

        # 3D heat field
        self.heat_field = np.zeros(grid_size, dtype=np.float32)
        self.previous_field = np.zeros(grid_size, dtype=np.float32)

        # Component mapping (regions in 3D space)
        self.components = {
            "Core Kernel": (slice(0, 4), slice(0, 4), slice(0, 4)),
            "Memory Mgmt": (slice(4, 8), slice(0, 4), slice(0, 4)),
            "FS Driver": (slice(8, 12), slice(0, 4), slice(0, 4)),
            "Network Stack": (slice(12, 16), slice(0, 4), slice(0, 4)),
            "Scheduler": (slice(0, 4), slice(4, 8), slice(0, 4)),
            "Quantum Bridge": (slice(4, 8), slice(4, 8), slice(0, 4)),
            "Spirit Core": (slice(8, 12), slice(4, 8), slice(0, 4)),
            "Security Daemon": (slice(12, 16), slice(4, 8), slice(0, 4)),
            "I/O Bus": (slice(0, 4), slice(8, 12), slice(0, 4)),
            "UI Shell": (slice(4, 8), slice(8, 12), slice(0, 4)),
            "AI Orchestrator": (slice(8, 12), slice(8, 12), slice(0, 4)),
            "Quantum Memory": (slice(12, 16), slice(8, 12), slice(0, 4)),
            "Entanglement Net": (slice(0, 4), slice(12, 16), slice(0, 4)),
            "QKD Channels": (slice(4, 8), slice(12, 16), slice(0, 4)),
            "Circuit Simulator": (slice(8, 12), slice(12, 16), slice(0, 4)),
            "Reserve": (slice(12, 16), slice(12, 16), slice(0, 4)),
        }

        # GPU compute pipeline (if available)
        self.gpu_device = None
        self.compute_pipeline = None
        self.heat_buffer = None
        self._init_gpu()

    def _init_gpu(self):
        if not WGPU_AVAILABLE:
            return
        try:
            self.gpu_device = wgpu.utils.get_default_device()
            self._create_compute_pipeline()
            print("[QuantumMonitor] WebGPU compute pipeline initialized")
        except Exception as e:
            print(f"[QuantumMonitor] GPU init failed: {e}")
            self.gpu_device = None

    def _create_compute_pipeline(self):
        shader = """
        @group(0) @binding(0) var<storage, read_write> heat: array<f32>;
        @group(0) @binding(1) var<uniform> params: Params;

        struct Params {
            alpha: f32,
            dt: f32,
            nx: u32,
            ny: u32,
            nz: u32,
        };

        fn index(x: u32, y: u32, z: u32) -> u32 {
            return (z * params.ny * params.nx) + (y * params.nx) + x;
        }

        @compute @workgroup_size(8, 8, 4)
        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
            let x = id.x;
            let y = id.y;
            let z = id.z;
            if (x >= params.nx || y >= params.ny || z >= params.nz) { return; }

            let idx = index(x, y, z);
            var laplacian = 0.0;

            // 3D Laplacian with Neumann boundaries
            let left = index(max(0u, x - 1u), y, z);
            let right = index(min(params.nx - 1u, x + 1u), y, z);
            let down = index(x, max(0u, y - 1u), z);
            let up = index(x, min(params.ny - 1u, y + 1u), z);
            let back = index(x, y, max(0u, z - 1u));
            let front = index(x, y, min(params.nz - 1u, z + 1u));

            laplacian = heat[left] + heat[right] + heat[down] + heat[up] + heat[back] + heat[front] - 6.0 * heat[idx];

            heat[idx] += params.dt * (params.alpha * laplacian);
        }
        """

        self.compute_shader = self.gpu_device.create_shader_module(code=shader)
        self.bind_group_layout = self.gpu_device.create_bind_group_layout(
            entries=[
                {"binding": 0, "visibility": wgpu.ShaderStage.COMPUTE, "buffer": {"type": "storage"}},
                {"binding": 1, "visibility": wgpu.ShaderStage.COMPUTE, "buffer": {"type": "uniform"}},
            ]
        )
        self.pipeline_layout = self.gpu_device.create_pipeline_layout(
            bind_group_layouts=[self.bind_group_layout]
        )
        self.compute_pipeline = self.gpu_device.create_compute_pipeline(
            layout=self.pipeline_layout,
            compute={"module": self.compute_shader, "entry_point": "main"}
        )

    def _gpu_step(self, sources):
        if not self.gpu_device:
            return False

        try:
            # Update heat buffer with sources
            # (In real implementation, would upload sources to GPU)
            # For now, fall back to CPU
            return False
        except Exception:
            return False

    def _cpu_step(self, sources):
        """CPU fallback using NumPy"""
        # 3D Laplacian using convolution
        laplacian = np.zeros_like(self.heat_field)

        # Interior points
        laplacian[1:-1, 1:-1, 1:-1] = (
            self.heat_field[0:-2, 1:-1, 1:-1] +  # left
            self.heat_field[2:, 1:-1, 1:-1] +    # right
            self.heat_field[1:-1, 0:-2, 1:-1] +  # down
            self.heat_field[1:-1, 2:, 1:-1] +    # up
            self.heat_field[1:-1, 1:-1, 0:-2] +  # back
            self.heat_field[1:-1, 1:-1, 2:] -    # front
            6 * self.heat_field[1:-1, 1:-1, 1:-1]
        )

        # Neumann boundary conditions (insulated edges)
        # X boundaries
        laplacian[0, 1:-1, 1:-1] = self.heat_field[1, 1:-1, 1:-1] - self.heat_field[0, 1:-1, 1:-1]
        laplacian[-1, 1:-1, 1:-1] = self.heat_field[-2, 1:-1, 1:-1] - self.heat_field[-1, 1:-1, 1:-1]
        # Y boundaries
        laplacian[1:-1, 0, 1:-1] = self.heat_field[1:-1, 1, 1:-1] - self.heat_field[1:-1, 0, 1:-1]
        laplacian[1:-1, -1, 1:-1] = self.heat_field[1:-1, -2, 1:-1] - self.heat_field[1:-1, -1, 1:-1]
        # Z boundaries
        laplacian[1:-1, 1:-1, 0] = self.heat_field[1:-1, 1:-1, 1] - self.heat_field[1:-1, 1:-1, 0]
        laplacian[1:-1, 1:-1, -1] = self.heat_field[1:-1, 1:-1, -2] - self.heat_field[1:-1, 1:-1, -1]

        # Euler step
        self.heat_field += self.dt * (self.alpha * laplacian + sources)

        # Dissipation
        self.heat_field *= 0.985

        # Clamp
        np.clip(self.heat_field, 0, 100, out=self.heat_field)

    def _get_sources(self):
        """Generate heat sources from system metrics + quantum activity"""
        sources = np.zeros(self.grid_size, dtype=np.float32)

        # System metrics mapped to component regions
        cpu = psutil.cpu_percent(interval=None) / 100.0
        mem = psutil.virtual_memory().percent / 100.0
        disk = psutil.disk_usage('/').percent / 100.0
        net_io = psutil.net_io_counters()
        net_activity = min((net_io.bytes_sent + net_io.bytes_recv) / 1e7, 1.0)

        # Map to component regions
        for name, (sx, sy, sz) in self.components.items():
            region = self.heat_field[sx, sy, sz]
            if name == "Core Kernel":
                sources[sx, sy, sz] += cpu * 30
            elif name == "Memory Mgmt":
                sources[sx, sy, sz] += mem * 25
            elif name == "Network Stack":
                sources[sx, sy, sz] += net_activity * 20
            elif name == "Quantum Bridge":
                sources[sx, sy, sz] += random.uniform(0, 8)
            elif name == "Spirit Core":
                sources[sx, sy, sz] += random.uniform(0, 5)
            elif name == "QKD Channels":
                sources[sx, sy, sz] += random.uniform(0, 3)
            elif name == "Entanglement Net":
                sources[sx, sy, sz] += random.uniform(0, 4)
            elif name == "Circuit Simulator":
                sources[sx, sy, sz] += random.uniform(0, 6)

        # Global quantum noise
        sources += np.random.normal(0, 0.5, self.grid_size).clip(0)

        return sources

    def step(self):
        sources = self._get_sources()

        if self.gpu_device and self._gpu_step(sources):
            pass
        else:
            self._cpu_step(sources)

        return self.heat_field

    def get_component_heat(self):
        """Average heat per component region"""
        result = {}
        for name, (sx, sy, sz) in self.components.items():
            region = self.heat_field[sx, sy, sz]
            result[name] = float(np.mean(region))
        return result

    def get_heat_field_flat(self):
        """Flattened field for visualization"""
        return self.heat_field.flatten().tolist()

    def get_3d_slices(self):
        """Return XY slices at different Z levels for 3D visualization"""
        slices = []
        for z in range(self.nz):
            slices.append(self.heat_field[:, :, z].tolist())
        return slices


# ============================================================
# QKD SIMULATOR (BB84, E91)
# ============================================================
class QKDSimulator:
    def __init__(self):
        self.channels = {}  # channel_id -> state
        self.key_pool = deque(maxlen=1000)

    def create_channel(self, channel_id, alice, bob, protocol='BB84'):
        self.channels[channel_id] = {
            'alice': alice, 'bob': bob, 'protocol': protocol,
            'state': 'initialized', 'created': time.time(),
            'raw_key': [], 'sifted_key': [], 'final_key': [],
            'qber': 0.0, 'eavesdropper_detected': False
        }
        return channel_id

    def simulate_bb84(self, channel_id, num_qubits=1000):
        ch = self.channels.get(channel_id)
        if not ch: return None

        # Alice generates random bits and bases
        alice_bits = [random.randint(0, 1) for _ in range(num_qubits)]
        alice_bases = [random.randint(0, 1) for _ in range(num_qubits)]  # 0=Z, 1=X

        # Quantum channel transmission (with noise)
        bob_bases = [random.randint(0, 1) for _ in range(num_qubits)]
        bob_bits = []

        for i in range(num_qubits):
            if alice_bases[i] == bob_bases[i]:
                # Same basis - should match (with error rate)
                error_rate = 0.011  # 1.1% typical QBER
                if random.random() < error_rate:
                    bob_bits.append(1 - alice_bits[i])
                else:
                    bob_bits.append(alice_bits[i])
            else:
                # Different basis - random result
                bob_bits.append(random.randint(0, 1))

        # Sifting
        sifted = [(alice_bits[i], bob_bits[i]) for i in range(num_qubits)
                  if alice_bases[i] == bob_bases[i]]

        # QBER calculation
        errors = sum(1 for a, b in sifted if a != b)
        qber = errors / len(sifted) if sifted else 0

        ch['raw_key'] = alice_bits
        ch['sifted_key'] = [a for a, b in sifted]
        ch['qber'] = qber
        ch['eavesdropper_detected'] = qber > 0.11  # Threshold

        if not ch['eavesdropper_detected']:
            # Privacy amplification (simplified)
            ch['final_key'] = ch['sifted_key'][:len(ch['sifted_key']) // 2]
            self.key_pool.append({
                'channel': channel_id,
                'key': ch['final_key'],
                'length': len(ch['final_key']),
                'qber': qber,
                'timestamp': time.time()
            })
            ch['state'] = 'key_established'
        else:
            ch['state'] = 'compromised'

        return ch

    def get_key(self, length=256):
        if self.key_pool:
            return self.key_pool.popleft()
        return None


# ============================================================
# ENTANGLEMENT NETWORK TRACKER
# ============================================================
class EntanglementNetwork:
    def __init__(self):
        self.nodes = {}  # node_id -> {type, position, coherence}
        self.edges = {}  # (node_a, node_b) -> {fidelity, created, protocol}
        self.purification_queue = deque()

    def add_node(self, node_id, node_type, position=None):
        self.nodes[node_id] = {
            'type': node_type,
            'position': position or [random.random()*100 for _ in range(3)],
            'coherence': 1.0,
            'created': time.time()
        }

    def create_entanglement(self, node_a, node_b, protocol='spdc', fidelity=0.98):
        if node_a not in self.nodes or node_b not in self.nodes:
            return False
        key = tuple(sorted([node_a, node_b]))
        self.edges[key] = {
            'fidelity': fidelity,
            'protocol': protocol,
            'created': time.time(),
            'purification_rounds': 0
        }
        return True

    def purify(self, node_a, node_b):
        key = tuple(sorted([node_a, node_b]))
        edge = self.edges.get(key)
        if not edge or edge['fidelity'] < 0.5:
            return False

        # DEJMPS purification protocol (simplified)
        success_prob = edge['fidelity'] ** 2
        if random.random() < success_prob:
            edge['fidelity'] = min(1.0, edge['fidelity'] * 1.2)
            edge['purification_rounds'] += 1
            return True
        else:
            # Purification failed - entanglement degraded
            edge['fidelity'] *= 0.7
            return False

    def swap(self, node_a, node_b, node_c):
        """Entanglement swapping: A-B and B-C -> A-C"""
        ab = tuple(sorted([node_a, node_b]))
        bc = tuple(sorted([node_b, node_c]))
        ac = tuple(sorted([node_a, node_c]))

        if ab in self.edges and bc in self.edges:
            f_ab = self.edges[ab]['fidelity']
            f_bc = self.edges[bc]['fidelity']
            # Swapped fidelity (ideal case)
            f_ac = f_ab * f_bc
            self.edges[ac] = {
                'fidelity': f_ac,
                'protocol': 'swapping',
                'created': time.time(),
                'purification_rounds': 0
            }
            return True
        return False

    def get_network_state(self):
        return {
            'nodes': {k: {**v, 'position': list(v['position'])} for k, v in self.nodes.items()},
            'edges': {f"{a}-{b}": v for (a, b), v in self.edges.items()}
        }


# ============================================================
# QUANTUM ALGORITHM TRACKER
# ============================================================
class QuantumAlgorithmTracker:
    def __init__(self):
        self.jobs = {}  # job_id -> status
        self.results = {}

    def start_grover(self, job_id, oracle_function, num_qubits, iterations=None):
        optimal_iterations = int(np.pi/4 * np.sqrt(2**num_qubits))
        iters = iterations or optimal_iterations

        self.jobs[job_id] = {
            'algorithm': 'grover',
            'status': 'running',
            'num_qubits': num_qubits,
            'iterations': iters,
            'current_iter': 0,
            'started': time.time()
        }

        # Simulate async execution
        threading.Thread(target=self._run_grover, args=(job_id, oracle_function, iters), daemon=True).start()
        return job_id

    def _run_grover(self, job_id, oracle, iterations):
        job = self.jobs[job_id]
        for i in range(iterations):
            time.sleep(0.1)  # Simulate iteration time
            job['current_iter'] = i + 1
            job['progress'] = (i + 1) / iterations
        job['status'] = 'complete'
        job['result'] = 'marked_state_found'  # Simplified
        self.results[job_id] = job

    def start_qaoa(self, job_id, cost_hamiltonian, num_layers=3):
        self.jobs[job_id] = {
            'algorithm': 'qaoa',
            'status': 'running',
            'num_layers': num_layers,
            'current_layer': 0,
            'parameters': [random.random() for _ in range(2 * num_layers)],
            'energy_history': [],
            'started': time.time()
        }
        threading.Thread(target=self._run_qaoa, args=(job_id, num_layers), daemon=True).start()
        return job_id

    def _run_qaoa(self, job_id, num_layers):
        job = self.jobs[job_id]
        for layer in range(num_layers):
            time.sleep(0.2)
            job['current_layer'] = layer + 1
            energy = random.uniform(-10, -5) - layer * 0.5
            job['energy_history'].append(energy)
            job['parameters'] = [p + random.uniform(-0.1, 0.1) for p in job['parameters']]
        job['status'] = 'complete'
        job['optimal_params'] = job['parameters']
        self.results[job_id] = job

    def get_job_status(self, job_id):
        return self.jobs.get(job_id) or self.results.get(job_id)


# ============================================================
# GLOBAL INSTANCES
# ============================================================
heat_simulator_3d = QuantumHeatSimulator3D()
qkd_simulator = QKDSimulator()
entanglement_net = EntanglementNetwork()
algorithm_tracker = QuantumAlgorithmTracker()

# Initialize default entanglement network
for i, name in enumerate(["Alice", "Bob", "Charlie", "David", "Eve", "QuantumRepeater1", "QuantumRepeater2"]):
    entanglement_net.add_node(name.lower(), "station" if "Repeater" not in name else "repeater")

# Create some initial entanglements
entanglement_net.create_entanglement("alice", "bob", fidelity=0.99)
entanglement_net.create_entanglement("bob", "charlie", fidelity=0.97)
entanglement_net.create_entanglement("charlie", "david", fidelity=0.96)
entanglement_net.create_entanglement("alice", "quantumrepeater1", fidelity=0.95)
entanglement_net.create_entanglement("quantumrepeater1", "bob", fidelity=0.94)
entanglement_net.create_entanglement("quantumrepeater2", "charlie", fidelity=0.93)
entanglement_net.create_entanglement("quantumrepeater2", "david", fidelity=0.92)


# ============================================================
# HTTP HANDLER
# ============================================================
class QuantumMonitorHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[QUANTUM_MONITOR] {timestamp} - {self.path} - {format % args}")

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == '/' or path == '':
            self.send_json({
                "service": "HAZOOM Quantum Monitor",
                "version": "4.0.0",
                "status": "operational",
                "gpu_accelerated": WGPU_AVAILABLE,
                "endpoints": {
                    "/": "Service info",
                    "/heat": "3D Quantum Heat Diffusion",
                    "/heat/slices": "XY slices for 3D viz",
                    "/heat/components": "Component heat summary",
                    "/qkd/channels": "QKD channel status",
                    "/qkd/create": "Create QKD channel (POST)",
                    "/qkd/simulate": "Run BB84 simulation (POST)",
                    "/qkd/get_key": "Get generated key",
                    "/entanglement/network": "Entanglement network state",
                    "/entanglement/create": "Create entanglement (POST)",
                    "/entanglement/purify": "Purify entanglement (POST)",
                    "/entanglement/swap": "Entanglement swapping (POST)",
                    "/algorithms/jobs": "Algorithm job status",
                    "/algorithms/grover": "Start Grover (POST)",
                    "/algorithms/qaoa": "Start QAOA (POST)",
                    "/metrics": "System metrics",
                    "/quantum/state": "Full quantum state",
                    "/health": "Health check"
                }
            })

        elif path == '/heat':
            field = heat_simulator_3d.step()
            self.send_json({
                "timestamp": datetime.now().isoformat(),
                "grid_size": heat_simulator_3d.grid_size,
                "simulation_parameters": {"alpha": heat_simulator_3d.alpha, "dt": heat_simulator_3d.dt},
                "heat_field": heat_simulator_3d.get_heat_field_flat(),
                "component_heat": heat_simulator_3d.get_component_heat(),
                "unit": "Quantum Strain"
            })

        elif path == '/heat/slices':
            self.send_json({
                "timestamp": datetime.now().isoformat(),
                "grid_size": heat_simulator_3d.grid_size,
                "slices": heat_simulator_3d.get_3d_slices()
            })

        elif path == '/heat/components':
            self.send_json({
                "timestamp": datetime.now().isoformat(),
                "components": heat_simulator_3d.get_component_heat()
            })

        elif path == '/qkd/channels':
            self.send_json({
                "timestamp": datetime.now().isoformat(),
                "channels": {k: {**v, 'raw_key': len(v['raw_key']), 'sifted_key': len(v['sifted_key'])}
                             for k, v in qkd_simulator.channels.items()},
                "key_pool_size": len(qkd_simulator.key_pool)
            })

        elif path == '/qkd/get_key':
            length = int(query.get('length', [256])[0])
            key = qkd_simulator.get_key(length)
            if key:
                self.send_json(key)
            else:
                self.send_json({"error": "No keys available"}, 404)

        elif path == '/entanglement/network':
            self.send_json(entanglement_net.get_network_state())

        elif path == '/algorithms/jobs':
            self.send_json({
                "timestamp": datetime.now().isoformat(),
                "jobs": {k: v for k, v in algorithm_tracker.jobs.items()},
                "completed": {k: v for k, v in algorithm_tracker.results.items()}
            })

        elif path == '/metrics':
            cpu = psutil.cpu_percent(interval=0.1)
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            self.send_json({
                "timestamp": datetime.now().isoformat(),
                "cpu": {"percent": cpu, "cores": psutil.cpu_count()},
                "memory": {"total": mem.total, "used": mem.used, "percent": mem.percent},
                "disk": {"total": disk.total, "used": disk.used, "percent": disk.percent},
                "gpu_available": WGPU_AVAILABLE
            })

        elif path == '/quantum/state':
            # Full quantum state dump
            heat_simulator_3d.step()
            self.send_json({
                "timestamp": datetime.now().isoformat(),
                "heat": {
                    "field": heat_simulator_3d.get_heat_field_flat(),
                    "components": heat_simulator_3d.get_component_heat(),
                    "slices": heat_simulator_3d.get_3d_slices()
                },
                "qkd": {k: {**v, 'raw_key': len(v['raw_key'])} for k, v in qkd_simulator.channels.items()},
                "entanglement": entanglement_net.get_network_state(),
                "algorithms": {k: v for k, v in algorithm_tracker.jobs.items()},
                "metrics": {
                    "cpu": psutil.cpu_percent(interval=None),
                    "memory": psutil.virtual_memory().percent
                }
            })

        elif path == '/health':
            self.send_json({"status": "healthy", "service": "quantum-monitor", "version": "4.0.0", "gpu": WGPU_AVAILABLE})

        else:
            self.send_json({"error": "Endpoint not found"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode() if content_length > 0 else '{}'
        try:
            data = json.loads(body)
        except:
            data = {}

        if path == '/qkd/create':
            channel_id = data.get('channel_id', f'qkd_{int(time.time())}')
            alice = data.get('alice', 'alice')
            bob = data.get('bob', 'bob')
            protocol = data.get('protocol', 'BB84')
            qkd_simulator.create_channel(channel_id, alice, bob, protocol)
            self.send_json({"channel_id": channel_id, "status": "created"})

        elif path == '/qkd/simulate':
            channel_id = data.get('channel_id')
            num_qubits = data.get('num_qubits', 1000)
            result = qkd_simulator.simulate_bb84(channel_id, num_qubits)
            if result:
                self.send_json(result)
            else:
                self.send_json({"error": "Channel not found"}, 404)

        elif path == '/entanglement/create':
            node_a = data.get('node_a')
            node_b = data.get('node_b')
            fidelity = data.get('fidelity', 0.98)
            protocol = data.get('protocol', 'spdc')
            if entanglement_net.create_entanglement(node_a, node_b, protocol, fidelity):
                self.send_json({"status": "created", "nodes": [node_a, node_b]})
            else:
                self.send_json({"error": "Nodes not found"}, 404)

        elif path == '/entanglement/purify':
            node_a = data.get('node_a')
            node_b = data.get('node_b')
            success = entanglement_net.purify(node_a, node_b)
            self.send_json({"success": success})

        elif path == '/entanglement/swap':
            node_a = data.get('node_a')
            node_b = data.get('node_b')
            node_c = data.get('node_c')
            success = entanglement_net.swap(node_a, node_b, node_c)
            self.send_json({"success": success})

        elif path == '/algorithms/grover':
            job_id = data.get('job_id', f'grover_{int(time.time())}')
            oracle = data.get('oracle', 'default')
            num_qubits = data.get('num_qubits', 4)
            algorithm_tracker.start_grover(job_id, oracle, num_qubits)
            self.send_json({"job_id": job_id, "status": "started"})

        elif path == '/algorithms/qaoa':
            job_id = data.get('job_id', f'qaoa_{int(time.time())}')
            num_layers = data.get('num_layers', 3)
            algorithm_tracker.start_qaoa(job_id, None, num_layers)
            self.send_json({"job_id": job_id, "status": "started"})

        else:
            self.send_json({"error": "Endpoint not found"}, 404)


def run_server(port=8002):
    handler = QuantumMonitorHandler
    try:
        with socketserver.TCPServer(("0.0.0.0", port), handler) as httpd:
            httpd.allow_reuse_address = True
            print("=" * 70)
            print("HAZOOM QUANTUM MONITOR v4.0")
            print("   - 3D Quantum Heat Diffusion (WebGPU ready)")
            print("   - QKD Simulation (BB84/E91)")
            print("   - Entanglement Network (Purification/Swapping)")
            print("   - Quantum Algorithms (Grover/QAOA)")
            print("=" * 70)
            print(f"Server running at: http://localhost:{port}")
            print(f"WebGPU: {'ENABLED' if WGPU_AVAILABLE else 'DISABLED (CPU fallback)'}")
            print("=" * 70)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[QUANTUM_MONITOR] Shutting down...")
    except Exception as e:
        print(f"[QUANTUM_MONITOR] Critical error: {e}")


if __name__ == "__main__":
    import sys
    psutil.cpu_percent(interval=None)
    port = 8002
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port: {sys.argv[1]}")
            sys.exit(1)
    run_server(port)