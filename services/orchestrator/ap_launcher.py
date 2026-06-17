#!/usr/bin/env python3
"""
Alpha Pony Launcher
Unified startup system for Alpha Pony Neural Interface

Philosophy: "Everything is connected and nothing comes from nothing"
"God doesn't play dice" - Einstein
Using the shared Hazoom Philosophy module with parallel computing
"""

import sys
import os
import json
import time
import subprocess
from pathlib import Path

from hazoom_philosophy import (
    CREATOR, VERSION, MANIFESTO, PRINCIPLES, LAWS,
    get_system_info, get_state_machine_info
)

SCRIPT_DIR = Path(__file__).parent

class AlphaPonyLauncher:
    def __init__(self):
        self.version = "3.0.0"
        self.components = {
            'pascal_core': SCRIPT_DIR / 'alpha.pas',
            'core_modules': SCRIPT_DIR / 'core',
            'neural_bridge': SCRIPT_DIR / 'neural_bridge.py',
            'knowledge_system': SCRIPT_DIR / 'knowledge_system.py',
            'secure_vault': SCRIPT_DIR / 'security' / 'secure_vault.py'
        }
        
    def check_environment(self):
        print("[Launcher] Checking Alpha Pony environment...")
        results = {}
        
        for name, path in self.components.items():
            exists = path.exists()
            results[name] = {'exists': exists, 'path': str(path)}
            status = "✓" if exists else "✗"
            print(f"  {status} {name}: {path}")
        
        return all(r['exists'] for r in results.values())
    
    def initialize_knowledge(self):
        print("\n[Launcher] Initializing knowledge system...")
        try:
            from knowledge_system import KnowledgeSystem
            ksys = KnowledgeSystem()
            ksys.load()
            status = ksys.get_system_status()
            print(f"  ✓ Knowledge loaded: {status['knowledge_concepts']} concepts")
            return True
        except Exception as e:
            print(f"  ✗ Knowledge init failed: {e}")
            return False
    
    def initialize_bridge(self):
        print("\n[Launcher] Initializing neural bridge...")
        try:
            from neural_bridge import NeuralBridge
            bridge = NeuralBridge()
            result = bridge.initialize()
            print(f"  ✓ Bridge initialized: v{result['version']}")
            return True
        except Exception as e:
            print(f"  ✗ Bridge init failed: {e}")
            return False
    
    def check_security(self):
        print("\n[Launcher] Checking security configuration...")
        vault_path = SCRIPT_DIR / 'security' / 'secure_config.json'
        if vault_path.exists():
            print("  ✓ Secure configuration found")
            return True
        else:
            print("  ⚠ No secure config found (run security/secure_vault.py setup)")
            return False
    
    def compile_pascal(self):
        print("\n[Launcher] Checking Pascal compilation...")
        exe_path = SCRIPT_DIR / 'alpha.exe'
        pas_path = SCRIPT_DIR / 'alpha.pas'
        
        if exe_path.exists() and pas_path.exists():
            if exe_path.stat().st_mtime > pas_path.stat().st_mtime:
                print(f"  ✓ alpha.exe is up to date")
                return True
        
        print(f"  ℹ alpha.exe may need recompilation")
        print(f"    Run: fpc alpha.pas -Mobjfpc -Sh")
        return True
    
    def start_neural_interface(self):
        print("\n[Launcher] Starting Alpha Pony Neural Interface...")
        print("=" * 60)
        print("  ALPHA PONY v{} - Neural Interface".format(self.version))
        print("  Unified Core: Aether + Neural + Consciousness")
        print("=" * 60)
        
        exe_path = SCRIPT_DIR / 'alpha.exe'
        if exe_path.exists():
            print("\n[Launcher] Launching Pascal interface...")
            try:
                subprocess.Popen([str(exe_path)])
                return True
            except Exception as e:
                print(f"  ✗ Launch failed: {e}")
                return False
        else:
            print(f"  ℹ Run Pascal compilation to generate alpha.exe")
            return False
    
    def start_python_mode(self):
        print("\n[Launcher] Starting Python neural mode...")
        print("Type 'help' for commands, 'exit' to quit\n")
        
        from neural_bridge import NeuralBridge
        from knowledge_system import KnowledgeSystem
        
        bridge = NeuralBridge()
        bridge.initialize()
        knowledge = KnowledgeSystem()
        knowledge.load()
        
        print("Neural Bridge v{} initialized".format(bridge.get_status()['version']))
        print("Knowledge System ready with {} concepts\n".format(
            knowledge.knowledge_graph.node_count))
        
        while True:
            try:
                user_input = input("Alpha Pony> ").strip()
                
                if not user_input:
                    continue
                elif user_input.lower() in ['exit', 'quit']:
                    print("Saving state...")
                    knowledge.save()
                    bridge.save_state()
                    break
                elif user_input.lower() == 'help':
                    print("Commands:")
                    print("  think [query]    - Process a thought")
                    print("  deep [query]     - Deep analysis")
                    print("  learn [info]     - Learn new information")
                    print("  remember [query] - Search memories")
                    print("  status           - System status")
                    print("  exit             - Save and exit")
                elif user_input.lower().startswith('think '):
                    query = user_input[6:]
                    result = bridge.think(query)
                    print(f"Thinking: {result.get('response', 'Processing...')}")
                elif user_input.lower().startswith('deep '):
                    query = user_input[5:]
                    result = bridge.deep_analyze(query)
                    print(f"Analysis confidence: {result.get('confidence', 0):.0%}")
                elif user_input.lower().startswith('learn '):
                    info = user_input[6:]
                    knowledge.learn(info)
                    print(f"Learned: {info[:50]}...")
                elif user_input.lower().startswith('remember '):
                    query = user_input[9:]
                    result = knowledge.remember(query)
                    print(f"Found {len(result['episodic'])} memories")
                elif user_input.lower() == 'status':
                    print(bridge.get_status())
                else:
                    result = bridge.think(user_input)
                    print(f"Processing: {result.get('response', '...')}")
                    
            except KeyboardInterrupt:
                print("\nSaving state...")
                knowledge.save()
                break
            except Exception as e:
                print(f"Error: {e}")
        
        print("Alpha Pony saved and ready.")
        return True
    
    def run(self, mode='auto'):
        print("\n" + "=" * 60)
        print("  A L P H A   P O N Y   N E U R A L   I N T E R F A C E")
        print(f"  Version {self.version}")
        print("=" * 60 + "\n")
        
        if not self.check_environment():
            print("[ERROR] Missing required components")
            return False
        
        self.check_security()
        self.compile_pascal()
        self.initialize_bridge()
        self.initialize_knowledge()
        
        if mode == 'pascal':
            self.start_neural_interface()
        elif mode == 'python':
            self.start_python_mode()
        else:
            self.start_python_mode()
        
        return True


def main():
    launcher = AlphaPonyLauncher()
    
    mode = 'auto'
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg in ['pascal', 'python', 'auto']:
            mode = arg
        elif arg == '--help':
            print("Alpha Pony Launcher")
            print("Usage: python launcher.py [mode]")
            print("Modes: pascal, python, auto (default)")
            return
    
    launcher.run(mode)


if __name__ == '__main__':
    main()
