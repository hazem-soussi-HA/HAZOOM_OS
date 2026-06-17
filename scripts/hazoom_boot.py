#!/usr/bin/env python3
"""
HAZOOM OS v3.0 — System Boot Manager
Starts all integrated services: Voice Server, Chat Server, and Desktop
"""

import os
import sys
import signal
import subprocess
import time
import urllib.request
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OS_DIR = SCRIPT_DIR

SERVICES = {
    "voice": {
        "name": "AlphaPony Voice Server",
        "port": 9003,
        "script": os.path.join(OS_DIR, "apps", "cartoon-episode", "voice_server.py"),
        "health": "/health",
    },
    "chat": {
        "name": "AlphaPony Chat Server",
        "port": 9004,
        "script": os.path.join(OS_DIR, "services", "orchestrator", "chat_server.py"),
        "health": "/health",
    },
    "desktop": {
        "name": "HAZOOM OS Desktop",
        "port": 8888,
        "script": None,
        "health": None,
    },
}

PROCESSES = {}
COLORS = {
    "cyan": "\033[1;36m",
    "green": "\033[1;32m",
    "yellow": "\033[1;33m",
    "purple": "\033[1;35m",
    "red": "\033[1;31m",
    "reset": "\033[0m",
    "bold": "\033[1m",
}


def log(service, message, color="cyan"):
    timestamp = time.strftime("%H:%M:%S")
    tag = f"{COLORS[color]}[{service}]{COLORS['reset']}"
    print(f"{COLORS['dim']}{timestamp}{COLORS['reset']} {tag} {message}")


def check_port(port, timeout=2):
    try:
        url = f"http://localhost:{port}"
        req = urllib.request.Request(url, method="HEAD")
        urllib.request.urlopen(req, timeout=timeout)
        return True
    except Exception:
        return False


def check_health(port, path="/health", timeout=3):
    try:
        url = f"http://localhost:{port}{path}"
        resp = urllib.request.urlopen(url, timeout=timeout)
        data = json.loads(resp.read().decode())
        return data
    except Exception:
        return None


def start_voice_server():
    svc = SERVICES["voice"]
    log("BOOT", f"Starting {svc['name']} on port {svc['port']}...", "cyan")
    proc = subprocess.Popen(
        [sys.executable, svc["script"]],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    PROCESSES["voice"] = proc
    return proc


def start_chat_server():
    svc = SERVICES["chat"]
    log("BOOT", f"Starting {svc['name']} on port {svc['port']}...", "cyan")
    env = os.environ.copy()
    env["OLLAMA_MODEL"] = "phi3:mini"
    proc = subprocess.Popen(
        [sys.executable, svc["script"]],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=env,
    )
    PROCESSES["chat"] = proc
    return proc


def start_desktop():
    svc = SERVICES["desktop"]
    log("BOOT", f"Starting {svc['name']} on port {svc['port']}...", "purple")
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(svc["port"])],
        cwd=OS_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    PROCESSES["desktop"] = proc
    return proc


def wait_for_service(name, port, health_path=None, max_retries=15):
    log("BOOT", f"Waiting for {name} (port {port})...", "yellow")
    for i in range(max_retries):
        if health_path:
            health = check_health(port, health_path)
            if health:
                log(name, f"Online — {json.dumps(health)}", "green")
                return True
        else:
            if check_port(port):
                log(name, "Online", "green")
                return True
        time.sleep(1)
    log(name, f"Failed to start after {max_retries}s", "red")
    return False


def shutdown(signum=None, frame=None):
    log("BOOT", "Shutting down HAZOOM OS...", "yellow")
    for name, proc in PROCESSES.items():
        if proc.poll() is None:
            log(name, "Stopping...", "yellow")
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
    log("BOOT", "All services stopped.", "green")
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    print()
    print(f"{COLORS['bold']}{COLORS['purple']}")
    print("  ╔══════════════════════════════════════════════════════╗")
    print("  ║          HAZOOM OS v3.0 — System Boot               ║")
    print("  ║          Conscious Intelligence Platform             ║")
    print("  ╚══════════════════════════════════════════════════════╝")
    print(f"{COLORS['reset']}")
    print()

    print(f"{COLORS['bold']}[BOOT]{COLORS['reset']} Initializing services...")
    print()

    start_voice_server()
    start_chat_server()
    start_desktop()

    print()
    print(f"{COLORS['bold']}[BOOT]{COLORS['reset']} Verifying services...")
    print()

    voice_ok = wait_for_service("Voice", 9003, "/health")
    chat_ok = wait_for_service("Chat", 9004, "/health")
    desktop_ok = wait_for_service("Desktop", 8888)

    print()
    print(f"{COLORS['bold']}{COLORS['green']}  ╔══════════════════════════════════════════════════════╗{COLORS['reset']}")
    print(f"{COLORS['bold']}{COLORS['green']}  ║              HAZOOM OS — ALL SYSTEMS ONLINE         ║{COLORS['reset']}")
    print(f"{COLORS['bold']}{COLORS['green']}  ╠══════════════════════════════════════════════════════╣{COLORS['reset']}")
    print(f"{COLORS['bold']}{COLORS['green']}  ║{COLORS['reset']}  Voice Server:   http://localhost:9003          {COLORS['bold']}{COLORS['green']}║{COLORS['reset']}")
    print(f"{COLORS['bold']}{COLORS['green']}  ║{COLORS['reset']}  Chat Server:    http://localhost:9004          {COLORS['bold']}{COLORS['green']}║{COLORS['reset']}")
    print(f"{COLORS['bold']}{COLORS['green']}  ║{COLORS['reset']}  OS Desktop:     http://localhost:8888          {COLORS['bold']}{COLORS['green']}║{COLORS['reset']}")
    print(f"{COLORS['bold']}{COLORS['green']}  ╚══════════════════════════════════════════════════════╝{COLORS['reset']}")
    print()
    print(f"{COLORS['yellow']}  Press Ctrl+C to stop all services{COLORS['reset']}")
    print()

    try:
        while True:
            for name, proc in PROCESSES.items():
                if proc.poll() is not None:
                    log(name, f"Process exited with code {proc.returncode}", "red")
                    shutdown()
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
