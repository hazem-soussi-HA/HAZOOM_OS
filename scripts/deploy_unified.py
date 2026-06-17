#!/usr/bin/env python3
"""
Alpha Pony Unified Deployment Script
Deploy all components with proper configuration
"""

import os
import sys
import json
import subprocess
import time
from pathlib import Path
from typing import Dict, List, Any

class UnifiedDeployer:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.config_file = self.project_root / "config" / "deployment.json"
        self.processes = {}
        self.load_config()
    
    def load_config(self):
        """Load deployment configuration"""
        if self.config_file.exists():
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
        else:
            self.config = self._create_default_config()
            self.save_config()
    
    def _create_default_config(self) -> Dict:
        """Create default deployment configuration"""
        return {
            "environment": "development",
            "services": {
                "unified_server": {
                    "enabled": True,
                    "port": 8080,
                    "host": "0.0.0.0",
                    "script": "services/api_gateway/unified_server.py"
                },
                "auth_server": {
                    "enabled": False,  # Disabled in favor of unified server
                    "port": 8081,
                    "script": "alpha_auth.py"
                },
                "neural_bridge": {
                    "enabled": True,
                    "script": "neural_bridge.py"
                },
                "pascal_core": {
                    "enabled": False,  # Optional for advanced users
                    "executable": "alpha.exe"
                }
            },
            "features": {
                "google_oauth": {
                    "enabled": False,
                    "client_id": "",
                    "client_secret": "",
                    "redirect_uri": "http://localhost:8080/auth/callback"
                },
                "crypto": {
                    "enabled": True,
                    "default_network": "sepolia",
                    "infura_project_id": ""
                },
                "neural": {
                    "enabled": True,
                    "model_path": "models/",
                    "knowledge_path": "knowledge/"
                }
            },
            "security": {
                "encryption_enabled": True,
                "session_timeout": 3600,
                "cors_origins": ["http://localhost:8080", "http://127.0.0.1:8080"]
            }
        }
    
    def save_config(self):
        """Save deployment configuration"""
        os.makedirs(self.config_file.parent, exist_ok=True)
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def check_dependencies(self) -> List[str]:
        """Check if required dependencies are available"""
        missing = []
        
        # Check Python packages
        required_packages = [
            'flask', 'requests', 'cryptography', 'web3', 'google-auth',
            'google-auth-oauthlib', 'google-auth-httplib2'
        ]
        
        for package in required_packages:
            try:
                __import__(package.replace('-', '_'))
            except ImportError:
                missing.append(package)
        
        # Check Pascal compiler (optional)
        pascal_available = False
        try:
            result = subprocess.run(['fpc', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                pascal_available = True
        except FileNotFoundError:
            pass
        
        if not pascal_available and self.config["services"]["pascal_core"]["enabled"]:
            missing.append("Free Pascal Compiler (fpc)")
        
        return missing
    
    def install_dependencies(self):
        """Install missing dependencies"""
        missing = self.check_dependencies()
        
        if not missing:
            print("✓ All dependencies are available")
            return True
        
        print(f"Installing missing dependencies: {missing}")
        
        python_packages = [pkg for pkg in missing if not pkg.startswith("Free")]
        if python_packages:
            cmd = [sys.executable, "-m", "pip", "install"] + python_packages
            print(f"Running: {' '.join(cmd)}")
            
            try:
                subprocess.run(cmd, check=True)
                print("Python dependencies installed")
            except subprocess.CalledProcessError as e:
                print(f"✗ Failed to install Python dependencies: {e}")
                return False
        
        if "Free Pascal Compiler (fpc)" in missing:
            print("⚠ Free Pascal Compiler not found. Please install from:")
            print("   https://www.freepascal.org/download.html")
            print("   Or use: winget install FreePascal")
        
        return True
    
    def setup_environment(self):
        """Setup environment variables and configuration files"""
        print("Setting up environment...")
        
        # Create necessary directories
        dirs_to_create = [
            "config", "logs", "data", "models", "knowledge", "static"
        ]
        
        for dir_name in dirs_to_create:
            dir_path = self.project_root / dir_name
            dir_path.mkdir(exist_ok=True)
            print(f"  {dir_path}")
        
        # Setup Google OAuth config if enabled
        if self.config["features"]["google_oauth"]["enabled"]:
            google_config = {
                "client_id": self.config["features"]["google_oauth"]["client_id"],
                "client_secret": self.config["features"]["google_oauth"]["client_secret"],
                "redirect_uri": self.config["features"]["google_oauth"]["redirect_uri"],
                "scopes": [
                    "openid",
                    "https://www.googleapis.com/auth/userinfo.email",
                    "https://www.googleapis.com/auth/userinfo.profile"
                ]
            }
            
            google_config_file = self.project_root / "config" / "google_oauth.json"
            with open(google_config_file, 'w') as f:
                json.dump(google_config, f, indent=2)
            print(f"  Google OAuth config created")
        
        # Setup crypto config
        if self.config["features"]["crypto"]["enabled"]:
            crypto_config = {
                "default_network": self.config["features"]["crypto"]["default_network"],
                "networks": {
                    "mainnet": {
                        "rpc_url": f"https://mainnet.infura.io/v3/{self.config['features']['crypto']['infura_project_id']}",
                        "chain_id": 1
                    },
                    "sepolia": {
                        "rpc_url": f"https://sepolia.infura.io/v3/{self.config['features']['crypto']['infura_project_id']}",
                        "chain_id": 11155111
                    },
                    "polygon": {
                        "rpc_url": "https://polygon-rpc.com",
                        "chain_id": 137
                    }
                },
                "gas_limit": 21000,
                "gas_price_gwei": 20,
                "supported_currencies": ["ETH", "USDC", "USDT", "MATIC"]
            }
            
            crypto_config_file = self.project_root / "config" / "crypto_config.json"
            with open(crypto_config_file, 'w') as f:
                json.dump(crypto_config, f, indent=2)
            print(f"  Crypto config created")
        
        # Create .env file
        env_content = f"""# Alpha Pony Environment Configuration
ALPHA_PONY_ENV={self.config['environment']}
ALPHA_PONY_PORT={self.config['services']['unified_server']['port']}
ALPHA_PONY_HOST={self.config['services']['unified_server']['host']}

# Google OAuth (if enabled)
GOOGLE_CLIENT_ID={self.config['features']['google_oauth']['client_id']}
GOOGLE_CLIENT_SECRET={self.config['features']['google_oauth']['client_secret']}

# Crypto (if enabled)
INFURA_PROJECT_ID={self.config['features']['crypto']['infura_project_id']}
DEFAULT_CRYPTO_NETWORK={self.config['features']['crypto']['default_network']}

# Security
SESSION_TIMEOUT={self.config['security']['session_timeout']}
ENCRYPTION_ENABLED={self.config['security']['encryption_enabled']}
"""
        
        env_file = self.project_root / ".env"
        with open(env_file, 'w') as f:
            f.write(env_content)
        print(f"  Environment file created")
    
    def compile_pascal(self) -> bool:
        """Compile Pascal core if enabled"""
        if not self.config["services"]["pascal_core"]["enabled"]:
            return True
        
        print("Compiling Pascal core...")
        
        pas_file = self.project_root / "alpha.pas"
        exe_file = self.project_root / "alpha.exe"
        
        if not pas_file.exists():
            print("  ⚠ alpha.pas not found, skipping Pascal compilation")
            return False
        
        # Check if recompilation is needed
        if exe_file.exists():
            exe_mtime = exe_file.stat().st_mtime
            pas_mtime = pas_file.stat().st_mtime
            if exe_mtime > pas_mtime:
                print("  alpha.exe is up to date")
                return True
        
        # Compile
        cmd = ["fpc", str(pas_file), "-Mobjfpc", "-Sh"]
        print(f"  Running: {' '.join(cmd)}")
        
        try:
            result = subprocess.run(cmd, cwd=self.project_root, capture_output=True, text=True)
            if result.returncode == 0:
                print("  Pascal compilation successful")
                return True
            else:
                print(f"  ✗ Pascal compilation failed: {result.stderr}")
                return False
        except FileNotFoundError:
            print("  ✗ Free Pascal Compiler not found")
            return False
    
    def start_services(self) -> bool:
        """Start all enabled services"""
        print("Starting services...")
        
        # Start unified server
        if self.config["services"]["unified_server"]["enabled"]:
            script_path = self.project_root / self.config["services"]["unified_server"]["script"]
            if script_path.exists():
                cmd = [sys.executable, str(script_path)]
                print(f"  Starting unified server on port {self.config['services']['unified_server']['port']}")
                
                try:
                    process = subprocess.Popen(cmd, cwd=self.project_root)
                    self.processes["unified_server"] = process
                    print(f"  Unified server started (PID: {process.pid})")
                except Exception as e:
                    print(f"  Failed to start unified server: {e}")
                    return False
            else:
                print(f"  Unified server script not found: {script_path}")
                return False
        
        # Start auth server (legacy, disabled by default)
        if self.config["services"]["auth_server"]["enabled"]:
            script_path = self.project_root / self.config["services"]["auth_server"]["script"]
            if script_path.exists():
                cmd = [sys.executable, str(script_path)]
                print(f"  Starting auth server on port {self.config['services']['auth_server']['port']}")
                
                try:
                    process = subprocess.Popen(cmd, cwd=self.project_root)
                    self.processes["auth_server"] = process
                    print(f"  Auth server started (PID: {process.pid})")
                except Exception as e:
                    print(f"  Failed to start auth server: {e}")
                    return False
        
        return True
    
    def stop_services(self):
        """Stop all running services"""
        print("Stopping services...")
        
        for service_name, process in self.processes.items():
            if process.poll() is None:  # Process is still running
                print(f"  Stopping {service_name} (PID: {process.pid})")
                process.terminate()
                
                # Wait for process to stop
                try:
                    process.wait(timeout=5)
                    print(f"  {service_name} stopped")
                except subprocess.TimeoutExpired:
                    print(f"  Force killing {service_name}")
                    process.kill()
                    process.wait()
        
        self.processes.clear()
    
    def check_services(self) -> Dict[str, bool]:
        """Check status of all services"""
        status = {}
        
        for service_name, process in self.processes.items():
            if process.poll() is None:
                status[service_name] = True
            else:
                status[service_name] = False
        
        return status
    
    def deploy(self) -> bool:
        """Full deployment process"""
        print("=" * 60)
        print("  ALPHA PONY UNIFIED DEPLOYMENT")
        print("=" * 60)
        
        # Step 1: Check dependencies
        print("\n[1/5] Checking dependencies...")
        if not self.install_dependencies():
            print("✗ Dependency installation failed")
            return False
        
        # Step 2: Setup environment
        print("\n[2/5] Setting up environment...")
        self.setup_environment()
        
        # Step 3: Compile Pascal (if enabled)
        print("\n[3/5] Compiling components...")
        if not self.compile_pascal():
            print("⚠ Pascal compilation failed, continuing without it")
        
        # Step 4: Start services
        print("\n[4/5] Starting services...")
        if not self.start_services():
            print("✗ Service startup failed")
            return False
        
        # Step 5: Verify deployment
        print("\n[5/5] Verifying deployment...")
        time.sleep(2)  # Give services time to start
        status = self.check_services()
        
        all_running = all(status.values())
        if all_running:
            print("All services are running")
            print(f"\nAlpha Pony is live!")
            print(f"   Web Interface: http://localhost:{self.config['services']['unified_server']['port']}")
            print(f"   Environment: {self.config['environment']}")
            return True
        else:
            print("Some services failed to start:")
            for service, running in status.items():
                status_text = "running" if running else "stopped"
                print(f"   {service}: {status_text}")
            return False
    
    def show_status(self):
        """Show current deployment status"""
        print("=" * 60)
        print("  ALPHA PONY DEPLOYMENT STATUS")
        print("=" * 60)
        
        print(f"\nEnvironment: {self.config['environment']}")
        print(f"Project Root: {self.project_root}")
        
        print("\nServices:")
        for service_name, service_config in self.config["services"].items():
            status = "enabled" if service_config["enabled"] else "disabled"
            if service_name in self.processes:
                process = self.processes[service_name]
                if process.poll() is None:
                    status += " (running)"
                else:
                    status += " (stopped)"
            print(f"  {service_name}: {status}")
        
        print("\nDependencies:")
        missing = self.check_dependencies()
        if missing:
            print(f"  Missing: {missing}")
        else:
            print("  All dependencies available")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Alpha Pony Unified Deployment")
    parser.add_argument("action", choices=["deploy", "stop", "status", "setup"], 
                       help="Action to perform")
    parser.add_argument("--config", help="Path to config file")
    parser.add_argument("--env", choices=["development", "production"], 
                       default="development", help="Environment")
    
    args = parser.parse_args()
    
    deployer = UnifiedDeployer()
    
    if args.env != deployer.config["environment"]:
        deployer.config["environment"] = args.env
        deployer.save_config()
    
    if args.action == "deploy":
        success = deployer.deploy()
        sys.exit(0 if success else 1)
    elif args.action == "stop":
        deployer.stop_services()
        print("All services stopped")
    elif args.action == "status":
        deployer.show_status()
    elif args.action == "setup":
        print("Setting up environment...")
        deployer.install_dependencies()
        deployer.setup_environment()
        deployer.compile_pascal()
        print("Setup complete")

if __name__ == "__main__":
    main()
