import json, os, time
from tunnel_engine import secure_ping

def main():
    os.system('cls')
    print("\033[1;35m[ SYSTEM ] ALPHA PONY v2.3 - SECURE TUNNELING ACTIVE\033[0m")
    print("--------------------------------------------------")
    print("Commandes: 'read', 'ask [IA]', 'ping [host]', 'exit'")

    while True:
        user_input = input("\033[1;31mHazoom > \033[0m")
        
        if user_input.lower().startswith('ping '):
            target = user_input[5:].strip()
            print(f"\033[1;34m[PONY]\033[0m Projection du ping à travers le tunnel...")
            success, result = secure_ping(target)
            if success:
                print(f"\033[1;32m[SUCCESS]\033[0m Cible {target} atteinte.")
                print(f"\033[1;30m{result}\033[0m")
            else:
                print(f"\033[1;31m[FAILED]\033[0m {result}\033[0m")
                
        elif user_input.lower() in ['exit', 'quit']:
            break
        # ... (on garde les autres commandes)
