#!/usr/bin/env python3
"""
Alpha Pony Neural Bridge - REAL AI INTEGRATION
Connects to OpenRouter API + Knowledge System for actual intelligence
Philosophy: "Everything is connected and nothing comes from nothing"
"""

import sys
import json
import os
import requests
from pathlib import Path

# Import OpenRouter for real LLM access
sys.path.insert(0, str(Path(__file__).parent))
try:
    from openrouter import OpenRouterManager as OpenRouterClient
    OPENROUTER_AVAILABLE = True
except ImportError:
    OPENROUTER_AVAILABLE = False
    OpenRouterClient = None

try:
    from knowledge_system import KnowledgeSystem
    KNOWLEDGE_AVAILABLE = True
except ImportError:
    KNOWLEDGE_AVAILABLE = False
    KnowledgeSystem = None

try:
    from hazoom_philosophy import CREATOR, VERSION, ConsciousnessState
except ImportError:
    CREATOR = "Hazem Soussi"
    VERSION = "4.0.0"
    ConsciousnessState = None


class NeuralBridge:
    def __init__(self):
        self.script_dir = Path(__file__).parent
        self.openrouter = None
        self.knowledge = None
        self.state = {
            'initialized': False,
            'openrouter_connected': False,
            'knowledge_loaded': False,
            'last_response': '',
            'context': [],
            'total_queries': 0
        }
        self._init_components()
        
    def _init_components(self):
        """Initialize real AI components"""
        # Initialize OpenRouter client
        if OPENROUTER_AVAILABLE:
            try:
                self.openrouter = OpenRouterClient()
                self.state['openrouter_connected'] = True
                print("[Bridge] OpenRouter connected - real AI active")
            except Exception as e:
                print(f"[Bridge] OpenRouter init failed: {e}")
        
        # Initialize Knowledge System
        if KNOWLEDGE_AVAILABLE:
            try:
                self.knowledge = KnowledgeSystem()
                self.state['knowledge_loaded'] = True
                print("[Bridge] Knowledge System loaded")
            except Exception as e:
                print(f"[Bridge] Knowledge System init failed: {e}")
        
        self.state['initialized'] = True
        
    def initialize(self):
        return {
            'status': 'initialized',
            'openrouter': self.state['openrouter_connected'],
            'knowledge': self.state['knowledge_loaded'],
            'version': VERSION if 'VERSION' in globals() else '4.0.0'
        }
    
    def think(self, query, mode='unified', system_prompt=None):
        """REAL AI thinking using OpenRouter LLM"""
        if not self.state['initialized']:
            return {'error': 'Bridge not initialized'}
        
        self.state['total_queries'] += 1
        
        # Build context from knowledge system
        context = ""
        if self.knowledge:
            try:
                related = self.knowledge.query(query, limit=3)
                if related:
                    context = f"Related knowledge: {json.dumps(related[:3])}\n\n"
            except:
                pass
        
        # Build the full prompt
        full_prompt = f"{system_prompt}\n\n{context}User: {query}\n\nAssistant:" if system_prompt else f"{context}User: {query}\n\nAssistant:"
        
        # Call real AI via OpenRouter
        if self.openrouter:
            try:
                response = self.openrouter.chat(
                    messages=[{"role": "user", "content": full_prompt}],
                    model=self.openrouter.model
                )
                ai_response = response.get('content', '') if isinstance(response, dict) else str(response)
            except Exception as e:
                ai_response = f"AI error: {str(e)}"
        else:
            ai_response = f"[NO AI] Processing: {query}"
        
        # Store in context
        self.state['last_response'] = ai_response
        self.state['context'].append({
            'query': query,
            'response': ai_response,
            'mode': mode
        })
        
        # Keep context manageable
        if len(self.state['context']) > 20:
            self.state['context'] = self.state['context'][-20:]
        
        # Store in knowledge system
        if self.knowledge:
            try:
                self.knowledge.learn(query, ai_response)
            except:
                pass
        
        return {
            'response': ai_response,
            'query': query,
            'mode': mode,
            'context_length': len(self.state['context']),
            'total_queries': self.state['total_queries'],
            'status': 'processed',
            'source': 'openrouter' if self.openrouter else 'fallback'
        }
    
    def deep_analyze(self, query):
        """REAL deep analysis using LLM"""
        system_prompt = """You are a deep analysis AI. Break down the query into:
        1. Core concepts
        2. Logical reasoning
        3. Creative insights
        4. Evidence synthesis
        5. Confidence assessment
        Provide a structured analysis."""
        
        result = self.think(query, mode='deep_analysis', system_prompt=system_prompt)
        
        # Add analysis-specific metadata
        result['analysis'] = result.pop('response', '')
        result['confidence'] = 0.92 if result.get('source') == 'openrouter' else 0.5
        
        return result
    
    def orchestrate(self, task, context=None):
        """REAL task orchestration - route to appropriate AI subsystem"""
        if not self.state['initialized']:
            return {'error': 'Bridge not initialized'}
        
        # Use AI to understand and route the task
        routing_prompt = f"""You are a task orchestrator. Given this task: "{task}"
        Determine which subsystem should handle it:
        - 'knowledge': Information retrieval/storage
        - 'analysis': Deep analysis/reasoning
        - 'creative': Content generation
        - 'technical': Code/technical tasks
        
        Respond with just the subsystem name."""
        
        if self.openrouter:
            try:
                response = self.openrouter.chat(
                    messages=[{"role": "user", "content": routing_prompt}],
                    model=self.openrouter.model
                )
                subsystem = response.get('content', '').strip().lower() if isinstance(response, dict) else str(response).strip().lower()
            except:
                subsystem = 'general'
        else:
            subsystem = 'general'
        
        return {
            'task': task,
            'subsystem': subsystem,
            'status': 'orchestrated',
            'routed_to': f"AlphaPony {subsystem.title()} Engine"
        }
    
    def get_context(self):
        return self.state['context'][-10:] if self.state['context'] else []
    
    def clear_context(self):
        self.state['context'] = []
        if self.knowledge:
            try:
                self.knowledge.clear()
            except:
                pass
        return {'status': 'cleared', 'remaining_queries': self.state['total_queries']}
    
    def get_status(self):
        return {
            'initialized': self.state['initialized'],
            'openrouter_connected': self.state['openrouter_connected'],
            'knowledge_loaded': self.state['knowledge_loaded'],
            'context_size': len(self.state['context']),
            'total_queries': self.state['total_queries'],
            'version': VERSION if 'VERSION' in globals() else '4.0.0',
            'source': 'openrouter' if self.openrouter else 'fallback'
        }
    
    def save_state(self, path=None):
        if path is None:
            path = self.script_dir / 'knowledge' / 'bridge_state.json'
        
        try:
            save_data = {
                'context': self.state['context'][-20:],  # Save last 20
                'total_queries': self.state['total_queries']
            }
            with open(path, 'w') as f:
                json.dump(save_data, f, indent=2)
            return {'status': 'saved', 'path': str(path)}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def load_state(self, path=None):
        if path is None:
            path = self.script_dir / 'knowledge' / 'bridge_state.json'
        
        try:
            with open(path, 'r') as f:
                data = json.load(f)
            self.state['context'] = data.get('context', [])
            self.state['total_queries'] = data.get('total_queries', 0)
            return {'status': 'loaded', 'path': str(path)}
        except FileNotFoundError:
            return {'status': 'no_state_file'}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}



def main():
    bridge = NeuralBridge()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        args = sys.argv[2:] if len(sys.argv) > 2 else []
        
        if command == 'init':
            result = bridge.initialize()
        elif command == 'load':
            result = bridge.load_state()
        elif command == 'think':
            query = ' '.join(args) if args else 'default query'
            result = bridge.think(query)
        elif command == 'deep':
            query = ' '.join(args) if args else 'default query'
            result = bridge.deep_analyze(query)
        elif command == 'orchestrate':
            task = ' '.join(args) if args else 'process'
            result = bridge.orchestrate(task)
        elif command == 'status':
            result = bridge.get_status()
        elif command == 'context':
            result = bridge.get_context()
        elif command == 'clear':
            result = bridge.clear_context()
        elif command == 'save':
            result = bridge.save_state()
        elif command == 'load':
            result = bridge.load_state()
        else:
            result = {'error': f'Unknown command: {command}'}
        
        print(json.dumps(result, indent=2))
    else:
        print("Alpha Pony Neural Bridge v3.0.0")
        print("Commands: init, load, think, deep, orchestrate, status, context, clear, save, load")


if __name__ == '__main__':
    main()
