#!/usr/bin/env python3
"""
HAZOOM OS V3 — Unified Boot System
Copyright © 2024-2026 Hazem Soussi. All Rights Reserved.
"""

import os
import sys
import json
import time
import signal
import subprocess
import threading
from pathlib import Path
from typing import Dict, List, Optional

BASE_DIR = Path(__file__).parent
CONFIG_DIR = BASE_DIR / "config"
CORE_DIR = BASE_DIR / "core"
SERVICES_DIR = BASE_DIR / "services"
APPS_DIR = BASE_DIR / "apps"
KERNEL_DIR = BASE_DIR / "kernel"
SECURITY_DIR = BASE_DIR / "security"

class HAZOOMBoot:
    def __init__(self):
        self.version = "3.0.0"
        self.name = "HAZOOM OS"
        self.subtitle = "AI-Powered Workspace"
        self.services = {}
        self.pids = {}
        self.running = False
        self.start_time = None

    def print_banner(self):
        print("=" * 70)
        print(f"  {self.name} v{self.version} -- {self.subtitle}")
        print(f"  Creator: Hazem Soussi")
        print("=" * 70)
        print()

    def print_step(self, message: str, success: bool = True):
        symbol = "OK" if success else "FAIL"
        print(f"  [{symbol}] {message}")

    def start_python_service(self, name: str, script_path: Path, port: int = None) -> bool:
        if not script_path.exists():
            self.print_step(f"{name} (script not found: {script_path})", False)
            return False
        try:
            env = os.environ.copy()
            env["PYTHONPATH"] = str(BASE_DIR)
            cmd = [sys.executable, str(script_path)]
            process = subprocess.Popen(
                cmd, env=env,
                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                cwd=str(script_path.parent)
            )
            self.pids[name] = process.pid
            self.services[name] = {"process": process, "port": port, "path": str(script_path)}
            self.print_step(f"{name} (PID: {process.pid}, port: {port})")
            return True
        except Exception as e:
            self.print_step(f"{name} (error: {e})", False)
            return False

    def start_node_service(self, name: str, script_path: Path, port: int = None) -> bool:
        if not script_path.exists():
            self.print_step(f"{name} (script not found: {script_path})", False)
            return False
        try:
            cmd = ["node", str(script_path)]
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                cwd=str(script_path.parent)
            )
            self.pids[name] = process.pid
            self.services[name] = {"process": process, "port": port, "path": str(script_path)}
            self.print_step(f"{name} (PID: {process.pid}, port: {port})")
            return True
        except Exception as e:
            self.print_step(f"{name} (error: {e})", False)
            return False

    def boot_services(self):
        print()
        print("  +--------------------------------------------------------------+")
        print("  |  SERVICE BOOT                                                |")
        print("  +--------------------------------------------------------------+")

        # 1. Unified API Gateway (port 8080)
        self.start_python_service(
            "unified-api",
            SERVICES_DIR / "api-gateway" / "unified_server.py",
            port=8080
        )

        # 2. AI Chat Server (port 9004) -- Ollama-backed
        self.start_python_service(
            "chat-server",
            SERVICES_DIR / "orchestrator" / "chat_server.py",
            port=9004
        )

        # 3. Local AI Agent
        self.start_python_service(
            "local-agent",
            SERVICES_DIR / "orchestrator" / "local_agent.py"
        )

        # 4. AlphaPony AI
        self.start_python_service(
            "alpha-pony-ai",
            SERVICES_DIR / "ai" / "alpha_pony.py"
        )

        # 5. WebSocket Server
        self.start_python_service(
            "websocket",
            SERVICES_DIR / "api-gateway" / "websocket_server.py"
        )

        # 6. Event Bus
        self.start_python_service(
            "event-bus",
            SERVICES_DIR / "reactive" / "event_bus.py"
        )

        # 7. Content Filter (port 8081)
        self.start_node_service(
            "content-filter",
            SECURITY_DIR / "content_filter.js",
            port=8081
        )

        # 8. Component Scanner (port 8888) -- Node.js
        self.start_node_service(
            "component-scanner",
            APPS_DIR / "tools" / "component-scanner" / "server.js",
            port=8888
        )

        # 9. Pascal Kernel (port 8089) -- Mind Web Interface
        self.start_python_service(
            "pascal-kernel",
            KERNEL_DIR / "mind_web_interface.py",
            port=8089
        )

        # 10. Voice Server (port 9003) -- Edge TTS
        voice_script = APPS_DIR / "games" / "cartoon-episode" / "voice_server.py"
        if voice_script.exists():
            self.start_python_service(
                "voice-server",
                voice_script,
                port=9003
            )

    def boot_web_ui(self):
        print()
        print("  +--------------------------------------------------------------+")
        print("  |  WEB UI                                                     |")
        print("  +--------------------------------------------------------------+")

        index = BASE_DIR / "index.html"
        if index.exists():
            self.print_step(f"Main UI: {index}")
        else:
            self.print_step("Main UI (index.html not found)", False)

        # Count apps across all categories
        app_count = 0
        for category in ["core-apps", "ai-apps", "tools", "games", "visualizers", "docs"]:
            cat_dir = APPS_DIR / category
            if cat_dir.exists():
                app_count += len(list(cat_dir.glob("*.html")))
        self.print_step(f"Apps available: {app_count}")

    def print_system_status(self):
        print()
        print("=" * 70)
        print(f"  {self.name} v{self.version} -- FULLY BOOTED")
        print("=" * 70)
        print(f"  Services: {len(self.services)} running")
        if self.pids:
            for name, pid in self.pids.items():
                port = self.services.get(name, {}).get("port", "")
                port_str = f":{port}" if port else ""
                print(f"    - {name} (PID {pid}{port_str})")
        print()
        print("  Access points:")
        print("    Desktop OS:   http://127.0.0.1:3000/os")
        print("    Landing page:  http://127.0.0.1:3000/")
        print("    Health check:  http://127.0.0.1:3000/health")
        print("    Chat API:      http://127.0.0.1:9004")
        print("    Unified API:   http://127.0.0.1:8080/api/status")
        print()

    def shutdown(self, signum=None, frame=None):
        print("\n\n  Shutting down HAZOOM OS...")
        for name, pid in self.pids.items():
            try:
                os.kill(pid, signal.SIGTERM)
                print(f"  Stopped {name} (PID: {pid})")
            except ProcessLookupError:
                print(f"  {name} already stopped")
            except Exception as e:
                print(f"  Error stopping {name}: {e}")
        print("  Goodbye.")
        sys.exit(0)

    def boot(self):
        signal.signal(signal.SIGINT, self.shutdown)
        signal.signal(signal.SIGTERM, self.shutdown)

        self.print_banner()
        self.start_time = time.time()

        print("  Initializing boot sequence...\n")

        # Step 1: Start backend services
        self.boot_services()

        # Step 2: Boot web UI
        self.boot_web_ui()

        # Step 3: Print status
        self.print_system_status()

        self.running = True
        print("  Press Ctrl+C to shutdown.\n")

        # Keep running
        try:
            while self.running:
                time.sleep(1)
                uptime = int(time.time() - self.start_time)
                sys.stdout.write(f"\r  Uptime: {uptime}s | Services: {len(self.services)}")
                sys.stdout.flush()
        except KeyboardInterrupt:
            self.shutdown()


def main():
    boot = HAZOOMBoot()
    boot.boot()


if __name__ == "__main__":
    main()
