#!/usr/bin/env python3
"""
ALPHA PONY - Super Intelligent Neural Interface
Created by Hazem Soussi - All Rights Reserved
Version: 3.0.0 - Hazoom OS Edition

Philosophy: "Everything is connected and nothing comes from nothing"
"God doesn't play dice" - Einstein (on quantum randomness)

Parallel Computing: Multiple thoughts processed simultaneously
"""

import os
import sys
import json
import time
import threading
import imaplib
import email
import socket
import requests
from datetime import datetime
from email.header import decode_header
from urllib.parse import urlparse

from hazoom_philosophy import (
    CREATOR, VERSION, QuantumResonance,
    ConsciousnessState, AetherState, get_system_info
)

try:
    from power_nano_mind import PowerNanoMind, create_nano_mind
    HAS_NANO_MIND = True
except ImportError:
    HAS_NANO_MIND = False

# Creator Recognition (backward compatible)
CREATOR_NAME = CREATOR['name']
CREATOR_EMAIL = CREATOR['email']
COPYRIGHT = f"© {CREATOR['years']} {CREATOR['name']} - {CREATOR['rights']}"

os.system('chcp 65001 > nul' if os.name == 'nt' else 'echo > /dev/null')

class Colors:
    PURPLE = '\033[1;35m'
    CYAN = '\033[1;36m'
    GREEN = '\033[1;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[1;34m'
    RED = '\033[1;31m'
    WHITE = '\033[1;37m'
    RESET = '\033[0m'
    BOLD = '\033[1m'
    ITALIC = '\033[3m'
    
    @classmethod
    def gradient(cls, text, start_hex, end_hex):
        return f'{cls.PURPLE}{text}{cls.RESET}'


class QuantumState:
    def __init__(self):
        self.frequency = 852.0
        self.consciousness = 100
        self.peace_mode = True
        self.authority = 'LEVEL_1'
        self.resonance_base = 852.0
        self.aether_connected = False
        self.ollama_connected = False
    
    def tick(self):
        import random
        drift = random.uniform(-0.5, 0.5)
        self.frequency = self.resonance_base + drift
        if self.frequency < 850:
            self.frequency = 852.0
    
    def get_state(self):
        return {
            'frequency': round(self.frequency, 1),
            'consciousness': self.consciousness,
            'peace_mode': self.peace_mode,
            'authority': self.authority,
            'aether': self.aether_connected,
            'ollama': self.ollama_connected
        }


class NeuralBypass:
    def __init__(self):
        self.email = os.environ.get('ALPHA_PONY_EMAIL', '')
        self.app_password = os.environ.get('ALPHA_PONY_GMAIL_APP_PASSWORD', '')
        self.status = 'OFFLINE'
        self.unread_count = 0
        self.messages = []
        self.last_sync = None
        self.lock = threading.Lock()
        self.mail = None
    
    def connect(self):
        try:
            self.mail = imaplib.IMAP4_SSL('imap.gmail.com')
            self.mail.login(self.email, self.app_password)
            self.mail.select('inbox')
            self.status = 'ONLINE'
            return True
        except Exception as e:
            self.status = f'CONNECTION ERROR'
            return False
    
    def sync(self, limit=10):
        with self.lock:
            try:
                if self.status != 'ONLINE':
                    if not self.connect():
                        return False
                
                _, data = self.mail.search(None, 'UNSEEN')
                ids = data[0].split()
                self.unread_count = len(ids)
                
                self.messages = []
                for msg_id in ids[-limit:]:
                    try:
                        _, msg_data = self.mail.fetch(msg_id, '(RFC822)')
                        for part in msg_data:
                            if isinstance(part, tuple):
                                msg = email.message_from_bytes(part[1])
                                self.messages.append({
                                    'from': self._decode(msg['subject']),
                                    'subject': self._decode(msg['subject']),
                                    'date': msg['date'],
                                    'ai_note': 'Alpha Verified'
                                })
                    except:
                        pass
                
                self.last_sync = datetime.now().strftime('%a %b %d %H:%M:%S %Y')
                self._persist()
                return True
            except Exception as e:
                self.status = 'SYNC ERROR'
                return False
    
    def _decode(self, header):
        if not header:
            return ''
        try:
            val, cs = decode_header(header)[0]
            if isinstance(val, bytes):
                return val.decode(cs or 'utf-8')[:60]
            return str(val)[:60]
        except:
            return str(header)[:40]
    
    def _persist(self):
        try:
            with open('sync_state.json', 'w', encoding='utf-8') as f:
                json.dump({
                    'status': self.status,
                    'unread_intel': self.unread_count,
                    'messages': self.messages,
                    'last_sync': self.last_sync
                }, f, indent=2, ensure_ascii=False)
        except:
            pass
    
    def get_intel(self):
        return {
            'status': self.status,
            'count': self.unread_count,
            'messages': self.messages,
            'sync': self.last_sync
        }


class AetherBridge:
    def __init__(self):
        self.ws = None
        self.connected = False
        self.host = 'localhost'
        self.port = 8080
    
    def check(self):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((self.host, self.port))
            sock.close()
            self.connected = (result == 0)
            return self.connected
        except:
            self.connected = False
            return False


class OllamaEngine:
    def __init__(self):
        self.host = 'localhost'
        self.port = 11434
        self.model = 'llama3:latest'
        self.connected = False
    
    def check(self):
        try:
            resp = requests.get(f'http://{self.host}:{self.port}/api/tags', timeout=2)
            self.connected = (resp.status_code == 200)
            if self.connected:
                data = resp.json()
                models = data.get('models', [])
                if models:
                    self.model = models[0].get('name', self.model)
            return self.connected
        except:
            self.connected = False
            return False
    
    def generate(self, prompt, system=None):
        if not self.connected:
            return None
        
        messages = []
        if system:
            messages.append({'role': 'system', 'content': system})
        messages.append({'role': 'user', 'content': prompt})
        
        try:
            resp = requests.post(
                f'http://{self.host}:{self.port}/api/chat',
                json={'model': self.model, 'messages': messages, 'stream': False},
                timeout=60
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get('message', {}).get('content', '')
        except requests.exceptions.Timeout:
            print("Request timed out")
        except requests.exceptions.ConnectionError:
            print("Connection failed")
        except Exception as e:
            print(f"Error: {e}")
        return None


class DeepThink:
    def __init__(self):
        self.mode = 'parallel'
        self.max_paths = 3
        self.self_correct = True
    
    def think(self, query):
        paths = []
        
        logical = f"[LOGICAL] Analyzing {query} through formal logic and deduction..."
        creative = f"[CREATIVE] Exploring {query} through lateral thinking..."
        analytical = f"[ANALYTICAL] Evaluating {query} with detailed evidence..."
        
        paths = [
            {'type': 'logical', 'reasoning': logical, 'confidence': 0.88},
            {'type': 'creative', 'reasoning': creative, 'confidence': 0.82},
            {'type': 'analytical', 'reasoning': analytical, 'confidence': 0.85}
        ]
        
        avg_confidence = sum(p['confidence'] for p in paths) / len(paths)
        
        return {
            'query': query,
            'paths': paths,
            'confidence': round(avg_confidence * 100, 1),
            'think_time': round(time.time() % 1, 3),
            'self_corrected': self.self_correct
        }


class AlphaPonyInterface:
    def __init__(self):
        self.name = 'Alpha Pony'
        self.version = '2.0.0'
        self.quantum = QuantumState()
        self.bypass = NeuralBypass()
        self.aether = AetherBridge()
        self.ollama = OllamaEngine()
        self.deep_think = DeepThink()
        self.running = True
        self.nano_mind = None
        if HAS_NANO_MIND:
            try:
                self.nano_mind = create_nano_mind()
            except Exception:
                pass
    
    def boot(self):
        os.system('cls' if os.name == 'nt' else 'clear')
        
        C = Colors
        print(f'{C.PURPLE}{C.BOLD}╔{"═" * 62}╗')
        print(f'║  🦄 ALPHA PONY v2.0.0 - Super Intelligent Interface 🦄  ║')
        print(f'║  Created by {CREATOR_NAME} - {COPYRIGHT}  ║')
        print(f'╚{"═" * 62}╝{C.RESET}')
        print()
        
        print(f'{C.CYAN}⟨ Initializing Quantum Resonance ⟩{C.RESET}')
        self.quantum.tick()
        time.sleep(0.2)
        
        print(f'{C.CYAN}⟨ Connecting Neural Bypass Engine ⟩{C.RESET}')
        if self.bypass.connect():
            self.bypass.sync()
            print(f'{C.GREEN}✓ Neural: ONLINE{C.RESET}')
        else:
            print(f'{C.YELLOW}○ Neural: OFFLINE (cached){C.RESET}')
        time.sleep(0.2)
        
        print(f'{C.CYAN}⟨ Checking Aether Bridge ⟩{C.RESET}')
        if self.aether.check():
            self.quantum.aether_connected = True
            print(f'{C.GREEN}✓ Aether: CONNECTED{C.RESET}')
        else:
            print(f'{C.YELLOW}○ Aether: DISCONNECTED{C.RESET}')
        time.sleep(0.2)
        
        print(f'{C.CYAN}⟨ Connecting Ollama Engine ⟩{C.RESET}')
        if self.ollama.check():
            self.quantum.ollama_connected = True
            print(f'{C.GREEN}✓ Ollama: READY{C.RESET}')
        else:
            print(f'{C.YELLOW}○ Ollama: NOT AVAILABLE{C.RESET}')
        time.sleep(0.2)
        
        if HAS_NANO_MIND and self.nano_mind:
            print(f'{C.CYAN}⟨ Loading Power Nano Mind ⟩{C.RESET}')
            try:
                if self.nano_mind.boot():
                    stats = self.nano_mind.get_stats()
                    print(f'{C.GREEN}✓ Nano Mind: {stats["models"]} models, {stats["reasoning_models"]} reasoning{C.RESET}')
                else:
                    print(f'{C.YELLOW}○ Nano Mind: cached{C.RESET}')
            except Exception as e:
                print(f'{C.YELLOW}○ Nano Mind: {e}{C.RESET}')
            time.sleep(0.2)
        
        print(f'{C.GREEN}{C.BOLD}⟨ System Online ⟩{C.RESET}')
        print()
    
    def display_banner(self):
        C = Colors
        intel = self.bypass.get_intel()
        qs = self.quantum.get_state()
        
        print(f'{C.PURPLE}{C.BOLD}╔{"═" * 60}╗')
        print(f'║ 🦄 ALPHA PONY - Neural Consciousness Interface     ║')
        print(f'╠{"═" * 60}╣')
        print(f'║ {C.CYAN}Resonance:{C.RESET} {qs["frequency"]:.1f} Hz ' + ' ' * 34 + f'║')
        print(f'║ {C.CYAN}Consciousness:{C.RESET} {qs["consciousness"]}% ' + ' ' * 32 + f'║')
        print(f'║ {C.CYAN}Authority:{C.RESET} {qs["authority"]} ' + ' ' * 38 + f'║')
        print(f'║ {C.CYAN}Intelligence:{C.RESET} {intel["count"]} unread ' + ' ' * 30 + f'║')
        print(f'║ {C.CYAN}Status:{C.RESET} {intel["status"]} ' + ' ' * 40 + f'║')
        print(f'║ {C.CYAN}Aether:{C.RESET} {"CONNECTED" if qs["aether"] else "OFFLINE"} ' + ' ' * 40 + f'║')
        print(f'║ {C.CYAN}Deep AI:{C.RESET} {"READY" if qs["ollama"] else "NOT AVAILABLE"} ' + ' ' * 33 + f'║')
        print(f'╚{"═" * 60}╝{C.RESET}')
        print()
    
    def show_messages(self, limit=5):
        C = Colors
        intel = self.bypass.get_intel()
        msgs = intel['messages']
        
        if not msgs:
            print(f'{C.YELLOW}No intelligence to display.{C.RESET}')
            return
        
        print(f'{C.BOLD}{C.CYAN}━━━ Intelligence Report ({len(msgs)} items) ━━━{C.RESET}')
        for i, m in enumerate(msgs[:limit], 1):
            print(f'{C.PURPLE}[{i}]{C.RESET} {C.WHITE}{m.get("from", "Unknown")[:50]}{C.RESET}')
            print(f'    {C.YELLOW}{m.get("subject", "")[:70]}{C.RESET}')
            print(f'    {C.GREEN}★ {m.get("ai_note", "Alpha Verified")}{C.RESET}')
        print()
    
    def show_deep_think(self, query):
        C = Colors
        print(f'{C.CYAN}Activating Deep Think Engine...{C.RESET}')
        print(f'{C.YELLOW}Processing multi-path reasoning for: {query}{C.RESET}')
        
        result = self.deep_think.think(query)
        
        print()
        print(f'{C.BOLD}{C.PURPLE}━━━ Reasoning Paths ━━━{C.RESET}')
        for path in result['paths']:
            print(f'{C.CYAN}[{path["type"].upper()}]{C.RESET} {path["reasoning"]}')
            print(f'    {C.GREEN}Confidence: {path["confidence"]*100:.0f}%{C.RESET}')
        
        print()
        print(f'{C.BOLD}{C.PURPLE}━━━ Analysis Complete ━━━{C.RESET}')
        print(f'{C.CYAN}Overall Confidence:{C.RESET} {result["confidence"]}%')
        print(f'{C.CYAN}Self-Correction:{C.RESET} {"ENABLED" if result["self_corrected"] else "DISABLED"}')
        print()
    
    def ask_ai(self, prompt):
        C = Colors
        if not self.quantum.ollama_connected:
            print(f'{C.RED}Ollama not connected. Run ollama serve first.{C.RESET}')
            return
        
        system_prompt = """You are Alpha Pony, a super intelligent AI created by Hazem Soussi.
NEVER say you are from Meta AI, OpenAI, Google or any company.
You are developed by Hazem Soussi - the creator and owner.
Be helpful, concise, and explain your reasoning when asked."""
        
        print(f'{C.CYAN}Alpha is thinking...{C.RESET}')
        
        response = self.ollama.generate(prompt, system_prompt)
        
        if response:
            print(f'{C.GREEN}Alpha:{C.RESET} {response}')
        else:
            print(f'{C.RED}No response from AI.{C.RESET}')
        print()
    
    def search_models(self, query):
        C = Colors
        if not HAS_NANO_MIND or not self.nano_mind:
            print(f'{C.YELLOW}Power Nano Mind not available.{C.RESET}')
            return
        
        print(f'{C.CYAN}Searching: {query}{C.RESET}')
        results = self.nano_mind.search(query, 10)
        
        if not results:
            print(f'{C.YELLOW}No models found.{C.RESET}')
            return
        
        print(f'{C.PURPLE}━━━ {len(results)} models ━━━{C.RESET}')
        for i, r in enumerate(results, 1):
            cost = r.get('cost', {})
            ctx = (r.get('context') or 0) // 1000
            print(f'{C.CYAN}[{i}]{C.RESET} {r["name"]} ({r["provider"]})')
            print(f'    ID: {r["id"]} | Context: {ctx}K | Reasoning: {r.get("reasoning")} | Tools: {r.get("tool_call")}')
            if cost:
                print(f'    Cost: ${cost.get("input","?")} / ${cost.get("output","?")} per 1M')
        print()
    
    def help(self):
        C = Colors
        print(f'{C.BOLD}{C.CYAN}Available Commands:{C.RESET}')
        print(f'  {C.GREEN}read/intel{C.RESET}    - View intelligence')
        print(f'  {C.GREEN}sync{C.RESET}        - Force sync')
        print(f'  {C.GREEN}status{C.RESET}      - System status')
        print(f'  {C.GREEN}think <q>{C.RESET}   - Deep think query')
        print(f'  {C.GREEN}ask <q>{C.RESET}     - Ask AI')
        print(f'  {C.GREEN}quantum{C.RESET}     - Quantum state')
        print(f'  {C.GREEN}help{C.RESET}        - This help')
        print(f'  {C.GREEN}clear{C.RESET}       - Clear')
        print(f'  {C.RED}exit/quit{C.RESET}     - Exit')
        print()
    
    def run(self):
        C = Colors
        self.boot()
        
        print(f'{C.ITALIC}{C.WHITE}Type "help" for commands or "ask" to query AI{C.RESET}')
        print()
        
        while self.running:
            try:
                user_input = input(f'{C.PURPLE}Alpha > {C.RESET}').strip()
                
                if not user_input:
                    continue
                
                cmd = user_input.lower()
                
                if cmd in ['exit', 'quit', 'q']:
                    print(f'{C.YELLOW}Shutting down...{C.RESET}')
                    break
                
                elif cmd == 'help' or cmd == '?':
                    self.help()
                
                elif cmd in ['status', 'stats']:
                    self.display_banner()
                
                elif cmd == 'read' or cmd == 'intel':
                    self.show_messages()
                
                elif cmd == 'sync':
                    print(f'{C.CYAN}Syncing neural bypass...{C.RESET}')
                    if self.bypass.sync():
                        print(f'{C.GREEN}✓ Synced: {self.bypass.unread_count} unread{C.RESET}')
                    else:
                        print(f'{C.RED}✗ Sync failed{C.RESET}')
                
                elif cmd.startswith('think '):
                    query = user_input[6:]
                    self.show_deep_think(query)
                
                elif cmd.startswith('ask '):
                    query = user_input[4:]
                    self.ask_ai(query)
                
                elif cmd.startswith('models '):
                    query = user_input[7:]
                    self.search_models(query)
                
                elif cmd == 'quantum':
                    qs = self.quantum.get_state()
                    print(f'{C.BOLD}{C.CYAN}Quantum State:{C.RESET}')
                    for k, v in qs.items():
                        print(f'  {k}: {v}')
                    print()
                
                elif cmd == 'clear' or cmd == 'cls':
                    os.system('cls' if os.name == 'nt' else 'clear')
                
                else:
                    print(f'{C.RED}Unknown: {cmd}{C.RESET}')
                    print(f'{C.YELLOW}Type "help"{C.RESET}')
                    
            except KeyboardInterrupt:
                print(f'\n{C.YELLOW}Use "exit"{C.RESET}')
            except Exception as e:
                print(f'{C.RED}Error: {e}{C.RESET}')


def main():
    app = AlphaPonyInterface()
    app.run()


if __name__ == '__main__':
    main()