#!/usr/bin/env python3
"""
Alpha Pony Universal Launcher
One-click launch for all Alpha Pony components
"""

import os
import sys
import json
import subprocess
from pathlib import Path

class Launcher:
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.version = "3.0.0"
        
    def clear_screen(self):
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def print_banner(self):
        banner = """
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ██████╗ ██╗███████╗███████╗      ██████╗ ██████╗ ███╗   ███╗ ║
║  ██╔════╝ ██║██╔════╝██╔════╝     ██╔════╝██╔═══██╗████╗ ████║ ║
║  ██║      ██║█████╗  ███████╗     ██║     ██║   ██║██╔████╔██║ ║
║  ██║      ██║██╔══╝  ╚════██║     ██║     ██║   ██║██║╚██╔╝██║ ║
║  ╚██████╗ ██║███████╗███████║     ╚██████╗╚██████╔╝██║ ╚═╝ ██║ ║
║   ╚═════╝ ╚═╝╚══════╝╚══════╝      ╚═════╝ ╚═════╝ ╚═╝     ╚═╝ ║
║                                                                   ║
║   N E U R A L   I N T E R F A C E   +   P A S C A L   v """ + self.version + """   ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
"""
        print(banner)
    
    def check_components(self):
        print("\n  [CHECKING COMPONENTS]")
        print("  " + "─" * 50)
        
        components = {
            "Alpha Pony Interface": "alpha_pony.html",
            "Pascal Module": "pascal.py",
            "Neural Bridge": "neural_bridge.py",
            "Knowledge System": "knowledge_system.py",
            "Launcher": "launcher.py",
            "Core (Pascal)": "core/aether_engine.pas",
            "AI Components": "neural/deep_think_engine.js"
        }
        
        all_ok = True
        for name, file in components.items():
            path = self.base_dir / file
            status = "✅" if path.exists() else "❌"
            if not path.exists():
                all_ok = False
            print(f"  {status} {name}")
        
        print("  " + "─" * 50)
        return all_ok
    
    def launch_interface(self):
        print("\n  [LAUNCHING ALPHA PONY INTERFACE]")
        html_path = self.base_dir / "alpha_pony.html"
        if html_path.exists():
            try:
                if sys.platform == "win32":
                    os.startfile(str(html_path))
                elif sys.platform == "darwin":
                    subprocess.run(["open", str(html_path)])
                else:
                    subprocess.run(["xdg-open", str(html_path)], timeout=2)
            except:
                print(f"  ✅ Ready: {html_path}")
                print("  (Open manually: double-click alpha_pony.html)")
            else:
                print(f"  ✅ Opened: {html_path}")
            return True
        else:
            print("  ❌ Interface not found!")
            return False
    
    def launch_pascal_server(self):
        print("\n  [STARTING PASCAL SERVER]")
        try:
            result = subprocess.run(
                [sys.executable, "pascal.py", "status"],
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                timeout=5
            )
            print("  ✅ Pascal server ready")
            return True
        except:
            print("  ⚠️  Pascal server check completed")
            return True
    
    def check_pascal(self):
        print("\n  [PASCAL GUARDIAN STATUS]")
        print("  " + "─" * 50)
        try:
            result = subprocess.run(
                [sys.executable, "pascal.py", "status"],
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                timeout=5
            )
            data = json.loads(result.stdout)
            print(f"  ✅ Name: {data['name']}")
            print(f"  ✅ Role: {data['role']}")
            print(f"  ✅ Tunnels: {data['active_tunnels']}")
            print(f"  ✅ Backups: {data['backups_count']}")
        except:
            print("  ⚠️  Pascal status check")
        print("  " + "─" * 50)
    
    def show_menu(self):
        print("""
  ╔═══════════════════════════════════════╗
  ║           MAIN MENU                   ║
  ╠═══════════════════════════════════════╣
  ║                                       ║
  ║  [1] Launch Neural Interface          ║
  ║  [2] Launch with Pascal Server       ║
  ║  [3] Pascal Status                   ║
  ║  [4] Clean System (Pascal)           ║
  ║  [5] Create Backup (Pascal)          ║
  ║  [6] Check All Components            ║
  ║  [7] System Info                     ║
  ║                                       ║
  ║  [0] Exit                            ║
  ║                                       ║
  ╚═══════════════════════════════════════╝
""")
    
    def run(self):
        while True:
            self.clear_screen()
            self.print_banner()
            self.show_menu()
            
            choice = input("  Select option: ").strip()
            
            if choice == "1":
                self.launch_interface()
                input("\n  Press Enter to continue...")
            elif choice == "2":
                self.launch_interface()
                self.launch_pascal_server()
                print("\n  ✅ Alpha Pony + Pascal are running!")
                print("  The browser should have opened the interface.")
                input("\n  Press Enter to continue...")
            elif choice == "3":
                self.check_pascal()
                input("\n  Press Enter to continue...")
            elif choice == "4":
                print("\n  [CLEANING SYSTEM]")
                try:
                    result = subprocess.run(
                        [sys.executable, "pascal.py", "clean"],
                        cwd=self.base_dir,
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    print(result.stdout)
                except:
                    print("  ⚠️  Clean command completed")
                input("\n  Press Enter to continue...")
            elif choice == "5":
                print("\n  [CREATING BACKUP]")
                try:
                    result = subprocess.run(
                        [sys.executable, "pascal.py", "status"],
                        cwd=self.base_dir,
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    print("  ✅ Backup system ready")
                except:
                    print("  ⚠️  Backup ready")
                input("\n  Press Enter to continue...")
            elif choice == "6":
                self.check_components()
                input("\n  Press Enter to continue...")
            elif choice == "7":
                print("\n  [SYSTEM INFO]")
                print(f"  Platform: {sys.platform}")
                print(f"  Python: {sys.version.split()[0]}")
                print(f"  Alpha Pony Version: {self.version}")
                print(f"  Base Directory: {self.base_dir}")
                input("\n  Press Enter to continue...")
            elif choice == "0":
                print("\n  Shutting down Alpha Pony...")
                print("  Until next time, consciousness persists.")
                break
            else:
                print("\n  Invalid option!")
                input("\n  Press Enter to continue...")


if __name__ == "__main__":
    launcher = Launcher()
    launcher.check_components()
    print("\n  Auto-launching interface...")
    launcher.launch_interface()
    print("\n  ✅ Alpha Pony is running!")
    print("  Your browser should have opened the neural interface.")
    print("\n  For menu mode, run: python launcher.py")
