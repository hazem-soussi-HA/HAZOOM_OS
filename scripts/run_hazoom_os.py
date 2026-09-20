#!/usr/bin/env python3
"""
HAZOOM OS — Unified Service Launcher
Starts all Hazoom OS services and keeps them running with logging.
"""

import os
import sys
import signal
import subprocess
import time
import threading
import json
import urllib.request
from pathlib import Path

OS_DIR = Path(__file__).parent.parent
LOG_DIR = Path("/tmp/hazoom_os_logs")
LOG_DIR.mkdir(exist_ok=True)

SERVICES = {
    "voice": {
        "name": "AlphaPony Voice Server",
        "port": 9003,
        "script": OS_DIR / "apps" / "games" / "cartoon-episode" / "voice_server.py",
        "health": "/health",
        "cwd": OS_DIR / "apps" / "games" / "cartoon-episode",
    },
    "chat": {
        "name": "AlphaPony Chat Server",
        "port": 9004,
        "script": OS_DIR / "services" / "orchestrator" / "chat_server.py",
        "health": "/health",
        "cwd": OS_DIR,
        "env": {"OLLAMA_MODEL": "hazoom-omega:v3"},
    },
    "desktop": {
        "name": "HAZOOM OS Desktop",
        "port": 8888,
        "script": None,
        "health": None,
        "cwd": OS_DIR,
        "cmd": [sys.executable, "-m", "http.server", "8888"],
    },
    "secure_proxy": {
        "name": "Secure Map Proxy",
        "port": 8443,
        "script": OS_DIR / "infrastructure" / "server" / "proxy" / "secure-proxy.js",
        "health": "/health",
        "cwd": OS_DIR / "infrastructure" / "server" / "proxy",
        "cmd": ["node", "secure-proxy.js"],
    },
}

PROCESSES = {}
SHUTDOWN = False


def log(service, message, level="INFO"):
    timestamp = time.strftime("%H:%M:%S")
    prefix = f"[{timestamp}] [{service}] [{level}]"
    print(f"{prefix} {message}")
    log_file = LOG_DIR / f"{service}.log"
    with open(log_file, "a") as f:
        f.write(f"{prefix} {message}\n")


def stream_reader(pipe, service_name, pipe_name):
    """Read from subprocess pipe and log output."""
    for line in iter(pipe.readline, b""):
        if not line:
            break
        line = line.decode(errors="replace").rstrip()
        if line:
            log(service_name, line, "STDOUT" if pipe_name == "stdout" else "STDERR")


def start_service(key, config):
    """Start a single service."""
    log("LAUNCHER", f"Starting {config['name']} on port {config['port']}...")
    
    env = os.environ.copy()
    if "env" in config:
        env.update(config["env"])
    
    if "cmd" in config:
        cmd = config["cmd"]
    else:
        cmd = [sys.executable, str(config["script"])]
    
    log_file = LOG_DIR / f"{key}.log"
    with open(log_file, "a") as f:
        f.write(f"\n=== Starting {config['name']} at {time.strftime('%Y-%m-%d %H:%M:%S')} ===\n")
    
    proc = subprocess.Popen(
        cmd,
        cwd=str(config["cwd"]),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    
    PROCESSES[key] = {
        "process": proc,
        "config": config,
        "started": time.time(),
    }
    
    # Start threads to read stdout/stderr
    threading.Thread(target=stream_reader, args=(proc.stdout, key, "stdout"), daemon=True).start()
    threading.Thread(target=stream_reader, args=(proc.stderr, key, "stderr"), daemon=True).start()
    
    log("LAUNCHER", f"Started {config['name']} (PID: {proc.pid})")
    return proc


def check_health(port, path="/health", timeout=3):
    """Check service health endpoint."""
    try:
        url = f"http://localhost:{port}{path}"
        req = urllib.request.Request(url, method="GET")
        resp = urllib.request.urlopen(req, timeout=timeout)
        data = json.loads(resp.read().decode())
        return data
    except Exception as e:
        return None


def wait_for_service(key, max_retries=30):
    """Wait for a service to become healthy."""
    config = SERVICES[key]
    port = config["port"]
    health_path = config.get("health")
    
    if not health_path:
        # For services without health endpoint, just check port
        for i in range(max_retries):
            try:
                urllib.request.urlopen(f"http://localhost:{port}", timeout=2)
                log(key, "Online (port responding)")
                return True
            except Exception:
                time.sleep(1)
        log(key, f"Failed to start after {max_retries}s", "ERROR")
        return False
    
    for i in range(max_retries):
        health = check_health(port, health_path)
        if health:
            log(key, f"Online — {json.dumps(health)}", "SUCCESS")
            return True
        time.sleep(1)
    
    log(key, f"Failed to start after {max_retries}s", "ERROR")
    return False


def shutdown(signum=None, frame=None):
    """Gracefully shutdown all services."""
    global SHUTDOWN
    SHUTDOWN = True
    log("LAUNCHER", "Shutting down HAZOOM OS...")
    
    for key, info in PROCESSES.items():
        proc = info["process"]
        config = info["config"]
        if proc.poll() is None:
            log(key, "Stopping...", "WARN")
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
            log(key, "Stopped")
    
    log("LAUNCHER", "All services stopped. Goodbye.")
    sys.exit(0)


def monitor_services():
    """Monitor services and restart if they die."""
    while not SHUTDOWN:
        for key, info in list(PROCESSES.items()):
            proc = info["process"]
            config = info["config"]
            if proc.poll() is not None:
                log(key, f"Process exited with code {proc.returncode}, restarting...", "ERROR")
                # Restart the service
                start_service(key, config)
                wait_for_service(key, max_retries=10)
        time.sleep(5)


def print_status():
    """Print current status."""
    print()
    print("=" * 70)
    print("  HAZOOM OS — RUNNING")
    print("=" * 70)
    for key, info in PROCESSES.items():
        proc = info["process"]
        config = info["config"]
        status = "RUNNING" if proc.poll() is None else "STOPPED"
        print(f"  {config['name']}: {status} (PID: {proc.pid}, Port: {config['port']})")
    print()
    print("  Access Points:")
    print(f"    Desktop OS:      http://localhost:8888")
    print(f"    Voice Server:    http://localhost:9003")
    print(f"    Chat Server:     http://localhost:9004")
    print(f"    Secure Proxy:    https://localhost:8443")
    print()
    print("  Logs: /tmp/hazoom_os_logs/")
    print("  Press Ctrl+C to shutdown")
    print("=" * 70)


def main():
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)
    
    print()
    print("  ╔══════════════════════════════════════════════════════╗")
    print("  ║          HAZOOM OS — System Launcher                ║")
    print("  ║          Conscious Intelligence Platform             ║")
    print("  ╚══════════════════════════════════════════════════════╝")
    print()
    
    # Start core services
    for key in ["voice", "chat", "desktop"]:
        if key in SERVICES:
            start_service(key, SERVICES[key])
    
    # Wait for services to be healthy
    print()
    print("  Waiting for services to come online...")
    print()
    
    for key in ["voice", "chat", "desktop"]:
        if key in SERVICES:
            wait_for_service(key)
    
    # Try to start secure proxy if SSL certs exist
    ssl_key = Path("/home/hazem/map-data/ssl/server.key")
    ssl_cert = Path("/home/hazem/map-data/ssl/server.crt")
    if ssl_key.exists() and ssl_cert.exists():
        start_service("secure_proxy", SERVICES["secure_proxy"])
        wait_for_service("secure_proxy")
    else:
        log("LAUNCHER", "SSL certs not found, skipping secure proxy", "WARN")
    
    print_status()
    
    # Start monitor thread
    monitor_thread = threading.Thread(target=monitor_services, daemon=True)
    monitor_thread.start()
    
    # Keep main thread alive
    try:
        while not SHUTDOWN:
            time.sleep(1)
            uptime = int(time.time() - min(info["started"] for info in PROCESSES.values()))
            sys.stdout.write(f"\r  Uptime: {uptime}s | Services: {len([p for p in PROCESSES.values() if p['process'].poll() is None])}")
            sys.stdout.flush()
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()